begin;

insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin-policy-fixture@example.com',
    '',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'user-policy-fixture@example.com',
    '',
    now(),
    now()
  );

insert into public.admin_users (user_id)
values ('00000000-0000-4000-8000-000000000001');

select set_config(
  'test.product_manager_profile_id',
  (select id::text from public.resume_profiles where slug = 'product-manager'),
  true
);

update public.resume_profiles
set is_active = (slug = 'product-operations');

with published_revision as (
  insert into public.resume_revisions (
    profile_id,
    status,
    parse_status,
    identity,
    published_at
  )
  select
    id,
    'published',
    'ready',
    '{"name":"Fixture","email":"fixture@example.com","targetRole":"产品运营"}'::jsonb,
    now()
  from public.resume_profiles
  where slug = 'product-operations'
  returning id
), archived_revision as (
  insert into public.resume_revisions (
    profile_id,
    status,
    parse_status,
    identity
  )
  select
    id,
    'archived',
    'ready',
    '{"name":"Archived","email":"archived@example.com","targetRole":"产品运营"}'::jsonb
  from public.resume_profiles
  where slug = 'product-operations'
  returning id
), published_section as (
  insert into public.resume_sections (revision_id, kind, summary, position)
  select id, 'internships', '公开实习简介。', 0
  from published_revision
  returning id
)
insert into public.resume_entries (
  section_id,
  title,
  wheel_label,
  content,
  position
)
select
  id,
  '公开岗位',
  'AI 产品经理',
  '{"bullets":["公开内容。"],"metrics":[]}'::jsonb,
  0
from published_section;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  active_profiles integer;
  published_revisions integer;
  visible_sections integer;
  visible_entries integer;
  published_appearance integer;
begin
  select count(*) into active_profiles from public.resume_profiles;
  select count(*) into published_revisions from public.resume_revisions;
  select count(*) into visible_sections from public.resume_sections;
  select count(*) into visible_entries from public.resume_entries;
  select count(*) into published_appearance from public.appearance_settings;

  if active_profiles <> 1
    or published_revisions <> 1
    or visible_sections <> 1
    or visible_entries <> 1
    or published_appearance <> 1 then
    raise exception 'anonymous policy returned unexpected row counts';
  end if;

  if has_table_privilege('anon', 'public.admin_users', 'select')
    or has_table_privilege('anon', 'public.resume_files', 'select') then
    raise exception 'anonymous role can read private tables';
  end if;
end;
$$;

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
begin
  begin
    insert into public.resume_revisions (profile_id, status)
    values (current_setting('test.product_manager_profile_id')::bigint, 'draft');
    raise exception 'non-admin insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

do $$
declare
  draft_id bigint;
  affected integer;
begin
  insert into public.resume_revisions (profile_id, status, created_by)
  select id, 'draft', (select auth.uid())
  from public.resume_profiles
  where slug = 'product-manager'
  returning id into draft_id;

  update public.resume_revisions
  set parse_status = 'parsed'
  where id = draft_id;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'admin update was not applied';
  end if;

  delete from public.resume_revisions where id = draft_id;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'admin delete was not applied';
  end if;
end;
$$;

reset role;
rollback;

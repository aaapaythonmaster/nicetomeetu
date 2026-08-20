alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;
alter table public.resume_profiles enable row level security;
alter table public.resume_profiles force row level security;
alter table public.resume_revisions enable row level security;
alter table public.resume_revisions force row level security;
alter table public.resume_sections enable row level security;
alter table public.resume_sections force row level security;
alter table public.resume_entries enable row level security;
alter table public.resume_entries force row level security;
alter table public.resume_files enable row level security;
alter table public.resume_files force row level security;
alter table public.parse_issues enable row level security;
alter table public.parse_issues force row level security;
alter table public.appearance_settings enable row level security;
alter table public.appearance_settings force row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.resume_profiles from anon, authenticated;
revoke all on table public.resume_revisions from anon, authenticated;
revoke all on table public.resume_sections from anon, authenticated;
revoke all on table public.resume_entries from anon, authenticated;
revoke all on table public.resume_files from anon, authenticated;
revoke all on table public.parse_issues from anon, authenticated;
revoke all on table public.appearance_settings from anon, authenticated;

grant select on table public.resume_profiles to anon;
grant select on table public.resume_revisions to anon;
grant select on table public.resume_sections to anon;
grant select on table public.resume_entries to anon;
grant select on table public.appearance_settings to anon;

grant select on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.resume_profiles to authenticated;
grant select, insert, update, delete on table public.resume_revisions to authenticated;
grant select, insert, update, delete on table public.resume_sections to authenticated;
grant select, insert, update, delete on table public.resume_entries to authenticated;
grant select, insert, update, delete on table public.resume_files to authenticated;
grant select, insert, update, delete on table public.parse_issues to authenticated;
grant select, insert, update, delete on table public.appearance_settings to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all on table public.admin_users to service_role;
grant all on table public.resume_profiles to service_role;
grant all on table public.resume_revisions to service_role;
grant all on table public.resume_sections to service_role;
grant all on table public.resume_entries to service_role;
grant all on table public.resume_files to service_role;
grant all on table public.parse_issues to service_role;
grant all on table public.appearance_settings to service_role;
grant usage, select on all sequences in schema public to service_role;

create policy "admin users can read own allowlist row"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "anonymous users can read active profile"
on public.resume_profiles
for select
to anon
using (is_active);

create policy "admins can manage resume profiles"
on public.resume_profiles
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "anonymous users can read active published revision"
on public.resume_revisions
for select
to anon
using (
  status = 'published'
  and exists (
    select 1 from public.resume_profiles
    where resume_profiles.id = resume_revisions.profile_id
      and resume_profiles.is_active
  )
);

create policy "admins can manage resume revisions"
on public.resume_revisions
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "anonymous users can read visible published sections"
on public.resume_sections
for select
to anon
using (
  visible
  and exists (
    select 1
    from public.resume_revisions
    join public.resume_profiles
      on resume_profiles.id = resume_revisions.profile_id
    where resume_revisions.id = resume_sections.revision_id
      and resume_revisions.status = 'published'
      and resume_profiles.is_active
  )
);

create policy "admins can manage resume sections"
on public.resume_sections
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "anonymous users can read visible published entries"
on public.resume_entries
for select
to anon
using (
  visible
  and exists (
    select 1
    from public.resume_sections
    join public.resume_revisions
      on resume_revisions.id = resume_sections.revision_id
    join public.resume_profiles
      on resume_profiles.id = resume_revisions.profile_id
    where resume_sections.id = resume_entries.section_id
      and resume_sections.visible
      and resume_revisions.status = 'published'
      and resume_profiles.is_active
  )
);

create policy "admins can manage resume entries"
on public.resume_entries
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "admins can manage resume files"
on public.resume_files
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "admins can manage parse issues"
on public.parse_issues
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "anonymous users can read published appearance"
on public.appearance_settings
for select
to anon
using (status = 'published');

create policy "admins can manage appearance settings"
on public.appearance_settings
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'resume-source',
    'resume-source',
    false,
    8388608,
    array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'resume-pdf',
    'resume-pdf',
    false,
    16777216,
    array['application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins can read resume storage"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('resume-source', 'resume-pdf')
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "admins can insert resume storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('resume-source', 'resume-pdf')
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "admins can update resume storage"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('resume-source', 'resume-pdf')
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  bucket_id in ('resume-source', 'resume-pdf')
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "admins can delete resume storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('resume-source', 'resume-pdf')
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

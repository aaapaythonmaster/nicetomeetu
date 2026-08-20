create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.resume_profiles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_profiles_slug_check
    check (slug in ('product-manager', 'product-operations'))
);

create unique index resume_profiles_one_active_idx
  on public.resume_profiles ((true))
  where is_active;

create table public.resume_revisions (
  id bigint generated always as identity primary key,
  profile_id bigint not null references public.resume_profiles (id) on delete cascade,
  status text not null,
  parse_status text not null default 'uploaded',
  identity jsonb not null default '{}'::jsonb,
  schema_version smallint not null default 1,
  phone_visible boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_revisions_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint resume_revisions_parse_status_check
    check (parse_status in ('uploaded', 'parsed', 'invalid', 'ready')),
  constraint resume_revisions_schema_version_check check (schema_version = 1),
  constraint resume_revisions_published_at_check
    check ((status = 'published' and published_at is not null) or status <> 'published')
);

create unique index resume_revisions_one_draft_per_profile_idx
  on public.resume_revisions (profile_id)
  where status = 'draft';

create unique index resume_revisions_one_published_per_profile_idx
  on public.resume_revisions (profile_id)
  where status = 'published';

create index resume_revisions_profile_created_idx
  on public.resume_revisions (profile_id, created_at desc);

create index resume_revisions_created_by_idx
  on public.resume_revisions (created_by)
  where created_by is not null;

create table public.resume_sections (
  id bigint generated always as identity primary key,
  revision_id bigint not null references public.resume_revisions (id) on delete cascade,
  kind text not null,
  summary text not null default '',
  position integer not null,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_sections_kind_check
    check (kind in ('education', 'internships', 'projects', 'skills', 'self-evaluation', 'campus')),
  constraint resume_sections_position_check check (position >= 0),
  constraint resume_sections_revision_kind_key unique (revision_id, kind),
  constraint resume_sections_revision_position_key unique (revision_id, position)
);

create index resume_sections_visible_order_idx
  on public.resume_sections (revision_id, position)
  where visible;

create table public.resume_entries (
  id bigint generated always as identity primary key,
  section_id bigint not null references public.resume_sections (id) on delete cascade,
  title text not null,
  wheel_label text not null,
  organization text,
  role text,
  start_date text,
  end_date text,
  content jsonb not null default '{"bullets":[],"metrics":[]}'::jsonb,
  content_schema_version smallint not null default 1,
  position integer not null,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_entries_title_check check (btrim(title) <> ''),
  constraint resume_entries_wheel_label_check check (btrim(wheel_label) <> ''),
  constraint resume_entries_content_schema_version_check check (content_schema_version = 1),
  constraint resume_entries_content_check
    check (jsonb_typeof(content) = 'object' and content ? 'bullets' and content ? 'metrics'),
  constraint resume_entries_position_check check (position >= 0),
  constraint resume_entries_section_position_key unique (section_id, position)
);

create index resume_entries_visible_order_idx
  on public.resume_entries (section_id, position)
  where visible;

create table public.resume_files (
  id bigint generated always as identity primary key,
  revision_id bigint not null references public.resume_revisions (id) on delete cascade,
  kind text not null,
  storage_bucket text not null,
  storage_path text not null,
  checksum_sha256 text,
  byte_size bigint,
  status text not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_files_kind_check check (kind in ('source-docx', 'pdf')),
  constraint resume_files_bucket_check check (storage_bucket in ('resume-source', 'resume-pdf')),
  constraint resume_files_kind_bucket_check
    check (
      (kind = 'source-docx' and storage_bucket = 'resume-source')
      or (kind = 'pdf' and storage_bucket = 'resume-pdf')
    ),
  constraint resume_files_storage_path_check check (btrim(storage_path) <> ''),
  constraint resume_files_checksum_check
    check (checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'),
  constraint resume_files_byte_size_check check (byte_size is null or byte_size >= 0),
  constraint resume_files_status_check check (status in ('uploaded', 'ready', 'failed')),
  constraint resume_files_revision_kind_key unique (revision_id, kind)
);

create table public.parse_issues (
  id bigint generated always as identity primary key,
  revision_id bigint not null references public.resume_revisions (id) on delete cascade,
  code text not null,
  severity text not null,
  message text not null,
  entry_indexes integer[],
  acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  constraint parse_issues_code_check
    check (code in ('missing-section', 'unknown-paragraph', 'duplicate-entry', 'invalid-date')),
  constraint parse_issues_severity_check check (severity in ('warning', 'blocking')),
  constraint parse_issues_message_check check (btrim(message) <> '')
);

create index parse_issues_revision_status_idx
  on public.parse_issues (revision_id, severity, acknowledged);

create table public.appearance_settings (
  id bigint generated always as identity primary key,
  status text not null,
  settings jsonb not null,
  schema_version smallint not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appearance_settings_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint appearance_settings_object_check check (jsonb_typeof(settings) = 'object'),
  constraint appearance_settings_schema_version_check check (schema_version = 1),
  constraint appearance_settings_published_at_check
    check ((status = 'published' and published_at is not null) or status <> 'published')
);

create unique index appearance_settings_one_draft_idx
  on public.appearance_settings ((true))
  where status = 'draft';

create unique index appearance_settings_one_published_idx
  on public.appearance_settings ((true))
  where status = 'published';

create index appearance_settings_created_by_idx
  on public.appearance_settings (created_by)
  where created_by is not null;

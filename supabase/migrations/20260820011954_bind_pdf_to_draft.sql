alter table public.resume_revisions
  add column content_version bigint not null default 1;

alter table public.resume_revisions
  add constraint resume_revisions_content_version_check
  check (content_version > 0);

alter table public.resume_files
  add column generated_from_version bigint;

alter table public.resume_files
  add constraint resume_files_pdf_source_version_check
  check (
    (kind = 'pdf' and status = 'ready' and generated_from_version is not null)
    or (kind = 'pdf' and status <> 'ready')
    or (kind <> 'pdf' and generated_from_version is null)
  );

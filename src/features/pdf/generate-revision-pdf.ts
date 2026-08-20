import "server-only";

import { createHash } from "node:crypto";

import { renderResumePdf } from "./render-pdf";
import { parsedResumeSchema, profileSlugSchema, type ProfileSlug } from "@/src/features/resume/contracts";
import type { ResumeEditorData } from "@/src/features/resume/queries";
import { getDatabaseClient } from "@/src/lib/postgres";
import { createAdminClient } from "@/src/lib/supabase/admin";

function arrays(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return { bullets: [], metrics: [] };
  const record = content as Record<string, unknown>;
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return { bullets: strings(record.bullets), metrics: strings(record.metrics) };
}

export async function loadDraftForPdf(input: { profile: ProfileSlug; revisionId: number; userId: string }): Promise<{ data: ResumeEditorData; sourceVersion: string }> {
  const profile = profileSlugSchema.parse(input.profile);
  const sql = getDatabaseClient();
  const revisions = await sql<{ id: number; identity: unknown; phone_visible: boolean; parse_status: string; content_version: string; allowed: boolean }[]>`
    select r.id, r.identity, r.phone_visible, r.parse_status, r.content_version,
      exists(select 1 from public.admin_users where user_id = ${input.userId}) as allowed
    from public.resume_revisions r join public.resume_profiles p on p.id = r.profile_id
    where r.id = ${input.revisionId} and r.status = 'draft' and p.slug = ${profile}
  `;
  const revision = revisions[0];
  if (!revision?.allowed) throw new Error("未找到可生成 PDF 的草稿。");
  const sections = await sql<{ id: number; kind: string; summary: string; position: number; visible: boolean }[]>`
    select id, kind, summary, position, visible from public.resume_sections where revision_id = ${input.revisionId} order by position
  `;
  const sectionIds = sections.map((section) => section.id);
  const entries = sectionIds.length ? await sql<{ id: number; section_id: number; title: string; wheel_label: string; organization: string | null; role: string | null; start_date: string | null; end_date: string | null; content: unknown; position: number; visible: boolean }[]>`
    select id, section_id, title, wheel_label, organization, role, start_date, end_date, content, position, visible
    from public.resume_entries where section_id in ${sql(sectionIds)} order by position
  ` : [];
  return { sourceVersion: revision.content_version, data: {
    revisionId: revision.id, profile, identity: parsedResumeSchema.shape.identity.parse(revision.identity),
    phoneVisible: revision.phone_visible, parseStatus: revision.parse_status,
    sections: sections.map((section) => ({ ...section, entries: entries.filter((entry) => entry.section_id === section.id).map((entry) => ({
      id: entry.id, title: entry.title, wheelLabel: entry.wheel_label, organization: entry.organization ?? undefined,
      role: entry.role ?? undefined, startDate: entry.start_date ?? undefined, endDate: entry.end_date ?? undefined,
      ...arrays(entry.content), position: entry.position, visible: entry.visible,
    })) })), issues: [],
  } };
}

export async function generateRevisionPdf(input: { profile: ProfileSlug; revisionId: number; userId: string }) {
  const { data, sourceVersion } = await loadDraftForPdf(input);
  const buffer = await renderResumePdf(data);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const path = `${input.profile}/${input.revisionId}/${checksum}.pdf`;
  const storage = createAdminClient().storage.from("resume-pdf");
  const { error: uploadError } = await storage.upload(path, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`保存 PDF 失败: ${uploadError.message}`);
  const sql = getDatabaseClient();
  await sql`
    insert into public.resume_files (revision_id, kind, storage_bucket, storage_path, checksum_sha256, byte_size, status, error_message, generated_from_version)
    values (${input.revisionId}, 'pdf', 'resume-pdf', ${path}, ${checksum}, ${buffer.byteLength}, 'ready', null, ${sourceVersion})
    on conflict (revision_id, kind) do update set storage_path = excluded.storage_path, checksum_sha256 = excluded.checksum_sha256, byte_size = excluded.byte_size, status = 'ready', error_message = null, generated_from_version = excluded.generated_from_version, updated_at = now()
  `;
  return { path, byteSize: buffer.byteLength };
}

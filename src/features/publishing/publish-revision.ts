import "server-only";

import { profileSlugSchema, type ProfileSlug } from "@/src/features/resume/contracts";
import { getDatabaseClient } from "@/src/lib/postgres";

export interface PublishInspection {
  ownsDraft: boolean;
  blockingIssues: number;
  pdfReady: boolean;
  pdfMatchesDraft: boolean;
}
export interface RevisionPublishRepository {
  inspect(input: PublishRevisionInput): Promise<PublishInspection>;
  commit(input: PublishRevisionInput): Promise<void>;
}
export interface PublishRevisionInput { profile: ProfileSlug; revisionId: number; userId: string }

export async function publishRevisionWithRepository(input: PublishRevisionInput, repository: RevisionPublishRepository) {
  const value = { ...input, profile: profileSlugSchema.parse(input.profile) };
  if (!Number.isInteger(value.revisionId) || value.revisionId <= 0) throw new Error("简历版本无效。");
  const inspection = await repository.inspect(value);
  if (!inspection.ownsDraft) throw new Error("未找到属于该版本的可发布草稿。");
  if (inspection.blockingIssues > 0) throw new Error("仍有阻塞问题，暂时无法发布。");
  if (!inspection.pdfReady) throw new Error("请先生成可用的 PDF。");
  if (!inspection.pdfMatchesDraft) throw new Error("PDF 生成后草稿发生变化，请重新生成 PDF。");
  await repository.commit(value);
}

export const postgresRevisionPublishRepository: RevisionPublishRepository = {
  async inspect(input) {
    const sql = getDatabaseClient();
    const rows = await sql<{ owns_draft: boolean; blocking_issues: number; pdf_ready: boolean; pdf_matches_draft: boolean }[]>`
      select
        exists(select 1 from public.admin_users where user_id = ${input.userId})
          and exists(select 1 from public.resume_revisions r join public.resume_profiles p on p.id = r.profile_id where r.id = ${input.revisionId} and r.status = 'draft' and p.slug = ${input.profile}) as owns_draft,
        (select count(*)::int from public.parse_issues where revision_id = ${input.revisionId} and severity = 'blocking') as blocking_issues,
        exists(select 1 from public.resume_files where revision_id = ${input.revisionId} and kind = 'pdf' and status = 'ready') as pdf_ready,
        exists(
          select 1
          from public.resume_files f
          join public.resume_revisions r on r.id = f.revision_id
          where f.revision_id = ${input.revisionId}
            and f.kind = 'pdf'
            and f.status = 'ready'
            and f.generated_from_version = r.content_version
        ) as pdf_matches_draft
    `;
    const row = rows[0];
    return {
      ownsDraft: Boolean(row?.owns_draft),
      blockingIssues: row?.blocking_issues ?? 0,
      pdfReady: Boolean(row?.pdf_ready),
      pdfMatchesDraft: Boolean(row?.pdf_matches_draft),
    };
  },
  async commit(input) {
    const sql = getDatabaseClient();
    await sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(74638202)`;
      const rows = await transaction<{ profile_id: number; allowed: boolean }[]>`
        select r.profile_id, exists(select 1 from public.admin_users where user_id = ${input.userId}) as allowed
        from public.resume_revisions r join public.resume_profiles p on p.id = r.profile_id
        where r.id = ${input.revisionId} and r.status = 'draft' and p.slug = ${input.profile}
        for update of r, p
      `;
      const row = rows[0];
      if (!row?.allowed) throw new Error("草稿状态已变化或管理员无权发布。");
      const checks = await transaction<{ blocking: number; pdf_ready: boolean; pdf_matches_draft: boolean }[]>`
        select
          (select count(*)::int from public.parse_issues where revision_id = ${input.revisionId} and severity = 'blocking') as blocking,
          exists(select 1 from public.resume_files where revision_id = ${input.revisionId} and kind = 'pdf' and status = 'ready') as pdf_ready,
          exists(
            select 1
            from public.resume_files f
            join public.resume_revisions r on r.id = f.revision_id
            where f.revision_id = ${input.revisionId}
              and f.kind = 'pdf'
              and f.status = 'ready'
              and f.generated_from_version = r.content_version
          ) as pdf_matches_draft
      `;
      if ((checks[0]?.blocking ?? 0) > 0) throw new Error("仍有阻塞问题，发布已取消。");
      if (!checks[0]?.pdf_ready) throw new Error("PDF 尚未准备完成，发布已取消。");
      if (!checks[0]?.pdf_matches_draft) throw new Error("PDF 与当前草稿不一致，发布已取消。");
      await transaction`update public.resume_revisions set status = 'archived', updated_at = now() where profile_id = ${row.profile_id} and status = 'published'`;
      await transaction`update public.resume_profiles set is_active = false where is_active`;
      await transaction`update public.resume_revisions set status = 'published', published_at = now(), updated_at = now() where id = ${input.revisionId}`;
      await transaction`update public.resume_profiles set is_active = true, updated_at = now() where id = ${row.profile_id}`;
    });
  },
};

export async function publishRevision(input: PublishRevisionInput) {
  return publishRevisionWithRepository(input, postgresRevisionPublishRepository);
}

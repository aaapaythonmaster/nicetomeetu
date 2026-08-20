import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { DraftReplacement } from "@/src/features/resume/upload";
import type { ProfileSlug } from "@/src/features/resume/contracts";
import { getDatabaseClient } from "@/src/lib/postgres";
import { createAdminClient } from "@/src/lib/supabase/admin";

export async function replaceDraft(
  input: DraftReplacement,
): Promise<{ revisionId: number }> {
  const sql = getDatabaseClient();
  const storage = createAdminClient().storage.from("resume-source");
  let uploadedPath: string | undefined;

  try {
    const revisionId = await sql.begin(async (transaction) => {
      const administrators = await transaction<{ allowed: boolean }[]>`
        select exists (
          select 1 from public.admin_users where user_id = ${input.userId}
        ) as allowed
      `;
      if (!administrators[0]?.allowed) {
        throw new Error("未授权的管理员请求。");
      }

      const profiles = await transaction<{ id: number }[]>`
        select id
        from public.resume_profiles
        where slug = ${input.profile}
        for update
      `;
      const profileId = profiles[0]?.id;
      if (!profileId) {
        throw new Error("未找到对应的简历版本。");
      }

      await transaction`
        update public.resume_revisions
        set status = 'archived', updated_at = now()
        where profile_id = ${profileId} and status = 'draft'
      `;

      const blocking = input.parsed.issues.some(
        (issue) => issue.severity === "blocking",
      );
      const revisions = await transaction<{ id: number }[]>`
        insert into public.resume_revisions (
          profile_id,
          status,
          parse_status,
          identity,
          schema_version,
          phone_visible,
          created_by
        )
        values (
          ${profileId},
          'draft',
          ${blocking ? "invalid" : "ready"},
          ${transaction.json(input.parsed.identity)},
          ${input.parsed.schemaVersion},
          false,
          ${input.userId}
        )
        returning id
      `;
      const revisionId = revisions[0]?.id;
      if (!revisionId) throw new Error("创建简历草稿失败。");

      uploadedPath = `${input.profile}/${revisionId}/source.docx`;
      const { error: uploadError } = await storage.upload(uploadedPath, input.buffer, {
        contentType: input.file.type,
        upsert: false,
      });
      if (uploadError) {
        throw new Error(`上传简历源文件失败: ${uploadError.message}`);
      }

      await transaction`
        insert into public.resume_files (
          revision_id,
          kind,
          storage_bucket,
          storage_path,
          checksum_sha256,
          byte_size,
          status
        )
        values (
          ${revisionId},
          'source-docx',
          'resume-source',
          ${uploadedPath},
          ${createHash("sha256").update(input.buffer).digest("hex")},
          ${input.buffer.byteLength},
          'ready'
        )
      `;

      for (const section of input.parsed.sections) {
        const sections = await transaction<{ id: number }[]>`
          insert into public.resume_sections (
            revision_id,
            kind,
            summary,
            position,
            visible
          )
          values (
            ${revisionId},
            ${section.kind},
            ${section.summary},
            ${section.position},
            true
          )
          returning id
        `;
        const sectionId = sections[0]?.id;
        if (!sectionId) throw new Error("创建简历板块失败。");

        for (const entry of section.entries) {
          await transaction`
            insert into public.resume_entries (
              section_id,
              title,
              wheel_label,
              organization,
              role,
              start_date,
              end_date,
              content,
              position,
              visible
            )
            values (
              ${sectionId},
              ${entry.title},
              ${entry.wheelLabel},
              ${entry.organization ?? null},
              ${entry.role ?? null},
              ${entry.startDate ?? null},
              ${entry.endDate ?? null},
              ${transaction.json({ bullets: entry.bullets, metrics: entry.metrics })},
              ${entry.position},
              ${entry.visible}
            )
          `;
        }
      }

      for (const issue of input.parsed.issues) {
        await transaction`
          insert into public.parse_issues (
            revision_id,
            code,
            severity,
            message,
            entry_indexes
          )
          values (
            ${revisionId},
            ${issue.code},
            ${issue.severity},
            ${issue.message},
            ${issue.entryIndexes ?? null}
          )
        `;
      }

      return revisionId;
    });

    return { revisionId };
  } catch (error) {
    if (uploadedPath) await storage.remove([uploadedPath]);
    throw error;
  }
}

export async function recordUploadFailure(input: {
  errorMessage: string;
  file: File;
  profile: ProfileSlug;
  userId: string;
}): Promise<void> {
  const sql = getDatabaseClient();
  await sql.begin(async (transaction) => {
    const rows = await transaction<{ profile_id: number; allowed: boolean }[]>`
      select
        resume_profiles.id as profile_id,
        exists (
          select 1 from public.admin_users where user_id = ${input.userId}
        ) as allowed
      from public.resume_profiles
      where slug = ${input.profile}
    `;
    const row = rows[0];
    if (!row?.allowed) throw new Error("未授权的管理员请求。");

    const revisions = await transaction<{ id: number }[]>`
      insert into public.resume_revisions (
        profile_id,
        status,
        parse_status,
        identity,
        created_by
      )
      values (
        ${row.profile_id},
        'archived',
        'invalid',
        '{}'::jsonb,
        ${input.userId}
      )
      returning id
    `;
    const revisionId = revisions[0]?.id;
    if (!revisionId) throw new Error("记录上传失败信息时出错。");

    await transaction`
      insert into public.resume_files (
        revision_id,
        kind,
        storage_bucket,
        storage_path,
        byte_size,
        status,
        error_message
      )
      values (
        ${revisionId},
        'source-docx',
        'resume-source',
        ${`${input.profile}/failed/${randomUUID()}/source.docx`},
        ${input.file.size},
        'failed',
        ${input.errorMessage.slice(0, 2000)}
      )
    `;
  });
}

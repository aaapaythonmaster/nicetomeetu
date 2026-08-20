"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/src/features/resume/auth";
import { getDatabaseClient } from "@/src/lib/postgres";
import { createServerClient } from "@/src/lib/supabase/server";
import { generateRevisionPdf } from "@/src/features/pdf/generate-revision-pdf";
import { profileSlugSchema } from "@/src/features/resume/contracts";
import { publishRevision } from "@/src/features/publishing/publish-revision";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const credentials = z
    .object({ email: z.email(), password: z.string().min(1) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!credentials.success) return { error: "请输入有效邮箱和密码。" };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) return { error: "邮箱或密码不正确。" };

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const editorEntrySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  wheelLabel: z.string().trim().min(1),
  organization: z.string().trim().optional(),
  role: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  bullets: z.array(z.string().trim().min(1)),
  metrics: z.array(z.string().trim().min(1)),
  position: z.number().int().nonnegative(),
  visible: z.boolean(),
});

const editorInputSchema = z.object({
  revisionId: z.number().int().positive(),
  profile: z.enum(["product-manager", "product-operations"]),
  identity: z.object({
    name: z.string().trim().min(1),
    email: z.email(),
    phone: z.string().trim().optional(),
    school: z.string().trim().optional(),
    targetRole: z.string().trim().min(1),
  }),
  phoneVisible: z.boolean(),
  sections: z.array(
    z.object({
      id: z.number().int().positive(),
      summary: z.string().trim(),
      position: z.number().int().nonnegative(),
      visible: z.boolean(),
      entries: z.array(editorEntrySchema),
    }),
  ),
  issues: z.array(
    z.object({ id: z.number().int().positive(), acknowledged: z.boolean() }),
  ),
});

export async function saveDraft(input: unknown): Promise<{ ok: true }> {
  await requireAdmin();
  const value = editorInputSchema.parse(input);
  const sql = getDatabaseClient();

  await sql.begin(async (transaction) => {
    const revisions = await transaction<{ id: number }[]>`
      select id
      from public.resume_revisions
      where id = ${value.revisionId} and status = 'draft'
      for update
    `;
    if (!revisions[0]) throw new Error("草稿已不存在或已发布。");

    const allowedSections = await transaction<{ id: number }[]>`
      select id from public.resume_sections where revision_id = ${value.revisionId}
    `;
    const allowedSectionIds = new Set(allowedSections.map((section) => section.id));
    if (value.sections.some((section) => !allowedSectionIds.has(section.id))) {
      throw new Error("草稿板块归属校验失败。");
    }

    const allowedEntries = await transaction<{ id: number }[]>`
      select resume_entries.id
      from public.resume_entries
      join public.resume_sections
        on resume_sections.id = resume_entries.section_id
      where resume_sections.revision_id = ${value.revisionId}
    `;
    const allowedEntryIds = new Set(allowedEntries.map((entry) => entry.id));
    if (
      value.sections.some((section) =>
        section.entries.some((entry) => !allowedEntryIds.has(entry.id)),
      )
    ) {
      throw new Error("草稿条目归属校验失败。");
    }

    await transaction`
      update public.resume_revisions
      set
        identity = ${transaction.json(value.identity)},
        phone_visible = ${value.phoneVisible},
        content_version = content_version + 1,
        updated_at = now()
      where id = ${value.revisionId}
    `;
    await transaction`
      update public.resume_sections
      set position = position + 10000
      where revision_id = ${value.revisionId}
    `;
    await transaction`
      update public.resume_entries
      set position = position + 10000
      where section_id in (
        select id from public.resume_sections where revision_id = ${value.revisionId}
      )
    `;

    for (const section of value.sections) {
      await transaction`
        update public.resume_sections
        set
          summary = ${section.summary},
          position = ${section.position},
          visible = ${section.visible},
          updated_at = now()
        where id = ${section.id} and revision_id = ${value.revisionId}
      `;
      for (const entry of section.entries) {
        await transaction`
          update public.resume_entries
          set
            title = ${entry.title},
            wheel_label = ${entry.wheelLabel},
            organization = ${entry.organization || null},
            role = ${entry.role || null},
            start_date = ${entry.startDate || null},
            end_date = ${entry.endDate || null},
            content = ${transaction.json({
              bullets: entry.bullets,
              metrics: entry.metrics,
            })},
            position = ${entry.position},
            visible = ${entry.visible},
            updated_at = now()
          where id = ${entry.id}
            and section_id = ${section.id}
        `;
      }
    }

    for (const issue of value.issues) {
      await transaction`
        update public.parse_issues
        set acknowledged = ${issue.acknowledged}
        where id = ${issue.id} and revision_id = ${value.revisionId}
      `;
    }
  });

  revalidatePath(`/admin/resumes/${value.profile}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function publishResumeAction(input: { profile: string; revisionId: number }) {
  const { userId } = await requireAdmin();
  const profile = profileSlugSchema.parse(input.profile);
  const revisionId = z.number().int().positive().parse(input.revisionId);
  await generateRevisionPdf({ profile, revisionId, userId });
  await publishRevision({ profile, revisionId, userId });
  updateTag("resume:published");
  revalidatePath("/"); revalidatePath("/admin"); revalidatePath(`/admin/resumes/${profile}`);
  return { ok: true };
}

export async function activatePublishedProfileAction(profileInput: string) {
  const { userId } = await requireAdmin();
  const profile = profileSlugSchema.parse(profileInput);
  const sql = getDatabaseClient();
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(74638202)`;
    const rows = await transaction<{ id: number; allowed: boolean; has_published: boolean }[]>`
      select p.id,
        exists(select 1 from public.admin_users where user_id = ${userId}) as allowed,
        exists(select 1 from public.resume_revisions r where r.profile_id = p.id and r.status = 'published') as has_published
      from public.resume_profiles p where p.slug = ${profile} for update
    `;
    const row = rows[0];
    if (!row?.allowed) throw new Error("未授权的管理员请求。");
    if (!row.has_published) throw new Error("该版本尚未发布。");
    await transaction`update public.resume_profiles set is_active = false where is_active`;
    await transaction`update public.resume_profiles set is_active = true, updated_at = now() where id = ${row.id}`;
  });
  updateTag("resume:published"); revalidatePath("/"); revalidatePath("/admin");
}

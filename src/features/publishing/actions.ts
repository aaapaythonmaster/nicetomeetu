"use server";

import { revalidatePath, updateTag } from "next/cache";

import { appearanceSettingsSchema, type AppearanceSettings } from "@/src/features/appearance/contracts";
import { getAppearanceDraft } from "@/src/features/appearance/queries";
import { requireAdmin } from "@/src/features/resume/auth";
import { getDatabaseClient } from "@/src/lib/postgres";

export interface AppearancePublishRepository {
  publishDraft(input: { settings: AppearanceSettings; userId: string }): Promise<{ id: number }>;
}

export async function publishAppearanceWithRepository(
  input: { settings: unknown; userId: string },
  repository: AppearancePublishRepository,
) {
  const settings = appearanceSettingsSchema.parse(input.settings);
  return repository.publishDraft({ settings, userId: input.userId });
}

const postgresAppearanceRepository: AppearancePublishRepository = {
  async publishDraft({ settings, userId }) {
    const sql = getDatabaseClient();
    return sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(74638201)`;
      const allowed = await transaction<{ allowed: boolean }[]>`
        select exists(select 1 from public.admin_users where user_id = ${userId}) as allowed
      `;
      if (!allowed[0]?.allowed) throw new Error("未授权的管理员请求。");
      const drafts = await transaction<{ id: number; settings: unknown }[]>`
        select id, settings from public.appearance_settings where status = 'draft' for update
      `;
      const draft = drafts[0];
      if (!draft) throw new Error("没有可发布的外观草稿。");
      const persistedSettings = appearanceSettingsSchema.parse(draft.settings);
      if (JSON.stringify(persistedSettings) !== JSON.stringify(settings)) throw new Error("外观草稿已变化，请刷新后重试。");
      await transaction`update public.appearance_settings set status = 'archived', updated_at = now() where status = 'published'`;
      const published = await transaction<{ id: number }[]>`
        update public.appearance_settings set status = 'published', published_at = now(), updated_at = now() where id = ${draft.id} returning id
      `;
      const id = published[0]?.id;
      if (!id) throw new Error("发布外观失败。");
      return { id };
    });
  },
};

export async function saveAppearanceDraftAction(settingsInput: AppearanceSettings) {
  const { userId } = await requireAdmin();
  const settings = appearanceSettingsSchema.parse(settingsInput);
  const sql = getDatabaseClient();
  await sql.begin(async (transaction) => {
    const allowed = await transaction<{ allowed: boolean }[]>`select exists(select 1 from public.admin_users where user_id = ${userId}) as allowed`;
    if (!allowed[0]?.allowed) throw new Error("未授权的管理员请求。");
    await transaction`
      insert into public.appearance_settings (status, settings, created_by)
      values ('draft', ${transaction.json(settings)}, ${userId})
      on conflict ((true)) where status = 'draft'
      do update set settings = excluded.settings, created_by = excluded.created_by, updated_at = now()
    `;
  });
  revalidatePath("/admin/appearance"); revalidatePath("/admin/appearance/preview");
  return { ok: true };
}

export async function publishAppearanceDraftAction() {
  const { userId } = await requireAdmin();
  const draft = await getAppearanceDraft();
  if (draft.status !== "draft") throw new Error("请先保存外观草稿。");
  const result = await publishAppearanceWithRepository({ settings: draft.settings, userId }, postgresAppearanceRepository);
  updateTag("appearance"); revalidatePath("/admin/appearance"); revalidatePath("/admin/appearance/preview"); revalidatePath("/");
  return result;
}

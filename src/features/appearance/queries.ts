import "server-only";

import { unstable_cache } from "next/cache";

import { appearanceSettingsSchema, DEFAULT_APPEARANCE, type AppearanceSettings } from "./contracts";
import { hasSupabasePublicConfig, requireAdmin } from "@/src/features/resume/auth";
import { createServerClient } from "@/src/lib/supabase/server";

export interface AppearanceRecord {
  id: number | null;
  status: "draft" | "published" | "default";
  settings: AppearanceSettings;
  updatedAt: string | null;
}

export async function getAppearanceDraft(): Promise<AppearanceRecord> {
  await requireAdmin();
  if (!hasSupabasePublicConfig()) {
    return { id: null, status: "default", settings: DEFAULT_APPEARANCE, updatedAt: null };
  }
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("appearance_settings")
    .select("id, status, settings, updated_at")
    .in("status", ["draft", "published"])
    .order("status", { ascending: true });
  if (error) throw error;
  const row = data?.find((item) => item.status === "draft") ?? data?.find((item) => item.status === "published");
  if (!row) return { id: null, status: "default", settings: DEFAULT_APPEARANCE, updatedAt: null };
  return { id: row.id, status: row.status as "draft" | "published", settings: appearanceSettingsSchema.parse(row.settings), updatedAt: row.updated_at };
}

const getCachedPublishedAppearance = unstable_cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("appearance_settings").select("settings").eq("status", "published").maybeSingle();
  if (error) throw error;
  return data ? appearanceSettingsSchema.parse(data.settings) : DEFAULT_APPEARANCE;
}, ["published-appearance"], { tags: ["appearance"] });

export async function getPublishedAppearance() {
  return getCachedPublishedAppearance();
}

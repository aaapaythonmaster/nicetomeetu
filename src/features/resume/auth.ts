import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createServerClient } from "@/src/lib/supabase/server";

export function hasSupabasePublicConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export const getAdminSession = cache(async (): Promise<{ userId: string } | null> => {
  if (process.env.NODE_ENV !== "production") {
    const requestHeaders = await headers();
    if (requestHeaders.get("x-e2e-admin-bypass") === "1") {
      return { userId: "00000000-0000-4000-8000-000000000001" };
    }
  }
  if (!hasSupabasePublicConfig()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
  if (error || !userId) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return admin ? { userId } : null;
});

export async function requireAdmin(): Promise<{ userId: string }> {
  const session = await getAdminSession();
  if (!session) throw new Error("未授权的管理员请求。");
  return session;
}

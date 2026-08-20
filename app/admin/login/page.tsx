import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession, hasSupabasePublicConfig } from "@/src/features/resume/auth";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#120f17]" />}>
      <AdminLogin />
    </Suspense>
  );
}

async function AdminLogin() {
  await connection();
  if (hasSupabasePublicConfig() && (await getAdminSession())) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-[#120f17] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Nicetomeetu</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">管理员登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          仅用于上传、校对和发布你的简历版本。
        </p>
        {!hasSupabasePublicConfig() ? (
          <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            本地尚未配置 Supabase 环境变量，连接项目后即可登录。
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}

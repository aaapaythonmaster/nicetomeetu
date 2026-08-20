import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PROFILE_LABELS } from "@/src/features/resume/fixtures";
import { activatePublishedProfileAction } from "@/src/features/resume/actions";
import { getAdminProfiles } from "@/src/features/resume/queries";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  await connection();
  const profiles = await getAdminProfiles();

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <div className="max-w-2xl">
        <p className="text-sm text-cyan-300">简历管理</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">选择要编辑的个人主页</h1>
        <p className="mt-4 leading-7 text-slate-400">
          两份简历分别上传和管理。发布前的修改只保存在草稿中。
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <section
            key={profile.slug}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.06]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-medium">{PROFILE_LABELS[profile.slug]}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {profile.draft
                    ? `草稿状态：${profile.draft.parseStatus}`
                    : "尚未上传草稿"}
                </p>
              </div>
              {profile.isActive ? (
                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-200">
                  当前对外版本
                </span>
              ) : null}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">
                {profile.published ? "已有发布版" : "尚未发布"}
              </span>
              <div className="flex items-center gap-3">
                {profile.published && !profile.isActive ? <form action={activatePublishedProfileAction.bind(null, profile.slug)}><button type="submit" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-300 hover:border-cyan-300/50 hover:text-white">设为对外版本</button></form> : null}
                <Link href={`/admin/resumes/${profile.slug}`} className="text-cyan-300 transition group-hover:translate-x-1">进入编辑 →</Link>
              </div>
            </div>
          </section>
        ))}
      </div>
      <Link href="/admin/appearance" className="mt-6 flex items-center justify-between rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.05] p-7 transition hover:border-cyan-300/50">
        <div><p className="text-sm text-cyan-300">全局设置</p><h2 className="mt-2 text-2xl font-medium">外观与动效参数</h2><p className="mt-2 text-sm text-slate-400">统一调整 ColorBends、DotField 和 OptionWheel。</p></div><span className="text-cyan-300">进入设置 →</span>
      </Link>
    </main>
  );
}

function DashboardFallback() {
  return <main className="mx-auto min-h-screen max-w-7xl px-8 py-12" />;
}

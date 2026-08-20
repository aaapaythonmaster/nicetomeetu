import { connection } from "next/server";
import { Suspense } from "react";

import { AppearanceEditor } from "@/components/admin/appearance-editor";
import { getAppearanceDraft } from "@/src/features/appearance/queries";

export default function AppearancePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#120f17]" />}><AppearanceContent /></Suspense>;
}

async function AppearanceContent() {
  await connection();
  const appearance = await getAppearanceDraft();
  return <main className="mx-auto max-w-[1500px] px-8 py-10">
    <div className="mb-10 max-w-3xl"><p className="text-sm text-cyan-300">外观系统</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">调整两层动效和经历滚轮</h1><p className="mt-4 leading-7 text-slate-400">所有数值先保存为草稿。发布后才会影响招聘方看到的页面。</p></div>
    <AppearanceEditor initialSettings={appearance.settings} sourceStatus={appearance.status} />
  </main>;
}

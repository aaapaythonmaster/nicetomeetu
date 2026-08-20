import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { OptionWheel } from "@/components/react-bits/option-wheel";
import { DynamicBackground } from "@/components/visual/dynamic-background";
import { getAppearanceDraft } from "@/src/features/appearance/queries";

export default function AppearancePreviewPage() {
  return <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#120f17]" />}><AppearancePreview /></Suspense>;
}

async function AppearancePreview() {
  await connection();
  const { settings } = await getAppearanceDraft();
  return <div className="fixed inset-0 z-50 h-screen bg-[#120f17] text-white">
    <DynamicBackground settings={settings}>
      <main className="grid h-screen grid-cols-[1.1fr_0.9fr] px-[7vw] py-[8vh]">
        <section className="flex flex-col justify-between border-r border-white/10 pr-[6vw]"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.3em]" style={{ color: settings.primaryColor }}>Nicetomeetu / Preview</p><Link href="/admin/appearance" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:text-white">退出预览</Link></div><div><p className="text-sm" style={{ color: settings.primaryColor }}>AI 产品与流程运营</p><h1 className="mt-5 max-w-3xl text-[clamp(3.5rem,5.4vw,5.4rem)] font-medium leading-[0.96] tracking-[-0.06em]"><span className="block">把复杂流程，</span><span className="block">变成可用的产品。</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">这里用于验证颜色、层次和运动节奏；正式内容将在公开主页阶段接入。</p></div><p className="text-xs text-slate-400">移动鼠标感受 ColorBends 与 DotField 的叠加反馈</p></section>
        <section className="relative"><OptionWheel {...settings.optionWheel} items={["实习经历", "项目经历", "校园经历", "技能"]} defaultSelected={0} ariaLabel="经历分类预览" side="right" textColor="#8b8792" activeColor={settings.primaryColor} /></section>
      </main>
    </DynamicBackground>
  </div>;
}

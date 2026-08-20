import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ProfileHeader } from "@/components/public/profile-header";
import { ResumeDetail } from "@/components/public/resume-detail";
import { DynamicBackground } from "@/components/visual/dynamic-background";
import { profileSlugSchema, sectionKindSchema } from "@/src/features/resume/contracts";
import { PUBLIC_SECTION_KINDS } from "@/src/features/resume/fixtures";
import { getDraftPreviewData } from "@/src/features/resume/preview";

export default function DraftDetailPreviewPage({ params, searchParams }: { params: Promise<{ profile: string; kind: string }>; searchParams: Promise<{ entry?: string }> }) {
  return <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#120f17]" />}><DraftDetailPreview params={params} searchParams={searchParams} /></Suspense>;
}

async function DraftDetailPreview({ params, searchParams }: { params: Promise<{ profile: string; kind: string }>; searchParams: Promise<{ entry?: string }> }) {
  await connection();
  const route = await params;
  const profileResult = profileSlugSchema.safeParse(route.profile);
  const kindResult = sectionKindSchema.safeParse(route.kind);
  if (!profileResult.success || !kindResult.success || !PUBLIC_SECTION_KINDS.includes(kindResult.data as (typeof PUBLIC_SECTION_KINDS)[number])) notFound();
  const data = await getDraftPreviewData(profileResult.data);
  if (!data) notFound();
  const section = data.sections.find((item) => item.kind === kindResult.data) ?? { kind: kindResult.data, summary: "该板块暂未公开内容。", position: 0, entries: [] };
  const { entry } = await searchParams;
  const initialEntry = /^\d+$/.test(entry ?? "") ? Number(entry) : 0;
  const homeHref = `/admin/preview/${profileResult.data}`;
  return <div className="fixed inset-0 z-50 overflow-auto bg-[#120f17] text-white"><DynamicBackground settings={data.appearance}>
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#120f17]/85 px-[5vw] py-3 backdrop-blur-xl"><p className="text-sm font-medium" style={{ color: data.appearance.primaryColor }}>草稿详情预览 · 不会影响公开主页</p><Link href={`/admin/resumes/${profileResult.data}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white">退出预览</Link></div>
    <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-[1600px] flex-col px-[5vw] py-8"><ProfileHeader data={data} homeHref={homeHref} /><ResumeDetail data={data} section={section} initialEntry={initialEntry} backHref={homeHref} backLabel="← 返回草稿预览" /></main>
  </DynamicBackground></div>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ProfileHeader } from "@/components/public/profile-header";
import { ResumeHome } from "@/components/public/resume-home";
import { DynamicBackground } from "@/components/visual/dynamic-background";
import { profileSlugSchema } from "@/src/features/resume/contracts";
import { getDraftPreviewData } from "@/src/features/resume/preview";

export default function ResumePreviewPage({ params }: { params: Promise<{ profile: string }> }) {
  return <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#120f17]" />}><ResumePreview params={params} /></Suspense>;
}

async function ResumePreview({ params }: { params: Promise<{ profile: string }> }) {
  await connection();
  const parsedProfile = profileSlugSchema.safeParse((await params).profile);
  if (!parsedProfile.success) notFound();
  const profile = parsedProfile.data;

  const data = await getDraftPreviewData(profile);

  if (!data) {
    return <main className="grid min-h-[calc(100vh-73px)] place-items-center px-8"><section className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center"><p className="text-sm text-cyan-300">草稿预览</p><h1 className="mt-3 text-3xl font-semibold">这一版还没有草稿</h1><p className="mt-4 leading-7 text-slate-400">先上传并解析简历，再回来检查公开效果。</p><Link className="mt-7 inline-flex rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950" href={`/admin/resumes/${profile}`}>返回上传简历</Link></section></main>;
  }

  return <div className="fixed inset-0 z-50 overflow-auto bg-[#120f17] text-white">
    <DynamicBackground settings={data.appearance}>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#120f17]/85 px-[5vw] py-3 backdrop-blur-xl">
        <p className="text-sm font-medium" style={{ color: data.appearance.primaryColor }}>草稿预览 · 不会影响公开主页</p>
        <Link href={`/admin/resumes/${profile}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white">退出预览</Link>
      </div>
      <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-[1600px] flex-col px-[5vw] py-8"><ProfileHeader data={data} homeHref={`/admin/preview/${profile}`} /><ResumeHome data={data} detailBasePath={`/admin/preview/${profile}`} /></main>
    </DynamicBackground>
  </div>;
}

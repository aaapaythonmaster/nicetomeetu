import { Suspense } from "react";

import { ProfileHeader } from "@/components/public/profile-header";
import { ResumeHome } from "@/components/public/resume-home";
import { DynamicBackground } from "@/components/visual/dynamic-background";
import { getPublishedSiteData } from "@/src/features/resume/queries";

export default function HomePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#120f17]" />}><PublishedHome /></Suspense>;
}

async function PublishedHome() {
  const data = await getPublishedSiteData();
  if (data) return <DynamicBackground settings={data.appearance}><main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-[5vw] py-8"><ProfileHeader data={data} /><ResumeHome data={data} /></main></DynamicBackground>;
  return (
    <main className="grid min-h-screen place-items-center bg-[#120f17] px-8 text-white">
      <section className="max-w-xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300">
          Nicetomeetu
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">个人主页尚未发布</h1>
        <p className="mt-5 text-base leading-7 text-white/60">
          完成简历校对并发布后，招聘方将在这里看到公开版本。
        </p>
      </section>
    </main>
  );
}

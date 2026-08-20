import { notFound } from "next/navigation";

import { DynamicBackground } from "@/components/visual/dynamic-background";
import { ProfileHeader } from "./profile-header";
import { ResumeDetail } from "./resume-detail";
import type { SectionKind } from "@/src/features/resume/contracts";
import { PUBLIC_SECTION_KINDS } from "@/src/features/resume/fixtures";
import { getPublishedSiteData } from "@/src/features/resume/queries";

export async function PublicDetailPage({ kind, entry }: { kind: SectionKind; entry?: string }) {
  const data = await getPublishedSiteData();
  if (!data) notFound();
  const section = data.sections.find((item) => item.kind === kind) ?? { kind, summary: "该板块暂未公开内容。", position: PUBLIC_SECTION_KINDS.indexOf(kind as (typeof PUBLIC_SECTION_KINDS)[number]), entries: [] };
  const initialEntry = /^\d+$/.test(entry ?? "") ? Number(entry) : 0;
  return <DynamicBackground settings={data.appearance}><main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-[5vw] py-8"><ProfileHeader data={data} /><ResumeDetail data={data} section={section} initialEntry={initialEntry} /></main></DynamicBackground>;
}

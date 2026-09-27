"use client";

import { useMemo, useState } from "react";

import { OptionWheel } from "@/components/react-bits/option-wheel";
import { SectionSummary } from "./section-summary";
import type { PublishedSiteData } from "@/src/features/resume/contracts";
import { PUBLIC_SECTION_KINDS, SECTION_LABELS } from "@/src/features/resume/fixtures";

export function ResumeHome({ data, detailBasePath }: { data: PublishedSiteData; detailBasePath?: string }) {
  const sections = useMemo(() => PUBLIC_SECTION_KINDS.map((kind, index) => data.sections.find((section) => section.kind === kind) ?? { kind, summary: "该板块暂未公开内容。", position: index, entries: [] }), [data.sections]);
  const internshipIndex = 0;
  const [selected, setSelected] = useState(internshipIndex);
  const section = sections[selected];
  return <div className="grid flex-1 grid-cols-[1.08fr_0.92fr] items-stretch pt-8">
    <section className="flex items-center pr-[6vw]"><SectionSummary section={section} detailHref={detailBasePath ? `${detailBasePath}/${section.kind}` : undefined} /></section>
    <section className="relative min-h-[620px]"><OptionWheel {...data.appearance.optionWheel} items={sections.map((item) => SECTION_LABELS[item.kind])} defaultSelected={internshipIndex} onChange={(index) => setSelected(index)} side="right" ariaLabel="简历经历分类" textColor="#8b8792" activeColor={data.appearance.primaryColor} /></section>
  </div>;
}

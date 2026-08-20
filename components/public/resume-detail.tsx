"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { OptionWheel } from "@/components/react-bits/option-wheel";
import type { PublishedSiteData } from "@/src/features/resume/contracts";
import { SECTION_LABELS } from "@/src/features/resume/fixtures";

export function ResumeDetail({ data, section, initialEntry = 0, backHref = "/", backLabel = "← 返回首页" }: { data: PublishedSiteData; section: PublishedSiteData["sections"][number]; initialEntry?: number; backHref?: string; backLabel?: string }) {
  const router = useRouter(); const pathname = usePathname();
  const boundedInitial = Math.min(Math.max(initialEntry, 0), Math.max(section.entries.length - 1, 0));
  const [selected, setSelected] = useState(boundedInitial);
  const entry = section.entries[selected];
  const choose = (index: number) => { setSelected(index); router.replace(index === 0 ? pathname : `${pathname}?entry=${index}`, { scroll: false }); };

  return <div className="grid flex-1 grid-cols-[1.08fr_0.92fr] items-stretch pt-8">
    <section className="flex min-w-0 flex-col border-r border-white/10 pr-[6vw]">
      <div className="flex items-center justify-between"><Link href={backHref} className="text-sm text-white/55 transition hover:text-white">{backLabel}</Link><p className="text-sm" style={{ color: data.appearance.primaryColor }}>{SECTION_LABELS[section.kind]}</p></div>
      {entry ? <article className="my-auto max-w-3xl py-10">
        <div className="flex items-center gap-4 text-sm text-white/45">{entry.organization ? <span>{entry.organization}</span> : null}{entry.startDate || entry.endDate ? <span>{entry.startDate} — {entry.endDate}</span> : null}</div>
        <h1 className="mt-5 text-[clamp(3rem,4.6vw,5rem)] font-medium leading-[0.98] tracking-[-0.05em]">{entry.title}</h1>
        {entry.role && entry.role !== entry.title ? <p className="mt-4 text-lg" style={{ color: data.appearance.primaryColor }}>{entry.role}</p> : null}
        <ul className="mt-10 grid gap-5 text-lg leading-8 text-white/72">{entry.bullets.map((bullet, index) => <li key={`${index}-${bullet}`} className="grid grid-cols-[24px_1fr] gap-3"><span aria-hidden="true" style={{ color: data.appearance.primaryColor }}>↗</span><span>{bullet}</span></li>)}</ul>
        {entry.metrics.length ? <div className="mt-10 flex flex-wrap gap-3">{entry.metrics.map((metric) => <span key={metric} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/75">{metric}</span>)}</div> : null}
      </article> : <p className="my-auto text-white/60">这一板块暂时没有公开条目。</p>}
    </section>
    <section className="relative min-h-[620px]"><OptionWheel {...data.appearance.optionWheel} items={section.entries.map((item) => item.wheelLabel)} defaultSelected={boundedInitial} onChange={(index) => choose(index)} side="right" ariaLabel={`${SECTION_LABELS[section.kind]}条目`} textColor="#8b8792" activeColor={data.appearance.primaryColor} /></section>
  </div>;
}

import Link from "next/link";

import type { PublishedSiteData, SectionKind } from "@/src/features/resume/contracts";
import { SECTION_LABELS } from "@/src/features/resume/fixtures";

const ROUTES: Record<"internships" | "projects" | "campus" | "skills", string> = {
  internships: "/internships", projects: "/projects", campus: "/campus", skills: "/skills",
};

export function SectionSummary({ section, detailHref }: { section: PublishedSiteData["sections"][number] & { kind: SectionKind }; detailHref?: string }) {
  const kind = section.kind as keyof typeof ROUTES;
  const label = SECTION_LABELS[section.kind];
  return <article className="max-w-2xl">
    <p className="text-sm font-medium" style={{ color: "var(--accent-color)" }}>0{section.position + 1} / {label}</p>
    <h2 className="mt-6 text-[clamp(3.5rem,5vw,5.5rem)] font-medium leading-[0.96] tracking-[-0.055em]">{label}</h2>
    <p className="mt-8 max-w-2xl text-xl leading-9 text-white/70">{section.summary || `查看完整${label}。`}</p>
    <div className="mt-10 flex items-center gap-5 text-sm text-white/45"><span>{section.entries.length} 项内容</span><span className="h-px w-16 bg-white/20" /></div>
    <Link href={detailHref ?? ROUTES[kind]} aria-label={`查看${label}详情`} className="group mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 px-6 py-3 text-sm transition hover:border-[var(--accent-color)] hover:bg-white/[0.04]">
      查看{label}<span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
    </Link>
  </article>;
}

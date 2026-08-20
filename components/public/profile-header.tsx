import Link from "next/link";

import type { PublishedSiteData } from "@/src/features/resume/contracts";
import { PROFILE_LABELS } from "@/src/features/resume/fixtures";

export function ProfileHeader({ data, homeHref = "/" }: { data: PublishedSiteData; homeHref?: string }) {
  const { identity } = data;
  return <header className="flex items-start justify-between gap-10 border-b border-white/10 pb-6">
    <div className="flex items-baseline gap-5"><Link href={homeHref} className="text-xl font-semibold tracking-tight">{identity.name}</Link><span className="text-sm text-white/55">{identity.targetRole}</span></div>
    <div className="flex items-center gap-6 text-sm text-white/55">
      <span>{PROFILE_LABELS[data.profile]}</span>
      {identity.school ? <span>{identity.school}</span> : null}
      <a className="transition hover:text-white" href={`mailto:${identity.email}`}>{identity.email}</a>
      {identity.showPhone && identity.phone ? <a className="transition hover:text-white" href={`tel:${identity.phone}`}>{identity.phone}</a> : null}
      {data.pdfAvailable ? <a className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-[var(--accent-color)]" href="/api/resume/pdf">下载 PDF</a> : null}
    </div>
  </header>;
}

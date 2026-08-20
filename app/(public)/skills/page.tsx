import { Suspense } from "react";
import { PublicDetailPage } from "@/components/public/public-detail-page";

export default function SkillsPage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#120f17]" />}><SkillsContent searchParams={searchParams} /></Suspense>;
}
async function SkillsContent({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const { entry } = await searchParams;
  return <PublicDetailPage kind="skills" entry={entry} />;
}

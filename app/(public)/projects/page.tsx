import { Suspense } from "react";
import { PublicDetailPage } from "@/components/public/public-detail-page";

export default function ProjectsPage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#120f17]" />}><ProjectsContent searchParams={searchParams} /></Suspense>;
}
async function ProjectsContent({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const { entry } = await searchParams;
  return <PublicDetailPage kind="projects" entry={entry} />;
}

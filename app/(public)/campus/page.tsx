import { Suspense } from "react";
import { PublicDetailPage } from "@/components/public/public-detail-page";

export default function CampusPage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#120f17]" />}><CampusContent searchParams={searchParams} /></Suspense>;
}
async function CampusContent({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const { entry } = await searchParams;
  return <PublicDetailPage kind="campus" entry={entry} />;
}

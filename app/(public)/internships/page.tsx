import { Suspense } from "react";
import { PublicDetailPage } from "@/components/public/public-detail-page";

export default function InternshipsPage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#120f17]" />}><InternshipsContent searchParams={searchParams} /></Suspense>;
}
async function InternshipsContent({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const { entry } = await searchParams;
  return <PublicDetailPage kind="internships" entry={entry} />;
}

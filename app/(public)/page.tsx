import { Suspense } from "react";
import { connection } from "next/server";

import { RoomHome } from "@/components/public/room-home";
import { createPublicFixture } from "@/src/features/resume/public-mapping";
import { getPublishedSiteData } from "@/src/features/resume/queries";

export default function HomePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#120f17]" />}><PublishedHome /></Suspense>;
}

export async function PublishedHome() {
  await connection();
  const data = (await getPublishedSiteData()) ?? createPublicFixture();
  return <RoomHome data={data} />;
}

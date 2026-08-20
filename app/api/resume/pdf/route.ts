import { connection } from "next/server";

import { createAdminClient } from "@/src/lib/supabase/admin";

interface ActivePdf { bytes: Uint8Array; filename: string }
interface PdfRouteDependencies { loadActivePdf(): Promise<ActivePdf | null> }

async function loadActivePdf(): Promise<ActivePdf | null> {
  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase.from("resume_profiles").select("id").eq("is_active", true).maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;
  const { data: revision, error: revisionError } = await supabase.from("resume_revisions").select("id").eq("profile_id", profile.id).eq("status", "published").maybeSingle();
  if (revisionError) throw revisionError;
  if (!revision) return null;
  const { data: file, error: fileError } = await supabase.from("resume_files").select("storage_bucket, storage_path").eq("revision_id", revision.id).eq("kind", "pdf").eq("status", "ready").maybeSingle();
  if (fileError) throw fileError;
  if (!file) return null;
  const { data: blob, error: downloadError } = await supabase.storage.from(file.storage_bucket).download(file.storage_path);
  if (downloadError) throw downloadError;
  return { bytes: new Uint8Array(await blob.arrayBuffer()), filename: "resume.pdf" };
}

export async function serveActiveResumePdf(_request: Request, dependencies: PdfRouteDependencies = { loadActivePdf }) {
  const file = await dependencies.loadActivePdf();
  if (!file) return new Response("PDF 尚未发布。", { status: 404 });
  const bytes = Uint8Array.from(file.bytes);
  return new Response(new Blob([bytes.buffer], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.filename.replaceAll(/[^a-zA-Z0-9._-]/g, "-")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  await connection();
  return serveActiveResumePdf(request);
}

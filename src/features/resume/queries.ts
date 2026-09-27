import "server-only";

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { cacheLife, cacheTag } from "next/cache";
import { headers } from "next/headers";

import { extractDocument } from "@/src/features/docx/extract-document";
import { parseResume } from "@/src/features/docx/parse-resume";
import { requireAdmin } from "./auth";
import { profileSlugSchema, type ProfileSlug, type PublishedSiteData } from "./contracts";
import { createPublicFixture, mapPublishedSiteRows } from "./public-mapping";
import { DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";
import { createServerClient } from "@/src/lib/supabase/server";
import type { Database } from "@/src/lib/supabase/database.types";

export interface AdminProfileCard {
  slug: ProfileSlug;
  isActive: boolean;
  draft: { id: number; parseStatus: string; updatedAt: string } | null;
  published: { id: number; publishedAt: string | null } | null;
}

export interface ResumeEditorData {
  revisionId: number;
  profile: ProfileSlug;
  identity: {
    name: string;
    email: string;
    phone?: string;
    school?: string;
    targetRole: string;
  };
  phoneVisible: boolean;
  parseStatus: string;
  sections: Array<{
    id: number;
    kind: string;
    summary: string;
    position: number;
    visible: boolean;
    entries: Array<{
      id: number;
      title: string;
      wheelLabel: string;
      organization?: string;
      role?: string;
      startDate?: string;
      endDate?: string;
      bullets: string[];
      metrics: string[];
      position: number;
      visible: boolean;
    }>;
  }>;
  issues: Array<{
    id: number;
    code: string;
    severity: string;
    message: string;
    acknowledged: boolean;
  }>;
}

export async function getAdminProfiles(): Promise<AdminProfileCard[]> {
  await requireAdmin();
  const supabase = await createServerClient();
  const { data: profiles, error } = await supabase
    .from("resume_profiles")
    .select("id, slug, is_active")
    .order("id");
  if (error) throw error;

  const { data: revisions, error: revisionError } = await supabase
    .from("resume_revisions")
    .select("id, profile_id, status, parse_status, published_at, updated_at")
    .in("status", ["draft", "published"]);
  if (revisionError) throw revisionError;

  return (profiles ?? []).map((profile) => {
    const slug = profileSlugSchema.parse(profile.slug);
    const draft = revisions?.find(
      (revision) => revision.profile_id === profile.id && revision.status === "draft",
    );
    const published = revisions?.find(
      (revision) =>
        revision.profile_id === profile.id && revision.status === "published",
    );
    return {
      slug,
      isActive: profile.is_active,
      draft: draft
        ? { id: draft.id, parseStatus: draft.parse_status, updatedAt: draft.updated_at }
        : null,
      published: published
        ? { id: published.id, publishedAt: published.published_at }
        : null,
    };
  });
}

function asStringArray(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const candidate = (value as Record<string, unknown>).bullets;
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === "string")
    : [];
}

function asMetrics(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const candidate = (value as Record<string, unknown>).metrics;
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === "string")
    : [];
}

export async function getDraftEditor(
  profileInput: string,
): Promise<ResumeEditorData | null> {
  await requireAdmin();
  const profile = profileSlugSchema.parse(profileInput);
  const supabase = await createServerClient();
  const { data: profileRow, error: profileError } = await supabase
    .from("resume_profiles")
    .select("id")
    .eq("slug", profile)
    .single();
  if (profileError) throw profileError;

  const { data: revision, error: revisionError } = await supabase
    .from("resume_revisions")
    .select("id, identity, phone_visible, parse_status")
    .eq("profile_id", profileRow.id)
    .eq("status", "draft")
    .maybeSingle();
  if (revisionError) throw revisionError;
  if (!revision) return null;

  const [{ data: sections, error: sectionError }, { data: issues, error: issueError }] =
    await Promise.all([
      supabase
        .from("resume_sections")
        .select("id, kind, summary, position, visible")
        .eq("revision_id", revision.id)
        .order("position"),
      supabase
        .from("parse_issues")
        .select("id, code, severity, message, acknowledged")
        .eq("revision_id", revision.id)
        .order("id"),
    ]);
  if (sectionError) throw sectionError;
  if (issueError) throw issueError;

  const sectionIds = (sections ?? []).map((section) => section.id);
  const { data: entries, error: entryError } = sectionIds.length
    ? await supabase
        .from("resume_entries")
        .select(
          "id, section_id, title, wheel_label, organization, role, start_date, end_date, content, position, visible",
        )
        .in("section_id", sectionIds)
        .order("position")
    : { data: [], error: null };
  if (entryError) throw entryError;

  const identity = revision.identity as ResumeEditorData["identity"];
  return {
    revisionId: revision.id,
    profile,
    identity,
    phoneVisible: revision.phone_visible,
    parseStatus: revision.parse_status,
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      kind: section.kind,
      summary: section.summary,
      position: section.position,
      visible: section.visible,
      entries: (entries ?? [])
        .filter((entry) => entry.section_id === section.id)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          wheelLabel: entry.wheel_label,
          organization: entry.organization ?? undefined,
          role: entry.role ?? undefined,
          startDate: entry.start_date ?? undefined,
          endDate: entry.end_date ?? undefined,
          bullets: asStringArray(entry.content),
          metrics: asMetrics(entry.content),
          position: entry.position,
          visible: entry.visible,
        })),
    })),
    issues: issues ?? [],
  };
}

async function readPublishedSiteData(): Promise<PublishedSiteData | null> {
  "use cache";
  cacheLife("max");
  cacheTag("resume:published", "appearance");

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data: profile, error: profileError } = await supabase
    .from("resume_profiles")
    .select("id, slug")
    .eq("is_active", true)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: revision, error: revisionError } = await supabase
    .from("resume_revisions")
    .select("id, identity, phone_visible")
    .eq("profile_id", profile.id)
    .eq("status", "published")
    .maybeSingle();
  if (revisionError) throw revisionError;
  if (!revision) return null;

  const [{ data: sections, error: sectionError }, { data: appearance, error: appearanceError }] = await Promise.all([
    supabase.from("resume_sections").select("id, kind, summary, position, visible").eq("revision_id", revision.id).eq("visible", true).order("position"),
    supabase.from("appearance_settings").select("settings").eq("status", "published").maybeSingle(),
  ]);
  if (sectionError) throw sectionError;
  if (appearanceError) throw appearanceError;
  const sectionIds = (sections ?? []).map((section) => section.id);
  const { data: entries, error: entryError } = sectionIds.length
    ? await supabase.from("resume_entries").select("id, section_id, title, wheel_label, organization, role, start_date, end_date, content, position, visible").in("section_id", sectionIds).eq("visible", true).order("position")
    : { data: [], error: null };
  if (entryError) throw entryError;

  return mapPublishedSiteRows({
    profile,
    revision: { id: revision.id, identity: revision.identity, phoneVisible: revision.phone_visible },
    sections: (sections ?? []).map((section) => ({ ...section, visible: section.visible })),
    entries: (entries ?? []).map((entry) => ({
      id: entry.id, sectionId: entry.section_id, title: entry.title, wheelLabel: entry.wheel_label,
      organization: entry.organization, role: entry.role, startDate: entry.start_date, endDate: entry.end_date,
      content: entry.content, position: entry.position, visible: entry.visible,
    })),
    appearance: appearance?.settings ?? DEFAULT_APPEARANCE,
    pdfAvailable: true,
  });
}

export async function getPublishedSiteData(): Promise<PublishedSiteData | null> {
  if (process.env.LOCAL_PREVIEW_DOCX) {
    const parsed = parseResume(
      await extractDocument(await readFile(process.env.LOCAL_PREVIEW_DOCX)),
      "product-operations",
    );
    let entryId = 1;
    return mapPublishedSiteRows({
      profile: { slug: "product-operations" },
      revision: { id: 0, identity: parsed.identity, phoneVisible: false },
      sections: parsed.sections.map((section, index) => ({
        id: index + 1,
        kind: section.kind,
        summary: section.summary,
        position: section.position,
        visible: true,
      })),
      entries: parsed.sections.flatMap((section, sectionIndex) =>
        section.entries.map((entry) => ({
          id: entryId++,
          sectionId: sectionIndex + 1,
          title: entry.title,
          wheelLabel: entry.wheelLabel,
          organization: entry.organization,
          role: entry.role,
          startDate: entry.startDate,
          endDate: entry.endDate,
          content: { bullets: entry.bullets, metrics: entry.metrics },
          position: entry.position,
          visible: entry.visible,
        }))),
      appearance: DEFAULT_APPEARANCE,
      pdfAvailable: false,
    });
  }
  if (process.env.LOCAL_PREVIEW_FIXTURE === "1") return createPublicFixture();
  if (process.env.NODE_ENV !== "production") {
    const requestHeaders = await headers();
    if (requestHeaders.get("x-e2e-public-fixture") === "1") return createPublicFixture();
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  return readPublishedSiteData();
}

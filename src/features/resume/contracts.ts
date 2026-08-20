import { z } from "zod";

import type { AppearanceSettings } from "@/src/features/appearance/contracts";

export const profileSlugSchema = z.enum(["product-manager", "product-operations"]);
export type ProfileSlug = z.infer<typeof profileSlugSchema>;

export const sectionKindSchema = z.enum([
  "education",
  "internships",
  "projects",
  "skills",
  "self-evaluation",
  "campus",
]);
export type SectionKind = z.infer<typeof sectionKindSchema>;

export interface DocumentBlock {
  index: number;
  kind: "paragraph" | "table-row";
  text: string;
  cells?: string[];
}

export const resumeEntryDraftSchema = z.object({
  id: z.number().int().positive().optional(),
  section: sectionKindSchema,
  title: z.string().trim().min(1),
  wheelLabel: z.string().trim().min(1),
  organization: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  startDate: z.string().trim().min(1).optional(),
  endDate: z.string().trim().min(1).optional(),
  bullets: z.array(z.string().trim().min(1)),
  metrics: z.array(z.string().trim().min(1)),
  position: z.number().int().nonnegative(),
  visible: z.boolean(),
});
export type ResumeEntryDraft = z.infer<typeof resumeEntryDraftSchema>;

export const parseIssueSchema = z.object({
  code: z.enum(["missing-section", "unknown-paragraph", "duplicate-entry", "invalid-date"]),
  severity: z.enum(["warning", "blocking"]),
  message: z.string().trim().min(1),
  entryIndexes: z.array(z.number().int().nonnegative()).optional(),
});
export type ParseIssue = z.infer<typeof parseIssueSchema>;

export const parsedResumeSchema = z.object({
  schemaVersion: z.literal(1),
  identity: z.object({
    name: z.string().trim().min(1),
    email: z.email(),
    phone: z.string().trim().min(1).optional(),
    school: z.string().trim().min(1).optional(),
    targetRole: z.string().trim().min(1),
  }),
  sections: z.array(
    z.object({
      kind: sectionKindSchema,
      summary: z.string().trim(),
      position: z.number().int().nonnegative(),
      entries: z.array(resumeEntryDraftSchema),
    }),
  ),
  issues: z.array(parseIssueSchema),
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export interface PublishedSiteData {
  profile: ProfileSlug;
  identity: ParsedResume["identity"] & { showPhone: boolean };
  sections: ParsedResume["sections"];
  appearance: AppearanceSettings;
  pdfAvailable: boolean;
}

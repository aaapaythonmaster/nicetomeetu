import { SECTION_LABELS } from "@/src/features/resume/fixtures";
import type {
  ParseIssue,
  SectionKind,
} from "@/src/features/resume/contracts";

export const REQUIRED_SECTION_KINDS = [
  "education",
  "internships",
  "projects",
  "skills",
  "self-evaluation",
  "campus",
] as const satisfies readonly SectionKind[];

export function findMissingSections(found: ReadonlySet<SectionKind>): ParseIssue[] {
  return REQUIRED_SECTION_KINDS.filter((kind) => !found.has(kind)).map((kind) => ({
    code: "missing-section" as const,
    severity: "blocking" as const,
    message: `缺少必填板块“${SECTION_LABELS[kind]}”，请检查简历标题。`,
  }));
}

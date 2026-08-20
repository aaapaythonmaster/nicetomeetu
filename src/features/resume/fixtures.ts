import type { ProfileSlug, SectionKind } from "./contracts";

export const PROFILE_LABELS: Record<ProfileSlug, string> = {
  "product-manager": "产品经理版",
  "product-operations": "产品运营版",
};

export const SECTION_LABELS: Record<SectionKind, string> = {
  education: "教育背景",
  internships: "实习经历",
  projects: "项目经历",
  skills: "技能",
  "self-evaluation": "自我评价",
  campus: "校园经历",
};

export const PUBLIC_SECTION_KINDS = [
  "internships",
  "projects",
  "campus",
  "skills",
] as const satisfies readonly SectionKind[];

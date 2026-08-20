import { appearanceSettingsSchema, type AppearanceSettings, DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";
import { parsedResumeSchema, profileSlugSchema, sectionKindSchema, type PublishedSiteData } from "./contracts";
import type { ResumeEditorData } from "./queries";

interface PublicRows {
  profile: { slug: string };
  revision: { id: number; identity: unknown; phoneVisible: boolean };
  sections: Array<{ id: number; kind: string; summary: string; position: number; visible: boolean }>;
  entries: Array<{
    id: number; sectionId: number; title: string; wheelLabel: string; organization?: string | null;
    role?: string | null; startDate?: string | null; endDate?: string | null; content: unknown;
    position: number; visible: boolean;
  }>;
  appearance: AppearanceSettings | unknown;
  pdfAvailable: boolean;
}

function contentArrays(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return { bullets: [], metrics: [] };
  const record = content as Record<string, unknown>;
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  return { bullets: strings(record.bullets), metrics: strings(record.metrics) };
}

export function mapPublishedSiteRows(rows: PublicRows): PublishedSiteData {
  const profile = profileSlugSchema.parse(rows.profile.slug);
  const identity = parsedResumeSchema.shape.identity.parse(rows.revision.identity);
  const publicIdentity = rows.revision.phoneVisible
    ? { ...identity, showPhone: true }
    : { name: identity.name, email: identity.email, school: identity.school, targetRole: identity.targetRole, showPhone: false };

  const visibleSections = rows.sections.filter((section) => section.visible).toSorted((a, b) => a.position - b.position);
  const sections = visibleSections.map((section) => ({
    kind: sectionKindSchema.parse(section.kind),
    summary: section.summary,
    position: section.position,
    entries: rows.entries
      .filter((entry) => entry.sectionId === section.id && entry.visible)
      .toSorted((a, b) => a.position - b.position)
      .map((entry) => {
        const content = contentArrays(entry.content);
        return {
          id: entry.id,
          section: sectionKindSchema.parse(section.kind),
          title: entry.title,
          wheelLabel: entry.wheelLabel,
          organization: entry.organization ?? undefined,
          role: entry.role ?? undefined,
          startDate: entry.startDate ?? undefined,
          endDate: entry.endDate ?? undefined,
          bullets: content.bullets,
          metrics: content.metrics,
          position: entry.position,
          visible: true,
        };
      }),
  }));

  return {
    profile,
    identity: publicIdentity,
    sections,
    appearance: appearanceSettingsSchema.parse(rows.appearance),
    pdfAvailable: rows.pdfAvailable,
  };
}

export function mapDraftPreview(
  draft: ResumeEditorData,
  appearance: AppearanceSettings,
): PublishedSiteData {
  return mapPublishedSiteRows({
    profile: { slug: draft.profile },
    revision: {
      id: draft.revisionId,
      identity: draft.identity,
      phoneVisible: draft.phoneVisible,
    },
    sections: draft.sections,
    entries: draft.sections.flatMap((section) =>
      section.entries.map((entry) => ({
        id: entry.id,
        sectionId: section.id,
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
    appearance,
    pdfAvailable: false,
  });
}

export function createPublicFixture(): PublishedSiteData {
  const sections = [
    { id: 1, kind: "internships", summary: "围绕 AI 产品、数据运营与流程提效，连接业务需求和可落地方案。", position: 0, visible: true },
    { id: 2, kind: "projects", summary: "从问题定义、方案设计到协同交付，呈现完整的项目推进能力。", position: 1, visible: true },
    { id: 3, kind: "campus", summary: "通过组织协作与内容运营，验证沟通、统筹和持续执行能力。", position: 2, visible: true },
    { id: 4, kind: "skills", summary: "产品分析、原型表达、数据处理与 AI 工具应用。", position: 3, visible: true },
  ];
  const entries = [
    [1, 1, "AI 产品实习", "AI 产品"], [2, 1, "数据运营实习", "数据运营"],
    [11, 2, "AI 应用项目", "AI 应用"], [12, 2, "流程重构项目", "流程重构"],
    [21, 3, "校园组织负责人", "组织协作"], [31, 4, "产品与数据技能", "能力栈"],
  ].map(([id, sectionId, title, wheelLabel], index) => ({
    id: id as number, sectionId: sectionId as number, title: title as string, wheelLabel: wheelLabel as string,
    organization: sectionId === 1 ? "示例科技公司" : undefined,
    role: sectionId === 1 ? wheelLabel as string : undefined,
    startDate: "2025.03", endDate: "2025.08",
    content: { bullets: index % 2 === 0 ? ["梳理业务流程并沉淀可复用的产品方案。", "协同研发与运营推进方案落地。"] : ["定位关键阻塞点，完成流程重构与效果复盘。"], metrics: index % 2 === 0 ? ["交付周期缩短 30%"] : [] },
    position: sectionId === 1 || sectionId === 2 ? index % 2 : 0, visible: true,
  }));
  entries.push({ id: 99, sectionId: 2, title: "隐藏项目", wheelLabel: "隐藏", organization: undefined, role: undefined, startDate: "2024.01", endDate: "2024.02", content: { bullets: ["不公开内容"], metrics: [] }, position: 2, visible: false });
  return mapPublishedSiteRows({
    profile: { slug: "product-manager" },
    revision: { id: 1, identity: { name: "候选人", email: "candidate@example.com", phone: "13800000000", school: "示例大学", targetRole: "AI 产品与流程运营" }, phoneVisible: false },
    sections,
    entries,
    appearance: DEFAULT_APPEARANCE,
    pdfAvailable: false,
  });
}

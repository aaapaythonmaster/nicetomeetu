import { describe, expect, it } from "vitest";

import { DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";
import { createPublicFixture, mapDraftPreview, mapPublishedSiteRows } from "@/src/features/resume/public-mapping";

describe("published resume mapping", () => {
  it("maps an editor draft through the public view while keeping hidden data private", () => {
    const fixture = createPublicFixture();
    const preview = mapDraftPreview({
      revisionId: 9,
      profile: fixture.profile,
      identity: { ...fixture.identity, phone: "13800000000" },
      phoneVisible: false,
      parseStatus: "ready",
      issues: [],
      sections: fixture.sections.map((section, sectionIndex) => ({
        id: sectionIndex + 1,
        kind: section.kind,
        summary: section.summary,
        position: section.position,
        visible: true,
        entries: section.entries.map((entry, entryIndex) => ({
          ...entry,
          id: entry.id ?? sectionIndex * 10 + entryIndex + 1,
          visible: true,
        })),
      })),
    }, fixture.appearance);

    expect(preview.identity).not.toHaveProperty("phone");
    expect(preview.pdfAvailable).toBe(false);
    expect(preview.sections.map((section) => section.kind)).toEqual(["internships", "projects", "campus", "skills"]);
  });

  it("removes hidden sections, hidden entries, and a private phone number", () => {
    const result = mapPublishedSiteRows({
      profile: { slug: "product-manager" },
      revision: {
        id: 7,
        identity: { name: "候选人", email: "candidate@example.com", phone: "13800000000", school: "示例大学", targetRole: "产品经理" },
        phoneVisible: false,
      },
      sections: [
        { id: 2, kind: "projects", summary: "项目摘要", position: 2, visible: true },
        { id: 1, kind: "internships", summary: "实习摘要", position: 1, visible: true },
        { id: 3, kind: "campus", summary: "不应公开", position: 3, visible: false },
      ],
      entries: [
        { id: 2, sectionId: 1, title: "隐藏岗位", wheelLabel: "隐藏", position: 2, visible: false, content: { bullets: ["机密"] } },
        { id: 1, sectionId: 1, title: "公开岗位", wheelLabel: "AI 产品", position: 1, visible: true, content: { bullets: ["公开经历"], metrics: [] } },
      ],
      appearance: DEFAULT_APPEARANCE,
      pdfAvailable: false,
    });

    expect(result.identity).not.toHaveProperty("phone");
    expect(result.identity.showPhone).toBe(false);
    expect(result.sections.map((section) => section.kind)).toEqual(["internships", "projects"]);
    expect(result.sections[0].entries.map((entry) => entry.title)).toEqual(["公开岗位"]);
    expect(JSON.stringify(result)).not.toContain("机密");
  });

  it("includes the phone only when the published revision opts in", () => {
    const result = mapPublishedSiteRows({
      profile: { slug: "product-operations" },
      revision: { id: 8, identity: { name: "候选人", email: "candidate@example.com", phone: "13800000000", targetRole: "产品运营" }, phoneVisible: true },
      sections: [], entries: [], appearance: DEFAULT_APPEARANCE, pdfAvailable: true,
    });

    expect(result.identity.phone).toBe("13800000000");
    expect(result.pdfAvailable).toBe(true);
  });
});

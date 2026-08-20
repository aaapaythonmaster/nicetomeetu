// @vitest-environment node

import { mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildResumePdfViewModel } from "@/src/features/pdf/resume-document";
import { renderResumePdf } from "@/src/features/pdf/render-pdf";
import type { ResumeEditorData } from "@/src/features/resume/queries";

const draft: ResumeEditorData = {
  revisionId: 9, profile: "product-manager", parseStatus: "ready", phoneVisible: false,
  identity: { name: "候选人", email: "candidate@example.com", phone: "13800000000", school: "示例大学", targetRole: "产品经理" },
  issues: [],
  sections: [
    { id: 1, kind: "internships", summary: "", position: 0, visible: true, entries: [
      { id: 1, title: "公开经历", wheelLabel: "公开", bullets: ["公开内容"], metrics: [], position: 0, visible: true },
      { id: 2, title: "隐藏经历", wheelLabel: "隐藏", bullets: ["不公开内容"], metrics: [], position: 1, visible: false },
    ] },
    { id: 2, kind: "campus", summary: "", position: 1, visible: false, entries: [
      { id: 3, title: "隐藏板块", wheelLabel: "隐藏", bullets: ["机密"], metrics: [], position: 0, visible: true },
    ] },
  ],
};

describe("PDF document view model", () => {
  it("omits hidden content and a private phone while preserving order", () => {
    const model = buildResumePdfViewModel(draft);

    expect(model.identity).not.toHaveProperty("phone");
    expect(model.sections).toHaveLength(1);
    expect(model.sections[0].entries.map((entry) => entry.title)).toEqual(["公开经历"]);
    expect(JSON.stringify(model)).not.toMatch(/不公开内容|机密|13800000000/);
  });

  it("includes a phone only after explicit opt-in", () => {
    expect(buildResumePdfViewModel({ ...draft, phoneVisible: true }).identity.phone).toBe("13800000000");
  });

  it("renders a valid PDF with the bundled Chinese font", async () => {
    const buffer = await renderResumePdf(draft);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(1_000);
    if (process.env.CAPTURE_PDF === "1") {
      await mkdir("tmp/pdfs", { recursive: true });
      await writeFile("tmp/pdfs/resume-fixture.pdf", buffer);
    }
  });
});

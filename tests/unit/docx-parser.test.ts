import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { extractDocument } from "@/src/features/docx/extract-document";
import { parseResume } from "@/src/features/docx/parse-resume";

const fixture = (name: string) =>
  readFile(resolve(process.cwd(), "tests", "fixtures", name));

describe("fixed-format DOCX resume parsing", () => {
  it("extracts the approved fixture into all six resume sections", async () => {
    const blocks = await extractDocument(await fixture("resume-ai-operations.docx"));
    const result = parseResume(blocks, "product-manager");

    expect(result.sections.map((section) => section.kind)).toEqual([
      "education",
      "internships",
      "projects",
      "skills",
      "self-evaluation",
      "campus",
    ]);
    expect(result.identity).toEqual(
      expect.objectContaining({
        name: "测试候",
        email: "fixture@example.com",
        phone: "(+86)138-0000-0000",
      }),
    );

    const internships = result.sections.find(
      (section) => section.kind === "internships",
    );
    expect(internships?.entries).toHaveLength(5);
    expect(internships?.entries.map((entry) => entry.wheelLabel)).toEqual([
      "AI 产品经理",
      "AI 应用",
      "AI 业务提效",
      "数据运营",
      "数据资产",
    ]);
    expect(
      result.sections.find((section) => section.kind === "projects")?.entries,
    ).toHaveLength(4);
    expect(
      result.sections.find((section) => section.kind === "campus")?.entries,
    ).toHaveLength(3);

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-entry",
          severity: "warning",
        }),
      ]),
    );
  });

  it("marks a missing campus section as blocking", async () => {
    const blocks = await extractDocument(await fixture("resume-missing-section.docx"));
    const result = parseResume(blocks, "product-operations");

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-section",
          severity: "blocking",
          message: expect.stringContaining("校园经历"),
        }),
      ]),
    );
  });

  it("rejects malformed or incomplete OOXML archives", async () => {
    await expect(extractDocument(Buffer.from("not-a-zip"))).rejects.toThrow(
      /DOCX|ZIP/i,
    );
  });

  it("does not invent an email address when the document omits one", () => {
    const texts = [
      "测试候选人",
      "教育背景",
      "实习经历",
      "AI 项目实践 / 作品集",
      "技能",
      "自我评价:可靠",
      "校园经历",
    ];
    const blocks = texts.map((text, index) => ({
      index,
      kind: "paragraph" as const,
      text,
    }));

    expect(() => parseResume(blocks, "product-manager")).toThrow(/邮箱/);
  });
});

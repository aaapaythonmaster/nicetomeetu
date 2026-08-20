import { describe, expect, it } from "vitest";

import { findDuplicates } from "@/src/features/docx/duplicate-detection";
import type { ResumeEntryDraft } from "@/src/features/resume/contracts";

const entry = (
  title: string,
  bullets: string[],
  position: number,
): ResumeEntryDraft => ({
  section: "projects",
  title,
  wheelLabel: title,
  bullets,
  metrics: [],
  position,
  visible: true,
});

describe("duplicate resume entry detection", () => {
  it("warns for normalized entries at or above the similarity threshold", () => {
    const entries = [
      entry("合同保单结构化提取系统", ["使用 DeepSeek + Miner U 处理 430+ 份文档。"], 0),
      entry("合同保单结构化提取系统", ["使用DeepSeek+Miner U处理430+份文档!"], 1),
    ];

    expect(findDuplicates(entries)).toEqual([
      expect.objectContaining({
        code: "duplicate-entry",
        severity: "warning",
        entryIndexes: [0, 1],
      }),
    ]);
  });

  it("keeps materially different entries independent", () => {
    const entries = [
      entry("合同提取", ["解析合同关键条款。"], 0),
      entry("新闻播报助手", ["通过 n8n 每日推送行业新闻。"], 1),
    ];

    expect(findDuplicates(entries)).toEqual([]);
  });
});

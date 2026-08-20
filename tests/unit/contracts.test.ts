import { describe, expect, it } from "vitest";

import {
  parsedResumeSchema,
  profileSlugSchema,
  type ParsedResume,
} from "@/src/features/resume/contracts";

describe("resume contracts", () => {
  it("accepts only the two configured profile slots", () => {
    expect(profileSlugSchema.parse("product-manager")).toBe("product-manager");
    expect(profileSlugSchema.parse("product-operations")).toBe("product-operations");
    expect(() => profileSlugSchema.parse("growth")).toThrow();
  });

  it("rejects negative entry positions", () => {
    const input: ParsedResume = {
      schemaVersion: 1,
      identity: {
        name: "测试用户",
        email: "fixture@example.com",
        targetRole: "产品运营",
      },
      sections: [
        {
          kind: "internships",
          summary: "一段完整的实习简介。",
          position: 0,
          entries: [
            {
              section: "internships",
              title: "测试岗位",
              wheelLabel: "测试",
              bullets: ["完成测试。"],
              metrics: [],
              position: -1,
              visible: true,
            },
          ],
        },
      ],
      issues: [],
    };

    expect(() => parsedResumeSchema.parse(input)).toThrow();
  });
});

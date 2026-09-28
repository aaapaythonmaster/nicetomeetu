import { describe, expect, it } from "vitest";

import { metadata } from "@/app/layout";

describe("site metadata", () => {
  it("uses the requested browser tab title", () => {
    expect(metadata.title).toBe("xinrui's portfolio");
  });
});

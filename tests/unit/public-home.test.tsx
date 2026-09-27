import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/features/resume/queries", () => ({
  getPublishedSiteData: vi.fn(async () => null),
}));

import { PublishedHome } from "@/app/(public)/page";

describe("public homepage fallback", () => {
  it("shows the portfolio fixture when no database revision is published", async () => {
    render(await PublishedHome());

    expect(screen.getByRole("heading", { name: "张昕蕊" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "实习经历轮播" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const connectionMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/server", () => ({ connection: connectionMock }));

vi.mock("@/src/features/resume/queries", () => ({
  getPublishedSiteData: vi.fn(async () => null),
}));

import { PublishedHome } from "@/app/(public)/page";

describe("public homepage fallback", () => {
  beforeEach(() => connectionMock.mockClear());

  it("shows the portfolio fixture when no database revision is published", async () => {
    render(await PublishedHome());

    expect(screen.getByRole("heading", { name: "张昕蕊" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "实习经历轮播" })).toBeInTheDocument();
  });

  it("renders at request time so an old prerender cannot survive a deployment", async () => {
    await PublishedHome();

    expect(connectionMock).toHaveBeenCalledOnce();
  });
});

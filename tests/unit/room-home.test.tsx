import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoomHome } from "@/components/public/room-home";
import { createPublicFixture } from "@/src/features/resume/public-mapping";

describe("RoomHome internship carousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows internships, supports manual navigation, and pauses autoplay on hover", () => {
    render(<RoomHome data={createPublicFixture()} />);

    const carousel = screen.getByRole("region", { name: "实习经历轮播" });
    expect(screen.getByRole("heading", { name: "鲸锐 AI 影视智作产品实习" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一段实习" }));
    expect(screen.getByRole("heading", { name: "用户画像 AI 工作流" })).toBeInTheDocument();

    fireEvent.mouseEnter(carousel);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("heading", { name: "用户画像 AI 工作流" })).toBeInTheDocument();

    fireEvent.mouseLeave(carousel);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("heading", { name: "销售业务自动化与预测" })).toBeInTheDocument();
  });
});

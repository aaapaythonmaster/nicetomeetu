import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoomHome } from "@/components/public/room-home";
import { createPublicFixture } from "@/src/features/resume/public-mapping";

describe("RoomHome internship presentation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("keeps the homepage internship area concise and shows the company logo", () => {
    render(<RoomHome data={createPublicFixture()} />);

    expect(screen.getByRole("region", { name: "实习经历轮播" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "阿里巴巴 Logo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "优酷-AI影视智作产品实习生" })).toBeInTheDocument();
    expect(screen.queryByText(/累计测试生成280\+条视频/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看完整实习经历 ↗" })).toBeInTheDocument();
  });

  it("shows the complete card only after opening the internship folder", () => {
    render(<RoomHome data={createPublicFixture()} />);

    fireEvent.click(screen.getByRole("button", { name: "查看完整实习经历 ↗" }));
    fireEvent.click(screen.getByRole("button", { name: "打开实习经历" }));

    expect(screen.getByRole("region", { name: "实习经历卡片" })).toBeInTheDocument();
    expect(screen.getByText(/累计测试生成280\+条视频/)).toBeInTheDocument();
    expect(screen.getByLabelText("阿里巴巴工作路径与成果")).toHaveTextContent("83%");
    expect(screen.getByRole("link", { name: /鲸锐AI官网/ })).toHaveAttribute("href", "https://www.ahatime.com/page/home");
    expect(screen.getByRole("link", { name: /鲸锐AI官网/ })).toHaveAttribute("target", "_blank");
  });

  it("drops the detail card and reveals the next internship", () => {
    render(<RoomHome data={createPublicFixture()} />);

    fireEvent.click(screen.getByRole("button", { name: "查看完整实习经历 ↗" }));
    fireEvent.click(screen.getByRole("button", { name: "打开实习经历" }));
    const card = screen.getByRole("button", { name: /当前为阿里巴巴.*点击查看下一段实习/ });

    fireEvent.click(card);
    expect(card).toHaveClass("is-dropping");
    act(() => vi.advanceTimersByTime(720));

    expect(screen.getByRole("heading", { name: "市场策略-AI产品经理实习生" })).toBeInTheDocument();
    expect(screen.getByText(/基于1w\+条真实用户数据/)).toBeInTheDocument();
  });

  it("supports keyboard activation for the detail card", () => {
    render(<RoomHome data={createPublicFixture()} />);

    fireEvent.click(screen.getByRole("button", { name: "查看完整实习经历 ↗" }));
    fireEvent.click(screen.getByRole("button", { name: "打开实习经历" }));
    const card = screen.getByRole("button", { name: /当前为阿里巴巴.*点击查看下一段实习/ });

    fireEvent.keyDown(card, { key: "Enter" });
    act(() => vi.advanceTimersByTime(720));

    expect(screen.getByRole("heading", { name: "市场策略-AI产品经理实习生" })).toBeInTheDocument();
  });
});

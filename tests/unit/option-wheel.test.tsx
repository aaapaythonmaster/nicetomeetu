import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OptionWheel } from "@/components/react-bits/option-wheel";

describe("OptionWheel", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  it("exposes listbox semantics and changes selection with arrow keys", () => {
    const onChange = vi.fn();
    render(
      <OptionWheel
        items={["实习经历", "项目经历", "校园经历", "技能"]}
        defaultSelected={0}
        onChange={onChange}
      />,
    );

    const wheel = screen.getByRole("listbox", { name: "经历分类" });
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(screen.getByRole("option", { name: "实习经历" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(wheel, { key: "ArrowDown" });

    expect(screen.getByRole("option", { name: "项目经历" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onChange).toHaveBeenLastCalledWith(1, "项目经历");
  });

  it("selects an option by click", () => {
    const onChange = vi.fn();
    render(
      <OptionWheel
        items={["AI 产品经理", "AI 应用", "数据运营"]}
        defaultSelected={0}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("option", { name: "数据运营" }));

    expect(screen.getByRole("option", { name: "数据运营" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onChange).toHaveBeenLastCalledWith(2, "数据运营");
  });

  it("does not create audio when soundUrl is empty", () => {
    const AudioConstructor = vi.fn();
    vi.stubGlobal("Audio", AudioConstructor);
    render(<OptionWheel items={["一", "二"]} defaultSelected={0} />);

    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" });

    expect(AudioConstructor).not.toHaveBeenCalled();
  });

  it("stops at both ends when looping is disabled", () => {
    const onChange = vi.fn();
    render(
      <OptionWheel
        items={["第一项", "第二项"]}
        defaultSelected={0}
        loop={false}
        onChange={onChange}
      />,
    );
    const wheel = screen.getByRole("listbox");

    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: "第一项" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "第二项" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

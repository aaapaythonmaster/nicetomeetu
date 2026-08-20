import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";

const mocks = vi.hoisted(() => ({
  colorBendsShouldFail: false,
  dotFieldProps: vi.fn(),
}));

vi.mock("@/components/react-bits/color-bends", () => ({
  ColorBends: () => {
    if (mocks.colorBendsShouldFail) throw new Error("WebGL unavailable");
    return <div data-testid="color-bends" />;
  },
}));

vi.mock("@/components/react-bits/dot-field", () => ({
  DotField: (props: unknown) => {
    mocks.dotFieldProps(props);
    return <div data-testid="dot-field" />;
  },
}));

import { DynamicBackground } from "@/components/visual/dynamic-background";

describe("DynamicBackground", () => {
  afterEach(() => {
    mocks.colorBendsShouldFail = false;
    mocks.dotFieldProps.mockReset();
  });

  it("derives the DotField palette from the global primary color", () => {
    render(
      <DynamicBackground settings={DEFAULT_APPEARANCE}>
        <p>简历正文</p>
      </DynamicBackground>,
    );

    expect(mocks.dotFieldProps).toHaveBeenCalledWith(
      expect.objectContaining({ gradientFrom: "#51cce1", gradientTo: "#09879f" }),
    );
  });

  it("keeps content and the second effect visible when ColorBends fails", () => {
    mocks.colorBendsShouldFail = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <DynamicBackground settings={DEFAULT_APPEARANCE}>
        <p>简历正文</p>
      </DynamicBackground>,
    );

    expect(screen.getByText("简历正文")).toBeVisible();
    expect(screen.getByTestId("dot-field")).toBeVisible();
    consoleError.mockRestore();
  });
});

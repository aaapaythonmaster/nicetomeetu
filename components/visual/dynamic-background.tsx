"use client";

import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from "react";

import { ColorBends } from "@/components/react-bits/color-bends";
import { DotField } from "@/components/react-bits/dot-field";
import { deriveMotionColors } from "@/src/features/appearance/colors";
import type { AppearanceSettings } from "@/src/features/appearance/contracts";

class EffectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "test") console.error("Visual effect disabled", error, info);
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function DynamicBackground({ settings, children }: { settings: AppearanceSettings; children: ReactNode }) {
  const companions = settings.derivedColorOverride && settings.derivedColors
    ? settings.derivedColors
    : deriveMotionColors(settings.primaryColor);

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[#120f17]" style={{ "--accent-color": settings.primaryColor } as CSSProperties}>
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <EffectBoundary>
          <ColorBends {...settings.colorBends} colors={[settings.primaryColor]} />
        </EffectBoundary>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <EffectBoundary>
          <DotField {...settings.dotField} gradientFrom={companions.light} gradientTo={companions.dark} />
        </EffectBoundary>
      </div>
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

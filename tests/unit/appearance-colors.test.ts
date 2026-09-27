import { describe, expect, it } from "vitest";

import {
  appearanceSettingsSchema,
  DEFAULT_APPEARANCE,
} from "@/src/features/appearance/contracts";
import { deriveMotionColors } from "@/src/features/appearance/colors";

describe("appearance defaults", () => {
  it("derives both dot colors from the primary color", () => {
    expect(deriveMotionColors("#06b6d4")).toEqual({
      light: "#51cce1",
      dark: "#09879f",
    });
  });

  it("locks the approved React Bits parameters", () => {
    expect(DEFAULT_APPEARANCE).toMatchObject({
      primaryColor: "#06b6d4",
      derivedColorOverride: false,
      colorBends: {
        rotation: 60,
        speed: 0.2,
        intensity: 1.3,
        bandWidth: 1,
      },
      dotField: {
        dotRadius: 1.5,
        dotSpacing: 22,
        dotOpacity: 0.32,
        cursorRadius: 500,
        bulgeStrength: 67,
        glowColor: "#06b6d4",
        glowOpacity: 0.1,
      },
      optionWheel: {
        fontSize: 3,
        spacing: 1.4,
        loop: false,
        draggable: true,
      },
    });
  });

  it("rejects invalid colors and looping wheels", () => {
    expect(() =>
      appearanceSettingsSchema.parse({
        ...DEFAULT_APPEARANCE,
        primaryColor: "cyan",
      }),
    ).toThrow();

    expect(() =>
      appearanceSettingsSchema.parse({
        ...DEFAULT_APPEARANCE,
        optionWheel: { ...DEFAULT_APPEARANCE.optionWheel, loop: true },
      }),
    ).toThrow();
  });
});

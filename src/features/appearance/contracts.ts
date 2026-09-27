import { z } from "zod";

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const colorBendsSettingsSchema = z.object({
  rotation: z.number().min(-360).max(360),
  autoRotate: z.number().min(-360).max(360),
  speed: z.number().min(0).max(5),
  scale: z.number().positive().max(5),
  frequency: z.number().positive().max(10),
  warpStrength: z.number().min(0).max(5),
  mouseInfluence: z.number().min(0).max(5),
  parallax: z.number().min(0).max(2),
  noise: z.number().min(0).max(1),
  iterations: z.number().int().min(1).max(5),
  intensity: z.number().min(0).max(5),
  bandWidth: z.number().positive().max(5),
  transparent: z.boolean(),
});
export type ColorBendsSettings = z.infer<typeof colorBendsSettingsSchema>;

export const dotFieldSettingsSchema = z.object({
  dotRadius: z.number().positive().max(10),
  dotSpacing: z.number().positive().max(100),
  dotOpacity: z.number().min(0).max(1).default(0.32),
  cursorRadius: z.number().positive().max(2_000),
  cursorForce: z.number().min(-2).max(2),
  bulgeOnly: z.boolean(),
  bulgeStrength: z.number().min(0).max(200),
  glowRadius: z.number().min(0).max(1_000),
  waveAmplitude: z.number().min(0).max(100),
  sparkle: z.boolean(),
  glowColor: hexColorSchema,
  glowOpacity: z.number().min(0).max(1).default(0.1),
  gradientFrom: hexColorSchema.optional(),
  gradientTo: hexColorSchema.optional(),
});
export type DotFieldSettings = z.infer<typeof dotFieldSettingsSchema>;

export const optionWheelSettingsSchema = z.object({
  fontSize: z.number().positive().max(8),
  spacing: z.number().positive().max(4),
  curve: z.number().min(0).max(4),
  tilt: z.number().min(0).max(45),
  blur: z.number().min(0).max(20),
  fade: z.number().min(0).max(1),
  minOpacity: z.number().min(0).max(1),
  smoothing: z.number().positive().max(2_000),
  inset: z.number().min(0).max(500),
  loop: z.literal(false),
  draggable: z.literal(true),
});
export type OptionWheelSettings = z.infer<typeof optionWheelSettingsSchema>;

export const appearanceSettingsSchema = z
  .object({
    primaryColor: hexColorSchema,
    derivedColorOverride: z.boolean(),
    derivedColors: z
      .object({ light: hexColorSchema, dark: hexColorSchema })
      .optional(),
    colorBends: colorBendsSettingsSchema,
    dotField: dotFieldSettingsSchema,
    optionWheel: optionWheelSettingsSchema,
  })
  .superRefine((settings, context) => {
    if (settings.derivedColorOverride && !settings.derivedColors) {
      context.addIssue({
        code: "custom",
        message: "Derived colors are required when override is enabled",
        path: ["derivedColors"],
      });
    }
  });
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  primaryColor: "#06b6d4",
  derivedColorOverride: false,
  colorBends: {
    rotation: 60,
    autoRotate: 0,
    speed: 0.2,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0.15,
    iterations: 1,
    intensity: 1.3,
    bandWidth: 1,
    transparent: true,
  },
  dotField: {
    dotRadius: 1.5,
    dotSpacing: 22,
    dotOpacity: 0.32,
    cursorRadius: 500,
    cursorForce: 0.1,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
    glowColor: "#06b6d4",
    glowOpacity: 0.1,
  },
  optionWheel: {
    fontSize: 3,
    spacing: 1.4,
    curve: 1,
    tilt: 6,
    blur: 2,
    fade: 0.25,
    minOpacity: 0.05,
    smoothing: 200,
    inset: 80,
    loop: false,
    draggable: true,
  },
};

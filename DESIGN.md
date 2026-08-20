# Design system

Nicetomeetu is a desktop-first, cinematic resume product. The interface keeps resume content clear and credible while a restrained, pointer-reactive background supplies atmosphere. This file records the approved system shared by the appearance admin, full-screen preview, and future public resume pages.

## Product modes

- **Operate — appearance admin:** clarity and predictability come first. Use explicit labels, grouped parameters, visible state, textual status, and conventional actions.
- **Experience — preview and public resume:** motion creates depth, but content and navigation remain primary. The public product supports independently managed product-manager and product-operations resumes and shows the selected published revision.

## Color and tokens

| Role | Value / rule |
| --- | --- |
| Canvas | `#120f17` |
| Primary text | `#f8fafc` globally; white in experience surfaces |
| Secondary text | Cool slate neutrals; body copy must meet 4.5:1 contrast |
| Primary accent | Cyan `#06b6d4` |
| Dividers / borders | White at 10–15% opacity |
| Admin surfaces | White at 3.5% or black at 20–25% over the canvas |
| Wheel text | Muted `#8b8792` / `#a6a6a6`; active uses the configured accent |

The primary accent drives ColorBends and, by default, the two DotField companion colors. Companions are derived by mixing the accent toward white (70% accent) and toward the canvas (72% accent). Manual companion-color override is an admin option. Accent communicates focus, hierarchy, and status; it is not a decorative fill for every heading. Do not use generic gradient-filled text.

## Typography

- Sans stack: `Arial`, `PingFang SC`, `Microsoft YaHei`, `sans-serif`.
- Admin hierarchy: 12px tracked uppercase eyebrows, 14px labels and actions, 24px medium section headings. Numeric values and inputs use a monospace face with tabular-looking alignment.
- Experience hierarchy: assertive medium-weight display copy with tight leading and tracking. The preview uses `clamp(3.5rem, 5.4vw, 5.4rem)` and display type must never exceed `6rem`.
- Body copy uses restrained line lengths (`max-w-xl` or narrower), 18px type, and 32px leading in the full-screen experience.

## Spacing and structure

Use an 8px base rhythm. Keep 24–32px between parameter groups, labels directly attached to controls, and descriptions attached to headings.

- Admin: centered readable content, 32px panel padding, 32px column gap, 24px section-to-fields gap, and 16px field gaps. The editor is a fluid main column plus a `420px` sticky preview/action rail.
- Panels use 24px corner radii; fields and rectangular buttons use 12px; compact escape actions may use pill radii.
- Full-screen experience: `100vh`, horizontal padding `7vw`, vertical padding `8vh`, and a `1.1fr / 0.9fr` split. A subtle vertical divider separates content from the wheel.
- Public resume pages: a compact identity/contact header sits above a `1.08fr / 0.92fr` content-and-wheel split. The left column owns summaries or full entry content; the right column is reserved for OptionWheel navigation.

## Layers and surfaces

`DynamicBackground` owns the fixed visual stack:

1. Layer 0 — ColorBends WebGL field.
2. Layer 1 — DotField canvas/SVG response.
3. Layer 2 — readable, interactive content.

The container is isolated, clipped, and always painted with the canvas color. Effect layers are `aria-hidden` and ignore pointer events; content remains operable above them. Each effect has its own error boundary so one failed canvas cannot hide the other effect or any content.

## Controls and navigation

- Numeric controls are labeled number inputs with explicit bounds and steps, dark translucent fill, subtle border, monospace values, and a cyan focus treatment.
- Toggles are full-row labeled checkboxes. Disabled controls remain readable but visually muted.
- Color controls expose the primary accent and optional derived colors; show the current derived values as text.
- Actions communicate outcomes in a live textual status. Primary save uses a filled cyan treatment; publish, reset, and preview/exit actions use bordered treatments. Disabled actions reduce opacity.
- OptionWheel is the experience navigation primitive. It is right-aligned in the full-screen preview, supports wheel, drag, click, and arrow keys, and visually emphasizes the centered selection through weight, color, opacity, blur, and curvature. The approved behavior is draggable and non-looping; it stops at the first and last item.
- Top-level public navigation starts on internships. Detail selections update the `entry` query parameter so a recruiter can share a specific entry without losing the animated wheel interaction.

## Motion

Preserve the supplied React Bits algorithms and expose their established parameters rather than replacing their motion model.

- ColorBends supplies slow shader flow, rotation, warp, noise, parallax, and smoothed pointer influence.
- DotField supplies pointer-speed engagement, bulge/force response, glow, optional wave, and optional sparkle.
- OptionWheel eases toward the selection (`200ms` default smoothing) and snaps after wheel or drag interaction.
- Audio is off by default. Construct and play audio only when a sound URL exists.
- Respect `prefers-reduced-motion` with a legible static presentation and no reliance on animation for meaning.

## Accessibility and resilience

- Every control and keyboard-operable surface needs a visible accent-colored focus outline/ring.
- OptionWheel uses `listbox` / `option`, `aria-selected`, an accessible label, and arrow-key selection.
- Status, validation, destructive, and publishing feedback must include text and must not rely on color or motion alone.
- Decorative effects are hidden from assistive technology. Pointer-reactive layers must never intercept content interaction.
- Content must remain visible when WebGL, canvas, or either individual effect fails.
- Public phone visibility is opt-in; unpublished drafts and original resume files remain private.

## Viewport

The approved scope is desktop browsers. Design and visual QA against **1440×900** as the primary reference viewport; the full-screen preview must occupy the viewport without introducing an inset app frame.

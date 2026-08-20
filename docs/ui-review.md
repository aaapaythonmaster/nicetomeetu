# UI review baseline

This baseline records the approved design constraints before implementation. It applies to the appearance admin, its full-screen preview, and the later public resume pages.

## Mode and hierarchy
- Appearance administration is an **Operate** surface: controls favor clarity, explicit labels, status, and predictable actions.
- Full-screen preview and public pages are **Experience** surfaces: motion establishes atmosphere while resume content stays primary.
- Visual layers are fixed: ColorBends at layer 0, DotField at layer 1, readable content at layer 2.
- Each background effect has its own error boundary so one failed canvas cannot hide content or the other effect.
- Parameter controls are grouped by effect and meaning; avoid a dashboard of identical decorative cards.

## Typography
- Admin controls use a clean sans-serif hierarchy with compact labels and tabular numeric values.
- Preview copy uses an assertive display scale, capped at `6rem`, with restrained line length.
- Avoid generic gradient-filled text. Accent color is used for focus and hierarchy, not decoration on every heading.

## Color and contrast
- Base canvas: `#120f17`.
- Primary text: white; secondary text: a cool neutral with at least 4.5:1 contrast for body copy.
- Initial accent: `#06b6d4`; DotField companion colors derive from it unless override is enabled.
- Form focus, validation, and publish status must not rely on color alone.

## Spacing and structure
- Use an 8px spacing base, with 24–32px between parameter groups.
- Labels stay visually attached to their controls; section descriptions stay attached to their headings.
- The preview is genuinely full-screen. Admin forms use a readable centered measure and a persistent action area where useful.

## Focus and interaction
- Every control has a visible cyan focus outline.
- OptionWheel exposes listbox/option semantics and supports arrow-key and click selection.
- Non-looping wheels stop at the first and last option.
- Destructive or publishing actions communicate their result with text, not animation alone.

## Motion and resilience
- Preserve the supplied React Bits motion algorithms for OptionWheel, ColorBends, and DotField.
- Audio is disabled by default and must not construct an `Audio` object without a sound URL.
- Respect reduced-motion preference with a legible static presentation.
- WebGL/canvas failure must leave all content visible; effect failures are isolated by layer.
- Content remains above pointer-reactive effects and stays operable.

## Viewport
- The approved deliverable targets desktop browsers. Visual QA uses 1440×900 as the primary reference viewport.

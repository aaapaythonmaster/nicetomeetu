# Personal Resume Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a desktop-first personal resume website with two resume profiles, deterministic DOCX ingestion, admin review/publish, React Bits interactions, and downloadable PDFs.

**Architecture:** A single Next.js App Router application hosts the public site, protected admin UI, and Node.js route handlers. Supabase provides Auth, Postgres, and private Storage; public reads use RLS-filtered published records and Next.js cache tags, while publishing uses a server-only pooled Postgres transaction.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Postgres.js, Zod, JSZip, fast-xml-parser, Three.js, `@react-pdf/renderer`, dnd-kit, Vitest, Testing Library, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-17-personal-resume-site-design.md`

## Global Constraints

- Public repository: `aaapaythonmaster/nicetomeetu`; never commit `.env`, DOCX, generated PDFs, database dumps, or `.superpowers/`.
- Supported viewport: desktop only; verify at 1440px and 1920px in Chrome, Edge, and Safari.
- Public users see exactly one active profile; no public product-manager/product-operations switch.
- DOCX parsing is deterministic and local; no LLM or external document parsing API.
- Each profile has at most one draft and one published revision; publication is atomic.
- Original DOCX files stay private; public PDF responses resolve only the active published revision.
- All exposed Supabase tables have RLS; `authenticated` is not sufficient without `admin_users.user_id = auth.uid()`.
- Never expose Supabase secret/service-role keys to client code; server secrets have no `NEXT_PUBLIC_` prefix.
- `ColorBends`, `DotField`, and `OptionWheel` use the supplied React Bits source behavior, not static substitutes.
- Global motion color defaults to `#06b6d4`; Option Wheel sound is disabled.
- Full motion remains enabled; a failed background layer must not break content or navigation.
- Before building the preview UI, invoke the global `impeccable` skill and record its UI review findings.
- Use TDD for every behavior-bearing task and commit after every task passes its focused checks.

## Locked File Structure

```text
app/
  (public)/layout.tsx
  (public)/page.tsx
  (public)/internships/page.tsx
  (public)/projects/page.tsx
  (public)/campus/page.tsx
  (public)/skills/page.tsx
  admin/login/page.tsx
  admin/(protected)/layout.tsx
  admin/(protected)/page.tsx
  admin/(protected)/resumes/[profile]/page.tsx
  admin/(protected)/preview/[profile]/page.tsx
  admin/(protected)/appearance/page.tsx
  admin/(protected)/appearance/preview/page.tsx
  api/resumes/[profile]/upload/route.ts
  api/resume/pdf/route.ts
  auth/callback/route.ts
  error.tsx
  not-found.tsx
components/
  public/profile-header.tsx
  public/section-summary.tsx
  public/resume-detail.tsx
  react-bits/option-wheel.tsx
  react-bits/option-wheel.css
  react-bits/color-bends.tsx
  react-bits/color-bends.css
  react-bits/dot-field.tsx
  react-bits/dot-field.css
  visual/dynamic-background.tsx
  admin/resume-editor.tsx
  admin/appearance-editor.tsx
src/
  env.ts
  lib/supabase/client.ts
  lib/supabase/server.ts
  lib/supabase/admin.ts
  lib/postgres.ts
  features/resume/contracts.ts
  features/resume/queries.ts
  features/resume/actions.ts
  features/resume/fixtures.ts
  features/docx/extract-document.ts
  features/docx/parse-resume.ts
  features/docx/validation.ts
  features/docx/duplicate-detection.ts
  features/publishing/publish-revision.ts
  features/publishing/actions.ts
  features/pdf/resume-document.tsx
  features/pdf/render-pdf.ts
  features/appearance/contracts.ts
  features/appearance/colors.ts
  features/appearance/queries.ts
supabase/
  migrations/0001_resume_schema.sql
  migrations/0002_rls_and_storage.sql
  seed.sql
tests/
  fixtures/resume-ai-operations.docx
  fixtures/resume-missing-section.docx
  unit/**/*.test.ts(x)
  integration/**/*.test.ts
  e2e/*.spec.ts
proxy.ts
vitest.config.ts
playwright.config.ts
.env.example
vercel.json
```

## Shared Interfaces

```ts
export type ProfileSlug = 'product-manager' | 'product-operations';
export type SectionKind = 'education' | 'internships' | 'projects' | 'skills' | 'self-evaluation' | 'campus';

export interface DocumentBlock {
  index: number;
  kind: 'paragraph' | 'table-row';
  text: string;
  cells?: string[];
}

export interface ResumeEntryDraft {
  id?: number;
  section: SectionKind;
  title: string;
  wheelLabel: string;
  organization?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  metrics: string[];
  position: number;
  visible: boolean;
}

export interface ParsedResume {
  schemaVersion: 1;
  identity: { name: string; email: string; phone?: string; school?: string; targetRole: string };
  sections: Array<{ kind: SectionKind; summary: string; position: number; entries: ResumeEntryDraft[] }>;
  issues: ParseIssue[];
}

export interface ParseIssue {
  code: 'missing-section' | 'unknown-paragraph' | 'duplicate-entry' | 'invalid-date';
  severity: 'warning' | 'blocking';
  message: string;
  entryIndexes?: number[];
}

export interface AppearanceSettings {
  primaryColor: string;
  derivedColorOverride: boolean;
  derivedColors?: { light: string; dark: string };
  colorBends: ColorBendsSettings;
  dotField: DotFieldSettings;
  optionWheel: OptionWheelSettings;
}

export interface ColorBendsSettings {
  rotation: number;
  autoRotate: number;
  speed: number;
  scale: number;
  frequency: number;
  warpStrength: number;
  mouseInfluence: number;
  parallax: number;
  noise: number;
  iterations: number;
  intensity: number;
  bandWidth: number;
  transparent: boolean;
}

export interface DotFieldSettings {
  dotRadius: number;
  dotSpacing: number;
  cursorRadius: number;
  cursorForce: number;
  bulgeOnly: boolean;
  bulgeStrength: number;
  glowRadius: number;
  waveAmplitude: number;
  sparkle: boolean;
  glowColor: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export interface OptionWheelSettings {
  fontSize: number;
  spacing: number;
  curve: number;
  blur: number;
  fade: number;
  tilt: number;
  minOpacity: number;
  smoothing: number;
  inset: number;
  loop: false;
  draggable: true;
}

export interface PublishedSiteData {
  profile: ProfileSlug;
  identity: ParsedResume['identity'] & { showPhone: boolean };
  sections: ParsedResume['sections'];
  appearance: AppearanceSettings;
  pdfAvailable: boolean;
}
```

---

### Task 1: Bootstrap the Next.js application and test harness

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/(public)/page.tsx`
- Create: `src/env.ts`, `.env.example`, `vitest.config.ts`, `playwright.config.ts`
- Test: `tests/unit/env.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `env` validated by Zod with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DATABASE_URL`.

- [ ] **Step 1: Scaffold the project without overwriting docs**

Run:

```bash
bootstrap_dir=$(mktemp -d /tmp/nicetomeetu-next.XXXXXX)
pnpm create next-app@latest "$bootstrap_dir" --ts --tailwind --eslint --app --src-dir=false --import-alias='@/*' --use-pnpm
rsync -a --exclude='.git' --exclude='.gitignore' "$bootstrap_dir"/ ./
pnpm add zod server-only
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

Expected: existing `docs/` and `.gitignore` remain; Next.js files and lockfile are created. Do not copy or commit the temporary scaffold's Git metadata.

- [ ] **Step 2: Write failing environment validation and smoke tests**

```ts
// tests/unit/env.test.ts
import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/src/env';

describe('parseEnv', () => {
  it('rejects a missing server secret', () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' })).toThrow('SUPABASE_SECRET_KEY');
  });
});
```

```ts
// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';
test('renders the unpublished state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '个人主页尚未发布' })).toBeVisible();
});
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run: `pnpm vitest run tests/unit/env.test.ts`

Expected: FAIL because `src/env.ts` does not exist.

- [ ] **Step 4: Implement `parseEnv`, base layout, and unpublished page**

```ts
// src/env.ts
import { z } from 'zod';
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_DATABASE_URL: z.string().min(1),
});
export const parseEnv = (value: unknown) => schema.parse(value);
```

Add scripts: `test`, `test:unit`, `test:integration`, `test:e2e`, `typecheck`, and `lint`. Enable `cacheComponents: true` in `next.config.ts`. Make `/` render the exact unpublished heading used by the test.

- [ ] **Step 5: Verify foundation**

Run: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.mjs app src/env.ts tests vitest.config.ts playwright.config.ts .env.example
git commit -m "chore: bootstrap resume site"
```

### Task 2: Define resume and appearance domain contracts

**Files:**
- Create: `src/features/resume/contracts.ts`, `src/features/appearance/contracts.ts`, `src/features/appearance/colors.ts`, `src/features/resume/fixtures.ts`
- Test: `tests/unit/contracts.test.ts`, `tests/unit/appearance-colors.test.ts`

**Interfaces:**
- Produces: `ProfileSlug`, `SectionKind`, `ParsedResume`, `ParseIssue`, `AppearanceSettings`, `DEFAULT_APPEARANCE`, `deriveMotionColors(primary)`.

- [ ] **Step 1: Write failing contract/default tests**

```ts
it('derives both dot colors from the primary color', () => {
  expect(deriveMotionColors('#06b6d4')).toEqual({ light: '#51cce1', dark: '#09879f' });
});

it('locks the approved defaults', () => {
  expect(DEFAULT_APPEARANCE.colorBends).toMatchObject({ rotation: 60, speed: 0.2, intensity: 1.3, bandWidth: 1 });
  expect(DEFAULT_APPEARANCE.dotField).toMatchObject({ dotRadius: 1.5, dotSpacing: 14, cursorRadius: 500, bulgeStrength: 67 });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `pnpm vitest run tests/unit/contracts.test.ts tests/unit/appearance-colors.test.ts`

Expected: FAIL on missing exports.

- [ ] **Step 3: Implement Zod schemas and exact defaults**

Use the Shared Interfaces above. Lock these values in `DEFAULT_APPEARANCE`: `primaryColor: '#06b6d4'`; ColorBends `rotation: 60`, `autoRotate: 0`, `speed: 0.2`, `scale: 1`, `frequency: 1`, `warpStrength: 1`, `mouseInfluence: 1`, `parallax: 0.5`, `noise: 0.15`, `iterations: 1`, `intensity: 1.3`, `bandWidth: 1`, `transparent: true`; DotField `dotRadius: 1.5`, `dotSpacing: 14`, `cursorRadius: 500`, `cursorForce: 0.1`, `bulgeOnly: true`, `bulgeStrength: 67`, `glowRadius: 160`, `sparkle: false`, `waveAmplitude: 0`, `glowColor: '#120f17'`; OptionWheel `fontSize: 3`, `spacing: 1.4`, `curve: 1`, `tilt: 6`, `blur: 2`, `fade: 0.25`, `minOpacity: 0.05`, `smoothing: 200`, `inset: 80`, `loop: false`, `draggable: true`. Sound remains absent from persisted settings and the component receives an empty `soundUrl`.

Implement `deriveMotionColors` by linear sRGB mixing: light = 70% primary + 30% white; dark = 72% primary + 28% `#120f17`. Validate `ProfileSlug`, section kinds, hex colors, positions, and all numeric visual ranges.

- [ ] **Step 4: Verify contracts**

Run: `pnpm vitest run tests/unit/contracts.test.ts tests/unit/appearance-colors.test.ts && pnpm typecheck`

Expected: PASS and no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/features tests/unit/contracts.test.ts tests/unit/appearance-colors.test.ts
git commit -m "feat: define resume and appearance contracts"
```

### Task 3: Create the Supabase schema, RLS, Storage policies, and clients

**Files:**
- Create: `supabase/migrations/0001_resume_schema.sql`, `supabase/migrations/0002_rls_and_storage.sql`, `supabase/seed.sql`
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/postgres.ts`, `proxy.ts`
- Test: `tests/integration/database-policies.test.ts`

**Interfaces:**
- Produces: `createBrowserClient()`, `createServerClient()`, `createAdminClient()` (server-only), `sql` pooled Postgres client, and tables named in the spec.

- [ ] **Step 1: Write policy integration cases before the migration**

Cover these exact assertions in `database-policies.test.ts`: anon can select only the active published revision; anon cannot select drafts or `admin_users`; a non-admin authenticated user cannot insert/update/delete; the allowlisted admin can CRUD drafts; original DOCX objects cannot be selected anonymously.

- [ ] **Step 2: Create the schema migration**

Use `bigint generated always as identity`, `timestamptz`, indexed foreign keys, and checks. Use `resume_profiles.slug` check values `product-manager`/`product-operations` and revision status values `draft`/`published`/`archived`; unique partial indexes enforce one `draft` and one `published` revision per profile. Store entry content as versioned `jsonb` with `content_schema_version = 1` while keeping status, position, visibility, and relations normalized.

- [ ] **Step 3: Create RLS and Storage migration**

Enable and force RLS on every public table. Policies must use `(select auth.uid())` and `exists(select 1 from admin_users ...)`; admin UPDATE policies include both `using` and `with check`. Create private buckets `resume-source` and `resume-pdf`; grant admin INSERT/SELECT/UPDATE/DELETE, and no anon access. Public PDF delivery remains through the app route.

- [ ] **Step 4: Add Supabase clients and protected-route proxy**

`client.ts` uses publishable values only. `server.ts` uses cookies and `@supabase/ssr`. `admin.ts` begins with `import 'server-only'` and consumes `SUPABASE_SECRET_KEY`. The Next.js 16 `proxy.ts` refreshes sessions and redirects unauthenticated `/admin/*` except `/admin/login`.

- [ ] **Step 5: Apply and verify migrations**

Run the Supabase skill workflow: check the changelog, discover CLI commands with `--help`, apply SQL through the connected Supabase tool, run database advisors, then run `pnpm vitest run tests/integration/database-policies.test.ts`.

Expected: advisors have no unresolved security errors; all role cases pass.

- [ ] **Step 6: Commit**

```bash
git add supabase src/lib proxy.ts tests/integration/database-policies.test.ts
git commit -m "feat: add secure resume data model"
```

### Task 4: Build the deterministic DOCX extraction and parser

**Files:**
- Create: `src/features/docx/extract-document.ts`, `parse-resume.ts`, `validation.ts`, `duplicate-detection.ts`
- Create: `tests/fixtures/resume-ai-operations.docx`, `tests/fixtures/resume-missing-section.docx`
- Test: `tests/unit/docx-parser.test.ts`, `tests/unit/duplicate-detection.test.ts`

**Interfaces:**
- Consumes: `ParsedResume`, `ResumeEntryDraft`, `ParseIssue`.
- Produces: `extractDocument(buffer: Buffer): Promise<DocumentBlock[]>`, `parseResume(blocks: DocumentBlock[], profile: ProfileSlug): ParsedResume`, `findDuplicates(entries): ParseIssue[]`.

- [ ] **Step 1: Add sanitized fixtures**

Copy the approved AI-operations DOCX into `tests/fixtures` after replacing phone/email with fixture values. Create the missing-section fixture by removing the campus heading. Do not commit the user's original file.

- [ ] **Step 2: Write failing parser tests**

Assert the fixture yields six section kinds, five internship roles, the short labels `AI 产品经理`, `AI 应用`, `AI 业务提效`, `数据运营`, `数据资产`, and a `duplicate-entry` issue for the repeated contract project. Assert missing campus produces a blocking `missing-section` issue.

- [ ] **Step 3: Verify tests fail**

Run: `pnpm vitest run tests/unit/docx-parser.test.ts tests/unit/duplicate-detection.test.ts`

Expected: FAIL on missing parser exports.

- [ ] **Step 4: Implement OOXML extraction**

Install `jszip` and `fast-xml-parser`. Read `word/document.xml`; preserve ordered paragraphs and table cells; normalize full-width punctuation and whitespace without rewriting content. Reject non-ZIP data and archives without `word/document.xml`.

- [ ] **Step 5: Implement section parsing, summaries, dates, and duplicate detection**

Use explicit heading aliases from the fixture, deterministic internship header patterns, and normalized similarity over title plus bullets. Similarity at or above `0.92` creates a warning and never deletes an entry. Generate summaries from entry count, first complete sentence, and up to three extracted numeric metrics.

- [ ] **Step 6: Verify parser**

Run: `pnpm vitest run tests/unit/docx-parser.test.ts tests/unit/duplicate-detection.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/docx tests/fixtures tests/unit/docx-parser.test.ts tests/unit/duplicate-detection.test.ts package.json pnpm-lock.yaml
git commit -m "feat: parse fixed-format resume documents"
```

### Task 5: Implement admin authentication, upload, and resume editing

**Files:**
- Create: `app/admin/login/page.tsx`, `app/admin/(protected)/layout.tsx`, `app/admin/(protected)/page.tsx`
- Create: `app/admin/(protected)/resumes/[profile]/page.tsx`, `app/api/resumes/[profile]/upload/route.ts`
- Create: `components/admin/resume-editor.tsx`, `src/features/resume/actions.ts`, `src/features/resume/queries.ts`
- Test: `tests/unit/upload-validation.test.ts`, `tests/integration/admin-upload.test.ts`, `tests/e2e/admin-login.spec.ts`

**Interfaces:**
- Consumes: `parseResume`, Supabase clients, `ProfileSlug`.
- Produces: `validateResumeUpload(file): Promise<void>`, `createDraftFromUpload(profile, file, userId): Promise<{revisionId:number}>`, `saveDraft(input): Promise<void>`.

- [ ] **Step 1: Write failing upload and authorization tests**

Test rejection of non-DOCX, wrong MIME, files over 8 MiB, non-admin users, and malformed OOXML. Test that an existing published revision remains unchanged after parse failure.

- [ ] **Step 2: Implement login and admin guard**

Use `signInWithPassword`; do not render sign-up. Protected layout verifies both the Supabase user and `admin_users` membership. Render profile cards showing draft/published state and active profile.

- [ ] **Step 3: Implement upload route**

Validate `profile`, authentication, extension, MIME, size, and archive. Upload the source to `resume-source/{profile}/{revisionId}/source.docx`; parse before writing sections/entries/issues in one draft creation flow. On failure, record the upload error without replacing the existing draft pointer.

- [ ] **Step 4: Implement editor behavior**

Install dnd-kit. Support text edits, summary edits, wheel-label edits, item visibility, phone visibility, issue acknowledgement, and integer reorder. Save only to draft records; never alter Storage source objects.

- [ ] **Step 5: Verify admin workflow**

Run: `pnpm vitest run tests/unit/upload-validation.test.ts tests/integration/admin-upload.test.ts && pnpm playwright test tests/e2e/admin-login.spec.ts`

Expected: PASS; unauthenticated `/admin` redirects to login.

- [ ] **Step 6: Commit**

```bash
git add app/admin app/api/resumes components/admin src/features/resume tests package.json pnpm-lock.yaml
git commit -m "feat: add resume upload and review workflow"
```

### Task 6: Integrate React Bits components and appearance management

**Files:**
- Create: `components/react-bits/*`, `components/visual/dynamic-background.tsx`
- Create: `components/admin/appearance-editor.tsx`, `app/admin/(protected)/appearance/page.tsx`, `app/admin/(protected)/appearance/preview/page.tsx`
- Create: `src/features/appearance/queries.ts`, `src/features/publishing/actions.ts`
- Test: `tests/unit/option-wheel.test.tsx`, `tests/unit/dynamic-background.test.tsx`, `tests/integration/appearance-publish.test.ts`

**Interfaces:**
- Consumes: `AppearanceSettings`, `DEFAULT_APPEARANCE`, Supabase clients.
- Produces: `<OptionWheel items defaultSelected onChange ... />`, `<DynamicBackground settings />`, `saveAppearanceDraft`, `publishAppearanceDraft`.

- [ ] **Step 1: Invoke `impeccable` before UI work**

Read the skill fully, record the selected hierarchy, typography, contrast, spacing, focus, and motion decisions in `docs/ui-review.md`, and keep the React Bits purple-black character without copying page content.

- [ ] **Step 2: Write failing component tests**

Test listbox semantics, arrow-key selection, click selection, no audio construction, default non-looping boundaries, color derivation, and that a mocked ColorBends render failure leaves children visible.

- [ ] **Step 3: Integrate the supplied component sources**

Port OptionWheel, ColorBends, and DotField to typed client components without changing their motion algorithms. Install `three`. Isolate each background in an error boundary; layer ColorBends below DotField and content above both.

- [ ] **Step 4: Build appearance editor and preview**

Render controls for every approved numeric/boolean setting, global color, advanced derived-color override, reset-to-default, and full-screen preview. Saving writes `draft`; the authenticated Server Action copies a validated draft to `published` and calls `updateTag('appearance')` so the next public read is immediately fresh.

- [ ] **Step 5: Verify appearance behavior**

Run: `pnpm vitest run tests/unit/option-wheel.test.tsx tests/unit/dynamic-background.test.tsx tests/integration/appearance-publish.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components src/features/appearance src/features/publishing/actions.ts app/admin docs/ui-review.md tests package.json pnpm-lock.yaml
git commit -m "feat: add configurable React Bits visual system"
```

### Task 7: Build the public homepage and four detail pages

**Files:**
- Create: `app/(public)/layout.tsx`, `internships/page.tsx`, `projects/page.tsx`, `campus/page.tsx`, `skills/page.tsx`
- Modify: `app/(public)/page.tsx`
- Create: `components/public/profile-header.tsx`, `section-summary.tsx`, `resume-detail.tsx`
- Modify: `src/features/resume/queries.ts`, `app/globals.css`
- Test: `tests/unit/public-mapping.test.ts`, `tests/e2e/public-navigation.spec.ts`

**Interfaces:**
- Consumes: `getPublishedSiteData(): Promise<PublishedSiteData | null>`, `OptionWheel`, `DynamicBackground`.
- Produces: public routes with tagged cache `resume:published` and `appearance`.

- [ ] **Step 1: Write failing mapping and navigation tests**

Assert hidden entries/phone never appear, internships are the default homepage selection, each top-level selection changes the left summary, clicking the summary navigates, and each detail wheel changes left-side content while preserving a shareable route.

- [ ] **Step 2: Implement cached published query**

Read only the `active_profile` published revision and visible ordered sections/entries. Return `null` for no publication. Put `'use cache'` inside the cached query and call `cacheLife('max')`, `cacheTag('resume:published')`, and `cacheTag('appearance')` so Vercel can reuse the last generated response.

- [ ] **Step 3: Implement public shell and homepage**

Create the header with name, target role, school, email, conditional phone, and PDF link. Use desktop two-column layout: summary left, top-level OptionWheel right; initial index points to internships.

- [ ] **Step 4: Implement reusable detail page**

`ResumeDetail` accepts `kind`, maps entries to wheel labels, and renders complete structured content on the left. Each route selects its fixed `SectionKind`; all include a return-home link.

- [ ] **Step 5: Verify public pages**

Run: `pnpm vitest run tests/unit/public-mapping.test.ts && pnpm playwright test tests/e2e/public-navigation.spec.ts && pnpm build`

Expected: PASS and all five public routes build.

- [ ] **Step 6: Commit**

```bash
git add app components/public src/features/resume/queries.ts tests
git commit -m "feat: build animated public resume experience"
```

### Task 8: Generate PDFs and implement atomic publication

**Files:**
- Create: `src/features/pdf/resume-document.tsx`, `src/features/pdf/render-pdf.ts`, `src/features/publishing/publish-revision.ts`
- Create: `app/api/resume/pdf/route.ts`
- Modify: `src/features/publishing/actions.ts`
- Test: `tests/unit/pdf-document.test.tsx`, `tests/integration/publish-revision.test.ts`, `tests/integration/pdf-route.test.ts`

**Interfaces:**
- Produces: `renderResumePdf(data): Promise<Buffer>`, `publishRevision({profile, revisionId, userId}): Promise<void>`.

- [ ] **Step 1: Write failing PDF and publication tests**

Assert hidden entries and phone are omitted; visible order matches draft; publish rejects blocking issues or missing PDF; concurrent requests leave one active revision; `/api/resume/pdf` ignores path input and serves only the active PDF.

- [ ] **Step 2: Implement PDF rendering**

Install `@react-pdf/renderer`. Register a checked-in open-source Simplified Chinese font with license notice. Render identity, education, visible entries, skills, and campus in a print-first hierarchy. Store output at `resume-pdf/{profile}/{revisionId}/resume.pdf`.

- [ ] **Step 3: Implement publication transaction**

Use server-only Postgres.js with the Supabase pooled connection. In one transaction: acquire an advisory lock, verify admin ID and revision ownership, verify no blocking issues and ready PDF, mark the previous published revision `archived`, promote the selected draft to `published`, set exactly one `active_profile`, and leave source/PDF files privately retained. Roll back on any failure.

- [ ] **Step 4: Implement the publication action, PDF route, and cache invalidation**

The authenticated publication Server Action derives `userId` from the session, never from form input. On commit, call `updateTag('resume:published')`. The PDF route queries the active published file and streams bytes with `Content-Type: application/pdf` and a safe filename.

- [ ] **Step 5: Verify publication and PDF**

Run: `pnpm vitest run tests/unit/pdf-document.test.tsx tests/integration/publish-revision.test.ts tests/integration/pdf-route.test.ts`

Expected: PASS, including rollback and concurrent cases.

- [ ] **Step 6: Commit**

```bash
git add src/features/pdf src/features/publishing app/api/resume tests package.json pnpm-lock.yaml public/fonts
git commit -m "feat: publish resumes with downloadable PDFs"
```

### Task 9: Complete preview, error states, and full local verification

**Files:**
- Create: `app/admin/(protected)/preview/[profile]/page.tsx`, `app/error.tsx`, `app/not-found.tsx`
- Create: `tests/e2e/admin-resume-flow.spec.ts`, `tests/e2e/appearance-flow.spec.ts`, `tests/e2e/public-privacy.spec.ts`
- Modify: `playwright.config.ts`, `README.md`

**Interfaces:**
- Consumes all prior public/admin interfaces.
- Produces a complete local acceptance flow and operating instructions.

- [ ] **Step 1: Write end-to-end acceptance tests**

Automate: login; upload sanitized fixture; see duplicate warning; edit summary/wheel label; reorder/hide; preview; generate PDF; publish; open an anonymous context; verify active profile, hidden phone, detail navigation, and PDF download. Add a separate appearance draft/preview/publish test.

- [ ] **Step 2: Implement preview and explicit error states**

Preview renders the draft through the same public components without publishing. Add retryable upload/parse/PDF errors, unpublished state, 404, route-level error boundary, and background-layer isolation. Preserve form state after recoverable failures.

- [ ] **Step 3: Document local operation**

README includes pnpm commands, Supabase setup, administrator bootstrap, required environment variables, migration workflow, local test workflow, and the exact publish flow. Do not include real secrets or personal files.

- [ ] **Step 4: Run the complete local gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
pnpm test:e2e
```

Expected: all exit 0; no unhandled browser console errors.

- [ ] **Step 5: Commit**

```bash
git add app tests playwright.config.ts README.md
git commit -m "test: cover complete resume publishing flow"
```

### Task 10: Connect GitHub, Supabase, and Vercel; deploy and verify production

**Files:**
- Create: `vercel.json`
- Modify: `.env.example`, `README.md`
- Test: production smoke and full-story verification evidence in `docs/verification/production.md`

**Interfaces:**
- Produces: a public Vercel deployment and verified admin/public workflow.

- [ ] **Step 1: Read required deployment skills and current docs**

Use `vercel:bootstrap`, `vercel:env-vars`, `vercel:deployments-cicd`, `vercel:verification`, `supabase:supabase`, and `github:yeet`. Verify current Vercel/Supabase changelogs before mutating external resources.

- [ ] **Step 2: Push an implementation branch and open a draft PR**

Run the `github:yeet` workflow: confirm diff, push a named branch, and open a draft PR against `main`. Do not push secrets or fixture PII.

- [ ] **Step 3: Provision and link Supabase**

Use the connected Supabase plugin to apply migrations, create private buckets, create the one admin Auth user, insert its UID into `admin_users`, run advisors, and execute policy tests against the linked project.

- [ ] **Step 4: Link Vercel and configure environments**

Connect the GitHub repository. Set publishable variables for Preview/Production and server secrets only for server runtimes. Confirm the generated Vercel project is personal/non-commercial and uses the intended Supabase project.

- [ ] **Step 5: Deploy preview and run full-story verification**

Deploy the draft PR preview. Use the browser verification skill to test 1440px and 1920px: login, fixture upload, duplicate warning, preview, publish, public Option Wheels, both background layers, privacy, PDF, console, and network failures.

- [ ] **Step 6: Promote and verify production**

After preview passes, promote the saved deployment. Repeat public smoke tests in a clean browser context; verify `/admin` is protected and the PDF response is correct. Record URLs, commit SHA, test results, and any accepted limitations in `docs/verification/production.md`.

- [ ] **Step 7: Final verification commit**

```bash
git add vercel.json .env.example README.md docs/verification/production.md
git commit -m "docs: record production deployment verification"
```

## Final Completion Gate

Before claiming completion, invoke `superpowers:verification-before-completion`, run the full local gate again, confirm Supabase advisors, confirm the Vercel production deployment is healthy, and verify the exact user journey from login through public PDF download. Then invoke `superpowers:requesting-code-review`; resolve all findings before using `superpowers:finishing-a-development-branch`.

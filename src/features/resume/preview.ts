import "server-only";

import { getAppearanceDraft } from "@/src/features/appearance/queries";
import { hasSupabasePublicConfig } from "./auth";
import type { ProfileSlug } from "./contracts";
import { createPublicFixture, mapDraftPreview } from "./public-mapping";
import { getDraftEditor } from "./queries";

export async function getDraftPreviewData(profile: ProfileSlug) {
  if (!hasSupabasePublicConfig()) return { ...createPublicFixture(), profile };
  const [draft, appearance] = await Promise.all([getDraftEditor(profile), getAppearanceDraft()]);
  return draft ? mapDraftPreview(draft, appearance.settings) : null;
}

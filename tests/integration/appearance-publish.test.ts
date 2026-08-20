import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { DEFAULT_APPEARANCE } from "@/src/features/appearance/contracts";
import { publishAppearanceWithRepository } from "@/src/features/publishing/actions";

describe("appearance publishing", () => {
  it("validates and atomically promotes the draft", async () => {
    const repository = {
      publishDraft: vi.fn().mockResolvedValue({ id: 12 }),
    };

    await expect(
      publishAppearanceWithRepository(
        { settings: DEFAULT_APPEARANCE, userId: "admin-1" },
        repository,
      ),
    ).resolves.toEqual({ id: 12 });

    expect(repository.publishDraft).toHaveBeenCalledWith({
      settings: DEFAULT_APPEARANCE,
      userId: "admin-1",
    });
  });

  it("rejects an invalid draft before the repository writes", async () => {
    const repository = { publishDraft: vi.fn() };
    const invalid = {
      ...DEFAULT_APPEARANCE,
      colorBends: { ...DEFAULT_APPEARANCE.colorBends, iterations: 99 },
    };

    await expect(
      publishAppearanceWithRepository(
        { settings: invalid, userId: "admin-1" },
        repository,
      ),
    ).rejects.toThrow();
    expect(repository.publishDraft).not.toHaveBeenCalled();
  });
});

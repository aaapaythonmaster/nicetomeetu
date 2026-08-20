import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { publishRevisionWithRepository } from "@/src/features/publishing/publish-revision";

describe("resume publication", () => {
  it("rejects blocking issues before commit", async () => {
    const repository = { inspect: vi.fn().mockResolvedValue({ ownsDraft: true, blockingIssues: 1, pdfReady: true }), commit: vi.fn() };
    await expect(publishRevisionWithRepository({ profile: "product-manager", revisionId: 3, userId: "admin" }, repository)).rejects.toThrow(/阻塞/);
    expect(repository.commit).not.toHaveBeenCalled();
  });

  it("rejects publication without a ready PDF", async () => {
    const repository = { inspect: vi.fn().mockResolvedValue({ ownsDraft: true, blockingIssues: 0, pdfReady: false, pdfMatchesDraft: false }), commit: vi.fn() };
    await expect(publishRevisionWithRepository({ profile: "product-manager", revisionId: 3, userId: "admin" }, repository)).rejects.toThrow(/PDF/);
    expect(repository.commit).not.toHaveBeenCalled();
  });

  it("rejects a PDF generated from an older draft state", async () => {
    const repository = { inspect: vi.fn().mockResolvedValue({ ownsDraft: true, blockingIssues: 0, pdfReady: true, pdfMatchesDraft: false }), commit: vi.fn() };
    await expect(publishRevisionWithRepository({ profile: "product-manager", revisionId: 3, userId: "admin" }, repository)).rejects.toThrow(/草稿.*变化/);
    expect(repository.commit).not.toHaveBeenCalled();
  });

  it("delegates the final state change to one atomic repository commit", async () => {
    const repository = { inspect: vi.fn().mockResolvedValue({ ownsDraft: true, blockingIssues: 0, pdfReady: true, pdfMatchesDraft: true }), commit: vi.fn().mockResolvedValue(undefined) };
    await publishRevisionWithRepository({ profile: "product-manager", revisionId: 3, userId: "admin" }, repository);
    expect(repository.commit).toHaveBeenCalledOnce();
  });
});

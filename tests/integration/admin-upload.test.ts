import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { processResumeUpload } from "@/src/features/resume/upload";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function fixtureFile() {
  const content = await readFile(
    resolve(process.cwd(), "tests/fixtures/resume-ai-operations.docx"),
  );
  return new File([content], "resume.docx", { type: DOCX_MIME });
}

describe("admin resume upload orchestration", () => {
  it("parses before replacing the draft", async () => {
    const replaceDraft = vi.fn().mockResolvedValue({ revisionId: 42 });

    await expect(
      processResumeUpload(
        {
          file: await fixtureFile(),
          profile: "product-manager",
          userId: "00000000-0000-4000-8000-000000000001",
        },
        { replaceDraft },
      ),
    ).resolves.toEqual({ revisionId: 42 });

    expect(replaceDraft).toHaveBeenCalledOnce();
    expect(replaceDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        parsed: expect.objectContaining({ schemaVersion: 1 }),
      }),
    );
  });

  it("leaves the published revision untouched when parsing fails", async () => {
    const published = { revisionId: 7, status: "published" };
    const replaceDraft = vi.fn().mockImplementation(() => {
      throw new Error("should not write");
    });
    const recordFailure = vi.fn().mockResolvedValue(undefined);
    const malformed = new File(["not-a-zip"], "resume.docx", {
      type: DOCX_MIME,
    });

    await expect(
      processResumeUpload(
        {
          file: malformed,
          profile: "product-manager",
          userId: "00000000-0000-4000-8000-000000000001",
        },
        { replaceDraft, recordFailure },
      ),
    ).rejects.toThrow(/ZIP|OOXML/);

    expect(replaceDraft).not.toHaveBeenCalled();
    expect(recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.stringMatching(/ZIP|OOXML/),
        profile: "product-manager",
      }),
    );
    expect(published).toEqual({ revisionId: 7, status: "published" });
  });
});

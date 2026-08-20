import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateResumeUpload } from "@/src/features/resume/upload";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function fixtureFile() {
  const content = await readFile(
    resolve(process.cwd(), "tests/fixtures/resume-ai-operations.docx"),
  );
  return new File([content], "resume.docx", { type: DOCX_MIME });
}

describe("resume upload validation", () => {
  it("accepts a valid DOCX archive", async () => {
    await expect(validateResumeUpload(await fixtureFile())).resolves.toBeUndefined();
  });

  it.each([
    ["resume.pdf", DOCX_MIME, "DOCX"],
    ["resume.docx", "application/pdf", "MIME"],
  ])("rejects invalid name or MIME: %s", async (name, type, message) => {
    await expect(
      validateResumeUpload(new File(["invalid"], name, { type })),
    ).rejects.toThrow(message);
  });

  it("rejects files over 8 MiB", async () => {
    const oversized = new File(
      [new Uint8Array(8 * 1024 * 1024 + 1)],
      "resume.docx",
      { type: DOCX_MIME },
    );

    await expect(validateResumeUpload(oversized)).rejects.toThrow("8 MiB");
  });

  it("rejects malformed OOXML", async () => {
    const malformed = new File(["not-a-zip"], "resume.docx", {
      type: DOCX_MIME,
    });

    await expect(validateResumeUpload(malformed)).rejects.toThrow(/ZIP|OOXML/);
  });
});

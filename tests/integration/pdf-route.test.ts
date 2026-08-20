import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { serveActiveResumePdf } from "@/app/api/resume/pdf/route";

describe("active PDF route", () => {
  it("serves only the active published PDF and ignores request path input", async () => {
    const loadActivePdf = vi.fn().mockResolvedValue({ bytes: new Uint8Array([37, 80, 68, 70]), filename: "candidate-resume.pdf" });
    const response = await serveActiveResumePdf(new Request("http://site.test/api/resume/pdf?path=other-user/private.pdf"), { loadActivePdf });

    expect(loadActivePdf).toHaveBeenCalledWith();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("candidate-resume.pdf");
  });
});

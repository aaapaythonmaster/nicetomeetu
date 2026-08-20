import { describe, expect, it } from "vitest";

import { parseEnv } from "@/src/env";

describe("parseEnv", () => {
  it("accepts the POSTGRES_URL supplied by the Vercel Supabase integration", () => {
    expect(parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_SECRET_KEY: "secret-key",
      POSTGRES_URL: "postgresql://example.test/database",
    }).POSTGRES_URL).toContain("postgresql://");
  });

  it("rejects a missing server secret", () => {
    expect(() =>
      parseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_DATABASE_URL: "postgresql://example.test/database",
      }),
    ).toThrow("SUPABASE_SECRET_KEY");
  });
});

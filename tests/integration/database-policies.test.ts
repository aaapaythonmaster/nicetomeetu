import { readFile } from "node:fs/promises";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

describe.skipIf(!databaseUrl)("database policies", () => {
  it("enforces public, non-admin, admin, and private-file boundaries", async () => {
    const sql = postgres(databaseUrl!, { max: 1, prepare: false });
    const policyTest = await readFile(
      new URL("./database-policies.sql", import.meta.url),
      "utf8",
    );

    try {
      await expect(sql.unsafe(policyTest)).resolves.toBeDefined();
    } finally {
      await sql.end();
    }
  });
});

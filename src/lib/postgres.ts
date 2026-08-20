import "server-only";

import postgres, { type Sql } from "postgres";

let databaseClient: Sql | undefined;

export function getDatabaseClient() {
  if (!databaseClient) {
    const databaseUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!databaseUrl) throw new Error("缺少 Supabase 数据库连接地址。");
    databaseClient = postgres(databaseUrl, {
      connect_timeout: 10,
      idle_timeout: 20,
      max: 3,
      prepare: false,
    });
  }

  return databaseClient;
}

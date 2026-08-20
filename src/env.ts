import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_DATABASE_URL: z.string().min(1).optional(),
  POSTGRES_URL: z.string().min(1).optional(),
}).refine((value) => value.SUPABASE_DATABASE_URL || value.POSTGRES_URL, {
  message: "SUPABASE_DATABASE_URL or POSTGRES_URL is required",
  path: ["SUPABASE_DATABASE_URL"],
});

export function parseEnv(value: unknown) {
  return environmentSchema.parse(value);
}

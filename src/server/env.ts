import "server-only";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  AI_MODE: z.enum(["mock", "live"]).default("mock"),
  DATA_DIR: z.string().trim().min(1).default("./data"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(500).default(50),
});

export type Env = z.infer<typeof envSchema> & {
  /** Absolute path of DATA_DIR. */
  dataDir: string;
  /** Absolute path of the uploads folder inside DATA_DIR. */
  uploadsDir: string;
  /** Absolute path of the SQLite database file. */
  dbFile: string;
};

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Fail fast with a readable message instead of a crash deep inside a request.
    throw new Error(`Invalid environment configuration (check .env.local):\n${issues}`);
  }
  // turbopackIgnore: DATA_DIR is runtime-only; without it, output tracing copies the whole repo.
  const dataDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), parsed.data.DATA_DIR);
  return {
    ...parsed.data,
    dataDir,
    uploadsDir: path.join(/*turbopackIgnore: true*/ dataDir, "uploads"),
    dbFile: path.join(/*turbopackIgnore: true*/ dataDir, "app.db"),
  };
}

export const env: Env = loadEnv();

export const isApiKeyConfigured = (): boolean => Boolean(env.ANTHROPIC_API_KEY);

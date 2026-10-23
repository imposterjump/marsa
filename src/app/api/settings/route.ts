import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { env, isApiKeyConfigured } from "@/server/env";
import {
  getSettings,
  settingsPatchSchema,
  updateSettings,
  type SettingsRow,
} from "@/server/services/settings";
import type { SettingsDto } from "@/lib/api-types";
import { APP_NAME } from "@/lib/brand";

function toDto({ id: _id, ...row }: SettingsRow): SettingsDto {
  return {
    ...row,
    appName: APP_NAME,
    runtime: {
      aiMode: env.AI_MODE,
      apiKeyConfigured: isApiKeyConfigured(),
      maxUploadMb: env.MAX_UPLOAD_MB,
    },
  };
}

export const GET = withErrors(async () => {
  await connection(); // HANDOFF G-03: sync SQLite read must not be prerendered
  return json(toDto(getSettings(getDb())));
});

export const PUT = withErrors(async (req: Request) => {
  const patch = await readJson(req, settingsPatchSchema);
  return json(toDto(updateSettings(getDb(), patch)));
});

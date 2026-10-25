import { json, withErrors } from "@/server/api";
import { createImport } from "@/server/imports/staging";
import { getStorage } from "@/server/storage";

/**
 * Start a tender import (2026-10-25): the browser then sends the tender folder file by file
 * (`POST /api/imports/:id/files`), asks for the preview (`…/scan`) and confirms (`…/commit`).
 */
export const POST = withErrors(async () => {
  return json({ id: await createImport(getStorage()) }, { status: 201 });
});

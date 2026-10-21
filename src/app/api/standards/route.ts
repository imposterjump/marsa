import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { createStandard, listStandards, standardInputSchema } from "@/server/services/standards";

export const GET = withErrors(async () => {
  await connection(); // G-03
  return json(listStandards(getDb()));
});

export const POST = withErrors(async (req: Request) => {
  const input = await readJson(req, standardInputSchema);
  return json(createStandard(getDb(), input), { status: 201 });
});

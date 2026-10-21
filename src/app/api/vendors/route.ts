import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { createVendor, listVendors, vendorInputSchema } from "@/server/services/proposals";

export const GET = withErrors(async () => {
  await connection(); // G-03
  return json(listVendors(getDb()));
});

export const POST = withErrors(async (req: Request) => {
  const input = await readJson(req, vendorInputSchema);
  return json(createVendor(getDb(), input), { status: 201 });
});

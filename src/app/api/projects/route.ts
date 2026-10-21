import { connection } from "next/server";
import { json, readJson, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { createProject, listProjects, projectInputSchema } from "@/server/services/projects";

export const GET = withErrors(async () => {
  await connection(); // G-03
  return json(listProjects(getDb()));
});

export const POST = withErrors(async (req: Request) => {
  const input = await readJson(req, projectInputSchema);
  return json(createProject(getDb(), input), { status: 201 });
});

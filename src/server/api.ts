import { unstable_rethrow } from "next/navigation";
import "server-only";
import { ZodError, type ZodType } from "zod";

/**
 * Uniform API errors: `{ error: { code, message, details? } }` + proper HTTP status.
 * Throw `ApiError` from services/handlers; wrap handlers with `withErrors`.
 */
export { ApiError, notFound } from "./api-errors";
import { ApiError } from "./api-errors";

export function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isSqliteError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    String((err as { code: unknown }).code).startsWith("SQLITE_")
  );
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof ApiError) return errorResponse(err.status, err.code, err.message, err.details);
  if (err instanceof ZodError) {
    return errorResponse(
      400,
      "validation_error",
      "Some fields are invalid.",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  // HANDOFF I-05: unique-constraint violations are conflicts, not server errors.
  if (isSqliteError(err) && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return errorResponse(409, "conflict", "This record already exists.");
  }
  console.error("[api] unhandled error", err);
  return errorResponse(
    500,
    "internal_error",
    "Something went wrong on our side. Please try again.",
  );
}

/** Wrap a route handler so thrown errors become JSON error responses. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      // Next's own control-flow errors (e.g. `connection()` during build-time prerendering) must
      // reach Next, not become a logged 500 (seen on /api/runs/active).
      unstable_rethrow(err);
      return toErrorResponse(err);
    }
  };
}

/** Parse + validate a JSON body. Malformed JSON → 400, schema errors → 400 with details. */
export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export const json = <T>(data: T, init?: ResponseInit) =>
  Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...init?.headers } });

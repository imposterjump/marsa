/**
 * Error type for services and route handlers. No `server-only` here so services stay usable
 * from scripts/tests (HANDOFF G-08); src/server/api.ts maps these to HTTP responses.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what: string) => new ApiError(404, "not_found", `${what} not found.`);

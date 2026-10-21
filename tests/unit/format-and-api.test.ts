import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, toErrorResponse } from "@/server/api";
import { firstName, greeting, initials } from "@/lib/format";

describe("format helpers", () => {
  it("builds initials", () => {
    expect(initials("Layla Mansour")).toBe("LM");
    expect(initials("  Layla  ")).toBe("LA");
    expect(initials("Northern Gulf Ports Authority")).toBe("NA");
    expect(initials("")).toBe("?");
  });

  it("first name", () => {
    expect(firstName("  Layla Mansour ")).toBe("Layla");
  });

  it("greets by time of day", () => {
    const at = (h: number) => new Date(2026, 9, 21, h, 0, 0);
    expect(greeting(at(3))).toBe("Good evening");
    expect(greeting(at(9))).toBe("Good morning");
    expect(greeting(at(14))).toBe("Good afternoon");
    expect(greeting(at(20))).toBe("Good evening");
  });
});

describe("API error mapping", () => {
  it("passes ApiError through", async () => {
    const res = toErrorResponse(new ApiError(404, "not_found", "Project not found."));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "not_found", message: "Project not found." },
    });
  });

  it("maps zod errors to 400 with field details", async () => {
    const err = z.object({ name: z.string().min(1) }).safeParse({ name: "" }).error!;
    const res = toErrorResponse(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details[0].path).toBe("name");
  });

  it("maps SQLite unique violations to 409 (HANDOFF I-05)", async () => {
    const sqliteErr = Object.assign(new Error("UNIQUE constraint failed: projects.code"), {
      code: "SQLITE_CONSTRAINT_UNIQUE",
    });
    const res = toErrorResponse(sqliteErr);
    expect(res.status).toBe(409);
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const original = console.error;
    console.error = () => {};
    const res = toErrorResponse(new Error("secret stack detail"));
    console.error = original;
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});

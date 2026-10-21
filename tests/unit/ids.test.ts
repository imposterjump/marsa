import { describe, expect, it } from "vitest";
import { newId } from "@/lib/ids";

describe("newId", () => {
  it("prefixes ids by kind and avoids look-alike characters", () => {
    const id = newId("project");
    expect(id).toMatch(/^prj_[2-9a-km-np-z]{14}$/);
  });

  it("is unique across many calls", () => {
    const ids = new Set(Array.from({ length: 5000 }, () => newId("document")));
    expect(ids.size).toBe(5000);
  });
});

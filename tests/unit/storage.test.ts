import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalStorage, StoragePathError, type LocalStorage } from "@/server/storage/local";

let tmp: string;
let storage: LocalStorage;

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-storage-"));
  storage = createLocalStorage(tmp);
});

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("local storage", () => {
  it("builds safe relative paths", () => {
    expect(storage.buildPath(["projects", "prj_abc"], "doc_123", ".PDF")).toBe(
      "projects/prj_abc/doc_123.pdf",
    );
  });

  it("rejects unsafe segments and extensions", () => {
    expect(() => storage.buildPath([".."], "doc_1", "pdf")).toThrow(StoragePathError);
    expect(() => storage.buildPath(["projects"], "a/b", "pdf")).toThrow(StoragePathError);
    expect(() => storage.buildPath(["projects"], "doc_1", "p d f")).toThrow(StoragePathError);
  });

  it("writes, reads, sizes, streams and deletes a file", async () => {
    const p = storage.buildPath(["projects", "prj_1"], "doc_1", "txt");
    await storage.save(p, Buffer.from("hello marsa"));

    expect(await storage.exists(p)).toBe(true);
    expect((await storage.read(p)).toString()).toBe("hello marsa");
    expect(await storage.size(p)).toBe(11);
    expect(await readAll(storage.stream(p))).toBe("hello marsa");
    expect(await readAll(storage.stream(p, { start: 6, end: 10 }))).toBe("marsa");

    await storage.delete(p);
    expect(await storage.exists(p)).toBe(false);
  });

  it("rejects paths that escape the root", () => {
    for (const bad of ["../evil.txt", "projects/../../evil.txt", "..\\evil.txt", "", "a\0b"]) {
      expect(() => storage.resolve(bad), bad).toThrow(StoragePathError);
    }
    expect(() => storage.resolve(path.resolve(tmp, "abs.txt"))).toThrow(StoragePathError);
  });

  it("exists() reports traversal attempts instead of returning false", async () => {
    await expect(storage.exists("../evil.txt")).rejects.toThrow(StoragePathError);
  });
});

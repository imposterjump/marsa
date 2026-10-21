/**
 * Local-disk file storage. All paths handed in/out are *relative* storage paths
 * (POSIX style, e.g. "projects/prj_x/doc_y.pdf") that are always resolved inside the root.
 * No `server-only` here so tests can use `createLocalStorage(tmpDir)` directly.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export class StoragePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoragePathError";
  }
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;
const SAFE_EXT = /^[a-z0-9]{1,10}$/;

export interface ByteRange {
  start: number;
  end: number; // inclusive
}

export interface LocalStorage {
  root: string;
  /** Build a safe relative path from validated segments and an extension. */
  buildPath(dirSegments: string[], fileId: string, ext: string): string;
  /** Resolve a relative storage path to an absolute one, rejecting anything outside the root. */
  resolve(storagePath: string): string;
  save(storagePath: string, data: Buffer | Uint8Array): Promise<void>;
  read(storagePath: string): Promise<Buffer>;
  exists(storagePath: string): Promise<boolean>;
  size(storagePath: string): Promise<number>;
  delete(storagePath: string): Promise<void>;
  /** Web ReadableStream for Response bodies, optionally limited to a byte range. */
  stream(storagePath: string, range?: ByteRange): ReadableStream<Uint8Array>;
}

export function createLocalStorage(rootDir: string): LocalStorage {
  const root = path.resolve(/*turbopackIgnore: true*/ rootDir);

  const resolve = (storagePath: string): string => {
    if (!storagePath || path.isAbsolute(storagePath) || storagePath.includes("\0")) {
      throw new StoragePathError(`Invalid storage path: "${storagePath}"`);
    }
    const abs = path.resolve(/*turbopackIgnore: true*/ root, storagePath);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      throw new StoragePathError(`Storage path escapes the storage root: "${storagePath}"`);
    }
    return abs;
  };

  return {
    root,

    buildPath(dirSegments, fileId, ext) {
      for (const seg of [...dirSegments, fileId]) {
        if (!SAFE_SEGMENT.test(seg)) throw new StoragePathError(`Unsafe path segment: "${seg}"`);
      }
      const cleanExt = ext.toLowerCase().replace(/^\./, "");
      if (!SAFE_EXT.test(cleanExt)) throw new StoragePathError(`Unsafe file extension: "${ext}"`);
      return [...dirSegments, `${fileId}.${cleanExt}`].join("/");
    },

    resolve,

    async save(storagePath, data) {
      const abs = resolve(storagePath);
      await fsp.mkdir(path.dirname(abs), { recursive: true });
      // Write to a temp file then rename, so a crash never leaves a half-written file in place.
      const tmp = `${abs}.${process.pid}.tmp`;
      await fsp.writeFile(tmp, data);
      await fsp.rename(tmp, abs);
    },

    async read(storagePath) {
      return fsp.readFile(resolve(storagePath));
    },

    async exists(storagePath) {
      try {
        await fsp.access(resolve(storagePath));
        return true;
      } catch (err) {
        if (err instanceof StoragePathError) throw err;
        return false;
      }
    },

    async size(storagePath) {
      return (await fsp.stat(resolve(storagePath))).size;
    },

    async delete(storagePath) {
      await fsp.rm(resolve(storagePath), { force: true });
    },

    stream(storagePath, range) {
      const nodeStream = fs.createReadStream(
        resolve(storagePath),
        range ? { start: range.start, end: range.end } : undefined,
      );
      return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    },
  };
}

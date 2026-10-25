/**
 * Upload area of a tender import (2026-10-25): the browser sends the tender folder file by file
 * (each with its path in the folder); they wait under `_imports/<id>/` in the storage root until
 * the import is confirmed or dropped. A session older than a day is removed. The paths are only
 * names: files are saved as `f<n>.bin`, never under the uploaded path.
 */
import fsp from "node:fs/promises";
import { ApiError } from "../api-errors";
import { newId } from "../../lib/ids";
import type { LocalStorage } from "../storage/local";
import { scanTender, type ImportEntry, type TenderScan } from "./tender";

interface Manifest {
  createdAt: string;
  files: { n: number; path: string; size: number }[];
}

const DIR = "_imports";
const MAX_FILE = 300 * 1024 * 1024;
const MAX_TOTAL = 2 * 1024 * 1024 * 1024;
const DAY = 86_400_000;

const manifestPath = (id: string) => `${DIR}/${id}/manifest.json`;
const filePath = (id: string, n: number) => `${DIR}/${id}/f${n}.bin`;
const safeId = (id: string) => {
  if (!/^imp_[A-Za-z0-9]{6,32}$/.test(id))
    throw new ApiError(404, "not_found", "Import not found.");
  return id;
};

/** Writes to one session's manifest, one at a time. */
const locks = new Map<string, Promise<unknown>>();
function locked<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const next = (locks.get(id) ?? Promise.resolve()).then(fn, fn);
  locks.set(
    id,
    next.catch(() => {}),
  );
  return next;
}

/** The last scan of each session, so the import uses what the preview showed. */
const scans = new Map<string, TenderScan>();

async function readManifest(storage: LocalStorage, id: string): Promise<Manifest> {
  try {
    return JSON.parse((await storage.read(manifestPath(safeId(id)))).toString("utf8")) as Manifest;
  } catch {
    throw new ApiError(404, "not_found", "Import not found.");
  }
}

export async function createImport(storage: LocalStorage): Promise<string> {
  await dropStale(storage);
  const id = newId("import");
  const manifest: Manifest = { createdAt: new Date().toISOString(), files: [] };
  await storage.save(manifestPath(id), Buffer.from(JSON.stringify(manifest)));
  return id;
}

export async function addImportFile(
  storage: LocalStorage,
  id: string,
  path: string,
  bytes: Uint8Array,
): Promise<number> {
  safeId(id);
  if (!path || path.length > 1000)
    throw new ApiError(400, "validation_error", "A file path is missing.");
  if (bytes.byteLength > MAX_FILE)
    throw new ApiError(413, "file_too_large", "A file of the tender is larger than 300 MB.");
  return locked(id, async () => {
    const m = await readManifest(storage, id);
    const total = m.files.reduce((s, f) => s + f.size, 0) + bytes.byteLength;
    if (total > MAX_TOTAL)
      throw new ApiError(413, "file_too_large", "The tender is larger than 2 GB.");
    const n = m.files.length;
    await storage.save(filePath(id, n), bytes);
    m.files.push({ n, path: path.replace(/\\/g, "/").replace(/^\/+/, ""), size: bytes.byteLength });
    await storage.save(manifestPath(id), Buffer.from(JSON.stringify(m)));
    scans.delete(id);
    return m.files.length;
  });
}

export async function importEntries(storage: LocalStorage, id: string): Promise<ImportEntry[]> {
  const m = await readManifest(storage, id);
  return m.files.map((f) => ({
    path: f.path,
    size: f.size,
    read: async () => new Uint8Array(await storage.read(filePath(id, f.n))),
  }));
}

export async function scanImport(storage: LocalStorage, id: string): Promise<TenderScan> {
  const cached = scans.get(id);
  if (cached) return cached;
  const entries = await importEntries(storage, id);
  if (!entries.length) throw new ApiError(400, "validation_error", "No file was uploaded.");
  const scan = await scanTender(entries);
  scans.set(id, scan);
  return scan;
}

export async function dropImport(storage: LocalStorage, id: string) {
  scans.delete(safeId(id));
  await fsp.rm(storage.resolve(`${DIR}/${id}`), { recursive: true, force: true });
}

async function dropStale(storage: LocalStorage) {
  let names: string[] = [];
  try {
    names = await fsp.readdir(storage.resolve(DIR));
  } catch {
    return;
  }
  for (const id of names) {
    try {
      const m = await readManifest(storage, id);
      if (Date.now() - Date.parse(m.createdAt) > DAY) await dropImport(storage, id);
    } catch {
      /* not a session */
    }
  }
}

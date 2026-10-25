"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currentT } from "@/components/i18n-provider";
import { api, ApiClientError } from "@/lib/api-client";
import type {
  ApiErrorBody,
  TenderImportPreviewDto,
  TenderImportResultDto,
  TenderImportRoundDto,
} from "@/lib/api-types";
import type { ProjectCategory } from "@/lib/domain";
import { projectsKey } from "./use-projects";

/**
 * Tender import (2026-10-25): the browser sends a tender folder (or its zip) as the e-procurement
 * portal exports it, file by file, then asks the server what it holds and confirms. Server side:
 * src/app/api/imports/**. Files are streamed from disk by the browser, never read into memory here.
 */

/** A file of the chosen folder, with its path inside it ("Tender/Bids/Co-123/boq.xlsx"). */
export interface ImportFile {
  file: File;
  path: string;
}

export interface ImportProgress {
  files: number;
  totalFiles: number;
  bytes: number;
  totalBytes: number;
}

export interface TenderImportInput {
  name: string;
  category: ProjectCategory;
  round: TenderImportRoundDto["key"];
  estimateAmount: number | null;
  estimateCurrency: string | null;
  /** Paths of files left out by default that the user ticked back in. */
  include?: string[];
  /** Paths of files included by default that the user unticked. */
  exclude?: string[];
}

/** The server's limits (src/server/imports/staging.ts). */
export const IMPORT_MAX_FILE = 300 * 1024 * 1024;
export const IMPORT_MAX_TOTAL = 2 * 1024 * 1024 * 1024;

/** System files a folder copy carries along (never part of a tender). */
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|desktop\.ini$|~\$[^/]*$)/i;
const keep = (f: ImportFile) => !JUNK.test(f.path) && f.file.size > 0;
const byPath = (a: ImportFile, b: ImportFile) => a.path.localeCompare(b.path);

export const isZip = (name: string) => /\.zip$/i.test(name);

/** Files picked with `<input webkitdirectory>` or a plain file input (a zip: its name). */
export function filesFromPicker(list: FileList | null): ImportFile[] {
  return Array.from(list ?? [])
    .map((file) => ({ file, path: (file.webkitRelativePath || file.name).replace(/^\/+/, "") }))
    .filter(keep)
    .sort(byPath);
}

/**
 * What was dropped. Must run inside the drop event: the browser empties the list right after it.
 * Folders come back as entries (read with `readDropped`), loose files as files.
 */
export function droppedItems(dt: DataTransfer): (FileSystemEntry | File)[] {
  const out: (FileSystemEntry | File)[] = [];
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.() ?? null;
    const file = entry ? null : item.getAsFile();
    if (entry) out.push(entry);
    else if (file) out.push(file);
  }
  return out.length ? out : Array.from(dt.files);
}

const fileOf = (entry: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject));
const readBatch = (reader: FileSystemDirectoryReader) =>
  new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));

async function walkEntry(entry: FileSystemEntry, out: ImportFile[]) {
  if (entry.isFile) {
    const file = await fileOf(entry as FileSystemFileEntry);
    out.push({ file, path: entry.fullPath.replace(/^\/+/, "") || file.name });
    return;
  }
  if (!entry.isDirectory) return;
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  // readEntries returns the folder in batches (about 100 at a time) until an empty one.
  for (let batch = await readBatch(reader); batch.length; batch = await readBatch(reader)) {
    for (const child of batch) await walkEntry(child, out);
  }
}

/** Every file of the dropped folders (with their paths), plus loose files under their name. */
export async function readDropped(items: (FileSystemEntry | File)[]): Promise<ImportFile[]> {
  const out: ImportFile[] = [];
  for (const item of items) {
    if (item instanceof File) out.push({ file: item, path: item.name });
    else await walkEntry(item, out);
  }
  return out.filter(keep).sort(byPath);
}

/** A new upload session on the server. */
export const startImport = () =>
  api<{ id: string }>("/api/imports", { method: "POST" }).then((r) => r.id);

/** Drops an unfinished import (its uploaded files are deleted). Fire and forget. */
export function dropImport(id: string) {
  // keepalive: the request still goes out when the page is being closed.
  void fetch(`/api/imports/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
}

/** What the uploaded folder holds: tender documents, rounds of bids, companies, the estimate. */
export const scanImport = (id: string, signal?: AbortSignal) =>
  api<TenderImportPreviewDto>(`/api/imports/${id}/scan`, { method: "POST", signal });

/** One file with its path, with upload progress (XHR: fetch has no upload progress). */
function sendFile(
  id: string,
  f: ImportFile,
  signal: AbortSignal,
  onBytes: (sent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const form = new FormData();
    form.append("path", f.path);
    form.append("file", f.file, f.file.name);
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    const settle = () => signal.removeEventListener("abort", abort);
    xhr.open("POST", `/api/imports/${id}/files`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onBytes(f.file.size * Math.min(1, e.loaded / e.total));
    };
    xhr.onload = () => {
      settle();
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      const body = xhr.response as ApiErrorBody | null;
      reject(
        new ApiClientError(
          xhr.status,
          body?.error.code ?? "upload_failed",
          body?.error.message ?? currentT()("Upload failed ({status}).", { status: xhr.status }),
          body?.error.details,
        ),
      );
    };
    xhr.onerror = () => {
      settle();
      reject(
        new ApiClientError(
          0,
          "network_error",
          currentT()("Network error: the upload was interrupted."),
        ),
      );
    };
    xhr.onabort = () => {
      settle();
      reject(signal.reason);
    };
    xhr.send(form);
  });
}

/**
 * Sends the files `concurrency` at a time. Progress is reported about ten times a second. The
 * first failure stops the other uploads and is thrown; aborting `signal` stops everything.
 */
export async function uploadImportFiles(
  id: string,
  files: ImportFile[],
  {
    signal,
    onProgress,
    concurrency = 3,
  }: { signal: AbortSignal; onProgress: (p: ImportProgress) => void; concurrency?: number },
): Promise<void> {
  const stop = new AbortController();
  const forward = () => stop.abort(signal.reason);
  if (signal.aborted) forward();
  signal.addEventListener("abort", forward, { once: true });

  const sent = new Array<number>(files.length).fill(0);
  const totalBytes = files.reduce((s, f) => s + f.file.size, 0);
  let done = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const snapshot = (): ImportProgress => ({
    files: done,
    totalFiles: files.length,
    bytes: Math.min(
      totalBytes,
      sent.reduce((s, n) => s + n, 0),
    ),
    totalBytes,
  });
  const report = () => {
    timer ??= setTimeout(() => {
      timer = null;
      if (!stop.signal.aborted) onProgress(snapshot());
    }, 100);
  };

  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      stop.signal.throwIfAborted();
      const i = next++;
      await sendFile(id, files[i], stop.signal, (n) => {
        sent[i] = n;
        report();
      });
      sent[i] = files[i].file.size;
      done++;
      report();
    }
  };

  try {
    await Promise.all(
      Array.from({ length: Math.min(concurrency, files.length) }, () =>
        worker().catch((err) => {
          stop.abort(err); // one failure stops the other uploads
          throw err;
        }),
      ),
    );
    onProgress(snapshot());
  } finally {
    if (timer) clearTimeout(timer);
    signal.removeEventListener("abort", forward);
  }
}

/** Creates the project from the uploaded tender, then refreshes the projects list. */
export function useCommitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TenderImportInput }) =>
      api<TenderImportResultDto>(`/api/imports/${id}/commit`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
  });
}

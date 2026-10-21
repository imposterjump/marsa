import { ApiClientError } from "./api-client";
import type { ApiErrorBody } from "./api-types";

/**
 * Upload one file with real progress (fetch has no upload-progress events, XHR does).
 * Sends multipart/form-data with the file under "file" plus optional text fields.
 */
export function uploadFile<T>(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
  fields: Record<string, string> = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    form.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, (e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(xhr.response as T);
      } else {
        const body = xhr.response as ApiErrorBody | null;
        reject(
          new ApiClientError(
            xhr.status,
            body?.error.code ?? "upload_failed",
            body?.error.message ?? `Upload failed (${xhr.status}).`,
            body?.error.details,
          ),
        );
      }
    };
    xhr.onerror = () =>
      reject(new ApiClientError(0, "network_error", "Network error: the upload was interrupted."));
    xhr.send(form);
  });
}

import "server-only";
import { env } from "../env";
import { createLocalStorage, type LocalStorage } from "./local";

const globalForStorage = globalThis as typeof globalThis & { __marsaStorage?: LocalStorage };

/** App-wide storage rooted at DATA_DIR/uploads. */
export function getStorage(): LocalStorage {
  globalForStorage.__marsaStorage ??= createLocalStorage(env.uploadsDir);
  return globalForStorage.__marsaStorage;
}

export { StoragePathError, type ByteRange, type LocalStorage } from "./local";

/* Installing a newer version: the window's side of src-tauri/src/update.rs.

   Only inside the app, and only on the reader's click — the check before it
   (src/updates.js) is what found the version. The shell reports how far the
   download is, and says what went wrong in its first word. */

import { onWindows } from "../system.js";
import { shell } from "./env.js";

/* What went wrong, as `{ kind, detail }`: `none` where the release has
   nothing to install from, `unreachable` where it could not be fetched,
   `failed` for everything else. */
export function updateFault(error) {
  const said = String(error?.message || error || "");
  const found = said.match(/^(none|unreachable|failed):\s*([\s\S]*)$/);
  return found
    ? { kind: found[1], detail: found[2].trim().slice(0, 120) }
    : { kind: "failed", detail: said.slice(0, 120) };
}

/* Whether this copy came from the Microsoft Store, which updates it by itself.
   Anything that cannot say is no Store copy. */
export async function fromStore() {
  if (!onWindows()) return false;
  try {
    return (await shell("from_store")) === true;
  } catch {
    return false;
  }
}

/* Resolves never on success — the app restarts — and rejects with a fault.
   `onProgress` hears the share downloaded, 0 to 100, where the size is known. */
export async function installUpdate(onProgress = () => {}) {
  const { listen } = await import("@tauri-apps/api/event");
  const stop = await listen("update-progress", ({ payload }) => {
    const { done, total } = payload || {};
    onProgress(total ? Math.min(100, Math.round((done / total) * 100)) : null);
  });
  try {
    await shell("install_update");
  } catch (error) {
    throw Object.assign(new Error("update not installed"), { fault: updateFault(error) });
  } finally {
    stop();
  }
}

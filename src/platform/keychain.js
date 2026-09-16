/* The model key, and the one thing the rest of the app may know about it.

   It is deliberately not part of the settings object. Everything else the
   user decides is written to a JSON file that gets copied, synced and pasted
   into bug reports; a key must not travel with it. So it lives in the
   system's own store and is fetched on its own, right where a request is
   built.

   Outside the app — in a plain browser, which is how the display gets
   checked — there is no such store and the browser's own storage stands in.
   That is fine for checking a window and would not be fine for shipping,
   which is why the two paths are named apart here rather than hidden in one
   helper. */

import { insideApp } from "./env.js";

const BROWSER_KEY = "triglosa.apiKey";

export async function loadApiKey() {
  try {
    if (!insideApp()) return localStorage.getItem(BROWSER_KEY) || "";
    const { invoke } = await import("@tauri-apps/api/core");
    return String((await invoke("read_api_key")) || "");
  } catch {
    /* A store that will not answer means no key, which the app handles. It
       must not mean a window that will not open. */
    return "";
  }
}

export async function saveApiKey(key) {
  const clean = String(key || "").trim();
  if (!insideApp()) {
    if (clean) localStorage.setItem(BROWSER_KEY, clean);
    else localStorage.removeItem(BROWSER_KEY);
    return clean;
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("write_api_key", { key: clean });
  return clean;
}

/* What the settings window shows instead of the key itself. A key is long,
   pasted, and never read back by a person — showing it in full only invites
   someone to look over a shoulder, and showing nothing at all leaves the
   reader wondering whether it was saved. The last four characters answer
   that question and nothing else. */
export function keyHint(key) {
  const clean = String(key || "").trim();
  if (!clean) return "";
  return clean.length <= 4 ? "•".repeat(clean.length) : `••••${clean.slice(-4)}`;
}

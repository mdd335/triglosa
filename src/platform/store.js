/* Where the settings live.

   In the app that is a file the platform picks, so no path is written down
   anywhere and Windows needs no special case. Outside the app — in a plain
   browser, which is how the display gets checked — the browser's own storage
   stands in, so the same code runs in both places.

   Whatever comes back is put through normalizeSettings first: a file from a
   newer version, or one somebody edited by hand, must not be able to break
   the app. */

import { normalizeSettings } from "../settings.js";
import { insideApp } from "./env.js";

const BROWSER_KEY = "triglosa.settings";

async function readRaw() {
  if (!insideApp()) return localStorage.getItem(BROWSER_KEY) || "";
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("read_settings");
}

async function writeRaw(contents) {
  if (!insideApp()) return localStorage.setItem(BROWSER_KEY, contents);
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("write_settings", { contents });
}

export async function loadSettings() {
  let stored = null;
  try {
    const raw = await readRaw();
    if (raw) stored = JSON.parse(raw);
  } catch {
    /* Unreadable settings mean the defaults, not a broken window. */
  }
  return normalizeSettings(stored);
}

export async function saveSettings(settings) {
  const clean = normalizeSettings(settings);
  await writeRaw(JSON.stringify(clean, null, 2) + "\n");
  return clean;
}

/* The one place that knows the app is running inside a window.

   The three backends all take a fetch of their own. Inside the app that has to
   be the one the shell provides: a page may not call a local server or a
   foreign endpoint directly, and every one of the three does exactly that.
   Outside — in tests, in Node — the built-in one is right. Nothing else in the
   codebase has to know which of the two it got. */

let cached = null;

export async function appFetch() {
  if (cached) return cached;
  cached = globalThis.fetch;
  if (globalThis.__TAURI_INTERNALS__) {
    const { fetch: shellFetch } = await import("@tauri-apps/plugin-http");
    cached = shellFetch;
  }
  return cached;
}

export const insideApp = () => !!globalThis.__TAURI_INTERNALS__;

/* The translation helper stops itself when it has been idle, so it may well
   be gone by the time someone comes back to the window. Asking for it again
   costs nothing when it is already there. */
export async function ensureTranslationHelper(translation) {
  if (!insideApp()) return translation.running();
  /* A helper from an older build keeps the port, and a new one started
     beside it exits at once — so it would go on answering this window in a
     shape it no longer understands. It has to be asked to go first. */
  if (await translation.running()) {
    if (translation.current()) return true;
    await translation.retire();
  }
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("start_translation_helper");
  /* It has to bind its port before it answers. Half a second is generous;
     measured it is there after about fifty milliseconds. */
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((done) => setTimeout(done, 50));
    if (await translation.running()) return true;
  }
  return false;
}

/* Ask macOS for translation languages, with its own download prompt.

   Answers whether the prompt was shown at all. It is not, in two cases the
   window has to handle the same way: outside the app entirely, and inside a
   build that is not a bundle — macOS gives a bare executable no window, so
   during development the sheet cannot appear. Then the settings pane is
   opened instead.

   One request per language, not per direction. The heading travels with the
   request: the sidecar draws that little window and knows nothing of the
   interface language. */
export async function prepareLanguages(from, targets, heading) {
  if (!insideApp() || !targets.length) return false;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("prepare_languages", { from, targets: targets.join(","), heading });
}

/* Where the reader goes when that prompt cannot be shown. */
export async function openLanguageSettings() {
  if (!insideApp()) return false;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_language_settings");
  return true;
}

/* The search engine the system is set to, asked once and remembered. Getting
   nothing back means "no deviating setting", and that answer is correct
   rather than a failure — so unlike the translation probe it is kept. */
let searchBase = null;

export async function searchUrl() {
  if (searchBase) return searchBase;
  const { searchUrlFor, DEFAULT_SEARCH } = await import("./search.js");
  if (!insideApp()) return (searchBase = DEFAULT_SEARCH);
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    searchBase = searchUrlFor(await invoke("preferred_search_report"));
  } catch {
    searchBase = DEFAULT_SEARCH;
  }
  return searchBase;
}

/* Copying is the one thing every box offers: whatever the reader came for,
   the next step is usually somewhere else. */
export async function copyText(text) {
  await navigator.clipboard.writeText(String(text || ""));
}

/* The version the running app was built as. Outside the app there is no
   build to ask, and the window then shows none. */
export async function appVersion() {
  if (!insideApp()) return "";
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export async function openUrl(url) {
  if (!insideApp()) return window.open(url, "_blank");
  const { openUrl: open } = await import("@tauri-apps/plugin-opener");
  return open(url);
}

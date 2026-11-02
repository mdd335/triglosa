/* The one place that knows the app is running inside a window.

   The three backends all take a fetch of their own. Inside the app that has to
   be the one the shell provides: a page may not call a local server or a
   foreign endpoint directly, and every one of the three does exactly that.
   Outside — in tests, in Node — the built-in one is right. Nothing else in the
   codebase has to know which of the two it got. */

import { whenRunning } from "./translation.js";
import { onPhone, onWindows } from "../system.js";

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

/* One of the shell's commands, asked from the page. The module that reaches
   the shell is loaded on the first one: outside the app there is none to
   load. */
export async function shell(command, args) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, args);
}

/* Inside the app on a computer: windows of its own, a menu bar symbol,
   shortcuts and other programs to read from. A phone's app has a shell and
   none of those, and everything that asks this answers there as it does in
   a plain browser. */
export const onDesktop = () => insideApp() && !onPhone();

/* The fetch the AI model is asked through. Inside the app that is the shell's
   kept connection (see model-fetch.js); the translation helper and the update
   check stay on appFetch, which gains nothing from it. */
let modelCached = null;

export async function modelFetch() {
  if (modelCached) return modelCached;
  if (!insideApp()) return (modelCached = globalThis.fetch);
  const [{ invoke }, { shellFetch }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("./model-fetch.js"),
  ]);
  return (modelCached = shellFetch(invoke));
}

/* The fetch Apple's translation is asked through: a computer's helper
   answers over HTTP, a phone's app answers the same routes in its own
   process (translation.js). */
let translationCached = null;

export async function translationFetch() {
  if (translationCached) return translationCached;
  if (!(insideApp() && onPhone())) return (translationCached = await appFetch());
  const [{ invoke }, { inProcessFetch }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("./translation.js"),
  ]);
  return (translationCached = inProcessFetch(invoke));
}

/* The word aligner, where there is a shell to hold it. */
let alignerCached = null;

export async function wordAligner() {
  if (alignerCached) return alignerCached;
  if (!onDesktop()) return null;
  const [{ invoke }, { createAligner }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("./aligner.js"),
  ]);
  return (alignerCached = createAligner(invoke));
}

/* The language identifier, where there is a shell to hold it. */
let identifierCached = null;

export async function languageIdentifier() {
  if (identifierCached) return identifierCached;
  if (!insideApp()) return null;
  const [{ invoke }, { createIdentifier }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("./identifier.js"),
  ]);
  return (identifierCached = createIdentifier(invoke));
}

/* The system's spelling checker, where there is a shell to ask. */
let spellerCached = null;

export async function spellingChecker() {
  if (spellerCached) return spellerCached;
  if (!insideApp()) return null;
  const [{ invoke }, { createSpeller }] = await Promise.all([
    import("@tauri-apps/api/core"),
    import("./spelling.js"),
  ]);
  return (spellerCached = createSpeller(invoke));
}

/* The translation helper stops itself when it has been idle, so it may well
   be gone by the time someone comes back to the window. Asking for it again
   costs nothing when it is already there. */
export async function ensureTranslationHelper(translation) {
  /* Only the Mac has a helper to start: a phone's translation is in the
     app itself, there or not. */
  if (onWindows()) return false;
  translation.forget();
  if (!insideApp() || onPhone()) return translation.running();
  /* A helper from an older build keeps the port, and a new one started
     beside it exits at once — so it would go on answering this window in a
     shape it no longer understands. It has to be asked to go first. */
  if (await translation.running()) {
    if (translation.current()) return true;
    await translation.retire();
  }
  await shell("start_translation_helper");
  return whenRunning(translation);
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
  /* A phone's app shows the system's sheet over its own page, and answers
     when the reader is through with it. */
  if (onPhone()) {
    const route = `/prepare?from=${encodeURIComponent(from)}&targets=${encodeURIComponent(targets.join(","))}`;
    const answer = await shell("apple_translation", { route, body: "" }).catch(() => null);
    return !!answer && answer.status === 200;
  }
  return shell("prepare_languages", { from, targets: targets.join(","), heading });
}

/* Where the reader goes when that prompt cannot be shown. */
export async function openLanguageSettings() {
  if (!onDesktop()) return false;
  await shell("open_language_settings");
  return true;
}

/* The search engine a look-up opens: the one the reader chose in the
   settings, or for "system" the one the Mac is set to — asked once and
   remembered. Getting nothing back means "no deviating setting", and that
   answer is correct rather than a failure — so unlike the translation probe
   it is kept. */
let searchBase = null;
const PHONE_SEARCH = "x-web-search://?";

export async function searchUrl(choice) {
  const { SEARCH_URLS, WINDOWS_SEARCH, searchUrlFor, DEFAULT_SEARCH } = await import("./search.js");
  if (SEARCH_URLS[choice]) return SEARCH_URLS[choice];
  if (onWindows()) return SEARCH_URLS[WINDOWS_SEARCH];
  /* A phone has an address for it: Safari searches with the engine it is
     set to, whichever that is (see openUrl). */
  if (onPhone()) return PHONE_SEARCH;
  if (searchBase) return searchBase;
  if (!insideApp()) return (searchBase = DEFAULT_SEARCH);
  try {
    searchBase = searchUrlFor(await shell("preferred_search_report"));
  } catch {
    searchBase = DEFAULT_SEARCH;
  }
  return searchBase;
}

/* The system's languages, first one first, as language tags. The Mac's list
   comes from the shell as `defaults` prints it; everywhere else the web
   view's own list is the system's. */
export function languagesFromReport(report) {
  return String(report || "")
    .replace(/[()]/g, "")
    .split(/[,\n]/)
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export async function systemLanguages() {
  const own = Array.from(globalThis.navigator?.languages || []);
  if (!insideApp() || onWindows()) return own;
  try {
    const listed = languagesFromReport(await shell("system_languages_report"));
    return listed.length ? listed : own;
  } catch {
    return own;
  }
}

/* Copying is the one thing every box offers: whatever the reader came for,
   the next step is usually somewhere else. */
export async function copyText(text) {
  await navigator.clipboard.writeText(String(text || ""));
}

/* What was copied last, for the phone's paste button. Asked of the shell
   there: a page reading the clipboard is answered by the system with a
   bubble to press first. */
export async function pastedText() {
  if (insideApp() && onPhone()) {
    return String((await shell("read_pasteboard")) || "");
  }
  return String((await navigator.clipboard.readText()) || "");
}

/* What was copied, for the phone's paste button: "text", "picture" — whose
   text is then recognised (platform/screen.js, readPicture) — or "" where
   nothing is, and the button is greyed. Asked without reading it: iOS asks
   the reader only when what was copied is read. Outside a phone there is
   nothing to grey, and what is pasted is text. */
export async function pasteHeld() {
  if (!(insideApp() && onPhone())) return "text";
  const answer = await shell("apple_translation", { route: "/pasteboard", body: "" });
  return answer?.status === 200 ? String(answer.text || "") : "text";
}

/* The phone's edges, where the page does not reach — the bands under the
   clock and over the home bar — painted in the page's own ground. */
export async function paintGround() {
  if (!(insideApp() && onPhone())) return;
  const ground = getComputedStyle(document.documentElement).getPropertyValue("--ground").trim();
  if (!ground) return;
  await shell("apple_translation", { route: `/ground?color=${ground.replace("#", "")}`, body: "" }).catch(() => {});
}

/* This app's own page in the iPhone's settings. */
export async function openPhoneSettings() {
  await shell("apple_translation", { route: "/settings", body: "" }).catch(() => {});
}

/* The text another app handed over in an address of this app's own, and
   what for: `triglosa://read?text=…` to be read, `triglosa://card?text=…`
   to become a flashcard. A picture shared to the app comes as the lines
   recognised in it (`lines=…`, the share extension), which the window puts
   in order. Null where the address is neither or brings nothing. */
export function textHandedOver(address) {
  let url;
  try {
    url = new URL(String(address || ""));
  } catch {
    return null;
  }
  if (url.protocol !== "triglosa:" || !["read", "card"].includes(url.hostname)) return null;
  const text = (url.searchParams.get("text") || "").trim();
  if (text) return { what: url.hostname, text };
  const lines = url.searchParams.get("lines") || "";
  return lines.trim() ? { what: url.hostname, lines } : null;
}

/* Told the address the app was opened with, on a phone: once for the one
   it was started by, and for every one after. Each is handed out once. */
export async function onOpenedWith(handler) {
  if (!(insideApp() && onPhone())) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const take = async () => {
    const address = await shell("take_opened").catch(() => "");
    if (address) handler(address);
  };
  const stop = await listen("opened", take);
  await take();
  return stop;
}

/* What the window took, for trying the capture in a test machine: the
shell writes it out only where the app was started with TRIGLOSA_TRACE. */
export function trace(what) {
  if (!insideApp()) return;
  shell("trace", { line: JSON.stringify(what) }).catch(() => {});
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
  if (String(url).startsWith(PHONE_SEARCH)) {
    return shell("search_in_safari", { url });
  }
  const { openUrl: open } = await import("@tauri-apps/plugin-opener");
  return open(url);
}

/* The installation's side of a problem report (src-tauri/src/diagnostics.rs):
   the system version and the reading window's last failures. Outside the app
   there is nothing to ask. */
export async function systemReport() {
  if (!insideApp()) return { system: "", arch: "", faults: [] };
  return shell("system_report");
}

/* One of the page's own steps for the app's journal (journal.rs), from the
   shell's short list: "page ready" and the like, never a text. */
export async function noteJournal(what) {
  if (!insideApp() || onPhone()) return;
  await shell("note_journal", { what }).catch(() => {});
}

/* One failure, kept for the report — in memory, the last few. */
export async function noteFault(line) {
  if (!insideApp()) return;
  await shell("note_fault", { line }).catch(() => {});
}

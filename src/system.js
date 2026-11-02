/* Which operating system the window is running on: "windows", "mac" or
   "ios".

   Read off the web view's user agent, which is the one thing a page can ask
   without the shell. Anywhere without a Windows user agent counts as the Mac
   — Node in the tests, and the browser `scripts/shot.mjs` photographs in —
   so nothing that was checked before Windows existed changes its answer.
   `TRIGLOSA_SYSTEM` in the page's global scope overrides it, which is how a
   test or a photograph looks at the Windows version from a Mac. An iPhone
   says so in its user agent as well; an iPad calls itself a Mac and is
   told by its touch screen. */

export function currentSystem() {
  const forced = globalThis.TRIGLOSA_SYSTEM;
  if (forced === "windows" || forced === "mac" || forced === "ios") return forced;
  const agent = globalThis.navigator?.userAgent || "";
  if (/Windows/i.test(agent)) return "windows";
  if (/iPhone|iPad|iPod/.test(agent)) return "ios";
  if (globalThis.__TAURI_INTERNALS__ && globalThis.navigator?.maxTouchPoints > 1) return "ios";
  return "mac";
}

export const onWindows = () => currentSystem() === "windows";
export const onPhone = () => currentSystem() === "ios";

/* Said on the page too, for the few rules that differ: every window's page
   imports this through its labels, so each one is marked before it draws. */
if (globalThis.document?.documentElement) {
  globalThis.document.documentElement.dataset.system = currentSystem();
}

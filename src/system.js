/* Which operating system the window is running on: "windows" or "mac".

   Read off the web view's user agent, which is the one thing a page can ask
   without the shell. Anywhere without a Windows user agent counts as the Mac
   — Node in the tests, and the browser `scripts/shot.mjs` photographs in —
   so nothing that was checked before Windows existed changes its answer.
   `TRIGLOSA_SYSTEM` in the page's global scope overrides it, which is how a
   test or a photograph looks at the Windows version from a Mac. */

export function currentSystem() {
  const forced = globalThis.TRIGLOSA_SYSTEM;
  if (forced === "windows" || forced === "mac") return forced;
  return /Windows/i.test(globalThis.navigator?.userAgent || "") ? "windows" : "mac";
}

export const onWindows = () => currentSystem() === "windows";

/* Said on the page too, for the few rules that differ: every window's page
   imports this through its labels, so each one is marked before it draws. */
if (globalThis.document?.documentElement) {
  globalThis.document.documentElement.dataset.system = currentSystem();
}

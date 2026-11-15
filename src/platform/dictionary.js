/* Apple's dictionary, where no AI model explains a word (author
   2026-11-12): whether one of the dictionaries the reader has holds it, and
   the system's own look-up for it — on the Mac the panel the system's Look Up
   shows, through the shell (src-tauri/src/dictionary.rs); on the iPhone the
   system's sheet, through the app's own routes (src-tauri/ios/Translation.swift).
   Windows has none.

   What the dictionaries say is never read into the window: it stays Apple's,
   in Apple's panel. `invoke` is handed in, so that this file is the same in
   the app and in a test. A failure is "not held": no button. */

export function createDictionary(invoke, system) {
  if (system !== "mac" && system !== "ios") return null;
  const held = new Map();
  const route = (path, body) => invoke("apple_translation", { route: path, body });
  const asked = system === "mac"
    ? (term) => invoke("dictionary_has", { term }).then((answer) => answer === true)
    : (term) => route("/dictionary", term).then((answer) => answer?.status === 200 && String(answer.text).trim() === "yes");
  return {
    /* Asked once per word while the window is open: a dictionary loaded in
       the meantime shows from the next word on. */
    has(term) {
      const key = String(term || "").trim();
      if (!key) return Promise.resolve(false);
      if (!held.has(key)) held.set(key, asked(key).catch(() => false));
      return held.get(key);
    },
    /* Where the reader chooses their dictionaries: on the Mac the Dictionary
       app, whose settings list them; on the iPhone Apple's own sheet, whose
       Manage button loads them (a word nobody looks up opens it empty). */
    manage() {
      const opened = system === "mac"
        ? invoke("dictionary_settings").then((answer) => answer !== false)
        : route("/look-up", "Triglosa").then((answer) => answer?.status === 200);
      return opened.catch(() => false);
    },
    /* `at` is where the word stands in the window, in its points: the Mac's
       panel lays the word over it there, as Look Up does; the phone's sheet
       comes up from below. */
    show(term, at = {}) {
      const key = String(term || "").trim();
      if (!key) return Promise.resolve(false);
      const shown = system === "mac"
        ? invoke("dictionary_show", { term: key, x: at.x || 0, y: at.y || 0, size: at.size || 0 }).then((answer) => answer !== false)
        : route("/look-up", key).then((answer) => answer?.status === 200);
      return shown.catch(() => false);
    },
  };
}

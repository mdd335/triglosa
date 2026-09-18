/* The settings, in a window of their own.

   They used to take over the reading window, which meant a reader could not
   look at a setting and at what it did to the text at the same time, and that
   leaving them was a thing to remember rather than a thing to close. A window
   of its own costs one page and one event.

   Everything it knows it reads from the same places the other window does —
   the settings file and the system's key store — so the two cannot drift
   apart. What it does not do is touch the other window directly: it saves,
   and says that it saved. */

import { loadSettings, saveSettings } from "../platform/store.js";
import { loadApiKey, saveApiKey } from "../platform/keychain.js";
import { closeSettings, onAboutAsked, settingsChanged } from "../platform/windows.js";
import { labels, windowTitle } from "./labels.js";
import { settingsView } from "./settings-view.js";

let settings = await loadSettings();
let apiKey = await loadApiKey();

const root = document.getElementById("app");
root.className = "settings-window";

function draw() {
  document.title = windowTitle(labels(settings.languages[0]).settings);
  root.replaceChildren(settingsView({ settings, apiKey }, {
    onChange: async (next) => {
      settings = await saveSettings(next);
      draw();
      /* After the redraw, not before: the other window re-registers the
         shortcut when this arrives, and it has to be the one now standing in
         the field. */
      settingsChanged();
    },
    onKeyChange: async (next) => {
      apiKey = await saveApiKey(next);
      draw();
    },
  }));
}

draw();

/* The menu bar's entry for updates opens this window at its last group and
   checks straight away — that is what the entry says it does. Read from the
   address when the window is new, heard as an event when it stood open. */
function showAbout() {
  const about = document.getElementById("about");
  if (!about) return;
  about.scrollIntoView({ block: "start" });
  document.querySelector(".update-check")?.click();
}
if (location.hash === "#about") showAbout();
await onAboutAsked(showAbout);

/* The two keys every window on this system closes with. This app has no menu
   bar of its own, so neither of them exists until it is written down here.

   A press the page has already answered is not one of them: the shortcut
   recorder takes every key while its field has focus — Escape included, which
   is a combination somebody may well be trying to record — and says so by
   preventing the default. */
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const closing = event.key === "Escape"
    || (event.key.toLowerCase() === "w" && (event.metaKey || event.ctrlKey));
  if (!closing) return;
  event.preventDefault();
  /* Escape out of a field being written in leaves the field, it does not
     leave the window: what was typed is saved when the field loses the
     focus, and a window that closed on it would throw away the address
     somebody had just finished typing. The second press then closes. */
  const writing = document.activeElement;
  if (event.key === "Escape" && writing && writing.matches("input:not([readonly]), textarea")) {
    writing.blur();
    return;
  }
  closeSettings();
});

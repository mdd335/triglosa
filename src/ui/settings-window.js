/* The settings, in a window of their own.

   Inside the reading window a reader could not look at a setting and at what
   it did to the text at the same time, and leaving them would be a thing to
   remember rather than a thing to close. A window of its own costs one page
   and one event.

   Everything it knows it reads from the same places the other window does —
   the settings file and the system's key store — so the two cannot drift
   apart. What it does not do is touch the other window directly: it saves,
   and says that it saved. */

import { loadSettings, saveSettings } from "../platform/store.js";
import { loadApiKey, saveApiKey } from "../platform/keychain.js";
import { closeSettings, onPageAsked, onSettingsChanged, settingsChanged } from "../platform/windows.js";
import { labels, windowTitle } from "./labels.js";
import { openPage, settingsView } from "./settings-view.js";
import { closeOnKeys, quietContextMenu, replaceKeepingScroll } from "./elements.js";

let settings = await loadSettings();
let apiKey = await loadApiKey(settings);

const root = document.getElementById("app");
root.className = "settings-window";

function draw() {
  document.title = windowTitle(labels(settings.languages[0]).settings);
  replaceKeepingScroll(root, settingsView({ settings, apiKey }, {
    onChange: async (next) => {
      /* The pin is set in the reading window, the first steps are put away
         in their own and a card remembers its language, any of which may
         have happened since this one read the file. */
      const { pinned, welcome, cards } = await loadSettings();
      settings = await saveSettings({ ...next, pinned, welcome, cards: { ...next.cards, language: cards.language } });
      /* Another way to the model has a key of its own. */
      apiKey = await loadApiKey(settings);
      draw();
      /* After the redraw, not before: the other window re-registers the
         shortcut when this arrives, and it has to be the one now standing in
         the field. */
      settingsChanged();
    },
    onKeyChange: async (next) => {
      apiKey = await saveApiKey(next, settings);
      draw();
    },
  }), ".settings");
}

draw();

/* A card's "choose a deck" adds its language to the settings and then opens
   this window, which may already stand open. Its own saves come back here
   too, and change nothing. */
await onSettingsChanged(async () => {
  const stored = await loadSettings();
  if (JSON.stringify(stored) === JSON.stringify(settings)) return;
  settings = stored;
  apiKey = await loadApiKey(settings);
  draw();
});

/* A page asked for by whoever opened this window: read from the address when
   the window is new, heard as an event when it stood open. The menu bar's
   entry for updates opens the last page and checks straight away — that is
   what the entry says it does. */
function showPage(key) {
  if (!key) return;
  openPage(key);
  if (key === "about") document.querySelector(".update-check")?.click();
}
showPage(location.hash.slice(1));
await onPageAsked(showPage);

quietContextMenu(document);
closeOnKeys(document, closeSettings);

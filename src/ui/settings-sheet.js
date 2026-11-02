/* The settings on a phone: a sheet over the reading, in the same page.

   A phone's app has one window, so the settings cannot have one of their
   own. They are the same view, read from and written to the same places,
   and a change is told to the reading the way the settings window tells it
   (platform/windows.js). */

import { loadSettings, saveSettings } from "../platform/store.js";
import { loadApiKey, saveApiKey } from "../platform/keychain.js";
import { onSettingsChanged, settingsChanged } from "../platform/windows.js";
import { labels } from "./labels.js";
import { backToList, onPageList, openPage, settingsView } from "./settings-view.js";
import { icon } from "./icons.js";

let open = null;

/* Opened on the list of pages, or on the page asked for: a card's "choose a
   deck" leads straight to the cards. */
export async function openSettingsSheet(page = "") {
  if (open) return;
  let settings = await loadSettings();
  let apiKey = await loadApiKey(settings);

  const sheet = document.createElement("div");
  sheet.className = "settings-sheet";
  const bar = document.createElement("div");
  bar.className = "settings-sheet-bar";
  const title = document.createElement("span");
  /* On a page, the way back to the list in the title's place, as the
     system's own settings have it. */
  const back = document.createElement("button");
  back.type = "button";
  back.className = "settings-back";
  const backLabel = document.createElement("span");
  back.append(icon("previous"), backLabel);
  const done = document.createElement("button");
  done.type = "button";
  bar.append(title, back, done);
  const body = document.createElement("div");
  body.className = "settings-window";
  sheet.append(bar, body);

  /* The bar for the list or for a page; another screen starts at its top. */
  const place = () => {
    const listed = onPageList();
    title.hidden = !listed;
    back.hidden = listed;
  };
  const moved = () => {
    place();
    body.scrollTop = 0;
  };
  back.addEventListener("click", () => {
    backToList();
    moved();
  });

  function draw() {
    const text = labels(settings.languages[0]);
    title.textContent = text.settings;
    backLabel.textContent = text.settings;
    done.textContent = text.settingsDone;
    const at = body.scrollTop;
    body.replaceChildren(settingsView({ settings, apiKey }, {
      onPlace: moved,
      onChange: async (next) => {
        /* A card over the reading may have remembered its language since. */
        const { cards } = await loadSettings();
        settings = await saveSettings({ ...next, cards: { ...next.cards, language: cards.language } });
        /* Another way to the model has a key of its own. */
        apiKey = await loadApiKey(settings);
        draw();
        settingsChanged();
      },
      onKeyChange: async (next) => {
        apiKey = await saveApiKey(next, settings);
        draw();
        settingsChanged();
      },
    }));
    body.scrollTop = at;
    place();
  }

  /* Written meanwhile by a sheet over this one — the answer about the
     model, the first steps put away — and told: read again, as the
     settings window does, or the next change here writes back what this
     sheet read when it opened. Its own saves come back here too, and
     change nothing. */
  const stop = await onSettingsChanged(async () => {
    const stored = await loadSettings();
    if (JSON.stringify(stored) === JSON.stringify(settings)) return;
    settings = stored;
    apiKey = await loadApiKey(settings);
    draw();
  });

  done.addEventListener("click", () => {
    /* A field still being written in saves as it loses the focus. */
    document.activeElement?.blur?.();
    sheet.remove();
    open = null;
    stop();
    settingsChanged();
  });

  open = sheet;
  if (page) openPage(page);
  else backToList();
  draw();
  document.body.append(sheet);
}

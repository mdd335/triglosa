/* A flashcard, in the window it has to itself.

   It knows nothing about the reading it came from: the card arrives whole
   from the shell, and what happens to it afterwards — copied out, or handed
   to Anki — needs only the settings, which this page reads for itself the way
   the settings window does. So the two windows share no state, and switching
   between them takes nothing with it. */

import { onWindows } from "../system.js";
import { loadSettings } from "../platform/store.js";
import { appFetch, copyText } from "../platform/env.js";
import { loadApiKey } from "../platform/keychain.js";
import { createLlmBackend } from "../platform/llm.js";
import { improveCard } from "../ask.js";
import { faultOf } from "../faults.js";
import { isSupported } from "../languages/index.js";
import { createAnkiBackend } from "../platform/anki.js";
import { ankiConfigured, levelFor } from "../settings.js";
import {
  closeCard,
  fitCardWindow,
  onCardChanged,
  onSettingsChanged,
  openSettings,
  takeCard,
} from "../platform/windows.js";
import { faultText, labels, windowTitle } from "./labels.js";
import { renderCard } from "./card-view.js";

let settings = await loadSettings();

const root = document.getElementById("app");
root.className = "card-window";

/* The window's title line, drawn by the page: the system's own is an overlay
   here, so the wand can stand at its right end the way the gear stands in the
   reading window. Dragged by, like the reading window's first line. */
const bar = document.createElement("div");
bar.className = "card-titlebar";
bar.setAttribute("data-tauri-drag-region", "");
const barTitle = document.createElement("span");
barTitle.className = "card-title";
barTitle.setAttribute("data-tauri-drag-region", "");
const wandSlot = document.createElement("span");
wandSlot.className = "window-actions";
bar.append(barTitle, wandSlot);
const body = document.createElement("div");
body.className = "card-body";
root.append(bar, body);

const anki = createAnkiBackend();

/* The page's own height: the sheet, plus the air around it that the
   stylesheet puts there. Measured rather than counted up, because what is in
   the sheet decides it — three fields as tall as their text, and a line under
   the buttons that is not there at all until something has to be said. */
const AIR = 20;
/* On Windows a fractional display scale rounds the window a pixel or two
   short, which the fit leaves alone as noise — and Windows then draws a
   scroll bar where a Mac draws none. */
const SLACK = onWindows() ? 3 : 0;
/* And a ceiling, because an explanation somebody pasted a page into would
   otherwise ask for a window taller than the screen it is on. Past it the
   page scrolls, which is what a window is for. */
const ROOM = () => Math.max(220, (window.screen?.availHeight || 900) - 120);
const fit = (grow) => {
  const sheet = root.querySelector(".card-sheet");
  if (!sheet) return;
  const wanted = Math.ceil(sheet.getBoundingClientRect().height + bar.getBoundingClientRect().height) + AIR + SLACK;
  fitCardWindow(Math.min(wanted, ROOM()), grow);
};

/* Everything that can change the page's height once it is standing: a field
   growing under what is typed into it, and the line that says what came of
   Anki. Only ever taller from here — see fitCardWindow. */
const watch = new ResizeObserver(() => fit(true));

let shown = null;

/* The wand, where there is a model to ask and a language to ask it about. The
   window reads the endpoint and the key for itself, the way it reads the
   settings: the reading window shares nothing with it. A fault is worded here,
   in the reader's language, so the card only has to show the sentence. */
async function improverFor(card, text) {
  if (!settings.endpoint || !isSupported(card.termLanguage) || !isSupported(card.meaningLanguage)) {
    return null;
  }
  const llm = createLlmBackend(
    { endpoint: settings.endpoint, apiKey: await loadApiKey(), model: settings.model },
    await appFetch(),
  );
  return async (current) => {
    try {
      return await improveCard(llm, current, { level: levelFor(settings, current.termLanguage) });
    } catch (error) {
      throw new Error(faultText(settings.languages[0], faultOf(error)));
    }
  };
}

async function draw() {
  const card = await takeCard();
  const text = labels(settings.languages[0]);
  document.title = windowTitle(text.cardCreate);
  barTitle.textContent = document.title;
  if (!card) return;
  shown = { id: card.id };
  renderCard(body, card, {
    wandSlot,
    text,
    reader: settings.languages[0],
    copy: copyText,
    improve: await improverFor(card, text),
    anki: {
      enabled: settings.cards.anki.enabled,
      configured: ankiConfigured(settings),
      fields: settings.cards.anki.fields,
      openSettings: () => openSettings(windowTitle(text.settings)),
      add: (edited) => anki.add(edited, settings.cards.anki),
      start: () => anki.start(),
    },
  });

  /* A new card is fitted either way, up or down: it is a different card, and
     the height the last one needed says nothing about this one. */
  watch.disconnect();
  fit(false);
  const sheet = root.querySelector(".card-sheet");
  if (sheet) watch.observe(sheet);
}

await draw();

/* A second row's button fills this window rather than opening another one, so
   the card can change under a page that is already standing. */
await onCardChanged(draw);

/* Anki may have been switched on, or a deck chosen, in the window this page
   can open. The card itself is untouched by that — only the way out of it
   changes — but the reader has to see that it did. */
await onSettingsChanged(async () => {
  settings = await loadSettings();
  await draw();
});

/* The two keys every window on this system closes with. This app has no menu
   bar of its own — an Accessory app gets none — so neither of them exists
   until it is written down here.

   Escape out of a field being written in leaves the field, it does not leave
   the window: these three fields are the whole point of this page, and a
   window that closed on the first Escape would throw away a correction
   somebody had just finished typing. The second press then closes. */
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const closing = event.key === "Escape"
    || (event.key.toLowerCase() === "w" && (event.metaKey || event.ctrlKey));
  if (!closing) return;
  event.preventDefault();
  const writing = document.activeElement;
  if (event.key === "Escape" && writing && writing.matches("input, textarea")) {
    writing.blur();
    return;
  }
  closeCard();
});

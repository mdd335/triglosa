/* A flashcard, in the window it has to itself.

   It knows nothing about the reading it came from: the card arrives whole
   from the shell, and what happens to it afterwards — copied out, or handed
   to Anki — needs only the settings, which this page reads for itself the way
   the settings window does. So the two windows share no state, and switching
   between them takes nothing with it. */

import { onWindows } from "../system.js";
import { loadSettings, saveSettings } from "../platform/store.js";
import { copyText } from "../platform/env.js";
import { createAnkiBackend } from "../platform/anki.js";
import { ankiConfigured, ankiTarget, withAnkiTarget } from "../settings.js";
import {
  closeCard,
  fitCardWindow,
  onCardChanged,
  onSettingsChanged,
  openSettings,
  settingsChanged,
  takeCard,
} from "../platform/windows.js";
import { labels, windowTitle } from "./labels.js";
import { improverFor } from "./card-improver.js";
import { renderCard } from "./card-view.js";
import { closeOnKeys, quietContextMenu } from "./elements.js";
import { createSpeech } from "../platform/speech.js";

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
const speech = createSpeech();

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
let drawn = null;

/* The language the reader chose on the card's word side, kept for the next
   blank card (cardLanguages). Written without telling the other windows: the
   language is read where a card is made, and a card redrawn for it would
   lose what is being typed. */
async function rememberLanguage(code) {
  const now = await loadSettings();
  if (now.cards.language === code) return;
  settings = await saveSettings({ ...now, cards: { ...now.cards, language: code } });
}

async function draw() {
  const card = await takeCard();
  const text = labels(settings.languages[0]);
  document.title = windowTitle(text.cardCreate);
  barTitle.textContent = document.title;
  if (!card) return;
  /* The same card again is the answer to what it was still waiting for:
     the window keeps its height rather than being fitted anew. */
  const same = !!shown && !!card.id && shown.id === card.id;
  shown = { id: card.id };
  await speech.ready();
  drawn = renderCard(body, card, {
    wandSlot,
    text,
    reader: settings.languages[0],
    copy: copyText,
    speak: speech.speak,
    canSpeak: speech.canSpeak,
    onLanguage: rememberLanguage,
    improve: await improverFor(settings, card),
    improveNow: settings.cards.improve,
    /* Every language has a deck of its own, so where the card goes is asked
       of the language its word side shows — which the reader may change. */
    anki: {
      enabled: settings.cards.anki.enabled,
      configured: ankiConfigured(settings, card.termLanguage),
      fields: ankiTarget(settings, card.termLanguage).fields,
      /* The card's language joins the row of decks, so the settings show
         the one question left: which deck. After the window opens, so that
         it hears the language join and turns to it. */
      openSettings: async () => {
        await openSettings(windowTitle(text.settings), "cards");
        const now = await loadSettings();
        const code = card.termLanguage;
        const next = withAnkiTarget(now, code);
        if (!now.cards.anki.decks[code] && next.cards.anki.decks[code]) {
          await saveSettings(next);
          await settingsChanged();
        }
      },
      add: async (edited) => {
        const target = ankiTarget(settings, edited.termLanguage);
        const answer = await anki.add(edited, target);
        if (answer.kind === "saved" && settings.cards.anki.sync) anki.sync();
        return { ...answer, deck: target.deck };
      },
      start: () => anki.start(),
      /* A card that reached the deck has nothing left to say, and this
         window is the last click of an export nobody wants to make. */
      filed: () => closeCard(),
    },
  });

  /* A new card is fitted either way, up or down: it is a different card, and
     the height the last one needed says nothing about this one. */
  watch.disconnect();
  fit(same);
  const sheet = root.querySelector(".card-sheet");
  if (sheet) watch.observe(sheet);
}

await draw();

/* The card can change under a page that is already standing: a card from
   the shortcut is sent again once its language is found. */
await onCardChanged(draw);

/* Anki may have been switched on, or a deck chosen, in the window this page
   can open. The card itself is untouched by that — only the way out of it
   changes — but the reader has to see that it did. */
await onSettingsChanged(async () => {
  settings = await loadSettings();
  await draw();
});

/* ⌘/Ctrl+Enter is the wand. Escape out of a field leaves the field: these
   three fields are the whole point of this page. */
quietContextMenu(document);

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  drawn?.improve?.();
});
closeOnKeys(document, closeCard);

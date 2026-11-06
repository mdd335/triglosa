/* A flashcard on a phone: a sheet over the reading, in the same page.

   A phone's app has one window, so the card cannot have one of its own.
   It is the same card (card-view.js), with the settings read for itself the
   way the card window reads them, and Anki asked the way a phone's Anki is
   (platform/anki-mobile.js). */

import { CARD_FIELDS } from "../card.js";
import { loadSettings, saveSettings } from "../platform/store.js";
import { copyText } from "../platform/env.js";
import { createAnkiMobile } from "../platform/anki-mobile.js";
import { createSpeech } from "../platform/speech.js";
import { onSettingsChanged, settingsChanged } from "../platform/windows.js";
import { ankiConfigured, ankiTarget, withAnkiTarget } from "../settings.js";
import { labels } from "./labels.js";
import { renderCard } from "./card-view.js";
import { button } from "./elements.js";
import { icon } from "./icons.js";
import { improverFor } from "./card-improver.js";

/* How long the line saying that the card is in the deck stands. */
const SAID_FOR = 4500;

/* A field as tall as what is in it, far beyond a window's twelve lines: the
   sheet has the whole screen and scrolls as one. */
const MOST_LINES = 40;

/* A card that reached the deck closes its sheet at once (author), so that
   it did is said over the reading it gives way to: a line above the bar,
   gone by itself. */
function sayFiled(message) {
  const line = document.createElement("div");
  line.className = "phone-note";
  line.setAttribute("role", "status");
  line.append(icon("done"), message);
  document.body.append(line);
  setTimeout(() => line.remove(), SAID_FOR);
}

let open = null;
let anki = null;
let speech = null;
let listening = false;

/* A card already standing, answered further: taken only while that card
   is the one on the sheet. */
export async function updateCardLayer(card) {
  if (!open || !card.id || open.id !== card.id) return false;
  await open.replace(card);
  return true;
}

/* A reading handed over from outside (the share menu, a Control Center
   button, an address) is shown at once: a card standing over it goes,
   unsaved (author 2026-11-06). */
export function closeCardLayer() {
  open?.close();
}

export async function openCardLayer(first, { fromCopied } = {}) {
  let card = first;
  open?.close();
  let settings = await loadSettings();
  anki = anki || createAnkiMobile();
  speech = speech || createSpeech();
  await speech.ready();

  const layer = document.createElement("div");
  layer.className = "settings-sheet card-layer";
  const bar = document.createElement("div");
  bar.className = "settings-sheet-bar";
  const title = document.createElement("span");
  /* A blank card's way to what was copied, before the wand. */
  const pasteSlot = document.createElement("span");
  pasteSlot.className = "card-wand";
  const wandSlot = document.createElement("span");
  wandSlot.className = "card-wand";
  const done = document.createElement("button");
  done.type = "button";
  bar.append(title, pasteSlot, wandSlot, done);
  const body = document.createElement("div");
  body.className = "card-window";
  layer.append(bar, body);

  const close = () => {
    document.activeElement?.blur?.();
    layer.remove();
    if (open && open.layer === layer) open = null;
  };

  /* The card as its fields hold it now: a drawing after the settings
     changed keeps what was corrected. */
  const held = () => {
    const boxes = [...body.querySelectorAll(".card-box")];
    if (boxes.length !== CARD_FIELDS.length) return card;
    return { ...card, ...Object.fromEntries(CARD_FIELDS.map((role, index) => [role, boxes[index].value])) };
  };

  /* The deck the last card went to, named once it is there. */
  let filedIn = "";

  async function draw(first) {
    const text = labels(settings.languages[0]);
    title.textContent = text.cardCreate;
    pasteSlot.replaceChildren(...(card.free && !card.detecting && fromCopied
      ? [button(text.paste, () => fromCopied(), "paste")]
      : []));
    /* Red, and no "done": the card goes with it, unsaved. */
    done.textContent = text.cardSheetClose;
    done.className = "closes";
    /* Drawn again under the settings, the card takes no caret from them. */
    const writing = first ? null : document.activeElement;
    renderCard(body, first ? card : held(), {
      wandSlot,
      text,
      reader: settings.languages[0],
      copy: copyText,
      speak: speech.speak,
      canSpeak: speech.canSpeak,
      /* Kept for the next blank card, as on a computer (card-window.js). */
      onLanguage: async (code) => {
        const now = await loadSettings();
        if (now.cards.language !== code) settings = await saveSettings({ ...now, cards: { ...now.cards, language: code } });
      },
      improve: await improverFor(settings, card),
      improveNow: first && settings.cards.improve,
      mostLines: MOST_LINES,
      /* Every language has a deck of its own, so where the card goes is
         asked of the language its word side shows. */
      anki: {
        enabled: settings.cards.anki.enabled,
        configured: ankiConfigured(settings, card.termLanguage),
        fields: ankiTarget(settings, card.termLanguage).fields,
        /* The card's language joins the row of decks first, so the
           settings show the one question left: which deck. */
        openSettings: async () => {
          const now = await loadSettings();
          const code = card.termLanguage;
          const next = withAnkiTarget(now, code);
          if (!now.cards.anki.decks[code] && next.cards.anki.decks[code]) {
            await saveSettings(next);
            await settingsChanged();
          }
          (await import("./settings-sheet.js")).openSettingsSheet("cards");
        },
        add: async (edited) => {
          const target = ankiTarget(settings, edited.termLanguage);
          filedIn = target.deck;
          return { ...(await anki.add(edited, target)), deck: target.deck };
        },
        start: async () => false,
        filed: () => { close(); sayFiled(text.ankiSaved(filedIn)); },
        filedAfter: 0,
      },
    });
    /* A card from a row is there to be looked at first; the keyboard comes
       when a field is touched. A blank one is there to be written. */
    /* The keyboard a blank card's button brought up (app.js) is the word
       field's from here on. */
    document.getElementById("keyboard-hold")?.remove();
    if (writing && writing !== document.body && !body.contains(writing)) writing.focus?.();
    else if (!card.free || !first) document.activeElement?.blur?.();
  }

  done.addEventListener("click", close);
  open = {
    layer,
    close,
    id: card.id,
    redraw: async () => { settings = await loadSettings(); await draw(false); },
    replace: async (next) => { card = next; await draw(true); },
  };
  document.body.append(layer);
  await draw(true);

  if (!listening) {
    listening = true;
    /* Anki switched on, or a deck chosen, in the settings over this card. */
    await onSettingsChanged(() => open?.redraw());
  }
}

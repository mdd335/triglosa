/* The flashcard, drawn into the window it has to itself.

   A layer over the reading was the first answer and it was wrong for one
   reason found by using it: a card cannot be corrected while
   looking something up in the reading, because a layer takes the whole
   window and there is no way back and forth. Two windows switch, and the
   reading stays standing — it asks every window this app has before it puts
   itself away.

   What this is for is the step between a row and a deck. The three fields are
   shown before anything is exported, they can be corrected, and they can be
   copied out one by one or as the tab-separated line every flashcard program
   reads. Anki underneath them is one way out of several, and the window works
   with nothing installed at all. */

import { CARD_FIELDS, cardLine, hasCard } from "../card.js";
import { displayName, writingDirection } from "../languages/index.js";
import { button, element, reportOn, select } from "./elements.js";

/* How far a field may grow before it scrolls after all, in lines and in the
   line height the stylesheet gives it. */
const MOST_LINES = 12;
const LINE = 19;

/* Headed with the name of the language it holds — the field is about a
   language, and which one is the first thing to know about it. Only where
   there is no code to ask does the generic word stand instead: a text in a
   language the app cannot name still makes a card. */
function fieldTitle(role, card, text, reader) {
  if (role === "note") return text.cardNote;
  const code = role === "term" ? card.termLanguage : card.meaningLanguage;
  return (code && displayName(code, reader)) || (role === "term" ? text.cardTerm : text.cardMeaning);
}

/* The reader's own language is German or English, so only the word being
   learned can run the other way. */
const fieldDirection = (role, card) =>
  role === "term" ? writingDirection(card.termLanguage) : "ltr";

/* Whether the explanation has somewhere to go in Anki. Said under the field
   rather than swallowed: without it the lines the reader just corrected
   would simply not arrive, and nothing would have said so. */
const unmapped = (role, anki) =>
  role === "note" && anki && anki.configured && !anki.fields.note;

/* The word side's heading, where the card may be in more than one language:
   the language names to choose from, in the heading's own place and look.
   The choice is written into the card, so everything reading the card
   afterwards — the wand, Anki — takes the language shown. */
function languageChoice(card, { text, reader, box }) {
  const node = select(
    card.choices.map((code) => ({ value: code, label: displayName(code, reader) })),
    card.termLanguage,
  );
  node.className = "name";
  node.setAttribute("aria-label", text.cardLanguage);
  node.addEventListener("change", () => {
    card.termLanguage = node.value;
    box.dir = fieldDirection("term", card);
  });
  const holder = element("span", "card-language");
  holder.append(node);
  return holder;
}

/* One field: its heading, a copy button at the right end of that line, and
   the box underneath. */
function cardField(role, card, { text, reader, anki, onCopy }) {
  const wrap = element("div", "card-field");
  const head = element("div", "card-field-head");

  const box = element("textarea");
  box.className = "card-box";
  box.value = card[role] || "";
  box.dir = fieldDirection(role, card);
  box.spellcheck = false;
  box.rows = 1;

  /* The field grows with what is written in it instead of scrolling inside a
     fixed height: these three are meant to be corrected, and a field that
     hides the end of its own line hides exactly what was just typed. Said
     here rather than in the stylesheet, because CSS's own answer for this —
     `field-sizing: content` — is Chromium's and does nothing at all in a
     WKWebView, which is the window this actually runs in.

     Up to a point: the window scrolls as a whole, and an explanation
     somebody pasted a page into may not push the buttons off the bottom. */
  const grow = () => {
    box.style.height = "auto";
    /* The height set is the border box, and `scrollHeight` stops at the
       padding: without the two borders every field came out two pixels
       shorter than its text, scrolled inside itself, and handed the window a
       sheet that measured short by the same amount. */
    const style = box.ownerDocument.defaultView.getComputedStyle(box);
    const px = (value) => parseFloat(value) || 0;
    const borders = px(style.borderTopWidth) + px(style.borderBottomWidth);
    const padding = px(style.paddingTop) + px(style.paddingBottom);
    const most = MOST_LINES * LINE + padding;
    box.style.height = `${Math.min(box.scrollHeight, most) + borders}px`;
  };
  box.addEventListener("input", grow);

  const choosing = role === "term" && Array.isArray(card.choices) && card.choices.length > 1;
  head.append(choosing
    ? languageChoice(card, { text, reader, box })
    : element("span", "name", fieldTitle(role, card, text, reader)));
  head.append(button(text.cardCopyField, (node) =>
    reportOn(node, () => onCopy(box.value), text.copied), "copy"));
  wrap.append(head);
  wrap.append(box);
  if (unmapped(role, anki)) wrap.append(element("p", "hint", text.cardNoteUnmapped));
  /* `grow` is handed back rather than called: the field is not in the
     document yet, and a height read off a node nothing has laid out is
     zero. The caller runs it once the page is in. */
  return { wrap, box, grow };
}

/* The Anki ending, and it is three different buttons depending on what is
   there. Nothing at all where the reader has not switched Anki on: the card
   is then simply a card, and a button that would only lead into a settings
   window they never asked about is an advert.

   Switched on but not answering, it offers to start Anki — the one thing
   this app does to another program, and only on a button that says so.
   Switched on and answering but with no deck chosen, it leads to the one
   place that question belongs.

   What came of it goes in the line under the buttons and **stays there**,
   rather than onto the button for a second and a half. Two reasons: a sentence that explains does not fit on a button, and a
   sentence that goes away again cannot be read twice or copied into a
   question. `reportOn` is the right answer for a row in a reading, where the
   only thing to say is that it worked; it is the wrong one here. */
function ankiButton(current, { text, anki, say }) {
  if (!anki || !anki.enabled) return null;
  if (!anki.configured) {
    return button(text.cardAnkiSetup, () => anki.openSettings());
  }

  return button(text.cardToAnki, async (node) => {
    const label = node.textContent;
    say("", false);
    node.disabled = true;
    node.textContent = text.ankiSending;
    try {
      let answer = await anki.add(current());
      /* Not running is not a refusal. The reader asked for this card to go
         into their deck, and Anki being closed is the ordinary state of a
         program nobody has opened today. */
      if (answer.kind === "unreachable") {
        node.textContent = text.ankiStarting;
        if (await anki.start()) answer = await anki.add(current());
      }
      if (answer.kind === "saved") say(text.ankiSaved, false);
      else if (answer.kind === "duplicate") say(text.ankiDuplicate, false);
      else say(text.ankiFailed(answer), true);
    } catch (error) {
      say(text.ankiFailed({ kind: "error", detail: (error && error.message) || "" }), true);
    } finally {
      node.textContent = label;
      node.disabled = false;
    }
  });
}

/* Draws the card into a host element. Nothing here closes the window: the
   window has a title bar with its own button, and Escape and ⌘W are the
   page's own business — see card-window.js. */
export function renderCard(host, card, { text, reader, anki, copy, improve, wandSlot }) {
  host.textContent = "";
  wandSlot?.replaceChildren();
  if (!card || (!hasCard(card) && !card.free)) return null;

  const sheet = element("div", "card-sheet");

  const boxes = {};
  const grown = [];
  for (const role of CARD_FIELDS) {
    const field = cardField(role, card, { text, reader, anki, onCopy: copy });
    boxes[role] = field.box;
    grown.push(field.grow);
    sheet.append(field.wrap);
  }

  /* What the three fields say right now, not what they said when the window
     was drawn — everything below this point works on the corrected card. */
  const edited = () => {
    const out = { ...card };
    for (const role of CARD_FIELDS) out[role] = boxes[role].value;
    return out;
  };

  const feet = element("div", "card-actions");
  /* What came of the last attempt at Anki or at improving the card, and it
     stays until the next one. Outside the actions row, because a sentence is
     not a button. */
  const status = element("p", "card-status");
  const say = (message, wrong) => {
    status.textContent = message;
    status.classList.toggle("failed", !!wrong);
  };

  feet.append(button(text.cardCopyAll, (node) =>
    reportOn(node, () => copy(cardLine(edited())), text.copied)));
  const toAnki = ankiButton(edited, { text, anki, say });
  if (toAnki) feet.append(toAnki);
  /* The wand stands in the window's title line where the window has one, the
     way the gear stands in the reading window's; the row of buttons is for
     the ways a card leaves. */
  if (improve) (wandSlot || feet).append(improveButton({ text, boxes, grown, edited, improve, say }));
  sheet.append(feet);
  sheet.append(status);

  host.append(sheet);
  /* Now that there is something to measure: what arrived is already several
     lines in the explanation, and one in each of the other two. */
  for (const grow of grown) grow();

  /* The word is what the reader came for, so the caret goes there and a
     correction is one keystroke away. */
  boxes.term.focus();
  boxes.term.select();
  return { sheet };
}

/* The wand: the card rewritten by the model — the word as a dictionary lists
   it, and an explanation with examples — and then the way back to what stood
   there before, on the same place. One step back, not a history: the card
   before the wand is the reader's own, and that is the one worth returning
   to.

   The fields are closed for writing while the model works. A correction typed
   into a field in those seconds would be overwritten by the answer, and a
   reader cannot be expected to know that. */
/* The wand wants something to work from: two letters on either side. A
   blank card from the shortcut has nothing yet, and a wand that answers an
   empty card with an error only says what the reader can see. */
const MIN_LETTERS = 2;
export const enoughToImprove = (card) =>
  ["term", "meaning"].some((role) => (String(card[role] || "").match(/\p{L}/gu) || []).length >= MIN_LETTERS);

function improveButton({ text, boxes, grown, edited, improve, say }) {
  let before = null;
  let working = false;
  const put = (values) => {
    CARD_FIELDS.forEach((role, index) => {
      boxes[role].value = values[role] || "";
      grown[index]();
    });
  };
  const holder = element("span", "card-improve");

  const draw = () => {
    const node = before
      ? button(text.cardUndo, () => {
          put(before);
          before = null;
          say("", false);
          draw();
        }, "undo")
      : button(text.cardImprove, async (node) => {
          const current = edited();
          say(text.cardImproving, false);
          working = true;
          node.disabled = true;
          for (const role of CARD_FIELDS) boxes[role].readOnly = true;
          try {
            const better = await improve(current);
            if (!better) {
              say(text.cardImproveNothing, true);
              return;
            }
            before = Object.fromEntries(CARD_FIELDS.map((role) => [role, current[role]]));
            put(better);
            say("", false);
            draw();
          } catch (error) {
            /* The window words a fault in the reader's language before it
               gets here; anything else says at least that nothing changed. */
            say((error && error.message) || text.cardImproveNothing, true);
          } finally {
            working = false;
            node.disabled = !enoughToImprove(edited());
            for (const role of CARD_FIELDS) boxes[role].readOnly = false;
          }
        }, "improve");
    if (!before) node.disabled = !enoughToImprove(edited());
    holder.replaceChildren(node);
  };
  draw();
  for (const role of ["term", "meaning"]) {
    boxes[role].addEventListener("input", () => {
      const node = holder.querySelector("button");
      if (node && !before && !working) node.disabled = !enoughToImprove(edited());
    });
  }
  return holder;
}

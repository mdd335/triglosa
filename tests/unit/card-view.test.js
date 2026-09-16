/* The flashcard page: the three fields, what they say, and the three
   different endings the Anki button has. Drawn into a jsdom document, the way
   the reading is.

   It has a window to itself, and that is a reversal: a layer over the reading
   was the first answer and it made the card impossible to correct while
   looking something up in the text behind it. So nothing here closes
   anything — the window's own title bar does, and Escape and ⌘W are
   card-window.js's business. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Node = dom.window.Node;

const { renderCard } = await import("../../src/ui/card-view.js");
const { labels } = await import("../../src/ui/labels.js");

const de = labels("de");

const CARD = {
  term: "andar",
  termLanguage: "es",
  meaning: "gehen, laufen",
  meaningLanguage: "de",
  note: "anduvo — 3. Person · Indefinido",
};

function show(card = CARD, over = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const copied = [];
  renderCard(host, card, {
    text: de,
    reader: "de",
    copy: async (value) => { copied.push(value); },
    anki: null,
    ...over,
  });
  const boxes = [...host.querySelectorAll(".card-box")];
  return { host, copied, boxes, sheet: host.querySelector(".card-sheet") };
}

const headings = (host) => [...host.querySelectorAll(".card-field-head .name")].map((n) => n.textContent);
const words = (host) => [...host.querySelectorAll("button")].map((b) =>
  b.querySelector(".pill-label")?.textContent ?? b.textContent);

test("three fields, and each headed by the language in it", () => {
  const { host, boxes } = show();
  assert.strictEqual(boxes.length, 3);
  /* The languages are named from the packs, never from the code — and the
     explanation is the one of the three that is about no language. */
  assert.deepStrictEqual(headings(host), ["Spanisch", "Deutsch", de.cardNote]);
  assert.deepStrictEqual(boxes.map((b) => b.value), [CARD.term, CARD.meaning, CARD.note]);
});

test("a language with no code keeps the generic words", () => {
  /* A text in a language the app cannot name still makes a card. */
  const { host } = show({ ...CARD, termLanguage: "" });
  assert.deepStrictEqual(headings(host), [de.cardTerm, "Deutsch", de.cardNote]);
});

test("the word being learned runs the way its language runs", () => {
  const { boxes } = show({ ...CARD, term: "مَشَى", termLanguage: "ar" });
  assert.strictEqual(boxes[0].dir, "rtl");
  /* The other two are the reader's own language and the explanation written
     in it, and the first language is German or English. */
  assert.strictEqual(boxes[1].dir, "ltr");
  assert.strictEqual(boxes[2].dir, "ltr");
});

test("what is copied is what stands there now, not what arrived", () => {
  const { boxes, copied, host } = show();
  boxes[1].value = "gehen";
  const copyAll = [...host.querySelectorAll(".card-actions button")]
    .find((b) => b.textContent === de.cardCopyAll);
  copyAll.dispatchEvent(new dom.window.MouseEvent("click"));
  assert.deepStrictEqual(copied, ["andar\tgehen\tanduvo — 3. Person · Indefinido"]);
});

test("one field copies on its own", () => {
  const { host, copied } = show();
  const perField = [...host.querySelectorAll(".card-field-head button")];
  assert.strictEqual(perField.length, 3, "every field carries its own");
  perField[2].dispatchEvent(new dom.window.MouseEvent("click"));
  assert.deepStrictEqual(copied, [CARD.note]);
});

/* ---- the Anki ending, which is three different buttons ---- */

test("without Anki switched on the card is simply a card", () => {
  const { host } = show();
  /* No advert for a program the reader did not ask about: what is here is
     copying, and nothing else. */
  assert.deepStrictEqual(words(host), Array(3).fill(de.cardCopyField).concat([de.cardCopyAll]));
});

test("switched on but not set up, it leads to the one place that question belongs", () => {
  let opened = 0;
  const { host } = show(CARD, {
    anki: { enabled: true, configured: false, fields: {}, openSettings: () => { opened++; } },
  });
  const button = [...host.querySelectorAll(".card-actions button")]
    .find((b) => b.textContent === de.cardAnkiSetup);
  assert.ok(button);
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  assert.strictEqual(opened, 1);
});

const CONFIGURED = {
  enabled: true,
  configured: true,
  fields: { term: "Front", meaning: "Back", note: "Extra" },
};

const toAnki = (host) => [...host.querySelectorAll(".card-actions button")]
  .find((b) => b.textContent === de.cardToAnki);
const settled = () => new Promise((done) => setTimeout(done, 0));

test("set up, the card goes where the reader sent it — edits and all", async () => {
  const sent = [];
  const { host, boxes } = show(CARD, {
    anki: { ...CONFIGURED, add: async (card) => { sent.push(card); return { kind: "saved" }; },
            start: async () => true },
  });
  boxes[0].value = "andar (sich bewegen)";
  toAnki(host).dispatchEvent(new dom.window.MouseEvent("click"));
  await settled();
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].term, "andar (sich bewegen)");
  assert.strictEqual(host.querySelector(".card-status").textContent, de.ankiSaved);
});

/* "Not added" on the button, gone again after a second and a half, hid the
   cause: it was in Anki's own answer and was thrown away. So what came of it stands in a line that stays, in the reader's
   language, with Anki's words behind it where they are the explanation. */
test("a refusal says why, and does not take the reason away again", async () => {
  const { host } = show(CARD, {
    anki: {
      ...CONFIGURED,
      add: async () => ({ kind: "empty", detail: "cannot create note because it is empty" }),
      start: async () => true,
    },
  });
  const button = toAnki(host);
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  await settled();

  const status = host.querySelector(".card-status");
  assert.ok(status.classList.contains("failed"));
  assert.ok(status.textContent.includes("erste Feld"), "what to do about it");
  assert.ok(status.textContent.includes("cannot create note because it is empty"),
    "and Anki's own words, which are the explanation here");

  /* The button goes back to being a button; the sentence does not go
     anywhere. */
  await new Promise((done) => setTimeout(done, 1600));
  assert.strictEqual(button.textContent, de.cardToAnki);
  assert.ok(status.textContent.includes("erste Feld"), "still there");
});

test("a fresh attempt clears the last answer first", async () => {
  const answers = [{ kind: "error", detail: "boom" }, { kind: "saved" }];
  const { host } = show(CARD, {
    anki: { ...CONFIGURED, add: async () => answers.shift(), start: async () => true },
  });
  const button = toAnki(host);
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  await settled();
  assert.ok(host.querySelector(".card-status").classList.contains("failed"));
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  await settled();
  const status = host.querySelector(".card-status");
  assert.strictEqual(status.textContent, de.ankiSaved);
  assert.ok(!status.classList.contains("failed"));
});

/* A duplicate is not a failure: the card is in the deck, which is what the
   reader wanted. It still says so, because "nothing happened" is the one
   thing a reader cannot tell from a button. */
test("a card already in the deck says so without turning red", async () => {
  const { host } = show(CARD, {
    anki: { ...CONFIGURED, add: async () => ({ kind: "duplicate", detail: "duplicate" }),
            start: async () => true },
  });
  toAnki(host).dispatchEvent(new dom.window.MouseEvent("click"));
  await settled();
  const status = host.querySelector(".card-status");
  assert.strictEqual(status.textContent, de.ankiDuplicate);
  assert.ok(!status.classList.contains("failed"));
});

/* Anki being closed is the ordinary state of a program nobody has opened
   today, not a refusal — so the card is not lost to it. */
test("a closed Anki is started and the card sent again", async () => {
  let started = 0;
  const results = [{ kind: "unreachable" }, { kind: "saved" }];
  const { host } = show(CARD, {
    anki: {
      enabled: true,
      configured: true,
      fields: { term: "Front", meaning: "Back", note: "Extra" },
      add: async () => results.shift(),
      start: async () => { started++; return true; },
    },
  });
  const button = [...host.querySelectorAll(".card-actions button")]
    .find((b) => b.textContent === de.cardToAnki);
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  await new Promise((done) => setTimeout(done, 0));
  assert.strictEqual(started, 1);
  assert.strictEqual(results.length, 0, "and tried a second time");
  assert.ok(!host.querySelector(".card-status").classList.contains("failed"));
});

test("an explanation with nowhere to go says so", () => {
  const withField = show(CARD, {
    anki: { enabled: true, configured: true, fields: { term: "Front", note: "Extra" },
            add: async () => "saved", start: async () => true },
  });
  assert.strictEqual(withField.host.querySelectorAll(".card-field .hint").length, 0);

  /* Without it the lines the reader has just corrected would simply not
     arrive, and nothing would have said so. */
  const without = show(CARD, {
    anki: { enabled: true, configured: true, fields: { term: "Front", note: "" },
            add: async () => "saved", start: async () => true },
  });
  const hint = without.host.querySelector(".card-field .hint");
  assert.strictEqual(hint.textContent, de.cardNoteUnmapped);
  assert.strictEqual(hint.closest(".card-field").querySelector(".name").textContent, de.cardNote);
});





/* CSS's own answer, `field-sizing: content`, is Chromium's and does nothing
   in the WKWebView this runs in — so the height is set from the code, and
   that is worth pinning. */
test("a field grows with what is written in it", () => {
  const { boxes } = show();
  /* jsdom reports no layout, so what is checked is that the height is being
     set at all and that it is capped rather than unbounded. */
  Object.defineProperty(boxes[2], "scrollHeight", { value: 4000, configurable: true });
  boxes[2].dispatchEvent(new dom.window.Event("input"));
  const set = Number.parseFloat(boxes[2].style.height);
  assert.ok(set > 0, "a height is set");
  assert.ok(set < 4000, "and it does not follow the content off the sheet");
});

test("an empty word draws nothing at all", () => {
  const { host } = show({ term: "  ", meaning: "gehen", note: "" });
  assert.strictEqual(host.childElementCount, 0);
});

/* The page has a window to itself, so the card is the page and not a layer
   in one. Worth pinning: it was the other way round, and the reason it
   changed was that a layer cannot be left while a card is being corrected. */
test("the card is the page, with no layer and nothing to dismiss", () => {
  const { host, sheet } = show();
  assert.ok(sheet, "a sheet");
  assert.strictEqual(host.firstElementChild, sheet, "and nothing over it");
  assert.strictEqual(host.querySelectorAll(".card-layer").length, 0);
  /* Four buttons and no fifth: one copy per field, and one for all three.
     The way out is the window's own — two of them in one corner is one too
     many, and a page that drew its own would be the second. */
  assert.strictEqual(host.querySelectorAll("button").length, 4);
});

/* One card at a time: a second row's button fills the window that is already
   standing rather than opening another. */
test("a second card replaces the one on the page", () => {
  const host = document.createElement("div");
  renderCard(host, CARD, { text: de, reader: "de", copy: async () => {}, anki: null });
  renderCard(host, { ...CARD, term: "correr", meaning: "laufen" },
    { text: de, reader: "de", copy: async () => {}, anki: null });
  const boxes = [...host.querySelectorAll(".card-box")];
  assert.strictEqual(boxes.length, 3, "three fields, not six");
  assert.strictEqual(boxes[0].value, "correr");
});

test("a field is as tall as its text, borders included", () => {
  /* The height set is the border box and `scrollHeight` stops at the padding,
     so a field set to it alone was two pixels short of its own text — it
     scrolled inside itself, and the window it measured for came out short. */
  const { boxes } = show();
  const box = boxes[2];
  box.style.border = "1px solid black";
  box.style.padding = "8px 10px";
  Object.defineProperty(box, "scrollHeight", { configurable: true, get: () => 73 });
  box.dispatchEvent(new window.Event("input"));
  assert.strictEqual(box.style.height, "75px");
});

test("the wand rewrites the card, and the same place then takes it back", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let release;
  const answered = new Promise((resolve) => { release = resolve; });
  let asked = null;
  renderCard(host,
    { term: "brazos", termLanguage: "es", meaning: "Arme", meaningLanguage: "de", note: "alt" },
    {
      text: de, reader: "de", copy: async () => {}, anki: null,
      improve: async (card) => { asked = card; await answered; return { term: "el brazo", meaning: "der Arm", note: "neu" }; },
    });
  const boxes = [...host.querySelectorAll(".card-box")];
  const wand = () => host.querySelector('.card-improve button');
  assert.strictEqual(wand().dataset.icon, "improve");

  boxes[1].value = "die Arme";
  wand().click();
  /* What stands in the fields now is what is improved, and nobody writes
     into them while the model works. */
  assert.strictEqual(asked.meaning, "die Arme");
  assert.ok(boxes.every((box) => box.readOnly));
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepStrictEqual(boxes.map((box) => box.value), ["el brazo", "der Arm", "neu"]);
  assert.ok(boxes.every((box) => !box.readOnly));
  assert.strictEqual(wand().dataset.icon, "undo");

  wand().click();
  assert.deepStrictEqual(boxes.map((box) => box.value), ["brazos", "die Arme", "alt"]);
  assert.strictEqual(wand().dataset.icon, "improve");
});

test("no usable answer leaves the card as it was and says so", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  renderCard(host,
    { term: "brazos", termLanguage: "es", meaning: "Arme", meaningLanguage: "de", note: "alt" },
    { text: de, reader: "de", copy: async () => {}, anki: null, improve: async () => null });
  host.querySelector(".card-improve button").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(host.querySelector(".card-box").value, "brazos");
  assert.strictEqual(host.querySelector(".card-status").textContent, de.cardImproveNothing);
  assert.strictEqual(host.querySelector(".card-improve button").dataset.icon, "improve");
});

test("without a model there is no wand", () => {
  const host = document.createElement("div");
  renderCard(host, { term: "caja", termLanguage: "es", meaning: "Kasse", meaningLanguage: "de" },
    { text: de, reader: "de", copy: async () => {}, anki: null });
  assert.strictEqual(host.querySelector(".card-improve"), null);
});

test("the wand stands in the title line where the window gives it one", () => {
  const host = document.createElement("div");
  const slot = document.createElement("span");
  const card = { term: "caja", termLanguage: "es", meaning: "Kasse", meaningLanguage: "de" };
  const options = { text: de, reader: "de", copy: async () => {}, anki: null, improve: async () => null, wandSlot: slot };
  renderCard(host, card, options);
  assert.strictEqual(slot.querySelectorAll(".card-improve").length, 1);
  assert.strictEqual(host.querySelector(".card-improve"), null);
  renderCard(host, card, options);
  assert.strictEqual(slot.querySelectorAll(".card-improve").length, 1, "a second card replaces it");
});

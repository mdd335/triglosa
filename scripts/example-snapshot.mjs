/* The first steps' example, taken once from the reading window and kept:
   the example in the first steps draws this snapshot (src/ui/example-view.js)
   and never the reading window itself, so a change to the reading window
   leaves it as it is (author 2026-11-13). Run again only to take the
   reading window's look of the day into the example on purpose, or after an
   example's text changed (a test says so) and the aligner's links were made
   again (scripts/example-links.mjs).

   For every interface language, in a document of its own (jsdom), the
   reading the example stands for is drawn by the reading window's own
   function and pointed at word by word through its own hover. Kept: the
   sheet as drawn, for every word of the three texts what the sign over it
   says and which stretches light up, and for every word of the original
   the sheet's texts and the entry under them once it is picked.

     node scripts/example-snapshot.mjs */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.TRIGLOSA_SYSTEM = "mac";

const { renderReading } = await import("../src/ui/reading-view.js");
const { watchGlance, GLANCE_DELAY } = await import("../src/ui/glance-view.js");
const { element } = await import("../src/ui/elements.js");
const { glancePairs, placeThird, placeUnits } = await import("../src/glance.js");
const { unitsFromLinks, unitsOfThird } = await import("../src/parse/glance.js");
const { EXAMPLE_LINKS } = await import("../src/ui/example-links.js");
const { languageLabel } = await import("../src/languages/index.js");
const { INTERFACE_LANGUAGES, labels } = await import("../src/ui/labels.js");

/* The hover over the example as a reading's: the aligner's links for its
   texts, laid out by the same functions. */
function exampleGlance(example, reader) {
  const [mine, other] = example.panels;
  const linked = EXAMPLE_LINKS[reader];
  if (!linked || linked.texts.join("\n") !== [example.text, mine.text, other.text].join("\n")) {
    throw new Error(`${reader}: the aligner's links were made for other texts — node scripts/example-links.mjs first`);
  }
  const codes = [example.source, mine.code, other.code];
  const [pair] = glancePairs(example.text, mine.text);
  const [second] = glancePairs(example.text, other.text);
  const sentence = { ...pair, second: second.to };
  const units = unitsFromLinks(example.text, mine.text, linked.own, [codes[0], codes[1]],
    { text: other.text, links: linked.other, codes: [codes[0], codes[2]] }, { fill: true });
  const third = unitsOfThird({ original: example.text, own: mine.text, other: other.text,
    links: { own: linked.own, other: linked.other, between: linked.between }, codes });
  return {
    panels: [1, 2],
    reader: 1,
    by: "aligner",
    sentences: [{ ...sentence, status: "done", units: placeUnits(sentence, units, { to: second.to }),
                  ...(third ? { third: placeThird(sentence, third) } : {}) }],
  };
}

/* The reading the example stands for, in the shape a finished run leaves. */
function exampleState(example, reader) {
  const [mine, other] = example.panels;
  const named = (code) => languageLabel(code, reader) || code;
  const without = ({ in: _, ...rest }) => rest;
  return {
    text: example.text,
    short: false,
    sentence: null,
    source: { code: example.source, name: named(example.source) },
    panels: [
      { code: example.source, name: named(example.source), status: "ready", text: example.text },
      { code: mine.code, name: named(mine.code), status: "ready", text: mine.text },
      { code: other.code, name: named(other.code), status: "ready", text: other.text },
    ],
    words: example.terms.map(without),
    verbs: example.verbs.map(without),
    forms: example.verbs.map((verb) => verb.form),
    wordAlign: { a: example.terms.map((term) => [term.in[0]]), b: example.terms.map((term) => [term.in[1]]) },
    verbAlign: { a: example.verbs.map((verb) => [verb.in[0]]), b: example.verbs.map((verb) => [verb.in[1]]) },
    glance: exampleGlance(example, reader),
    links: null,
    status: { words: "", verbs: "", panels: "" },
    spelling: null,
    fault: null,
    busy: false,
    model: "",
  };
}

/* The reader's own language first, the other two after it, every section
   shown, and a model standing behind it — without one the reading window
   draws neither terms nor verbs. */
const exampleSettings = (example, reader) => ({
  languages: [reader, example.source, example.panels[1].code],
  levels: {},
  show: { verbs: "foreign", terms: "foreign" },
  endpoint: "https://example.invalid/v1",
  model: "",
  glance: true,
  underline: true,
  cards: { mode: "learned", anki: { enabled: false, decks: {}, sync: false } },
});

const NOTHING = () => {};
const TOOLS = (reader) => ({
  reader, copy: NOTHING, open: NOTHING, search: NOTHING, card: NOTHING, cardFor: () => true,
  insert: null, speak: NOTHING, canSpeak: () => true,
});

const folded = (words) => String(words || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();

/* Where a spot stands in a translation: of several, the one whose place in
   its sentence is nearest to the picked word's place in the original. */
function placeOf(text, spot, near) {
  if (!spot) return null;
  const found = [];
  const lower = text.toLocaleLowerCase();
  const wanted = spot.toLocaleLowerCase();
  const letter = /[\p{L}\p{N}]/u;
  for (let at = lower.indexOf(wanted); at !== -1; at = lower.indexOf(wanted, at + 1)) {
    const end = at + wanted.length;
    if (letter.test(text[at - 1] || "") || letter.test(text[end] || "")) continue;
    found.push({ start: at, end });
  }
  if (!found.length) return null;
  const distance = (range) => Math.abs(range.start / text.length - near);
  return [found.reduce((best, range) => (distance(range) < distance(best) ? range : best))];
}

/* A word without an entry of its own takes that of the marked term it
   stands in, the whole term then picked. */
function around(example, choice) {
  const text = example.text.toLocaleLowerCase();
  for (const pick of example.picks || []) {
    const words = pick.text.trim();
    const at = text.indexOf(words.toLocaleLowerCase());
    if (at === -1 || !/\s/.test(words)) continue;
    const end = at + words.length;
    if (choice.start >= at && choice.end <= end) return { entry: pick, start: at, end };
  }
  return null;
}

function pickedState(example, state, choice) {
  let term = example.text.slice(choice.start, choice.end).trim();
  let entry = (example.picks || []).find((pick) => folded(pick.text) === folded(term));
  if (!entry) {
    const whole = around(example, choice);
    if (!whole) return null;
    choice = { ...choice, start: whole.start, end: whole.end };
    term = example.text.slice(whole.start, whole.end).trim();
    entry = whole.entry;
  }
  const { in: spots = [], ...said } = entry;
  const near = choice.start / example.text.length;
  const ranges = {};
  spots.forEach((spot, at) => { ranges[at + 1] = placeOf(state.panels[at + 1].text, spot, near); });
  return {
    ...state,
    selection: { panel: 0, start: choice.start, end: choice.end, term },
    marked: {
      infinitive: "", person: "", tense: "", note: "", synonyms: [], ...said,
      text: term, meaningLanguage: example.panels[0].code, ranges,
    },
    markedStatus: "",
    markedTrail: null,
  };
}

function drawn(sheet, state, settings, reader, example) {
  renderReading(sheet, state, {
    settings,
    tools: TOOLS(reader),
    edit: { editing: false, draft: example.text, onDraft: NOTHING, onEdit: NOTHING, onTranslate: NOTHING },
    onPick: NOTHING, onLookUp: NOTHING, onStep: NOTHING, onFold: null, onMore: NOTHING, onExample: NOTHING,
  });
  /* A picture to look at: no fold to close. */
  for (const node of sheet.querySelectorAll(".fold")) node.remove();
  /* The heading over the original stands over the sheet in the reading
     window, in its first line; here it is the first pane's own. */
  const original = sheet.querySelector(".pane");
  if (original && !original.querySelector(".label")) {
    const label = element("div", "label");
    label.append(element("span", "name", state.source.name), element("span", "status", ""));
    original.prepend(label);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* The lit stretches of a panel, as [panel, start, end] in its text. */
function litIn(sheet, panel) {
  const out = [];
  for (const piece of sheet.querySelectorAll(`.words[data-panel="${panel}"] .glance-lit`)) {
    const from = Number(piece.dataset.from);
    const to = Number(piece.dataset.to);
    const last = out[out.length - 1];
    if (last && !piece.classList.contains("glance-start")) last[2] = to;
    else out.push([panel, from, to]);
  }
  return out;
}

/* A text's box once a word is picked, as what changed against the box
   unpicked: [characters kept in front, characters kept behind, what
   stands between]. The picked word's frame and its spots change a few
   words; the rest of the box is the same. */
function changed(before, after, panel) {
  const was = before.querySelector(`.words[data-panel="${panel}"]`).innerHTML;
  const now = after.querySelector(`.words[data-panel="${panel}"]`).innerHTML;
  let front = 0;
  while (front < was.length && front < now.length && was[front] === now[front]) front++;
  let back = 0;
  while (back < was.length - front && back < now.length - front && was[was.length - 1 - back] === now[now.length - 1 - back]) back++;
  return [front, back, now.slice(front, now.length - back)];
}

async function snapshot(code) {
  const example = labels(code).welcome.example;
  const state = exampleState(example, code);
  const settings = exampleSettings(example, code);
  const holder = element("div", "welcome-example");
  const sheet = element("div", "sheet welcome-example-sheet");
  holder.append(sheet);
  document.querySelector("#app").append(holder);
  drawn(sheet, state, settings, code, example);
  const html = sheet.innerHTML;

  /* Every word pointed at, as the reading window answers it. */
  const glance = watchGlance({ sheet, layer: holder, reading: () => ({ state, reader: code }) });
  const hover = {};
  for (const panel of [0, 1, 2]) {
    for (const word of sheet.querySelectorAll(`.words[data-panel="${panel}"] .w`)) {
      glance.hide();
      word.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true }));
      await wait(GLANCE_DELAY + 20);
      const sign = holder.querySelector(".glance.shown")?.textContent || "";
      const lit = [0, 1, 2].flatMap((at) => litIn(sheet, at));
      if (sign || lit.length) hover[`${panel}:${word.dataset.from}`] = [sign, lit];
    }
  }
  glance.hide();
  holder.querySelector(".glance")?.remove();

  /* Every word of the original picked: the three texts and the entry. */
  const entries = [];
  const picks = {};
  for (const word of sheet.querySelectorAll('.words[data-panel="0"] .w')) {
    const picked = pickedState(example, state, { panel: 0, start: Number(word.dataset.from), end: Number(word.dataset.to) });
    if (!picked) continue;
    const scratch = element("div", "sheet");
    drawn(scratch, picked, settings, code, example);
    const boxes = [0, 1, 2].map((panel) => changed(sheet, scratch, panel));
    const pane = scratch.querySelector('.row[data-hl="sel"]').closest(".pane").outerHTML;
    const key = JSON.stringify([boxes, pane]);
    let at = entries.findIndex((one) => one.key === key);
    if (at === -1) at = entries.push({ key, boxes, pane }) - 1;
    picks[word.dataset.from] = at;
  }
  holder.remove();
  return {
    texts: [example.text, ...example.panels.map((panel) => panel.text)],
    sheet: html,
    hover,
    picks,
    entries: entries.map(({ boxes, pane }) => ({ boxes, pane })),
  };
}

const out = {};
for (const code of INTERFACE_LANGUAGES) out[code] = await snapshot(code);
const file = path.join(root, "src", "ui", "example-snapshot.js");
fs.writeFileSync(file, `/* The first steps' example as the reading window drew it, per interface
   language: written by scripts/example-snapshot.mjs, never by hand.
   \`texts\` are the original, the reader's translation and the other one;
   \`sheet\` the sheet as drawn; \`hover\` per word ("panel:start") the sign
   over it and the stretches lit, as [panel, start, end]; \`picks\` per word
   of the original the entry it brings, from \`entries\`: the three texts as
   then drawn, each as [characters kept in front, characters kept behind,
   what stands between] against \`sheet\`'s, and the pane under them. */

export const EXAMPLE_SNAPSHOT = ${JSON.stringify(out, null, 1).replace(/\[\s+(\d+),\s+(\d+),\s+(\d+)\s+\]/g, "[$1,$2,$3]")};
`);
console.log(`${Object.keys(out).length} examples → ${path.relative(root, file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);

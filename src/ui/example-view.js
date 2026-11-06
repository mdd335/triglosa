/* The example in the first steps: a reading made beforehand and drawn the
   way the reading window draws one — the original, the translation into the
   reader's own language and one more, the terms and the verb marked in all
   three, and what each word became under the pointer. Nothing is asked of a
   model or of the device, so it stands at once, on a first start with
   nothing set up, on every system.

   What it holds is written in the reader's interface language, in its label
   file (`welcome.example`): the original, the two translations, the terms
   and the verb with where each went. The hover is the word aligner's, as in
   a reading: its links, made once by scripts/example-links.mjs, go through
   the same functions a reading's do. Its buttons come with the pointer as
   they do in a reading, to show what there is; none of them does
   anything. */

import { renderReading } from "./reading-view.js";
import { watchGlance } from "./glance-view.js";
import { element } from "./elements.js";
import { glancePairs, placeThird, placeUnits } from "../glance.js";
import { unitsFromLinks, unitsOfThird } from "../parse/glance.js";
import { EXAMPLE_LINKS } from "./example-links.js";
import { languageLabel } from "../languages/index.js";
import { onPhone } from "../system.js";

/* The hover over the example as a reading's: the aligner's links for its
   texts, laid out by the same functions. Nothing where the links were made
   for other texts — an example changed since, which a test catches. */
function exampleGlance(example, reader) {
  const [mine, other] = example.panels;
  const linked = EXAMPLE_LINKS[reader];
  if (!linked || linked.texts.join("\n") !== [example.text, mine.text, other.text].join("\n")) return null;
  const codes = [example.source, mine.code, other.code];
  const [pair] = glancePairs(example.text, mine.text);
  const [second] = glancePairs(example.text, other.text);
  const sentence = { ...pair, second: second.to };
  const units = unitsFromLinks(example.text, mine.text, linked.own, [codes[0], codes[1]],
    { text: other.text, links: linked.other, codes: [codes[0], codes[2]] }, { fill: true });
  if (!units) return null;
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
export function exampleState(example, reader) {
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

/* The settings the example is drawn with: the reader's own language first,
   the other two after it, every section shown, and a model standing behind
   it — without one the reading window draws neither terms nor verbs. */
function exampleSettings(example, reader) {
  return {
    languages: [reader, example.source, example.panels[1].code],
    levels: {},
    show: { verbs: "foreign", terms: "foreign" },
    endpoint: "https://example.invalid/v1",
    model: "",
    glance: true,
    underline: true,
    cards: { mode: "learned", anki: { enabled: false, decks: {}, sync: false } },
  };
}

const NOTHING = () => {};
const TOOLS = (reader) => ({
  reader, copy: NOTHING, open: NOTHING, search: NOTHING, card: NOTHING, cardFor: () => true,
  insert: null, speak: NOTHING, canSpeak: () => true,
});

/* A word picked in the original, as a finished pick leaves it: the entry
   written beforehand for it (`example.picks`), its spots in the two
   translations where the reading window would have asked for them. */
const folded = (words) => String(words || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();

/* Where a spot stands in a translation. A word can stand there more than
   once — "in" twice in the German sentence — and the first is not always
   the one meant: the one whose place in its sentence is nearest to the
   picked word's place in the original. */
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

/* The entry for a word without one of its own: that of the marked term it
   stands in, the whole term then picked — the example has no entry for
   "casco" alone, and a click on it answering nothing would look broken. */
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

export function pickedState(example, state, picked) {
  if (!picked || picked.panel !== 0 || picked.dragging || picked.entry != null || picked.inSentence) return null;
  let choice = picked;
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
  spots.forEach((spot, at) => {
    /* No spot written is nothing to mark, not a spot to guess. */
    const place = placeOf(state.panels[at + 1].text, spot, near);
    if (place || !spot) ranges[at + 1] = place;
  });
  return {
    ...state,
    selection: { panel: 0, start: choice.start, end: choice.end, term },
    marked: {
      infinitive: "", person: "", tense: "", note: "", synonyms: [], ...said,
      text: term, meaningLanguage: example.panels[0].code, a: spots[0] || "", b: spots[1] || "", ranges,
    },
    markedStatus: "",
    markedTrail: null,
  };
}

export function exampleView(example, reader, { onResize = () => {} } = {}) {
  const holder = element("div", "welcome-example");
  const sheet = element("div", "sheet welcome-example-sheet");
  holder.append(sheet);
  let state = exampleState(example, reader);
  const settings = exampleSettings(example, reader);

  /* A word of the original picked: its entry under the translations and its
     spots in them, as in a reading. Several words at once, a translation's
     words or a synonym are not part of the example. */
  const onPick = (choice) => {
    const picked = pickedState(example, state, choice);
    if (!picked) return;
    state = picked;
    draw();
    onResize();
  };

  const draw = () => {
    renderReading(sheet, state, {
      settings,
      tools: TOOLS(reader),
      edit: { editing: false, draft: example.text, onDraft: NOTHING, onEdit: NOTHING, onTranslate: NOTHING },
      onPick, onLookUp: NOTHING, onStep: NOTHING, onFold: null, onMore: NOTHING, onExample: NOTHING,
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
  };
  draw();

  /* A press on a button says nothing, not even "copied". */
  sheet.addEventListener("click", (event) => {
    if (!event.target.closest?.(".actions button, .row-actions button, .synonym")) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  /* A row under the pointer lights its spots in the three texts, as in the
     reading window: the attribute on the window's own root, which the
     stylesheet reads. */
  const root = () => holder.closest("#app");
  sheet.addEventListener("mouseover", (event) => {
    const row = event.target.closest?.(".row[data-hl]");
    if (row && root()) root().dataset.hl = row.dataset.hl;
  });
  sheet.addEventListener("mouseout", (event) => {
    if (event.target.closest?.(".row[data-hl]") && root()) delete root().dataset.hl;
  });
  /* The phone has no hover: a tap is turned into a pointer passing over,
     and the word's bubble flashed up under the finger. */
  if (!onPhone()) watchGlance({ sheet, layer: holder, reading: () => ({ state, reader }) }).refresh();
  return holder;
}

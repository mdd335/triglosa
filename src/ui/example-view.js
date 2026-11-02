/* The example in the first steps: a reading made beforehand and drawn the
   way the reading window draws one — the original, the translation into the
   reader's own language and one more, the terms and the verb marked in all
   three, and what each word became under the pointer. Nothing is asked of a
   model or of the device, so it stands at once, on a first start with
   nothing set up, on every system.

   What it holds is written in the reader's interface language, in its label
   file (`welcome.example`): the original, the two translations, the terms
   and the verb with where each went, and the hover's answer in the shape a
   model gives it. Its buttons come with the pointer as they do in a reading,
   to show what there is; none of them does anything. */

import { renderReading } from "./reading-view.js";
import { watchGlance } from "./glance-view.js";
import { element } from "./elements.js";
import { glancePairs, placeUnits } from "../glance.js";
import { parseGlanceWide } from "../parse/glance.js";
import { languageLabel } from "../languages/index.js";

/* The reading the example stands for, in the shape a finished run leaves. */
export function exampleState(example, reader) {
  const [mine, other] = example.panels;
  const named = (code) => languageLabel(code, reader) || code;
  const [pair] = glancePairs(example.text, mine.text);
  const [second] = glancePairs(example.text, other.text);
  const units = parseGlanceWide(example.glance, example.text, mine.text, other.text,
    [example.source, mine.code, other.code]);
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
    glance: units
      ? { panels: [1, 2], reader: 1, sentences: [{ ...pair, second: second.to, status: "done", units: placeUnits(pair, units, { to: second.to }) }] }
      : null,
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

export function exampleView(example, reader) {
  const holder = element("div", "welcome-example");
  const sheet = element("div", "sheet welcome-example-sheet");
  holder.append(sheet);
  const state = exampleState(example, reader);
  renderReading(sheet, state, {
    settings: exampleSettings(example, reader),
    tools: TOOLS(reader),
    edit: { editing: false, draft: example.text, onDraft: NOTHING, onEdit: NOTHING, onTranslate: NOTHING },
    onPick: NOTHING, onLookUp: NOTHING, onStep: NOTHING, onFold: null, onMore: NOTHING, onExample: NOTHING,
  });
  /* A picture to look at: no fold to close, and a press on a button says
     nothing, not even "copied". */
  for (const node of sheet.querySelectorAll(".fold")) node.remove();
  sheet.addEventListener("click", (event) => {
    if (!event.target.closest?.(".actions button, .row-actions button")) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  /* The heading over the original stands over the sheet in the reading window, in
     its first line; here it is the first pane's own. */
  const original = sheet.querySelector(".pane");
  if (original && !original.querySelector(".label")) {
    const label = element("div", "label");
    label.append(element("span", "name", state.source.name), element("span", "status", ""));
    original.prepend(label);
  }
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
  const glance = watchGlance({ sheet, layer: holder, reading: () => ({ state, reader }) });
  glance.refresh();
  return holder;
}

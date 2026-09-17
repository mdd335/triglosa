/* The drawing of one reading, in a document of its own.

   Why this file exists: everything under `src/ui/` was measured by
   photograph and by reading, and both are worth what the person doing them
   happened to think of. Every one of the faults found in the round of checks
   that produced these tests was invisible to the whole suite — a section that
   stood at "…" for ever, a click that asked the model four questions and drew
   nothing, a panel telling the reader to download a language pack that was
   already there. None of them could fail a test, because nothing here had
   one.

   `jsdom` is the one dependency this file needs, and it is a dev dependency:
   `renderReading` is handed a node and fills it, so a document is all it
   wants. The globals are set BEFORE the module is imported, because the
   module reaches for `document` while it is being evaluated. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"><div id=\"sheet\"></div></div>", {
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Node = dom.window.Node;

const { MARKED, renderReading } = await import("../../src/ui/reading-view.js");
const { labels } = await import("../../src/ui/labels.js");

const de = labels("de");

const SETTINGS = {
  languages: ["de", "es", "en"],
  levels: {},
  show: { verbs: "foreign", terms: "foreign" },
  endpoint: "http://model.invalid/v1",
  model: "a-model",
  cards: { mode: "foreign", anki: { enabled: false, deck: "", noteType: "", fields: {} } },
};

const TOOLS = {
  reader: "de",
  copy: async () => {},
  open: async () => {},
  search: async () => {},
  card: null,
  cardFor: () => false,
  insert: null,
};

/* A finished Spanish reading with two translations. Every test starts from
   this and changes the one thing it is about. */
function reading(over = {}) {
  return {
    text: "Ayer el gobierno impugnó el acuerdo.",
    short: false,
    source: { code: "es", name: "Spanisch" },
    panels: [
      { code: "es", name: "Spanisch", status: "ready", text: "Ayer el gobierno impugnó el acuerdo." },
      { code: "de", name: "Deutsch", status: "ready", text: "Gestern focht die Regierung das Abkommen an." },
      { code: "en", name: "Englisch", status: "ready", text: "Yesterday the government challenged the agreement." },
    ],
    words: [],
    verbs: [],
    forms: [],
    wordAlign: null,
    verbAlign: null,
    status: { words: "", verbs: "", panels: "" },
    fault: null,
    busy: false,
    ...over,
  };
}

function draw(state, settings = SETTINGS, handlers = {}) {
  const sheet = document.createElement("div");
  const heading = renderReading(sheet, state, {
    settings,
    tools: handlers.tools || TOOLS,
    edit: {
      editing: false,
      draft: state?.panels?.[0]?.text || "",
      onDraft() {},
      onEdit() {},
      onTranslate() {},
    },
    onPick: handlers.onPick || (() => {}),
    onLookUp: handlers.onLookUp || (() => {}),
    onStep: handlers.onStep || (() => {}),
    onFold: handlers.onFold,
    onMore: handlers.onMore,
    onExample: handlers.onExample,
  });
  return { sheet, heading };
}

/* The sections, by the word in their heading line — and only those that have
   one. The original is drawn `bare`: its heading is the line above the sheet,
   because that line carries the window's own buttons and may not scroll away
   with the text. */
const sections = ({ sheet }) =>
  [...sheet.querySelectorAll(".pane")].filter((pane) => pane.querySelector(".label")).map((pane) => ({
    title: pane.querySelector(".label .name")?.textContent || "",
    status: pane.querySelector(".label .status")?.textContent || "",
    body: pane.querySelector(".box")?.textContent || "",
    rows: [...pane.querySelectorAll(".row")],
    node: pane,
  }));

const titles = (drawn) => sections(drawn).map((s) => s.title);
const sectionNamed = (drawn, title) => sections(drawn).find((s) => s.title === title);
/* The area for a picked word names the panel it was picked in, the way the
   first line names what the reading turned out to be. */
const markedIn = (name) => `${de.marked} · ${name}`;

const iconsOf = (row) => [...row.querySelectorAll(".row-actions .icon")].map((b) => b.dataset.icon);

/* ---- an area waiting for an answer nobody is bringing ---- */

test("a section the run never asked about is not drawn at all", () => {
  /* The everyday way in: the reader switches Verbs on while a reading made
     without it is on screen. Its answer is null for good, and the area used
     to stand at "…" for as long as the reading did. */
  const state = reading({ verbs: null, words: null });
  const drawn = draw(state, { ...SETTINGS, show: { verbs: "foreign", terms: "foreign" } });
  assert.ok(!titles(drawn).includes(de.verbs), "no verb section");
  assert.ok(!titles(drawn).includes(de.terms), "no term section");
});

test("but while the run is working it says so", () => {
  const state = reading({ verbs: null, words: null, busy: true });
  const node = sectionNamed(draw(state), de.verbs).node;
  assert.strictEqual(node.querySelector(".label .empty-note")?.textContent, "…", "on the heading's line");
  assert.ok(!node.querySelector(".box"), "one line, no box under it");
});

test("a section being searched is one line, like one that found nothing", () => {
  const state = reading({ verbs: null, words: null, busy: true });
  const drawn = draw({ ...state, status: { ...state.status, verbs: "working", words: "working" } });
  for (const title of [de.verbs, de.terms]) {
    const node = sectionNamed(drawn, title).node;
    assert.ok(node.querySelector(".label .empty-note")?.textContent, `${title}: the word on the heading's line`);
    assert.ok(!node.querySelector(".box"), `${title}: no box under it`);
  }
});

test("a section that found nothing says that, not …", () => {
  const drawn = draw(reading({ verbs: [], words: [] }));
  for (const [title, sentence] of [[de.verbs, de.noVerbs], [de.terms, de.noTerms]]) {
    const node = sectionNamed(drawn, title).node;
    assert.strictEqual(node.querySelector(".label .empty-note")?.textContent, sentence, "on the heading's line");
    assert.ok(!node.querySelector(".box"), "one line, no box under it");
  }
  const folding = draw(reading({ verbs: [], words: [] }), SETTINGS, { onFold() {} });
  assert.ok(!sectionNamed(folding, de.verbs).node.querySelector(".fold"), "nothing to fold");
});

test("a text in a language nobody could name gets no sections about a language", () => {
  /* The run skips both — they are about a language and there is none — so
     drawing them would leave two areas waiting for nothing. */
  const state = reading({
    source: { code: "", name: "Niederländisch" },
    verbs: null,
    words: null,
    panels: [
      { code: "", name: "Niederländisch", status: "ready", text: "ialah gagasan tentang sesuatu" },
      { code: "de", name: "Deutsch", status: "ready", text: "eine Vorstellung von etwas" },
    ],
  });
  const drawn = draw(state, { ...SETTINGS, show: { verbs: "foreign", terms: "foreign" } });
  assert.deepStrictEqual(titles(drawn), ["Deutsch"]);
});

test("a language with no pack gets its terms, and still no verb table", () => {
  const state = reading({
    source: { code: "", name: "Tschechisch" },
    verbs: null,
    words: [{ text: "podnebí", meaning: "Klima", note: "Langjähriges Wetter; Geografie.", spot: "podnebí" }],
    panels: [
      { code: "", name: "Tschechisch", status: "ready", text: "tropické podnebí" },
      { code: "de", name: "Deutsch", status: "ready", text: "tropisches Klima" },
    ],
  });
  const drawn = draw(state, { ...SETTINGS, show: { verbs: "all", terms: "foreign" } });
  assert.deepStrictEqual(titles(drawn), ["Deutsch", de.terms]);
});

/* ---- what an empty panel says, and where the reason stands ---- */

test("the language-pack sentence is only shown where the device was the only way", () => {
  const drawn = draw(reading({
    panels: [
      reading().panels[0],
      { code: "de", name: "Deutsch", status: "missing", text: "" },
      { code: "en", name: "Englisch", status: "ready", text: "Yesterday" },
    ],
  }));
  assert.match(sectionNamed(drawn, "Deutsch").body, /Sprachpaket .* fehlt/);
});

test("a panel the model failed on blames nobody and names no download", () => {
  const drawn = draw(reading({
    fault: { kind: "unreachable" },
    panels: [
      reading().panels[0],
      { code: "de", name: "Deutsch", status: "no-answer", fault: { kind: "unreachable" }, text: "" },
      { code: "en", name: "Englisch", status: "no-answer", fault: { kind: "unreachable" }, text: "" },
    ],
  }));
  for (const name of ["Deutsch", "Englisch"]) {
    assert.strictEqual(sectionNamed(drawn, name).body, de.noAnswer);
  }
  /* And the reason is nowhere on the sheet: it belongs to the run, and the
     window says it once, under the sheet. Said here it would stand twice
     over, and once more under every section that failed with it. */
  assert.ok(!sections(drawn).some((s) => /Keine Verbindung/.test(s.body)));
});

test("a helper that is not there is not a missing language pack", () => {
  const drawn = draw(reading({
    panels: [
      reading().panels[0],
      { code: "de", name: "Deutsch", status: "no-device", text: "" },
    ],
  }));
  assert.match(sectionNamed(drawn, "Deutsch").body, /Übersetzung antwortet nicht/);
});

test("a section that failed says that, and the picked word says why", () => {
  /* The one place a sentence about the reason belongs on the sheet: the
     answer to something the reader has just this moment done, in the only
     area that can say anything about it. */
  const drawn = draw(reading({
    status: { words: { kind: "key", status: 401 }, verbs: { kind: "key", status: 401 }, panels: "" },
    words: null,
    verbs: null,
    selection: { panel: 0, start: 0, end: 4, term: "Ayer" },
    marked: null,
    markedStatus: { kind: "key", status: 401 },
  }));
  assert.strictEqual(sectionNamed(drawn, de.verbs).body, de.noAnswer);
  assert.strictEqual(sectionNamed(drawn, de.terms).body, de.noAnswer);
  assert.match(sectionNamed(drawn, markedIn("Spanisch")).body, /Schlüssel wurde abgelehnt \(401\)/);
});

test("the picked word does not repeat the reason the line under the sheet already gives", () => {
  const drawn = draw(reading({
    fault: { kind: "unreachable" },
    status: { words: { kind: "unreachable" }, verbs: "", panels: "" },
    words: null,
    selection: { panel: 0, start: 0, end: 4, term: "Ayer" },
    marked: null,
    markedStatus: { kind: "unreachable" },
  }));
  assert.strictEqual(sectionNamed(drawn, markedIn("Spanisch")).body, de.noAnswer);
});

/* ---- locked, and switched off ---- */

test("without an endpoint nothing a model fills is drawn, and one line says how to have it", () => {
  const drawn = draw(reading(), { ...SETTINGS, endpoint: "" });
  assert.deepStrictEqual(titles(drawn), ["Deutsch", "Englisch"]);
  const notes = drawn.sheet.querySelectorAll(".locked-note");
  assert.strictEqual(notes.length, 1, "said once");
  assert.strictEqual(notes[0].textContent, de.lockedHow);
});

test("a blank sheet without an endpoint has the line and no empty areas", () => {
  const drawn = draw(null, { ...SETTINGS, endpoint: "" });
  assert.deepStrictEqual(titles(drawn), []);
  assert.strictEqual(drawn.sheet.querySelectorAll(".locked-note").length, 1);
});

test("a reader's own language keeps the translation and drops the verb table", () => {
  const state = reading({
    source: { code: "de", name: "Deutsch" },
    panels: [
      { code: "de", name: "Deutsch", status: "ready", text: "Gestern focht die Regierung das Abkommen an." },
      { code: "es", name: "Spanisch", status: "ready", text: "Ayer el gobierno impugnó el acuerdo." },
    ],
  });
  assert.deepStrictEqual(titles(draw(state)), ["Spanisch"]);
});

/* ---- short mode ---- */

const SHORT = () => ({
  text: "meter la pata",
  short: true,
  source: { code: "es", name: "Spanisch" },
  panels: [
    { code: "es", name: "Spanisch", status: "ready", text: "meter la pata" },
    {
      code: "de",
      name: "Deutsch",
      status: "alternatives",
      text: "",
      alternatives: [
        { text: "ins Fettnäpfchen treten", note: "umgangssprachlich" },
        { text: "einen Fehler machen", note: "neutral" },
      ],
    },
  ],
  words: null,
  verbs: null,
  forms: [],
  wordAlign: null,
  verbAlign: null,
  status: { words: "", verbs: "", panels: "" },
  fault: null,
  busy: false,
});

test("short mode holds a dictionary entry and nothing about a verb table", () => {
  const drawn = draw(SHORT());
  assert.deepStrictEqual(titles(drawn), ["Deutsch"]);
  const entries = drawn.sheet.querySelector(".box.rows.entries");
  assert.ok(entries, "the translations are a list of fields");
  assert.strictEqual(entries.querySelectorAll(".row").length, 2);
});

test("a marked word in short mode is drawn, because it is asked for", () => {
  /* It was not, and the click still went out: four questions asked and paid
     for, and nothing at all on screen. */
  const state = { ...SHORT(), selection: { panel: 0, start: 0, end: 5, term: "meter" },
    marked: { text: "meter", meaning: "stecken", note: "Alltagsverb.", synonyms: ["introducir"] },
    markedStatus: "" };
  const drawn = draw(state);
  assert.ok(titles(drawn).includes(markedIn("Spanisch")));
  assert.ok(drawn.sheet.querySelector(`[data-section="${MARKED}"]`), "and findable again");
  assert.strictEqual(drawn.sheet.querySelectorAll(".synonym").length, 1);
});

test("in short mode a single word can be picked too", () => {
  const one = { ...SHORT(), text: "pereza", panels: [
    { code: "es", name: "Spanisch", status: "ready", text: "pereza" },
    SHORT().panels[1],
  ] };
  assert.ok(draw(one).sheet.querySelector(".box.words .w"), "the one word is pickable");
});

test("in short mode the words of a dictionary line can be picked", () => {
  const picks = [];
  const drawn = draw(SHORT(), SETTINGS, { onPick: (choice) => picks.push(choice) });
  const lines = drawn.sheet.querySelectorAll(".box.rows.entries .row");
  const words = lines[1].querySelectorAll(".term.words .w");
  assert.deepStrictEqual([...words].map((w) => w.textContent), ["einen", "Fehler", "machen"]);
  const word = words[1];
  word.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
  const last = picks[picks.length - 1];
  assert.deepStrictEqual(
    { panel: last.panel, entry: last.entry, start: last.start, end: last.end },
    { panel: 1, entry: 1, start: 6, end: 12 },
  );
});

test("a word picked in a dictionary line is framed in that line alone", () => {
  const state = { ...SHORT(),
    selection: { panel: 1, entry: 1, start: 6, end: 12, term: "Fehler" },
    marked: { text: "Fehler", meaning: "error", note: "", synonyms: [] },
    markedStatus: "" };
  const drawn = draw(state);
  const lines = drawn.sheet.querySelectorAll(".box.rows.entries .row");
  assert.strictEqual(lines[0].querySelector(".sel"), null);
  assert.strictEqual(lines[1].querySelector(".sel.picked").textContent, "Fehler");
  assert.ok(titles(drawn).includes(markedIn("Deutsch")));
});

test("short mode without a model shows the device's translation and the one line", () => {
  const state = SHORT();
  state.panels[1] = { code: "de", name: "Deutsch", status: "ready", text: "ins Fettnäpfchen treten", engine: "device" };
  const drawn = draw(state, { ...SETTINGS, endpoint: "" });
  assert.deepStrictEqual(titles(drawn), ["Deutsch"]);
  assert.strictEqual(sectionNamed(drawn, "Deutsch").body, "ins Fettnäpfchen treten");
  assert.strictEqual(drawn.sheet.querySelectorAll(".locked-note").length, 1);
});

/* ---- the buttons of a row ---- */

const VERB = { form: "impugnó", infinitive: "impugnar", meaning: "anfechten",
               person: "3. Person Singular", tense: "Indefinido" };

test("a verb offers its conjugation and a search, in that order", () => {
  const drawn = draw(reading({ verbs: [VERB] }));
  assert.deepStrictEqual(iconsOf(sectionNamed(drawn, de.verbs).rows[0]), ["conjugation", "search"]);
});

test("a term offers the search alone", () => {
  const drawn = draw(reading({
    words: [{ text: "acuerdo", meaning: "Abkommen", note: "Vertragsrecht.", spot: "acuerdo" }],
  }));
  assert.deepStrictEqual(iconsOf(sectionNamed(drawn, de.terms).rows[0]), ["search"]);
});

test("a marked word that is a verb is treated as one", () => {
  /* The first line is the verb table's line, and the buttons are the verb
     row's buttons. */
  const drawn = draw(reading({
    selection: { panel: 0, start: 17, end: 24, term: "impugnó" },
    marked: { text: "impugnó", infinitive: "impugnar", meaning: "anfechten",
              person: "3. Person Singular", tense: "Indefinido", note: "Rechtssprache.", synonyms: [] },
    markedStatus: "",
  }));
  const row = sectionNamed(drawn, markedIn("Spanisch")).rows[0];
  assert.deepStrictEqual(iconsOf(row), ["conjugation", "search"]);
  assert.deepStrictEqual(
    [...row.querySelectorAll(".row-head > span")].map((s) => s.className),
    ["term", "arrow", "base", "equivalent", "grammar"],
  );
});

test("the picked word is framed where it was picked and lifted everywhere else", () => {
  /* The frame is the reader's own doing. In the other panels the same word is
     a finding — the model said where it went — and a frame there would say
     three words had been clicked. */
  const drawn = draw(reading({
    selection: { panel: 0, start: 28, end: 35, term: "acuerdo" },
    marked: { text: "acuerdo", meaning: "Abkommen", a: "Abkommen", b: "agreement",
              note: "Vertragsrecht.", synonyms: [] },
    markedStatus: "",
  }));
  const panels = [...drawn.sheet.querySelectorAll(".box.words")];
  assert.strictEqual(panels.length, 3);
  assert.strictEqual(panels[0].querySelectorAll(".sel.picked").length, 1, "framed in its own panel");
  assert.strictEqual(panels[1].querySelectorAll(".sel").length, 1, "found in the translation");
  assert.strictEqual(panels[1].querySelectorAll(".sel.picked").length, 0, "but not framed there");
  assert.strictEqual(panels[2].querySelectorAll(".sel.picked").length, 0);
});

test("the picked word's area says which panel it was picked in", () => {
  /* The same word is asked about differently in each of them, and nothing
     else on the sheet says which one was clicked. */
  const spanish = draw(reading({
    selection: { panel: 0, start: 28, end: 35, term: "acuerdo" },
    marked: null, markedStatus: "working",
  }));
  assert.ok(titles(spanish).includes(markedIn("Spanisch")));
  const english = draw(reading({
    selection: { panel: 2, start: 0, end: 9, term: "Yesterday" },
    marked: null, markedStatus: "working",
  }));
  assert.ok(titles(english).includes(markedIn("Englisch")));
});

test("a marked word that is not a verb has no conjugation to offer", () => {
  const drawn = draw(reading({
    selection: { panel: 0, start: 28, end: 35, term: "acuerdo" },
    marked: { text: "acuerdo", meaning: "Abkommen", note: "Vertragsrecht.", synonyms: [] },
    markedStatus: "",
  }));
  assert.deepStrictEqual(iconsOf(sectionNamed(drawn, markedIn("Spanisch")).rows[0]), ["search"]);
});

const trailOf = (drawn) =>
  [...drawn.sheet.querySelectorAll(`[data-section="${MARKED}"] .label .trail .icon`)];

test("the chevrons along the synonyms appear once a synonym has been clicked", () => {
  const first = { text: "impugnó", meaning: "anfechten", note: "…", synonyms: ["recurrir"] };
  const before = draw(reading({
    selection: { panel: 0, start: 0, end: 7, term: "impugnó" },
    marked: first,
    markedStatus: "",
  }));
  assert.strictEqual(trailOf(before).length, 0, "nowhere to step to yet");

  const second = { text: "recurrir", meaning: "zurückgreifen", note: "Rechtssprache.", synonyms: [], back: first };
  const steps = [];
  const after = draw(reading({
    selection: { panel: 0, start: 0, end: 7, term: "recurrir" },
    marked: second,
    markedTrail: [first, second],
    markedPlace: 1,
    markedStatus: "",
  }), SETTINGS, { onStep: (delta) => steps.push(delta) });
  const [back, forward] = trailOf(after);
  assert.deepStrictEqual([back.dataset.icon, forward.dataset.icon], ["previous", "next"]);
  assert.strictEqual(back.disabled, false);
  assert.strictEqual(forward.disabled, true, "nothing ahead of the last word");
  back.click();
  assert.deepStrictEqual(steps, [-1]);
  /* The row keeps only what is about the word itself. */
  assert.deepStrictEqual(iconsOf(sectionNamed(after, markedIn("Spanisch")).rows[0]), ["search"]);
});

test("stepped back to the first word, only forward is open", () => {
  const first = { text: "impugnó", meaning: "anfechten", note: "…", synonyms: ["recurrir"] };
  const second = { text: "recurrir", meaning: "zurückgreifen", note: "", synonyms: [], back: first };
  const [back, forward] = trailOf(draw(reading({
    selection: { panel: 0, start: 0, end: 7, term: "impugnó" },
    marked: first,
    markedTrail: [first, second],
    markedPlace: 0,
    markedStatus: "",
  })));
  assert.strictEqual(back.disabled, true);
  assert.strictEqual(forward.disabled, false);
});

test("a panel offers a copy, and an insert only inside the app", () => {
  const drawn = draw(reading());
  const buttons = (name) =>
    [...sectionNamed(drawn, name).node.querySelectorAll(".actions .icon")].map((b) => b.dataset.icon);
  assert.deepStrictEqual(buttons("Deutsch"), ["copy"]);
});

/* ---- the heading line above the sheet ---- */

test("the line above the sheet names the original and its language", () => {
  assert.strictEqual(draw(reading()).heading, `${de.original} · Spanisch`);
});

test("a language the app cannot name keeps the name the run found", () => {
  const state = reading({
    panels: [
      { code: "", name: "Niederländisch", status: "ready", text: "ialah gagasan" },
      { code: "de", name: "Deutsch", status: "ready", text: "eine Vorstellung" },
    ],
  });
  assert.strictEqual(draw(state).heading, `${de.original} · Niederländisch`);
});

test("while the original is being written in, no language is claimed for it", () => {
  const sheet = document.createElement("div");
  const heading = renderReading(sheet, reading(), {
    settings: SETTINGS,
    tools: TOOLS,
    edit: { editing: true, draft: "Ayer", onDraft() {}, onEdit() {}, onTranslate() {} },
    onPick() {},
    onLookUp() {},
    onBack() {},
  });
  assert.strictEqual(heading, de.original);
  assert.ok(sheet.querySelector("#draft"), "the field is the original box");
  assert.strictEqual(sheet.querySelector("#translate").dataset.icon, "translate");
});

/* ---- the direction a panel is read in ---- */

test("an Arabic panel is right to left and the interface around it is not", () => {
  const state = reading({
    source: { code: "ar", name: "Arabisch" },
    panels: [
      { code: "ar", name: "Arabisch", status: "ready", text: "أعلنت الحكومة أمس" },
      { code: "de", name: "Deutsch", status: "ready", text: "Die Regierung kündigte gestern an" },
    ],
  });
  const drawn = draw(state);
  const boxes = [...drawn.sheet.querySelectorAll(".box")];
  assert.strictEqual(boxes[0].dir, "rtl");
  assert.strictEqual(boxes[1].dir, "ltr");
});

/* ---- the way from a row to a flashcard ---- */

/* Drawn on every row that has a word worth learning in it, and never mind
   whether anything is installed to receive one: what the button opens is a
   card to read and to copy out. */
test("every row with a foreign word offers a card", () => {
  const cards = [];
  const drawn = draw(reading({
    verbs: [{ form: "anduvo", infinitive: "andar", meaning: "gehen" }],
    words: [{ text: "fianza", meaning: "Kaution" }],
    status: { words: "", verbs: "", panels: "" },
  }), SETTINGS, { tools: { ...TOOLS, card: (card) => cards.push(card), cardFor: () => true } });

  const buttons = [...drawn.sheet.querySelectorAll("button[data-icon='card']")];
  assert.strictEqual(buttons.length, 2, "one on the verb, one on the term");
  buttons[0].dispatchEvent(new window.MouseEvent("click"));
  assert.strictEqual(cards.length, 1, "it opens a card rather than filing one");
  assert.strictEqual(cards[0].term, "andar", "the base form, not the one in the text");
  assert.strictEqual(cards[0].termLanguage, "es");
  assert.strictEqual(cards[0].meaningLanguage, "de");
});

test("a row in the reader's own language offers none", () => {
  /* Nobody learns vocabulary they are reading the explanation in. */
  const state = reading({
    verbs: [{ form: "ging", infinitive: "gehen", meaning: "gehen" }],
    status: { words: "", verbs: "", panels: "" },
  });
  state.panels[0].code = "de";
  const drawn = draw(state, { ...SETTINGS, show: { verbs: "foreign", terms: "foreign" } },
    { tools: { ...TOOLS, card: () => {}, cardFor: (code) => code !== "de" } });
  assert.strictEqual(drawn.sheet.querySelectorAll("button[data-icon='card']").length, 0);
});

test("switched off, no row offers one", () => {
  const drawn = draw(reading({
    verbs: [{ form: "anduvo", infinitive: "andar", meaning: "gehen" }],
    status: { words: "", verbs: "", panels: "" },
  }), SETTINGS, { tools: { ...TOOLS, card: null } });
  assert.strictEqual(drawn.sheet.querySelectorAll("button[data-icon='card']").length, 0);
});

test("in short mode the reading itself carries the card", () => {
  const cards = [];
  const short = reading({
    short: true,
    text: "aparcar",
    panels: [
      { code: "es", name: "Spanisch", status: "ready", text: "aparcar" },
      { code: "de", name: "Deutsch", status: "alternatives",
        alternatives: [{ text: "parken" }, { text: "abstellen", note: "eher schriftlich" }] },
    ],
    verbs: null,
    words: null,
  });
  const drawn = draw(short, SETTINGS, { tools: { ...TOOLS, card: (card) => cards.push(card), cardFor: () => true } });

  /* Up to three words in a language being learned is a vocabulary item, and
     the original field is where it stands. */
  const onOriginal = drawn.sheet.querySelector(".pane:first-child .actions button[data-icon='card']");
  assert.ok(onOriginal, "the original field offers one");
  onOriginal.dispatchEvent(new window.MouseEvent("click"));
  assert.strictEqual(cards[0].term, "aparcar");
  assert.strictEqual(cards[0].meaning, "parken, abstellen");
});

test("a paragraph does not, because it is no vocabulary item", () => {
  const drawn = draw(reading({ verbs: null, words: null }), SETTINGS,
    { tools: { ...TOOLS, card: () => {}, cardFor: (code) => code !== "de" } });
  assert.ok(!drawn.sheet.querySelector(".pane:first-child .actions button[data-icon='card']"));
});

test("a reading in the reader's own language offers none there either", () => {
  const short = reading({ short: true, text: "parken" });
  short.panels = [
    { code: "de", name: "Deutsch", status: "ready", text: "parken" },
    { code: "es", name: "Spanisch", status: "alternatives", alternatives: [{ text: "aparcar" }] },
  ];
  short.verbs = null;
  short.words = null;
  const drawn = draw(short, SETTINGS,
    { tools: { ...TOOLS, card: () => {}, cardFor: (code) => code !== "de" } });
  assert.ok(!drawn.sheet.querySelector(".pane:first-child .actions button[data-icon='card']"));
});

/* ---- which engine translated a panel ---- */

test("a panel says who translated it only where that was not the reader's choice", () => {
  const state = reading();
  state.panels[1] = { ...state.panels[1], engine: "device", fallback: true };
  state.panels[2] = { ...state.panels[2], engine: "model", fallback: false };
  const drawn = draw(state);
  assert.strictEqual(sectionNamed(drawn, "Deutsch").status, de.translatedBy.device);
  assert.strictEqual(sectionNamed(drawn, "Englisch").status, "");
});

test("a panel still waiting says nothing about an engine", () => {
  const state = reading({ busy: true });
  state.panels[1] = { ...state.panels[1], status: "waiting", text: "", engine: undefined, fallback: undefined };
  assert.strictEqual(sectionNamed(draw(state), "Deutsch").status, "");
});

/* ---- folding a translation away ---- */

/* What the window does on a fold: the reading keeps it, the sheet is drawn
   again. */
function foldingDraw(state, settings = SETTINGS) {
  const box = { drawn: null };
  const onFold = (key) => {
    const folded = (state.folded ||= new Set());
    if (folded.has(key)) folded.delete(key);
    else folded.add(key);
    box.drawn = draw(state, settings, { onFold });
  };
  box.drawn = draw(state, settings, { onFold });
  return box;
}

const MARKED_READING = () => reading({
  verbs: [{ form: "impugnó", infinitive: "impugnar", meaning: "anfechten", person: "3. Sg.", tense: "Indefinido" }],
  words: [{ text: "acuerdo", meaning: "Abkommen", note: "Vertrag." }],
});

test("a translation folds away and stays folded when the sheet is drawn again", () => {
  const view = foldingDraw(reading());
  assert.ok(!sectionNamed(view.drawn, "Original · Spanisch"), "the original has no fold of its own");
  sectionNamed(view.drawn, "Englisch").node.querySelector(".label .fold").click();
  const english = sectionNamed(view.drawn, "Englisch").node;
  assert.ok(english.classList.contains("folded"));
  assert.strictEqual(english.querySelector(".label .fold").getAttribute("aria-label"), de.unfoldPanel);
  assert.ok(!sectionNamed(view.drawn, "Deutsch").node.classList.contains("folded"));
  english.querySelector(".label .fold").click();
  assert.ok(!sectionNamed(view.drawn, "Englisch").node.classList.contains("folded"));
});

test("a new reading starts with everything unfolded", () => {
  const view = foldingDraw(MARKED_READING());
  sectionNamed(view.drawn, de.verbs).node.querySelector(".label .fold").click();
  assert.ok(sectionNamed(view.drawn, de.verbs).node.classList.contains("folded"));
  const next = draw(MARKED_READING(), SETTINGS, { onFold() {} });
  assert.ok(!next.sheet.querySelector(".pane.folded"));
});

test("folding the verbs away takes their markings out of the panels", () => {
  const view = foldingDraw(MARKED_READING());
  const original = () => view.drawn.sheet.querySelector(".pane .box");
  assert.ok(original().querySelector(".vmark0"), "marked while open");
  assert.ok(original().querySelector(".wmark0"));
  sectionNamed(view.drawn, de.verbs).node.querySelector(".label .fold").click();
  assert.ok(!original().querySelector(".vmark0"), "gone once folded");
  assert.ok(original().querySelector(".wmark0"), "the terms keep theirs");
  sectionNamed(view.drawn, de.terms).node.querySelector(".label .fold").click();
  assert.ok(!original().querySelector(".wmark0"));
});

test("the picked word folds away and takes its spots in the other panels with it", () => {
  const state = MARKED_READING();
  state.selection = { panel: 0, start: 28, end: 35, term: "acuerdo" };
  state.marked = { text: "acuerdo", meaning: "Abkommen", note: "Vertrag.", synonyms: [] };
  state.markedStatus = "";
  const view = foldingDraw(state);
  const framed = () => [...view.drawn.sheet.querySelectorAll(".pane .box")].slice(0, 3)
    .map((box) => !!box.querySelector(".sel"));
  assert.deepStrictEqual(framed(), [true, true, false], "the pick and its equivalent");
  sectionNamed(view.drawn, markedIn("Spanisch")).node.querySelector(".label .fold").click();
  assert.ok(sectionNamed(view.drawn, markedIn("Spanisch")).node.classList.contains("folded"));
  assert.deepStrictEqual(framed(), [true, false, false], "the reader's own frame stays");
});

test("underlines switched off keep the marked spans and lose only the line", () => {
  const drawn = draw(MARKED_READING(), { ...SETTINGS, underline: false });
  const original = drawn.sheet.querySelector(".pane .box");
  assert.ok(original.classList.contains("unlined"));
  assert.ok(original.querySelector(".vmark0"), "still there for the hover");
  assert.ok(!draw(MARKED_READING()).sheet.querySelector(".unlined"));
});

test("the picked word stands above the verbs and the terms", () => {
  const state = MARKED_READING();
  state.selection = { panel: 0, start: 17, end: 24, term: "impugnó" };
  state.marked = { text: "impugnó", meaning: "anfechten", note: "Rechtssprache.", synonyms: [] };
  state.markedStatus = "";
  assert.deepStrictEqual(titles(draw(state)), ["Deutsch", "Englisch", markedIn("Spanisch"), de.verbs, de.terms]);
});

test("the picked word, a verb and a term offer a longer explanation and show it once it came", () => {
  const state = MARKED_READING();
  state.selection = { panel: 0, start: 17, end: 24, term: "impugnó" };
  state.marked = { text: "impugnó", meaning: "anfechten", note: "Rechtssprache.", synonyms: [] };
  state.markedStatus = "";
  const asked = [];
  const onMore = (target) => asked.push(target);
  const drawn = draw(state, SETTINGS, { onMore });
  for (const title of [markedIn("Spanisch"), de.verbs, de.terms]) {
    const row = sectionNamed(drawn, title).rows[0];
    assert.strictEqual(iconsOf(row)[0], "more", title);
    row.querySelector("[data-icon='more']").click();
  }
  assert.deepStrictEqual(asked.map((target) => target.kind), ["marked", "verbs", "words"]);
  assert.strictEqual(asked[0].item, state.marked);
  assert.strictEqual(asked[2].index, 0);

  state.marked.moreStatus = "working";
  state.more = { "verbs:0": { more: "Ein längerer Absatz." } };
  const later = draw(state, SETTINGS, { onMore });
  const marked = sectionNamed(later, markedIn("Spanisch")).rows[0];
  assert.strictEqual(marked.querySelector(".explanation.more").textContent, de.moreWorking);
  assert.ok(!marked.querySelector("[data-icon='more']"), "no second question while one is out");
  const verb = sectionNamed(later, de.verbs).rows[0];
  assert.strictEqual(verb.querySelector(".explanation.more").textContent, "Ein längerer Absatz.");
  assert.ok(!verb.querySelector("[data-icon='more']"));
  assert.ok(sectionNamed(later, de.terms).rows[0].querySelector("[data-icon='more']"));
});


test("the examples stand one to a line, each with its kind and its translation", () => {
  const state = MARKED_READING();
  state.more = { "verbs:0": { more: "Ein längerer Absatz.", examples: [
    { kind: "Rechtssprache", sentence: "Impugnó la sentencia.", translation: "Er focht das Urteil an." },
    { kind: "", sentence: "Voy a impugnar.", translation: "Ich lege Einspruch ein." },
  ] } };
  const verb = sectionNamed(draw(state), de.verbs).rows[0];
  const lines = [...verb.querySelectorAll(".examples .example")];
  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0].querySelector(".kind").textContent, "Rechtssprache");
  assert.strictEqual(lines[0].querySelector(".sentence").textContent, "Impugnó la sentencia.");
  assert.strictEqual(lines[0].querySelector(".rendering").textContent, "Er focht das Urteil an.");
  assert.ok(!lines[1].querySelector(".kind"), "no empty kind drawn");
});

test("one more example is offered on every row, and not past four", () => {
  const state = MARKED_READING();
  const asked = [];
  const onExample = (target) => asked.push(target);
  /* Offered with nothing above it: a sentence with the word in it is worth
     having without a paragraph first. */
  const bare = sectionNamed(draw(state, SETTINGS, { onExample }), de.verbs).rows[0];
  assert.ok(bare.querySelector("[data-icon='example']"));

  const example = (n) => ({ kind: "", sentence: `Satz ${n}.`, translation: "" });
  state.more = { "verbs:0": { more: "Ein längerer Absatz.", examples: [example(1)] } };
  const row = sectionNamed(draw(state, SETTINGS, { onExample }), de.verbs).rows[0];
  row.querySelector("[data-icon='example']").click();
  assert.deepStrictEqual(asked.map((target) => target.kind), ["verbs"]);

  state.more["verbs:0"].exampleStatus = "working";
  const working = sectionNamed(draw(state, SETTINGS, { onExample }), de.verbs).rows[0];
  assert.strictEqual(working.querySelector(".example.muted").textContent, de.exampleWorking);
  const waiting = working.querySelector("[data-icon='example']");
  assert.ok(waiting, "the button stays while one is out");
  waiting.click();
  assert.strictEqual(asked.length, 1, "and asks no second question");

  state.more["verbs:0"] = { more: "Ein längerer Absatz.", examples: [1, 2, 3, 4].map(example) };
  const full = sectionNamed(draw(state, SETTINGS, { onExample }), de.verbs).rows[0];
  assert.strictEqual(full.querySelectorAll(".examples .example").length, 4);
  assert.ok(!full.querySelector("[data-icon='example']"), "four is the ceiling");
});

test("a marked passage shows itself and its translation, and only the buttons that make sense for it", () => {
  const drawn = draw(reading({
    selection: { panel: 0, start: 0, end: 35, term: "Ayer el gobierno impugnó el acuerdo" },
    marked: { text: "Ayer el gobierno impugnó el acuerdo", passage: true,
              meaning: "Gestern focht die Regierung das Abkommen an", note: "", synonyms: [],
              a: "Gestern focht die Regierung das Abkommen an", b: "" },
    markedStatus: "",
  }), SETTINGS, { onMore: () => {}, onExample: () => {} });
  const row = sectionNamed(drawn, markedIn("Spanisch")).rows[0];
  assert.deepStrictEqual(
    [...row.querySelectorAll(".row-head > span")].map((s) => [s.className, s.textContent]),
    [["term", "Ayer el gobierno impugnó el acuerdo"], ["equivalent", "Gestern focht die Regierung das Abkommen an"]],
    "drawn the way every row's first line is",
  );
  assert.deepStrictEqual(iconsOf(row), ["search"], "no longer explanation, no examples, no conjugation");
  assert.strictEqual(row.querySelectorAll(".explanation, .synonyms").length, 0);
  const panels = [...drawn.sheet.querySelectorAll(".box.words")];
  assert.strictEqual(panels[1].querySelector(".sel")?.textContent, "Gestern focht die Regierung das Abkommen an", "found whole in the translation");
});

/* ---- a translation that is the word over again ---- */

test("an equivalent that repeats the term is not drawn beside it", () => {
  /* A name, a product, a number are their own translation, and the model
     answers with the term: "Terminal-Bench v2 — Terminal-Bench v2", the second
     one in italics as though it were a different word. */
  const drawn = draw(reading({
    words: [{ text: "Terminal-Bench v2", meaning: "Terminal-Bench v2", note: "Testverfahren für KI-Agenten." }],
    verbs: [{ form: "impugnó", infinitive: "impugnar", meaning: "anfechten", person: "él/ella/usted", tense: "pretérito indefinido" }],
  }), { ...SETTINGS, show: { verbs: "foreign", terms: "foreign" } });

  const term = sectionNamed(drawn, de.terms).rows[0];
  assert.strictEqual(term.querySelector(".equivalent"), null);
  assert.ok(term.textContent.includes("Testverfahren"), "the note still stands");

  const verb = sectionNamed(drawn, de.verbs).rows[0];
  assert.strictEqual(verb.querySelector(".equivalent")?.textContent, "anfechten");
});

test("a picked word and a term that are not verbs say what kind of word they are", () => {
  const kind = { kind: "noun", number: "singular", gender: "masculine" };
  const drawn = draw(reading({
    words: [{ text: "gobierno", meaning: "Regierung", note: "Politik.", spot: "gobierno", wordClass: kind }],
    selection: { panel: 0, start: 28, end: 35, term: "acuerdo" },
    marked: { text: "acuerdo", meaning: "Abkommen", note: "Vertragsrecht.", synonyms: [], wordClass: kind },
    markedStatus: "",
  }));
  const grammarOf = (row) => row.querySelector(".grammar")?.textContent;
  assert.strictEqual(grammarOf(sectionNamed(drawn, markedIn("Spanisch")).rows[0]), "Substantiv · Singular · Maskulinum");
  assert.strictEqual(grammarOf(sectionNamed(drawn, de.terms).rows[0]), "Substantiv · Singular · Maskulinum");
});

test("a word without a class says nothing about one", () => {
  const drawn = draw(reading({
    words: [{ text: "acuerdo", meaning: "Abkommen", note: "Vertragsrecht.", spot: "acuerdo" }],
  }));
  assert.strictEqual(sectionNamed(drawn, de.terms).rows[0].querySelector(".grammar"), null);
});

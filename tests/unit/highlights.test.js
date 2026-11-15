import test from "node:test";
import assert from "node:assert";
import { fragmentsForPanel, selectionForPanel } from "../../src/highlights.js";
import { collectMarks, markGroups } from "../../src/ui/marking.js";

const state = {
  words: [{ text: "ensayo clínico", spot: "ensayo clínico" }, { text: "fármaco", spot: "" }],
  verbs: [{ form: "mostró" }],
  wordAlign: { a: [["klinischen", "Studie"], ["Arzneimittel"]], b: [["clinical", "trial"], ["drug"]] },
  verbAlign: { a: [["zeigte"]], b: [["showed"]] },
};

test("the original panel is highlighted from the spots in the text", () => {
  const parts = fragmentsForPanel(state, 0);
  assert.deepStrictEqual(parts.words, [["ensayo clínico"], ["fármaco"]]);
  assert.deepStrictEqual(parts.verbs, [["mostró"]]);
});

test("an entry the model wrote differently falls back to the term itself", () => {
  /* spot is what really stands in the text; empty means the term was taken
     verbatim and can be searched for as it is. */
  assert.deepStrictEqual(fragmentsForPanel(state, 0).words[1], ["fármaco"]);
});

test("the translations take their columns, first A then B", () => {
  assert.deepStrictEqual(fragmentsForPanel(state, 1).words[0], ["klinischen", "Studie"]);
  assert.deepStrictEqual(fragmentsForPanel(state, 2).words[0], ["clinical", "trial"]);
  assert.deepStrictEqual(fragmentsForPanel(state, 2).verbs, [["showed"]]);
});

test("without an assignment a translation is simply not highlighted", () => {
  const bare = { words: state.words, verbs: state.verbs, wordAlign: null, verbAlign: null };
  assert.deepStrictEqual(fragmentsForPanel(bare, 1), { words: [], verbs: [], near: { words: [], verbs: [] } });
});

test("a split verb joined by an ellipsis is marked in both halves", () => {
  /* The prompt asks for "habe + gebacken" and the local model writes
     "habe...gebacken" — no whitespace in it, so the split that rescues a
     multipart fragment has to know the notation, not just the space. */
  const text = "Gestern habe ich einen köstlichen Schokoladenkuchen gebacken.";
  const marks = collectMarks(text, markGroups([["habe...gebacken"]], "vmark"), ["de"]);
  assert.deepStrictEqual(
    marks.map((m) => text.slice(m.start, m.end)),
    ["habe", "gebacken"],
  );
  /* The plus sign the prompt actually asks for goes the same way. */
  const plus = collectMarks(text, markGroups([["habe + gebacken"]], "vmark"), ["de"]);
  assert.deepStrictEqual(plus.map((m) => text.slice(m.start, m.end)), ["habe", "gebacken"]);
});

test("the parts of one row are found next to each other, not wherever each stands first", () => {
  /* Measured: "The + taxpayer" coloured the sentence's first word, and the
     "mich" of "bringst du mich auf dem Laufenden" was taken from an earlier
     clause. */
  const text = "The government said the taxpayer must pay the tax.";
  const marks = collectMarks(text, markGroups([["the", "taxpayer"]], "wmark"), ["en"]);
  assert.deepStrictEqual(marks.map((m) => text.slice(m.start, m.end)), ["the taxpayer"]);

  const de = "Der Chef hat mich erwischt. Bringst du mich auf dem Laufenden?";
  const verb = collectMarks(de, markGroups([["Bringst", "du", "mich", "auf", "dem", "Laufenden"]], "wmark"), ["de", "es"]);
  assert.deepStrictEqual(verb.map((m) => de.slice(m.start, m.end)), ["Bringst du mich auf dem Laufenden"]);
});

test("a function word among the parts is coloured only where it touches another part", () => {
  const text = "Der Mieter haftet für alle Ansprüche, die sich aus dem Verstoß gegen die Pflicht ergeben.";
  const marks = collectMarks(text, markGroups([["die", "Verstoß", "gegen", "Pflicht"]], "wmark"), ["de", "en"]);
  assert.deepStrictEqual(marks.map((m) => text.slice(m.start, m.end)), ["Verstoß gegen die Pflicht"]);
});

test("an auxiliary is taken from the clause its participle stands in", () => {
  const text = "Er hat Zeit, und die Regierung hat den Plan genehmigt.";
  const marks = collectMarks(text, markGroups([["hat", "genehmigt"]], "vmark"), ["de"]);
  assert.deepStrictEqual(marks.map((m) => text.slice(m.start, m.end)), ["hat", "genehmigt"]);
  assert.ok(marks[0].start > 20, "the second hat, not the first");
});

/* A text met in the window: "clasificarlos" in the last sentence, and
   "klassifizieren" twice in the translation — once for "clasificar" before
   it. The first occurrence is the wrong one. */
const TWICE = "um einen Satz beschrifteter Daten zu klassifizieren. Wenn neue Punkte auftauchen würden, wüsste das Neuron, wie es sie korrekt klassifizieren kann.";

test("a word standing twice is marked where the aligner found it, not where it stands first", () => {
  const first = collectMarks(TWICE, markGroups([["klassifizieren"]], "vmark"), ["de"]);
  assert.strictEqual(first[0].start, TWICE.indexOf("klassifizieren"), "without a whereabouts, the first");
  const meant = collectMarks(TWICE, markGroups([["klassifizieren"]], "vmark", [TWICE.lastIndexOf("klassifizieren")]), ["de"]);
  assert.strictEqual(meant[0].start, TWICE.lastIndexOf("klassifizieren"));
  /* A whereabouts for an entry the panel does not hold changes nothing. */
  assert.deepStrictEqual(collectMarks(TWICE, markGroups([["nirgends"]], "vmark", [10]), ["de"]), []);
});

test("parts placed together take the place the aligner found, before the place that holds them closest", () => {
  const text = "Er hat es gesagt. Dann hat er es nochmal gesagt.";
  const second = collectMarks(text, markGroups([["hat", "gesagt"]], "vmark", [text.lastIndexOf("hat")]), ["de"]);
  assert.ok(second.every((mark) => mark.start >= text.indexOf("Dann")));
});


test("a term that is the whole text is marked nowhere, its row kept", () => {
  /* A line under every word says nothing (author 2026-11-05), as a lookup's
     term naming the looked-up words is not marked in short mode. */
  const whole = {
    ...state,
    text: "Tomar el pelo a alguien.",
    panels: [{ code: "es" }, { code: "de" }, { code: "en" }],
    words: [{ text: "tomar el pelo a alguien", spot: "" }, { text: "fármaco", spot: "" }],
  };
  assert.deepStrictEqual(fragmentsForPanel(whole, 0).words, [[], ["fármaco"]]);
  assert.deepStrictEqual(fragmentsForPanel(whole, 1).words, [[], ["Arzneimittel"]]);
  assert.deepStrictEqual(fragmentsForPanel(whole, 2).words, [[], ["drug"]]);
  /* A part of the text is marked as ever. */
  const part = { ...whole, words: [{ text: "tomar el pelo", spot: "" }, whole.words[1]] };
  assert.deepStrictEqual(fragmentsForPanel(part, 0).words[0], ["tomar el pelo"]);
  assert.deepStrictEqual(fragmentsForPanel(part, 1).words[0], ["klinischen", "Studie"]);
});

test("a picked word stands in the other panels where the aligner found it, and nowhere it did not", () => {
  /* Run eighty-four: no model is asked where it went. */
  const panels = [
    { code: "en", text: "The U.S. China hawks got their revenge." },
    { code: "de", text: "Die China-Falken in den USA haben sich gerächt." },
    { code: "es", text: "Los halcones se vengaron." },
  ];
  const state = { panels, selection: { panel: 0, start: 0, end: 20 }, marked: { text: "The U.S. China hawks", ranges: { 1: [{ start: 4, end: 27 }], 2: null } } };
  assert.deepStrictEqual(selectionForPanel(state, 0), [{ start: 0, end: 20 }]);
  assert.deepStrictEqual(selectionForPanel(state, 1), [{ start: 4, end: 27 }]);
  assert.strictEqual(selectionForPanel(state, 2), null);
  assert.strictEqual(selectionForPanel({ ...state, marked: null }, 1), null, "before the answer the hover's places stand in");
});

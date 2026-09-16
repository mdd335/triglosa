import test from "node:test";
import assert from "node:assert";
import { fragmentsForPanel, selectionForPanel } from "../../src/highlights.js";
import { usableSpot } from "../../src/parse/words.js";
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
  assert.deepStrictEqual(fragmentsForPanel(bare, 1), { words: [], verbs: [] });
});

test("a label written back instead of the words is no spot", () => {
  /* Measured: "comité" came back as "A | committee" three runs out of three —
     the English half trivial because the words are cognates, the German half
     given up on. Searched for in the German text, a bare "A" would colour the
     first stray a it found. */
  assert.strictEqual(usableSpot("A", "comité"), "");
  assert.strictEqual(usableSpot("B", "comité"), "");
  assert.strictEqual(usableSpot("-", "comité"), "");
  assert.strictEqual(usableSpot("Ausschuss", "comité"), "Ausschuss");
});

test("the term repeated back is no spot either", () => {
  /* It stands in the source panel, not in a translation. */
  assert.strictEqual(usableSpot("comité", "comité"), "");
  assert.strictEqual(usableSpot("Comité", "comité"), "");
});

test("the reader's panel falls back to the equivalent when the spot is missing", () => {
  const panels = [
    { code: "es", text: "El comité aprobó la propuesta." },
    { code: "de", text: "Der Ausschuss genehmigte den Vorschlag." },
    { code: "en", text: "The committee approved the proposal." },
  ];
  const marked = { text: "comité", meaning: "Ausschuss", a: "", b: "committee" };
  const state = { panels, marked, selection: { panel: 0, start: 3, end: 9 } };
  assert.ok(selectionForPanel(state, 1, ["de", "en"]), "German panel found through the equivalent");
  assert.ok(selectionForPanel(state, 2, ["de", "en"]), "English panel from the spot itself");
});

test("a third language gets no colour rather than a guessed one", () => {
  /* Nothing else about that panel is known, and a wrong frame is worse than
     none. */
  const panels = [
    { code: "es", text: "El comité aprobó la propuesta." },
    { code: "de", text: "Der Ausschuss genehmigte den Vorschlag." },
    { code: "fr", text: "Le comité a approuvé la proposition." },
  ];
  const marked = { text: "propuesta", meaning: "Vorschlag", a: "", b: "" };
  const state = { panels, marked, selection: { panel: 0, start: 22, end: 31 } };
  assert.ok(selectionForPanel(state, 1, ["de", "fr"]));
  assert.strictEqual(selectionForPanel(state, 2, ["de", "fr"]), null);
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

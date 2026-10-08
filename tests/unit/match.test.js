import test from "node:test";
import assert from "node:assert";
import { coversRange, longestRunInText, rangeOf, rangesOf, spotsFor } from "../../src/match/positions.js";
import { distributeSpots, fixSwappedColumns } from "../../src/match/columns.js";

const at = (text) => (r) => text.slice(r.start, r.end);

/* The languages of the run — a user on German, English and Spanish. */
const RUN = ["de", "en", "es"];

test("a range sits on word boundaries", () => {
  const t = "Hicimos un ensayo clínico en el ensayo.";
  assert.deepStrictEqual(rangeOf(t, "ensayo"), { start: 11, end: 17 });
  assert.deepStrictEqual(rangeOf(t, "en"), { start: 26, end: 28 });
  assert.strictEqual(rangeOf(t, "fármaco"), null);
});

test("a dash as a field yields no range", () => {
  assert.strictEqual(rangesOf("Any text at all.", "-", "x", RUN), null);
  assert.strictEqual(rangesOf("Any text at all.", "", "x", RUN), null);
});

test("parts joined by a plus count separately when they lie apart", () => {
  const t = "Die Studie war klinisch sauber und methodisch eine Studie wert.";
  /* Contiguous in the text: one range. */
  assert.deepStrictEqual(rangesOf(t, "Die Studie", "la Studie", RUN), [{ start: 0, end: 10 }]);
  /* Not contiguous: each part on its own, otherwise nothing gets marked. */
  const r = rangesOf(t, "klinisch + methodisch", "un dos", RUN);
  assert.deepStrictEqual(r.map(at(t)), ["klinisch", "methodisch"]);
});

test("adjacent parts become one group, distant ones stay two", () => {
  /* The model writes "de + nuevo", the text holds "de nuevo" — a space is
     not a gap, that belongs in ONE frame. */
  const s = "Hacer clic de nuevo cierra la sección.";
  const one = rangesOf(s, "de + nuevo", "Nochmal", RUN);
  assert.deepStrictEqual(one.map(at(s)), ["de nuevo"]);
  /* With a word in between they stay two groups. */
  const t = "Der Ausschuss winkte den Vorschlag ohne Aussprache durch.";
  assert.deepStrictEqual(rangesOf(t, "winkte + durch", "rubber-stamped", RUN).map(at(t)), [
    "winkte",
    "durch",
  ]);
});

test("an ellipsis separates just like a plus sign", () => {
  /* The prompt asks for a plus, measurement returned "warfen...das Handtuch". */
  const t = "Am Ende warfen wir bei diesem Projekt das Handtuch, weil niemand antwortete.";
  const want = ["warfen", "das Handtuch"];
  assert.deepStrictEqual(rangesOf(t, "warfen...das Handtuch", "tiramos la toalla", RUN).map(at(t)), want);
  assert.deepStrictEqual(rangesOf(t, "warfen ... das Handtuch", "tiramos la toalla", RUN).map(at(t)), want);
});

test("an inflected field finds its way back over the longest matching run", () => {
  /* The model gave "mehreren Vorbehalte", the text holds "mehrere Vorbehalte". */
  const t = "Die Arbeit nennt mehrere Vorbehalte, ungeachtet des starken Hauptergebnisses.";
  assert.deepStrictEqual(rangesOf(t, "mehreren Vorbehalte", "caveats", RUN).map(at(t)), ["Vorbehalte"]);
});

test("the bar hangs on the chosen entry, not on a fixed number", () => {
  /* For "Sperrklinke" the complete English sentence came back. */
  const t = "The gearbox pawl audibly engages under load.";
  const s = "Hacer clic de nuevo cierra la sección.";
  assert.strictEqual(rangesOf(t, "The gearbox pawl audibly engages under load.", "Sperrklinke", RUN), null);
  /* Four words, under any fixed six-word limit — and still the whole clause
     instead of "de nuevo". */
  assert.strictEqual(rangesOf(s, "Hacer clic de nuevo", "Nochmal", RUN), null);
  assert.deepStrictEqual(rangesOf(s, "de nuevo", "Nochmal", RUN).map(at(s)), ["de nuevo"]);
  /* One word more than the entry stays allowed: function words do not
     count, so "caja de cambios" for "Getriebe" gets through. */
  const g = "El trinquete de la caja de cambios encaja.";
  assert.deepStrictEqual(rangesOf(g, "caja de cambios", "Getriebe", RUN).map(at(g)), ["caja de cambios"]);
});

test("a German compound can be highlighted", () => {
  const t = "Gestern habe ich einen köstlichen Schokoladenkuchen gebacken.";
  const r = spotsFor(t, "Kuchen")[0];
  assert.ok(r, "without this stage the German panel stays empty for every compound");
  assert.strictEqual(t.slice(r.start, r.end).toLowerCase(), "kuchen");
});

test("only at the end of a word and from four characters on", () => {
  /* Otherwise "in" would colour every "Termin". */
  assert.deepStrictEqual(spotsFor("Der Termin steht.", "in"), []);
  assert.deepStrictEqual(spotsFor("Ein Hausboot.", "Haus"), [], "a prefix does not count");
});

test("a missing accent no longer costs the highlight", () => {
  const t = "Y una referencia, está en una zona excelente.";
  const r = spotsFor(t, "esta")[0];
  assert.ok(r);
  assert.strictEqual(t.slice(r.start, r.end), "está");
});

test("the word boundary holds even when compared without accents", () => {
  assert.deepStrictEqual(spotsFor("Un ensayo clínico.", "en"), []);
});

test("the swapped assignment wins only with more spots", () => {
  const de = "Der Vertrag endet morgen.";
  const en = "The contract ends tomorrow.";
  const swapped = { a: [["contract"]], b: [["Vertrag"]] };
  assert.deepStrictEqual(fixSwappedColumns(swapped, de, en), { a: [["Vertrag"]], b: [["contract"]] });
  const straight = { a: [["Vertrag"]], b: [["contract"]] };
  assert.deepStrictEqual(fixSwappedColumns(straight, de, en), straight, "a tie is left alone");
});

test("swapped fields are recognized for a single entry too", () => {
  const es = "El casero se negó a devolver la fianza.";
  const en = "The landlord refused to return the deposit.";
  const entry = (a, b) => ({ text: "Vermieter", a, b });
  /* The straight reading finds both — it stays as it is. */
  let r = distributeSpots(entry("casero", "landlord"), es, en, RUN);
  assert.strictEqual(es.slice(r[0][0].start, r[0][0].end), "casero");
  assert.strictEqual(en.slice(r[1][0].start, r[1][0].end), "landlord");
  /* Swapped: the swapped reading finds two instead of none. */
  r = distributeSpots(entry("landlord", "casero"), es, en, RUN);
  assert.strictEqual(es.slice(r[0][0].start, r[0][0].end), "casero");
  assert.strictEqual(en.slice(r[1][0].start, r[1][0].end), "landlord");
  /* Only one findable, both directions equally good: the straight one wins. */
  r = distributeSpots(entry("casero", "gibtesnicht"), es, en, RUN);
  assert.ok(r[0] && r[0].length);
  assert.strictEqual(r[1], null);
});

test("a term covers the looked-up word only through a word that carries meaning", () => {
  const sentence = "Otra vez metí la pata delante de la casa.";
  const pata = { start: 17, end: 21 };
  assert.ok(coversRange(sentence, "metí la pata", pata, ["es"]));
  assert.ok(coversRange(sentence, "pata", pata, ["es"]));
  assert.ok(!coversRange(sentence, "delante de la casa", pata, ["es"]));
  /* "la" stands right before the word and again in the phrase: sharing it
     is no reason to explain the phrase. */
  const la = { start: 14, end: 16 };
  assert.ok(!coversRange(sentence, "la casa", la, ["es"]), "a function word alone is no overlap");
  assert.ok(!coversRange(sentence, "tejado", pata, ["es"]), "not in the sentence at all");
});

test("a term in a script without spaces is found whole, even at two characters, and never inside a word", () => {
  const text = "一些企业主担心成本上升会迫使他们裁员。";
  assert.deepStrictEqual(rangeOf(text, "裁员"), { start: text.indexOf("裁员"), end: text.indexOf("裁员") + 2 });
  assert.deepStrictEqual(rangesOf(text, "裁员", "裁员", [""]), [{ start: text.indexOf("裁员"), end: text.indexOf("裁员") + 2 }]);
  assert.strictEqual(rangeOf(text, "业主"), null, "the end of 企业 and the start of 主");
  assert.deepStrictEqual(spotsFor(text, "成本上升")[0], { start: text.indexOf("成本"), end: text.indexOf("成本") + 4 });
  assert.deepStrictEqual(spotsFor(text, "本上"), []);
});

test("a Korean word is found with the particle the text writes onto it, and at two syllables", () => {
  /* Korean writes spaces, but a particle or an ending stands on the word:
     경제가, 증가했다. A syllable block holds two or three letters, so the
     bars a Latin word is measured by are counted in blocks here. */
  const text = "올해 경제가 빠르게 성장했고 수출이 크게 증가했다.";
  assert.strictEqual(longestRunInText(text, "경제", [""]), "경제가");
  assert.strictEqual(longestRunInText(text, "수출", [""]), "수출이");
  assert.strictEqual(longestRunInText(text, "증가하다", [""]), "", "an inflected verb: one mark too few, not a wrong one");
  assert.strictEqual(longestRunInText(text, "올해", [""]), "올해");
  assert.strictEqual(longestRunInText(text, "경제학", [""]), "", "another word that starts alike");
});

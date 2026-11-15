import test from "node:test";
import assert from "node:assert";
import { coversRange, longestRunInText, rangeOf, spotsFor } from "../../src/match/positions.js";

test("a range sits on word boundaries", () => {
  const t = "Hicimos un ensayo clínico en el ensayo.";
  assert.deepStrictEqual(rangeOf(t, "ensayo"), { start: 11, end: 17 });
  assert.deepStrictEqual(rangeOf(t, "en"), { start: 26, end: 28 });
  assert.strictEqual(rangeOf(t, "fármaco"), null);
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
  assert.deepStrictEqual(spotsFor(text, "裁员")[0], { start: text.indexOf("裁员"), end: text.indexOf("裁员") + 2 });
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

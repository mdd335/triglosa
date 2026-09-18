import test from "node:test";
import assert from "node:assert";
import { parseAlternatives, MAX_ALTERNATIVES } from "../../src/parse/alternatives.js";

test("translation and note are split at the first pipe", () => {
  const list = parseAlternatives("móvil | v.a. Spanien\ncelular | v.a. Lateinamerika", "Handy", "de");
  assert.deepStrictEqual(list, [
    { text: "móvil", note: "v.a. Spanien" },
    { text: "celular", note: "v.a. Lateinamerika" },
  ]);
});

test("a line without a note still counts", () => {
  assert.deepStrictEqual(parseAlternatives("Hola", "Hallo", "de"), [{ text: "Hola", note: "" }]);
});

test("the word itself is no translation of itself", () => {
  assert.deepStrictEqual(parseAlternatives("Handy | -\nmóvil | v.a. Spanien", "handy", "de"),
    [{ text: "móvil", note: "v.a. Spanien" }]);
});

test("the same word twice is one entry", () => {
  const list = parseAlternatives("móvil | v.a. Spanien\nMóvil | noch mal", "Handy", "de");
  assert.strictEqual(list.length, 1);
});

test("a model saying it does not know is not a translation", () => {
  /* Printed as one it would be worse than a shorter list. */
  assert.deepStrictEqual(parseAlternatives("UNBEKANNT\nkeine", "soslayable", "de"), []);
});

test("never more than three", () => {
  const raw = ["a | x", "b | x", "c | x", "d | x"].join("\n");
  assert.strictEqual(parseAlternatives(raw, "z", "de").length, MAX_ALTERNATIVES);
});

test("an English note is put into the reader's language where the pack knows how", () => {
  assert.strictEqual(parseAlternatives("lift | mainly in Britain", "Aufzug", "de")[0].note,
    "v.a. Großbritannien");
  /* An English reader gets the notes in English and needs nothing. */
  assert.strictEqual(parseAlternatives("lift | mainly in Britain", "elevator", "en")[0].note,
    "mainly in Britain");
});

test("markup the model wraps around a field is not part of it", () => {
  const out = parseAlternatives("<target>ungeduldig</target> | <note>häufigste Entsprechung</note>", "بفارغ الصبر", "de");
  assert.deepStrictEqual(out, [{ text: "ungeduldig", note: "häufigste Entsprechung" }]);
});

test("a translation of a word in lower case is written in lower case", () => {
  const list = parseAlternatives("Pagar | üblich\nCaja | regional", "bezahlen", "de", "es");
  assert.deepStrictEqual(list.map((e) => e.text), ["pagar", "caja"]);
});

test("a capital is kept where it may be the spelling", () => {
  /* A German noun. */
  assert.strictEqual(parseAlternatives("Kasse | üblich", "caja", "de", "de")[0].text, "Kasse");
  /* A word asked about with a capital: a name, or a noun of such a language. */
  assert.strictEqual(parseAlternatives("París | Stadt", "Paris", "de", "es")[0].text, "París");
  /* An abbreviation. */
  assert.strictEqual(parseAlternatives("UE | Politik", "eu", "de", "es")[0].text, "UE");
  /* A script with no capitals gives nothing to go by. */
  assert.strictEqual(parseAlternatives("Impatiently | common", "بفارغ الصبر", "en", "en")[0].text, "Impatiently");
});

test("a list that says it has nothing is empty in every first language", () => {
  for (const [raw, reader] of [["НЕИЗВЕСТНО\nнет", "ru"], ["aucune", "fr"], ["UNKNOWN", "it"], ["nenhuma", "pt"]]) {
    assert.deepStrictEqual(parseAlternatives(raw, "soslayable", reader), [], raw);
  }
});

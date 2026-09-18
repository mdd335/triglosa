import test from "node:test";
import assert from "node:assert";
import { englishName, writingDirection } from "../../src/languages/index.js";
import { ISO_639_1 } from "../../src/languages/iso639.js";
import { readGuesses } from "../../src/platform/translation.js";
import { asksForWordClass } from "../../src/parse/words.js";

test("a prompt names a language without a pack by its English name where its code is known", () => {
  assert.strictEqual(englishName("es"), "Spanish");
  assert.strictEqual(englishName("fa"), "Persian");
  assert.strictEqual(englishName(""), "an unknown language");
  assert.strictEqual(englishName("qq"), "an unknown language");
});

test("a language without a pack runs the way the platform says", () => {
  assert.strictEqual(writingDirection("ar"), "rtl");
  assert.strictEqual(writingDirection("fa"), "rtl");
  assert.strictEqual(writingDirection("he"), "rtl");
  assert.strictEqual(writingDirection("nl"), "ltr");
  assert.strictEqual(writingDirection(""), "ltr");
});

test("the list of languages a reader can name holds every two-letter code once", () => {
  assert.strictEqual(new Set(ISO_639_1).size, ISO_639_1.length);
  for (const code of ["en", "de", "es", "fr", "it", "pt", "ru", "ar", "fa", "gl", "ca"]) {
    assert.ok(ISO_639_1.includes(code), code);
  }
});

test("the recognizer's guesses: a few with real weight, most likely first", () => {
  assert.deepStrictEqual(readGuesses("es 0.597\npt 0.326\nca 0.077\nfr 0.000\nit 0.000"), ["es", "pt", "ca"]);
  assert.deepStrictEqual(readGuesses("pt 0.617\nes 0.292\nca 0.023\nid 0.012\ntr 0.012"), ["pt", "es", "ca"]);
  assert.deepStrictEqual(readGuesses("ar 0.999\nur 0.001"), ["ar"]);
  assert.deepStrictEqual(readGuesses(""), []);
  assert.deepStrictEqual(readGuesses("not an answer"), []);
});

test("a language without a pack is not asked for a word class, even with its code known", () => {
  assert.strictEqual(asksForWordClass("کتاب", "fa"), false);
  assert.strictEqual(asksForWordClass("Buch", "de"), true);
});

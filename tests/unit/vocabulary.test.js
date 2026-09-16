import test from "node:test";
import assert from "node:assert";
import { contentWordCount, isBasicWord, isFunctionWord, isLoanword } from "../../src/vocabulary.js";

test("everyday vocabulary counts as trivial", () => {
  /* Added when the list shrank to three slots: a trivial entry now pushes
     out a third of the list instead of a fifth. */
  for (const [word, code] of [["Wir", "de"], ["campo", "es"], ["Wohnung", "de"], ["Käufer", "de"],
                              ["Bahnhof", "de"], ["unverzüglich", "de"], ["colega", "es"],
                              ["barrio", "es"], ["board", "en"], ["proposal", "en"]]) {
    assert.ok(isBasicWord(word, code), `${word} should count as trivial`);
  }
});

test("terms of art survive the filter", () => {
  /* The counter-check: the list may hold everyday vocabulary only, otherwise
     exactly what the section exists to show disappears. */
  for (const [word, code] of [["Nießbrauch", "de"], ["Auflassungsvormerkung", "de"],
                              ["Grunderwerbsteuer", "de"], ["arras", "es"], ["fianza", "es"],
                              ["convalidación", "es"], ["matrícula oficial", "es"],
                              ["casero", "es"], ["Widerruf", "de"], ["cohorts", "en"],
                              ["perfunctory", "en"], ["red herring", "en"]]) {
    assert.ok(!isBasicWord(word, code), `${word} must not count as trivial`);
  }
});

test("a phrase falls only when nothing in it goes beyond the basics", () => {
  assert.ok(isBasicWord("sobre la mesa", "es"));
  assert.ok(!isBasicWord("el puente", "es"), "a puente is a long weekend, not a bridge");
});

test("a language without a vocabulary list keeps everything", () => {
  /* Eight packs hold no basicWords yet. Nothing may be filtered away there,
     or the section would go empty for those languages. */
  assert.ok(!isBasicWord("gouvernement", "fr"));
  assert.ok(!isBasicWord("dom", "pl"));
});

test("an English word inside a foreign text is recognized", () => {
  assert.ok(isLoanword("meeting", "es"));
  assert.ok(isLoanword("Learning-Agreement", "de"));
  assert.ok(!isLoanword("meeting", "en"), "in English it is simply a word");
});

test("the suffix rule fires only where a language says its words differ", () => {
  /* Spanish has -ción, -idad, -encia, so an -tion is a foreign body. */
  assert.ok(isLoanword("presentation", "es"));
  /* German has Dokument, Argument, Element; French has gouvernement and
     importance. None of those are English. */
  assert.ok(!isLoanword("Argument", "de"));
  assert.ok(!isLoanword("gouvernement", "fr"));
  assert.ok(!isLoanword("importance", "fr"));
});

test("function words are recognized across the languages in play", () => {
  assert.ok(isFunctionWord("der"));
  assert.ok(isFunctionWord("sobre"));
  assert.ok(isFunctionWord("the"));
  assert.ok(!isFunctionWord("Getriebe"));
  assert.ok(!isFunctionWord(""));
});

test("only meaning-carrying words are counted", () => {
  assert.strictEqual(contentWordCount("caja de cambios"), 2);
  assert.strictEqual(contentWordCount("sobre la mesa"), 1);
  assert.strictEqual(contentWordCount(""), 0);
});

test("restricting the languages narrows what counts as a function word", () => {
  assert.ok(isFunctionWord("de", ["es"]));
  assert.ok(!isFunctionWord("de", ["en"]));
});

/* A pack's word list and the lookup have to fold the same way, or they never
   meet where a script spells one letter more than one way. Four of Arabic's
   29 function words — على, أن, إلى, أو — could not be found at all: the
   lookup normalises the alef and the alef maqsura, the list did not. */
test("a pack's word list is folded the way words are looked up", () => {
  for (const [word, code] of [["على", "ar"], ["إلى", "ar"], ["أو", "ar"]]) {
    assert.ok(isFunctionWord(word, [code]), `${word} is a function word of ${code}`);
  }
});

/* Five packs had no everyday vocabulary at all, so nothing a learner in those
   languages already knows could be filtered out. Measured on everyday texts
   the filter fires for about one entry in twenty-five — small, and only ever
   in the three languages that had a list. */
test("the languages that had no everyday vocabulary have one", () => {
  for (const [word, code] of [["maison", "fr"], ["settimana", "it"], ["dinheiro", "pt"], ["неделя", "ru"]]) {
    assert.ok(isBasicWord(word, code), `${word} is everyday ${code}`);
  }
  for (const [word, code] of [["état des lieux", "fr"], ["condominio", "it"], ["cabimento", "pt"], ["ходатайство", "ru"]]) {
    assert.ok(!isBasicWord(word, code), `${word} is not everyday ${code}`);
  }
});

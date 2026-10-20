import test from "node:test";
import assert from "node:assert";
import { checkerOffer, languageByDictionaries, mayBeMisspelled, nearTyped, readSpelling, spellingLanguages, spellingWords, typoDistance, readWordLanguage, wordLanguage } from "../../src/spelling.js";
import { spellingPrompt } from "../../src/prompts/spelling.js";

const unknown = (correction = null, guesses = []) => ({ there: true, known: false, correction, guesses });
const known = { there: true, known: true, correction: null, guesses: [] };
const absent = { there: false, known: false, correction: null, guesses: [] };
const READER = { source: "de", languages: ["de", "en", "es"] };

test("a looked-up text's words are what a checker is asked about", () => {
  assert.deepStrictEqual(spellingWords("„Wrot“,"), ["Wrot"]);
  assert.deepStrictEqual(spellingWords("aujourd'hui tohu-bohu"), ["aujourd'hui", "tohu-bohu"]);
  assert.deepStrictEqual(spellingLanguages("fr", ["de", "en"]), ["fr", "de", "en"]);
  assert.deepStrictEqual(spellingLanguages("de", ["de", "en"]), ["de", "en"]);
});

test("a word is suspect only where no dictionary of the languages concerned knows it", () => {
  const verdicts = (de, en = unknown(), es = unknown()) => ({ Wrot: { de, en, es } });
  assert.ok(mayBeMisspelled("Wrot", verdicts(unknown("Wort")), READER));
  assert.ok(!mayBeMisspelled("Wrot", verdicts(known), READER), "its own language knows it");
  assert.ok(!mayBeMisspelled("Wrot", verdicts(unknown(), known), READER), "another of the reader's languages knows it");
  assert.ok(!mayBeMisspelled("Wrot", verdicts(absent), READER), "no dictionary for its language: nothing is known");
  assert.ok(!mayBeMisspelled("Wrot", {}, READER), "the checker could not be asked");
  assert.ok(!mayBeMisspelled("Wrot", verdicts(unknown()), { ...READER, source: "" }));
});

test("a dictionary of another script neither flags nor vouches for a word", () => {
  /* A checker takes a word of another script as known; and it can say
     nothing about one either. */
  const russian = { source: "ru", languages: ["de", "ru"] };
  assert.ok(mayBeMisspelled("сдесь", { сдесь: { ru: unknown("здесь"), de: known } }, russian));
  assert.ok(!mayBeMisspelled("Wrot", { Wrot: { ru: unknown(), de: unknown() } }, { source: "ru", languages: ["de"] }));
});

test("a phrase is suspect where one of its words is", () => {
  const verdicts = { meter: { es: known }, la: { es: known }, pta: { es: unknown("pata") } };
  assert.ok(mayBeMisspelled("meter la pta", verdicts, { source: "es", languages: ["de", "es"] }));
});

test("the model's answer is the word meant, OK, or no correction at all", () => {
  assert.strictEqual(readSpelling("Kollege", "Kollegge"), "Kollege");
  assert.strictEqual(readSpelling("„Kollege“.", "Kollegge"), "Kollege");
  assert.strictEqual(readSpelling("**Kollege**\n", "Kollegge"), "Kollege");
  assert.strictEqual(readSpelling("OK", "Obacht"), "");
  assert.strictEqual(readSpelling("ok.", "Obacht"), "");
  assert.strictEqual(readSpelling("obacht", "Obacht"), "", "the same word is no correction");
  assert.strictEqual(readSpelling("", "Obacht"), "");
  /* A translation, which the local model gave now and then, is no
     correction. */
  assert.strictEqual(readSpelling("dirección", "addresse"), "");
  assert.strictEqual(readSpelling("desenvolvimento", "desarollo"), "");
  assert.strictEqual(readSpelling("a través", "atravez"), "a través");
});

test("near is a third of the letters, and two always", () => {
  assert.strictEqual(typoDistance("recieve", "receive"), 1, "two letters swapped are one slip");
  assert.strictEqual(typoDistance("Madchen", "Mädchen"), 0, "an accent left out is no letter apart");
  assert.ok(nearTyped("Wrot", "Wort"));
  assert.ok(nearTyped("vergüensa", "vergüenza"));
  assert.ok(!nearTyped("Feez", "Vlies"));
});

test("without a model the checker's own word is offered where it can be what was typed", () => {
  const offer = (verdict, word = "Wrot") => checkerOffer(word, { [word]: { de: verdict, en: unknown(), es: unknown() } }, READER);
  assert.strictEqual(offer(unknown("Wort", ["Wort", "Brot"])), "Wort");
  assert.strictEqual(offer(unknown(null, ["Wort"])), "Wort", "its likeliest guess where it is not sure");
  /* A rare word bent into a common one changes its first letter. */
  assert.strictEqual(offer(unknown("Puff", ["Puff"]), "Kuff"), "");
  assert.strictEqual(offer(unknown(null, ["petrichor's"]), "petrichor"), "", "the word with an ending is no correction");
  assert.strictEqual(offer(known), "");
});

test("the spelling question names the language, the kinds of right word, and its answer", () => {
  const prompt = spellingPrompt({ source: "German" });
  assert.match(prompt, /German word/);
  assert.match(prompt, /reply with exactly: OK/);
  assert.match(prompt, /rare, old, regional, colloquial or new, or a word of another language, or a name/);
  assert.ok(!/"/.test(prompt), "no example word");
});

test("a short text named as a language without a pack goes to the reader's language that knows it", () => {
  const verdicts = {
    gläsrene: { de: unknown("gläserne"), en: unknown(), es: unknown() },
    Decke: { de: known, en: unknown(), es: unknown() },
  };
  assert.strictEqual(languageByDictionaries("gläsrene Decke", verdicts, ["de", "en", "es"]), "de");
  /* Known in two: no one language. */
  const both = { Hotel: { de: known, en: known, es: unknown() } };
  assert.strictEqual(languageByDictionaries("Hotel", both, ["de", "en", "es"]), "");
  /* Known in none: the only one that would correct it. */
  const wrot = { Wrot: { de: unknown("Wort"), en: unknown(), es: unknown() } };
  assert.strictEqual(languageByDictionaries("Wrot", wrot, ["de", "en", "es"]), "de");
  const guessed = { garanteirt: { de: unknown(null, ["garantiert"]), en: absent, es: absent } };
  assert.strictEqual(languageByDictionaries("garanteirt", guessed, ["de", "en", "es"]), "de", "a guess where Windows makes no correction");
  const two = { thier: { de: unknown("tier"), en: unknown("their"), es: unknown() } };
  assert.strictEqual(languageByDictionaries("thier", two, ["de", "en", "es"]), "", "as near in two: no one language");
  const nearer = { Bibliotehk: { de: unknown("Bibliothek"), en: unknown(), es: unknown("Biblioteca") } };
  assert.strictEqual(languageByDictionaries("Bibliotehk", nearer, ["de", "en", "es"]), "de", "the nearer correction");
  assert.strictEqual(languageByDictionaries("Wrot", {}, ["de", "en", "es"]), "");
});

test("a word looked up in a sentence of another language is in the one language that knows it", () => {
  const about = { source: "en", languages: ["de", "en", "es"] };
  const encender = { encender: { de: unknown(), en: unknown("tender"), es: known } };
  assert.strictEqual(wordLanguage("encender", encender, about), "es");
  /* The sentence's language knows it: a loan stays where it stands. */
  const loan = { kindergarten: { de: known, en: known, es: unknown() } };
  assert.strictEqual(wordLanguage("kindergarten", loan, about), "");
  /* Known in two of the others: no one language. */
  const two = { neve: { de: unknown(), en: unknown(), es: known, it: known } };
  assert.strictEqual(wordLanguage("neve", two, { source: "en", languages: ["de", "en", "es", "it"] }), "");
  /* Known nowhere: a rare word of the sentence's own. */
  const rare = { gloaming: { de: unknown(), en: unknown(), es: unknown() } };
  assert.strictEqual(wordLanguage("gloaming", rare, about), "");
  /* Every word of a phrase, in one language. */
  const phrase = { muy: { ru: unknown(), de: unknown(), es: known }, aburrido: { ru: unknown(), de: unknown(), es: known } };
  assert.strictEqual(wordLanguage("muy aburrido", phrase, { source: "ru", languages: ["de", "es"] }), "es");
  const half = { figure: { de: unknown(), en: known, fr: known }, out: { de: unknown(), en: known, fr: unknown() } };
  assert.strictEqual(wordLanguage("figure out", half, { source: "de", languages: ["de", "fr"] }), "");
  /* No dictionary for the sentence's language: it cannot say the word is
     not its own — unless the word is in none of its letters. */
  const noArabic = { awesome: { ar: absent, en: known, fr: unknown() } };
  assert.strictEqual(wordLanguage("awesome", noArabic, { source: "ar", languages: ["fr", "ar", "en"] }), "en");
  /* Where a dictionary that would tell is missing, they cannot tell. */
  const noGerman = { encender: { de: absent, es: known } };
  assert.strictEqual(wordLanguage("encender", noGerman, { source: "de", languages: ["de", "es"] }), null);
  assert.strictEqual(wordLanguage("encender", {}, about), null);
  const noSpanish = { encender: { de: unknown(), en: unknown(), es: absent } };
  assert.strictEqual(wordLanguage("encender", noSpanish, about), null);
  const known_ = { once: { de: absent, en: known, es: absent } };
  assert.strictEqual(wordLanguage("once", known_, about), "", "the sentence's dictionary knows it: nothing to ask");
});

test("the model's answer about a word's language is one of the codes offered", () => {
  assert.strictEqual(readWordLanguage("es", ["en", "de", "es"]), "es");
  assert.strictEqual(readWordLanguage("**ES**\n", ["en", "de", "es"]), "es");
  assert.strictEqual(readWordLanguage("it", ["en", "de", "es"]), "");
  assert.strictEqual(readWordLanguage("Spanish", ["en", "de", "es"]), "");
});

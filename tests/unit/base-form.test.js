/* A verb's base form by Apple's tagger, where no model says it
   (src/base-form.js): what of the tagger's answer is believed. The answers
   below are the shapes the tagger gave in run eighty. */

import test from "node:test";
import assert from "node:assert";
import { baseOfAlone, deviceBaseForm, deviceBaseOfWord, verbInSentence, verbInTranslation } from "../../src/base-form.js";
import { readWords } from "../../src/platform/translation.js";

/* The tagger's answer for a text, from "word/base/class" in order. */
function tagged(text, list) {
  let from = 0;
  return list.split(" ").map((item) => {
    const [word, base, kind] = item.split("/");
    const start = text.indexOf(word, from);
    from = start + word.length;
    return { start, end: from, base, kind };
  });
}

const speller = (known) => ({
  check: async (words, languages) => Object.fromEntries(words.map((word) =>
    [word, Object.fromEntries(languages.map((code) => [code, { there: true, known: known.includes(word) }]))])),
});

test("the helper's answer is read word by word, a broken line left out", () => {
  assert.deepStrictEqual(readWords("0\t6\tgehen\tVerb\nbroken\n7\t10\t\tOtherWord"), [
    { start: 0, end: 6, base: "gehen", kind: "Verb" },
    { start: 7, end: 10, base: "", kind: "OtherWord" },
  ]);
  assert.deepStrictEqual(readWords(""), []);
});

test("a verb in its sentence keeps its base form; a separable one, whose particle stands after it, does not", () => {
  const text = "Ich rufe dich morgen an, dann gibt sie nicht auf.";
  const words = tagged(text, "Ich/Ich/Pronoun rufe/rufen/Verb dich/du/Pronoun morgen/morgen/Adverb an/an/Particle dann/dann/Adverb gibt/geben/Verb sie/sie/Pronoun nicht/nicht/Adverb auf/auf/Particle");
  const at = (word) => ({ text, start: text.indexOf(word), end: text.indexOf(word) + word.length });
  assert.strictEqual(verbInSentence(words, at("rufe")), "");
  assert.strictEqual(verbInSentence(words, at("gibt")), "");

  const plain = "Die Kinder gingen gestern nach Hause. Er fängt an.";
  const tags = tagged(plain, "Die/der/Determiner Kinder/Kind/Noun gingen/gehen/Verb gestern/gestern/Adverb nach/nach/Preposition Hause/Haus/Noun Er/er/Pronoun fängt/fangen/Verb an/an/Particle");
  assert.strictEqual(verbInSentence(tags, { text: plain, start: 11, end: 17 }), "gehen",
    "a particle in the next sentence is not this verb's");
  assert.strictEqual(verbInSentence(tags, { text: plain, start: 4, end: 10 }), "", "a noun is no verb");
});

test("a particle before another verb belongs to that one", () => {
  const text = "I want to go home.";
  const words = tagged(text, "I/I/Pronoun want/want/Verb to/to/Particle go/go/Verb home/home/Adverb");
  assert.strictEqual(verbInSentence(words, { text, start: 2, end: 6 }), "want");
});

test("a base form needs the tagger's two votes and the spelling checker's", async () => {
  const sentence = "Он отказал ей, потому что она шла домой.";
  const inSentence = tagged(sentence, "Он/он/Adjective отказал/отказать/Noun ей/ей/Adverb потому/потому/Adverb что/что/Conjunction она/он/Pronoun шла/идти/Verb домой/домыть/Verb");
  const alone = { "отказал": "0\t7\tотказать\tVerb", "отказать": "0\t8\tотказать\tVerb", "шла": "0\t3\tидти\tVerb", "домой": "0\t5\tдомой\tAdverb" };
  const translation = { words: async (code, text) => (text === sentence ? inSentence : readWords(alone[text] || "")) };
  const ask = (word) => deviceBaseForm({ text: sentence, start: sentence.indexOf(word), end: sentence.indexOf(word) + word.length,
                                         code: "ru", translation, speller: speller(["отказать", "идти", "домыть"]) });
  assert.strictEqual(await ask("шла"), "идти");
  assert.strictEqual(await ask("отказал"), "отказать", "a noun in its sentence, but its base form a verb alone");
  assert.strictEqual(await ask("домой"), "", "a verb in its sentence, an adverb alone");

  const modal = "Ich muss gehen.";
  const german = { words: async (code, text) => (text === modal
    ? tagged(modal, "Ich/Ich/Pronoun muss/muessen/Verb gehen/gehen/Verb")
    : readWords(`0\t${text.length}\t${text === "muss" ? "muessen" : "gehen"}\tVerb`)) };
  const known = speller(["gehen", "müssen"]);
  assert.strictEqual(await deviceBaseForm({ text: modal, start: 4, end: 8, code: "de", translation: german, speller: known }), "",
    "a base form no dictionary knows");
  assert.strictEqual(await deviceBaseForm({ text: modal, start: 9, end: 14, code: "de", translation: german, speller: known }), "gehen");
  assert.strictEqual(await deviceBaseForm({ text: modal, start: 9, end: 14, code: "de", translation: german, speller: null }), "",
    "no checker, nothing known");
  assert.strictEqual(await deviceBaseForm({ text: modal, start: 4, end: 14, code: "de", translation: german, speller: known }), "",
    "more than one word");
});

test("a class named wrongly is forgiven where the base form holds in the sentence, alone and as a verb itself", async () => {
  const text = "Con cada compra obtienes el 5 % del total.";
  const inSentence = tagged(text, "Con/con/Preposition cada/cada/Determiner compra/compra/Noun obtienes/obtener/Preposition el/el/Determiner total/total/Noun");
  const alone = { obtienes: "0\t8\tobtener\tNoun", obtener: "0\t7\tobtener\tVerb", compra: "0\t6\tcomprar\tVerb", comprar: "0\t7\tcomprar\tVerb", total: "0\t5\ttotal\tNoun" };
  const translation = { words: async (code, asked) => (asked === text ? inSentence : readWords(alone[asked] || "")) };
  const ask = (word) => deviceBaseForm({ text, start: text.indexOf(word), end: text.indexOf(word) + word.length,
                                         code: "es", translation, speller: speller(["obtener", "comprar", "total"]) });
  assert.strictEqual(await ask("obtienes"), "obtener");
  assert.strictEqual(await ask("compra"), "", "a noun whose base form alone is another");
  assert.strictEqual(await ask("total"), "", "a word that is its own base form");

  /* A base form that does not look like an infinitive of its language. */
  const ru = "После собрания жильцов.";
  const tags = tagged(ru, "После/после/Preposition собрания/собрание/Noun жильцов/жилец/Adjective");
  const lone = { собрания: "0\t8\tсобрание\tVerb", собрание: "0\t8\tсобрание\tVerb" };
  const russian = { words: async (code, asked) => (asked === ru ? tags : readWords(lone[asked] || "")) };
  assert.strictEqual(await deviceBaseForm({ text: ru, start: 6, end: 14, code: "ru", translation: russian, speller: speller(["собрание"]) }), "");
});

test("a word in the reader's language is taken as a verb's base form by one vote", async () => {
  const translation = { words: async (code, text) => readWords(text === "went" ? "0\t4\tgo\tVerb" : `0\t${text.length}\t${text}\tNoun`) };
  assert.strictEqual(await deviceBaseOfWord({ word: "went", code: "en", translation, speller: speller(["go"]) }), "go");
  assert.strictEqual(await deviceBaseOfWord({ word: "house", code: "en", translation, speller: speller(["house"]) }), "");
  assert.strictEqual(await deviceBaseOfWord({ word: "to go", code: "en", translation, speller: speller(["go"]) }), "");
  assert.strictEqual(baseOfAlone([]), "");
});

test("without a tagger — Windows — there is no base form", async () => {
  assert.strictEqual(await deviceBaseForm({ text: "gingen", start: 0, end: 6, code: "de", translation: { words: async () => [] }, speller: speller(["gehen"]) }), "");
  assert.strictEqual(await deviceBaseForm({ text: "gingen", start: 0, end: 6, code: "de", translation: {}, speller: speller(["gehen"]) }), "");
});

test("Apple's dictionary is asked through the shell on the Mac and through the app's routes on the phone, once per word", async () => {
  const { createDictionary } = await import("../../src/platform/dictionary.js");
  const asked = [];
  const mac = createDictionary(async (command, args) => {
    asked.push([command, args]);
    return command === "dictionary_has" ? args.term === "gehen" : true;
  }, "mac");
  assert.strictEqual(await mac.has("gehen"), true);
  assert.strictEqual(await mac.has("gehen"), true);
  assert.strictEqual(await mac.has("xqzv"), false);
  assert.strictEqual(await mac.show("gehen", { x: 10, y: 20, size: 15 }), true);
  assert.deepStrictEqual(asked, [
    ["dictionary_has", { term: "gehen" }],
    ["dictionary_has", { term: "xqzv" }],
    ["dictionary_show", { term: "gehen", x: 10, y: 20, size: 15 }],
  ]);

  const routes = [];
  const phone = createDictionary(async (command, { route, body }) => {
    routes.push([command, route, body]);
    if (route === "/dictionary") return { status: 200, text: body === "casa" ? "yes" : "no" };
    return { status: 200, text: "shown" };
  }, "ios");
  assert.strictEqual(await phone.has("casa"), true);
  assert.strictEqual(await phone.has("xqzv"), false);
  assert.strictEqual(await phone.show("casa"), true);
  assert.deepStrictEqual(routes.map(([, route, body]) => [route, body]), [["/dictionary", "casa"], ["/dictionary", "xqzv"], ["/look-up", "casa"]]);

  const failing = createDictionary(async () => { throw new Error("no shell"); }, "mac");
  assert.strictEqual(await failing.has("gehen"), false, "a failure is no button");
  assert.strictEqual(createDictionary(async () => true, "windows"), null);
});

test("a verb's meaning is Apple's translation of its base form, as a base form, a capital Apple gave a verb taken off", async () => {
  const { verbMeaning } = await import("../../src/base-form.js");
  const asked = [];
  const apple = { "usar": "Benutzen", "acumular": "Ansammeln", "belittle": "herabsetzen", "correr": "running" };
  const verbs = { "benutzen": "benutzen", "ansammeln": "ansammeln", "herabsetzen": "herabsetzen", "running": "run" };
  const translation = {
    translate: async (from, to, text) => { asked.push([from, to, text]); return apple[text.replace(/^to /, "")] || ""; },
    /* As the tagger answers: a capitalised verb a noun with a small base form. */
    words: async (code, text) => readWords(verbs[text] ? `0\t${text.length}\t${verbs[text]}\tVerb`
      : verbs[text.toLowerCase()] ? `0\t${text.length}\t${verbs[text.toLowerCase()]}\tNoun` : `0\t${text.length}\t${text}\tNoun`),
  };
  const known = speller(["benutzen", "ansammeln", "herabsetzen", "run"]);
  assert.strictEqual(await verbMeaning({ base: "usar", from: "es", reader: "de", translation, speller: known }), "benutzen");
  assert.strictEqual(await verbMeaning({ base: "acumular", from: "es", reader: "de", translation, speller: known }), "ansammeln");
  assert.strictEqual(await verbMeaning({ base: "belittle", from: "en", reader: "de", translation, speller: known }), "herabsetzen");
  assert.strictEqual(await verbMeaning({ base: "correr", from: "es", reader: "en", translation, speller: known }), "to run");
  assert.deepStrictEqual(asked[2], ["en", "de", "to belittle"], "asked in the citation form");
  assert.strictEqual(await verbMeaning({ base: "usar", from: "es", reader: "es", translation, speller: known }), "", "not in the reader's own language");
  /* Apple's word a noun to the tagger: no meaning rather than a wrong one. */
  const noun = { ...translation, words: async (code, text) => readWords(`0\t${text.length}\t${text}\tNoun`) };
  assert.strictEqual(await verbMeaning({ base: "usar", from: "es", reader: "de", translation: noun, speller: known }), "");
  /* What Apple put in front of the infinitive goes. */
  const para = { ...translation, translate: async () => "para fundar", words: async (code, text) => readWords(`0\t${text.length}\tfundar\tVerb`) };
  assert.strictEqual(await verbMeaning({ base: "found", from: "en", reader: "es", translation: para, speller: speller(["fundar"]) }), "fundar");
});

test("a capital Apple writes on a word alone goes where the tagger gives its base form a small letter", async () => {
  const { deviceHeadword } = await import("../../src/base-form.js");
  const tags = { "Großartig": "0\t9\tgroßartig\tNoun", "Morgen": "0\t6\tMorgen\tNoun", "Vielen Dank": "0\t6\tviele\tDeterminer\n7\t11\tDank\tNoun", "Schön": "0\t5\tSchön\tNoun" };
  const translation = { words: async (code, text) => readWords(tags[text] || "") };
  assert.strictEqual(await deviceHeadword("Großartig", "genial", "de", translation), "großartig");
  assert.strictEqual(await deviceHeadword("Morgen", "mañana", "de", translation), "Morgen", "a noun keeps it");
  assert.strictEqual(await deviceHeadword("Vielen Dank", "gracias", "de", translation), "vielen Dank");
  assert.strictEqual(await deviceHeadword("Schön", "bonito", "de", translation), "Schön", "what the tagger keeps capitalised stays");
  assert.strictEqual(await deviceHeadword("Großartig", "Genial", "de", translation), "Großartig", "a capital looked up keeps its capital");
  assert.strictEqual(await deviceHeadword("Großartig", "genial", "de", {}), "Großartig", "no tagger, nothing changes");
  assert.strictEqual(await deviceHeadword("Great", "genial", "en", translation), "great", "the plain rule where nouns are not capitalised");
});

test("a particle past a comma or a conjunction is another clause's (run 85)", () => {
  const text = "Wenn ich mehr Zeit hätte, käme ich gern öfter vorbei.";
  const words = tagged(text, "Wenn/wenn/Conjunction ich/ich/Pronoun mehr/mehr/Determiner Zeit/Zeit/Noun hätte/haben/Verb käme/kommen/Verb ich/ich/Pronoun gern/gern/Adverb öfter/öfter/Verb vorbei/vorbei/Particle");
  const at = (word) => ({ text, start: text.indexOf(word), end: text.indexOf(word) + word.length });
  assert.strictEqual(verbInSentence(words, at("hätte")), "haben");
  assert.strictEqual(verbInSentence(words, at("käme")), "", "its own particle still stops it");
  const joined = "Wir fuhren los und kamen spät an.";
  const tags = tagged(joined, "Wir/wir/Pronoun fuhren/fahren/Verb los/los/Particle und/und/Conjunction kamen/kommen/Verb spät/spät/Adverb an/an/Particle");
  assert.strictEqual(verbInSentence(tags, { text: joined, start: 4, end: 10 }), "", "los is fuhren's");
  const first = "Er ging und sie kam an.";
  const both = tagged(first, "Er/er/Pronoun ging/gehen/Verb und/und/Conjunction sie/sie/Pronoun kam/kommen/Verb an/an/Particle");
  assert.strictEqual(verbInSentence(both, { text: first, start: 3, end: 7 }), "gehen", "an is kam's, past the conjunction");
});

test("a base form without an infinitive's shape, or a word an adjective in both votes, gives none (run 85)", async () => {
  const sentence = "Аналитики ожидали снижения на фоне замедления инфляции.";
  const inSentence = tagged(sentence, "Аналитики/аналитик/Noun ожидали/ожидать/Verb снижения/снижение/Noun на/на/Preposition фоне/фон/Noun замедления/замедление/Verb инфляции/инфляция/Noun");
  const alone = { "замедления": "0\t10\tзамедление\tVerb", "ожидали": "0\t7\tожидать\tVerb" };
  const translation = { words: async (code, text) => (text === sentence ? inSentence : readWords(alone[text] || "")) };
  const ask = (word) => deviceBaseForm({ text: sentence, start: sentence.indexOf(word), end: sentence.indexOf(word) + word.length,
                                         code: "ru", translation, speller: speller(["замедление", "ожидать"]) });
  assert.strictEqual(await ask("замедления"), "", "a noun's base form, though the tagger says verb");
  assert.strictEqual(await ask("ожидали"), "ожидать");

  const de = "Der Widerspruch hat keine aufschiebende Wirkung.";
  const deTags = tagged(de, "Der/der/Determiner Widerspruch/Widerspruch/Noun hat/haben/Verb keine/kein/Determiner aufschiebende/aufschieben/Adjective Wirkung/Wirkung/Noun");
  const deAlone = { aufschiebende: "0\t13\taufschieben\tAdjective", aufschieben: "0\t11\taufschieben\tVerb" };
  const deTranslation = { words: async (code, text) => (text === de ? deTags : readWords(deAlone[text] || "")) };
  assert.strictEqual(await deviceBaseForm({ text: de, start: de.indexOf("aufschiebende"), end: de.indexOf("aufschiebende") + 13,
                                            code: "de", translation: deTranslation, speller: speller(["aufschieben"]) }), "");
});

test("a picked verb's place in the reader's translation is read word by word, past auxiliaries (run 86)", async () => {
  const text = "Der Staat hat die Vereinbarung angefochten, wenn Sie sich bücken.";
  const panel = tagged(text, "Der/der/Determiner Staat/Staat/Noun hat/haben/Verb die/der/Determiner Vereinbarung/Vereinbarung/Noun angefochten/anfechten/Verb wenn/wenn/Conjunction Sie/Sie/Pronoun sich/er/Pronoun bücken/bücken/Verb");
  const translation = { words: async (code, asked) => (asked === text ? panel : []) };
  const at = (from, to) => ({ start: text.indexOf(from), end: text.indexOf(to) + to.length });
  const found = (pieces) => verbInTranslation({ text, pieces, code: "de", translation, speller: speller(["anfechten", "bücken"]) });
  assert.strictEqual(await found([at("hat", "angefochten")]), "anfechten", "past the auxiliary, the noun no verb");
  assert.strictEqual(await found([at("sich", "bücken")]), "bücken", "two words of one piece");
  assert.strictEqual(await found([at("Vereinbarung", "Vereinbarung")]), "");
  assert.strictEqual(await found([]), "");
});

test("a word the tagger calls an adverb in both votes is no verb, whatever its base form (author 2026-11-13)", async () => {
  const text = "Se sitúa un tanto más arriba y adelante que el anterior.";
  const words = tagged(text, "Se/usted/Pronoun sitúa/situar/Verb un/un/Determiner tanto/tanto/Noun más/más/Adverb arriba/arribar/Adverb y/y/Conjunction adelante/adelantar/Adverb que/que/Conjunction el/el/Determiner anterior/anterior/Adjective");
  const alone = { arriba: "0\t6\tarribar\tAdverb", arribar: "0\t7\tarribar\tVerb", "sitúa": "0\t5\tsituar\tVerb" };
  const translation = { words: async (code, asked) => (asked === text ? words : readWords(alone[asked] || "")) };
  const ask = (word) => deviceBaseForm({ text, start: text.indexOf(word), end: text.indexOf(word) + word.length, code: "es", translation, speller: speller(["arribar", "situar"]) });
  assert.strictEqual(await ask("arriba"), "");
  assert.strictEqual(await ask("sitúa"), "situar");
});

test("Apple's word for a verb that the tagger knows no base form of is no meaning (\"Resulten\")", async () => {
  const { verbMeaning } = await import("../../src/base-form.js");
  const translation = {
    translate: async () => "Resulten",
    words: async (code, asked) => readWords(asked === "Resulten" ? "0\t8\t\tNoun" : asked === "resulten" ? "0\t8\t\tVerb" : ""),
  };
  assert.strictEqual(await verbMeaning({ base: "resultar", from: "es", reader: "de", translation, speller: speller([]) }), "");
});

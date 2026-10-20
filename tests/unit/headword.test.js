import test from "node:test";
import assert from "node:assert";
import { parseHeadword } from "../../src/parse/headword.js";
import { headwordsFor } from "../../src/ask.js";

test("a noun comes back with its article", () => {
  assert.strictEqual(parseHeadword("la caja", "caja", "es"), "la caja");
  assert.strictEqual(parseHeadword("die Kasse", "Kasse", "de"), "die Kasse");
  assert.strictEqual(parseHeadword("l'eau", "eau", "fr"), "l'eau");
  assert.strictEqual(parseHeadword("l’acqua", "acqua", "it"), "l’acqua");
});

test("a capital may change, and nothing else", () => {
  assert.strictEqual(parseHeadword("die Kasse", "kasse", "de"), "die Kasse");
  assert.strictEqual(parseHeadword("bezahlen", "Bezahlen", "de"), "bezahlen");
});

test("anything but an article of the word's own language is refused", () => {
  /* A different word, an explanation, an article of another language. */
  assert.strictEqual(parseHeadword("el cajón", "caja", "es"), "caja");
  assert.strictEqual(parseHeadword("la caja (noun, feminine)", "caja", "es"), "caja");
  assert.strictEqual(parseHeadword("the caja", "caja", "es"), "caja");
  assert.strictEqual(parseHeadword("", "caja", "es"), "caja");
  /* An article glued on without a space, where the language does not elide. */
  assert.strictEqual(parseHeadword("lacaja", "caja", "es"), "caja");
});

test("a card is asked about only on the sides whose language names articles", async () => {
  const asked = [];
  const llm = { chat: async ({ user }) => { asked.push(user); return { caja: "la caja", Kasse: "die Kasse", bezahlen: "bezahlen" }[user] || user; } };
  const card = { term: "caja", termLanguage: "es", meaning: "Kasse, bezahlen", meaningLanguage: "de", note: "x" };
  const better = await headwordsFor(llm, card);
  assert.deepStrictEqual([better.term, better.meaning, better.note], ["la caja", "die Kasse, bezahlen", "x"]);
  asked.length = 0;
  assert.strictEqual(await headwordsFor(llm, { term: "checkout", termLanguage: "en", meaning: "касса", meaningLanguage: "ru" }), null);
  assert.deepStrictEqual(asked, [], "English and Russian name no articles, so nothing is asked");
});

test("a side too long to be a headword is left alone", async () => {
  const llm = { chat: async () => { throw new Error("not asked"); } };
  const card = { term: "estar en las nubes todo el día", termLanguage: "es", meaning: "", meaningLanguage: "de" };
  assert.strictEqual(await headwordsFor(llm, card), null);
});

test("a capital at the start is the model's habit, not the word's", () => {
  assert.strictEqual(parseHeadword("La caja", "caja", "es"), "la caja");
  assert.strictEqual(parseHeadword("Pagar", "pagar", "pt"), "pagar");
  assert.strictEqual(parseHeadword("O problema", "problema", "pt"), "o problema");
  /* German decides a noun's capital, and its article is still small. */
  assert.strictEqual(parseHeadword("Die Kasse", "kasse", "de"), "die Kasse");
});

test("a person or an animal comes back in both forms, the woman second", () => {
  assert.strictEqual(parseHeadword("el profesor / la profesora", "profesor", "es"), "el profesor / la profesora");
  assert.strictEqual(parseHeadword("La profesora/El profesor", "profesora", "es"), "el profesor / la profesora");
  assert.strictEqual(parseHeadword("der Arzt / die Ärztin", "Arzt", "de"), "der Arzt / die Ärztin");
  assert.strictEqual(parseHeadword("l'acteur / l'actrice", "acteur", "fr"), "l'acteur / l'actrice");
  assert.strictEqual(parseHeadword("lo studente / la studentessa", "studente", "it"), "lo studente / la studentessa");
});

test("one word for both stands once under both articles", () => {
  assert.strictEqual(parseHeadword("el/la policía", "policía", "es"), "el/la policía");
  assert.strictEqual(parseHeadword("la policía/el policía", "policía", "es"), "el/la policía");
  assert.strictEqual(parseHeadword("O jornalista/A jornalista", "jornalista", "pt"), "o/a jornalista");
  assert.strictEqual(parseHeadword("der/die Angestellte", "Angestellte", "de"), "der/die Angestellte");
  /* The same article twice, or one cut short beside another, is one article. */
  assert.strictEqual(parseHeadword("la policía/la policía", "policía", "es"), "la policía");
  assert.strictEqual(parseHeadword("l'/la insegnante", "insegnante", "it"), "l'insegnante");
});

test("a second form that is no form of the word is dropped, and the word keeps its article", () => {
  /* Another word, a plural, two words under one article, an indefinite article. */
  assert.strictEqual(parseHeadword("der Vater / die Mutter", "Vater", "de"), "der Vater");
  assert.strictEqual(parseHeadword("A pessoa / As pessoas", "pessoa", "pt"), "a pessoa");
  assert.strictEqual(parseHeadword("die Giraffe / die Giraffin", "Giraffe", "de"), "die Giraffe");
  assert.strictEqual(parseHeadword("la souris/une souris", "souris", "fr"), "la souris");
  /* Neither form is the word asked about. */
  assert.strictEqual(parseHeadword("el maestro / la maestra", "profesor", "es"), "profesor");
});

test("two meanings that come back as the same pair stand once", async () => {
  const llm = { chat: async ({ user }) => ({ Lehrer: "der Lehrer / die Lehrerin", Lehrerin: "der Lehrer / die Lehrerin", Schule: "die Schule" }[user] || user) };
  const card = { term: "teacher", termLanguage: "en", meaning: "Lehrer;\nLehrerin", meaningLanguage: "de" };
  assert.strictEqual((await headwordsFor(llm, card)).meaning, "der Lehrer / die Lehrerin");
  const two = { ...card, meaning: "Lehrer; Schule; Lehrerin" };
  assert.strictEqual((await headwordsFor(llm, two)).meaning, "der Lehrer / die Lehrerin; die Schule");
});

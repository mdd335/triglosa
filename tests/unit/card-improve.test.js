import test from "node:test";
import assert from "node:assert";
import { parseCardExplanation, parseImprovedCard } from "../../src/parse/card.js";
import { improveCard } from "../../src/ask.js";

const CARD = {
  term: "brazos",
  termLanguage: "es",
  meaning: "Arme",
  meaningLanguage: "de",
  note: "",
  context: { sentence: "Me cogió en brazos.", translation: "Er nahm mich auf den Arm." },
};

/* A model standing in for both questions: the word and its meaning, and the
   explanation asked apart. */
const answering = (card, explanation, record = []) => ({
  async chat(question) {
    record.push(question);
    if (/headword/.test(question.system)) return question.user;
    if (/write the explanation/.test(question.system)) return explanation;
    return card;
  },
});

test("an improved card comes back as the word, its meaning and the sentence", () => {
  assert.deepStrictEqual(parseImprovedCard("el brazo\nder Arm", CARD), {
    term: "el brazo",
    meaning: "der Arm",
    sentence: "Me cogió en brazos. (Er nahm mich auf den Arm.)",
  });
  assert.strictEqual(parseImprovedCard("el brazo\nder Arm", { ...CARD, context: null }).sentence, "");
});

test("a sentence the answer translated keeps that translation, written as it stood", () => {
  const context = { sentence: "enumeró algunos puntos", translation: "" };
  const raw = "enumerar\naufzählen\n---\nEnumeró algunos puntos. (Sie zählte einige Punkte (mehrere) auf.)";
  assert.strictEqual(parseImprovedCard(raw, { ...CARD, context }).sentence,
    "enumeró algunos puntos (Sie zählte einige Punkte (mehrere) auf.)");
  assert.strictEqual(parseImprovedCard("enumerar\naufzählen\nEnumeró algunos puntos.\n(Sie zählte einige Punkte auf.)", { ...CARD, context }).sentence,
    "enumeró algunos puntos (Sie zählte einige Punkte auf.)", "without the hyphens, the third line on");
  assert.strictEqual(parseImprovedCard("enumerar\naufzählen", { ...CARD, context }).sentence, "enumeró algunos puntos",
    "no translation came: the sentence stands alone");
});

test("a given translation is the one that stands, and anything else in the answer is left out", () => {
  const context = { sentence: "enumeró algunos puntos", translation: "sie zählte einige Punkte auf" };
  const raw = "enumerar\naufzählen\n---\nEnumeró algunos puntos importantes. (Sie zählte einige wichtige Punkte auf.)\n\nGeläufig.";
  assert.strictEqual(parseImprovedCard(raw, { ...CARD, context }).sentence, "enumeró algunos puntos (sie zählte einige Punkte auf)");
});

test("labels, brackets and fences around the fields are read through", () => {
  const card = parseImprovedCard("```\nField 1: <el brazo>\nField 2: <der Arm>\n```", { ...CARD, context: null });
  assert.strictEqual(card.term, "el brazo");
  assert.strictEqual(card.meaning, "der Arm");
});

test("an answer in another shape changes nothing", () => {
  assert.strictEqual(parseImprovedCard("el brazo — der Arm", CARD), null);
  assert.strictEqual(parseImprovedCard("el brazo\n---\nnote", CARD), null);
  assert.strictEqual(parseImprovedCard("", CARD), null);
});

test("the explanation is read as items, its examples one line each, the card's sentence not twice", () => {
  assert.strictEqual(parseCardExplanation("Umgangssprachlich.\nSe le cae la baba. [Er ist hin und weg.]\nI'll swing by later.\n(Ich schaue später vorbei.)"),
    "Umgangssprachlich.\n\nSe le cae la baba. (Er ist hin und weg.)\n\nI'll swing by later. (Ich schaue später vorbei.)");
  assert.strictEqual(parseCardExplanation("Me cogió en brazos. (Er nahm mich.)\n\nGeläufig.", "Me cogió en brazos. (Er nahm mich auf den Arm.)"), "Geläufig.");
});

test("the explanation is asked of the word and its meaning alone, never of the sentence", async () => {
  const questions = [];
  const card = await improveCard(answering("el brazo\nder Arm", "Geläufig.\n\nbrazo de río (Flussarm)", questions), CARD, { level: "A2" });
  assert.strictEqual(card.note, "Me cogió en brazos. (Er nahm mich auf den Arm.)\n\nGeläufig.\n\nbrazo de río (Flussarm)");
  const [first] = questions;
  const explaining = questions.find((q) => /write the explanation/.test(q.system));
  assert.match(first.user, /Sentence from the text \(Spanish\): Me cogió en brazos\./);
  assert.doesNotMatch(first.system, /FIELD 3/, "a sentence with its translation needs nothing written");
  assert.strictEqual(explaining.user, "Word (Spanish): el brazo\nMeaning (German): der Arm", "with the articles the headword question gave");
  assert.match(explaining.system, /learning Spanish at level A2/);
  assert.match(explaining.system, /Nowhere say how the word is conjugated or declined/);
  assert.match(explaining.system, /Never its article or its gender - the card adds the article itself\./);
  /* The card names a person's both forms, so the explanation must not (run 56). */
  assert.match(explaining.system, /explain the word alike for both sexes/);
});

test("articles are asked only where a pack has them", async () => {
  const questions = [];
  await improveCard(answering("el brazo\nder Arm", "Geläufig.", questions), CARD, { level: "A2" });
  assert.ok(questions.some((q) => /headword of a Spanish dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /headword of a German dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /lists that noun in a masculine and a feminine form/.test(q.system)));

  questions.length = 0;
  await improveCard(answering("брат\nbrother", "Common.", questions), { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: null }, { level: "C1" });
  assert.strictEqual(questions.length, 2, "Russian and English name no articles");
  const explaining = questions.find((q) => /write the explanation/.test(q.system));
  assert.match(explaining.system, /Never its article\./, "a gender the card does not show may be said");
  assert.doesNotMatch(explaining.system, /both sexes/, "nor are both forms added where no pack names articles");
  assert.match(questions[0].user, /There is no sentence from a text\./);
  assert.doesNotMatch(questions[0].system, /copied word for word/);
});

test("an explanation that failed leaves the sentence, and a card without either keeps its note", async () => {
  const failing = { async chat(question) {
    if (/write the explanation/.test(question.system)) throw new Error("down");
    return /headword/.test(question.system) ? question.user : "el brazo\nder Arm";
  } };
  assert.strictEqual((await improveCard(failing, CARD, { level: "B1" })).note, "Me cogió en brazos. (Er nahm mich auf den Arm.)");
  assert.strictEqual((await improveCard(failing, { ...CARD, note: "Mine.", context: null }, { level: "B1" })).note, "Mine.");
});

test("an explanation that failed or came back empty is asked once more", async () => {
  for (const first of [() => { throw new Error("down"); }, () => "  "]) {
    let asked = 0;
    const flaky = { async chat(question) {
      if (/write the explanation/.test(question.system)) return ++asked === 1 ? first() : "Common.";
      return /headword/.test(question.system) ? question.user : "el brazo\nder Arm";
    } };
    const card = await improveCard(flaky, { ...CARD, context: null }, { level: "B1" });
    assert.strictEqual(asked, 2);
    assert.strictEqual(card.note, "Common.");
  }
});

test("an explanation that ran out of time is not asked again", async () => {
  let asked = 0;
  const slow = { async chat(question) {
    if (/write the explanation/.test(question.system)) {
      asked += 1;
      throw Object.assign(new Error("The operation timed out."), { name: "TimeoutError" });
    }
    return /headword/.test(question.system) ? question.user : "el brazo\nder Arm";
  } };
  const card = await improveCard(slow, { ...CARD, note: "Mine.", context: null }, { level: "B1" });
  assert.strictEqual(asked, 1);
  assert.strictEqual(card.note, "Mine.");
});

test("a card with one side written gets the other from the dictionary question first", async () => {
  const { completeCard } = await import("../../src/ask.js");
  const asked = [];
  const llm = { async chat(question) {
    asked.push(question.system);
    if (/bilingual dictionary/.test(question.system)) return "perro | —\ncan | literary";
    return "";
  } };
  const own = await completeCard(llm, { term: "", termLanguage: "es", meaning: "Hund", meaningLanguage: "de", note: "" });
  assert.strictEqual(own.term, "perro", "the word side takes the first entry");
  const both = { term: "perro", termLanguage: "es", meaning: "Hund", meaningLanguage: "de", note: "" };
  assert.strictEqual(await completeCard(llm, both), both, "nothing to fill");
  const blank = { term: "", termLanguage: "es", meaning: "", meaningLanguage: "de", note: "" };
  assert.strictEqual(await completeCard(llm, blank), blank);
});

test("two senses stand one under the other, and every item of the explanation apart", async () => {
  assert.strictEqual(parseImprovedCard("correr\nrennen; laufen", CARD).meaning, "rennen;\nlaufen");
  const questions = [];
  const card = await improveCard(answering("correr\nrennen; laufen", "Corre mucho. (Er rennt viel.)\nCorrió a casa. (Er lief nach Hause.)", questions), CARD, { level: "B1" });
  assert.strictEqual(card.note,
    "Me cogió en brazos. (Er nahm mich auf den Arm.)\n\nCorre mucho. (Er rennt viel.)\n\nCorrió a casa. (Er lief nach Hause.)");
  assert.match(questions.find((q) => /write the explanation/.test(q.system)).user, /Meaning \(German\): rennen; laufen$/);
});

test("a sentence without its translation is kept, and the model asked to translate it", async () => {
  const questions = [];
  const bare = { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: { sentence: "Me cogió en brazos.", translation: "" } };
  const card = await improveCard(answering("брат\nbrother", "Other line.", questions), bare, { level: "B1" });
  assert.match(questions[0].system, /FIELD 3 - the sentence from the text, copied word for word as given, followed by its English translation/);
  assert.doesNotMatch(questions[0].user, /Its English translation/);
  assert.strictEqual(card.note, "Me cogió en brazos.\n\nOther line.", "put back as it stands where the answer dropped it");
});

test("the explanation is asked after the articles, of a person's both forms", async () => {
  const questions = [];
  const llm = { async chat(question) {
    questions.push(question);
    if (/headword of a German/.test(question.system)) return question.user === "Ärztin" ? "der Arzt / die Ärztin" : question.user;
    if (/headword/.test(question.system)) return question.user;
    if (/write the explanation/.test(question.system)) return "Common.";
    return "Ärztin\ndoctor";
  } };
  const card = await improveCard(llm, { ...CARD, termLanguage: "de", meaningLanguage: "en", context: null }, { level: "B1" });
  assert.strictEqual(card.term, "der Arzt / die Ärztin");
  assert.match(questions.at(-1).user, /^Word \(German\): der Arzt \/ die Ärztin$/m);
});

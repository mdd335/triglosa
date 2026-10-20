import test from "node:test";
import assert from "node:assert";
import { parseImprovedCard } from "../../src/parse/card.js";
import { improveCard } from "../../src/ask.js";

const CARD = {
  term: "brazos",
  termLanguage: "es",
  meaning: "Arme",
  meaningLanguage: "de",
  note: "",
  context: { sentence: "Me cogió en brazos.", translation: "Er nahm mich auf den Arm." },
};

test("an improved card comes back as three fields", () => {
  const raw = "el brazo\nder Arm\n---\nMe cogió en brazos. (Er nahm mich auf den Arm.)\n\nbrazo de río (Flussarm)";
  assert.deepStrictEqual(parseImprovedCard(raw, CARD), {
    term: "el brazo",
    meaning: "der Arm",
    note: "Me cogió en brazos. (Er nahm mich auf den Arm.)\n\nbrazo de río (Flussarm)",
  });
});

test("the sentence from the text is put back where the answer dropped it", () => {
  const card = parseImprovedCard("el brazo\nder Arm\n---\nbrazo de río (Flussarm)", CARD);
  assert.ok(card.note.startsWith("Me cogió en brazos. (Er nahm mich auf den Arm.)\n\n"));
});

test("a sentence the answer tidied is the same sentence, and stands once as given", () => {
  const context = { sentence: "enumeró algunos puntos", translation: "sie zählte einige Punkte auf" };
  const raw = "enumerar\naufzählen\n---\nEnumeró algunos puntos (Sie zählte einige Punkte auf).\n\nGeläufig.\n\nEnumera tus argumentos. (Zähle deine Argumente auf.)";
  assert.strictEqual(parseImprovedCard(raw, { ...CARD, context }).note,
    "enumeró algunos puntos (sie zählte einige Punkte auf)\n\nGeläufig.\n\nEnumera tus argumentos. (Zähle deine Argumente auf.)");
});

test("a tidied sentence that came without a translation keeps the answer's", () => {
  const context = { sentence: "enumeró algunos puntos", translation: "" };
  const raw = "enumerar\naufzählen\n---\nGeläufig.\n\nEnumeró algunos puntos. (Sie zählte einige Punkte (mehrere) auf.)";
  assert.strictEqual(parseImprovedCard(raw, { ...CARD, context }).note,
    "enumeró algunos puntos (Sie zählte einige Punkte (mehrere) auf.)\n\nGeläufig.");
});

test("a further example that only starts like the sentence is left alone", () => {
  const context = { sentence: "enumeró algunos puntos", translation: "sie zählte einige Punkte auf" };
  const raw = "enumerar\naufzählen\n---\nEnumeró algunos puntos importantes. (Sie zählte einige wichtige Punkte auf.)";
  assert.strictEqual(parseImprovedCard(raw, { ...CARD, context }).note,
    "enumeró algunos puntos (sie zählte einige Punkte auf)\n\nEnumeró algunos puntos importantes. (Sie zählte einige wichtige Punkte auf.)");
});

test("labels, brackets and fences around the fields are read through", () => {
  const card = parseImprovedCard("```\nField 1: <el brazo>\nField 2: <der Arm>\n---\nbrazo de río (Flussarm)\n```", { ...CARD, context: null });
  assert.strictEqual(card.term, "el brazo");
  assert.strictEqual(card.meaning, "der Arm");
  assert.strictEqual(card.note, "brazo de río (Flussarm)");
});

test("an answer in another shape changes nothing", () => {
  assert.strictEqual(parseImprovedCard("el brazo — der Arm", CARD), null);
  assert.strictEqual(parseImprovedCard("el brazo\n---\nnote", CARD), null);
  assert.strictEqual(parseImprovedCard("el brazo\nder Arm\n---\n", CARD), null);
});

test("the prompt names the languages from the packs, and articles are asked only where a pack has them", async () => {
  let asked;
  const llm = { async chat(question) { return /headword/.test(question.system) ? question.user : "el brazo\nder Arm\n---\nbrazo de río (Flussarm)"; } };
  const questions = [];
  const recording = { async chat(question) { questions.push(question); return llm.chat(question); } };
  await improveCard(recording, CARD, { level: "A2" });
  assert.match(questions[0].system, /learning Spanish at level A2/);
  assert.match(questions[0].user, /Sentence from the text \(Spanish\): Me cogió en brazos\./);
  assert.match(questions[0].system, /Nowhere in field 3 say how the word is conjugated or declined/);
  assert.match(questions[0].system, /Never its article or its gender - the card adds the article itself\./);
  /* The card names a person's both forms, so the explanation must not (run 56). */
  assert.match(questions[0].system, /explain the word alike for both sexes/);
  /* The articles are a question of their own, asked of each side after. */
  assert.ok(questions.some((q) => /headword of a Spanish dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /headword of a German dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /lists that noun in a masculine and a feminine form/.test(q.system)));

  questions.length = 0;
  await improveCard(recording, { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: null }, { level: "C1" });
  asked = questions[0];
  assert.strictEqual(questions.length, 1, "Russian and English name no articles");
  assert.match(asked.system, /Never its article\./, "a gender the card does not show may be said");
  assert.doesNotMatch(asked.system, /both sexes/, "nor are both forms added where no pack names articles");
  assert.match(asked.user, /There is no sentence from a text\./);
  assert.doesNotMatch(asked.system, /copied word for word/);
});

test("a translation on a line of its own joins its example", () => {
  const card = parseImprovedCard("swing by\nvorbeischauen\n---\nI'll swing by later.\n(Ich schaue später vorbei.)", { context: null });
  assert.strictEqual(card.note, "I'll swing by later. (Ich schaue später vorbei.)");
});

test("an answer without its hyphens still reads as two words and an explanation", () => {
  const card = parseImprovedCard("caerse la baba\nhin und weg sein\nSe le cae la baba. [Er ist hin und weg.]\n\nUmgangssprachlich.", { context: null });
  assert.strictEqual(card.term, "caerse la baba");
  assert.strictEqual(card.meaning, "hin und weg sein");
  assert.strictEqual(card.note, "Se le cae la baba. (Er ist hin und weg.)\n\nUmgangssprachlich.");
  assert.strictEqual(parseImprovedCard("caerse la baba\nhin und weg sein", { context: null }), null);
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

test("two senses stand one under the other, and every item of the explanation apart", () => {
  const raw = "correr\nrennen; laufen\n---\nMe cogió en brazos. (Er nahm mich auf den Arm.)\nCorre mucho. (Er rennt viel.)\nCorrió a casa. (Er lief nach Hause.)";
  const card = parseImprovedCard(raw, CARD);
  assert.strictEqual(card.meaning, "rennen;\nlaufen");
  assert.strictEqual(card.note,
    "Me cogió en brazos. (Er nahm mich auf den Arm.)\n\nCorre mucho. (Er rennt viel.)\n\nCorrió a casa. (Er lief nach Hause.)");
});

test("a sentence without its translation is kept, and the model asked to translate it", async () => {
  const questions = [];
  const bare = { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: { sentence: "Me cogió en brazos.", translation: "" } };
  const llm = { async chat(question) { questions.push(question); return "брат\nbrother\n---\nOther line."; } };
  const card = await improveCard(llm, bare, { level: "B1" });
  assert.match(questions[0].system, /copied word for word as given, followed by its English translation/);
  assert.doesNotMatch(questions[0].user, /Its English translation/);
  assert.strictEqual(card.note, "Me cogió en brazos.\n\nOther line.", "put back as it stands where the answer dropped it");

  questions.length = 0;
  await improveCard(llm, { ...bare, context: CARD.context }, { level: "B1" });
  assert.match(questions[0].system, /followed by its given English translation/);
});

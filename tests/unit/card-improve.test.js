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
  let asked = null;
  const llm = { async chat(question) { return /headword/.test(question.system) ? question.user : "el brazo\nder Arm\n---\nbrazo de río (Flussarm)"; } };
  const questions = [];
  const recording = { async chat(question) { questions.push(question); return llm.chat(question); } };
  await improveCard(recording, CARD, { level: "A2" });
  assert.match(questions[0].system, /learning Spanish at level A2/);
  assert.match(questions[0].user, /Sentence from the text \(Spanish\): Me cogió en brazos\./);
  /* The articles are a question of their own, asked of each side after. */
  assert.ok(questions.some((q) => /headword of a Spanish dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /headword of a German dictionary/.test(q.system)));

  questions.length = 0;
  await improveCard(recording, { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: null }, { level: "C1" });
  asked = questions[0];
  assert.strictEqual(questions.length, 1, "Russian and English name no articles");
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

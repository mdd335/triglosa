import test from "node:test";
import assert from "node:assert";
import { parseCardExplanation, parseCardNotes, parseImprovedCard, parseNoteVerdicts } from "../../src/parse/card.js";
import { improveCard } from "../../src/ask.js";

const CARD = {
  term: "brazos",
  termLanguage: "es",
  meaning: "Arme",
  meaningLanguage: "de",
  note: "",
  context: { sentence: "Me cogió en brazos.", translation: "Er nahm mich auf den Arm." },
};

/* The check of the notes, answering every note true and new. */
const approving = (question) => question.user.split("\n").filter((line) => /^\d+\. /.test(line))
  .map((_, index) => `${index + 1}. TRUE NEW`).join("\n");

/* A model standing in for both questions: the word and its meaning, and the
   explanation asked apart. */
const answering = (card, explanation, record = []) => ({
  async chat(question) {
    record.push(question);
    if (/check the notes/.test(question.system)) return approving(question);
    if (/headword/.test(question.system)) return question.user;
    if (/write the notes/.test(question.system)) return explanation;
    return card;
  },
});

test("an improved card comes back as the word, its meaning and the sentence", () => {
  assert.deepStrictEqual(parseImprovedCard("el brazo\nder Arm", CARD), {
    term: "el brazo",
    meaning: "der Arm",
    sentence: "Me cogió en brazos. (Er nahm mich auf den Arm.)",
    own: [],
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
  const explaining = questions.find((q) => /write the notes/.test(q.system));
  assert.match(first.user, /Sentence from the text \(Spanish\): Me cogió en brazos\./);
  assert.doesNotMatch(first.system, /FIELD 3/, "a sentence with its translation needs nothing written");
  assert.strictEqual(explaining.user, "Word (Spanish): el brazo\nMeaning (German): der Arm", "with the articles the headword question gave");
  /* The level shapes the examples, unnamed: a model told it wrote it into a note. */
  assert.doesNotMatch(explaining.system, /A2/);
  assert.match(explaining.system, /very short and simple/);
  assert.match(explaining.system, /^Nowhere say how the word is conjugated or declined/m);
  assert.match(explaining.system, /Never its article or its gender - the card adds the article itself\./);
  /* Both forms are named only where the card shows them: said of a candle,
     the model explained why it had none. */
  assert.doesNotMatch(explaining.system, /both forms/);
});

test("articles are asked only where a pack has them", async () => {
  const questions = [];
  await improveCard(answering("el brazo\nder Arm", "Geläufig.", questions), CARD, { level: "A2" });
  assert.ok(questions.some((q) => /headword of a Spanish dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /headword of a German dictionary/.test(q.system)));
  assert.ok(questions.some((q) => /lists that noun in a masculine and a feminine form/.test(q.system)));

  questions.length = 0;
  await improveCard(answering("брат\nbrother", "Common.", questions), { ...CARD, termLanguage: "ru", meaningLanguage: "en", context: null }, { level: "C1" });
  assert.strictEqual(questions.length, 3, "Russian and English name no articles: the card, its notes, their check");
  const explaining = questions.find((q) => /write the notes/.test(q.system));
  assert.match(explaining.system, /Never its article\./, "a gender the card does not show may be said");
  assert.match(questions[0].user, /There is no sentence from a text\./);
  assert.doesNotMatch(questions[0].system, /copied word for word/);
});

/* What the reader wrote into the explanation is theirs: kept, after the
   text's sentence, and a sentence in the language being learned translated
   as that one is. */
test("a line the reader wrote stays, and a sentence of theirs gets its translation", async () => {
  const questions = [];
  const blank = { ...CARD, term: "perder", meaning: "verlieren", context: null, given: "",
                  note: "Perdí las llaves.\nAchtung: auch verpassen\nPerdimos el tren. (Wir verpassten den Zug.)" };
  const model = answering("perder\nverlieren\n---\nPerdí las llaves. (Ich habe die Schlüssel verloren.)", "Geläufig.\n\nPerdí las llaves. (Ich verlor die Schlüssel.)", questions);
  const card = await improveCard(model, blank, { level: "B1" });
  assert.strictEqual(card.note, [
    "Perdí las llaves. (Ich habe die Schlüssel verloren.)",
    "Achtung: auch verpassen",
    "Perdimos el tren. (Wir verpassten den Zug.)",
    "Geläufig.",
  ].join("\n\n"), "in their order, then the model's, a repeat of theirs left out");
  assert.match(questions[0].system, /FIELD 3 - every line under "Lines the reader wrote"/);
  assert.match(questions[0].user, /Lines the reader wrote:\nPerdí las llaves\.\nAchtung: auch verpassen$/,
    "a line already translated is not asked about");
  assert.match(questions[0].user, /^Note on the card: Perdimos el tren\. \(Wir verpassten den Zug\.\)$/m,
    "the lines asked about are not said twice");
});

test("beside the text's sentence the reader's lines are the fourth field, after it on the card", async () => {
  const questions = [];
  const card = { ...CARD, context: { sentence: "Me cogió en brazos." }, given: "Me cogió en brazos.",
                 note: "Me cogió en brazos.\nTengo el brazo roto." };
  const model = answering("el brazo\nder Arm\n---\nMe cogió en brazos. (Er nahm mich auf den Arm.)\nTengo el brazo roto. (Mein Arm ist gebrochen.)", "Geläufig.", questions);
  const improved = await improveCard(model, card, { level: "A2" });
  assert.strictEqual(improved.note, "Me cogió en brazos. (Er nahm mich auf den Arm.)\n\nTengo el brazo roto. (Mein Arm ist gebrochen.)\n\nGeläufig.");
  assert.match(questions[0].system, /FIELD 3 - the sentence from the text/);
  assert.match(questions[0].system, /FIELD 4 - every line/);
  assert.match(questions[0].system, /---\n<field 3>\n<field 4, one line each>/);
});

test("a line the answer left untranslated stays as written, and a card the app wrote alone asks as before", async () => {
  const questions = [];
  const card = { ...CARD, context: null, given: "", note: "Ojo con el brazo." };
  const improved = await improveCard(answering("el brazo\nder Arm", "Geläufig.", questions), card, { level: "A2" });
  assert.strictEqual(improved.note, "Ojo con el brazo.\n\nGeläufig.");
  const before = [];
  await improveCard(answering("el brazo\nder Arm", "Geläufig.", before), { ...CARD, note: "Eine Notiz." }, { level: "A2" });
  assert.doesNotMatch(before[0].system, /Lines the reader wrote/, "nothing of the reader's: the question as it was");
  assert.match(before[0].user, /Note on the card: Eine Notiz\./);
});

test("several meanings one under the other are one line in the question", async () => {
  const questions = [];
  await improveCard(answering("aparcar\nparken", "Geläufig.", questions),
    { ...CARD, term: "aparcar", meaning: "parken;\nabstellen;\neinparken", context: null }, { level: "A2" });
  assert.match(questions[0].user, /^Field 2 \(German\): parken; abstellen; einparken$/m);
});

test("an explanation that failed leaves the sentence, and a card without either keeps its note", async () => {
  const failing = { async chat(question) {
    if (/check the notes/.test(question.system)) return approving(question);
    if (/write the notes/.test(question.system)) throw new Error("down");
    return /headword/.test(question.system) ? question.user : "el brazo\nder Arm";
  } };
  assert.strictEqual((await improveCard(failing, CARD, { level: "B1" })).note, "Me cogió en brazos. (Er nahm mich auf den Arm.)");
  assert.strictEqual((await improveCard(failing, { ...CARD, note: "Mine.", context: null }, { level: "B1" })).note, "Mine.");
});

test("an explanation that failed or came back empty is asked once more", async () => {
  for (const first of [() => { throw new Error("down"); }, () => "  "]) {
    let asked = 0;
    const flaky = { async chat(question) {
    if (/check the notes/.test(question.system)) return approving(question);
      if (/write the notes/.test(question.system)) return ++asked === 1 ? first() : "Common.";
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
    if (/check the notes/.test(question.system)) return approving(question);
    if (/write the notes/.test(question.system)) {
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
  assert.match(questions.find((q) => /write the notes/.test(q.system)).user, /Meaning \(German\): rennen; laufen$/);
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
    if (/check the notes/.test(question.system)) return approving(question);
    if (/headword of a German/.test(question.system)) return question.user === "Ärztin" ? "der Arzt / die Ärztin" : question.user;
    if (/headword/.test(question.system)) return question.user;
    if (/write the notes/.test(question.system)) return "Common.";
    return "Ärztin\ndoctor";
  } };
  const card = await improveCard(llm, { ...CARD, termLanguage: "de", meaningLanguage: "en", context: null }, { level: "B1" });
  assert.strictEqual(card.term, "der Arzt / die Ärztin");
  const explaining = questions.find((q) => /write the notes/.test(q.system));
  assert.match(explaining.user, /^Word \(German\): der Arzt \/ die Ärztin$/m);
  /* The card names a person's both forms, so the notes must not (run 56). */
  assert.match(explaining.system, /explain the word alike for both, never say which sex one form names/);
});

test("the notes and the examples are read apart, by their headings or by their shape", () => {
  assert.deepStrictEqual(parseCardNotes("NOTES:\nIn Mexiko sagt man eher carro.\n- Umgangssprachlich.\nEXAMPLES:\nVoy en coche. (Ich fahre mit dem Auto.)\nEs mi coche."),
    { notes: ["In Mexiko sagt man eher carro.", "Umgangssprachlich."], examples: ["Voy en coche. (Ich fahre mit dem Auto.)", "Es mi coche."] });
  assert.deepStrictEqual(parseCardNotes("NOTES: NONE\nEXAMPLES:\nVoy en coche.\n(Ich fahre mit dem Auto.)"),
    { notes: [], examples: ["Voy en coche. (Ich fahre mit dem Auto.)"] }, "a translation on its own line belongs to its example");
  assert.deepStrictEqual(parseCardNotes("Oft mit de.\n\nVoy en coche. (Ich fahre mit dem Auto.)"),
    { notes: ["Oft mit de."], examples: ["Voy en coche. (Ich fahre mit dem Auto.)"] }, "without headings, by shape");
});

test("a note is kept only where the check says true and new", () => {
  assert.deepStrictEqual(parseNoteVerdicts("1. FALSE NEW\n2. TRUE NEW\n3 TRUE OBVIOUS", 4), [false, true, false, false]);
  assert.deepStrictEqual(parseNoteVerdicts("**1** - TRUE, NEW", 1), [true]);
  assert.deepStrictEqual(parseNoteVerdicts("Looks fine.", 2), [false, false]);
});

test("the notes the check let through stand as one paragraph over the examples", async () => {
  const questions = [];
  const llm = { async chat(question) {
    questions.push(question);
    if (/check the notes/.test(question.system)) return "1. FALSE NEW\n2. TRUE NEW\n3. TRUE NEW";
    if (/write the notes/.test(question.system)) return "NOTES:\nIn Südamerika heißt es Segel.\nOft in encender una vela.\nVerwandt mit velar.\nEXAMPLES:\nApaga la vela. (Lösch die Kerze.)";
    return /headword/.test(question.system) ? question.user : "la vela\ndie Kerze";
  } };
  const card = await improveCard(llm, { ...CARD, context: null }, { level: "B1" });
  assert.strictEqual(card.note, "Oft in encender una vela. Verwandt mit velar.\n\nApaga la vela. (Lösch die Kerze.)");
  assert.match(questions.at(-1).user, /^Notes:\n1\. In Südamerika heißt es Segel\.\n2\. Oft in encender una vela\.\n3\. Verwandt mit velar\.$/m);
});

test("unchecked notes are not kept, and without notes nothing is checked", async () => {
  const failing = { async chat(question) {
    if (/check the notes/.test(question.system)) throw new Error("down");
    if (/write the notes/.test(question.system)) return "NOTES:\nOft in encender una vela.\nEXAMPLES:\nApaga la vela. (Lösch die Kerze.)";
    return /headword/.test(question.system) ? question.user : "la vela\ndie Kerze";
  } };
  assert.strictEqual((await improveCard(failing, { ...CARD, context: null }, { level: "B1" })).note, "Apaga la vela. (Lösch die Kerze.)");
  const questions = [];
  const plain = { async chat(question) {
    questions.push(question);
    if (/write the notes/.test(question.system)) return "NOTES:\nNONE\nEXAMPLES:\nApaga la vela. (Lösch die Kerze.)";
    return /headword/.test(question.system) ? question.user : "la vela\ndie Kerze";
  } };
  await improveCard(plain, { ...CARD, context: null }, { level: "B1" });
  assert.ok(!questions.some((q) => /check the notes/.test(q.system)));
});

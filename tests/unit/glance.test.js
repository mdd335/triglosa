import test from "node:test";
import assert from "node:assert";
import { parseGlance } from "../../src/parse/glance.js";
import { glanceAt, glancePairs, placeUnits, unitsOver } from "../../src/glance.js";

const shown = (sentence, units) => units.map((unit) => `${sentence.slice(unit.start, unit.end)} → ${unit.gloss}`);

test("an article goes with its noun, a conjunction stands alone, a repeated word finds its own place", () => {
  const sentence = "El perro y el gato";
  const translation = "Der Hund und die Katze";
  const units = parseGlance("El | Der\nperro | Hund\ny | und\nel | die\ngato | Katze", sentence, translation, ["es", "de"]);
  assert.deepStrictEqual(shown(sentence, units), ["El perro → Der Hund", "y → und", "el gato → die Katze"]);
  assert.strictEqual(units[2].start, sentence.lastIndexOf("el"));
});

test("words that became one word of the translation are one unit", () => {
  const sentence = "El motor económico del país";
  const translation = "Der Wirtschaftsmotor des Landes";
  const units = parseGlance("El | Der\nmotor | Motor\neconómico | Wirtschafts\ndel | des\npaís | Landes",
    sentence, translation, ["es", "de"]);
  assert.deepStrictEqual(shown(sentence, units), ["El motor económico → Der Wirtschaftsmotor", "del país → des Landes"]);
});

test("a split stretch is found in its parts, with or without the ellipsis asked for", () => {
  const sentence = "Il governo ha approvato il decreto";
  const translation = "Die Regierung hat das Dekret gebilligt";
  const dotted = parseGlance("Il governo | Die Regierung\nha approvato | hat ... gebilligt\nil decreto | das Dekret",
    sentence, translation, ["it", "de"]);
  const plain = parseGlance("Il governo | Die Regierung\nha approvato | hat gebilligt\nil decreto | das Dekret",
    sentence, translation, ["it", "de"]);
  assert.strictEqual(dotted[1].gloss, "hat … gebilligt");
  assert.strictEqual(plain[1].gloss, "hat … gebilligt");
  assert.strictEqual(plain[1].to.length, 2);
});

test("a piece of a compound stands for the whole word it is in", () => {
  /* The cloud model answers "rate | Zins" where the translation says
     Zinserhöhungen, and "bank | bank" for Zentralbank. */
  const sentence = "The central bank delayed rate hikes";
  const translation = "Die Zentralbank verschob Zinserhöhungen";
  const units = parseGlance("The | Die\ncentral | Zentral\nbank | bank\ndelayed | verschob\nrate | Zins\nhikes | erhöhungen",
    sentence, translation, ["en", "de"]);
  assert.deepStrictEqual(shown(sentence, units),
    ["The central bank → Die Zentralbank", "delayed → verschob", "rate hikes → Zinserhöhungen"]);
});

test("a function word the translation leaves out goes with the word after it", () => {
  const sentence = "Le locataire est tenu de payer";
  const translation = "Der Mieter muss zahlen";
  const units = parseGlance("Le | Der\nlocataire | Mieter\nest tenu | muss\nde | -\npayer | zahlen", sentence, translation, ["fr", "de"]);
  assert.deepStrictEqual(shown(sentence, units), ["Le locataire → Der Mieter", "est tenu → muss", "de payer → zahlen"]);
});

test("an answer that lost its place is not read at all", () => {
  const sentence = "Depois de muito vaivém a empresa desistiu";
  const translation = "Nach langem Hin und Her gab das Unternehmen auf";
  /* Laid side by side word for word: the translation had words left over,
     and the model wrote them against a hyphen. */
  assert.strictEqual(parseGlance("Depois | Nach\nde | langem\nmuito | Hin\nvaivém | und\na | Her\nempresa | gab\ndesistiu | das\n- | Unternehmen",
    sentence, translation, ["pt", "de"]), null);
  /* The translation ran out before the sentence did. */
  assert.strictEqual(parseGlance("Depois de | Nach langem Hin und Her\nmuito vaivém | gab\na empresa | das Unternehmen auf\ndesistiu |",
    sentence, translation, ["pt", "de"]), null);
  /* Units that are not in the sentence. */
  assert.strictEqual(parseGlance("The company | Das Unternehmen\ngave up | gab auf", sentence, translation, ["pt", "de"]), null);
});

test("a word written onto the next one, the way Arabic writes its conjunction, still finds its place", () => {
  const sentence = "ولا يحق للغير";
  const translation = "und Dritte dürfen nicht";
  const units = parseGlance("و | und\nلا | nicht\nيحق | dürfen\nلغير | Dritte", sentence, translation, ["ar", "de"]);
  assert.ok(units);
  assert.deepStrictEqual(shown(sentence, units), ["ولا → nicht", "يحق → dürfen", "للغير → Dritte"]);
});

test("a model's decoration around a line is read through", () => {
  const sentence = "Rain check?";
  const translation = "Verschieben wir's?";
  const units = parseGlance("1. Rain check | Verschieben wir's\n", sentence, translation, ["en", "de"]);
  assert.deepStrictEqual(shown(sentence, units), ["Rain check → Verschieben wir's"]);
  const table = parseGlance("| Rain check | Verschieben wir's |", sentence, translation, ["en", "de"]);
  assert.deepStrictEqual(shown(sentence, table), ["Rain check → Verschieben wir's"]);
});

test("sentences are paired by place, and only where both texts have as many", () => {
  const pairs = glancePairs("Uno. Dos.", "Eins. Zwei.");
  assert.deepStrictEqual(pairs, [
    { start: 0, end: 4, to: { start: 0, end: 5 } },
    { start: 5, end: 9, to: { start: 6, end: 11 } },
  ]);
  assert.deepStrictEqual(glancePairs("Uno. Dos.", "Eins und zwei."),
    [{ start: 0, end: 9, to: { start: 0, end: 14 } }]);
});

test("what stands under a position, on either side", () => {
  const text = "Uno. Dos tres.";
  const translation = "Eins. Zwei drei.";
  const [first, second] = glancePairs(text, translation);
  const glance = {
    panel: 1,
    sentences: [
      { ...first, status: "waiting", units: null },
      { ...second, status: "done",
        units: placeUnits(second, parseGlance("Dos | Zwei\ntres | drei", "Dos tres.", "Zwei drei.", ["es", "de"])) },
    ],
  };
  assert.deepStrictEqual(glanceAt(glance, "source", 1), { pending: true });
  assert.strictEqual(glanceAt(glance, "source", text.indexOf("tres")).gloss, "drei");
  assert.strictEqual(glanceAt(glance, "target", translation.indexOf("Zwei")).gloss, "Zwei");
  assert.strictEqual(glanceAt(glance, "source", text.length + 3), null);
  assert.deepStrictEqual(glanceAt({ pending: true, sentences: undefined }, "source", 0), { pending: true });
  assert.strictEqual(glanceAt(null, "source", 0), null);
  assert.deepStrictEqual(unitsOver(glance, text.indexOf("Dos"), text.indexOf("tres") + 1).map((unit) => unit.gloss),
    ["Zwei", "drei"]);
});

test("every pack names its conjunctions", async () => {
  const { SUPPORTED, wordSet } = await import("../../src/languages/index.js");
  for (const code of SUPPORTED) assert.ok(wordSet(code, "conjunctions").size >= 8, code);
});

test("a conjunction in another language is kept apart the same way", () => {
  const sentence = "and the dog";
  const translation = "und der Hund";
  const units = parseGlance("and | und\nthe | der\ndog | Hund", sentence, translation, ["en", "de"]);
  assert.deepStrictEqual(shown(sentence, units), ["and → und", "the dog → der Hund"]);
});

test("an article finds its noun across the words a translation puts between them", () => {
  const sentence = "Compró el coche rojo de su vecino";
  const translation = "Er kaufte das rote Auto seines Nachbarn";
  const units = parseGlance("Compró | kaufte\nel | das\ncoche | Auto\nrojo | rote\nde | -\nsu | seines\nvecino | Nachbarn",
    sentence, translation, ["es", "de"]);
  assert.deepStrictEqual(shown(sentence, units),
    ["Compró → kaufte", "el coche → das … Auto", "rojo → rote", "de → ", "su vecino → seines Nachbarn"]);
  /* Not a word the article's rendering came after. */
  const behind = parseGlance("el | das\ncoche | Auto", "el coche", "Auto das", ["es", "de"]);
  assert.deepStrictEqual(shown("el coche", behind), ["el → das", "coche → Auto"]);
});

test("three panels are one question, one grouping, and each column its own places", async () => {
  const { parseGlanceWide } = await import("../../src/parse/glance.js");
  const sentence = "El gobierno aprobó la ley";
  const german = "Die Regierung billigte das Gesetz";
  const english = "The government approved the law";
  const units = parseGlanceWide(
    "El | Die | The\ngobierno | Regierung | government\naprobó | billigte | approved\nla | das | the\nley | Gesetz | law",
    sentence, german, english, ["es", "de", "en"]);
  assert.deepStrictEqual(units.map((unit) => sentence.slice(unit.start, unit.end)),
    ["El gobierno", "aprobó", "la ley"], "the grouping is the reader's column's, for both");
  assert.deepStrictEqual(units.map((unit) => unit.gloss), ["Die Regierung", "billigte", "das Gesetz"]);
  assert.deepStrictEqual(units.map((unit) => unit.second.gloss), ["The government", "approved", "the law"]);
});

test("a second column that came to nothing costs the reader's column nothing", async () => {
  const { parseGlanceWide } = await import("../../src/parse/glance.js");
  const sentence = "El gobierno aprobó la ley";
  const german = "Die Regierung billigte das Gesetz";
  const units = parseGlanceWide(
    "El | Die | -\ngobierno | Regierung | -\naprobó | billigte | -\nla | das | -\nley | Gesetz | -",
    sentence, german, "The government approved the law", ["es", "de", "en"]);
  assert.deepStrictEqual(units.map((unit) => unit.gloss), ["Die Regierung", "billigte", "das Gesetz"]);
  assert.ok(units.every((unit) => unit.second === null));
});

import { test } from "node:test";
import assert from "node:assert";
import { readTranslation } from "../../src/parse/translation.js";

const SPANISH = "Para promocionarlo, en marzo de 1976 se lanzó «The Ripper» como sencillo en el Reino Unido";
const GERMAN = "Zur Förderung erschien im März 1976 „The Ripper“ als Single im Vereinigten Königreich.";

test("a remark above a rule of dashes is not the translation", () => {
  const answer = [
    "I'll translate the Spanish text into German, preserving the formatting and meaning.",
    "",
    "---",
    "",
    GERMAN,
  ].join("\n");
  assert.strictEqual(readTranslation(answer, SPANISH), GERMAN);
});

test("a rule the original carries itself stays", () => {
  const source = "Erster Teil\n\n---\n\nZweiter Teil";
  const answer = "First part\n\n---\n\nSecond part";
  assert.strictEqual(readTranslation(answer, source), answer);
});

test("a rule with the translation above it stays", () => {
  const answer = `${GERMAN}\n\n---\n\nHope this helps.`;
  assert.strictEqual(readTranslation(answer, SPANISH), answer);
});

test("an announcing line is taken off, an opening line of the text is not", () => {
  assert.strictEqual(readTranslation(`Here is the German translation:\n\n${GERMAN}`, SPANISH), GERMAN);
  const listed = "Zutaten:\n\nMehl, Zucker";
  assert.strictEqual(readTranslation(listed, "Ingredientes:\n\nHarina, azúcar"), listed);
  /* Longer than what follows it: that is the translation, not an announcement. */
  assert.strictEqual(readTranslation(`${GERMAN}:\n\nJa.`, SPANISH), `${GERMAN}:\n\nJa.`);
});

test("a fenced answer is unwrapped, a fence the original has is kept", () => {
  assert.strictEqual(readTranslation("```\n" + GERMAN + "\n```", SPANISH), GERMAN);
  assert.strictEqual(readTranslation("```text\n" + GERMAN + "\n```", SPANISH), GERMAN);
  const fenced = "```\ncódigo\n```";
  assert.strictEqual(readTranslation(fenced, fenced), fenced);
});

test("an ordinary translation comes back untouched", () => {
  assert.strictEqual(readTranslation(GERMAN, SPANISH), GERMAN);
  assert.strictEqual(readTranslation("Erste Zeile\nZweite Zeile", "Primera\nSegunda"), "Erste Zeile\nZweite Zeile");
  assert.strictEqual(readTranslation("", SPANISH), "");
  assert.strictEqual(readTranslation(null), "");
});

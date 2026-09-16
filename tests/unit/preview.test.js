import test from "node:test";
import assert from "node:assert";
import { PREVIEW_WORDS, preview } from "../../src/ui/preview.js";

test("the preview cuts to the set number of words", () => {
  const t = "Sie wurde in der Sklaverei im Dorchester County, Maryland, geboren.";
  const r = preview(t);
  assert.strictEqual(r, "Sie wurde in der Sklaverei im …");
  assert.strictEqual(r.split(" ").length, PREVIEW_WORDS + 1, "six words plus the ellipsis");
});

test("a short text gets no ellipsis", () => {
  assert.strictEqual(preview("Kurz und gut."), "Kurz und gut.");
  assert.strictEqual(preview("Genau sechs Woerter stehen hier drin"), "Genau sechs Woerter stehen hier drin");
});

test("breaks and doubled spaces fall away", () => {
  assert.strictEqual(preview("Erster Absatz.\n\nZweiter  Absatz."), "Erster Absatz. Zweiter Absatz.");
});

test("empty text gives an empty preview", () => {
  assert.strictEqual(preview(""), "");
  assert.strictEqual(preview(null), "");
  assert.strictEqual(preview("   \n  "), "");
});

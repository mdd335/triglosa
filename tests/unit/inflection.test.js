/* The two faults phase 6's measurement found that no model and no prompt
   fixes, because they are about finding a form's place in the text rather
   than about knowing the language.

   Both cost a correct answer: the app needs the exact spot to highlight, so
   an item it cannot place is dropped even when the model named it right. */

import test from "node:test";
import assert from "node:assert";
import { formInText, longestRunInText, rangesOf } from "../../src/match/positions.js";

/* ---- Inflection: the model answers the dictionary form ---- */

test("a Russian item is found under a different case ending", () => {
  /* Measured: the model answers ходатайство, the text says ходатайства, and
     the filter dropped a correct item. What comes back is the text's
     spelling, because that is what has to be highlighted. */
  const t = "Суд отказал в удовлетворении ходатайства истца.";
  assert.strictEqual(longestRunInText(t, "ходатайство", ["ru"]), "ходатайства");
});

test("the exact form still wins over the inflected one", () => {
  const t = "Здесь стоит ходатайство и ходатайства рядом.";
  assert.strictEqual(longestRunInText(t, "ходатайство", ["ru"]), "ходатайство");
});

test("a shared stem is not enough on its own", () => {
  /* ход- is three letters of a long word: matching there would colour a
     different word entirely. No highlight beats the wrong one. */
  const t = "Он ходит по коридору.";
  assert.strictEqual(longestRunInText(t, "ходатайство", ["ru"]), "");
  /* Different words that happen to start alike stay apart. */
  assert.strictEqual(longestRunInText("Er trat ein.", "tragen", ["de"]), "");
  assert.strictEqual(longestRunInText("Das ist seine Sache.", "sein", ["de"]), "");
});

test("a German plural and a French conjugation are found", () => {
  assert.strictEqual(longestRunInText("Mehrere Vorbehalten blieben.", "Vorbehalte", ["de"]), "Vorbehalten");
  assert.strictEqual(longestRunInText("Il récupère la caution.", "récupérer", ["fr"]), "récupère");
});

test("a part standing there verbatim still beats an inflected whole", () => {
  /* The exact stage runs to the end before the inflected one starts, so
     "Nebenkosten" is the answer rather than "offenen Nebenkosten". One spot
     is all the highlighting needs, and the exact one is the safer. */
  const t = "Wir haben die offenen Nebenkosten geprüft.";
  assert.strictEqual(longestRunInText(t, "offene Nebenkosten", ["de"]), "Nebenkosten");
});

test("a multi-word item inflected throughout is found whole", () => {
  /* From the corpus: the model answers the nominative, the text carries the
     genitive, and neither word stands there verbatim. */
  const t = "Плата за содержание общедомовых нужд выросла.";
  assert.strictEqual(longestRunInText(t, "общедомовые нужды", ["ru"]), "общедомовых нужд");
});

/* ---- Separable verbs: the form is right and not contiguous ---- */

test("a German separable verb becomes a multipart form", () => {
  /* winkte ab is named correctly by every model and stands apart in the
     text. Written with a plus, the highlighting already knows what to do. */
  const t = "Der Nachbar winkte den Vorschlag ab.";
  assert.strictEqual(formInText(t, "winkte ab"), "winkte + ab");
  const r = rangesOf(t, "winkte + ab", "abwinken", ["de"]);
  assert.deepStrictEqual(r.map((x) => t.slice(x.start, x.end)), ["winkte", "ab"]);
});

test("an auxiliary far from its participle is one form too", () => {
  const t = "Die Nebenkosten hatte die Verwaltung anders umgelegt.";
  assert.strictEqual(formInText(t, "hatte umgelegt"), "hatte + umgelegt");
});

test("a contiguous form is returned unchanged", () => {
  assert.strictEqual(formInText("Er hat den Vorschlag abgewinkt.", "hat"), "hat");
  assert.strictEqual(formInText("Se trata de eso.", "Se trata"), "Se trata");
  assert.strictEqual(formInText("Ha llegado agosto.", "Ha llegado"), "Ha llegado");
});

test("the parts must stand in the order the form has them", () => {
  /* ab before winkte is a different sentence, not this verb. */
  const t = "Ab morgen winkte niemand mehr.";
  assert.strictEqual(formInText(t, "winkte ab"), "");
});

test("the parts must stay inside one sentence", () => {
  const t = "Er winkte kurz. Ab und zu kommt das vor.";
  assert.strictEqual(formInText(t, "winkte ab"), "");
});

test("a form invented by the model is still refused", () => {
  assert.strictEqual(formInText("Der Nachbar kam vorbei.", "winkte ab"), "");
  assert.strictEqual(formInText("Der Nachbar kam vorbei.", "lachte"), "");
});

/* ---- Two letters: too short to find, unless an abbreviation ---- */

test("a two-letter abbreviation is found, and only with its case", () => {
  /* Measured: the cloud model named ML first in a German text about machine
     learning, and the item was dropped for being shorter than three letters. */
  const t = "In den 2000er Jahren wurde ML zunehmend bekannt.";
  assert.strictEqual(longestRunInText(t, "ML", ["de"]), "ML");
  assert.strictEqual(longestRunInText("Man nehme 5 ml Wasser.", "ML", ["de"]), "");
  assert.strictEqual(longestRunInText("Die EU-Kommission tagte.", "EU", ["de"]), "EU");
  assert.strictEqual(longestRunInText("Er ist da.", "da", ["de"]), "");
});

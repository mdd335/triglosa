import test from "node:test";
import assert from "node:assert";
import { orderByTextPosition } from "../../src/text.js";

test("the list follows the order of the text", () => {
  const text = "El modelo adquiere el rendimiento que experimentan los grandes.";
  assert.deepStrictEqual(orderByTextPosition(["experimentan", "adquiere", "rendimiento"], text, ""), [
    "adquiere",
    "rendimiento",
    "experimentan",
  ]);
});

test("the order can run over a field of the entry", () => {
  const text = "El rendimiento del cambio de fase discontinuo.";
  const list = [
    { text: "cambio de fase discontinuo", at: "cambio de fase discontinuo" },
    { text: "rendimiento", at: "rendimiento" },
  ];
  assert.deepStrictEqual(
    orderByTextPosition(list, text, "at").map((e) => e.text),
    ["rendimiento", "cambio de fase discontinuo"],
  );
});

test("capitalisation in the text does not change the order", () => {
  const text = "Hay un truco: colocar una camisa.";
  assert.deepStrictEqual(orderByTextPosition(["colocar", "Hay"], text, ""), ["Hay", "colocar"]);
});

test("what is not in the text stays at the back and keeps its order", () => {
  const text = "El modelo adquiere el rendimiento.";
  assert.deepStrictEqual(
    orderByTextPosition(["fantasma", "invented", "rendimiento"], text, ""),
    ["rendimiento", "fantasma", "invented"],
  );
});

test("a match inside a word does not count", () => {
  /* "en" sits in "rendimiento" but is not a word of its own there —
     otherwise the entry would wrongly move to the front. */
  const text = "El rendimiento en el modelo.";
  assert.deepStrictEqual(orderByTextPosition(["en", "rendimiento"], text, ""), [
    "rendimiento",
    "en",
  ]);
});

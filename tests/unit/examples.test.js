import { test } from "node:test";
import assert from "node:assert";
import { MAX_EXAMPLES, roomForExample, withExamples } from "../../src/examples.js";

const one = (sentence) => ({ kind: "", sentence, translation: "" });

test("a longer explanation adds its examples to the ones already there", () => {
  const asked = [one("Satz A."), one("Satz B.")];
  const arriving = [one("Satz C.")];
  assert.deepStrictEqual(withExamples(asked, arriving).map((e) => e.sentence),
    ["Satz A.", "Satz B.", "Satz C."]);
});

test("the same sentence is not kept twice, in any script", () => {
  const kept = withExamples([one("Мы живём на даче.")], [one("Мы живём на даче!"), one("Она живёт там.")]);
  assert.deepStrictEqual(kept.map((e) => e.sentence), ["Мы живём на даче.", "Она живёт там."]);
});

test("four is the ceiling, whichever question brought them", () => {
  const kept = withExamples([1, 2, 3].map((n) => one(`Satz ${n}.`)), [one("Satz 4."), one("Satz 5.")]);
  assert.strictEqual(kept.length, MAX_EXAMPLES);
  assert.strictEqual(kept.at(-1).sentence, "Satz 4.");
  assert.ok(!roomForExample(kept));
  assert.ok(roomForExample(kept.slice(1)));
  assert.ok(roomForExample(undefined));
});

test("a kind already standing above is not written under the next sentence again", () => {
  const list = withExamples(
    [{ kind: "umgangssprachlich", sentence: "Hicimos noche en un pueblo." }],
    [{ kind: "Umgangssprachlich", sentence: "Hizo noche en casa." }, { kind: "übertragen", sentence: "La noche nos hizo." }],
  );
  assert.deepStrictEqual(list.map((one) => one.kind), ["umgangssprachlich", "", "übertragen"]);
  assert.strictEqual(list[1].sentence, "Hizo noche en casa.", "the sentence itself stays");
});

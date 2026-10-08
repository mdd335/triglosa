import { test } from "node:test";
import assert from "node:assert";

import { createIdentifier } from "../../src/platform/identifier.js";

test("the identifier sends a text as one line and hands back what the shell answered", async () => {
  const sent = [];
  const identifier = createIdentifier(async (command, payload) => {
    sent.push([command, payload]);
    return [["es", 0.98], ["pt", 0.01]];
  });
  assert.deepStrictEqual(await identifier.identify("  la casa\n\nde papel "), [["es", 0.98], ["pt", 0.01]]);
  assert.deepStrictEqual(sent, [["identify_language", { text: "la casa de papel" }]]);
  await identifier.identify("a".repeat(5000));
  assert.strictEqual(sent[1][1].text.length, 2000);
});

test("an identifier whose model is not there answers nothing", async () => {
  const identifier = createIdentifier(async () => { throw new Error("absent"); });
  assert.deepStrictEqual(await identifier.identify("la casa"), []);
  assert.deepStrictEqual(await createIdentifier(async () => null).identify("la casa"), []);
});

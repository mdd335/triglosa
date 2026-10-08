import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import { sentenceAround } from "../../src/sentence.js";

/* Text as programs really give it (fixtures/untidy.json): the measurement
   items are whole sentences written for the purpose, and a list's line or a
   label never stands among them. */
const { cases } = JSON.parse(fs.readFileSync(new URL("../fixtures/untidy.json", import.meta.url), "utf8"));

test("what goes along with a word looked up in untidy text", () => {
  for (const item of cases) {
    if (item.open) continue;
    const found = sentenceAround(item.around, item.word, item.around.indexOf(item.word));
    assert.strictEqual(found?.text ?? null, item.sentence, item.id);
  }
});

test("every untidy case is decided or says what is open about it", () => {
  for (const item of cases) {
    assert.ok(item.open ? typeof item.open === "string" && !("sentence" in item) : "sentence" in item, item.id);
  }
});

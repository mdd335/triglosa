import test from "node:test";
import assert from "node:assert";
import { dropOldest, keptReading, readingKey } from "../../src/history.js";

const settings = { languages: ["de", "en", "es"], levels: { es: "B1" },
  show: { verbs: "foreign", terms: "foreign" }, endpoint: "http://x", model: "m",
  hotkey: { code: "Control+Alt+KeyE" } };
const entry = (draft, state = { panels: [] }, s = settings) => ({ draft, key: readingKey(s), state });

test("the same text under the same settings is found again, the latest first", () => {
  const first = entry("Hola.");
  const second = entry("Hola.");
  assert.strictEqual(keptReading([first, entry("Adiós."), second], "Hola.", settings), second);
  assert.strictEqual(keptReading([first], "Adiós.", settings), null);
});

test("a reading still being worked out counts, one that failed does not", () => {
  const running = entry("Hola.", null);
  assert.strictEqual(keptReading([running], "Hola.", settings), running);
  assert.strictEqual(keptReading([entry("Hola.", { fault: { kind: "auth" } })], "Hola.", settings), null);
});

test("settings that shape a reading make it a different one, the shortcut does not", () => {
  const kept = [entry("Hola.")];
  assert.strictEqual(keptReading(kept, "Hola.", { ...settings, model: "other" }), null);
  assert.strictEqual(keptReading(kept, "Hola.", { ...settings, languages: ["de", "es"] }), null);
  /* Switched on afterwards, a reading made without the hover has nothing to
     show over its words: it is read again. */
  assert.strictEqual(keptReading(kept, "Hola.", { ...settings, glance: !settings.glance }), null);
  assert.strictEqual(keptReading(kept, "Hola.", { ...settings, hotkey: null }), kept[0]);
});

test("a reading translated by the other engine is not the same reading", () => {
  assert.notStrictEqual(
    readingKey({ ...settings, translator: "device" }),
    readingKey({ ...settings, translator: "model" }),
  );
});

test("the oldest readings go beyond what the settings keep, never the one on screen", () => {
  const made = (count) => Array.from({ length: count }, (_, index) => entry(`text ${index}`));
  let list = made(7);
  dropOldest(list, { kept: 5 });
  assert.deepStrictEqual(list.map((one) => one.draft), ["text 2", "text 3", "text 4", "text 5", "text 6"]);

  list = made(7);
  dropOldest(list, { kept: 10 });
  assert.strictEqual(list.length, 7);

  /* Stepped back to the oldest, and fewer are kept from now on. */
  list = made(7);
  const shown = list[0];
  dropOldest(list, { kept: 5 }, shown);
  assert.deepStrictEqual(list.map((one) => one.draft), ["text 0", "text 3", "text 4", "text 5", "text 6"]);

  /* None kept: the one on screen and nothing before it. */
  list = made(3);
  dropOldest(list, { kept: 0 }, list[2]);
  assert.deepStrictEqual(list.map((one) => one.draft), ["text 2"]);
  list = made(3);
  dropOldest(list, { kept: 0 }, list[0]);
  assert.deepStrictEqual(list.map((one) => one.draft), ["text 0"]);
});

import test from "node:test";
import assert from "node:assert";
import { keptReading, readingKey } from "../../src/history.js";

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

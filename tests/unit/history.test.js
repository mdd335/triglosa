import test from "node:test";
import assert from "node:assert";
import { dropOldest, keptReading, lastPlace, readingKey } from "../../src/history.js";

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

test("a reading made with other panels chosen in the window is not the same reading", () => {
  const choice = { swaps: { es: "fr" }, added: "" };
  const plain = entry("Hola.");
  assert.strictEqual(keptReading([plain], "Hola.", settings, "", choice), null);
  const chosen = { draft: "Hola.", key: readingKey(settings, choice), state: { panels: [] } };
  assert.strictEqual(keptReading([plain, chosen], "Hola.", settings, "", choice), chosen);
  assert.strictEqual(keptReading([plain, chosen], "Hola.", settings), plain);
});

test("the oldest readings go beyond what the settings keep, never the one on screen", () => {
  const made = (count) => Array.from({ length: count }, (_, index) => entry(`text ${index}`));
  let list = made(7);
  dropOldest(list, { kept: 5 });
  assert.deepStrictEqual(list.map((one) => one.draft), ["text 2", "text 3", "text 4", "text 5", "text 6"]);

  list = made(7);
  dropOldest(list, { kept: 10 });
  assert.strictEqual(list.length, 7);

  list = made(25);
  dropOldest(list, { kept: 20 });
  assert.deepStrictEqual([list.length, list[0].draft], [20, "text 5"]);

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

test("a page taken down hands its settled readings to the next, and the selection of one still running", async () => {
  const { handOver, takeOver } = await import("../../src/history.js");
  const done = entry("Hola.", { panels: [], status: { words: "", verbs: "" } });
  const running = entry("Adiós.", { panels: [], busy: true, status: { words: "working" } });
  const linking = entry("Buenas.", { panels: [], status: { words: "linking" } });
  const selection = { text: "Adiós.", route: "selection", source: 4 };

  const taken = takeOver(handOver([done, running, linking], 1, selection));
  assert.deepStrictEqual(taken.readings.map((one) => one.draft), ["Hola."]);
  assert.strictEqual(taken.place, 1, "the sheet past the kept ones, where the reading is read again");
  assert.deepStrictEqual(taken.pending, selection);

  const settledOne = takeOver(handOver([done, linking], 0, selection));
  assert.strictEqual(settledOne.place, 0);
  assert.strictEqual(settledOne.pending, null, "a settled reading on screen is not read again");
  assert.strictEqual(settledOne.readings[0].shown, undefined);
});

test("a page that did not answer leaves nothing to take over", async () => {
  const { takeOver } = await import("../../src/history.js");
  assert.deepStrictEqual(takeOver("{}"), { readings: [], place: 0, pending: null });
  assert.deepStrictEqual(takeOver("not json"), { readings: [], place: 0, pending: null });
});

test("a blank sheet written in and stepped back from is one step forward", () => {
  const kept = [entry("Hola."), entry("Adiós.")];
  assert.strictEqual(lastPlace(kept), 1);
  assert.strictEqual(lastPlace(kept, "  "), 1);
  assert.strictEqual(lastPlace(kept, "Buenas"), 2);
  assert.strictEqual(lastPlace([], "Buenas"), 0);
});

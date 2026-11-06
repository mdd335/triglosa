/* The phone's two sheets over the reading: the first steps, and the
   question whether texts may go to the AI model, asked once for each
   address before the first one goes. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true, url: "http://localhost/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.localStorage = dom.window.localStorage;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.TRIGLOSA_SYSTEM = "ios";

const { askModelConsent, openWelcomeSheet, offerPasteSetting, phoneWelcomeView } = await import("../../src/ui/phone-sheets.js");
const { INTERFACE_LANGUAGES, labels } = await import("../../src/ui/labels.js");
const { loadSettings, saveSettings } = await import("../../src/platform/store.js");
const { modelConsentFor, normalizeSettings } = await import("../../src/settings.js");

test("the phone's first steps show the example and say what the bar's button does", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const text = labels(code, "ios");
    const view = phoneWelcomeView(text, code);
    const steps = [...view.querySelectorAll(".welcome-steps li")];
    assert.strictEqual(steps.length, 6, code);
    assert.strictEqual(view.querySelectorAll("ol.welcome-steps li").length, 2, `${code}: languages and model, nothing more to set up`);
    assert.deepStrictEqual([...view.querySelectorAll(".label")].slice(0, 2).map((node) => node.textContent),
      [text.welcomePhone.setup, text.welcomePhone.start], `${code}: setting up first`);
    assert.ok(view.querySelector("ol li").textContent.includes(text.groupLanguages), `${code}: the languages' page`);
    assert.ok(steps[1].textContent.includes(text.groupModel), `${code}: the model's page`);
    const ways = [...view.querySelectorAll("ul.welcome-steps li")];
    assert.strictEqual(ways.length, 4, `${code}: the ways in, unnumbered`);
    assert.strictEqual(ways.at(-1).textContent, text.welcomePhone.control, `${code}: the Control Center last`);
    assert.doesNotMatch(ways.map((node) => node.textContent).join("\n"), /^(Oder|Or|O|Ou|Oppure|Или) /m, `${code}: each way stands alone`);
    assert.ok(view.querySelector("ul li").querySelector(".inline-icon svg"), `${code}: the paste button drawn in its sentence`);
    assert.ok(!view.textContent.includes(text.pasteHint), `${code}: not before iOS has asked at all`);
    assert.ok(view.querySelector(".welcome-example .words"), `${code}: the example`);
    assert.doesNotMatch(view.textContent, /⌘|Ctrl|menu bar|Menüleiste/, code);
  }
});

test("how iOS stops asking is offered in a sheet that opens the iPhone's settings or goes away", () => {
  const text = labels("de", "ios");
  offerPasteSetting(normalizeSettings({ languages: ["de", "en"] }));
  const sheet = document.querySelector(".phone-sheet");
  assert.ok(sheet.textContent.includes(text.pasteHint));
  assert.deepStrictEqual([...sheet.querySelectorAll(".phone-consent button")].map((node) => node.textContent),
    [text.pasteOpen, text.pasteLater]);
  [...sheet.querySelectorAll(".phone-consent button")].at(-1).click();
  assert.strictEqual(document.querySelector(".phone-sheet"), null);
});

test("closing the first steps on a phone is having seen them", async () => {
  await saveSettings(normalizeSettings({ languages: ["de", "en"] }));
  await openWelcomeSheet();
  const sheet = document.querySelector(".phone-sheet");
  assert.ok(sheet);
  sheet.querySelector(".settings-sheet-bar button").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(document.querySelector(".phone-sheet"), null);
  assert.strictEqual((await loadSettings()).welcome, false);
});

test("the answer about the model is kept with its address, and another address is asked again", async () => {
  const settings = await saveSettings(normalizeSettings({ languages: ["en", "es"], endpoint: "https://openrouter.ai/api/v1" }));
  assert.strictEqual(modelConsentFor(settings), null, "not asked yet");
  const asked = askModelConsent(settings);
  const sheet = document.querySelector(".phone-consent");
  assert.ok(sheet.textContent.includes("openrouter.ai"), "names where the texts go");
  assert.strictEqual(sheet.querySelector("h1"), null, "the title once, in the bar");
  sheet.querySelector(".phone-consent-allow").click();
  assert.strictEqual(await asked, true);
  const after = await loadSettings();
  assert.deepStrictEqual(after.modelConsent, { host: "openrouter.ai", allowed: true });
  assert.strictEqual(modelConsentFor(after), true);
  assert.strictEqual(modelConsentFor({ ...after, endpoint: "https://api.example.com/v1" }), null, "another address, asked again");
  const declined = askModelConsent(after);
  [...document.querySelectorAll(".phone-consent button")].at(-1).click();
  assert.strictEqual(await declined, false);
  assert.strictEqual(modelConsentFor(await loadSettings()), false);
});

test("an answer about the model given while the settings stand open is not undone by the next change there", async () => {
  /* A text handed over from another app reaches the model's question while
     the settings sheet lies over the reading; the sheet had read the settings
     before the answer was written. */
  const { openSettingsSheet } = await import("../../src/ui/settings-sheet.js");
  await saveSettings(normalizeSettings({ languages: ["en", "es"], endpoint: "https://openrouter.ai/api/v1", underline: true }));
  await openSettingsSheet("sections");
  const asked = askModelConsent(await loadSettings());
  document.querySelector(".phone-consent-allow").click();
  assert.strictEqual(await asked, true);
  await new Promise((resolve) => setTimeout(resolve, 20));

  const sheet = document.querySelector(".settings-sheet:not(.phone-sheet)");
  const toggle = [...sheet.querySelectorAll("input[role=switch]")]
    .find((node) => node.closest(".field")?.textContent.includes(labels("en", "ios").underline));
  assert.ok(toggle, "the underline switch");
  toggle.checked = false;
  toggle.dispatchEvent(new window.Event("change"));
  await new Promise((resolve) => setTimeout(resolve, 20));

  const after = await loadSettings();
  assert.strictEqual(after.underline, false, "the change made in the sheet");
  assert.strictEqual(modelConsentFor(after), true, "the answer still there");
  sheet.querySelector(".settings-sheet-bar button:last-child").click();
});

test("a reading handed over from outside puts a standing card and the settings away", async () => {
  /* The share menu or a Control Center button hands a text over while a card
     or the settings lie over the reading; the reading would stand unseen. */
  const { openSettingsSheet, closeSettingsSheet } = await import("../../src/ui/settings-sheet.js");
  const { openCardLayer, closeCardLayer } = await import("../../src/ui/card-layer.js");
  await saveSettings(normalizeSettings({ languages: ["de", "en"] }));
  await openSettingsSheet();
  assert.ok(document.querySelector(".settings-sheet:not(.phone-sheet):not(.card-layer)"), "the settings");
  closeSettingsSheet();
  assert.strictEqual(document.querySelector(".settings-sheet:not(.phone-sheet):not(.card-layer)"), null, "the settings gone");
  closeSettingsSheet();

  await openCardLayer({ id: "a", free: true, termLanguage: "en", term: "", meaning: "", explanation: "", choices: ["en"], reader: "de" });
  assert.ok(document.querySelector(".card-layer"), "the card");
  closeCardLayer();
  assert.strictEqual(document.querySelector(".card-layer"), null, "the card gone");
  closeCardLayer();
  await openSettingsSheet();
  assert.ok(document.querySelector(".settings-sheet:not(.phone-sheet):not(.card-layer)"), "the settings open again");
  closeSettingsSheet();
});

test("on a phone the settings' list names the other apps' page in full, there being room", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const text = labels(code, "ios");
    assert.strictEqual(text.groupReadingEntry, text.groupReading, code);
  }
});

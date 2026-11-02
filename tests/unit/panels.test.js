import test from "node:test";
import assert from "node:assert";
import { canAddPanel, changeablePanels, chooseLanguage, configuredCount, otherPanels, panelEnglishName, panelLanguages, targetLanguages } from "../../src/panels.js";
import { SUPPORTED, writingDirection } from "../../src/languages/index.js";

/* A German reader learning English and Spanish. */
const DE_EN_ES = ["de", "en", "es"];

test("the targets of the explanation are the same as those of the run", () => {
  /* If they differ, field A points at the wrong panel. */
  assert.deepStrictEqual(targetLanguages("es", DE_EN_ES), ["de", "en"]);
  assert.deepStrictEqual(targetLanguages("de", DE_EN_ES), ["en", "es"]);
  assert.deepStrictEqual(targetLanguages("en", DE_EN_ES), ["de", "es"]);
});

test("a text in a fourth language stays put and goes to the first two", () => {
  assert.deepStrictEqual(panelLanguages("fr", DE_EN_ES), ["fr", "de", "en"]);
  assert.deepStrictEqual(targetLanguages("fr", DE_EN_ES), ["de", "en"]);
});

test("every panel knows its language, whatever the original is", () => {
  assert.deepStrictEqual(panelLanguages("es", DE_EN_ES), ["es", "de", "en"]);
  assert.deepStrictEqual(panelLanguages("de", DE_EN_ES), ["de", "en", "es"]);
});

test("another user's languages give another assignment, same rules", () => {
  /* An English reader learning Portuguese and Russian. */
  const EN_PT_RU = ["en", "pt", "ru"];
  assert.deepStrictEqual(panelLanguages("pt", EN_PT_RU), ["pt", "en", "ru"]);
  assert.deepStrictEqual(targetLanguages("ar", EN_PT_RU), ["en", "pt"]);
});

test("the reader's own panel comes first among the other two", () => {
  /* All examples in the prompt show A as the panel in the reader's language,
     and the model follows the examples more reliably than the labels. */
  assert.deepStrictEqual(otherPanels(0, ["es", "de", "en"], "de"), [1, 2], "1 is German, already in front");
  assert.deepStrictEqual(otherPanels(2, ["es", "de", "en"], "de"), [1, 0], "German pulled to the front");
  assert.deepStrictEqual(otherPanels(1, ["es", "de", "en"], "de"), [0, 2], "neither is German: order stays");
  assert.deepStrictEqual(otherPanels(0, ["de", "en", "es"], "de"), [1, 2], "neither is German");
  assert.deepStrictEqual(otherPanels(1, ["en", "fr", "de"], "de"), [2, 0], "the panels as they stand, a chosen one among them");
});

test("the prompts get the English name of each panel's language", () => {
  assert.strictEqual(panelEnglishName(0, "es", DE_EN_ES), "Spanish");
  assert.strictEqual(panelEnglishName(1, "es", DE_EN_ES), "German");
  assert.strictEqual(panelEnglishName(0, "zz", DE_EN_ES), "an unknown language");
});

/* A German reader learning only Spanish. */
const DE_ES = ["de", "es"];

test("two languages mean two panels", () => {
  assert.deepStrictEqual(panelLanguages("es", DE_ES), ["es", "de"]);
  assert.deepStrictEqual(targetLanguages("de", DE_ES), ["es"]);
  assert.deepStrictEqual(otherPanels(0, ["es", "de"], "de"), [1]);
});

test("an unconfigured language takes a panel of its own", () => {
  /* Even in a two-language setup — the text stays where it is, and both
     configured languages still get their translation. */
  assert.deepStrictEqual(panelLanguages("fr", DE_ES), ["fr", "de", "es"]);
  /* With three configured, three is the ceiling: the third translation
     would be one nobody asked for. */
  assert.deepStrictEqual(panelLanguages("fr", DE_EN_ES), ["fr", "de", "en"]);
});

test("a panel is told which way its language reads", () => {
  /* Arabic is the one pack that says so; the other seven get the answer
     without carrying anything, and so does a language no pack knows. */
  assert.strictEqual(writingDirection("ar"), "rtl");
  for (const code of SUPPORTED.filter((c) => c !== "ar")) {
    assert.strictEqual(writingDirection(code), "ltr", code);
  }
  assert.strictEqual(writingDirection("zz"), "ltr");
  assert.strictEqual(writingDirection(""), "ltr");
});

test("a translation of three panels can be another language, never the reader's own", () => {
  /* A German reader with English and Spanish. */
  assert.deepStrictEqual(changeablePanels(["en", "de", "es"], "de"), [2], "a learned language's text: the Spanish");
  assert.deepStrictEqual(changeablePanels(["de", "en", "es"], "de"), [1, 2], "a German text: both");
  assert.deepStrictEqual(changeablePanels(["fr", "de", "en"], "de"), [2], "a language not set: the English");
  assert.deepStrictEqual(changeablePanels(["de", "en"], "de"), [], "two panels: a third is added instead");
});

test("French in place of Spanish holds for every text after, and a French or Spanish text keeps a third language", () => {
  const choice = chooseLanguage(null, { codes: ["en", "de", "es"], configured: 3, index: 2, code: "fr" });
  assert.deepStrictEqual(choice, { swaps: { es: "fr" }, added: "" });
  assert.deepStrictEqual(panelLanguages("en", DE_EN_ES, choice), ["en", "de", "fr"]);
  assert.deepStrictEqual(panelLanguages("de", DE_EN_ES, choice), ["de", "en", "fr"]);
  assert.deepStrictEqual(panelLanguages("fr", DE_EN_ES, choice), ["fr", "de", "en"], "French is the original");
  assert.deepStrictEqual(panelLanguages("es", DE_EN_ES, choice), ["es", "de", "en"], "Spanish is the original");
  /* Changed again, the place is still Spanish's; put back, the choice is gone. */
  const again = chooseLanguage(choice, { codes: ["en", "de", "fr"], configured: 3, index: 2, code: "it" });
  assert.deepStrictEqual(again.swaps, { es: "it" });
  assert.strictEqual(chooseLanguage(again, { codes: ["en", "de", "it"], configured: 3, index: 2, code: "es" }), null);
});

test("two panels can have a third added, whichever language the text is in", () => {
  assert.ok(canAddPanel(["es", "de"]));
  assert.ok(canAddPanel(["de", "es"]), "a text in the reader's own language too");
  assert.ok(!canAddPanel(["en", "de", "es"]), "three is the ceiling");
});

test("an added panel stays for every text with two, until it is taken away", () => {
  const choice = chooseLanguage(null, { codes: ["es", "de"], configured: 2, index: 2, code: "fr" });
  assert.deepStrictEqual(panelLanguages("es", DE_ES, choice), ["es", "de", "fr"]);
  assert.deepStrictEqual(panelLanguages("de", DE_ES, choice), ["de", "es", "fr"]);
  assert.deepStrictEqual(panelLanguages("fr", DE_ES, choice), ["fr", "de", "es"], "a French text has its three anyway");
  assert.strictEqual(configuredCount("es", DE_ES), 2, "one fewer than it shows: the third was added");
  const changed = chooseLanguage(choice, { codes: ["es", "de", "fr"], configured: 2, index: 2, code: "it" });
  assert.strictEqual(changed.added, "it");
  assert.strictEqual(chooseLanguage(changed, { codes: ["es", "de", "it"], configured: 2, index: 2, code: "" }), null, "taken away");
});

import test from "node:test";
import assert from "node:assert";
import { INTERFACE_LANGUAGES, labels } from "../../src/ui/labels.js";
import { FIRST_LANGUAGES } from "../../src/settings.js";
import { strings } from "../../src/strings.js";

/* Every text a table holds, as [path, value]. */
function entries(table, prefix = "") {
  return Object.entries(table).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? entries(value, `${prefix}${key}.`)
      : [[prefix + key, value]]);
}

/* A function's number of arguments counts: a caller hands every language
   the same ones. */
const kind = (value) =>
  typeof value === "function" ? `function/${value.length}` : Array.isArray(value) ? "array" : typeof value;

const shape = (table) => entries(table).map(([path, value]) => `${path}:${kind(value)}`).sort();

test("every interface language has every text, English on the same system being the measure", () => {
  for (const system of ["mac", "windows"]) {
    const measure = shape(labels("en", system));
    for (const code of INTERFACE_LANGUAGES) {
      const own = shape(labels(code, system));
      const missing = measure.filter((entry) => !own.includes(entry));
      const extra = own.filter((entry) => !measure.includes(entry));
      assert.deepStrictEqual({ code, system, missing, extra }, { code, system, missing: [], extra: [] });
    }
  }
});

test("no text is left empty", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const blank = entries(labels(code, "mac"))
      .filter(([, value]) => typeof value === "string" && !value.trim())
      .map(([path]) => path);
    assert.deepStrictEqual({ code, blank }, { code, blank: [] });
  }
});

test("every first language can be read in the interface and in the parsed answers", () => {
  for (const code of FIRST_LANGUAGES) {
    assert.ok(INTERFACE_LANGUAGES.includes(code), `${code} has no interface table`);
    if (code !== "en") assert.notStrictEqual(strings(code), strings("en"), `${code} has no words for the parsers`);
  }
});

test("a language without a table is shown the English interface", () => {
  assert.strictEqual(labels("ar", "mac"), labels("en", "mac"));
  assert.strictEqual(labels("", "mac"), labels("en", "mac"));
});

test("a language name standing on its own begins with a capital, inside a sentence it does not", async () => {
  const { displayName, languageLabel } = await import("../../src/languages/index.js");
  assert.strictEqual(displayName("ru", "fr"), "russe");
  assert.strictEqual(languageLabel("ru", "fr"), "Russe");
  assert.strictEqual(languageLabel("en", "ru"), "Английский");
  assert.strictEqual(languageLabel("es", "de"), "Spanisch");
});

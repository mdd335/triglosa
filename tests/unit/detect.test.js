import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_WORDS, chosenLanguage, detectByStopwords, detectLanguage, keepsChosenLanguage } from "../../src/detect.js";
import { SUPPORTED } from "../../src/languages/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(fs.readFileSync(path.join(here, "..", "corpus.json"), "utf8"));

const labelled = [];
for (const set of Object.keys(corpus)) {
  for (const entry of corpus[set]) {
    if (entry.lang) labelled.push({ id: set + "/" + entry.id, lang: entry.lang, text: entry.text });
  }
}

/* What a user running German, English and Spanish would have configured. */
const CONFIGURED = ["de", "en", "es"];

test("across the whole corpus it is never wrong", () => {
  const wrong = [];
  for (const t of labelled) {
    const got = detectByStopwords(t.text, CONFIGURED);
    if (got && got !== t.lang) wrong.push(`${t.id}: is ${t.lang}, read as ${got}`);
  }
  assert.deepStrictEqual(wrong, []);
});

test("a language that is not configured is handed on", () => {
  /* French, Italian and Portuguese share too many function words with
     Spanish. That is what they sit in the stopword lists for — not to be
     chosen, but to be recognized and then refused. */
  const foreign = labelled.filter((t) => !CONFIGURED.includes(t.lang));
  assert.ok(foreign.length >= 4, `the corpus holds such texts: ${foreign.length}`);
  for (const t of foreign) {
    assert.strictEqual(detectByStopwords(t.text, CONFIGURED), "", `${t.id} (${t.lang}) was decided`);
  }
});

test("the same text is decided once the language is configured", () => {
  const french = labelled.find((t) => t.lang === "fr");
  assert.ok(french, "the corpus holds a French text");
  assert.strictEqual(detectByStopwords(french.text, ["de", "en", "fr"]), "fr");
});

/* Counted over the texts it can judge at all: a single word carries no
   function words, and short input is answered elsewhere. */
test("it decides enough texts to be worth having", () => {
  const long = labelled.filter((t) =>
    CONFIGURED.includes(t.lang) && (t.text.match(/\S+/g) || []).length >= MIN_WORDS);
  const decided = long.filter((t) => detectByStopwords(t.text, CONFIGURED)).length;
  const share = decided / long.length;
  assert.ok(share > 0.5, `coverage only ${(share * 100).toFixed(0)}% of ${long.length}`);
});

/* Where the app used to be wrong: a language it does not offer hits a few
   function words of one it does — Czech reads Portuguese on se, do, a and
   pro — and the whole page was then built for the wrong language. The corpus
   carries 26 such texts, in Latin, Cyrillic, Greek and three other scripts,
   including the two that were reported. */
test("a language the app does not offer is never named", () => {
  const foreign = corpus.unsupported || [];
  assert.ok(foreign.length >= 20, `the corpus holds such texts: ${foreign.length}`);
  const named = foreign
    .map((t) => ({ id: t.id, got: detectByStopwords(t.text, SUPPORTED) }))
    .filter((t) => t.got);
  assert.deepStrictEqual(named, []);
});

test("short input goes on to the model, where statistics do not help", () => {
  assert.strictEqual(detectByStopwords("soslayable", CONFIGURED), "");
  assert.strictEqual(detectByStopwords("echar de menos", CONFIGURED), "");
  assert.strictEqual(detectByStopwords("Fernweh", CONFIGURED), "");
  assert.strictEqual(detectByStopwords("", CONFIGURED), "");
});

test("a non-Latin script yields words rather than nothing", () => {
  /* Splitting on [^a-z0-9] would see an empty text here. */
  const ru = "Он сказал, что все уже было готово, и мы не стали ждать его ответа.";
  assert.strictEqual(detectByStopwords(ru, ["de", "en", "ru"]), "ru");
  assert.strictEqual(detectByStopwords(ru, CONFIGURED), "", "not configured, so no answer");
});

test("a supported language the user did not configure is still recognised", async () => {
  /* The text takes a panel of its own, so detection may not be limited to the
     configured languages — a Spanish text with the default German/English
     setup came out as English otherwise. */
  const es = "Los totales del número de hablantes globales generalmente no son confiables.";
  const found = await detectLanguage(es, {
    languages: ["de", "en"],
    reader: "de",
    translation: null,
    llm: null,
  });
  assert.strictEqual(found.code, "es");
});

test("a supported language answered by its name is still that language", async () => {
  /* Measured: "Kummerspeck" came back as "Deutsch" and "sgranare" as
     "Italienisch" — the name the prompt asks for with an unsupported language.
     Read as unsupported, a German word got a German panel beside it. */
  for (const [answer, code] of [["Deutsch", "de"], ["Italienisch.", "it"], ["Italian", "it"], ["español", "es"]]) {
    const found = await detectLanguage("xx", {
      languages: ["de", "en", "es"],
      reader: "de",
      translation: null,
      llm: { chat: async () => answer },
    });
    assert.strictEqual(found.code, code, answer);
  }
  const other = await detectLanguage("xx", {
    languages: ["de", "en"], reader: "de", translation: null, llm: { chat: async () => "Niederländisch" },
  });
  assert.deepStrictEqual(other, { code: "", name: "Niederländisch", guesses: [] });
});

test("French with no article in front of its nouns is not taken for Spanish", () => {
  const fr = "Merci pour ton aide, la réunion a été reportée à demain.";
  assert.notStrictEqual(detectByStopwords(fr, ["de", "en", "es", "fr"]), "es");
});

test("what the recognizer thought likeliest travels with the answer", async () => {
  const translation = {
    detect: async (text, candidates, preferred, onGuesses) => {
      onGuesses(["pt", "es", "ca"]);
      return "";
    },
  };
  const found = await detectLanguage("sobremesa", {
    languages: ["de", "es", "en"], reader: "de", translation, llm: { chat: async () => "pt" },
  });
  assert.strictEqual(found.code, "pt");
  assert.deepStrictEqual(found.guesses, ["pt", "es", "ca"]);
});

test("a language the reader chose keeps its code apart where the app has no pack for it", () => {
  assert.deepStrictEqual(chosenLanguage("es", "de"), { code: "es", name: "Spanisch" });
  assert.deepStrictEqual(chosenLanguage("fa", "de"), { code: "", iso: "fa", name: "Persisch" });
});

test("a chosen language goes on with an edited text unless the function words are sure of another", () => {
  const hungarian = "Szeged az ország déli részén fekszik, a Tisza partján, és sokan szeretik.";
  assert.ok(keepsChosenLanguage(hungarian, "hu"), "nothing to say about Hungarian: the choice holds");
  const english = "The committee had spent months reviewing the proposal, yet the final vote was postponed again.";
  assert.ok(!keepsChosenLanguage(english, "hu"), "replaced by an English text: it no longer holds");
  assert.ok(keepsChosenLanguage(english, "en"));
});

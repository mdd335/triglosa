import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IDENTIFIER_THRESHOLD, MIN_WORDS, chosenLanguage, detectByStopwords, detectLanguage, keepsChosenLanguage, readIdentified } from "../../src/detect.js";
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
  assert.deepStrictEqual(other, { code: "", name: "Niederländisch", guesses: [], by: "model" });
});

test("French with no article in front of its nouns is not taken for Spanish", () => {
  const fr = "Merci pour ton aide, la réunion a été reportée à demain.";
  assert.notStrictEqual(detectByStopwords(fr, ["de", "en", "es", "fr"]), "es");
});

test("what the recognizer thought likeliest travels with the answer", async () => {
  const translation = {
    detect: async (text, candidates, preferred, report) => {
      report({ guesses: ["pt", "es", "ca"], unsure: "pt" });
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

test("with no model to ask, the recognizer's own best reading is taken", async () => {
  /* A single word carries no function words and the recognizer is rarely
     sure enough of one. The model is the stage that decides it — and where
     there is none, or it cannot be reached, a guess translates and nothing
     does not. */
  const translation = {
    detect: async (text, candidates, preferred, report) => {
      report({ guesses: ["es", "pt"], unsure: "es" });
      return "";
    },
  };
  const asked = { languages: ["de", "es", "en"], reader: "de", translation };
  const without = await detectLanguage("quebranto", { ...asked, llm: null });
  assert.strictEqual(without.code, "es");
  const unreachable = await detectLanguage("quebranto", {
    ...asked,
    llm: { chat: async () => { throw new Error("connect ECONNREFUSED"); } },
  });
  assert.strictEqual(unreachable.code, "es");
  /* A model that answers still decides. */
  const answered = await detectLanguage("quebranto", { ...asked, llm: { chat: async () => "pt" } });
  assert.strictEqual(answered.code, "pt");
});

test("a recognizer that says nothing at all leaves the language unnamed", async () => {
  const silent = {
    detect: async (text, candidates, preferred, report) => {
      report({ guesses: [], unsure: "" });
      return "";
    },
  };
  const found = await detectLanguage("quebranto", {
    languages: ["de", "es", "en"], reader: "de", translation: silent, llm: null,
  });
  assert.strictEqual(found.code, "");
  await assert.rejects(detectLanguage("quebranto", {
    languages: ["de", "es", "en"], reader: "de", translation: silent,
    llm: { chat: async () => { throw new Error("connect ECONNREFUSED"); } },
  }));
});

test("a Chinese text with a few English words in it is not taken for English", () => {
  const text = "我们在会议上讨论了 the budget and the plan for the next year，大家都同意这个方案，但是还有很多细节需要进一步研究和确认。"
    + "经理说预算的问题比较复杂，因为今年的收入比去年少了很多，所以我们必须减少一些不太重要的开支，下周再开会讨论具体的办法。";
  assert.strictEqual(detectByStopwords(text, SUPPORTED), "");
});

test("the identifier decides only where it is sure, and of a language the app offers", () => {
  assert.deepStrictEqual(readIdentified([["it", 0.97], ["es", 0.02]]), { code: "it", foreign: false });
  assert.deepStrictEqual(readIdentified([["it", IDENTIFIER_THRESHOLD - 0.01], ["es", 0.1]]), { code: "", foreign: false });
  assert.deepStrictEqual(readIdentified([["fa", 0.99], ["ar", 0.01]]), { code: "", foreign: true });
  for (const nothing of [[], null, undefined, [[]]]) {
    assert.deepStrictEqual(readIdentified(nothing), { code: "", foreign: false });
  }
});

test("a language the identifier is sure of is asked of nobody else", async () => {
  let asked = 0;
  const found = await detectLanguage("tramonto", {
    languages: ["de", "en"],
    reader: "de",
    identifier: { identify: async () => [["it", 0.99]] },
    translation: { detect: async () => { asked++; return "pt"; } },
    llm: { chat: async () => { asked++; return "pt"; } },
  });
  assert.deepStrictEqual(found, { code: "it", name: "Italienisch", guesses: [], by: "text" });
  assert.strictEqual(asked, 0);
});

test("an identifier that is unsure, absent or failing leaves the question to the others", async () => {
  const device = { detect: async () => "pt" };
  for (const identifier of [
    { identify: async () => [["it", 0.6], ["pt", 0.3]] },
    { identify: async () => [] },
    { identify: async () => { throw new Error("absent"); } },
    null,
  ]) {
    const found = await detectLanguage("tramonto", { languages: ["de", "en"], reader: "de", identifier, translation: device, llm: null });
    assert.strictEqual(found.code, "pt");
    assert.strictEqual(found.by, "device");
  }
});

test("sure of a language the app does not offer, the identifier sends the text past the recognizer", async () => {
  /* Persian comes back from the recognizer as Arabic, sure of it. */
  const asked = {
    languages: ["de", "en"],
    reader: "de",
    identifier: { identify: async () => [["fa", 0.99]] },
    translation: {
      detect: async (text, candidates, preferred, report) => {
        report({ guesses: ["ar"], unsure: "ar" });
        return "ar";
      },
    },
  };
  const found = await detectLanguage("سلام", { ...asked, llm: { chat: async () => "Persisch" } });
  assert.deepStrictEqual(found, { code: "", name: "Persisch", guesses: ["ar"], by: "model" });
  /* With no model to ask after it, the recognizer is all there is. */
  const alone = await detectLanguage("سلام", { ...asked, llm: null });
  assert.strictEqual(alone.code, "ar");
  const unreachable = await detectLanguage("سلام", { ...asked, llm: { chat: async () => { throw new Error("offline"); } } });
  assert.strictEqual(unreachable.code, "ar");
});

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wordsPrompt } from "../../src/prompts/words.js";
import {
  abbreviationPrompt,
  meaningPrompt,
  spotPrompt,
  synonymPrompt,
  tenseNames,
  personNames,
  verbFormPrompt,
  wordClassPrompt,
} from "../../src/prompts/marked.js";
import { alignVerbsPrompt, annotateVerbsPrompt, fieldName, findVerbsPrompt } from "../../src/prompts/verbs.js";
import { alignWordsPrompt } from "../../src/prompts/words-align.js";
import { glanceInput, glancePrompt } from "../../src/prompts/glance.js";
import { alternativesPrompt, definitionPrompt, readerSpelling } from "../../src/prompts/translation.js";
import { detectPrompt } from "../../src/prompts/detect.js";
import { SUPPORTED, languagePack } from "../../src/languages/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
/* The settings several of these prompts are asked with. */
const SETUP = {
  languages: ["de", "en", "es"],
  levels: { en: "C1", es: "B2" },
};

/* ---- the question about the difficult words ----

   These used to pin the prompt character for character against a fixture.
   Phase 6 replaced it, and measured the replacement: 18 texts in
   seven languages against five models, twice over. So what is pinned here is the contract the
   measurement settled on rather than a fixture — chiefly the two things the
   old prompt got wrong and the one it got right. */

test("the question names both languages and the reader's level in the text's", () => {
  const text = wordsPrompt({ code: "fr", languages: ["de", "fr"], levels: { fr: "A2" } });
  assert.ok(text.includes("a German reader understand a French text"));
  assert.ok(text.includes("read French at level A2 on the CEFR scale"));
  assert.ok(text.includes("Judge difficulty against level A2"));
  /* An English reader, not a English reader. */
  const english = wordsPrompt({ code: "ru", languages: ["en", "ru"], levels: { ru: "C1" } });
  assert.ok(english.includes("an English reader understand a Russian text"));
});

test("an everyday word is an item for a beginner and for nobody else", () => {
  const everyday = "an everyday word that translation renders plainly is never an item";
  assert.ok(!wordsPrompt({ code: "fr", languages: ["de", "fr"], levels: { fr: "A2" } }).includes(everyday));
  assert.ok(wordsPrompt({ code: "fr", languages: ["de", "fr"], levels: { fr: "B2" } }).includes(everyday));
  assert.ok(wordsPrompt({ code: "de", languages: ["de", "fr"], levels: {} }).includes(everyday));
  /* Never the clause that held the local model to half its items. */
  assert.ok(!wordsPrompt({ code: "fr", languages: ["de", "fr"], levels: {} }).includes("ONLY when"));
});

test("a language with no level set is asked about at B1", () => {
  /* The middle of the scale, and the point at which a text stops being an
     exercise and starts being reading. */
  const text = wordsPrompt({ code: "es", languages: ["de", "es"], levels: {} });
  assert.ok(text.includes("read Spanish at level B1"));
});

test("the reader's own language is not asked about as a foreign one", () => {
  /* Reachable through the "always" setting: a German text in front of a
     German reader. Asking it at a level produced "read German at level B1"
     and a rule saying the tense must be German and never German. */
  const text = wordsPrompt({ code: "de", languages: ["de", "es"], levels: {} });
  assert.ok(text.includes("German is their own language"));
  assert.ok(!text.includes("at level"));
  assert.ok(text.includes("Judge difficulty against a native speaker"));
});

test("no language gets another language's prompt, and none gets an example", () => {
  /* Examples are the mechanism that produced 20 Spanish tenses under texts
     that were not Spanish. There is one path for all eight languages now,
     and the only thing that varies in it is the two language names, the
     level, and the grammar table the verb prompts take from the pack. */
  const shape = (code) =>
    wordsPrompt({ code, languages: ["de", code], levels: {} })
      /* The article goes with the name: "an Arabic text", "a French text". */
      .replace(new RegExp(`\\b(a|an) ${languagePack(code).englishName}`, "g"), "<A LANG>")
      .replace(new RegExp(languagePack(code).englishName, "g"), "<LANG>");
  const french = shape("fr");
  for (const code of ["es", "it", "pt", "ru", "ar", "en"]) {
    assert.strictEqual(shape(code), french, `${code} is asked the same question as French`);
  }
  for (const code of ["fr", "ru", "ar", "es"]) {
    const text = wordsPrompt({ code, languages: ["de", code], levels: {} });
    assert.ok(!/\bExample\b/.test(text), `${code}: no example`);
    for (const spanish of ["el puente", "Aprovechamos", "dar largas", "ABSOLUTE BAN"]) {
      assert.ok(!text.includes(spanish), `${code}: the prompt must not say "${spanish}"`);
    }
  }
});

test("no pack carries a word prompt of its own any more", () => {
  /* Three did, and the measurement is why they do not: on Spanish's own
     everyday corpus, 14 texts, the calibration found 23 items where the
     general question found 28, with the same number of texts left empty. */
  for (const code of ["de", "en", "es", "fr", "ru", "ar", "it", "pt"]) {
    assert.ok(!languagePack(code).wordPrompt, `${code} has none`);
  }
});

test("the second attempt appends its own instruction and nothing else", () => {
  const plain = wordsPrompt({ code: "es", ...SETUP });
  const retry = wordsPrompt({ code: "es", ...SETUP, retry: true });
  assert.ok(retry.startsWith(plain));
  assert.ok(retry.includes("SECOND ATTEMPT"));
});

/* ---- the questions about the clicked word ---- */

const TENSES = tenseNames("es");
const PERSONS = personNames("es");

/* The four questions about a clicked word were the last place Spanish
   examples with German answers stood. Measured across the eight
   language corpus with an English reader, they cost three of 34 meanings
   their language — two of them answered in German, which is the language of
   no one in that run. Without them: 34 of 34, and a German reader loses
   nothing. */
test("the clicked word is asked in English and answered in the reader's language", () => {
  for (const code of ["fr", "ru", "ar", "es"]) {
    const source = languagePack(code).englishName;
    for (const text of [
      meaningPrompt({ source, reader: "English" }),
      spotPrompt({ source, reader: "English" }),
      abbreviationPrompt({ source, reader: "English" }),
      synonymPrompt({ source }),
    ]) {
      assert.ok(!/\bExamples?:/.test(text), `${code}: no example`);
      for (const leak of ["fianza", "Kaution", "banco", "Vorbehalte", "DSGVO"]) {
        assert.ok(!text.includes(leak), `${code}: must not say "${leak}"`);
      }
      assert.ok(text.includes(source), `${code}: names the language of the text`);
    }
  }
  /* Which field is written in which language, said outright — the rule that
     closes the leak the examples opened. */
  assert.ok(meaningPrompt({ source: "Russian", reader: "German" })
    .includes("<meaning> and <note> are written in German, never in Russian"));
  assert.ok(synonymPrompt({ source: "Russian" })
    .includes("Answer in Russian, the language of the Word"));
  /* A reader reading their own language is told so instead of being told to
     avoid it. */
  assert.ok(meaningPrompt({ source: "German", reader: "German" })
    .includes("never in any other language"));
  assert.ok(abbreviationPrompt({ source: "German", reader: "German" })
    .includes("already in the reader's language"));
});

test("the clicked verb is asked the same way the table is", () => {
  /* This one used to be the original verbatim, five Spanish examples and all,
     and it asks exactly what the verb table asks — for one word instead of a
     list. So it follows the same measurement: no examples, the tenses of the
     text's own language, and the sentence saying which language the fields
     are written in. */
  for (const code of ["fr", "ru", "ar", "de"]) {
    const source = languagePack(code).englishName;
    const text = verbFormPrompt({ source, reader: "German", tenses: tenseNames(code), persons: personNames(code) });
    assert.ok(!/\bExamples?\b/.test(text), `${code}: no example`);
    for (const spanish of ["he comido", "pretérito perfecto", "ellos/ustedes", "fianza"]) {
      assert.ok(!text.includes(spanish), `${code}: must not say "${spanish}"`);
    }
    assert.ok(text.includes(languagePack(code).grammar.tenses[0]));
  }
  const own = verbFormPrompt({ source: "German", reader: "German", tenses: TENSES, persons: PERSONS });
  assert.ok(own.includes("never in any other language"), "no rule saying German and never German");
});

/* Every pack carries a grammar table now, so the fallback is what a
   language the app does not support gets — not what a supported one that
   has not been calibrated gets. That was the state phase 6 ended: the names
   are written out of a grammar, and there is nothing in them to measure. */
test("the tense names come from the pack, with a plain fallback", () => {
  assert.ok(TENSES.startsWith("presente, pretérito indefinido"));
  assert.strictEqual(tenseNames("ru"), "настоящее время, прошедшее время, будущее время, " +
    "повелительное наклонение, сослагательное наклонение, инфинитив, причастие, деепричастие");
  assert.strictEqual(tenseNames("xx"), "usual name in that language");
});

/* Both verb prompts used to name the Spanish persons and tenses outright, so
   a German text came back as "tú | presente" and an English one as
   "ellos/ustedes | pretérito indefinido". Measured on the everyday corpus
   that was 23 of 26 severe findings — by a wide margin the largest single
   fault in the run. The names now come from the pack, the same way every
   other calibrated Spanish detail does. */
test("the persons come from the pack too, and say so where a language has none", () => {
  assert.ok(PERSONS.startsWith("yo, tú, él/ella/usted, nosotros, vosotros, ellos/ustedes"));
  assert.ok(PERSONS.endsWith("- or infinitive, gerund, participle, impersonal"),
    "the four form names are grammatical categories, not pronouns, and stay");
  /* They are English because the prompt around them is. They were Spanish
     until phase 6, which put four Spanish words in the middle of a Russian
     question — in the very prompt whose leak had just been measured shut. */
  assert.ok(!PERSONS.includes("infinitivo"));
  assert.ok(personNames("ru").startsWith("я, ты, он/она/оно, мы, вы, они"));
  assert.ok(personNames("xx").startsWith("the pronouns of that language"));
});

test("no verb prompt names a Spanish person or tense to a language that is not Spanish", () => {
  for (const code of ["de", "en", "fr", "ru"]) {
    for (const text of [
      annotateVerbsPrompt({ source: "German", reader: "German",
        tenses: tenseNames(code), persons: personNames(code) }),
      verbFormPrompt({ source: "German", tenses: tenseNames(code), persons: personNames(code) }),
    ]) {
      const rules = text.split("\n").filter((line) => /^\d/.test(line)).join("\n");
      for (const spanish of ["ellos/ustedes", "vosotros", "pretérito indefinido", "subjuntivo"]) {
        assert.ok(!rules.includes(spanish), `${code}: the rules must not say "${spanish}"`);
      }
    }
  }
});

test("an English reader gets the questions in their own terms", () => {
  const text = meaningPrompt({ source: "Spanish", reader: "English" });
  assert.ok(text.includes("A reader picked ONE word or phrase out of a Spanish text"));
  assert.ok(text.includes("the explanation, in English,"));
  assert.ok(text.includes("its English equivalent AS USED HERE"));
});

/* ---- the prompts built per run ---- */

const dynamic = JSON.parse(fs.readFileSync(path.join(here, "..", "fixtures", "prompts-dynamic.json"), "utf8"));

/* Spanish text, German reader, English as the third panel — the run the
   original was fixed to. */
const RUN = { source: "Spanish", reader: "German", target: "German", a: "German", b: "English" };

test("the alignment prompts name their columns and carry no sentence", () => {
  /* The last of the three to be generalised. What it answers is checked
     against the two translations in front of it before anything is drawn, so
     it never leaked measurably — but it asserted things about the language
     being read: rule 5a called llevar + gerundio "a Russian periphrasis"
     under a Russian text, which is not an example in the wrong language but
     an untruth about the one at hand. */
  for (const code of ["fr", "ru", "ar", "es"]) {
    const source = languagePack(code).englishName;
    const text = alignVerbsPrompt({ source, a: "German", b: "English",
      fieldSource: fieldName(code), fieldA: "deutsch", fieldB: "english" });
    assert.ok(!/\bExample\b/.test(text), `${code}: no example`);
    assert.ok(!text.includes("gerundio"), `${code}: no Spanish periphrasis`);
    assert.ok(text.includes(`A ${source} periphrasis`), `${code}: rule 5a names the text's language`);
    assert.ok(text.includes(`${fieldName(code)} | deutsch | english`), `${code}: names its columns`);
  }
});

test("the verb prompts carry the text's own grammar and no example", () => {
  /* Every Spanish tense measured under a text that was not Spanish came from
     the examples these two prompts used to carry: 20 over four models,
     against none without them. And a prompt with the examples removed and
     nothing put back names the tense in the READER's language instead — the
     mirror image. Naming the tenses of the text's own language closes both,
     which is what the pack's grammar table is for. */
  for (const code of ["fr", "it", "pt", "ru", "ar", "de", "en"]) {
    const source = languagePack(code).englishName;
    const text = annotateVerbsPrompt({
      source, reader: "German", level: "B1",
      tenses: tenseNames(code), persons: personNames(code),
    });
    assert.ok(!/\bExample\b/.test(text), `${code}: no example`);
    for (const spanish of ["pretérito indefinido", "él/ella/usted", "he comido", "Se trata"]) {
      assert.ok(!text.includes(spanish), `${code}: must not say "${spanish}"`);
    }
    assert.ok(text.includes(languagePack(code).grammar.tenses[0]),
      `${code}: names its own first tense`);
    if (code !== "de") {
      assert.ok(text.includes(`never in German and never in any third language`),
        `${code}: the field languages are said outright`);
    }
  }
  /* The finding step says how a language that splits a verb should write it,
     because the app can place the halves and cannot place a form it never
     hears about. */
  assert.ok(findVerbsPrompt({ source: "German" }).includes("joined by a plus sign"));
  assert.ok(!/\bExample\b/.test(findVerbsPrompt({ source: "German" })));
});

test("the word alignment prompt names no language at all", () => {
  /* Its panels are labelled in the user line, so the one thing to pin is
     that nothing put a language back into the question. */
  const text = alignWordsPrompt();
  assert.ok(!/\bExample\b/.test(text));
  assert.ok(!text.includes("Spanish") && !text.includes("German"));
  assert.ok(text.includes("<original> | <A> | <B>"));
});

test("the definition prompt is character for character the original", () => {
  /* Source and unknown marker were parameters from the start, so nothing in
     it ever named a language it was not asked about. */
  assert.strictEqual(
    definitionPrompt({ source: RUN.source, unknown: "UNBEKANNT" }),
    dynamic.meaning.system,
  );
});

test("the dictionary note is the reader's language, and its pack says how to write it", () => {
  /* Six examples, every one of them writing its note in German — under a
     Spanish word, under an English one, for a reader who may be neither. The
     rule about umlauts said "German" outright to everybody. */
  const german = alternativesPrompt({ ...RUN, spelling: readerSpelling("de") });
  assert.ok(german.includes("umlauts (ä, ö, ü) and ß"));
  assert.ok(german.includes("<note> is in German, at most four words"));

  const english = alternativesPrompt({
    source: "Spanish", target: "Spanish", reader: "English",
    spelling: readerSpelling("en"),
  });
  assert.ok(english.includes("<note> is in English, at most four words"));
  /* English names no spelling rule, so none is added — and no German one
     survives anywhere. */
  assert.ok(!english.includes("umlauts"));
  for (const text of [german, english]) {
    assert.ok(!/\bExamples?:/.test(text), "no example");
    for (const leak of ["am üblichsten", "v.a. Spanien", "Großbritannien", "baladí"]) {
      assert.ok(!text.includes(leak), `must not say "${leak}"`);
    }
  }
});

test("the column names come from the packs", () => {
  assert.strictEqual(fieldName("es"), "espanol");
  assert.strictEqual(fieldName("de"), "deutsch");
  /* A pack that names no column falls back to its English name. */
  assert.strictEqual(fieldName("ru"), "russian");
});

test("the detector may name every supported language, the user's first", () => {
  /* The original offered three codes, because it had three languages. It now
     offers all eight: a text in a language the user has not configured keeps a
     panel of its own, and that cannot happen if the language is never named.
     Their own languages stand first, being the likeliest answers. */
  const text = detectPrompt({ languages: ["de", "en", "es"], reader: "de" });
  assert.ok(text.includes("de (German), en (English), es (Spanish), ar (Arabic)"));
  for (const code of ["fr", "it", "pt", "ru"]) {
    assert.ok(text.includes(`${code} (`), code);
  }
});

test("a short input that fits several languages is answered with one of the reader's", () => {
  /* Measured in run fifteen: named, not pointed at by list order. */
  assert.ok(detectPrompt({ languages: ["en", "pt"], reader: "en" })
    .includes("If the input is a correct word or phrase in English, Portuguese, reply with that language"));
});

test("everything around the language list is the fixture's, word for word", () => {
  const text = detectPrompt({ languages: ["de", "en", "es"], reader: "de" });
  const want = dynamic.det.system;
  assert.ok(text.startsWith(want.slice(0, 62)), "identical up to the code list");
  assert.ok(text.endsWith("A rare or literary word is still judged the same way. " +
    "No punctuation, no explanation."), "and identical again at the end");
  assert.ok(text.includes(
    "The input is often a single word or a short phrase with no context. " +
    "Judge it by its spelling, accents and word endings, not by guessing:"));
  for (const hint of [
    "-ción, -dad, -able, ñ, ¿ and accented vowels point to Spanish",
    "-ung, -keit, -heit, umlauts and ß point to German",
    "-tion, -ness, -ly and th point to English",
  ]) {
    assert.ok(text.includes(hint), hint);
  }
  /* Three packs carried a hint and five did not, so the detector was told how
     to recognise German and left to guess at Portuguese — on an input that is
     often one word. All eight name theirs now. */
  for (const code of SUPPORTED) {
    assert.ok(text.includes(languagePack(code).spellingHints), code);
  }
});

test("the languages it names as examples are ones the app does not offer", () => {
  /* The list shows the shape of an answer for anything outside the eight. A
     supported language in it would contradict the code list above it. */
  const text = detectPrompt({ languages: ["de", "en", "es"], reader: "de" });
  assert.ok(text.includes("Niederländisch, Schwedisch, Dänisch"));
  assert.ok(text.includes("Niederländisch not Nederlands"));
  for (const name of ["Französisch,", "Italienisch,", "Russisch,"]) {
    assert.ok(!text.includes(name), name);
  }
  /* For an English reader the same sentence comes out in English, with no
     second list anywhere in the code. */
  const english = detectPrompt({ languages: ["en", "ru"], reader: "en" });
  assert.ok(english.includes("en (English), ru (Russian)"));
  assert.ok(english.includes("its English name"));
  assert.ok(english.includes("Dutch not Nederlands"));
});

/* ---- what an explanation is about ---- */

/* Measured over 41 words in eight languages, two models:
   asking the note for what the term means HERE is what produced explanations
   that retold the sentence instead of explaining the word. These tests hold the
   wording that moved them. */
test("the note is asked about the term, not about the sentence", () => {
  const text = meaningPrompt({ source: "Spanish", reader: "German" });
  assert.ok(text.includes("Explain the TERM: what kind of thing it is"));
  assert.ok(text.includes("NOT the sentence"));
  /* The context is not forbidden — sometimes it is the whole of the meaning.
     It is put at the end and made conditional. */
  assert.ok(text.includes("ONE short clause at the end"));
  assert.ok(!text.includes("Say what the TERM means HERE"));
  /* "Dies ist ein Substantiv" said nothing the row did not already show. */
  assert.ok(text.includes("never name the part of speech"));
});

test("a word reached through a synonym is not asked about any text", () => {
  /* It does not stand in the text, so every sentence about "here" is about a
     place the word never was — measured at 46 % of them on the cloud model
     and 68 % locally, including notes that told the reader the word was "hier
     nicht im Text". */
  const text = meaningPrompt({ source: "Spanish", reader: "German", inText: false });
  assert.ok(text.includes("There is NO text"));
  assert.ok(text.includes("There is no text and no situation"));
  assert.ok(!text.includes("AS USED HERE"));
  assert.ok(!text.includes("THIS text first"));
  assert.ok(text.includes("the most common first"));

  const synonyms = synonymPrompt({ source: "Spanish", inText: false });
  assert.ok(!synonyms.includes("in THIS text"));
  assert.ok(!synonyms.includes("this very sentence"));
  assert.ok(synonyms.includes("on its own"));
});

test("the term list explains the term rather than the passage", () => {
  const text = wordsPrompt({ code: "es", languages: ["de", "es"], levels: {} });
  assert.ok(text.includes("what the term actually means or refers to"));
  /* The local model's labels: "Soziale Politik; Konzeptbeschreibung" under a
     term nobody could learn from it. */
  assert.ok(text.includes("A field or a category alone is not a note"));
  assert.ok(text.includes("never the part of speech"));
  assert.ok(text.includes("explains the TERM, not the sentence"));
  assert.ok(!text.includes("what the thing is here"));
});

test("a dictionary entry is told the capitals of its target language, from the pack", () => {
  const german = alternativesPrompt({ source: "Spanish", target: "German", reader: "English", capitalisesNouns: true });
  assert.ok(german.includes("Write a noun with a capital first letter and every other word in lower case."));
  const spanish = alternativesPrompt({ source: "German", target: "Spanish", reader: "English", capitalisesNouns: false });
  assert.ok(spanish.includes("Write it in lower case unless it is a proper name."));
  assert.ok(!spanish.includes("noun with a capital"));
});

test("the hover's alignment names no language of its own and carries no example", () => {
  const system = glancePrompt();
  for (const code of SUPPORTED) {
    assert.ok(!system.includes(languagePack(code).englishName), `names ${code}`);
  }
  /* A schematic line, not a sentence: the only pipe stands between two
     placeholders. */
  assert.deepStrictEqual(system.match(/[^\n]*\|[^\n]*/g).map((line) => /<unit> \| <stretch>/.test(line)), [true]);
  assert.strictEqual(
    glanceInput({ sourceName: "Spanish", targetName: "German", sentence: "Hola.", translation: "Hallo." }),
    "Original (Spanish): Hola.\nTranslation (German): Hallo.",
  );
});

test("the word-class question offers the genders the pack names, and none where it names none", async () => {
  const { languagePack } = await import("../../src/languages/index.js");
  const spanish = wordClassPrompt({ source: "Spanish", genders: languagePack("es").grammar.genders });
  assert.ok(spanish.includes("exactly one of: masculine, feminine."));
  assert.ok(!spanish.includes("neuter"));
  const english = wordClassPrompt({ source: "English", genders: languagePack("en").grammar.genders });
  assert.ok(english.includes("English nouns have no grammatical gender"));
  assert.ok(!wordClassPrompt({ source: "Spanish", inText: false }).includes("THIS text"));
  for (const code of ["ar", "de", "en", "es", "fr", "it", "pt", "ru"]) {
    assert.ok(Array.isArray(languagePack(code).grammar.genders), `${code} names its genders`);
  }
});

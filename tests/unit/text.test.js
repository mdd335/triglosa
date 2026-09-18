import test from "node:test";
import assert from "node:assert";
import {
  cleanLine,
  containsWord,
  sentenceWith,
  stripDiacritics,
  stripModelWrapping,
  stripQuotes,
  toSentences,
  toTokens,
  wordCount,
  wordIndexOf,
} from "../../src/text.js";

test("tokenizing covers the text without gaps or overlap", () => {
  const t = "El fármaco mostró eficacia (n=120).";
  const pieces = toTokens(t);
  assert.strictEqual(pieces.map((p) => p.text).join(""), t);
  pieces.forEach((p, i) => {
    assert.strictEqual(p.start, i ? pieces[i - 1].end : 0);
    assert.strictEqual(t.slice(p.start, p.end), p.text);
  });
});

test("accented letters hold a word together, a hyphen splits it", () => {
  const words = (t) => toTokens(t).filter((p) => p.isWord).map((p) => p.text);
  assert.deepStrictEqual(words("fármaco"), ["fármaco"]);
  assert.deepStrictEqual(words("Learning-Agreement"), ["Learning", "Agreement"]);
  assert.deepStrictEqual(words("¿Cuánto?"), ["Cuánto"]);
});

test("a match has to sit on word boundaries", () => {
  const t = "hicimos un ensayo clínico en el ensayo.";
  assert.strictEqual(wordIndexOf(t, "ensayo"), 11);
  /* "en" must not match inside "ensayo". */
  assert.strictEqual(wordIndexOf(t, "en"), 26);
  assert.strictEqual(wordIndexOf(t, "fármaco"), -1);
  assert.ok(containsWord(t, "clínico"));
  assert.ok(!containsWord(t, "sayo"));
});

test("diacritics are dropped for comparison only", () => {
  assert.strictEqual(stripDiacritics("habló"), "hablo");
  assert.strictEqual(stripDiacritics("¿Cuánto?"), "¿Cuanto?");
});

test("bullets and numbering in front of a line are dropped", () => {
  assert.strictEqual(cleanLine("- resolución | formale Lösung"), "resolución | formale Lösung");
  assert.strictEqual(cleanLine("  3) tercero"), "tercero");
  assert.strictEqual(cleanLine("• uno"), "uno");
});

test("quotes are stripped even with whitespace behind them", () => {
  assert.strictEqual(stripQuotes('  "ensayo"  '), "ensayo");
  assert.strictEqual(stripQuotes("„Versuch“ "), "Versuch");
  assert.strictEqual(stripQuotes("«\u00a0essai\u00a0»"), "essai");
  assert.strictEqual(stripQuotes("«попытка»"), "попытка");
  assert.strictEqual(stripQuotes("gruppo «Rosa Bianca»"), "gruppo «Rosa Bianca»");
  assert.strictEqual(stripQuotes("keine Anführung"), "keine Anführung");
  /* A quotation inside the field keeps both its marks. */
  assert.strictEqual(stripQuotes('Widerstandsgruppe „Weiße Rose"'), 'Widerstandsgruppe „Weiße Rose"');
  assert.strictEqual(stripQuotes("l'arte"), "l'arte");
});

test("the angle brackets a prompt marks its fields with are stripped too", () => {
  assert.strictEqual(stripQuotes(" <bull caught> "), "bull caught");
  assert.strictEqual(stripQuotes('<"Kaution">'), "Kaution");
  assert.strictEqual(stripQuotes("a < b"), "a < b");
  assert.strictEqual(stripQuotes("können>"), "können");
  assert.strictEqual(stripQuotes("<Zuständigkeit"), "Zuständigkeit");
});

test("reasoning blocks and code fences around an answer are removed", () => {
  assert.strictEqual(stripModelWrapping("<think>hm</think>\nensayo"), "ensayo");
  assert.strictEqual(stripModelWrapping("```json\n{}\n```"), "{}");
});

test("word count ignores runs of whitespace", () => {
  assert.strictEqual(wordCount("  el   ensayo clínico "), 3);
  assert.strictEqual(wordCount(""), 0);
  assert.strictEqual(wordCount(null), 0);
});

/* ---- one comparison form for four scripts ---- */

test("folding diacritics keeps the letters a script actually distinguishes", () => {
  /* Latin as before: the accent is decoration for a comparison. */
  assert.strictEqual(stripDiacritics("fármaco"), "farmaco");
  assert.strictEqual(stripDiacritics("récupère"), "recupere");
  /* Cyrillic: и and й are two letters, and folding one into the other made
     мой match мои. ё against е is the opposite case — Russian writes the
     two interchangeably in running text, so those do fold. */
  assert.strictEqual(stripDiacritics("мой"), "мой");
  assert.strictEqual(stripDiacritics("ходатайства"), "ходатайства");
  assert.strictEqual(stripDiacritics("ёлка"), "елка");
  /* Arabic: the vowel marks are optional in writing, so a model may answer
     with them where the text has none. Alef carries the same problem. */
  assert.strictEqual(stripDiacritics("غضّ"), "غض");
  assert.strictEqual(stripDiacritics("الْمُدَّعِي"), "المدعي");
  assert.strictEqual(stripDiacritics("أحمد"), "احمد");
});

/* ---- cutting a text into sentences ---- */

test("a text comes apart at the ends of its sentences", () => {
  assert.deepStrictEqual(
    toSentences("Ayer llovió. Anduvo por el parque. ¿Quién lo vio?"),
    ["Ayer llovió.", "Anduvo por el parque.", "¿Quién lo vio?"],
  );
});

/* Deliberately no list of abbreviations: that would be a language named
   outside a language pack, and it would cover the languages it was written in
   and no others. The rule that replaces it needs no words — a single letter
   before the stop is an abbreviation, and one-letter words end no sentence in
   any of the eight languages. */
test("an abbreviation is not the end of anything", () => {
  assert.deepStrictEqual(
    toSentences("Das war so. Und dann, z. B. am Montag, kam er."),
    ["Das war so.", "Und dann, z. B. am Montag, kam er."],
  );
  assert.deepStrictEqual(toSentences("See e. g. the note. Then stop."),
    ["See e. g. the note.", "Then stop."]);
});

test("Arabic ends a sentence its own way", () => {
  assert.deepStrictEqual(toSentences("هل ذهبت؟ نعم ذهبت. ثم عدت."),
    ["هل ذهبت؟", "نعم ذهبت.", "ثم عدت."]);
});

test("nothing in is nothing out", () => {
  assert.deepStrictEqual(toSentences(""), []);
  assert.deepStrictEqual(toSentences("   "), []);
  assert.deepStrictEqual(toSentences("Kein Punkt am Ende"), ["Kein Punkt am Ende"]);
});

/* What belongs on a flashcard as its example. A whole reading does not: the
   card is about one word, and a paragraph on the back of it is the text the
   reader already had. */
test("the sentence a word stands in, and only that one", () => {
  const text = "Ayer llovió. Anduvo por el parque. Nadie lo vio.";
  assert.strictEqual(sentenceWith(text, "parque"), "Anduvo por el parque.");
  /* A word of its own, not a part of one: "en" is not in "ensayo". */
  assert.strictEqual(sentenceWith("El ensayo fue largo. Se fue.", "en"),
    "El ensayo fue largo.", "found as a fragment where it is no word");
});

test("a fragment is found where a whole word is not", () => {
  /* A split verb arrives as "winkte + ab" and an alignment may give a form
     back in another shape. */
  assert.strictEqual(
    sentenceWith("Er kam an. Dann winkte er ab. Sie ging.", "winkte"),
    "Dann winkte er ab.",
  );
});

test("a word that is nowhere leaves a single sentence standing and no more", () => {
  assert.strictEqual(sentenceWith("Nur ein Satz.", "nichts"), "Nur ein Satz.");
  assert.strictEqual(sentenceWith("Eins. Zwei.", "nichts"), "",
    "a wrong sentence is worse on a card than none");
});

/* The other side of a card, where the word being searched for is an
   equivalent some other question answered and need not be the one the
   translator chose. Only where the two texts have the same number of
   sentences — that condition is what makes it safe rather than clever. */
test("the sentence in the same place, where both texts have as many", () => {
  const target = "Gestern regnete es. Er ging durch den Park. Niemand sah ihn.";
  assert.strictEqual(sentenceWith(target, "kommtNichtVor", { index: 1, total: 3 }),
    "Er ging durch den Park.");
  assert.strictEqual(sentenceWith(target, "kommtNichtVor", { index: 1, total: 4 }), "",
    "a text of another shape says nothing about where sentence two went");
});

test("the word wins over the place", () => {
  const target = "Gestern regnete es. Er ging durch den Park.";
  assert.strictEqual(sentenceWith(target, "Park", { index: 0, total: 2 }),
    "Er ging durch den Park.");
});

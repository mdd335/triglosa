/* The question asked about a single word or short phrase: what it becomes
   in another language.

   The dictionary prompt was already written with its source and target as
   parameters. What they do not reach comes from the reader's pack as well:
   examples written in one language make every note come back in it, and a
   spelling rule (umlauts and ß) belongs to one reader's language only. */

import { languagePack } from "../languages/index.js";

/* The whole text, when the device cannot do it.

   The device stays primary: it runs on the neural engine and therefore does
   not queue behind the other model calls, which is where the gain comes from
   — the same translation costs 4.5 s through the model inside a run against
   the 2.7 s it needs on its own. But the device refuses whole language pairs,
   and it fails outright now and then; without this the panel would simply
   stay empty. */
export function translatePrompt({ target }) {
  return (
    "You are a precise translation engine. Translate the user text into " +
    target +
    ". Output ONLY the translation - no commentary, no notes, no quotation marks around it. " +
    "Preserve line breaks, lists and formatting. " +
    "The result must be grammatically flawless and idiomatic in " +
    target +
    ": correct case, gender, agreement and word order. Render the meaning the way a native " +
    "speaker would phrase it, never word by word, and pick the word that fits the context " +
    "rather than the one that looks closest to the original. " +
    /* Measured: "¿me gusta?" came out as "Ich reise gerne." in German — the
       question was gone, while the English kept it. The sentence type is
       exactly what a learner reads off it. */
    "Keep the sentence type: a question stays a question, an imperative stays an " +
    "imperative, a negation stays negated."
  );
}

/* How the reader's own language has to be written, where it says so. German
   asks for its umlauts and its ß, because a model that drops them writes a
   note the reader reads as a typo; English asks for nothing. A language that
   names none contributes no rule, which is the generic path. */
export function readerSpelling(code) {
  return languagePack(code).spellingNote || "";
}

/* Up to three translations, with a short note on register or region.

   Its examples were German notes under Spanish and English words — six of
   them, teaching every reader of the app that a register note is written in
   German. Gone with the examples in every other prompt, and for the same
   measured reason. What is left is the rule: the note is in the reader's
   language, and the reader's own pack says how that language wants to be
   written.

   A note tells its line from the others, and may be left out: asked to
   say "what marks the word", the models wrote "usual" beside two lines of
   three, or "general", which marks nothing. Allowed an empty note, the
   cloud model leaves one line in three without and writes such a note in
   one entry of twenty-five instead of one of six; the local model never
   leaves one out (run thirty-nine). */
export function alternativesPrompt({ source, target, reader, spelling, capitalisesNouns }) {
  const capitals = capitalisesNouns
    ? "Write a noun with a capital first letter and every other word in lower case."
    : "Write it in lower case unless it is a proper name.";
  return [
    `You are a bilingual dictionary. Give up to 3 translations of the input into ${target}, ordered by how common they are.`,
    "",
    "HARD RULES:",
    `1. EVERY translation must be written in ${target}. Never output a word in ${source} or in any third language. If unsure, output fewer lines.`,
    "2. Output only 2 lines if there is no third good option. Never pad the list.",
    "3. Format per line, nothing else: <translation> | <note>",
    `4. <note> is in ${reader}, at most four words: register, region or usage.${spelling ? ` ${spelling}` : ""}`,
    `5. Where regional usage differs, say so in <note>, naming the region in ${reader}. Where it does not, say what sets this translation apart from the other lines - what it is said of, or that it is more formal, colloquial, dated, technical. Only the first line may be the usual one. A note that would fit any word says nothing: leave <note> empty rather than write one.`,
    `6. <note> is ALWAYS in ${reader}, even though the translation is not. Never write it in ${target}, and never in a third language.`,
    "7. No numbering, no bullets, no quotation marks, no headings, no extra text.",
    `8. Spell every translation correctly in ${target}, including all accents and special characters. ${capitals}`,
    "9. The input may be a rare, literary, technical or archaic word. Translate what it actually MEANS. Never guess from what the word looks like, and never reach for a word that merely resembles it in spelling or sound - in either language. False friends and look-alikes are the most common way to get this wrong.",
    "10. If you are unsure of the exact sense, give the closest honest equivalent of the meaning and output only that one line. One correct line beats three invented ones.",
    "11. The angle brackets mark the fields. Do not write them.",
  ].join("\n");
}

/* The sentence the input stands in, where the reader let it come along.
   With it the first line is the sense the input has there — half the wrong
   first lines of the entry without it, on both models, and the definition
   step that used to stand in front of this question added nothing more
   (runs twenty-eight and twenty-nine). The lines after it are the input's
   other meanings, so that the entry stays a dictionary: without that rule
   the sentence turned them into near-synonyms of the one sense. Allowed two
   near-synonyms where there was no other meaning, the cloud model gave them
   in two entries of three, and dressed some up as meanings of their own;
   held to one in all, and fewer lines called a good answer, it gives them
   in one of ten (run thirty).

   The note of another meaning is that meaning in the reader's language,
   which the window sets like a translation. The "=" in front tells it from
   the note of a near-synonym, which says how that one is used. Where the
   list is in the reader's language already the line says the meaning
   itself, and the note names where it belongs. */
export function alternativesInput({ source, target, reader = target, text, sentence }) {
  const lines = [`Source: ${source} | Target: ${target} | Input: ${text}`];
  if (sentence) {
    const note = reader === target
      ? "for those, <note> names the field or situation that meaning belongs to"
      : `for those, <note> is = and that meaning in ${reader}, in one to three words, nothing else`;
    lines.push(
      `The input stands in this sentence: ${sentence}`,
      "First line: the translation that fits the input in that sentence.",
      `Then one line for each OTHER common meaning of the input, at most two, most common first; ${note}.`,
      "A near-synonym of the first line is not another meaning. Give at most one near-synonym in all, and only if it is used differently (more formal, colloquial, regional). One or two lines are a good answer.",
    );
  }
  return lines.join("\n");
}

export function englishName(code) {
  return languagePack(code).englishName;
}

/* The two questions asked about a single word or short phrase: what it
   means in its own language, and what it becomes in another.

   The dictionary prompt was already written with its source and target as
   parameters. What phase 6 fixed is everything the parameters did not reach:
   its six examples all wrote their note in German, and rule 4 told every
   reader of the app to write umlauts and ß. Both are the reader's language,
   so both come from the reader's pack now. */

import { languagePack } from "../languages/index.js";
import { strings } from "../strings.js";

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

/* A monolingual definition first. It outranks the impression the spelling
   gives — that is what stops a look-alike from deciding the translation. */
export function definitionPrompt({ source, unknown }) {
  return [
    `You define a word or short phrase. Reply with ONE short sentence in ${source}, the way a monolingual ${source} dictionary would define it. Define the exact spelling you are given, not a similar-looking word in another language. If you do not know the word, reply with exactly: ${unknown}. No translation, no commentary, nothing else.`,
  ].join("\n");
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
   written. */
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
    `5. Where regional usage differs, say so in <note>, naming the region in ${reader}. Where it does not, say what marks the word instead - that it is the usual one, more formal, colloquial, dated, technical.`,
    `6. <note> is ALWAYS in ${reader}, even though the translation is not. Never write it in ${target}, and never in a third language.`,
    "7. No numbering, no bullets, no quotation marks, no headings, no extra text.",
    `8. Spell every translation correctly in ${target}, including all accents and special characters. ${capitals}`,
    "9. The input may be a rare, literary, technical or archaic word. Translate what it actually MEANS. Never guess from what the word looks like, and never reach for a word that merely resembles it in spelling or sound - in either language. False friends and look-alikes are the most common way to get this wrong.",
    "10. If you are unsure of the exact sense, give the closest honest equivalent of the meaning and output only that one line. One correct line beats three invented ones.",
    "11. The angle brackets mark the fields. Do not write them.",
  ].join("\n");
}

export function alternativesInput({ source, target, text, meaning }) {
  const lines = [`Source: ${source} | Target: ${target} | Input: ${text}`];
  if (meaning) {
    lines.push(`Meaning of the input in ${source}: ${meaning}`);
    lines.push("Translate that meaning. It outranks any impression the spelling gives you.");
  }
  return lines.join("\n");
}

/* The sentinel the definition prompt asks for when it does not know the
   word. It has to match what the parser looks for. */
export function unknownMarker(readerCode) {
  return strings(readerCode).unknownWord;
}

export function englishName(code) {
  return languagePack(code).englishName;
}

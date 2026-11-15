/* Asking the model what language a text is in — the last of three stages,
   after the function words and the platform's own recognizer.

   Nothing here is written by hand: the codes are every language the
   app supports, the names come from the platform's own table, and the
   spelling hints from whichever packs carry one. Adding a language adds
   nothing to write.

   Every supported language may be answered, not only the ones the user
   configured: a text in an unconfigured language keeps a panel of its own,
   and that cannot happen if the language is never named. The user's own
   languages stand first — they are the likeliest answers, and a list is read
   from the front. */

import { SUPPORTED, displayName, englishName, isChoosable, languagePack } from "../languages/index.js";

/* Languages the model is likely to meet outside the ten. Only examples —
   they show the expected shape of an answer, not a limit. Every one of them
   is a language the app does not offer, which is the whole point of the
   list. */
const EXAMPLES = ["nl", "sv", "da", "cs", "el", "he", "hi", "zh", "ja", "ko"];
/* Shown as "X not Y" pairs, so the model gives the reader's name for a
   language rather than what that language calls itself. Latin script only:
   a pair is no help where the reader cannot read the second half. */
const ENDONYM_EXAMPLES = ["nl", "sv", "da", "cs"];

function endonym(code) {
  const own = displayName(code, code);
  return own.charAt(0).toUpperCase() + own.slice(1);
}

/* The user's languages first, then the rest, each named once. */
function ordered(languages) {
  const out = [];
  /* A language without a pack that the reader set is one of the answers
     for them, by its code like the others. */
  for (const code of (languages || []).filter(isChoosable).concat(SUPPORTED)) {
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

/* A short input is often written the same way in more than one language —
   "empresa", "banco", "Hand" — and a reader learning Spanish and not
   Portuguese is reading Spanish. Named rather than pointed at: "the one that
   comes first in the list" moved the cloud model half as far and the local
   one not at all. */
export function ownLanguagesFirst(languages) {
  const own = (languages || []).filter(isChoosable);
  if (!own.length) return "";
  const names = own.map((c) => englishName(c)).join(", ");
  return ` If the input is a correct word or phrase in ${names}, reply with that language, even where it is also written that way in another language.`;
}

/* For an input of up to three words the reader's languages are gone through
   one by one, after the hints about a language's look and before the line
   about the answer's form: the hints had pulled "pronto" to Italian and
   "sobremesa" to Portuguese for a reader learning Spanish. Its last clause
   says again how a language outside the list is named — without it the
   cloud model answered a Ukrainian or Galician word with the first example,
   Dutch. Whole order replayed (run 87), shared words named as one of the
   reader's: cloud model 192 → 227 of 252 on Windows, local 178 → 193; no
   word of one language pulled into a reader's, words of languages without
   a pack named as before on the cloud model. In place of the sentence
   above, never beside it, and only for short inputs: a longer text is named
   before the model as a rule, and its question stays as it was measured. */
export function ownLanguagesChecked(languages) {
  const own = (languages || []).filter(isChoosable);
  if (!own.length) return "";
  const names = own.map((c) => englishName(c)).join(", then ");
  return ` Before judging its look, check the reader's languages in this order: ${names}. If the input is a correct word or phrase in one of them, reply with the first such language, even where another language writes it the same way. Only where it is correct in none of them, judge by its look; a language outside the list is named by its own name as told above, the examples there being examples only.`;
}

export function detectPrompt({ languages, reader, short = false }) {
  const inPlay = ordered(languages);
  const codes = inPlay.map((c) => `${c} (${englishName(c)})`).join(", ");
  const readerName = languagePack(reader).englishName;
  /* A language the reader set stands among the codes, so it is no example
     of the others. */
  const other = (c) => !inPlay.includes(c);
  const names = EXAMPLES.filter(other).map((c) => displayName(c, reader)).join(", ");
  const pairs = ENDONYM_EXAMPLES.filter(other).map((c) => `${displayName(c, reader)} not ${endonym(c)}`).join(", ");
  const hints = inPlay
    .map((c) => languagePack(c).spellingHints)
    .filter(Boolean)
    .join("; ");
  return (
    `You are a language detector. Reply with exactly one lowercase code and nothing else: ${codes}.` +
    (short ? "" : ownLanguagesFirst(languages)) + " " +
    `For any other language reply instead with its ${readerName} name and nothing else: ${names}, ... ` +
    `The name is ALWAYS the ${readerName} one, never what the language calls itself and never the English name: ${pairs}. ` +
    "The input is often a single word or a short phrase with no context. Judge it by its spelling, accents and word endings, not by guessing: " +
    hints +
    ". A rare or literary word is still judged the same way." +
    (short ? ownLanguagesChecked(languages) : "") +
    " No punctuation, no explanation."
  );
}

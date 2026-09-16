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

import { SUPPORTED, displayName, languagePack } from "../languages/index.js";

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
  for (const code of (languages || []).concat(SUPPORTED)) {
    if (SUPPORTED.includes(code) && !out.includes(code)) out.push(code);
  }
  return out;
}

/* A short input is often written the same way in more than one language —
   "empresa", "banco", "Hand" — and a reader learning Spanish and not
   Portuguese is reading Spanish. Named rather than pointed at: "the one that
   comes first in the list" moved the cloud model half as far and the local
   one not at all. */
export function ownLanguagesFirst(languages) {
  const own = (languages || []).filter((c) => SUPPORTED.includes(c));
  if (!own.length) return "";
  const names = own.map((c) => languagePack(c).englishName).join(", ");
  return ` If the input is a correct word or phrase in ${names}, reply with that language, even where it is also written that way in another language.`;
}

export function detectPrompt({ languages, reader }) {
  const inPlay = ordered(languages);
  const codes = inPlay.map((c) => `${c} (${languagePack(c).englishName})`).join(", ");
  const readerName = languagePack(reader).englishName;
  const names = EXAMPLES.map((c) => displayName(c, reader)).join(", ");
  const pairs = ENDONYM_EXAMPLES.map((c) => `${displayName(c, reader)} not ${endonym(c)}`).join(", ");
  const hints = inPlay
    .map((c) => languagePack(c).spellingHints)
    .filter(Boolean)
    .join("; ");
  return (
    `You are a language detector. Reply with exactly one lowercase code and nothing else: ${codes}.` +
    ownLanguagesFirst(languages) + " " +
    `For any other language reply instead with its ${readerName} name and nothing else: ${names}, ... ` +
    `The name is ALWAYS the ${readerName} one, never what the language calls itself and never the English name: ${pairs}. ` +
    "The input is often a single word or a short phrase with no context. Judge it by its spelling, accents and word endings, not by guessing: " +
    hints +
    ". A rare or literary word is still judged the same way. No punctuation, no explanation."
  );
}

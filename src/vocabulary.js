/* Which entries are worth showing at all.

   Three filters sit behind the model: what a learner already knows, what is
   only an English word in disguise, and how long a phrase may get. All three
   ask a language pack rather than knowing any language themselves. */

import { stripDiacritics } from "./text.js";
import { LOANWORDS } from "./languages/loanwords.js";
import { SUPPORTED, languagePack, wordSet } from "./languages/index.js";

/* A hyphen separates words, the same way the tokenizer in text.js sees it.
   Kept, a "Learning-Agreement" would stay one unknown token and slip past
   the loanword filter that "Learning Agreement" trips. */
function plainWords(s) {
  return stripDiacritics(String(s || ""))
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/* An entry is trivial when ALL of its words are everyday vocabulary or
   function words of that language. A phrase falls only when nothing in it
   goes beyond that: "sobre la mesa" goes, "el puente" stays — a puente is a
   long weekend, not a bridge.
   stripDiacritics leaves the ß alone, hence the ss above: otherwise "Straße"
   would never find its entry. */
export function isBasicWord(s, code) {
  const basic = wordSet(code, "basicWords");
  const frequent = wordSet(code, "functionWords", "auxiliaries");
  const parts = plainWords(s);
  if (!parts.length) return false;
  return parts.every((w) => basic.has(w) || frequent.has(w));
}

/* An English word inside non-English text. The suffix rule fires only where
   a language says its own words do not end that way — French -ment and
   -ance are native, and German has Dokument and Element. */
export function isLoanword(s, code) {
  if (code === "en") return false;
  const suffixes = languagePack(code).loanwordSuffixes;
  const parts = plainWords(s);
  if (!parts.length) return false;
  return parts.some(
    (w) => LOANWORDS.has(w) || (suffixes && w.length > 4 && suffixes.test(w)),
  );
}

/* Is this a function word in any of the languages in play? Defaults to all
   of them: the caller often holds a phrase whose language it does not know,
   and a word that is a function word somewhere carries no meaning worth
   counting here either. */
export function isFunctionWord(s, codes) {
  const word = stripDiacritics(String(s || ""))
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}ß]+|[^\p{L}\p{N}ß]+$/gu, "");
  if (!word) return false;
  return (codes && codes.length ? codes : SUPPORTED).some((c) => wordSet(c, "functionWords").has(word));
}

/* How many meaning-carrying words are in there? Articles and prepositions do
   not count — otherwise "caja de cambios" for "Getriebe" would be as long as
   "Hacer clic de nuevo" for "Nochmal", and one of those is an equivalent
   while the other is half a sentence. */
export function contentWordCount(s, codes) {
  return String(s || "")
    .split(/[\s+…]+|\.{2,}/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((w) => w && !isFunctionWord(w, codes)).length;
}

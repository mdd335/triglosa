/* The synonym line under the explanation.

   Unlike the other parsers, a missing pipe says NOTHING here: with a single
   synonym there is none. Everything else is taking away, never adding — what
   the model does not deliver is better missing than filled in. */

import { cleanLine, flattenField, stripDiacritics, stripQuotes, wordCount } from "../text.js";
import { contentWordCount } from "../vocabulary.js";
import { isPartOfTerm } from "./terms.js";

export const MAX_SYNONYMS = 3;
/* Above this length a term is a phrase, and a phrase has no synonyms worth
   asking for. */
export const MAX_SYNONYM_WORDS = 2;

export function asksForSynonyms(term) {
  return wordCount(term) <= MAX_SYNONYM_WORDS;
}

export function parseSynonyms(raw, term, codes) {
  const line = String(raw || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)[0];
  if (!line) return [];

  /* The same bar as for the spots, and for the same reason: it hangs on the
     length of the term rather than on a fixed number. One meaning-carrying
     word more than the term is allowed — beyond that it is the paraphrase
     the prompt forbids. */
  const limit = contentWordCount(term, codes) + 1;
  const seen = new Set();
  const out = [];
  for (const field of line.split("|")) {
    if (out.length >= MAX_SYNONYMS) break;
    const s = flattenField(stripQuotes(field));
    /* The dash is the agreed answer for "there is none". It stands alone
       then — "ad-hoc" stays a synonym. */
    if (!s || /^[-–—]+$/.test(s)) continue;
    /* "-tional" for "Constitutional": a piece of the word, not a word. */
    if (/^[-–—]\p{L}/u.test(s)) continue;
    if (contentWordCount(s, codes) > limit) continue;
    /* A word is no synonym of itself. The check is independent of accents
       and capitalisation and catches a part of a phrase at the same time:
       "crédito" is no synonym of "línea de crédito". An inflected form goes
       unrecognized — only the prompt stands against that. */
    if (isPartOfTerm(s, term)) continue;
    const key = stripDiacritics(s).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

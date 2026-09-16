/* Up to three translations of one word, each with a short note.

   Used only in short mode, where a single word or phrase gets alternatives
   instead of one translation: which of three words to use is exactly what a
   dictionary is for, and picking one for the reader throws that away. */

import { cleanLine, stripQuotes } from "../text.js";
import { languagePack } from "../languages/index.js";

export const MAX_ALTERNATIVES = 3;

/* Where the model does not know a word it sometimes writes so into the list
   instead of leaving the line out. Printed as a translation that is worse
   than a shorter list. */
const NOTHING = /^(unbekannt|unknown|desconocid[oa]|kein bekanntes wort|n\/a|keine|none|-+)$/i;

/* A dictionary writes its headwords in lower case, and the model writes them
   as though each began a sentence — "Pagar", "Caja" for a lookup of "pagar".
   Where the word that was looked up began with a small letter, so does every
   translation of it. Not where it began with a capital, which is where a
   name or a noun of a capitalising language was asked about; not in a script
   that has no capitals, where there is nothing to go by; not for a word
   written in capitals throughout, which is an abbreviation; and not in a
   target language that capitalises its nouns, where a capital may be the
   correct spelling and the pack is the only one who could say. */
function asHeadword(text, input, target) {
  if (languagePack(target).capitalisesNouns) return text;
  const first = String(input || "").trim().charAt(0);
  if (!first || first === first.toUpperCase() || first !== first.toLowerCase()) return text;
  const lead = text.charAt(0);
  const next = text.charAt(1);
  if (next && next === next.toUpperCase() && next !== next.toLowerCase()) return text;
  return lead.toLowerCase() + text.slice(1);
}

export function parseAlternatives(raw, input, reader, target) {
  const normalize = languagePack(reader).normalizeNote;
  const asked = String(input || "").trim().toLowerCase();
  const seen = new Set();
  const out = [];

  for (const line of String(raw || "").split(/\r?\n/)) {
    const L = cleanLine(line);
    if (!L) continue;
    const cut = L.indexOf("|");
    const text = asHeadword(stripQuotes(cut === -1 ? L : L.slice(0, cut)), input, target);
    if (!text) continue;

    const key = text.trim().toLowerCase();
    /* The word itself is not a translation of itself, and the same word
       twice is one entry. */
    if (!key || key === asked || seen.has(key) || NOTHING.test(key)) continue;
    seen.add(key);

    const note = stripQuotes(cut === -1 ? "" : L.slice(cut + 1));
    out.push({ text, note: normalize ? normalize(note) : note });
    if (out.length >= MAX_ALTERNATIVES) break;
  }
  return out;
}

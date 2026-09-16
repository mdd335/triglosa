/* Abbreviations.

   The model resolves them confidently and sometimes wrongly — RLVR came back
   as "Reinforcement Learning from Human Feedback" throughout, which is RLHF.
   Where the expansion does not stand in the text, it is marked as a guess: a
   false certainty is the worst result this section can produce. */

import { stripDiacritics, stripQuotes, wordCount } from "../text.js";
import { hedgePattern, strings } from "../strings.js";

/* Also inside a multipart entry. "RLVR runs" carries an abbreviation but
   failed the check, and then an invented expansion stood there without any
   caveat at all. */
export function looksLikeAbbreviation(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .some((t) => /^\p{Lu}[\p{Lu}\p{N}]{1,6}s?$/u.test(t));
}

/* Field 2 of an abbreviation carries two things: first the expansion in the
   language of the text, then, after the dash, its translation — "Large
   Language Model – großes Sprachmodell". Only the front part is ever
   checked. The translated half naturally does not stand in the foreign text
   and does not carry the abbreviation's initials either; checking it too
   would declare every expansion a guess. */
export function expansionPart(meaning) {
  return String(meaning || "").split(/\s[–—-]\s/)[0].trim();
}

/* Do the letters of the abbreviation fit the expansion? By the rule that has
   established itself in the literature on abbreviation detection: the FIRST
   letter has to sit at the start of a word, the rest may follow anywhere
   after it, only in order.

   Comparing word beginnings alone is not enough: German abbreviates its
   compounds from the inside — DSGVO sits inside
   "Datenschutz-Grundverordnung" spread over four word parts, and a pure
   word-start test would stamp a correct expansion as guessed. The other way
   round the rule catches exactly the case that matters: where the model
   delivers a plain translation instead of an expansion ("IVA |
   Mehrwertsteuer"), no letter fits.

   This is expressly not proof of a CORRECT expansion — the measured misfire
   "RLVR | Reinforcement Learning from Visual Rewards" fits letter by letter
   and still means Verifiable. The test only works in the other direction,
   which is why the caveat stays in both cases. */
export function initialsMatch(abbreviation, expansion) {
  const letters = stripDiacritics(String(abbreviation || ""))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .replace(/s$/, "");
  const target = stripDiacritics(String(expansion || "")).toLowerCase();
  if (!letters || !target) return false;

  const isLetter = (ch) => /[\p{L}\p{N}]/u.test(ch);
  for (let start = 0; start < target.length; start++) {
    /* Only word beginnings are anchors. */
    if (!isLetter(target.charAt(start))) continue;
    if (start > 0 && isLetter(target.charAt(start - 1))) continue;
    if (target.charAt(start) !== letters.charAt(0)) continue;
    let j = 1;
    for (let i = start + 1; i < target.length && j < letters.length; i++) {
      if (target.charAt(i) === letters.charAt(j)) j++;
    }
    if (j === letters.length) return true;
  }
  return false;
}

const normalized = (x) =>
  stripDiacritics(String(x)).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/* Not on character equality but on a shared beginning: where the text is
   already in the reader's language, the expansion is too, and the model
   likes to append a second version differing by one letter — measured
   "Elektronisches Steuerhilfsprogramm – elektronisches Steuerhilfeprogramm".
   Two statements alike over sixty percent of their length are one. */
function sameStatement(x, y) {
  const a = normalized(x);
  const b = normalized(y);
  if (!a || !b) return a === b;
  if (a === b) return true;
  const shorter = Math.min(a.length, b.length);
  let i = 0;
  while (i < shorter && a.charAt(i) === b.charAt(i)) i++;
  return shorter >= 6 && i >= 0.6 * shorter;
}

/* Two malformed answers, both measured, both cheaper to handle in code than
   in the prompt: the model repeats the abbreviation instead of expanding it
   ("GPQA | GPQA"), and it fills the translated half with what already stands
   in front of it ("Datenschutz-Grundverordnung – DSGVO"). Neither is a
   statement; both are repetition.

   Returns "" when nothing usable is left — an empty field is better than a
   worthless one. */
export function normalizeAbbreviation(meaning, abbreviation) {
  const parts = String(meaning || "").trim().split(/\s[–—-]\s/);
  const expansion = (parts[0] || "").trim();
  if (!expansion || sameStatement(expansion, abbreviation)) return "";
  /* An expansion consists of words. Where the answer falls apart — measured:
     "ERE | Er、"Entlassung"" — the field is worthless. */
  if (/[^\p{L}\p{N} \-&./]/u.test(expansion)) return "";
  const rest = parts.slice(1).join(" – ").trim();
  if (!rest || sameStatement(rest, abbreviation) || sameStatement(rest, expansion)) {
    return expansion;
  }
  return `${expansion} – ${rest}`;
}

/* The answer to the abbreviation question. A bare dash means "cannot be
   placed", and that is a good answer — then what the meaning call delivered
   stands. */
export function parseAbbreviation(raw, abbreviation) {
  const line = String(raw || "")
    .split("\n")
    .map(stripQuotes)
    .filter(Boolean)[0];
  if (!line || /^[-–—]+$/.test(line.trim())) return "";
  const fields = line.split("|").map((x) => stripQuotes(x).trim());
  const expansion = fields[0] || "";
  const translated = (fields[1] || "").replace(/^[-–—]+$/, "").trim();
  if (!expansion || /^[-–—]+$/.test(expansion)) return "";
  return normalizeAbbreviation(translated ? `${expansion} – ${translated}` : expansion, abbreviation);
}

/* The abbreviation line in its three parts, because it stands there in three
   colours: the caveat greyed out, the expansion white, the translation
   muted. As ONE string it is still needed by everyone who does not draw it —
   Anki, the raw line, the click tests.

     expansion stands in the text -> no addition at all, it is evidenced
     initials fit                 -> the short caveat, one word
     otherwise                    -> the full warning

   lang is the language the reader gets explanations in. */
export function abbreviationParts(meaning, text, abbreviation, lang) {
  const words = strings(lang);
  const empty = (t) => ({ caveat: "", expansion: "", translation: "", text: t });

  let d = String(meaning || "").trim();
  /* Nothing in, nothing out. Something unusable in, and the reader still
     learns that this was an abbreviation. */
  if (!d) return empty("");
  /* Strip a caveat the model put there itself rather than leaving it: which
     level fits is decided here, and decided better — the model writes its
     warning even in front of an expansion standing verbatim in the text. */
  d = d.replace(hedgePattern(lang), "");
  d = normalizeAbbreviation(d, abbreviation);
  if (!d) return empty(words.unresolvedAbbreviation);

  const expansion = expansionPart(d);
  const translation = d.slice(expansion.length).replace(/^\s*[–—-]\s*/, "").trim();

  const low = stripDiacritics(String(text || "")).toLowerCase();
  const parts = stripDiacritics(expansion)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3);
  /* Where the expansion stands in the text like this, it is evidenced and
     stays unmarked. Compared on a stem, so an inflected form still counts. */
  const evidenced =
    parts.length > 0 &&
    parts.every((w) => low.includes(w.slice(0, Math.max(4, w.length - 2))));

  const caveat = evidenced ? "" : initialsMatch(abbreviation, expansion) ? words.likely : words.couldStandFor;
  return {
    caveat,
    expansion,
    translation,
    text: (caveat ? `${caveat}: ` : "") + expansion + (translation ? ` – ${translation}` : ""),
  };
}

export function asGuess(meaning, text, abbreviation, lang) {
  return abbreviationParts(meaning, text, abbreviation, lang).text;
}

/* A phrase is a term of art or an expression; it practically never has a
   second meaning. The prompt rule for it does not hold — "ferrocarril
   subterráneo" turned into "U-Bahn, unterirdische Eisenbahn" in one run of
   three. Mechanical, without semantics: with more than one word the first
   equivalent stands. */
export function withoutSecondMeaning(meaning, term) {
  return wordCount(term) > 1 ? String(meaning || "").split(",")[0].trim() : meaning;
}

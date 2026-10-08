/* Finding, in one panel's text, the spot an entry refers to.

   Three stages, because the model gives three kinds of answer: the wording
   verbatim, a multipart field joined by a plus or an ellipsis, and a form it
   inflected on its own. Everything here is pure — turning ranges into
   coloured spans happens in ui/.

   The promise throughout: no highlight is better than the wrong one. */

import {
  containsWord,
  flattenField,
  isUnspaced,
  isWordChar,
  stripDiacritics,
  toTokens,
  wordIndexOf,
  wordMayEnd,
  wordMayStart,
} from "../text.js";
import { contentWordCount, isFunctionWord } from "../vocabulary.js";

/* First occurrence at word boundaries, as a range. The same rule as
   highlighting, it just returns the position instead of colouring. */
export function rangeOf(fullText, fragment) {
  const f = String(fragment || "").trim();
  if (!fullText || !f || f === "-") return null;
  const at = wordIndexOf(String(fullText).toLowerCase(), f.toLowerCase());
  return at === -1 ? null : { start: at, end: at + f.length };
}

/* A Hangul block is a syllable of two or three letters, and a Korean word
   of two blocks is as long as a Latin one of six. Counted as three letters
   wherever a length is a bar. */
const HANGUL = /\p{Script=Hangul}/gu;
const letters = (word) => word.length + 2 * (word.match(HANGUL) || []).length;

/* A run of two letters is too short to be found by itself — "de", "in" —
   while in a script without spaces a word of one or two characters is most
   words, and found only where it stands as a word of its own. */
const tooShort = (candidate) => (isUnspaced(candidate) ? candidate.length < 1 : letters(candidate) < 3);

/* The longest run of words from an entry that really stands in the text.
   Tried from the first word, then the second, and so on: the model hands
   back a dictionary form, the text carries an inflected one — "mehreren
   Vorbehalte" against "mehrere Vorbehalte" in the text. What is displayed
   stays the dictionary form, because that is what one looks up. */
export function longestRunInText(text, item, codes) {
  const parts = String(item || "").trim().split(/\s+/);
  const low = String(text || "").toLowerCase();
  /* A run of two letters is too short to find by itself — except an
     abbreviation written in capitals, "ML" or "EU", which is exactly the
     item a reader cannot look up. Found with its case, so "ML" does not stand
     on "ml" for millilitres. */
  if (parts.length === 1 && /^\p{Lu}[\p{Lu}\p{N}]$/u.test(parts[0])) {
    const at = wordIndexOf(String(text || ""), parts[0]);
    return at === -1 ? "" : parts[0];
  }
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(i).join(" ");
    if (tooShort(candidate) || isFunctionWord(candidate, codes)) continue;
    const at = wordIndexOf(low, candidate.toLowerCase());
    if (at === -1) continue;
    return String(text).slice(at, at + candidate.length);
  }
  /* Only once nothing stands there verbatim: the same words with another
     ending. Kept a stage apart so an exact spot always wins over an
     inflected one, even when the inflected one comes first in the text.
     Not in a script without spaces: two words there that start alike are
     two words, not one word with two endings. */
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(i).join(" ");
    if (tooShort(candidate) || isUnspaced(candidate) || isFunctionWord(candidate, codes)) continue;
    const run = stemRunInText(text, candidate);
    if (run) return run;
  }
  return "";
}

/* How much of two words has to agree before they count as the same word in
   another form, and how much of the ending may differ.

   The model answers ходатайство where the text says ходатайства, and a
   correct item was dropped because the app needs the exact spot to
   highlight. What has to be kept out is a different word that merely starts
   alike: ход- is three letters shared by ходить and ходатайство.

   So the ending may take three characters of the longer word, three
   characters have to agree in each word — and five have to agree across the
   whole expression, which is the bar rather than a per-word one. Otherwise
   нужды against нужд fails on four letters and takes общедомовых with it,
   while sein against seine, alone, is exactly the four-letter accident the
   bar exists to refuse. */
const STEM_MIN_WORD = 3;
const STEM_MIN_RUN = 5;
const STEM_TAIL = 3;

function sharedPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a.charAt(i) === b.charAt(i)) i++;
  return i;
}

/* How much of two words agrees, or -1 where the ending diverges too far.
   Diacritics are folded, as everywhere a comparison rather than a tense is
   at stake. */
function stemAgreement(one, other) {
  const a = stripDiacritics(one).toLowerCase();
  const b = stripDiacritics(other).toLowerCase();
  if (a === b) return letters(a);
  /* Korean writes its particles and endings onto the word: 경제가 is 경제
     and a particle. The whole word has to stand in front, and what follows
     is at most an ending's three blocks — 경제학 is another word, and a verb
     whose stem changes as it is conjugated is left unmarked. */
  if (a.match(HANGUL)) {
    return a.length >= 2 && b.startsWith(a) && b.length - a.length <= STEM_TAIL ? letters(a) : -1;
  }
  const shared = sharedPrefix(a, b);
  if (shared < STEM_MIN_WORD) return -1;
  if (shared < Math.max(a.length, b.length) - STEM_TAIL) return -1;
  return shared;
}

/* The candidate's words against consecutive words of the text, each allowed
   an ending of its own. Returns the TEXT's wording — that is the spot to be
   highlighted, while what is displayed stays what the model answered. */
function stemRunInText(text, candidate) {
  const wanted = String(candidate).trim().split(/\s+/);
  const words = toTokens(text).filter((t) => t.isWord);
  for (let i = 0; i + wanted.length <= words.length; i++) {
    let agreed = 0;
    for (let k = 0; k < wanted.length; k++) {
      const shared = stemAgreement(wanted[k], words[i + k].text);
      if (shared < 0) { agreed = -1; break; }
      agreed += shared;
    }
    if (agreed >= STEM_MIN_RUN) {
      return String(text).slice(words[i].start, words[i + wanted.length - 1].end);
    }
  }
  return "";
}

/* A verb form the model named correctly and the text does not hold in one
   piece: a German separable verb, or an auxiliary standing far from its
   participle. Every model in every regime lost these, and none of it is
   about knowing the language — the form is right, its place is split.

   Written with a plus, which is the notation the alignment already uses and
   `rangesOf` already reads. The parts must come in the order the form has
   them and stay inside one sentence: ab before winkte is a different
   sentence, not this verb. */
export function formInText(text, form) {
  /* A plus the model wrote itself is a boundary like a space: it named
     "had + vanished" for a form the text has in one piece, and the plus,
     looked for as a word, lost the form. */
  const f = String(form || "").trim().split(/\s*\+\s*/).filter(Boolean).join(" ");
  if (!f) return "";
  if (containsWord(text, f)) return f;
  const parts = f.split(/\s+/);
  if (parts.length < 2) return "";

  const full = String(text);
  const low = full.toLowerCase();
  let from = 0;
  let firstStart = -1;
  for (const part of parts) {
    const at = wordIndexOf(low.slice(from), part.toLowerCase());
    if (at === -1) return "";
    if (firstStart === -1) firstStart = from + at;
    from += at + part.length;
  }
  /* One sentence, or the two halves belong to different statements. */
  if (/[.!?…]/.test(full.slice(firstStart, from))) return "";
  return parts.join(" + ");
}

/* Merge ranges with nothing but whitespace between them. A space is not a
   gap: both parts belong in one frame. With a word in between they stay two
   groups. */
export function mergeRanges(fullText, ranges) {
  const out = [];
  for (const r of ranges.slice().sort((x, y) => x.start - y.start)) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else if (last && !/\S/.test(fullText.slice(last.end, r.start))) {
      last.end = r.end;
    } else {
      out.push({ start: r.start, end: r.end });
    }
  }
  return out;
}

/* All spots a fragment could sit at, most exact first: verbatim, then
   without diacritics, then a suffix match inside a longer word. The third
   stage is what makes a German compound highlightable — "Kündigungsfrist"
   for "Frist" — and it needs the length floor, or "in" would colour every
   "Termin". */
export function spotsFor(fullText, fragment) {
  const f = String(fragment || "").trim();
  if (!f || f === "-") return [];
  const raw = String(fullText);
  const out = [];

  const collect = (haystack, needle, inside) => {
    if (!needle) return;
    let from = 0;
    let at;
    while ((at = haystack.indexOf(needle, from)) !== -1) {
      const end = at + needle.length;
      const left = !isWordChar(needle.charAt(0)) || wordMayStart(raw, at);
      const right = !isWordChar(needle.charAt(needle.length - 1)) || wordMayEnd(raw, end);
      if ((left && right) || (inside && right && needle.length >= 4)) {
        out.push({ start: at, end });
      }
      from = at + 1;
    }
  };

  collect(raw.toLowerCase(), f.toLowerCase(), false);
  const plainText = stripDiacritics(raw).toLowerCase();
  const plainFragment = stripDiacritics(f).toLowerCase();
  collect(plainText, plainFragment, false);
  collect(plainText, plainFragment, true);
  return out;
}

/* Claim the first spot still free — or, where the word aligner said
   whereabouts the fragment stands, the free one nearest to there: a word
   that stands twice in a translation is marked where it was meant. Nothing
   may overlap — one place in the text carries one colour. */
export function claimSpot(marks, fullText, fragment, cls, near = null) {
  const free = spotsFor(fullText, fragment).filter((spot) => !marks.some((m) => spot.start < m.end && spot.end > m.start));
  if (!free.length) return false;
  const spot = near === null
    ? free[0]
    : free.reduce((best, other) => (Math.abs(other.start - near) < Math.abs(best.start - near) ? other : best));
  marks.push({ start: spot.start, end: spot.end, cls });
  return true;
}

/* Turn field A or B into the spots inside one panel's text.

   codes names the languages of the run — the entry and the panel do not
   share one. Without it every function word of all ten packs counts, and
   a Portuguese "dos" would silently shorten a Spanish field. */
export function rangesOf(fullText, fragment, entry, codes, { passage = false } = {}) {
  const f = String(fragment || "").trim();
  if (!f || f === "-") return null;

  /* The bar hangs on the length of the chosen entry, not on a fixed number.
     A fixed limit of six words let "Clicking on it again" through for
     "Nochmal" — four words, under the limit, and still the whole clause
     instead of "again". One word more than the entry is allowed: "Getriebe"
     becomes "caja de cambios" in Spanish. Two more are a sentence. */
  const own = contentWordCount(entry, codes);
  /* A passage is a clause, and a clause in another language routinely takes
     a few words more: the bar grows with it, by half. */
  const bar = passage ? Math.max(own + 1, Math.ceil(own * 1.5)) : own + 1;
  if (contentWordCount(f, codes) > bar) return null;

  /* 1. Verbatim and in one piece — the normal case. */
  const whole = rangeOf(fullText, f) || rangeOf(fullText, flattenField(f));
  if (whole) return [whole];

  /* 2. Multipart. The prompt asks for a plus sign, but measurement shows
     ellipses just as often ("warfen...das Handtuch"). Split on both. */
  const out = [];
  for (const part of f.split(/\s*(?:\+|\.{2,}|…)\s*/)) {
    const t = part.trim();
    if (!t) continue;
    let range = rangeOf(fullText, t);
    /* 3. Not verbatim, because the model inflected it: take the longest
       piece that really stands there. */
    if (!range) {
      const run = longestRunInText(fullText, t, codes);
      if (run) range = rangeOf(fullText, run);
    }
    if (range) out.push(range);
  }
  return out.length ? mergeRanges(fullText, out) : null;
}

/* Does the fragment, at some place it stands in the text, cover a
   meaning-carrying word of text[range.start, range.end)? A term found for
   a looked-up word in its sentence has to: the rest of the sentence is its
   context, and a function word shared with it is no reason to explain a
   phrase next to it. */
export function coversRange(text, fragment, range, codes) {
  return spotsFor(text, fragment).some((spot) => {
    const from = Math.max(spot.start, range.start);
    const to = Math.min(spot.end, range.end);
    return from < to && contentWordCount(String(text).slice(from, to), codes) > 0;
  });
}

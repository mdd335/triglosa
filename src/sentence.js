/* The sentence a looked-up word stands in, which goes along with it.

   A dictionary entry for a word alone gives its common senses, none of
   them the one it carries here. With its sentence the first line is the
   sense meant — half the wrong first lines on both models (runs
   twenty-eight and twenty-nine).

   What goes along is the sentence and nothing more, cut here, on the
   reader's machine, out of the text the program gave: at most SENTENCE_MAX
   words, so the settings can say how much leaves it (author 2026-09-24). A
   longer sentence is cut at its semicolons, colons and dashes, and only
   where a clause is itself too long to a window of words around the word.

   The same cut makes the sentence under the pointer, which is read as a
   text of its own (author 2026-09-25): the whole sentence, not a clause,
   up to POINTER_SENTENCE_MAX words. */

import { stripDiacritics, wordPieces } from "./text.js";
import { SUPPORTED, wordSet } from "./languages/index.js";

/* The most words that go along. */
export const SENTENCE_MAX = 30;

/* The most words of a sentence read under the pointer. It is what the
   reader asked for, so more than goes along with a word; the bound is for
   text that has no sentence ends at all, such as a list or a table. */
export const POINTER_SENTENCE_MAX = 60;

/* Where a sentence ends: after a stop and before the next text or a line
   break, with the exception `toSentences` in text.js makes too: a stop after
   a single letter is an abbreviation ("z. B.", "e. g."). A stop before a
   word in small letters ends nothing either ("bzw. etwas", "e.g. apples",
   "dann … kam"); in a script without small letters this asks nothing.
   Closing quotation marks and brackets after the stop belong to the
   sentence, and so does a reference: "[12]", a superscript number, or a
   footnote number a PDF prints on the line ("courts.4"). A line break ends
   one whatever stands before it, unless it breaks a word: a letter and a
   hyphen before it, a letter after it. */
const STOP = /[.!?…؟۔。！？]/u;
const CLOSING = /[\s)\]"'”’»“‘›」』）]+$/u;
const REFERENCE = /(?:\[[^[\]\s]{1,10}\]|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)+$/u;
const FOOTNOTE = /(?<=\p{L}[.!?…]["'”’»“‘›]*)\d{1,3}$/u;
/* After a space only a mark that can only close: a straight quotation mark
   there opens the next sentence ('had. "Are you sure?"'). */
const OPENS_CLOSING = /^[)\]"'”’»“‘›」』）]|^\s+[)\]”’»›」』）]/u;

function endsSentence(text, i) {
  const next = text.slice(i, i + 3);
  if (OPENS_CLOSING.test(next) || /^\s*\p{Ll}/u.test(text.slice(i, i + 12))) return false;
  const head = text.slice(Math.max(0, i - 60), i)
    .replace(REFERENCE, "")
    .replace(FOOTNOTE, "")
    .replace(CLOSING, "");
  if (!STOP.test(head.at(-1) || "")) return false;
  const before = head.slice(0, -1).match(/(\S+)$/u)?.[1] || "";
  if (/^\p{L}$/u.test(before)) return false;
  if (head.at(-1) !== ".") return true;
  /* A number standing alone, not the end of a score or a time ("3:2."). */
  if (/^\d{1,2}$/.test(before)) return false;
  return !abbreviates(head.slice(0, -1).match(/\p{L}+$/u)?.[0] || "", text.slice(i, i + 4));
}

/* A full stop that shortens a word rather than ending a sentence, told by
   the shape of what stands before and after it — never by a list of
   abbreviations, which every language has its own of:

   - a word of letters with no vowel among them is no word ("Dr.", "Mr.",
     "St.", "Nr.", "vgl."), unless it is all capitals, which is a name said
     by its letters ("SPD", "BBC") and ends a sentence like any other;
   - a number of one or two digits is counted ("am 3. Oktober", "1. FC"),
     where a sentence seldom ends in one and a year never does;
   - a short word before a number or an opening bracket names what the
     number counts or whom the bracket dates ("Fig. 3", "ca. 5",
     "et al. (2020)") — a sentence rarely starts with either.

   Wrong, each joins two sentences that could have stood apart; the cut it
   avoids left half of one ("Smith arrived in St."). */
const VOWEL = /[aeiouyаеёиоуыэюя]/iu;
function abbreviates(word, after) {
  if (!/^[\p{Script=Latin}\p{Script=Cyrillic}]+$/u.test(word)) return false;
  if (word.length >= 2 && word.length <= 5 && /\p{Ll}/u.test(word) && !VOWEL.test(word.normalize("NFD"))) return true;
  return word.length <= 4 && /^\s*[\d([]/.test(after);
}

const brokenWord = (text, i) =>
  text[i - 1] === "-" && /\p{L}/u.test(text[i - 2] || "") && /\p{L}/u.test(text[i + 1] || "");

/* A line's end, in whatever a program writes it with: Word gives a
   paragraph's as a carriage return and a line broken by hand as a vertical
   tab (measured through UI Automation), and a heading ran into the
   sentence under it. */
const BREAK = /[\n\r\v\u2028\u2029]/;

const boundary = (text, i) =>
  BREAK.test(text[i]) ? !brokenWord(text, i) : /\s/.test(text[i]) && endsSentence(text, i);

/* Chinese and Japanese start the next sentence right after the full-width
   stop, with no space: text[i] is then the first character of a sentence.
   The stop's closing quotes and brackets stay with the sentence they
   close. */
const FULL_STOP = /[。！？][”’」』）》]*$/u;
const startsAfterFullStop = (text, i) =>
  i > 0 && /[^\s。！？”’」』）》]/u.test(text[i] || "") && FULL_STOP.test(text.slice(Math.max(0, i - 8), i));

/* A page may give no space after a reference that is a link — Chrome gives
   "verwandelt.[12]Danach" (measured) — so a capital right after a stop and
   a reference starts a sentence of its own. */
const AFTER_REFERENCE = /\p{L}[.!?…]["'”’»“‘›]*(?:\[[^[\]\s]{1,10}\]|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)+$/u;
const startsAfterReference = (text, i) =>
  /[\p{Lu}\p{Lt}]/u.test(text[i] || "") && AFTER_REFERENCE.test(text.slice(Math.max(0, i - 40), i));

/* A word broken over two lines, joined again with its hyphen: "Fahr-rad"
   rather than guessing whether the hyphen was the word's own. A word
   joiner stands where the shell took a unit out of the text and kept its
   place — the line break Safari gives after a formula in a line — and is
   dropped with it. */
const BROKEN = /(?<=\p{L}-)[\n\r\v\u2028\u2029](?=\p{L})|\u2060/gu;
/* A PDF's own text may give the break as a space instead ("pre- train",
   "re- sults": PDFKit, measured in a two-column paper), which reads as two
   words and is looked up as two. Joined the same way, unless what follows
   is a conjunction of any language's pack: "Vor- und Nachteile" and
   "pre- and post-war" are written with that space. */
const SPACED = /(?<=\p{Ll}-) (?=(\p{Ll}+))/gu;
let conjunctions = null;
const joinsWords = (word) => {
  conjunctions ||= new Set(SUPPORTED.flatMap((code) => [...wordSet(code, "conjunctions")]));
  return conjunctions.has(stripDiacritics(word).toLowerCase());
};
const joined = (text) => text.replace(BROKEN, "").replace(SPACED, (space, next) => (joinsWords(next) ? space : ""));

/* What a list puts in front of a line, and a dialogue in front of a speech. */
const BULLET = /^[•◦▪■□‣⁃·*–—-]$/u;

function bounds(text, from, to) {
  let start = 0;
  let end = text.length;
  for (let i = from; i >= 0; i--) {
    if (startsAfterReference(text, i) || startsAfterFullStop(text, i)) {
      start = i;
      break;
    }
    if (i < from && boundary(text, i)) {
      start = i + 1;
      break;
    }
  }
  for (let i = to; i < text.length; i++) {
    if (boundary(text, i) || (i > to && (startsAfterReference(text, i) || startsAfterFullStop(text, i)))) {
      end = i;
      break;
    }
  }
  return { start, end };
}

/* Which occurrence of the word is meant: the one nearest to where the
   program said it stands. */
function locate(text, word, at) {
  let best = -1;
  for (let i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + 1)) {
    if (best === -1 || Math.abs(i - at) < Math.abs(best - at)) best = i;
  }
  return best;
}

/* Where a clause ends inside a sentence: after a semicolon or a colon, or
   at a dash standing on its own. A sentence too long to go whole is cut
   there first, so what goes is a clause or several, not half of one. */
const CLAUSE = /^[—–]$|[;:；：؛]$/u;

/* A window of `max` tokens around tokens first..last: somewhat more after
   them than before — what completes a phrase, the object or the noun after
   an adjective, tends to follow. */
function windowAround(count, first, last, max) {
  const room = max - (last - first + 1);
  const from = Math.max(0, Math.min(first - Math.floor(room * 0.4), count - max));
  return [from, Math.min(count, from + max)];
}

/* Which tokens of a sentence go, as [from, to): all of them where they fit;
   else the clauses around the word, one at a time on either side, the
   next one first, as long as they fit; else a window of words around it. */
function cutTokens(tokens, first, last, max, plain = false) {
  if (tokens.length <= max) return [0, tokens.length];
  if (plain) return windowAround(tokens.length, first, last, max);
  const ends = tokens.map((token) => CLAUSE.test(token.text));
  const clauseStart = (i) => {
    while (i > 0 && !ends[i - 1]) i--;
    return i;
  };
  const clauseEnd = (i) => {
    while (i < tokens.length - 1 && !ends[i]) i++;
    return i + 1;
  };
  let from = clauseStart(first);
  let to = clauseEnd(last);
  if (to - from > max) return windowAround(tokens.length, first, last, max);
  for (let grew = true; grew;) {
    grew = false;
    if (to < tokens.length && clauseEnd(to) - from <= max) {
      to = clauseEnd(to);
      grew = true;
    }
    if (from > 0 && to - clauseStart(from - 1) <= max) {
      from = clauseStart(from - 1);
      grew = true;
    }
  }
  return [from, to];
}

/* The sentence around text[index, index + length), at most `max` words of
   it, as `{ start, end }` in `text` — or null where it holds nothing but
   whitespace. `plain` takes a sentence
   too long as a window of words whatever its clauses. */
export function sentenceSpan(text, index, length, max = SENTENCE_MAX, plain = false) {
  const source = String(text || "");
  const { start, end } = bounds(source, index, index + length);
  const tokens = [];
  let cursor = start;
  for (const piece of wordPieces(source.slice(start, end))) {
    const at = source.indexOf(piece, cursor);
    tokens.push({ text: piece, start: at, end: at + piece.length });
    cursor = at + piece.length;
  }
  const first = tokens.findIndex((token) => token.end > index);
  const last = tokens.findLastIndex((token) => token.start < index + Math.max(length, 1));
  if (first === -1 || last === -1) return null;
  const [cut, to] = cutTokens(tokens, first, last, max, plain);
  /* A list's mark in front of its line is no part of the sentence. */
  const from = cut < first && BULLET.test(tokens[cut].text) ? cut + 1 : cut;
  return { start: tokens[from].start, end: tokens[to - 1].end };
}

/* The sentence around `word`, which stands at about `at` in `text`.
   Answers `{ text, start, end }` — the sentence and where the word stands in
   it — or null where the word is not in the text, or the sentence holds no
   other word: a line of a list with its dash or its number says nothing
   about the word. A word broken over two lines is joined in it. */
export function sentenceAround(text, word, at = 0) {
  const source = String(text || "");
  const term = String(word || "").trim();
  if (!term) return null;
  const index = locate(source, term, at);
  if (index === -1) return null;
  const span = sentenceSpan(source, index, term.length);
  if (!span) return null;
  const cut = source.slice(span.start, span.end);
  if (!/\p{L}/u.test(cut.slice(0, index - span.start) + cut.slice(index - span.start + term.length))) return null;
  const start = joined(cut.slice(0, index - span.start)).length;
  return {
    text: joined(cut),
    start,
    end: start + term.length,
  };
}

/* The sentence under the pointer, cut out of the text around the word the
   pointer was on: `{ text, start, end }`, where start and end are its place
   in that text, for lighting it up. Null where the text holds none. */
export function sentenceUnder(around, length) {
  if (!around?.text) return null;
  const span = sentenceSpan(around.text, around.at, length, POINTER_SENTENCE_MAX);
  return span && { text: joined(around.text.slice(span.start, span.end)), ...span };
}

/* The sentence after text[after), for stepping on through a text from a
   sentence or a selection read in a program (author 2026-10-07): cut out of
   the text that came along with it, never asked of the program again.
   `{ text, start, end }` as `sentenceUnder` answers, or null where the text
   holds no further one. A sentence running to the end of a text the shell
   cut short (`cut`) may go on beyond it and is none; a line without a
   letter — a list's number, a rule — is passed over. */
export function sentenceAfter(around, after) {
  const text = String(around?.text || "");
  for (let from = Math.max(0, after); from < text.length;) {
    const rest = text.slice(from);
    const first = rest.search(/[\p{L}\p{N}]/u);
    if (first === -1) return null;
    if (around.cut !== false && bounds(rest, first, first + 1).end === rest.length) return null;
    const span = sentenceSpan(rest, first, 1, POINTER_SENTENCE_MAX, true);
    if (!span) return null;
    /* A sentence too long to be read in one step ends its first part at
       the last comma or clause mark among its words that stands outside a
       bracket, where that leaves it more than half: the rest then starts
       as a clause does, not three words before the stop or in the middle
       of a list of references. */
    if (bounds(rest, first, first + 1).end > span.end + 1) {
      const part = rest.slice(span.start, span.end);
      let depth = 0;
      let mark = -1;
      for (let i = 0; i < part.length - 1; i++) {
        if (/[([]/.test(part[i])) depth++;
        else if (/[)\]]/.test(part[i])) depth = Math.max(0, depth - 1);
        else if (!depth && /[,،、，;；:：]/u.test(part[i]) && /\s/.test(part[i + 1])) mark = i;
      }
      if (mark > part.length / 2) span.end = span.start + mark + 1;
    }
    const cut = rest.slice(span.start, span.end);
    if (/\p{L}/u.test(cut)) return { text: joined(cut), start: from + span.start, end: from + span.end };
    from += span.end;
  }
  return null;
}

/* Where a selected text stands in the text around it, as far as the end of
   the sentence it ends in: the sentence after a selection ending in the
   middle of one is the next whole one. Null where the selection is not
   found in it — the program gave the two differently, and a place guessed
   would step to the wrong sentence. */
export function selectionSpan(around, selected) {
  const text = String(around?.text || "");
  const term = String(selected || "").trim();
  if (!term || !text) return null;
  const exact = text.startsWith(term, around.at) ? around.at : locate(text, term, around.at);
  const found = exact === -1 ? locatedLoosely(text, term, around.at) : { start: exact, end: exact + term.length };
  if (!found) return null;
  return { text: term, start: found.start, end: Math.max(found.end, bounds(text, found.end - 1, found.end).end) };
}

/* A selection whose white space the program gives differently from the text
   around it — a PDF's selection keeps the line breaks its page's text has
   as spaces (measured in Preview) — found by its other characters. A word
   joiner is a unit the shell took out (see BROKEN). */
function locatedLoosely(text, term, at) {
  const places = [];
  let solid = "";
  for (let i = 0; i < text.length; i++) {
    if (/[\s\u2060]/u.test(text[i])) continue;
    places.push(i);
    solid += text[i];
  }
  const needle = term.replace(/[\s\u2060]+/gu, "");
  if (!needle) return null;
  const near = places.findIndex((place) => place >= at);
  const first = locate(solid, needle, near === -1 ? solid.length : near);
  return first === -1 ? null : { start: places[first], end: places[first + needle.length - 1] + 1 };
}

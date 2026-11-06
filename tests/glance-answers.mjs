/* A model's answer to the hover's question read back, the way the app read
   it until the hover became the word aligner's alone (2026-11-05): kept for
   the measurement scripts, which compare the aligner with the answers the
   cloud model gave (tests/align.mjs), and for the tests that lay a hover over
   a reading from an answer written by hand. The prompt itself is gone.

   The promise: a sentence whose units cannot be laid over it one after
   another is not read at all. */

import { cleanLine, isUnspaced, isWordChar, segmentBreak, stripDiacritics, stripQuotes, toTokens } from "../src/text.js";
import { spotsFor } from "../src/match/positions.js";
import { isFunctionWord } from "../src/vocabulary.js";
import { column, joinUnits } from "../src/parse/glance.js";

const fold = (word) => stripDiacritics(word).toLowerCase();

/* How much of a sentence has to be laid out before the answer counts. Not
   all of it: the model is told to leave out nothing and now and then leaves
   out a word, which costs that word its answer and nothing else. */
const COVERED = 0.85;
const UNPLACED = 0.15;

/* A letter or two a script writes onto the front of a word — the Arabic
   conjunction and prepositions — which the model writes as a unit of its
   own or leaves off the word. */
const CLITIC = 2;


/* The unit and one field per translation. A line written as a table row
   carries a pipe in front and one behind as well; a line whose last field is
   empty carries one pipe fewer, and that pipe is a separator, not
   decoration. */
function lines(raw, columns) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .map((line) => ((line.match(/\|/g) || []).length > columns + 1 ? line.replace(/^\|\s*|\s*\|$/g, "") : line))
    .filter((line) => line.includes("|"))
    .map((line) => {
      const parts = line.split("|");
      return {
        unit: stripQuotes(parts[0]),
        fields: Array.from({ length: columns }, (_, i) => String(parts[i + 1] || "").trim()),
      };
    });
}

const sameWord = (text, wanted, clitic) => {
  const word = fold(text);
  if (word === wanted) return true;
  return clitic && word.endsWith(wanted) && word.length - wanted.length <= CLITIC;
};

/* Where a unit's words stand, at or after the word the previous unit ended
   on. The units come in the order of the sentence, which is what lets a word
   that occurs twice — an article, a preposition — be told apart.

   Written onto the next word, the unit is looked for a second time, only
   once it stands nowhere as a word of its own: "لا" is the end of "ولا", and
   "la" would be the end of any Latin word before the "la" it is. */
function place(words, unit, from) {
  const wanted = toTokens(unit).filter((token) => token.isWord).map((token) => fold(token.text));
  if (!wanted.length) return null;
  if (isUnspaced(unit)) return placeUnspaced(words, wanted.join(""), from);
  for (const clitic of [false, true]) {
    for (let at = from; at + wanted.length <= words.length; at++) {
      if (wanted.every((word, k) => sameWord(words[at + k].text, word, clitic))) {
        return { first: at, last: at + wanted.length - 1 };
      }
    }
  }
  return null;
}

/* A unit in a script without spaces: cut into words on its own, it need not
   come apart where the sentence does, so its letters are laid over whole
   words of the sentence instead, one after another. */
function placeUnspaced(words, wanted, from) {
  for (let at = from; at < words.length; at++) {
    let joined = "";
    for (let last = at; last < words.length && joined.length < wanted.length; last++) {
      joined += fold(words[last].text);
      if (joined === wanted) return { first: at, last };
    }
  }
  return null;
}

/* The clitic itself, written as a unit of its own in front of the word it
   belongs to. Not a lost place: the word is there, and it gets its own unit. */
function frontOf(words, unit, at) {
  const wanted = fold(unit);
  return !!words[at] && !isUnspaced(wanted) && wanted.length <= CLITIC && /^[\p{L}\p{M}]+$/u.test(wanted)
    && fold(words[at].text).startsWith(wanted) && fold(words[at].text) !== wanted;
}

/* A spot grown to the whole word it stands in. The model copies a piece of
   a compound — "Zins" out of "Zinserhöhungen" — and what the reader wants to
   see over "rate" is the word the translation actually has. An apostrophe
   between letters is inside a word: "I'll" is one. */
function wholeWord(text, spot) {
  const inside = (i) => isWordChar(text.charAt(i))
    || (/['’]/.test(text.charAt(i)) && isWordChar(text.charAt(i - 1)) && isWordChar(text.charAt(i + 1)));
  let { start, end } = spot;
  while (start > 0 && inside(start - 1) && !segmentBreak(text, start)) start--;
  while (end < text.length && inside(end) && !segmentBreak(text, end)) end++;
  return { start, end };
}

/* Every place a piece could stand: verbatim, then as the front of a longer
   word, which is how a compound's first half comes back. Three letters at the
   least, or "in" would stand in front of every "Inflation". */
function spotsOf(text, piece) {
  const spots = spotsFor(text, piece);
  if (spots.length || piece.length < 3) return spots;
  const low = stripDiacritics(text).toLowerCase();
  const needle = stripDiacritics(piece).toLowerCase();
  const out = [];
  for (let at = low.indexOf(needle); at !== -1; at = low.indexOf(needle, at + 1)) {
    if (!isWordChar(text.charAt(at - 1)) || segmentBreak(text, at)) out.push({ start: at, end: at + needle.length });
  }
  return out;
}

const nearestTo = (spots, target) => spots.reduce((best, spot) =>
  Math.abs(spot.start - target) < Math.abs(best.start - target) ? spot : best);

/* The stretch in the translation, part by part. A part that stands more than
   once takes the occurrence nearest to where the unit stands in the sentence,
   scaled to the translation's length — a translation restructures, but rarely
   moves a word from the start of a sentence to its end — and every further
   part the one nearest to the first.

   A part that does not stand there in one piece is looked for word by word:
   the model is asked to join a split stretch with an ellipsis and writes
   "hat gebilligt" for "hat in letzter Minute … gebilligt" as often as not.
   Then every word carrying meaning has to be found, or none of it counts. */
function stretchIn(translation, stretch, share, codes) {
  const value = String(stretch || "").trim();
  if (!value || value === "-") return [];
  const found = [];
  const add = (spot) => {
    const whole = wholeWord(translation, spot);
    if (!found.some((range) => range.start === whole.start)) found.push(whole);
  };
  const target = () => (found.length ? found[0].start : share * translation.length);

  for (const piece of value.split(/\s*(?:\.{2,}|…|\+)\s*/)) {
    /* "beschlossen," is the word; the comma is where the model stopped copying. */
    const part = stripQuotes(piece).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!part) continue;
    const spots = spotsOf(translation, part);
    if (spots.length) {
      add(nearestTo(spots, target()));
      continue;
    }
    const pieces = part.split(/\s+/);
    if (pieces.length < 2) continue;
    const located = pieces.map((word) => ({ word, spots: spotsOf(translation, word) }));
    if (located.some((entry) => !entry.spots.length && !isFunctionWord(entry.word, codes))) continue;
    for (const entry of located) if (entry.spots.length) add(nearestTo(entry.spots, target()));
  }
  return found.sort((x, y) => x.start - y.start);
}

/* The answer laid over the sentence: the units in the order the sentence has
   them, each with its ranges in every translation asked about. Null where the
   answer cannot be trusted with this sentence.

   `targets` is one entry per column, each { text, codes }. The first one is
   the reader's own translation, and it decides: an answer that lost its place
   there is no answer at all, and the grouping is worked out on it, so that
   every panel holds the same words together. */
function readUnits(raw, sentence, targets, codes) {
  const words = toTokens(sentence).filter((token) => token.isWord);
  const answer = lines(raw, targets.length);
  if (!words.length || !answer.length) return null;

  const units = [];
  let cursor = 0;
  let unplaced = 0;
  let covered = 0;
  for (const { unit, fields } of answer) {
    /* A unit written as a hyphen is a word of the translation the model had
       no word of the original left for — the one sign that it laid the two
       sentences side by side word for word instead of by meaning. */
    if (!unit || unit === "-") return null;
    if (frontOf(words, unit, cursor)) continue;
    const spot = place(words, unit, cursor);
    if (!spot) {
      unplaced++;
      continue;
    }
    cursor = spot.last + 1;
    covered += spot.last - spot.first + 1;
    const start = words[spot.first].start;
    const end = words[spot.last].end;
    const share = (start + end) / 2 / sentence.length;
    const columns = targets.map((target, i) => stretchIn(target.text, fields[i], share, target.codes));
    units.push({ start, end, columns, to: columns[0], fields });
  }
  if (unplaced > answer.length * UNPLACED || covered < words.length * COVERED) return null;
  /* The other sign of a lost place: the last unit left with nothing at all
     — not a hyphen, which says the translation has nothing for it, but an
     empty field. The translation ran out before the sentence did, because
     every unit before it took the rendering of the one after it. */
  const last = units[units.length - 1];
  const bareLast = isFunctionWord(sentence.slice(last.start, last.end), codes);
  const lost = targets.map((_, i) => !bareLast && !last.fields[i]);
  if (lost[0]) return null;
  return { units: joinUnits(units, sentence, targets[0].text, codes), lost };
}

/* Returns the units, each { start, end, to: [{ start, end }], gloss }, or null
   where the answer cannot be trusted with this sentence. `to` is empty and
   `gloss` blank for a unit the translation renders with nothing. `codes`
   names the two languages, for telling a function word from a word that
   carries meaning. */
export function parseGlance(raw, sentence, translation, codes) {
  const read = readUnits(raw, sentence, [{ text: translation, codes }], codes);
  if (!read) return null;
  return read.units.map((group) => ({
    start: group.start,
    end: group.end,
    ...column(group, 0, translation),
  }));
}

/* The same for three panels. Every unit carries `second` besides `to`, and
   `second` is null throughout where that column came to nothing — the
   reader's own column stands on its own, and a panel with no answer simply
   does not light up. */
export function parseGlanceWide(raw, sentence, translation, second, codes) {
  const [source, reader, other] = codes;
  const read = readUnits(raw, sentence, [
    { text: translation, codes: [source, reader] },
    { text: second, codes: [source, other] },
  ], [source, reader]);
  if (!read) return null;
  const empty = read.lost[1] || read.units.every((group) => !group.columns[1].length);
  return read.units.map((group) => ({
    start: group.start,
    end: group.end,
    ...column(group, 0, translation),
    second: empty ? null : column(group, 1, second),
  }));
}

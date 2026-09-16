/* Reading back what a sentence's units became in its translation.

   Every position here is a position in the text handed in — the sentence and
   its translation — so the run only has to add where those stand.

   The promise is the same as everywhere a spot is found: no answer is better
   than the wrong one. A reader hovering over a word trusts what appears over
   it, and an answer that has lost its place looks exactly as confident as one
   that has not. So a sentence whose units cannot be laid over it one after
   another is not read at all. */

import { cleanLine, isWordChar, stripDiacritics, stripQuotes, toTokens } from "../text.js";
import { spotsFor } from "../match/positions.js";
import { glossOf } from "../glance.js";
import { isFunctionWord } from "../vocabulary.js";
import { wordSet } from "../languages/index.js";

/* How much of a sentence has to be laid out before the answer counts. Not
   all of it: the model is told to leave out nothing and now and then leaves
   out a word, which costs that word its answer and nothing else. */
const COVERED = 0.85;
const UNPLACED = 0.15;

/* A letter or two a script writes onto the front of a word — the Arabic
   conjunction and prepositions — which the model writes as a unit of its
   own or leaves off the word. */
const CLITIC = 2;

const fold = (word) => stripDiacritics(word).toLowerCase();

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
  for (const clitic of [false, true]) {
    for (let at = from; at + wanted.length <= words.length; at++) {
      if (wanted.every((word, k) => sameWord(words[at + k].text, word, clitic))) {
        return { first: at, last: at + wanted.length - 1 };
      }
    }
  }
  return null;
}

/* The clitic itself, written as a unit of its own in front of the word it
   belongs to. Not a lost place: the word is there, and it gets its own unit. */
function frontOf(words, unit, at) {
  const wanted = fold(unit);
  return !!words[at] && wanted.length <= CLITIC && /^[\p{L}\p{M}]+$/u.test(wanted)
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
  while (start > 0 && inside(start - 1)) start--;
  while (end < text.length && inside(end)) end++;
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
    if (!isWordChar(text.charAt(at - 1))) out.push({ start: at, end: at + needle.length });
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

/* Ranges with nothing but a space between them are one range: "die" and
   "Regierung" are lit as "die Regierung", not as two boxes with a gap. */
function closed(text, ranges) {
  const out = [];
  for (const range of ranges) {
    const last = out[out.length - 1];
    if (last && /^[\s'’-]*$/.test(text.slice(last.end, range.start))) last.end = Math.max(last.end, range.end);
    else out.push({ ...range });
  }
  return out;
}

/* A group of words that belongs together is one unit, whatever the model cut:
   the hover lights it as one and writes one sign over it. The prompt asks for
   groups, and a model still hands back a word on its own often enough —
   these two rules catch that without asking again.

   Words that became the same word of the translation are one: "motor
   económico" is "Wirtschaftsmotor", "central bank" is "Zentralbank". And a
   function word goes with the word after it where what it became stands in
   front of what that word became — "el gobierno", "die Regierung" — or where
   it became nothing at all. One function word, in front of a word that
   carries meaning, and never a conjunction, which the pack names: "y el
   gato" is the conjunction glued to a noun it has nothing to do with. */
const AHEAD = 3;

function joinUnits(units, sentence, translation, codes) {
  const touching = (text, left, right) => /^[\s'’-]*$/.test(text.slice(left.end, right.start));
  const merge = (left, right) => ({
    start: left.start,
    end: right.end,
    /* Every column keeps its own ranges, so that one grouping serves them
       all: the reader sees the same words held together in every panel. */
    columns: left.columns.map((ranges, i) => [...ranges, ...right.columns[i]]
      .filter((range, at, all) => all.findIndex((other) => other.start === range.start) === at)
      .sort((x, y) => x.start - y.start)),
    to: [...left.to, ...right.to]
      .filter((range, at, all) => all.findIndex((other) => other.start === range.start) === at)
      .sort((x, y) => x.start - y.start),
  });
  const wordsOf = (unit) => toTokens(sentence.slice(unit.start, unit.end)).filter((token) => token.isWord);
  const bare = (unit) => wordsOf(unit).every((token) => isFunctionWord(token.text, codes.slice(0, 1)));
  const joining = wordSet(codes[0], "conjunctions");
  const leads = (unit) => bare(unit)
    && !wordsOf(unit).some((token) => joining.has(stripDiacritics(token.text).toLowerCase()));
  const sameWord = (left, right) => left.to.some((range) => right.to.some((other) => other.start === range.start));
  /* Side by side, or a few words ahead of it: a translation puts adjectives
     and numbers between an article and its noun in another order than the
     original — "el coche rojo" is "das rote Auto", "los años 1970" is "den
     1970er Jahren" — and the article is still that noun's. */
  const sideBySide = (left, right) => {
    if (!left.to.length) return true;
    if (!right.to.length) return false;
    const end = left.to[left.to.length - 1].end;
    const start = right.to[0].start;
    if (start < end) return false;
    return toTokens(translation.slice(end, start)).filter((token) => token.isWord).length <= AHEAD;
  };

  const together = (list) => {
    const out = [];
    for (const unit of list) {
      const last = out[out.length - 1];
      if (last && touching(sentence, last, unit) && sameWord(last, unit)) out[out.length - 1] = merge(last, unit);
      else out.push(unit);
    }
    return out;
  };
  const joined = together(units);

  /* Back to front, so that a function word meets the word after it as it
     stands, and a word that has taken one already takes no second. */
  const out = [];
  for (let i = joined.length - 1; i >= 0; i--) {
    const unit = joined[i];
    const next = out[0];
    if (next && !next.led && leads(unit) && !bare(next) && touching(sentence, unit, next) && sideBySide(unit, next)) {
      out[0] = { ...merge(unit, next), led: true };
    } else {
      out.unshift(unit);
    }
  }
  /* Once more: a word that took its article may now stand beside the next
     word that became the same word — "las ayudas" and "al alquiler" are both
     "Mietbeihilfen". */
  return together(out.map(({ led, ...unit }) => unit));
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

/* One column of a group, as the window wants it: the ranges closed up where
   only a space parts them, and the words they cover. */
const column = (group, at, text) => {
  const to = closed(text, group.columns[at]);
  return { to, gloss: glossOf(text, to) };
};

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

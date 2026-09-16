/* What a word of the original became in the reader's own translation, for
   the moment the pointer rests on it.

   Worked out once per reading, sentence by sentence, after everything else a
   reading asks for has come back — see run.js — and looked up on hover
   without asking anything. Pure: no DOM and no model. */

import { isWordChar, toSentences } from "./text.js";

/* Where each sentence stands in both texts. Pairs only where both have the
   same number of sentences, which is what makes pairing them by place safe;
   otherwise the two texts are one pair, and the question is asked about the
   whole of them. */
export function glancePairs(text, translation) {
  const within = (whole, pieces) => {
    const out = [];
    let from = 0;
    for (const piece of pieces) {
      const at = whole.indexOf(piece, from);
      if (at === -1) return null;
      out.push({ start: at, end: at + piece.length });
      from = at + piece.length;
    }
    return out;
  };
  const source = within(text, toSentences(text));
  const target = within(translation, toSentences(translation));
  if (source && target && source.length && source.length === target.length) {
    return source.map((range, i) => ({ ...range, to: target[i] }));
  }
  return [{ start: 0, end: text.length, to: { start: 0, end: translation.length } }];
}

/* The units of one answer moved from sentence positions to text positions.
   Each translation has a sentence of its own, so each carries its own
   offset. */
export function placeUnits(pair, units, second) {
  const moved = (ranges, from) => ranges.map((range) => ({ start: from + range.start, end: from + range.end }));
  return units.map((unit) => ({
    start: pair.start + unit.start,
    end: pair.start + unit.end,
    to: moved(unit.to, pair.to.start),
    gloss: unit.gloss,
    ...(unit.second && second
      ? { second: { to: moved(unit.second.to, second.to.start), gloss: unit.second.gloss } }
      : {}),
  }));
}

/* What stands under a position. `side` is "source" for the original,
   "target" for the reader's panel and "second" for the other translation. Answers { pending } while that sentence
   is still being asked about, the unit where there is one, and null where
   nothing is known or ever will be. */
export function glanceAt(glance, side, position) {
  if (!glance) return null;
  if (glance.pending) return { pending: true };
  const inside = (range) => !!range && position >= range.start && position < range.end;
  const where = (entry) => (side === "source" ? entry : side === "second" ? entry.second : entry.to);
  const sentence = glance.sentences.find((entry) => inside(where(entry)));
  if (!sentence) return null;
  if (sentence.status === "waiting") return { pending: true };
  if (!sentence.units) return null;
  if (side === "source") return sentence.units.find(inside) || null;
  if (side === "second") return sentence.units.find((unit) => (unit.second?.to || []).some(inside)) || null;
  return sentence.units.find((unit) => unit.to.some(inside)) || null;
}

/* Every unit touching a stretch of the original — for a verb or a term the
   run has already marked, whose words stand together however the units cut
   them. */
export function unitsOver(glance, start, end) {
  if (!glance?.sentences) return [];
  return glance.sentences
    .flatMap((sentence) => sentence.units || [])
    .filter((unit) => unit.start < end && unit.end > start);
}

/* What stands over a unit: its ranges as the text writes them. Two ranges
   with nothing but a space between them are one stretch of text and read as
   one; a real gap in between is an ellipsis. */
export function glossOf(text, ranges) {
  let out = "";
  ranges.forEach((range, i) => {
    if (i) {
      const between = text.slice(ranges[i - 1].end, range.start);
      out += /^[\s'’-]*$/.test(between) ? between : " … ";
    }
    out += text.slice(range.start, range.end);
  });
  return out;
}

/* Ranges with the holes taken out of them, each cut back to the words it
   still holds. A unit of the hover that runs into a marked verb or term keeps
   what lies outside the mark: the mark is its own group. */
export function withoutHoles(text, ranges, holes) {
  let pieces = ranges.map((range) => ({ ...range }));
  for (const hole of holes) {
    pieces = pieces.flatMap((piece) => {
      if (hole.end <= piece.start || hole.start >= piece.end) return [piece];
      return [
        { start: piece.start, end: Math.max(piece.start, hole.start) },
        { start: Math.min(piece.end, hole.end), end: piece.end },
      ];
    });
  }
  return pieces
    .map(({ start, end }) => {
      while (start < end && !isWordChar(text.charAt(start))) start++;
      while (end > start && !isWordChar(text.charAt(end - 1))) end--;
      return { start, end };
    })
    .filter((piece) => piece.end > piece.start);
}

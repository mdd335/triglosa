/* The word under the pointer, found in what the recogniser read off the
   screen around it — where the program there handed over no text
   (screen.rs, under_pointer).

   The line under the pointer is the one whose box holds it, or the nearest
   within half a line above or below. In it, the character the pointer is
   on, by where the recogniser says each character stands; where it says
   nothing for every character, by its share of the line. The word is the
   one the platform's word breaking puts that character in, so scripts
   without spaces are cut as they are everywhere else.

   The text around it is the piece's text in reading order (screen-text.js):
   the sentence is cut out of that the way it is for a program's own text,
   and every stretch of it can be lit up where it stood, line by line. */

import { screenText } from "./screen-text.js";

const segmenter = (granularity) => new Intl.Segmenter(undefined, { granularity });

/* Where each character of a line starts and ends in its text, and across
   the picture. */
function characters(line) {
  const starts = [...segmenter("grapheme").segment(line.t)].map((part) => part.index);
  const [left, top, right, bottom] = line.b;
  const share = (right - left) / Math.max(starts.length, 1);
  const across = Array.isArray(line.c) && line.c.length === starts.length
    ? spaced(line.c, left, right)
    : starts.map((_, i) => [left + share * i, left + share * (i + 1)]);
  return starts.map((start, i) => ({
    start, end: starts[i + 1] ?? line.t.length, left: across[i][0], right: across[i][1], top, bottom,
  }));
}

/* Apple gives each character its word's box, and a space none ("0 0"): a
   character without a box of its own takes the gap between its neighbours. */
function spaced(across, left, right) {
  const out = across.map(([from, to]) => (to > from ? [from, to] : null));
  return out.map((one, i) => {
    if (one) return one;
    const before = out.slice(0, i).reverse().find(Boolean);
    const after = out.slice(i + 1).find(Boolean);
    return [before ? before[1] : left, after ? after[0] : right];
  });
}

/* A line that runs into the left or right edge of the piece most likely
   lost part of the word there: that word is left out, unless it is the
   only one, or the one the pointer is on (`keep`, where it starts). What
   is left of a cut word may end short of the edge — the recogniser reads
   the half of a letter as nothing — so within half a line's height of it
   counts. The line is returned with how many units of its text were cut
   off in front. */
function uncut(line, width, keep) {
  const words = [...segmenter("word").segment(line.t)].filter((part) => part.isWordLike);
  if (!width || words.length < 2) return { line, shift: 0 };
  const edge = (line.b[3] - line.b[1]) / 2;
  const [first, last] = [words[0], words[words.length - 1]];
  const from = line.b[0] <= edge && first.index !== keep ? words[1].index : 0;
  const before = words[words.length - 2];
  const to = line.b[2] >= width - edge && last.index !== keep ? before.index + before.segment.length : line.t.length;
  if (from === 0 && to === line.t.length) return { line, shift: 0 };
  const inside = characters(line).filter((one) => one.start >= from && one.end <= to);
  const b = [Math.min(...inside.map((one) => one.left)), line.b[1], Math.max(...inside.map((one) => one.right)), line.b[3]];
  return { line: { t: line.t.slice(from, to), b, c: inside.map((one) => [one.left, one.right]) }, shift: from };
}

/* The line under a point, or the nearest within half a line above or below
   and a line's height to either side. */
function lineAt(lines, [x, y]) {
  let best = null;
  let nearest = Infinity;
  for (const line of lines) {
    const [left, top, right, bottom] = line.b;
    const high = bottom - top;
    const down = y < top ? top - y : y > bottom ? y - bottom : 0;
    const across = x < left ? left - x : x > right ? x - right : 0;
    if (down > high / 2 || across > high) continue;
    const distance = down * 4 + across;
    if (distance < nearest) {
      nearest = distance;
      best = line;
    }
  }
  return best;
}

/* `{ word, context: { text, at, cut }, boxes(start, end) }` for the point
   `at` in the picture the lines were read from, or null where no word
   stands there. `context` is what a program's word under the pointer comes
   with; `boxes` gives a stretch of that text as boxes in the picture, one
   a line. */
export function wordUnderPointer(lines, at, { rtl = false, size = null } = {}) {
  /* A line without a letter or a figure is a frame's handle or an icon
     read as text, never part of a sentence. */
  const readable = (lines || []).filter((line) => /[\p{L}\p{N}]/u.test(String(line.t || "")) && Array.isArray(line.b));
  const pointed = lineAt(readable, at);
  if (!pointed) return null;
  const chars = characters(pointed);
  const [x] = at;
  const middle = (one) => (one.left + one.right) / 2;
  const under = chars.find((one) => x >= one.left && x <= one.right)
    || chars.reduce((best, one) => (Math.abs(middle(one) - x) < Math.abs(middle(best) - x) ? one : best), chars[0]);
  const words = [...segmenter("word").segment(pointed.t)].filter((part) => part.isWordLike);
  const found = words.find((part) => under.start >= part.index && under.start < part.index + part.segment.length);
  if (!found) return null;

  const width = size?.[0] || 0;
  let line = pointed;
  let word = found;
  const kept = readable.map((one) => {
    const { line: whole, shift } = uncut(one, width, one === pointed ? found.index : -1);
    if (one === pointed) {
      line = whole;
      word = { segment: found.segment, index: found.index - shift };
    }
    return whole;
  });

  /* The line's place in the text in reading order. A line whose pieces
     were joined there may not stand in it whole: then the line alone is
     the text around the word. */
  const whole = screenText(kept, { rtl });
  const placed = new Map();
  for (const one of kept) {
    const from = whole.indexOf(one.t);
    if (from >= 0 && !placed.has(one)) placed.set(one, from);
  }
  const text = placed.has(line) ? whole : line.t;
  const offset = placed.has(line) ? placed.get(line) : 0;
  const located = placed.has(line) ? [...placed] : [[line, 0]];

  const boxes = (start, end) => {
    const out = [];
    for (const [one, from] of located) {
      const inside = characters(one).filter((c) => c.start + from < end && c.end + from > start);
      if (!inside.length) continue;
      out.push([
        Math.min(...inside.map((c) => c.left)), one.b[1],
        Math.max(...inside.map((c) => c.right)), one.b[3],
      ]);
    }
    return out;
  };
  /* The piece is cut out of a larger screen: its last sentence may go on
     beyond it. */
  return { word: word.segment, context: { text, at: offset + word.index, cut: true }, boxes };
}

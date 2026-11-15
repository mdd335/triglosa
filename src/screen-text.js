/* The lines read off a piece of the screen, put back together as the text
   they were.

   A recogniser answers lines and where each stands, in an order of its own:
   PaddleOCR reads two columns line by line across both, Apple's
   recognition joins a line of the left column with the one beside it at
   small sizes, and Arabic comes word by word (run sixty-six). The order is
   worked out here from the boxes alone, the same for both systems: the
   widest gap cuts the lines in two — a gap between columns only where it is
   at least a line high, the right part first in a right-to-left text —
   until no gap is left, and what is left goes by rows.

   Then the rows become text. A row that reaches across its column carries
   on in the next one, as a paragraph's lines do, and on into the next
   column where that is as wide, in type of the same size; a shorter one
   ends where it ends — the last line of a paragraph, a label, a button —
   and so does a heading, a row before an item of a list, and a row before
   an empty line. A word broken with a hyphen at the end of a row is joined
   again with its hyphen, as sentence.js joins one broken over two lines,
   and scripts without spaces are joined without one.

   A photograph is seldom level. Each line's box is the upright one around
   it, so the boxes of a tilted paragraph's lines overlap and its rows would
   interleave; where the recogniser says how each line slopes (`s`), the
   lines are first laid level by the slope most of them share. */

import { isUnspaced } from "./text.js";

/* A row reaching this share of its column's widest carries on. */
const FULL = 0.75;
/* Rows further apart than their column's rows are, by this share of a
   line's height, are two paragraphs. */
const APART = 0.5;

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const height = (line) => line.b[3] - line.b[1];
const middle = (line, axis) => (line.b[axis] + line.b[axis + 2]) / 2;

/* A slope below this many pixels of rise in a thousand is left as it is:
   a screenshot's lines are level, and a level board's chalked lines can
   slope 9 in a thousand by the recogniser's reckoning (run 88). */
const LEVEL = 12;
/* The share of the long lines, by number or by length, that must slope
   alike for the text to be laid level. */
const AGREED = 0.6;

/* A line's own rectangle, its length along its slope and its thickness,
   worked back from its upright box. A line at about half a right angle
   tells nothing of its shape by its box: its length is then shared out by
   its letters, one about half as wide as the line is thick. */
function shape(line) {
  const own = Number.isFinite(line.s) && line.s !== 0 ? Math.atan(line.s / 1000) : 0;
  const [c, s] = [Math.abs(Math.cos(own)), Math.abs(Math.sin(own))];
  const [wide, tall] = [line.b[2] - line.b[0], height(line)];
  const across = c * c - s * s;
  if (Math.abs(across) >= 0.3) {
    return { own, long: Math.max((wide * c - tall * s) / across, 1), thick: Math.max((tall * c - wide * s) / across, 1) };
  }
  const letters = Math.max(line.t.replace(/\s/gu, "").length, 1);
  const sum = (wide + tall) / (c + s);
  const thick = sum / (1 + letters / 2);
  return { own, long: sum - thick, thick };
}

/* The lines laid level: each line's own rectangle turned back by the slope
   the long lines share, and the upright box around it then. */
function levelled(lines) {
  /* Lines running down the picture, as on a packet's side, are of another
     kind and say nothing of the slope. */
  const long = lines.filter((line) => {
    if (!Number.isFinite(line.s) || Math.abs(line.s) > 1000) return false;
    const { long: length, thick } = shape(line);
    return length > 3 * thick;
  });
  /* Apple answers a slope of exactly nothing for many lines of a tilted
     photograph, as if it had not looked; a level text's lines all have it. */
  const sloped = long.filter((line) => line.s !== 0);
  if (sloped.length < 0.3 * long.length || !sloped.length) return lines;
  const shared = median(sloped.map((line) => line.s));
  if (Math.abs(shared) < LEVEL) return lines;
  /* Only a slope most lines, or most of their length, agree on:
     handwriting's lines slope this way and that on a level board; a board
     seen from aside slopes more towards its foot, and a short word's slope
     is a rough one. */
  const length = (some) => some.reduce((sum, line) => sum + shape(line).long, 0);
  const agreeing = sloped.filter((line) => Math.abs(line.s - shared) <= Math.max(10, Math.abs(shared) / 2));
  if (agreeing.length < AGREED * sloped.length && length(agreeing) < AGREED * length(sloped)) return lines;
  const turn = Math.atan(shared / 1000);
  return lines.map((line) => {
    const { own, long: w, thick: h } = Number.isFinite(line.s) && line.s !== 0 ? shape(line) : shape({ ...line, s: shared });
    const [x, y] = [middle(line, 0), middle(line, 1)];
    const [mx, my] = [x * Math.cos(turn) + y * Math.sin(turn), y * Math.cos(turn) - x * Math.sin(turn)];
    const rest = own - turn;
    const [half, halfUp] = [
      (Math.abs(w * Math.cos(rest)) + Math.abs(h * Math.sin(rest))) / 2,
      (Math.abs(w * Math.sin(rest)) + Math.abs(h * Math.cos(rest))) / 2,
    ];
    return { ...line, b: [mx - half, my - halfUp, mx + half, my + halfUp] };
  });
}

/* A list's item opens with its mark — a bullet, a dash (a chalked menu's
   touches its word), or a number with a full stop or bracket — and is taken
   for one only where two rows open so, so that a sentence starting a row
   with "12." stays whole. */
const MARK = /^(?:[•◦▪■□‣⁃·●○*–—-]|\d{1,2}[.)]\s)/u;

/* The widest stretch along one axis (0: across, 1: down) no line covers. */
function widestGap(lines, axis) {
  const spans = lines.map((line) => [line.b[axis], line.b[axis + 2]]).sort((a, b) => a[0] - b[0]);
  let best = null;
  let end = spans[0][1];
  for (const [start, stop] of spans.slice(1)) {
    if (start > end && (!best || start - end > best.size)) best = { at: (start + end) / 2, size: start - end };
    end = Math.max(end, stop);
  }
  return best;
}

/* The lines in reading order, as rows, each row knowing the column it
   stands in: [{ lines, column }]. */
function rows(lines, rtl, column = "") {
  if (!lines.length) return [];
  const tall = median(lines.map(height));
  const across = lines.length > 1 ? widestGap(lines, 0) : null;
  const down = lines.length > 1 ? widestGap(lines, 1) : null;
  const columns = across && across.size >= tall && (!down || across.size > down.size);
  const cut = columns ? across : down;
  if (cut) {
    const axis = columns ? 0 : 1;
    const first = lines.filter((line) => middle(line, axis) < cut.at);
    const second = lines.filter((line) => middle(line, axis) >= cut.at);
    if (!columns) return [...rows(first, rtl, column), ...rows(second, rtl, column)];
    const [a, b] = rtl ? [second, first] : [first, second];
    return [...rows(a, rtl, `${column}a`), ...rows(b, rtl, `${column}b`)];
  }
  /* No gap left: lines side by side where their middles stand within half
     a line of each other. */
  const out = [];
  for (const line of [...lines].sort((p, q) => middle(p, 1) - middle(q, 1))) {
    const row = out.at(-1);
    if (row && Math.abs(middle(line, 1) - middle(row.lines[0], 1)) < tall / 2) row.lines.push(line);
    else out.push({ lines: [line], column });
  }
  for (const row of out) row.lines.sort((p, q) => (rtl ? q.b[0] - p.b[0] : p.b[0] - q.b[0]));
  return out;
}

/* Pieces of one row overlapping by this share of a character have their
   edge twice: PaddleOCR, given a selected line in a text box, found it as
   pieces each read with a sliver of its neighbour (". Los", "s y el").
   Words whose boxes only touch overlapped by up to 0.71 of one there, a
   doubled edge by 0.79 and more. */
const DOUBLED = 0.75;

/* A row's pieces as one text, a doubled edge given once: the characters
   one piece ends and the next begins with, where they are the same. A
   sliver read as something else stays (": vecinos"): taking off as many
   characters as the overlap holds took real letters off subtitles, whose
   boxes overlapped by more than one with nothing doubled. */
function joinRow(lines, rtl) {
  const wide = median(lines.map((line) => (line.b[2] - line.b[0]) / [...line.t].length));
  const pieces = lines.map((line) => [...line.t]);
  for (let i = 1; i < lines.length; i++) {
    const [before, after] = [lines[i - 1].b, lines[i].b];
    const overlap = rtl ? before[0] - after[2] : before[2] - after[0];
    if (overlap < DOUBLED * wide) continue;
    const a = pieces[i - 1];
    const b = pieces[i];
    let shared = 0;
    for (let k = Math.min(Math.ceil(overlap / wide), a.length, b.length - 1); k > 0 && !shared; k--) {
      if (a.slice(-k).join("") === b.slice(0, k).join("")) shared = k;
    }
    if (!shared) continue;
    /* The sliver is the copy standing apart from its piece's word:
       "más t" + "tarde", but "niebla." + ". Los". */
    if (/\s/u.test(a.at(-shared - 1) ?? " ")) pieces[i - 1] = a.slice(0, -shared);
    else pieces[i] = b.slice(shared);
  }
  return pieces
    .map((piece) => piece.join("").trim())
    .filter(Boolean)
    .reduce((out, piece) => (out ? out + joint(out, piece, true) + piece : piece), "");
}

const width = (row) => Math.max(...row.lines.map((line) => line.b[2])) - Math.min(...row.lines.map((line) => line.b[0]));

/* Between two pieces of text: nothing, a space, or a line break. */
function joint(before, after, carriesOn) {
  if (!carriesOn) return "\n";
  if (/\p{L}-$/u.test(before) && /^\p{L}/u.test(after)) return "";
  if (isUnspaced(before.at(-1)) && isUnspaced(after[0])) return "";
  return " ";
}

/* A frame drawn over one column of a page takes a strip of the column
   beside it: the ends of its lines, cut by the frame's edge, a gap, then
   the column wanted. Such a strip is left out — lines at the frame's edge,
   each much narrower than the text beside it, apart from it by a gap, where
   that text runs across its column as a paragraph does. A column of labels
   is not running text and stays, and a column of prices holds no words. */
const CUT = 0.35;
/* A cut strip holds the pieces of words; a column of prices, numbers. */
const wordy = (line) => (line.t.match(/\p{L}/gu) || []).length > (line.t.match(/\p{N}/gu) || []).length;
function withoutCutStrips(lines, frame) {
  if (!frame) return lines;
  const reach = Math.max(3, frame[0] * 0.015);
  let kept = lines;
  for (const side of ["left", "right"]) {
    const atEdge = (line) => (side === "left" ? line.at[0] <= reach : line.at[2] >= frame[0] - reach);
    const rest = kept.filter((line) => !atEdge(line));
    if (rest.length < 3) continue;
    const span = Math.max(...rest.map((line) => line.b[2])) - Math.min(...rest.map((line) => line.b[0]));
    if (rest.filter((line) => line.b[2] - line.b[0] >= 0.6 * span).length < 3) continue;
    const strip = kept.filter((line) => {
      if (!atEdge(line) || !wordy(line) || line.b[2] - line.b[0] >= CUT * span) return false;
      const beside = rest.filter((other) => other.b[1] < line.b[3] && other.b[3] > line.b[1]);
      return beside.length > 0 && beside.every((other) => (side === "left" ? other.b[0] > line.b[2] : other.b[2] < line.b[0]));
    });
    if (strip.length >= 2) kept = kept.filter((line) => !strip.includes(line));
  }
  return kept;
}

/* The same for a column cut askew: laid level, the lines fall into bands
   with clear gaps between them — clear but for a line or two the recogniser
   read across a gap, a heading as often as not, and each line's box taken
   in by its padding; an outer band whose lines nearly all touch the frame's
   edge on its side is cut off another column, where a band of running text
   is left. */
function withoutCutBands(lines, frame) {
  if (!frame || lines.length < 4) return lines;
  const reach = Math.max(3, frame[0] * 0.015);
  const tall = median(lines.map(height));
  const [pad, gap] = [0.5 * tall, Math.max(3, 0.1 * tall)];
  const from = Math.floor(Math.min(...lines.map((line) => line.b[0])));
  const covered = new Array(Math.ceil(Math.max(...lines.map((line) => line.b[2]))) - from + 1).fill(0);
  for (const line of lines) {
    for (let x = Math.ceil(line.b[0] + pad); x <= line.b[2] - pad; x++) covered[x - from]++;
  }
  const allowed = Math.max(1, Math.floor(0.03 * lines.length));
  const cuts = [];
  let start = -1;
  covered.forEach((count, x) => {
    if (count <= allowed) {
      if (start < 0) start = x;
    } else {
      if (start > 0 && x - start >= gap) cuts.push(from + (start + x) / 2);
      start = -1;
    }
  });
  if (!cuts.length) return lines;
  const bands = Array.from({ length: cuts.length + 1 }, () => []);
  for (const line of lines) bands[cuts.filter((cut) => cut < middle(line, 0)).length].push(line);
  const filled = bands.filter((band) => band.length);
  const running = (band) => {
    const span = Math.max(...band.map((line) => line.b[2])) - Math.min(...band.map((line) => line.b[0]));
    return band.filter((line) => line.b[2] - line.b[0] >= 0.6 * span).length >= 3;
  };
  const spanOf = (band) => Math.max(...band.map((line) => line.b[2])) - Math.min(...band.map((line) => line.b[0]));
  /* Nearly all its lines at the edge, or half of them where the band is a
     narrow strip: the recogniser leaves out most of a strip's cut words,
     and of those it reads, a short one can end short of the edge. */
  const cut = (band, rest, side) => {
    if (band.filter(wordy).length * 2 < band.length) return false;
    const atEdge = band.filter((line) => (side === "left" ? line.at[0] <= reach : line.at[2] >= frame[0] - reach)).length;
    const widest = Math.max(...rest.filter(running).map(spanOf));
    return atEdge >= 0.8 * band.length || (atEdge >= 0.5 * band.length && spanOf(band) < CUT * widest);
  };
  while (filled.length > 1 && filled.slice(1).some(running) && cut(filled[0], filled.slice(1), "left")) filled.shift();
  while (filled.length > 1 && filled.slice(0, -1).some(running) && cut(filled.at(-1), filled.slice(0, -1), "right")) filled.pop();
  return filled.flat();
}

/* The text of the lines `[{ t, b: [left, top, right, bottom] }]`, read
   right to left where `rtl` says so; `frame`, the piece's width and height,
   lets a strip cut off another column be told. */
export function screenText(lines, { rtl = false, frame = null } = {}) {
  const kept = (lines || [])
    .map((line) => ({ t: String(line.t ?? line.text ?? "").trim(), b: line.b, s: line.s, at: line.b }))
    .filter((line) => line.t && Array.isArray(line.b) && line.b[2] > line.b[0] && line.b[3] > line.b[1]);
  if (!kept.length) return "";
  const ordered = rows(withoutCutStrips(withoutCutBands(levelled(kept), frame), frame), rtl);
  const tall = median(ordered.flatMap((row) => row.lines).map(height));
  const gapBefore = (index) =>
    Math.min(...ordered[index].lines.map((line) => line.b[1])) - Math.max(...ordered[index - 1].lines.map((line) => line.b[3]));
  const gaps = {};
  ordered.forEach((row, index) => {
    if (index && ordered[index - 1].column === row.column) (gaps[row.column] ||= []).push(gapBefore(index));
  });
  const spacing = Object.fromEntries(Object.entries(gaps).map(([column, all]) => [column, median(all)]));
  const widest = {};
  for (const row of ordered) widest[row.column] = Math.max(widest[row.column] || 0, width(row));
  const texts = ordered.map((row) => joinRow(row.lines, rtl));
  const listed = texts.filter((one) => MARK.test(one)).length >= 2;
  let text = "";
  ordered.forEach((row, index) => {
    const own = texts[index];
    if (index) {
      const before = ordered[index - 1];
      /* Into another column only where the two are alike: the next column
         of an article, not the text beside a list of labels. */
      const alike = before.column === row.column
        || Math.min(widest[before.column], widest[row.column]) >= FULL * Math.max(widest[before.column], widest[row.column]);
      /* And only into a row of the same size of type, told by how wide
         its characters come out — the boxes of a heading and its text were
         as high as each other: a heading ends where it ends, however wide. */
      const size = (one) => median(one.lines.map((line) => (line.b[2] - line.b[0]) / [...line.t].length));
      const sameSize = Math.min(size(before), size(row)) >= FULL * Math.max(size(before), size(row));
      const item = listed && MARK.test(own);
      /* Nor across an empty line: a paragraph ends there, however wide its
         last row — told by a gap wider than the column's own between its
         lines by more than half a line (a typed notice's lines lay 0.3 of a
         line apart at most, its paragraphs 0.9 and more; a sign's lines
         lie wide apart all along). */
      const apart = before.column === row.column && gapBefore(index) > spacing[row.column] + APART * tall;
      text += joint(text, own, !item && !apart && alike && sameSize && width(before) >= FULL * widest[before.column]);
    }
    text += own;
  });
  return text;
}

/* Whether a piece reads right to left: most of its lines are in a script
   that does. */
export const rightToLeft = (lines) =>
  lines.filter((line) => /[\u0590-\u08ff]/u.test(line.t)).length * 2 > lines.length;

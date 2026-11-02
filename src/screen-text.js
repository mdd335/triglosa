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
   and so does a heading. A word broken
   with a hyphen at the end of a row is joined again with its hyphen, as
   sentence.js joins one broken over two lines, and scripts without spaces
   are joined without one. */

import { isUnspaced } from "./text.js";

/* A row reaching this share of its column's widest carries on. */
const FULL = 0.75;

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const height = (line) => line.b[3] - line.b[1];
const middle = (line, axis) => (line.b[axis] + line.b[axis + 2]) / 2;

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

/* The text of the lines `[{ t, b: [left, top, right, bottom] }]`, read
   right to left where `rtl` says so. */
export function screenText(lines, { rtl = false } = {}) {
  const kept = (lines || [])
    .map((line) => ({ t: String(line.t ?? line.text ?? "").trim(), b: line.b }))
    .filter((line) => line.t && Array.isArray(line.b) && line.b[2] > line.b[0] && line.b[3] > line.b[1]);
  if (!kept.length) return "";
  const ordered = rows(kept, rtl);
  const widest = {};
  for (const row of ordered) widest[row.column] = Math.max(widest[row.column] || 0, width(row));
  let text = "";
  ordered.forEach((row, index) => {
    const own = joinRow(row.lines, rtl);
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
      text += joint(text, own, alike && sameSize && width(before) >= FULL * widest[before.column]);
    }
    text += own;
  });
  return text;
}

/* Whether a piece reads right to left: most of its lines are in a script
   that does. */
export const rightToLeft = (lines) =>
  lines.filter((line) => /[\u0590-\u08ff]/u.test(line.t)).length * 2 > lines.length;

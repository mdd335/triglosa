/* Drawing a panel: every word in a span of its own, the coloured spots on top.

   The word spans are what make a panel clickable, so a panel is rebuilt even
   when there is nothing to colour. data-from/data-to carry the positions in
   the full text — that is what a click reads back to know what it hit. */

import { toTokens } from "../text.js";
import { claimSpot, spotsFor } from "../match/positions.js";
import { isFunctionWord } from "../vocabulary.js";

/* Verbs have three shades, terms three — then round again. Verbs show no more
   forms than that and the term list lets no more through, so the third is
   also the last. */
export const SHADES = 3;

export function markGroups(list, prefix) {
  return (list || []).map((fragments, i) => ({ fragments, cls: `${prefix}${i % SHADES}` }));
}

function writeWords(target, fullText, from, to) {
  for (const token of toTokens(fullText.slice(from, to))) {
    /* What stands between two words is a span too: the hover lights a group
       of words as one stretch, and a space left as bare text would break it
       into boxes with gaps between them. */
    if (!token.isWord) {
      const gap = document.createElement("span");
      gap.className = "g";
      gap.dataset.from = String(from + token.start);
      gap.dataset.to = String(from + token.end);
      gap.textContent = token.text;
      target.appendChild(gap);
      continue;
    }
    const span = document.createElement("span");
    span.className = "w";
    span.dataset.from = String(from + token.start);
    span.dataset.to = String(from + token.end);
    span.textContent = token.text;
    target.appendChild(span);
  }
}

/* The same stretch, with the colours in it. A mark lying on the edge of a
   selected range is split here: the selection is the outer layer, so its
   frame runs around the whole group instead of each word separately. */
function writeWithMarks(target, fullText, from, to, marks) {
  let pos = from;
  for (const mark of marks) {
    const a = Math.max(from, mark.start, pos);
    const b = Math.min(to, mark.end);
    if (a >= b) continue;
    if (a > pos) writeWords(target, fullText, pos, a);
    const span = document.createElement("span");
    span.className = "mark " + mark.cls;
    /* The full extent goes along even when this span shows only a piece of
       it: a click on it should select the whole term. */
    span.dataset.markFrom = String(mark.start);
    span.dataset.markTo = String(mark.end);
    writeWords(span, fullText, a, b);
    target.appendChild(span);
    pos = b;
  }
  if (pos < to) writeWords(target, fullText, pos, to);
}

const overlaps = (spot, list) => list.some((m) => spot.start < m.end && spot.end > m.start);

function freeSpots(marks, fullText, fragment) {
  return spotsFor(fullText, fragment).filter((spot) => !overlaps(spot, marks));
}

/* The parts of ONE row, placed where they stand together.

   Each part used to claim its first free occurrence anywhere in the panel, so
   "The + taxpayer" coloured the sentence's first word and the "mich" of
   "bringst du mich auf dem Laufenden" came out of an earlier clause. So the
   rarest meaning-carrying part is the anchor, every other one takes the free
   occurrence nearest to it, and of all the anchor's occurrences the one that
   keeps the parts closest wins. A function word is taken only where it
   touches a part already placed: on its own it is an occurrence of "the",
   not a piece of this row. */
function claimTogether(marks, fullText, pieces, cls, codes) {
  const content = pieces.filter((piece) => !isFunctionWord(piece, codes));
  const anchors = (content.length ? content : pieces)
    .map((piece) => ({ piece, spots: freeSpots(marks, fullText, piece) }))
    .filter((entry) => entry.spots.length)
    .sort((x, y) => x.spots.length - y.spots.length || y.piece.length - x.piece.length);
  if (!anchors.length) return;
  const [anchor, ...others] = anchors;
  const distance = (a, b) => Math.max(0, b.start - a.end, a.start - b.end);

  let best = null;
  for (const start of anchor.spots) {
    const chosen = [start];
    let cost = 0;
    for (const other of others) {
      const near = other.spots
        .filter((spot) => !overlaps(spot, chosen))
        .sort((x, y) => distance(start, x) - distance(start, y))[0];
      if (!near) continue;
      chosen.push(near);
      cost += distance(start, near);
    }
    if (!best || chosen.length > best.chosen.length
        || (chosen.length === best.chosen.length && cost < best.cost)) best = { chosen, cost };
  }

  const touches = (spot) => best.chosen.some((m) =>
    !/[^\s'’]/.test(fullText.slice(Math.min(m.end, spot.end), Math.max(m.start, spot.start))));
  let open = content.length ? pieces.filter((piece) => isFunctionWord(piece, codes)) : [];
  for (let placed = true; placed && open.length;) {
    placed = false;
    open = open.filter((piece) => {
      const spot = freeSpots(marks, fullText, piece).find((s) => !overlaps(s, best.chosen) && touches(s));
      if (!spot) return true;
      best.chosen.push(spot);
      placed = true;
      return false;
    });
  }
  for (const spot of best.chosen) marks.push({ start: spot.start, end: spot.end, cls });
}

/* What to colour, worked out from the groups.

   Exported because the measurement asks the same question without a window:
   which spots does a panel end up carrying. Recomputing that in the harness
   would measure a copy of this function rather than this function. */
export function collectMarks(fullText, groups, codes) {
  const marks = [];
  for (const group of groups || []) {
    const pieces = [];
    for (const fragment of group.fragments || []) {
      if (freeSpots(marks, fullText, fragment).length) {
        pieces.push(fragment);
        continue;
      }
      /* Multipart: the model answers "behält bei" for a "behält … bei" that
         the sentence splits. In one piece it stands nowhere, its parts do.
         The prompt asks for a plus sign between the halves and a small model
         writes an ellipsis instead - three of 162 fragments, measured, and
         "habe...gebacken" has no whitespace in it at all, so splitting on
         space alone left it as one piece that stands nowhere. The same three
         separators `rangesOf` already accepts. Last stage, so it does not
         soften the normal case. */
      const parts = String(fragment || "").trim().split(/\s*(?:\+|\.{2,}|…)\s*|\s+/);
      if (parts.length < 2) continue;
      pieces.push(...parts.filter((part) => part && !isFunctionWord(part, codes)));
    }
    if (pieces.length === 1) claimSpot(marks, fullText, pieces[0], group.cls);
    else if (pieces.length > 1) claimTogether(marks, fullText, pieces, group.cls, codes);
  }

  marks.sort((x, y) => x.start - y.start);

  /* What belongs to the same row and stands side by side in the text gets ONE
     line, not several. Only across whitespace, and only within one colour: a
     comma or another word between them is a real gap, and two colours side by
     side are two rows and have to stay two lines. */
  const laid = [];
  for (const mark of marks) {
    const last = laid[laid.length - 1];
    if (last && last.cls === mark.cls && mark.start >= last.end
        && !/\S/.test(fullText.slice(last.end, mark.start))) {
      last.end = Math.max(last.end, mark.end);
      continue;
    }
    laid.push(mark);
  }
  return laid;
}

/* Overlapping selected ranges are merged, or they would collide while being
   drawn. Two separated by a gap stay apart — they are meant to be two groups
   with a frame each. */
function mergeSelection(selection) {
  const out = [];
  for (const range of (selection || []).slice().sort((x, y) => x.start - y.start)) {
    const last = out[out.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else out.push({ start: range.start, end: range.end });
  }
  return out;
}

/* `picked` says whether this is the panel the reader picked the word in.
   Only there does the selection get a frame around it: the frame is the
   reader's own doing and belongs where they did it. In the other panels the
   same word is a finding — where the model says it went — so it is lifted off
   the ground and no more, and a translation is never made to look as though
   it had been picked out by hand. */
export function markPanel(box, fullText, groups, selection, codes, picked = true) {
  if (!box || !fullText) return;
  const marks = collectMarks(fullText, groups, codes);
  const ranges = mergeSelection(selection);

  box.textContent = "";
  let pos = 0;
  for (const range of ranges) {
    if (range.start > pos) writeWithMarks(box, fullText, pos, range.start, marks);
    const group = document.createElement("span");
    group.className = picked ? "sel picked" : "sel";
    writeWithMarks(group, fullText, range.start, range.end, marks);
    box.appendChild(group);
    pos = range.end;
  }
  if (pos < fullText.length) writeWithMarks(box, fullText, pos, fullText.length, marks);

  /* Says: in this panel every word stands in a span of its own. Only there
     can a selection snap to word boundaries. */
  box.classList.add("words");
}

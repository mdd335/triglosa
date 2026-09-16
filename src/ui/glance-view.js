/* The hover: over a word of the original, what it became in the reader's own
   translation, and the two places lit up together.

   Nothing is asked here. The run worked the answers out sentence by sentence
   (glance.js); this finds the word under the pointer and says what is known
   about it — the words, "…" while its sentence is still being asked about, or
   nothing at all.

   A verb or a term the reading has already marked keeps its own grouping:
   its words stand together in a mark, and where the mark was found again in
   the reader's panel that is its counterpart, whatever units the hover's own
   answer cut it into. Only where it was not found do the units stand in.

   Over a word of either translation the same, with the two other panels
   lighting up. The sign is the reader's own language wherever it stands, and
   it never stands over the reader's own panel: a word there would be
   answered with itself. */

import { glanceAt, glossOf, unitsOver, withoutHoles } from "../glance.js";
import { element } from "./elements.js";

/* Long enough that a pointer travelling across the text does not trail signs
   behind it, short enough that a pointer resting on a word is answered
   before the reader has decided to click. Once a sign stands, the next word
   is answered at once, the way a row of tooltips is read. */
export const GLANCE_DELAY = 150;
const LEAVE_DELAY = 90;
/* How far the sign stands off the word: nothing at all. Measured in the
   window, the coloured underline of the line above ends 0.8 px over the top
   of the word below it, so a sign set flush with that top covers the line
   entirely and still leaves the hair of air between the two lines. Any gap
   here leaves a piece of that underline showing under the sign, which reads
   as a sign that missed. */
const GAP = 0;

const WORD = ".words[data-panel] .w";
/* A word or the space beside it: both are spans, and the pointer crossing
   from one to the other has not left the text. */
const PIECE = ".words[data-panel] .w, .words[data-panel] .g";
const SHADE = /^[vw]mark\d$/;

export function watchGlance({ sheet, layer, reading }) {
  const sign = element("div", "glance");
  sign.setAttribute("role", "tooltip");
  layer.append(sign);

  /* The word under the pointer, as its panel and position: the spans are
     rebuilt with every drawing, and this is how the same word is found again. */
  let spot = null;
  let timer = 0;
  let leaving = 0;
  let pressed = false;
  /* Whether the word under the pointer has been answered for, whatever the
     answer was — an answer arriving later is then drawn where it belongs. */
  let answered = false;

  const bodyOf = (panel) => sheet.querySelector(`.words[data-panel="${panel}"]`);
  const wordAt = (at) => bodyOf(at.panel)?.querySelector(`.w[data-from="${at.from}"]`) || null;
  const active = () => sign.classList.contains("shown") || !!sheet.querySelector(".glance-lit");

  function unlight() {
    for (const node of sheet.querySelectorAll(".glance-lit")) node.classList.remove("glance-lit", "glance-start", "glance-end");
  }

  /* Words and the spaces between them, so that a group reads as one stretch
     the way a marked term does — its ends rounded, nothing overlapping. */
  function light(panel, ranges) {
    const body = bodyOf(panel);
    if (!body || !ranges.length) return;
    const pieces = [...body.querySelectorAll(".w, .g")];
    const lit = pieces.map((piece) => {
      const from = Number(piece.dataset.from);
      const to = Number(piece.dataset.to);
      return ranges.some((range) => from >= range.start && to <= range.end);
    });
    pieces.forEach((piece, i) => {
      if (!lit[i]) return;
      piece.classList.add("glance-lit");
      piece.classList.toggle("glance-start", !lit[i - 1]);
      piece.classList.toggle("glance-end", !lit[i + 1]);
    });
  }

  function hide() {
    sign.classList.remove("shown", "pending");
    unlight();
  }

  function marks(panel, shade) {
    const body = bodyOf(panel);
    if (!body || !shade) return [];
    const seen = new Map();
    for (const mark of body.querySelectorAll(`.mark.${shade}`)) {
      seen.set(mark.dataset.markFrom, { start: Number(mark.dataset.markFrom), end: Number(mark.dataset.markTo) });
    }
    return [...seen.values()].sort((x, y) => x.start - y.start);
  }

  const shadesIn = (panel) => [...new Set([...(bodyOf(panel)?.querySelectorAll(".mark") || [])]
    .map((mark) => [...mark.classList].find((name) => SHADE.test(name)))
    .filter(Boolean))];

  /* What is known about the word, as { source, target, extra, sign, pending }:
     the ranges to light in the original, in the reader's panel and in the
     other translation, and what stands over the word.

     The sign is the reader's own language wherever it appears, and it never
     appears over their own panel: there it would say what stands there. */
  function resolve(state, reader, panel, word) {
    const glance = state?.glance;
    if (!glance) return null;
    /* Which panel is which: the two the alignment was asked about, and the
       one holding the reader's own language — the original itself where the
       text is in it. */
    const columns = glance.panels
      || [glance.panel ?? state.panels.findIndex((entry, index) => index > 0 && entry.code === reader)];
    const own = glance.reader ?? columns[0];
    const [first, other = -1] = columns;
    const side = panel === 0 ? "source" : panel === first ? "target" : panel === other ? "second" : null;
    if (side === null || first < 1) return null;
    const textOf = (index) => state.panels[index]?.text || "";

    /* What the sign says: the reader's own words, wherever they stand. Over
       their own panel nothing is written — a word there would be answered
       with itself. */
    const said = (ranges) => {
      if (panel === own) return "";
      if (own === 0) return glossOf(textOf(0), ranges.source);
      if (own === first) return glossOf(textOf(first), ranges.target);
      return glossOf(textOf(other), ranges.extra);
    };

    const shade = [...(word.closest(".mark")?.classList || [])].find((name) => SHADE.test(name));
    if (shade) {
      const source = marks(0, shade);
      const target = marks(first, shade);
      const extra = other === -1 ? [] : marks(other, shade);
      const ranges = { source, target, extra };
      if (source.length && target.length) {
        return { first, other, ...ranges, sign: said(ranges) };
      }
      if (side === "source" && source.length) {
        const units = source.flatMap((range) => unitsOver(glance, range.start, range.end));
        const found = {
          source,
          target: units.flatMap((unit) => unit.to),
          extra: units.flatMap((unit) => unit.second?.to || []),
        };
        if (found.target.length || found.extra.length) return { first, other, ...found, sign: said(found) };
      }
    }

    const unit = glanceAt(glance, side, Number(word.dataset.from));
    if (!unit) return null;
    if (unit.pending) {
      return panel === own ? null : { first, other, source: [], target: [], extra: [], sign: "…", pending: true };
    }
    const secondTo = unit.second?.to || [];
    if (!unit.to.length && !secondTo.length && own !== 0) return null;

    /* A marked verb or term is one group, and nothing else's: where the
       hover's unit runs into one — "del archipiélago canario" against the
       term "archipiélago canario" — the unit keeps what lies outside the mark
       in every panel, and the word under the pointer the piece it is in. */
    const position = Number(word.dataset.from);
    const inside = (ranges) => ranges.filter((range) => position >= range.start && position < range.end);
    const shades = shadesIn(0).filter((name) =>
      marks(0, name).some((range) => range.start < unit.end && range.end > unit.start));
    const found = { source: [{ start: unit.start, end: unit.end }], target: unit.to, extra: secondTo };
    if (shades.length) {
      const holes = (at) => shades.flatMap((name) => marks(at, name));
      found.source = withoutHoles(textOf(0), found.source, holes(0));
      found.target = withoutHoles(textOf(first), found.target, holes(first));
      found.extra = other === -1 ? [] : withoutHoles(textOf(other), found.extra, holes(other));
      const mine = side === "source" ? found.source : side === "target" ? found.target : found.extra;
      if (!inside(mine).length) return null;
      if (side === "source") found.source = inside(found.source);
      if (!found.source.length) return null;
    }
    return { first, other, ...found, sign: said(found) };
  }

  /* One place for a group, whichever of its words the pointer is on: over the
     middle of its first line in the original. A sign that jumped from word to
     word within one group would say it was a different answer each time. */
  function anchor(word) {
    if (!word.classList.contains("glance-lit")) return word.getBoundingClientRect();
    const pieces = [...word.closest(".words").querySelectorAll(".w, .g")];
    let first = pieces.indexOf(word);
    while (first > 0 && !pieces[first].classList.contains("glance-start")) first--;
    const run = [];
    for (let i = first; i < pieces.length; i++) {
      run.push(pieces[i]);
      if (pieces[i].classList.contains("glance-end")) break;
    }
    const boxes = run.map((piece) => piece.getBoundingClientRect()).filter((box) => box.width || box.height);
    if (!boxes.length) return word.getBoundingClientRect();
    const line = boxes.filter((box) => Math.abs(box.top - boxes[0].top) < 2);
    const left = Math.min(...line.map((box) => box.left));
    const right = Math.max(...line.map((box) => box.right));
    return { left, right, width: right - left, top: boxes[0].top, bottom: boxes[0].bottom };
  }

  function place(word) {
    const box = anchor(word);
    const width = sign.offsetWidth;
    const height = sign.offsetHeight;
    const room = window.innerWidth || document.documentElement.clientWidth || 0;
    const left = Math.max(8, Math.min(box.left + box.width / 2 - width / 2, room - width - 8));
    /* Over the word, the first line too — the sign may stand over the
       window's own line for as long as the pointer rests; under it only
       where the window ends above. */
    const top = box.top - height - GAP < 4 ? box.bottom + GAP : box.top - height - GAP;
    sign.style.left = `${Math.round(left)}px`;
    sign.style.top = `${Math.round(top)}px`;
  }

  function show() {
    answered = true;
    unlight();
    const word = spot && wordAt(spot);
    const now = reading();
    if (!word || !now || pressed || document.documentElement.classList.contains("pointer-stale")) {
      hide();
      return;
    }
    const found = resolve(now.state, now.reader, spot.panel, word);
    if (!found) {
      hide();
      return;
    }
    if (found.target.length || found.extra.length || found.source.length) {
      light(0, found.source);
      light(found.first, found.target);
      if (found.other >= 0) light(found.other, found.extra);
    }
    if (!found.sign) {
      sign.classList.remove("shown", "pending");
      return;
    }
    sign.textContent = found.sign;
    sign.classList.toggle("pending", !!found.pending);
    sign.classList.add("shown");
    place(word);
  }

  function leave() {
    clearTimeout(timer);
    clearTimeout(leaving);
    spot = null;
    answered = false;
    hide();
  }

  sheet.addEventListener("mouseover", (event) => {
    const word = event.target.closest?.(WORD);
    if (!word) return;
    clearTimeout(leaving);
    const next = { panel: Number(word.closest(".words").dataset.panel), from: Number(word.dataset.from) };
    if (spot && spot.panel === next.panel && spot.from === next.from) return;
    /* Another word of the group already lit: the same answer, left where it is. */
    if (spot && spot.panel === next.panel && word.classList.contains("glance-lit") && answered) {
      spot = next;
      return;
    }
    spot = next;
    answered = false;
    clearTimeout(timer);
    if (active()) show();
    else timer = setTimeout(show, GLANCE_DELAY);
  });
  /* Leaving a word for the space between two words is not leaving the text:
     the next word is a few pixels away, and a sign that went and came back
     between them would flicker across every line — and it flickered on every
     space, once the spaces became spans of their own. What the pointer sits
     on between two words is still the group it was on. */
  sheet.addEventListener("mouseout", (event) => {
    if (!event.target.closest?.(PIECE) || event.relatedTarget?.closest?.(PIECE)) return;
    clearTimeout(leaving);
    leaving = setTimeout(leave, LEAVE_DELAY);
  });
  /* A press is a pick, and the picked word's area is what answers it. */
  sheet.addEventListener("mousedown", () => { pressed = true; leave(); });
  document.addEventListener("mouseup", () => { pressed = false; });
  sheet.addEventListener("scroll", leave, { passive: true });
  window.addEventListener("blur", leave);

  return {
    /* After every drawing: the spans the lights were on are gone, and an
       answer may have arrived for the word the pointer is resting on. */
    refresh() {
      if (spot && answered) show();
    },
    hide: leave,
  };
}

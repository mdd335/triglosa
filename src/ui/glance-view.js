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

import { glanceAt, glanceUnitsAt, glossOf, unitsOver, withoutHoles, withoutParts } from "../glance.js";
import { onPhone } from "../system.js";
import { element } from "./elements.js";
import { onTouchMark } from "./selection.js";

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

/* signs: whether the sign over a word is wanted (`settings.glance`); the
   places light up either way. */
export function watchGlance({ sheet, layer, reading, signs = () => true }) {
  const sign = element("div", "glance");
  sign.setAttribute("role", "tooltip");
  layer.append(sign);

  /* The word under the pointer, as its panel and position: the spans are
     rebuilt with every drawing, and this is how the same word is found again. */
  let spot = null;
  let timer = 0;
  let leaving = 0;
  let pressed = false;
  /* On a phone, what a finger marked (selection.js), as { box, panel,
     start, end, touching }: the sign and the lights stand for it. */
  let marked = null;
  /* Whether the word under the pointer has been answered for, whatever the
     answer was — an answer arriving later is then drawn where it belongs. */
  let answered = false;

  const bodyOf = (panel) => sheet.querySelector(`.words[data-panel="${panel}"]`);
  const wordAt = (at) => bodyOf(at.panel)?.querySelector(`.w[data-from="${at.from}"]`) || null;
  /* Whether an answer stands — the sign, or the places lit in every panel —
     as against a group lit in its own panel while the pointer has not yet
     rested. */
  let standing = false;
  const active = () => standing;

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
    standing = false;
  }

  /* The group under the pointer in its own panel, the moment the pointer
     arrives: without it the word showed its own darker ground until the
     answer stood, a single word where the group was to come. */
  function preview() {
    unlight();
    const word = spot && wordAt(spot);
    const now = reading();
    if (!word || !now || pressed || document.documentElement.classList.contains("pointer-stale")) return;
    const found = resolve(now.state, now.reader, spot.panel, word);
    if (!found) return;
    const here = spot.panel === 0 ? found.source : spot.panel === found.first ? found.target : found.extra;
    light(spot.panel, here || []);
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
  /* Which panel is which: the two the alignment was asked about, and the
     one holding the reader's own language — the original itself where the
     text is in it. */
  function columnsOf(state, reader) {
    const glance = state?.glance;
    if (!glance) return null;
    const columns = glance.panels
      || [glance.panel ?? state.panels.findIndex((entry, index) => index > 0 && entry.code === reader)];
    const [first, other = -1] = columns;
    return { own: glance.reader ?? columns[0], first, other };
  }

  /* What the sign says: the reader's own words, wherever they stand. Over
     their own panel nothing is written — a word there would be answered
     with itself. */
  function saidOver(state, { own, first, other }, panel, ranges) {
    const textOf = (index) => state.panels[index]?.text || "";
    if (panel === own) return "";
    if (own === 0) return glossOf(textOf(0), ranges.source);
    if (own === first) return glossOf(textOf(first), ranges.target);
    return glossOf(textOf(other), ranges.extra);
  }

  function resolve(state, reader, panel, word) {
    const glance = state?.glance;
    const columns = columnsOf(state, reader);
    if (!columns) return null;
    const { own, first, other } = columns;
    const side = panel === 0 ? "source" : panel === first ? "target" : panel === other ? "second" : null;
    if (side === null || first < 1) return null;
    const textOf = (index) => state.panels[index]?.text || "";
    const said = (ranges) => saidOver(state, columns, panel, ranges);

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

    const position = Number(word.dataset.from);
    const unit = glanceAt(glance, side, position);
    if (!unit) return null;
    if (unit.pending) {
      return panel === own ? null : { first, other, source: [], target: [], extra: [], sign: "…", pending: true };
    }
    const inside = (ranges) => ranges.filter((range) => position >= range.start && position < range.end);

    /* What one unit says about the word. */
    const foundOf = (unit) => {
      const secondTo = unit.second?.to || [];
      if (!unit.to.length && !secondTo.length && own !== 0) return null;
      /* A unit of the third panel's own: its place there, what it became in
         the reader's panel and the words of the source text it renders. */
      const third = unit.third ? { source: unit.source, target: unit.to, extra: [{ start: unit.start, end: unit.end }] } : null;

      /* A marked verb or term is one group, and nothing else's: where the
         hover's unit runs into one — "del archipiélago canario" against the
         term "archipiélago canario" — the unit keeps what lies outside the
         mark in every panel, and the word under the pointer the piece it is
         in. */
      const span = third ? third.source : [{ start: unit.start, end: unit.end }];
      const shades = shadesIn(0).filter((name) =>
        marks(0, name).some((range) => span.some((part) => range.start < part.end && range.end > part.start)));
      const found = third || { source: [{ start: unit.start, end: unit.end }], target: unit.to, extra: secondTo };
      if (shades.length) {
        const holes = (at) => shades.flatMap((name) => marks(at, name));
        const cut = third ? null : withoutParts(unit, holes(0), { source: textOf(0), target: textOf(first), extra: textOf(other) });
        if (cut) Object.assign(found, cut, { extra: other === -1 ? [] : cut.extra });
        found.source = withoutHoles(textOf(0), found.source, holes(0));
        found.target = withoutHoles(textOf(first), found.target, holes(first));
        found.extra = other === -1 ? [] : withoutHoles(textOf(other), found.extra, holes(other));
        const mine = side === "source" ? found.source : side === "target" ? found.target : found.extra;
        if (!inside(mine).length) return null;
        if (side === "source") found.source = inside(found.source);
        if (!found.source.length) return null;
      }
      return found;
    };

    /* A word of a translation that renders several units of the original
       answers for all of them, their places side by side. */
    const all = glanceUnitsAt(glance, side, position).map(foundOf).filter(Boolean);
    if (!all.length) return null;
    const joined = (ranges) => ranges
      .map((range) => ({ start: range.start, end: range.end }))
      .sort((x, y) => x.start - y.start)
      .reduce((out, range) => {
        const last = out[out.length - 1];
        if (last && range.start < last.end) last.end = Math.max(last.end, range.end);
        else out.push(range);
        return out;
      }, []);
    const found = all.length === 1 ? all[0] : {
      source: joined(all.flatMap((one) => one.source)),
      target: joined(all.flatMap((one) => one.target)),
      extra: joined(all.flatMap((one) => one.extra)),
    };
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
    /* A phone's page is enlarged (`zoom` in style.css): the words' boxes
       come in the screen's measure, and the sign's own size and place are
       counted in the page's. */
    const zoom = Number.parseFloat(window.getComputedStyle?.(layer).zoom) || 1;
    const width = sign.offsetWidth * zoom;
    const height = sign.offsetHeight * zoom;
    const room = window.innerWidth || document.documentElement.clientWidth || 0;
    const left = Math.max(8, Math.min(box.left + box.width / 2 - width / 2, room - width - 8));
    /* Over the word, the first line too — the sign may stand over the
       window's own line for as long as the pointer rests; under it only
       where the window ends above. */
    const top = box.top - height - GAP < 4 ? box.bottom + GAP : box.top - height - GAP;
    sign.style.left = `${Math.round(left / zoom)}px`;
    sign.style.top = `${Math.round(top / zoom)}px`;
  }

  function show() {
    answered = true;
    unlight();
    const word = spot && wordAt(spot);
    const now = reading();
    const stale = document.documentElement.classList.contains("pointer-stale");
    if (!word || !now || pressed || stale) {
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
    standing = !!sheet.querySelector(".glance-lit");
    if (!found.sign || !signs()) {
      sign.classList.remove("shown", "pending");
      return;
    }
    standing = true;
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
    showPick();
  }

  /* On a phone nothing hovers, and the mouse events the system makes up
     after a tap would leave a sign standing over the word just picked: the
     sign stands for what a finger marked instead (below). */
  if (!onPhone()) sheet.addEventListener("mouseover", (event) => {
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
    else {
      preview();
      timer = setTimeout(show, GLANCE_DELAY);
    }
  });
  /* Leaving a word for the space between two words is not leaving the text:
     the next word is a few pixels away, and a sign that went and came back
     between them would flicker across every line — and it flickered on every
     space, once the spaces became spans of their own. What the pointer sits
     on between two words is still the group it was on. */
  if (!onPhone()) sheet.addEventListener("mouseout", (event) => {
    if (!event.target.closest?.(PIECE) || event.relatedTarget?.closest?.(PIECE)) return;
    clearTimeout(leaving);
    leaving = setTimeout(leave, LEAVE_DELAY);
  });
  /* A press is a pick, and the picked word's area is what answers it. */
  if (onPhone()) watchMarks();
  else {
    sheet.addEventListener("mousedown", () => { pressed = true; leave(); });
    document.addEventListener("mouseup", () => { pressed = false; });
    sheet.addEventListener("scroll", leave, { passive: true });
    window.addEventListener("blur", leave);
  }

  /* Tapped or swept (author 2026-11-11, in place of a finger held and
     slid, which covered the words it was answering for): what a finger
     marked stays lit in its panel, exactly those words, its places in the
     others, and once the finger is lifted the sign over it says what it
     became — one word or several, until the mark goes. */
  function watchMarks() {
    onTouchMark((mark) => {
      /* Another sheet's words (the first steps hold one of their own), or
         words that are no panel's: nothing for the sign. */
      const ours = mark && mark.box.matches?.(".words[data-panel]") && (!mark.box.isConnected || sheet.contains(mark.box));
      marked = ours ? mark : null;
      settle();
    });
    /* The page scrolls under a mark that stays: the sign goes with it. */
    document.addEventListener("scroll", () => { if (marked) placeMarked(); }, { passive: true, capture: true });
  }

  const wordsIn = (panel, start, end) => {
    const body = bodyOf(panel);
    return body ? [...body.querySelectorAll(".w")]
      .filter((word) => Number(word.dataset.from) >= start && Number(word.dataset.to) <= end) : [];
  };
  const markedWords = () => (marked ? wordsIn(marked.panel, marked.start, marked.end) : []);

  /* The places of a stretch of words in every panel, as the aligner knows
     them: { columns, found, pending, own }, own being the stretch's own
     side, or null where nothing is known. */
  function placesOf(now, panel, start, end) {
    const words = wordsIn(panel, start, end);
    if (!words.length) return null;
    const columns = columnsOf(now.state, now.reader);
    const found = { source: [], target: [], extra: [] };
    let pending = false;
    for (const word of words) {
      const one = resolve(now.state, now.reader, panel, word);
      if (!one) continue;
      if (one.pending) pending = true;
      for (const side of ["source", "target", "extra"]) found[side].push(...(one[side] || []));
    }
    /* Sorted, and closed where only a space parts two: one stretch, as a
       group is lit. */
    const textOf = (index) => now.state.panels[index]?.text || "";
    const merged = (ranges, text) => ranges
      .map((range) => ({ start: range.start, end: range.end }))
      .sort((x, y) => x.start - y.start)
      .reduce((out, range) => {
        const last = out[out.length - 1];
        if (last && (range.start <= last.end || /^[\s'’-]*$/.test(text.slice(last.end, range.start)))) last.end = Math.max(last.end, range.end);
        else out.push(range);
        return out;
      }, []);
    const panelOf = { source: 0, target: columns?.first, extra: columns?.other };
    for (const side of ["source", "target", "extra"]) found[side] = merged(found[side], textOf(panelOf[side]));
    const own = !columns || columns.first < 1 ? null
      : panel === 0 ? "source" : panel === columns.first ? "target" : panel === columns.other ? "extra" : null;
    /* In its own panel the group the words belong to, the words themselves
       always among it: on a phone the group stands lit faintly round what
       the finger marked (author 2026-11-12), the sign saying what the group
       became. */
    if (own) found[own] = merged([...found[own], { start, end }], textOf(panel));
    return { columns, found, pending, own };
  }

  function lightAll({ columns, found }, without = null) {
    if (!columns || columns.first < 1) return;
    if (without !== "source") light(0, found.source);
    if (without !== "target") light(columns.first, found.target);
    if (columns.other >= 0 && without !== "extra") light(columns.other, found.extra);
  }

  function showMarked() {
    hide();
    const now = reading();
    const places = now && placesOf(now, marked.panel, marked.start, marked.end);
    if (!places) return;
    const { panel } = marked;
    lightAll(places);
    if (!places.own) light(panel, [{ start: marked.start, end: marked.end }]);
    standing = true;
    /* While the finger still sweeps, no sign: it would stand over words
       still being chosen. */
    if (marked.touching || !signs()) return;
    const { columns, found, pending } = places;
    const said = columns ? saidOver(now.state, columns, panel, found) : "";
    const text = said || (pending && panel !== columns?.own ? "…" : "");
    if (!text) return;
    sign.textContent = text;
    sign.classList.toggle("pending", !said);
    sign.classList.add("shown");
    placeMarked();
  }

  /* A word picked and its answer not in yet: its places in the other
     panels stand lit as the aligner knows them until the answer says
     where it went — they went out with the pointer or the mark and came
     back only with the answer. Its own panel has its frame. */
  function showPick() {
    const now = reading();
    const selection = now?.state?.selection;
    if (!selection || selection.inSentence || selection.entry != null || now.state.marked || pressed) return;
    const places = placesOf(now, selection.panel, selection.start, selection.end);
    if (places?.own) lightAll(places, places.own);
  }

  function settle() {
    if (marked) showMarked();
    else if (spot) {
      if (answered) show();
    } else {
      hide();
      showPick();
    }
  }

  function placeMarked() {
    const word = markedWords()[0];
    if (!word || !sign.classList.contains("shown")) return;
    place(word);
    /* Scrolled out of sight, or under the bar and the row laid over the
       page's foot, the word has no sign standing over the bars instead:
       a phone's whole page scrolls, so the sheet's own box says nothing of
       what can be seen. What is at the word's middle says it. */
    sign.style.visibility = inSight(word) ? "" : "hidden";
  }

  function inSight(word) {
    if (typeof document.elementFromPoint !== "function") return true;
    const box = word.getBoundingClientRect();
    if (!box.width && !box.height) return true;
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && word.contains(hit);
  }

  return {
    /* After every drawing: the spans the lights were on are gone, and an
       answer may have arrived for the word the pointer is resting on. */
    refresh: settle,
    hide: leave,
  };
}

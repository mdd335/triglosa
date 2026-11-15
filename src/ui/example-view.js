/* The example in the first steps: a reading made beforehand — the original,
   the translation into the reader's own language and one more, the terms
   and the verb marked in all three, what each word became, and an entry for
   every word of the original. Nothing is asked of a model or of the device,
   so it stands at once, on a first start with nothing set up, on every
   system.

   It is a snapshot (example-snapshot.js), taken from the reading window by
   scripts/example-snapshot.mjs, and drawn here without it: a change to the
   reading window leaves the example as it is (author 2026-11-13). Only the
   stylesheet is shared, so it looks like the window around it.

   What it does, all of it here: a word under the pointer gets the sign over
   it saying what it became and its places lit; a word of the original
   clicked brings its entry under the translations and its spots in them. On
   a phone a tap does both at once — one word at a time, no sweep over
   several (author 2026-11-13). The sign always stands over the word. Its
   buttons are there to be seen; none of them does anything. */

import { element } from "./elements.js";
import { onPhone } from "../system.js";
import { EXAMPLE_SNAPSHOT } from "./example-snapshot.js";

/* As in a reading: long enough that a pointer travelling across the text
   trails no signs, short enough to answer before the reader clicks; once a
   sign stands, the next word is answered at once. */
const DELAY = 150;
const LEAVE = 90;
/* How far a finger moves before a tap is a scroll. */
const SLOP = 10;

/* The snapshot for an interface language; English for one without. */
export const snapshotFor = (reader) => EXAMPLE_SNAPSHOT[reader] || EXAMPLE_SNAPSHOT.en;

export function exampleView(example, reader, { onResize = () => {} } = {}) {
  const shot = snapshotFor(reader);
  const holder = element("div", "welcome-example");
  const sheet = element("div", "sheet welcome-example-sheet");
  sheet.innerHTML = shot.sheet;
  const sign = element("div", "glance");
  sign.setAttribute("role", "tooltip");
  holder.append(sheet, sign);
  const unpicked = [0, 1, 2].map((panel) => boxOf(panel).innerHTML);
  const phone = onPhone();

  function boxOf(panel) {
    return sheet.querySelector(`.words[data-panel="${panel}"]`);
  }
  const keyOf = (word) => `${word.closest(".words").dataset.panel}:${word.dataset.from}`;

  function frame() {
    /* No system selection under a finger, the page still scrolling. */
    if (phone) for (const panel of [0, 1, 2]) boxOf(panel)?.classList.add("touch-words");
  }
  frame();

  /* A word of the original picked: its texts and its entry as the snapshot
     holds them, the entry after the three texts. */
  function pick(word) {
    const at = shot.picks[word.dataset.from];
    if (at == null) return false;
    const entry = shot.entries[at];
    [0, 1, 2].forEach((panel) => {
      const [front, back, middle] = entry.boxes[panel];
      const was = unpicked[panel];
      boxOf(panel).innerHTML = was.slice(0, front) + middle + was.slice(was.length - back);
    });
    sheet.querySelector(".pane.example-picked")?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = entry.pane;
    const pane = wrap.firstElementChild;
    pane.classList.add("example-picked");
    sheet.querySelectorAll(":scope > .pane")[2].after(pane);
    frame();
    onResize();
    return true;
  }

  function unlight() {
    for (const node of sheet.querySelectorAll(".glance-lit")) node.classList.remove("glance-lit", "glance-start", "glance-end");
  }

  /* Words and the spaces between them, so that a group reads as one
     stretch the way a marked term does — its ends rounded. */
  function light(stretches) {
    for (const panel of [0, 1, 2]) {
      const ranges = stretches.filter(([at]) => at === panel);
      if (!ranges.length) continue;
      const pieces = [...boxOf(panel).querySelectorAll(".w, .g")];
      const lit = pieces.map((piece) => ranges.some(([, start, end]) =>
        Number(piece.dataset.from) >= start && Number(piece.dataset.to) <= end));
      pieces.forEach((piece, i) => {
        if (!lit[i]) return;
        piece.classList.add("glance-lit");
        piece.classList.toggle("glance-start", !lit[i - 1]);
        piece.classList.toggle("glance-end", !lit[i + 1]);
      });
    }
  }

  function hide() {
    sign.classList.remove("shown");
    unlight();
  }

  /* Over the middle of the word's lit stretch on its line — one place for a
     group, whichever of its words is pointed at — and always over it. */
  function place(word) {
    const pieces = [...word.closest(".words").querySelectorAll(".w, .g")];
    let first = pieces.indexOf(word);
    let last = first;
    if (word.classList.contains("glance-lit")) {
      while (first > 0 && !pieces[first].classList.contains("glance-start")) first--;
      while (last < pieces.length - 1 && !pieces[last].classList.contains("glance-end")) last++;
    }
    const own = word.getBoundingClientRect();
    const boxes = pieces.slice(first, last + 1).map((piece) => piece.getBoundingClientRect())
      .filter((box) => (box.width || box.height) && Math.abs(box.top - own.top) < 2);
    const left = Math.min(own.left, ...boxes.map((box) => box.left));
    const right = Math.max(own.right, ...boxes.map((box) => box.right));
    /* The page may be enlarged (a phone's sheet): boxes come in the
       screen's measure, the sign is placed in the holder's own. */
    const outer = holder.getBoundingClientRect();
    const scale = holder.offsetWidth ? outer.width / holder.offsetWidth : 1;
    const middle = ((left + right) / 2 - outer.left) / scale;
    const width = sign.offsetWidth;
    const x = Math.max(0, Math.min(middle - width / 2, holder.clientWidth - width));
    sign.style.left = `${Math.round(x)}px`;
    sign.style.top = `${Math.round((own.top - outer.top) / scale - sign.offsetHeight)}px`;
  }

  /* What the snapshot says about a word: its sign and its places. */
  function answer(word) {
    hide();
    const found = shot.hover[keyOf(word)];
    if (!found) return false;
    const [said, stretches] = found;
    light(stretches);
    if (!said) return !!stretches.length;
    sign.textContent = said;
    sign.classList.add("shown");
    place(word);
    return true;
  }

  const wordIn = (target) => target?.closest?.(".words[data-panel] .w") || null;

  if (phone) {
    let down = null;
    sheet.addEventListener("touchstart", (event) => {
      const touch = event.touches?.[0];
      down = event.touches?.length === 1 && touch ? { x: touch.clientX, y: touch.clientY, word: wordIn(event.target) } : null;
    }, { passive: true });
    sheet.addEventListener("touchmove", (event) => {
      const touch = event.touches?.[0];
      if (down && touch && Math.hypot(touch.clientX - down.x, touch.clientY - down.y) > SLOP) down = null;
    }, { passive: true });
    sheet.addEventListener("touchend", (event) => {
      const tapped = down;
      down = null;
      if (!tapped) return;
      if (!tapped.word) {
        hide();
        return;
      }
      /* A tap is the whole answer: no click after it. */
      event.preventDefault();
      const key = keyOf(tapped.word);
      if (key.startsWith("0:")) pick(tapped.word);
      const [panel, from] = key.split(":");
      const word = boxOf(panel).querySelector(`.w[data-from="${from}"]`);
      if (word) answer(word);
    });
    /* A tap anywhere else on the page lets the sign go. */
    document.addEventListener("touchstart", (event) => {
      if (!sheet.contains(event.target)) hide();
    }, { passive: true, capture: true });
  } else {
    let spot = "";
    let timer = 0;
    let leaving = 0;
    sheet.addEventListener("mouseover", (event) => {
      const word = wordIn(event.target);
      if (!word) return;
      clearTimeout(leaving);
      const key = keyOf(word);
      if (key === spot) return;
      spot = key;
      clearTimeout(timer);
      if (sign.classList.contains("shown") || sheet.querySelector(".glance-lit")) answer(word);
      else timer = setTimeout(() => answer(word), DELAY);
    });
    /* The space between two words is still the text. */
    sheet.addEventListener("mouseout", (event) => {
      const piece = ".words[data-panel] .w, .words[data-panel] .g";
      if (!event.target.closest?.(piece) || event.relatedTarget?.closest?.(piece)) return;
      clearTimeout(leaving);
      leaving = setTimeout(() => {
        clearTimeout(timer);
        spot = "";
        hide();
      }, LEAVE);
    });
    sheet.addEventListener("mousedown", () => {
      clearTimeout(timer);
      spot = "";
      hide();
    });
    sheet.addEventListener("click", (event) => {
      const word = wordIn(event.target);
      if (word && word.closest(".words").dataset.panel === "0") pick(word);
    });
  }

  /* A press on a button says nothing, not even "copied". */
  sheet.addEventListener("click", (event) => {
    if (!event.target.closest?.("button")) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  /* A row under the pointer lights its spots in the three texts, as in the
     reading window: the attribute on the window's own root, which the
     stylesheet reads. */
  const root = () => holder.closest("#app");
  sheet.addEventListener("mouseover", (event) => {
    const row = event.target.closest?.(".row[data-hl]");
    if (row && root()) root().dataset.hl = row.dataset.hl;
  });
  sheet.addEventListener("mouseout", (event) => {
    if (event.target.closest?.(".row[data-hl]") && root()) delete root().dataset.hl;
  });
  return holder;
}

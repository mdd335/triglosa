/* Picking a word out of a panel, by click or by dragging across several.

   Only panels drawn word by word take part; a panel still standing as plain
   text keeps the system's own selection. */

import { onPhone } from "../system.js";


const wordSpan = (node) => {
  while (node && node !== document) {
    if (node.nodeType === 1 && node.classList?.contains("w")) return node;
    node = node.parentNode;
  }
  return null;
};

const spanOf = (element) => ({
  start: Number(element.dataset.from),
  end: Number(element.dataset.to),
});

/* A click takes the word under the pointer, inside a coloured term too
   (author 2026-11-05, reversing the whole term): the term has its row
   already, and one of its words is what a reader clicking it wants to know
   about. Several words are picked by dragging across them, or on a phone
   by a finger swept across them and the button. */
function fromClick(target) {
  const word = wordSpan(target);
  return word ? spanOf(word) : null;
}

/* panel is the index the panel has; onPick gets { panel, start, end } once the
   pointer is released. */
/* On a phone a word is marked by a tap, several by a finger swept sideways
   across them, over lines too (author 2026-11-11): the mark stays when the
   finger is lifted — in a panel with the sign over it and its places lit in
   the others (glance-view.js) — and the row over the bar looks up what
   is marked, one word or several alike, in every box that has words.
   Swept up or down, the page scrolls. Another tap marks anew, a tap beside
   the words lets the mark go. The system's own selection plays no part in
   these boxes. */
let touchPick = null;
let touchLabel = "";
/* What is marked: the box, its key, the words' place and text, and how it
   is picked. The boxes are drawn anew with every drawing; the mark goes
   with the box of the same key whose words are still the same. */
let touchMark = null;
const markListeners = new Set();
/* SLOP: how far a finger moves before it is a sweep or a scroll. */
const SLOP = 10;

/* What is marked, as { box, panel, start, end, touching }, or null: the
   hover hears of it to light the other panels and write the sign. */
export function onTouchMark(listener) {
  markListeners.add(listener);
  return () => markListeners.delete(listener);
}

const tell = () => {
  const mark = touchMark && { box: touchMark.box, panel: touchMark.panel, start: touchMark.start, end: touchMark.end, touching: !!touchMark.touching };
  for (const listener of markListeners) listener(mark);
};

/* What the row says it does. */
export function nameTouchPick(label) {
  touchLabel = String(label || "");
  if (!touchPick) return;
  touchPick.querySelector(".touch-pick-label").textContent = touchLabel;
  touchPick.setAttribute("aria-label", `${touchLabel}: ${touchPick.querySelector(".touch-pick-text").textContent}`);
}

/* A row on the bar for as long as something is marked: what is marked,
   and the lookup. The whole row is the button. */
function touchPickButton() {
  if (touchPick?.isConnected) return touchPick;
  touchPick = document.createElement("button");
  touchPick.type = "button";
  touchPick.className = "touch-pick";
  touchPick.hidden = true;
  const marked = document.createElement("span");
  marked.className = "touch-pick-text";
  const label = document.createElement("span");
  label.className = "touch-pick-label";
  const action = document.createElement("span");
  action.className = "touch-pick-action";
  action.append(label);
  touchPick.append(marked, action);
  nameTouchPick(touchLabel);
  /* On the press, not the click: the tap's own end would otherwise read as
     a tap beside the words. */
  const press = (event) => {
    event.preventDefault();
    const mark = touchMark;
    unmark();
    mark?.act?.();
  };
  touchPick.addEventListener("touchstart", press, { passive: false });
  touchPick.addEventListener("mousedown", press);
  document.body.append(touchPick);
  return touchPick;
}

const wordsOf = (box) => [...box.querySelectorAll(".w")];

const MARKED = ["touch-marked", "touch-first", "touch-last"];
function clear(box) {
  for (const piece of box.querySelectorAll(".touch-marked")) piece.classList.remove(...MARKED);
}

/* The words and the spaces between them, one stretch as the hover lights
   one, its ends named: there it is rounded and reaches into the space
   beside it, a mark of its own laid over its group's (author 2026-11-12).
   The words are what is returned. */
function paint(box, start, end) {
  clear(box);
  const within = (piece) => Number(piece.dataset.from) >= start && Number(piece.dataset.to) <= end;
  const pieces = [...box.querySelectorAll(".w, .g")].filter(within);
  for (const piece of pieces) piece.classList.add("touch-marked");
  pieces[0]?.classList.add("touch-first");
  pieces.at(-1)?.classList.add("touch-last");
  return wordsOf(box).filter(within);
}

function unmark() {
  if (touchMark?.box) clear(touchMark.box);
  touchMark = null;
  document.documentElement.classList.remove("touch-marking");
  if (touchPick) touchPick.hidden = true;
  tell();
}

function mark(box, key, panel, onPick, start, end, touching) {
  /* Marked anew in another box: the old one's words let go. */
  if (touchMark?.box && touchMark.box !== box) clear(touchMark.box);
  const words = paint(box, start, end);
  if (!words.length) return unmark();
  const pick = { panel, start, end };
  touchMark = { box, key, panel, start, end, touching, text: words.map((word) => word.textContent).join(" "), act: () => onPick(pick) };
  const row = touchPickButton();
  /* As it stands, the spaces and marks between the words included. */
  const stretch = document.createRange();
  stretch.setStartBefore(words[0]);
  stretch.setEndAfter(words[words.length - 1]);
  row.querySelector(".touch-pick-text").textContent = stretch.toString().replace(/\s+/g, " ").trim();
  nameTouchPick(touchLabel);
  row.hidden = false;
  /* On the bar along the bottom, wherever its top is. */
  const bar = document.querySelector(".window-actions");
  const edge = bar?.getBoundingClientRect();
  const top = edge && edge.height > 0 ? edge.top : window.innerHeight;
  /* Rounded down: the row reaches into the bar rather than leave a hair
     of the page between them. */
  row.style.bottom = `${Math.max(0, Math.floor(window.innerHeight - top))}px`;
  /* A word tapped just above the bar would lie under the row now laid
     there: the page goes up by as much (the page ends with room for it,
     style.css). Not while a finger still sweeps. */
  if (!touching) uncover(words[words.length - 1], row);
  /* What was looked up before steps back while something new is marked:
     its spots beside the new mark's would read as two marks. */
  document.documentElement.classList.add("touch-marking");
  tell();
}

function uncover(word, row) {
  const covered = word.getBoundingClientRect().bottom - row.getBoundingClientRect().top;
  if (!(covered > 0)) return;
  for (let at = word.parentElement; at; at = at.parentElement) {
    if (!/(auto|scroll)/.test(window.getComputedStyle(at).overflowY) || at.scrollHeight <= at.clientHeight) continue;
    /* The page is enlarged on a phone: its scrolling counts in its own
       measure, the boxes in the screen's. */
    const zoom = Number.parseFloat(window.getComputedStyle(at).zoom) || 1;
    at.scrollBy?.({ top: Math.ceil((covered + 8) / zoom), behavior: "smooth" });
    return;
  }
}

/* After a drawing: the mark found again in the box drawn in its box's place,
   or let go where there is none. */
let checking = 0;
function carry(box, key, panel, onPick) {
  if (touchMark && touchMark.key === key && touchMark.box !== box && !touchMark.box.isConnected) {
    const words = wordsOf(box).filter((word) => Number(word.dataset.from) >= touchMark.start && Number(word.dataset.to) <= touchMark.end);
    if (words.map((word) => word.textContent).join(" ") === touchMark.text) {
      mark(box, key, panel, onPick, touchMark.start, touchMark.end, touchMark.touching);
    }
  }
  clearTimeout(checking);
  checking = setTimeout(() => { if (touchMark && !touchMark.box.isConnected) unmark(); }, 0);
}

/* A tap anywhere but on words or the button lets the mark go; a finger
   that moved was scrolling and leaves it. */
let watchingBeside = false;
function watchBeside() {
  if (watchingBeside) return;
  watchingBeside = true;
  let down = null;
  document.addEventListener("touchstart", (event) => {
    const touches = event.touches || [];
    const { clientX: x, clientY: y } = touches[0] || {};
    down = touches.length === 1 && !event.target.closest?.(".touch-pick") && !pickable(event.target) ? { x, y } : null;
  }, { passive: true, capture: true });
  document.addEventListener("touchmove", (event) => {
    const touch = event.touches?.[0];
    if (down && touch && Math.hypot(touch.clientX - down.x, touch.clientY - down.y) > SLOP) down = null;
  }, { passive: true, capture: true });
  document.addEventListener("touchend", () => {
    if (down && touchMark) unmark();
    down = null;
  }, { passive: true, capture: true });
}

const boxKeys = new WeakMap();
function pickable(node) {
  const word = wordSpan(node);
  if (!word) return null;
  for (let box = word.parentNode; box && box !== document; box = box.parentNode) {
    if (boxKeys.has(box)) return { word, box };
  }
  return null;
}

function watchTouch(box, panel, onPick, key) {
  boxKeys.set(box, key);
  box.classList.add("touch-words");
  carry(box, key, panel, onPick);
  watchBeside();
  box.addEventListener("touchstart", (event) => {
    if (event.touches?.length !== 1) return;
    /* Begun in the margin beside the words, a sweep starts at the first
       word it reaches; a tap there is a tap beside them. */
    const word = wordSpan(event.target);
    if (word && !box.contains(word)) return;
    const { clientX: x0, clientY: y0 } = event.touches[0];
    let anchor = word ? spanOf(word) : null;
    let sweeping = false;
    let gone = false;
    /* The rest of a touch goes to the node it began on, even where a
       drawing in the meantime took it off the page: heard there. */
    const target = event.target;
    const move = (moved) => {
      if (gone || !moved.touches?.[0]) return;
      const { clientX: x, clientY: y } = moved.touches[0];
      if (!sweeping) {
        if (Math.hypot(x - x0, y - y0) <= SLOP) return;
        if (Math.abs(y - y0) > Math.abs(x - x0)) { gone = true; return; }
        sweeping = true;
      }
      if (moved.cancelable) moved.preventDefault();
      const found = pickable(document.elementFromPoint(x, y));
      if (!found || boxKeys.get(found.box) !== key) return;
      const here = spanOf(found.word);
      anchor ||= here;
      mark(found.box, key, panel, onPick, Math.min(anchor.start, here.start), Math.max(anchor.end, here.end), true);
    };
    const done = (ended) => {
      for (const [type, listener] of listeners) target.removeEventListener(type, listener);
      if (gone) return;
      /* No click after it: a word touched is marked, not picked. */
      if (ended.cancelable) ended.preventDefault();
      if (ended.type === "touchcancel") return;
      if (sweeping && touchMark?.key === key) {
        touchMark.touching = false;
        tell();
      } else if (!sweeping && anchor) {
        /* Drawn anew under the finger: the box now in its place. */
        const point = ended.changedTouches?.[0];
        const found = !box.isConnected && point ? pickable(document.elementFromPoint(point.clientX, point.clientY)) : null;
        const into = box.isConnected ? box : found && boxKeys.get(found.box) === key ? found.box : null;
        if (into) mark(into, key, panel, onPick, anchor.start, anchor.end, false);
      }
    };
    const listeners = [["touchmove", move], ["touchend", done], ["touchcancel", done]];
    for (const [type, listener] of listeners) target.addEventListener(type, listener, { passive: false });
  }, { passive: true });
}

/* key names the box among those of a reading, so that a mark outlives
   the drawing that replaces it. */
export function watchSelection(box, panel, onPick, key = `panel:${panel}`) {
  let anchor = null;
  if (onPhone()) {
    watchTouch(box, panel, onPick, key);
    return;
  }

  const extend = (target) => {
    const word = wordSpan(target);
    if (!word || !anchor) return;
    const here = spanOf(word);
    onPick({
      panel,
      start: Math.min(anchor.start, here.start),
      end: Math.max(anchor.end, here.end),
      dragging: true,
    });
  };

  box.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    const word = wordSpan(event.target);
    if (!word) return;
    event.preventDefault();
    anchor = spanOf(word);
    const range = fromClick(event.target);
    if (range) onPick({ panel, ...range, dragging: true });

    const move = (moved) => extend(moved.target);
    const up = (released) => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      const word = wordSpan(released.target);
      /* Released on the word it started on: that is a click. */
      const range = word && word !== box && anchor.start === spanOf(word).start
        ? fromClick(released.target)
        : null;
      if (range) onPick({ panel, ...range });
      else if (word) {
        const here = spanOf(word);
        onPick({
          panel,
          start: Math.min(anchor.start, here.start),
          end: Math.max(anchor.end, here.end),
        });
      } else onPick({ panel, ...anchor });
      anchor = null;
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

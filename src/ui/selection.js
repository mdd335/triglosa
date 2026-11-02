/* Picking a word out of a panel, by click or by dragging across several.

   Only panels drawn word by word take part; a panel still standing as plain
   text keeps the system's own selection. */

import { onPhone } from "../system.js";
import { icon } from "./icons.js";

const wordSpan = (node) => {
  while (node && node !== document) {
    if (node.nodeType === 1 && node.classList?.contains("w")) return node;
    node = node.parentNode;
  }
  return null;
};

const markSpan = (node) => {
  while (node && node !== document) {
    if (node.nodeType === 1 && node.classList?.contains("mark")) return node;
    node = node.parentNode;
  }
  return null;
};

const spanOf = (element) => ({
  start: Number(element.dataset.from),
  end: Number(element.dataset.to),
});

/* A click inside a coloured mark takes the whole term, not the one word under
   the pointer: the colour says the term belongs together, and taking half of
   it back would contradict what the reader just saw. */
function fromClick(target) {
  const mark = markSpan(target);
  if (mark) {
    return { start: Number(mark.dataset.markFrom), end: Number(mark.dataset.markTo) };
  }
  const word = wordSpan(target);
  return word ? spanOf(word) : null;
}

/* panel is the index the panel has; onPick gets { panel, start, end } once the
   pointer is released. */
/* On a phone several words are selected the system's way — a long press,
   then the handles — and no pointer is dragged from word to word. The page
   cannot tell when a handle is let go, so it does not guess: while a
   selection stands in a box, one button stands over the bar along the
   bottom edge, and pressing it picks the words the selection covers, whole.
   Not beside the selection: the system lays its own menu there. One button
   for the page, shown for whichever box the selection is in. */
let touchPick = null;
let touchLabel = "";

/* What the button says to a screen reader: the picked section's name. */
export function nameTouchPick(label) {
  touchLabel = String(label || "");
  if (!touchPick) return;
  touchPick.setAttribute("aria-label", touchLabel);
  touchPick.lastChild.textContent = touchLabel;
}

function touchPickButton() {
  if (touchPick?.isConnected) return touchPick;
  touchPick = document.createElement("button");
  touchPick.type = "button";
  touchPick.className = "touch-pick";
  touchPick.hidden = true;
  touchPick.append(icon("open"), document.createElement("span"));
  nameTouchPick(touchLabel);
  /* On the press, not the click: by then the system has let the selection
     go, and the button with it. */
  const press = (event) => {
    event.preventDefault();
    const act = touchPick.act;
    hideTouchPick();
    document.getSelection()?.removeAllRanges();
    act?.();
  };
  touchPick.addEventListener("touchstart", press, { passive: false });
  touchPick.addEventListener("mousedown", press);
  document.body.append(touchPick);
  return touchPick;
}

function hideTouchPick() {
  if (!touchPick) return;
  touchPick.hidden = true;
  touchPick.owner = null;
  touchPick.act = null;
}

function watchTouchSelection(box, panel, onPick) {
  const changed = () => {
    if (!box.isConnected) {
      if (touchPick?.owner === box) hideTouchPick();
      return document.removeEventListener("selectionchange", changed);
    }
    const selection = document.getSelection();
    const range = selection && !selection.isCollapsed && selection.rangeCount ? selection.getRangeAt(0) : null;
    const words = range && box.contains(range.startContainer) && box.contains(range.endContainer)
      ? [...box.querySelectorAll(".w")].filter((word) => range.intersectsNode(word))
      : [];
    if (!words.length) {
      if (touchPick?.owner === box) hideTouchPick();
      return;
    }
    const button = touchPickButton();
    const pick = { panel, start: spanOf(words[0]).start, end: spanOf(words[words.length - 1]).end };
    button.owner = box;
    button.act = () => onPick(pick);
    button.hidden = false;
  };
  document.addEventListener("selectionchange", changed);
}

export function watchSelection(box, panel, onPick) {
  let anchor = null;
  if (onPhone()) watchTouchSelection(box, panel, onPick);

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
      /* Released on the word it started on: that is a click, and a click
         inside a mark takes the whole term. */
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

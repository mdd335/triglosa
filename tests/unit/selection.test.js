/* Picking several words on a phone: the system's own selection, offered on a
   button while it stands. In a document of its own, like the drawing's tests. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { watchSelection } = await import("../../src/ui/selection.js");

function panel(text) {
  const box = document.createElement("div");
  let at = 0;
  for (const piece of text.split(/(\s+)/)) {
    if (piece.trim()) {
      const word = document.createElement("span");
      word.className = "w";
      word.dataset.from = String(at);
      word.dataset.to = String(at + piece.length);
      word.textContent = piece;
      box.append(word);
    } else if (piece) box.append(document.createTextNode(piece));
    at += piece.length;
  }
  document.body.append(box);
  return box;
}

function select(from, fromOffset, to, toOffset) {
  const range = document.createRange();
  range.setStart(from.firstChild, fromOffset);
  range.setEnd(to.firstChild, toOffset);
  const selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.dispatchEvent(new dom.window.Event("selectionchange"));
}

const button = () => document.querySelector(".touch-pick");
const press = () => button().dispatchEvent(new dom.window.Event("touchstart", { cancelable: true }));

test("on a phone a selection of several words is picked on its button, whole words, and never by itself", async () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const box = panel("hier kannst du upgraden heute");
    const picks = [];
    watchSelection(box, 1, (choice) => picks.push(choice));
    const words = box.querySelectorAll(".w");
    /* From inside "kannst" to inside "upgraden": both words count whole. */
    select(words[1], 2, words[3], 4);
    assert.strictEqual(button().hidden, false);
    /* However long the finger rests on a handle. */
    await new Promise((resolve) => setTimeout(resolve, 900));
    assert.deepStrictEqual(picks, []);
    /* The handle moved on: the button answers for what stands selected now. */
    select(words[1], 2, words[2], 1);
    press();
    assert.deepStrictEqual(picks, [{ panel: 1, start: 5, end: 14 }]);
    assert.strictEqual(button().hidden, true);
    assert.ok(document.getSelection().isCollapsed || !document.getSelection().rangeCount, "the system's selection is let go");
    /* A selection that reaches outside the box is nobody's, and one let go
       takes the button with it. */
    const other = panel("anderes Feld");
    select(words[0], 0, other.querySelector(".w"), 3);
    assert.strictEqual(button().hidden, true);
    select(words[0], 0, words[1], 3);
    assert.strictEqual(button().hidden, false);
    document.getSelection().removeAllRanges();
    document.dispatchEvent(new dom.window.Event("selectionchange"));
    assert.strictEqual(button().hidden, true);
    /* A box no longer on the page stops listening. */
    select(words[0], 0, words[1], 3);
    box.remove();
    document.dispatchEvent(new dom.window.Event("selectionchange"));
    assert.strictEqual(button().hidden, true);
    other.remove();
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("on a computer the system's selection offers nothing: words are dragged across", () => {
  const box = panel("hier kannst du upgraden");
  const before = button()?.hidden ?? true;
  watchSelection(box, 0, () => assert.fail("nothing is picked"));
  const words = box.querySelectorAll(".w");
  select(words[0], 0, words[2], 2);
  assert.strictEqual(button()?.hidden ?? true, before);
  box.remove();
});

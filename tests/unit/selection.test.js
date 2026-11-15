/* Picking words: dragged across on a computer, marked by a finger and looked
   up on a button on a phone. In a document of its own, like the drawing's
   tests. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { onTouchMark, watchSelection } = await import("../../src/ui/selection.js");

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

/* A touch as the phone's web view sends it: one finger at a point. */
const touch = (type, target, x = 10, y = 10) => {
  const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: type === "touchend" ? [] : [{ clientX: x, clientY: y, target }] });
  target.dispatchEvent(event);
  return event;
};
const marked = (box) => [...box.querySelectorAll(".w.touch-marked")].map((word) => word.textContent);

test("on a phone a tap marks a word and a sideways sweep several; the button looks them up, a tap beside lets them go", () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  const fromPoint = document.elementFromPoint;
  try {
    const box = panel("el casco antiguo de la ciudad");
    const words = [...box.querySelectorAll(".w")];
    const picks = [];
    watchSelection(box, 1, (choice) => picks.push(choice));
    /* A tap: marked, not picked, and no click after it. */
    touch("touchstart", words[1]);
    const lifted = touch("touchend", words[1]);
    assert.ok(lifted.defaultPrevented, "no click picks it");
    assert.deepStrictEqual(marked(box), ["casco"]);
    assert.deepStrictEqual(picks, []);
    assert.strictEqual(button().hidden, false);
    /* Swept sideways from "casco" to "de": those words, the finger not
       scrolling the page. */
    document.elementFromPoint = () => words[3];
    touch("touchstart", words[1], 10, 10);
    const swept = touch("touchmove", words[1], 60, 12);
    assert.ok(swept.defaultPrevented, "a sideways sweep does not scroll");
    touch("touchend", words[1]);
    assert.deepStrictEqual(marked(box), ["casco", "antiguo", "de"]);
    /* Its ends named, to be rounded: the first word and the last. */
    assert.deepStrictEqual([...box.querySelectorAll(".touch-first, .touch-last")].map((piece) => piece.textContent), ["casco", "de"]);
    /* The row over the bar says what is marked, as it stands. */
    assert.strictEqual(button().querySelector(".touch-pick-text").textContent, "casco antiguo de");
    /* Begun in the margin beside the words: from the first word reached. */
    document.elementFromPoint = () => words[2];
    touch("touchstart", box, 2, 10);
    touch("touchmove", box, 40, 11);
    document.elementFromPoint = () => words[3];
    touch("touchmove", box, 70, 11);
    touch("touchend", box);
    assert.deepStrictEqual(marked(box), ["antiguo", "de"]);
    document.elementFromPoint = () => words[3];
    touch("touchstart", words[1], 10, 10);
    touch("touchmove", words[1], 60, 12);
    touch("touchend", words[1]);
    /* Swept up or down: the page scrolls, the mark stays as it was. */
    touch("touchstart", words[4], 10, 10);
    const scrolled = touch("touchmove", words[4], 12, 60);
    assert.ok(!scrolled.defaultPrevented);
    touch("touchend", words[4]);
    assert.deepStrictEqual(marked(box), ["casco", "antiguo", "de"]);
    /* However long it stands, nothing is picked by itself; the button picks. */
    press();
    assert.deepStrictEqual(picks, [{ panel: 1, start: 3, end: 19 }]);
    assert.strictEqual(button().hidden, true);
    assert.deepStrictEqual(marked(box), []);
    /* A tap beside the words lets a mark go; a finger scrolling there does not. */
    touch("touchstart", words[5]);
    touch("touchend", words[5]);
    const beside = document.createElement("p");
    document.body.append(beside);
    touch("touchstart", beside, 10, 10);
    touch("touchmove", beside, 10, 80);
    touch("touchend", beside);
    assert.deepStrictEqual(marked(box), ["ciudad"]);
    touch("touchstart", beside);
    touch("touchend", beside);
    assert.deepStrictEqual(marked(box), []);
    assert.strictEqual(button().hidden, true);
    beside.remove();
    box.remove();
  } finally {
    document.elementFromPoint = fromPoint;
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("on a phone a mark outlives the drawing that replaces its box, and only where its words are still there", async () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  const heard = [];
  const stop = onTouchMark((mark) => heard.push(mark && { panel: mark.panel, start: mark.start, end: mark.end }));
  try {
    let box = panel("el casco antiguo");
    const picks = [];
    watchSelection(box, 2, (choice) => picks.push(choice));
    touch("touchstart", box.querySelectorAll(".w")[1]);
    touch("touchend", box.querySelectorAll(".w")[1]);
    assert.deepStrictEqual(heard.at(-1), { panel: 2, start: 3, end: 8 });
    /* Drawn anew, the text grown: still marked, and the button picks from the new box. */
    box.remove();
    box = panel("el casco antiguo de la ciudad");
    watchSelection(box, 2, (choice) => picks.push({ ...choice, fresh: true }));
    assert.deepStrictEqual(marked(box), ["casco"]);
    /* Another box's key takes nothing over. */
    const line = panel("el casco");
    watchSelection(line, 0, () => {}, "sentence");
    assert.deepStrictEqual(marked(line), []);
    line.remove();
    press();
    assert.deepStrictEqual(picks, [{ panel: 2, start: 3, end: 8, fresh: true }]);
    /* Another reading in its place: the mark goes. */
    touch("touchstart", box.querySelectorAll(".w")[1]);
    touch("touchend", box.querySelectorAll(".w")[1]);
    box.remove();
    box = panel("un texto nuevo");
    watchSelection(box, 2, () => assert.fail("nothing picked"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepStrictEqual(marked(box), []);
    assert.strictEqual(button().hidden, true);
    assert.strictEqual(heard.at(-1), null);
    box.remove();
  } finally {
    stop();
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("on a phone a word marked in another box lets the first box's words go", () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const one = panel("Bitte kontaktieren Sie uns");
    const two = panel("Please contact us");
    watchSelection(one, 1, () => {});
    watchSelection(two, 0, () => {});
    touch("touchstart", one.querySelectorAll(".w")[1]);
    touch("touchend", one.querySelectorAll(".w")[1]);
    assert.deepStrictEqual(marked(one), ["kontaktieren"]);
    touch("touchstart", two.querySelectorAll(".w")[1]);
    touch("touchend", two.querySelectorAll(".w")[1]);
    assert.deepStrictEqual(marked(two), ["contact"]);
    assert.deepStrictEqual(marked(one), []);
    assert.strictEqual(button().querySelector(".touch-pick-text").textContent, "contact");
    /* What was looked up before steps back while a mark stands. */
    assert.ok(document.documentElement.classList.contains("touch-marking"));
    press();
    assert.ok(!document.documentElement.classList.contains("touch-marking"));
    one.remove();
    two.remove();
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("on a phone a word marked where the row comes to lie goes up above it", () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  const rectOf = dom.window.HTMLElement.prototype.getBoundingClientRect;
  try {
    const page = document.createElement("div");
    page.style.overflowY = "auto";
    Object.defineProperty(page, "scrollHeight", { value: 2000 });
    Object.defineProperty(page, "clientHeight", { value: 800 });
    const scrolled = [];
    page.scrollBy = (options) => scrolled.push(options.top);
    document.body.append(page);
    const box = panel("las nuevas normas");
    page.append(box);
    watchSelection(box, 1, () => {});
    /* The last line just above the bar: the row laid there covers it. */
    dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList.contains("touch-pick")) return { top: 760, bottom: 804, left: 0, right: 400, width: 400, height: 44 };
      return { top: 770, bottom: 790, left: 0, right: 60, width: 60, height: 20 };
    };
    touch("touchstart", box.querySelectorAll(".w")[2]);
    touch("touchend", box.querySelectorAll(".w")[2]);
    assert.deepStrictEqual(scrolled, [38], "by what is covered and a little air");
    /* Clear of the row: the page stays. */
    dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList.contains("touch-pick")) return { top: 760, bottom: 804, left: 0, right: 400, width: 400, height: 44 };
      return { top: 300, bottom: 320, left: 0, right: 60, width: 60, height: 20 };
    };
    touch("touchstart", box.querySelectorAll(".w")[1]);
    touch("touchend", box.querySelectorAll(".w")[1]);
    assert.deepStrictEqual(scrolled, [38]);
    button().dispatchEvent(new dom.window.Event("touchstart", { cancelable: true }));
    page.remove();
  } finally {
    dom.window.HTMLElement.prototype.getBoundingClientRect = rectOf;
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

test("a click on a word inside a coloured term picks that word, and a drag across the term picks the term", () => {
  /* author 2026-11-05: the term has its row; the word is what is asked. */
  const box = panel("salimos al casco antiguo hoy");
  const words = [...box.querySelectorAll(".w")];
  const mark = document.createElement("span");
  mark.className = "mark wmark0";
  mark.dataset.markFrom = "11";
  mark.dataset.markTo = "24";
  words[2].before(mark);
  mark.append(words[2], " ", words[3]);
  const picks = [];
  watchSelection(box, 0, (choice) => picks.push(choice));
  const click = (word) => {
    word.dispatchEvent(new dom.window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
    word.dispatchEvent(new dom.window.MouseEvent("mouseup", { bubbles: true, button: 0 }));
  };
  click(words[3]);
  assert.deepStrictEqual(picks.at(-1), { panel: 0, start: 17, end: 24 });
  assert.deepStrictEqual(picks.find((pick) => pick.dragging), { panel: 0, start: 17, end: 24, dragging: true },
    "the frame stands on the word from the press on");
  words[2].dispatchEvent(new dom.window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
  words[3].dispatchEvent(new dom.window.MouseEvent("mousemove", { bubbles: true }));
  words[3].dispatchEvent(new dom.window.MouseEvent("mouseup", { bubbles: true, button: 0 }));
  assert.deepStrictEqual(picks.at(-1), { panel: 0, start: 11, end: 24 });
  box.remove();
});

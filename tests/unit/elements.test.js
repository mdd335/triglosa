/* The two kinds of button, and what they say when they are done.

   `reportOn` is the only piece of the window with real branching in it: a
   written button swaps its word and pins its width, a symbol one has no room
   for a word at all and shows a tick instead, and a failure must not show a
   tick — it would say the opposite of what happened. Three shapes, no test
   until this file. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { button, labelPlace, reportOn } = await import("../../src/ui/elements.js");

const label = (node) => node.querySelector(".pill-label")?.textContent ?? node.textContent;
const symbol = (node) => node.querySelector("svg")?.innerHTML || "";

test("a symbol button carries its word where it can be read and not seen", () => {
  /* The word is not dropped, it moves: it is the accessible name and the
     label that appears under the button on hover. And no `title` beside it —
     macOS draws a second label of its own, a second later, somewhere else. */
  const node = button("Kopieren", () => {}, "copy");
  assert.strictEqual(node.getAttribute("aria-label"), "Kopieren");
  assert.strictEqual(label(node), "Kopieren");
  assert.strictEqual(node.getAttribute("title"), null);
  assert.strictEqual(node.dataset.icon, "copy");
  assert.ok(node.classList.contains("icon"));
});

test("a symbol button answers with a tick and puts the word in its label", async () => {
  const node = button("Kopieren", () => {}, "copy");
  const before = symbol(node);
  await reportOn(node, async () => {}, "Kopiert");
  assert.strictEqual(label(node), "Kopiert");
  assert.strictEqual(node.getAttribute("aria-label"), "Kopiert");
  assert.notStrictEqual(symbol(node), before, "the symbol became a tick");
  /* Not pressable while it answers, and not faded either: what it is showing
     for this second and a half IS the answer, and the rule that dims a button
     with nothing to do would dim exactly that. */
  assert.ok(node.disabled);
  assert.ok(node.classList.contains("reporting"));
});

test("a failure keeps its own symbol and says why", async () => {
  const node = button("Ersetzen", () => {}, "replace");
  const before = symbol(node);
  await reportOn(node, async () => { throw new Error("Bedienungshilfen fehlen"); }, "Ersetzt");
  assert.strictEqual(label(node), "Bedienungshilfen fehlen");
  assert.strictEqual(symbol(node), before, "a tick would say the opposite of what happened");
  assert.ok(node.classList.contains("failed"));
});

test("a written button swaps its word, and its width is pinned first", async () => {
  /* The settings window builds its buttons by hand and hands them to the
     same function. A wider word there would make the row jump. */
  const node = document.createElement("button");
  node.textContent = "Verbindung prüfen";
  await reportOn(node, async () => {}, "Geprüft");
  assert.strictEqual(node.textContent, "Geprüft");
  assert.ok(node.style.minWidth, "pinned before the word changed");
  assert.ok(!node.classList.contains("icon"));
});

test("a button's label goes where the window has room for it", () => {
  /* A row in the middle of a reading: under the button. */
  assert.strictEqual(labelPlace({ top: 200, bottom: 224, label: 18, clipTop: 40, clipBottom: 700 }), "below");
  /* The last row of a window as tall as what it holds: above. */
  assert.strictEqual(labelPlace({ top: 670, bottom: 694, label: 18, clipTop: 40, clipBottom: 700 }), "above");
  /* A blank sheet, one field tall: neither fits, and above it stood under the
     title line with only its lower edge showing. */
  assert.strictEqual(labelPlace({ top: 48, bottom: 72, label: 18, clipTop: 40, clipBottom: 89 }), "beside");
});

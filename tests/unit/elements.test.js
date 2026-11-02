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

const { button, buttonRow, closeOnKeys, labelPlace, nameButton, quietContextMenu, relabel, replaceKeepingScroll, reportOn, rowButton } = await import("../../src/ui/elements.js");

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

test("the right-click menu is kept only where text is written", () => {
  /* The web view's own menu offers Reload, which empties the window and
     throws its readings away. Inside a field it brings cut, copy and paste. */
  const root = new JSDOM("<!doctype html><p>text</p><textarea></textarea><input type=\"text\"><input type=\"checkbox\">").window.document;
  quietContextMenu(root);
  const opens = (node) => node.dispatchEvent(new root.defaultView.MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
  assert.strictEqual(opens(root.querySelector("p")), false);
  assert.strictEqual(opens(root.body), false);
  assert.strictEqual(opens(root.querySelector("input[type=checkbox]")), false);
  assert.strictEqual(opens(root.querySelector("textarea")), true);
  assert.strictEqual(opens(root.querySelector("input[type=text]")), true);
});

test("a key that also reaches a button stands after its word, apart and without brackets", () => {
  const node = button("Einstellungen", () => {}, "gear");
  nameButton(node, "Einstellungen öffnen", "⌘,");
  const label = node.querySelector(".pill-label");
  assert.strictEqual(label.firstChild.textContent, "Einstellungen öffnen");
  assert.strictEqual(label.querySelector(".pill-key").textContent, "⌘,");
  assert.ok(!label.textContent.includes("("));
  assert.strictEqual(node.getAttribute("aria-label"), "Einstellungen öffnen (⌘,)");
  nameButton(node, "Neue Übersetzung");
  assert.ok(!label.querySelector(".pill-key"), "no key, no grey part");
  assert.strictEqual(node.getAttribute("aria-label"), "Neue Übersetzung");
});

test("a page drawn again stays scrolled where the reader left it", () => {
  const { document } = dom.window;
  const root = document.createElement("div");
  document.body.append(root);
  const page = () => {
    const view = document.createElement("div");
    const content = document.createElement("div");
    content.className = "settings";
    let top = 0;
    Object.defineProperty(content, "scrollTop", { get: () => top, set: (value) => { top = value; } });
    view.append(content);
    return view;
  };
  root.append(page());
  root.querySelector(".settings").scrollTop = 420;
  replaceKeepingScroll(root, page(), ".settings");
  assert.strictEqual(root.querySelector(".settings").scrollTop, 420);
  root.remove();
});

test("a window of its own closes on Escape and ⌘W, leaving a field first", () => {
  const page = new JSDOM("<!doctype html><input id=\"field\"><input id=\"key\" readonly><input id=\"box\" type=\"checkbox\">").window.document;
  let closed = 0;
  closeOnKeys(page, () => { closed++; });
  const press = (key, more = {}) => page.dispatchEvent(new page.defaultView.KeyboardEvent("keydown", { key, cancelable: true, ...more }));

  page.getElementById("field").focus();
  press("Escape");
  assert.strictEqual(closed, 0, "the first Escape leaves the field");
  assert.notStrictEqual(page.activeElement, page.getElementById("field"));
  press("Escape");
  assert.strictEqual(closed, 1, "the second closes");

  page.getElementById("key").focus();
  press("Escape");
  assert.strictEqual(closed, 2, "a field that cannot be written in is not left first");

  page.getElementById("field").focus();
  press("w", { metaKey: true });
  press("W", { ctrlKey: true });
  assert.strictEqual(closed, 4, "⌘W and Ctrl+W close from inside a field too");
  press("w");
  assert.strictEqual(closed, 4, "a plain w is a letter");

  /* A press the page answered itself — the shortcut recorder's — is not one. */
  page.addEventListener("keydown", (event) => event.preventDefault(), { capture: true });
  press("Escape");
  assert.strictEqual(closed, 4);
});

test("a window with nothing to write in closes on the first Escape, wherever the focus is", () => {
  const page = new JSDOM("<!doctype html><input id=\"box\" type=\"checkbox\">").window.document;
  let closed = 0;
  closeOnKeys(page, () => { closed++; }, { fields: null });
  page.getElementById("box").focus();
  page.dispatchEvent(new page.defaultView.KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
  assert.strictEqual(closed, 1);
});

test("a row of buttons is each a symbol and its word, and keeps the symbol when it answers", async () => {
  let pressed = 0;
  const copy = rowButton("Alle drei kopieren", "copy", () => { pressed++; });
  const row = buttonRow([copy, null, rowButton("Direkt nach Anki", "anki", () => {})], "card-actions");
  assert.ok(row.classList.contains("button-row") && row.classList.contains("card-actions"));
  assert.strictEqual(row.children.length, 2, "what is not there takes no place");
  assert.strictEqual(copy.textContent, "Alle drei kopieren", "the word is all it says");
  assert.strictEqual(copy.dataset.icon, "copy");
  copy.click();
  assert.strictEqual(pressed, 1);

  /* Said in place, the symbol beside it stays. */
  relabel(copy, "Wird gesendet …");
  assert.strictEqual(copy.textContent, "Wird gesendet …");
  assert.ok(copy.querySelector("svg"));
  relabel(copy, "Alle drei kopieren");

  /* Done: a tick where the symbol stood and the answer as its word, both
     back after a moment; its name stays its word, not a label of its own. */
  const before = symbol(copy);
  await reportOn(copy, async () => {}, "Kopiert");
  assert.strictEqual(copy.textContent, "Kopiert");
  assert.notStrictEqual(symbol(copy), before);
  assert.strictEqual(copy.getAttribute("aria-label"), null);
  await new Promise((done) => setTimeout(done, 1500));
  assert.strictEqual(copy.textContent, "Alle drei kopieren");
  assert.strictEqual(symbol(copy), before);
});

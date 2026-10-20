/* The first steps, drawn into a document of their own: what a reader of each
   system is told, and what the box and the buttons do. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;

const { welcomeView } = await import("../../src/ui/welcome-view.js");
const { INTERFACE_LANGUAGES, labels } = await import("../../src/ui/labels.js");

const draw = (code, system, more = {}, handlers = {}) => welcomeView(
  { text: labels(code, system), system, key: system === "windows" ? "Win+Shift+E" : "⌃⌥E", permission: false, hidden: false, ...more },
  handlers,
);
const steps = (view) => [...view.querySelectorAll(".welcome-steps li")].map((item) => item.textContent);

test("Windows is told about the arrow and the right click, and nothing of the Mac's", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const said = steps(draw(code, "windows"));
    assert.strictEqual(said.length, 4, code);
    assert.ok(said[0].includes("(^)"), code);
    assert.ok(said[3].includes("Win+Shift+E"), code);
    assert.doesNotMatch(said.join(" "), /macOS|⌘|Apple/, code);
  }
});

test("a Mac without the permission is told to copy, and of the permission as a fifth step", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const said = steps(draw(code, "mac"));
    assert.strictEqual(said.length, 5, code);
    assert.ok(!said[0].includes("(^)"), code);
    assert.ok(said[3].includes("⌘C") && said[3].includes("⌃⌥E"), code);
    assert.match(said[4], /macOS/, code);
  }
});

test("with the permission the text is selected, and the permission is not mentioned", () => {
  const said = steps(draw("en", "mac", { permission: true }));
  assert.strictEqual(said.length, 4);
  assert.match(said[3], /^Get started\. Select text/);
  assert.match(said[0], /^Triglosa runs/);
  assert.doesNotMatch(said[3], /⌘C/);
});

test("without a shortcut the step says where one is set", () => {
  const said = steps(draw("en", "mac", { key: "" }));
  assert.match(said[3], /press your shortcut\. You set it in the settings\./);
});

test("no sentence holds a semicolon", () => {
  for (const code of INTERFACE_LANGUAGES) {
    for (const system of ["windows", "mac"]) {
      assert.doesNotMatch(draw(code, system).textContent, /;/, `${code} ${system}`);
    }
  }
});

test("the box, the buttons and the links say what was done", () => {
  const done = [];
  const view = draw("en", "windows", { hidden: true, icon: "icon.png" }, {
    onHide: (hidden) => done.push(["hide", hidden]),
    onSettings: () => done.push("settings"),
    onClose: () => done.push("close"),
    onGuide: () => done.push("guide"),
    onReadme: () => done.push("readme"),
  });
  assert.strictEqual(view.querySelector(".welcome-icon").getAttribute("src"), "icon.png");
  const box = view.querySelector(".welcome-hide input");
  assert.strictEqual(box.checked, true);
  box.checked = false;
  box.dispatchEvent(new dom.window.Event("change"));
  const [settings, close] = view.querySelectorAll(".welcome-foot button");
  /* Not the grey of a button beside the one that matters: there are two. */
  assert.strictEqual(close.className, "");
  assert.strictEqual(view.querySelector(".welcome-steps strong").textContent, "Win+Shift+E");
  settings.click();
  close.click();
  for (const link of view.querySelectorAll(".text-link")) link.click();
  assert.deepStrictEqual(done, [["hide", false], "settings", "close", "guide", "readme"]);
});

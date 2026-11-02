/* The first steps, drawn into a document of their own: what a reader of each
   system is told, and what the box and the buttons do. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.MouseEvent = dom.window.MouseEvent;

const { welcomeView } = await import("../../src/ui/welcome-view.js");
const { INTERFACE_LANGUAGES, labels } = await import("../../src/ui/labels.js");
const { exampleState, exampleView } = await import("../../src/ui/example-view.js");

const draw = (code, system, more = {}, handlers = {}) => welcomeView(
  { text: labels(code, system), system, key: system === "windows" ? "Ctrl+Alt+T" : "⌃⌥T", permission: false, hidden: false, ...more },
  handlers,
);
const steps = (view) => [...view.querySelectorAll(".welcome-steps li")].map((item) => item.textContent);

test("Windows is told about the arrow and the right click, and nothing of the Mac's", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const said = steps(draw(code, "windows"));
    assert.strictEqual(said.length, 4, code);
    assert.ok(said[0].includes("(^)"), code);
    assert.ok(said[3].includes("Ctrl+Alt+T"), code);
    assert.doesNotMatch(said.join(" "), /macOS|⌘|Apple/, code);
  }
});

test("a Mac without the permission is told to copy, and of the permission as a fifth step", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const said = steps(draw(code, "mac"));
    assert.strictEqual(said.length, 5, code);
    assert.ok(!said[0].includes("(^)"), code);
    assert.ok(said[3].includes("⌘C") && said[3].includes("⌃⌥T"), code);
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
  assert.match(said[3], /press your shortcut\. You set it in the settings under “Shortcuts”\./);
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
    onReadme: () => done.push("readme"),
  });
  assert.strictEqual(view.querySelector(".welcome-icon").getAttribute("src"), "icon.png");
  const box = view.querySelector(".welcome-hide input");
  assert.strictEqual(box.checked, true);
  box.checked = false;
  box.dispatchEvent(new dom.window.Event("change"));
  const [settings, close] = view.querySelectorAll(".welcome-foot button");
  /* Not the grey of a button beside the one that matters: there are two,
     alike, a row of buttons with a symbol each. */
  assert.ok(view.querySelector(".welcome-foot > .button-row"));
  assert.strictEqual(close.className, settings.className);
  assert.deepStrictEqual([settings.dataset.icon, close.dataset.icon], ["settings", "close"]);
  assert.strictEqual(view.querySelector(".welcome-steps strong").textContent, "Ctrl+Alt+T");
  settings.click();
  close.click();
  for (const link of view.querySelectorAll(".text-link")) link.click();
  assert.deepStrictEqual(done, [["hide", false], "settings", "close", "readme"]);
});

test("every step that leads to the settings names the page it is on, and the model's leads nowhere else", () => {
  for (const code of INTERFACE_LANGUAGES) {
    for (const system of ["windows", "mac"]) {
      const text = labels(code, system);
      const view = draw(code, system);
      const said = steps(view);
      assert.ok(said[1].includes(text.groupLanguages), `${code} ${system}: languages`);
      assert.ok(said[2].includes(text.groupModel), `${code} ${system}: model`);
      assert.ok(said[3].includes(text.groupShortcuts), `${code} ${system}: shortcut`);
      if (said[4]) assert.ok(said[4].includes(text.groupReading), `${code} ${system}: permission`);
      assert.strictEqual(view.querySelectorAll(".welcome-steps a").length, 0, `${code} ${system}: no link in a step`);
    }
  }
});

test("the count is a box to tick, in the settings' words, and ticking it is the answer", () => {
  const text = labels("en");
  const answers = [];
  const view = draw("en", "mac", { consent: false }, { onConsent: (yes) => answers.push(yes) });
  const box = view.querySelector(".welcome-consent");
  const tick = box.querySelector("input[type=checkbox]");
  assert.strictEqual(tick.checked, false);
  assert.ok(box.textContent.includes(text.statsSetting));
  assert.ok(box.textContent.includes(text.statsHint));
  assert.ok(box.textContent.includes(text.welcome.stats.off));
  assert.strictEqual(box.querySelector("button"), null);
  for (const ticked of [true, false]) {
    tick.checked = ticked;
    tick.dispatchEvent(new tick.ownerDocument.defaultView.Event("change"));
  }
  assert.deepStrictEqual(answers, [true, false]);
  assert.strictEqual(draw("en", "mac", { consent: true }).querySelector(".welcome-consent input").checked, true);
  assert.strictEqual(draw("en", "mac", { consent: null }).querySelector(".welcome-consent input").checked, false);
  for (const code of INTERFACE_LANGUAGES) {
    assert.ok(labels(code).welcome.stats.off, code);
    assert.ok(labels(code).statsHint.includes("OpenRouter"), `${code}: the kinds of model named`);
  }
});

test("the example is a reading: the original, the reader's own language and one more, the terms and the verb marked in all three", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const example = labels(code).welcome.example;
    const state = exampleState(example, code);
    assert.notStrictEqual(example.source, code, `${code}: the original is foreign`);
    assert.strictEqual(state.panels[1].code, code, `${code}: the reader's own first`);
    assert.notStrictEqual(state.panels[2].code, code);
    assert.ok(state.glance, `${code}: the hover's answer is read`);
    const units = state.glance.sentences[0].units;
    assert.ok(units.every((unit) => unit.gloss && unit.second?.gloss), `${code}: every unit has both translations`);
    const node = exampleView(example, code);
    document.body.append(node);
    for (const panel of [0, 1, 2]) {
      const marks = [...node.querySelectorAll(`.words[data-panel="${panel}"] .mark`)];
      const wanted = example.terms.length + example.verbs.length;
      assert.strictEqual(new Set(marks.map((mark) => mark.className)).size, wanted, `${code}: panel ${panel} marks every term and verb`);
    }
    /* Its buttons are there to be seen, and a press does nothing. */
    assert.ok(node.querySelectorAll(".row-actions button").length > 0, `${code}: buttons shown`);
    assert.strictEqual(node.querySelector(".fold"), null, `${code}: no fold`);
    assert.strictEqual(node.querySelectorAll(".pane .label .name")[0].textContent, state.source.name, `${code}: the original is named`);
    node.remove();
  }
});

test("pointing at a word of the example says what it became in the reader's language", async () => {
  const node = exampleView(labels("de").welcome.example, "de");
  document.body.append(node);
  const word = [...node.querySelectorAll('.words[data-panel="0"] .w')].find((one) => one.textContent === "salimos");
  word.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.strictEqual(node.querySelector(".glance").textContent, "gingen");
  node.remove();
});

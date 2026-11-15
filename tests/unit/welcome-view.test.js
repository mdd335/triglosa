/* The first steps, drawn into a document of their own: what a reader of each
   system is told, and what the box and the buttons do. */

import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.CustomEvent = dom.window.CustomEvent;

const { welcomeView } = await import("../../src/ui/welcome-view.js");
const { INTERFACE_LANGUAGES, labels } = await import("../../src/ui/labels.js");
const { exampleView, snapshotFor } = await import("../../src/ui/example-view.js");

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
      if (said[4]) assert.ok(said[4].includes(text.groupReadingEntry), `${code} ${system}: permission`);
      assert.strictEqual(view.querySelectorAll(".welcome-steps a").length, 0, `${code} ${system}: no link in a step`);
    }
  }
});

test("the window that asks puts the count as a question with two answers, and says the answer once", () => {
  const text = labels("en");
  const answers = [];
  const privacy = [];
  const asked = draw("en", "mac", { consent: false, asking: true }, {
    onConsent: (yes) => answers.push(yes), onPrivacy: () => privacy.push(true),
  });
  const box = asked.querySelector(".welcome-consent");
  assert.ok(box.textContent.includes(text.welcome.stats.question));
  assert.ok(box.textContent.includes(text.statsHint), "in the settings' words");
  assert.ok(box.textContent.includes(text.welcome.stats.change));
  assert.ok(box.querySelector(".welcome-consent-body").textContent.endsWith(text.statsThanks), "thanked last");
  assert.strictEqual(box.querySelector("input"), null, "no box to tick");
  const [no, yes] = box.querySelectorAll(".button-row button");
  assert.deepStrictEqual([no.textContent, yes.textContent], [text.welcome.stats.no, text.welcome.stats.yes]);
  assert.deepStrictEqual([no.dataset.icon, yes.dataset.icon], ["close", "done"]);
  yes.click();
  no.click();
  assert.deepStrictEqual(answers, [true, false]);
  const linked = box.querySelector("a");
  assert.strictEqual(linked.textContent, "privacy policy");
  linked.click();
  assert.strictEqual(privacy.length, 1);
  assert.strictEqual(draw("en", "mac", { consent: true, asking: true, answered: true }).querySelector(".welcome-consent-done").textContent,
    text.welcome.stats.yesDone);
  assert.strictEqual(draw("en", "mac", { consent: false, asking: true, answered: true }).querySelector(".welcome-consent-done").textContent,
    text.welcome.stats.noDone);
  const later = draw("en", "mac", { consent: false });
  assert.strictEqual(later.querySelector(".welcome-consent, .welcome-consent-done"), null, "asked before, asked no more");
  for (const code of INTERFACE_LANGUAGES) {
    const words = labels(code).welcome.stats;
    for (const key of ["question", "yes", "no", "change", "yesDone", "noDone"]) assert.ok(words[key], `${code} ${key}`);
    assert.ok(words.change.includes(labels(code).groupAbout), `${code}: where it is changed`);
    assert.ok(words.yesDone.includes(labels(code).groupAbout), `${code}: where it is changed`);
    assert.strictEqual(labels(code).statsPrivacy((word) => word).length, 3, `${code}: the privacy policy linked`);
  }
});

test("the example is a reading: the original, the reader's own language and one more, the terms and the verb marked in all three", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const example = labels(code).welcome.example;
    assert.notStrictEqual(example.source, code, `${code}: the original is foreign`);
    assert.strictEqual(example.panels[0].code, code, `${code}: the reader's own first`);
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
    assert.ok(node.querySelectorAll(".pane .label .name")[0].textContent, `${code}: the original is named`);
    node.remove();
  }
});

test("the example is the snapshot of its texts, taken anew whenever a text changes", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const example = labels(code).welcome.example;
    assert.deepStrictEqual(snapshotFor(code).texts, [example.text, ...example.panels.map((panel) => panel.text)],
      `${code}: node scripts/example-links.mjs, then node scripts/example-snapshot.mjs`);
  }
});

test("the example draws itself: nothing of the reading window's drawing or of its hover", () => {
  const source = fs.readFileSync(new URL("../../src/ui/example-view.js", import.meta.url), "utf8");
  const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
  assert.deepStrictEqual(imports.sort(), ["../system.js", "./elements.js", "./example-snapshot.js"]);
});

/* A word the reader's language has no word for ("it" in "it was raining",
   for a Spanish reader) only lights its places, as in a reading. */
test("every word of the example's original says what it became, or at least where it went", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const node = exampleView(labels(code).welcome.example, code);
    const shot = snapshotFor(code);
    for (const word of node.querySelectorAll('.words[data-panel="0"] .w')) {
      const found = shot.hover[`0:${word.dataset.from}`];
      assert.ok(found, `${code}: "${word.textContent}" answered`);
      assert.ok(found[1].some(([panel]) => panel !== 0), `${code}: "${word.textContent}" lit in a translation`);
      if (found[0]) assert.ok(found[1].some(([panel]) => panel === 1), `${code}: "${word.textContent}" lit where its sign comes from`);
    }
  }
});

const pointAt = async (word) => {
  word.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 200));
};

test("pointing at a word of the example says what it became in the reader's language, over the word", async () => {
  const node = exampleView(labels("de").welcome.example, "de");
  document.body.append(node);
  const word = [...node.querySelectorAll('.words[data-panel="0"] .w')].find((one) => one.textContent === "salimos");
  await pointAt(word);
  assert.strictEqual(node.querySelector(".glance.shown").textContent, "gingen");
  assert.ok(node.querySelector('.words[data-panel="1"] .glance-lit'), "lit in the reader's panel");
  assert.strictEqual(node.querySelector(".glance").parentNode, node, "the sign stands in the example");
  /* Over a word of the reader's own panel: its places, no sign. */
  const own = node.querySelector('.words[data-panel="1"] .w');
  own.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: own }));
  await pointAt(own);
  assert.strictEqual(node.querySelector(".glance.shown"), null);
  node.remove();
});

test("the sign stands over the word, also in the first line", async () => {
  const node = exampleView(labels("de").welcome.example, "de");
  document.body.append(node);
  const word = node.querySelector('.words[data-panel="0"] .w');
  const at = (box) => () => box;
  node.getBoundingClientRect = at({ left: 0, top: 0, right: 400, bottom: 600, width: 400, height: 600 });
  word.getBoundingClientRect = at({ left: 20, top: 30, right: 70, bottom: 46, width: 50, height: 16 });
  const sign = node.querySelector(".glance");
  Object.defineProperty(sign, "offsetHeight", { value: 22 });
  await pointAt(word);
  assert.strictEqual(sign.style.top, "8px", "its foot on the word's top");
  node.remove();
});

/* A touch as the phone's web view sends it: one finger at a point. */
const touchEvent = (type, target, x = 10, y = 10) => {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  const touches = type === "touchend" ? [] : [{ clientX: x, clientY: y, target }];
  Object.defineProperty(event, "touches", { value: touches });
  return event;
};

test("on the phone a tap on a word looks it up at once and says what it became; a sweep marks nothing", async () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const node = exampleView(labels("de").welcome.example, "de");
    document.body.append(node);
    const find = (text) => [...node.querySelectorAll('.words[data-panel="0"] .w')].find((one) => one.textContent === text);
    assert.ok(node.querySelector('.words[data-panel="0"]').classList.contains("touch-words"), "no system selection");
    /* No hover from the mouse events a tap brings. */
    await pointAt(find("salimos"));
    assert.strictEqual(node.querySelector(".glance.shown"), null);
    /* A sweep is a scroll: nothing marked, nothing looked up. */
    const pasear = find("pasear");
    pasear.dispatchEvent(touchEvent("touchstart", pasear, 10, 10));
    pasear.dispatchEvent(touchEvent("touchmove", pasear, 90, 12));
    pasear.dispatchEvent(touchEvent("touchend", pasear));
    assert.strictEqual(node.querySelector(".glance-lit, .glance.shown, .touch-marked"), null);
    assert.strictEqual(node.querySelector('.row[data-hl="sel"]'), null);
    /* A tap: the entry, the sign over the word, its places. */
    const salimos = find("salimos");
    salimos.dispatchEvent(touchEvent("touchstart", salimos));
    const lifted = touchEvent("touchend", salimos);
    salimos.dispatchEvent(lifted);
    assert.ok(lifted.defaultPrevented, "no click after the tap");
    assert.ok(node.querySelector('.row[data-hl="sel"]'), "looked up");
    assert.strictEqual(node.querySelector(".glance.shown").textContent, "gingen");
    assert.ok(node.querySelector('.words[data-panel="1"] .glance-lit'));
    assert.ok(node.querySelector('.words[data-panel="0"]').classList.contains("touch-words"), "still after the pick");
    /* Another word: one entry, the new one. */
    const casco = find("casco");
    casco.dispatchEvent(touchEvent("touchstart", casco));
    casco.dispatchEvent(touchEvent("touchend", casco));
    assert.strictEqual(node.querySelectorAll('.row[data-hl="sel"]').length, 1);
    assert.strictEqual(node.querySelector('.row[data-hl="sel"] .term').textContent, "casco antiguo");
    /* A tap beside the words lets the sign go. */
    const beside = node.querySelector(".row");
    beside.dispatchEvent(touchEvent("touchstart", beside));
    beside.dispatchEvent(touchEvent("touchend", beside));
    assert.strictEqual(node.querySelector(".glance.shown"), null);
    node.remove();
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

const click = (word) => {
  word.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
  word.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
  word.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
};

test("every word of the example's original can be picked: its entry, its synonyms and its spots in both translations", () => {
  for (const code of INTERFACE_LANGUAGES) {
    const example = labels(code).welcome.example;
    const node = exampleView(example, code);
    document.body.append(node);
    const count = node.querySelectorAll('.words[data-panel="0"] .w').length;
    assert.ok(count > 5, code);
    for (let at = 0; at < count; at++) {
      /* Each pick draws the texts anew. */
      const word = node.querySelectorAll('.words[data-panel="0"] .w')[at];
      click(word);
      assert.strictEqual(node.querySelectorAll('.row[data-hl="sel"]').length, 1, `${code}: "${word.textContent}" picked, once`);
      const row = node.querySelector('.row[data-hl="sel"]');
      const lit = node.querySelectorAll('.words:not([data-panel="0"]) .sel');
      const entry = example.picks.find((pick) => pick.text === row.querySelector(".term").textContent);
      assert.ok(entry, `${code}: "${word.textContent}" has its entry`);
      const wanted = entry.in.filter(Boolean).length;
      assert.strictEqual(lit.length, wanted, `${code}: "${entry.text}" marked in ${wanted} translations`);
      if (entry.synonyms?.length) assert.strictEqual(row.querySelectorAll(".synonym").length, entry.synonyms.length, `${code}: synonyms`);
      assert.ok(node.querySelector('.words[data-panel="0"] .sel'), `${code}: framed in the original`);
    }
    node.remove();
  }
});

test("a word of a translation in the example is not picked", () => {
  const node = exampleView(labels("de").welcome.example, "de");
  document.body.append(node);
  click(node.querySelector('.words[data-panel="1"] .w'));
  assert.strictEqual(node.querySelector('.row[data-hl="sel"]'), null);
  node.remove();
});

test("a word that stands twice in a translation is marked where it belongs", () => {
  const node = exampleView(labels("de").welcome.example, "de");
  document.body.append(node);
  click([...node.querySelectorAll('.words[data-panel="0"] .w')].find((word) => word.textContent === "por"));
  const lit = node.querySelector('.words[data-panel="1"] .sel');
  assert.strictEqual(lit.textContent, "in");
  const text = node.querySelector('.words[data-panel="1"]').textContent;
  assert.strictEqual(text.indexOf("in der"), [...lit.parentNode.childNodes].slice(0, [...lit.parentNode.childNodes].indexOf(lit))
    .reduce((n, child) => n + child.textContent.length, 0), "the second \"in\", before \"der\"");
  node.remove();
});

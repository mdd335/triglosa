/* The settings window's drawing, in a document of its own — the parts of it
   a reader has to be able to trust. Outside the app every platform call
   answers as it would with nothing granted and nothing installed, which is
   the state a first start is in. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
/* Nothing on this machine answers either: a translation helper left running
   by the app would otherwise be asked for real. */
globalThis.fetch = async () => { throw new TypeError("fetch failed"); };

const { backToList, onPageList, openPage, settingsView } = await import("../../src/ui/settings-view.js");
const { normalizeSettings } = await import("../../src/settings.js");
const { labels } = await import("../../src/ui/labels.js");

/* The fields a settings view draws, found by their heading. */
const fieldNamed = (view, name) => [...view.querySelectorAll(".field")]
  .find((node) => node.querySelector("label")?.textContent === name);
const shown = (node) => node.style.display !== "none" && (!node.parentElement || shown(node.parentElement));
/* macOS granting the permission, which outside the app it never does. */
const GRANTED = { permission: async () => true };

for (const code of ["de", "en"]) {
  test(`the Screen Recording permission has a box of its own on the Mac, after the other one and in its shape (${code})`, async (t) => {
    const text = labels(code);
    const draw = async (granted) => {
      const settings = normalizeSettings({ languages: [code, "es"] });
      const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} },
        { permission: async () => false, screenPermission: async () => granted });
      document.body.append(view);
      t.after(() => view.remove());
      await new Promise((resolve) => setTimeout(resolve, 20));
      return view;
    };
    const view = await draw(false);
    let field = fieldNamed(view, text.screenPermissionTitle);
    assert.ok(field, "the box is there");
    assert.strictEqual(fieldNamed(view, text.permission).nextElementSibling, field, "right after the other permission");
    assert.match(text.screenPermissionLead, /^Optional/, "said to be optional, as the other one is");
    assert.ok(field.textContent.includes(text.screenPermissionLead), "what it is for");
    assert.strictEqual(field.querySelector("a.text-link"), null, "the way to the code is said once, in the first");
    assert.ok(!field.textContent.includes(text.permissionHave), "not said to be granted");
    assert.deepStrictEqual([...field.querySelectorAll("button")].map((node) => node.textContent), [text.permissionAsk, text.permissionOpen]);
    field = fieldNamed(await draw(true), text.screenPermissionTitle);
    assert.ok(field.textContent.includes(text.permissionHave), "said to be granted");
    assert.deepStrictEqual([...field.querySelectorAll("button")].map((node) => node.textContent), [text.permissionOpen]);
  });
}

test("Windows draws no box for a screen permission: it asks none", async (t) => {
  globalThis.TRIGLOSA_SYSTEM = "windows";
  t.after(() => { delete globalThis.TRIGLOSA_SYSTEM; });
  const text = labels("en", "windows");
  const view = settingsView({ settings: normalizeSettings({ languages: ["en", "es"] }), apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
  document.body.append(view);
  t.after(() => view.remove());
  assert.strictEqual(fieldNamed(view, text.screenPermissionTitle), undefined);
});

for (const code of ["de", "en"]) {
  test(`the Accessibility permission stands first, and what it is used for only once macOS grants it (${code})`, async (t) => {
    const text = labels(code);
    const changes = [];
    const draw = async (stored, granted) => {
      const settings = normalizeSettings({ languages: [code, "es"], ...stored });
      const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} },
        { permission: async () => granted });
      document.body.append(view);
      t.after(() => view.remove());
      await new Promise((resolve) => setTimeout(resolve, 20));
      return view;
    };
    const groups = (view) => [...view.querySelectorAll("h2.group")].map((node) => node.textContent);

    /* Not granted: what it adds, where the code is, how to grant it — and
       nothing of what it is used for. */
    let view = await draw({}, false);
    assert.strictEqual(groups(view)[groups(view).indexOf(text.groupShortcuts) + 1], text.groupReading, "a group of its own");
    let field = fieldNamed(view, text.permission);
    assert.ok(field, "the field is there");
    assert.match(text.permissionTrust, /^Optional/, "said to be optional");
    assert.ok(field.textContent.includes(text.permissionTrust), "what it does and what for");
    assert.strictEqual(field.querySelector("select"), null, "no switch of its own");
    assert.ok(!field.textContent.includes(text.permissionHave), "not said to be granted");
    let buttons = [...field.querySelectorAll("button")].map((node) => node.textContent);
    const links = [...field.querySelectorAll("a.text-link")].map((node) => node.textContent);
    assert.deepStrictEqual(links, [text.permissionCode], "a way to the code that does it, as a link in the sentence");
    assert.ok(buttons.includes(text.permissionAsk) && buttons.includes(text.permissionOpen), "and to grant it");
    for (const name of [text.directSelection, text.withSentence, text.wordHotkey, text.sentenceHotkey]) {
      assert.ok(!shown(fieldNamed(view, name)), `${name} waits for the permission`);
    }
    assert.ok(!shown([...view.querySelectorAll(".hint")].find((node) => node.textContent === text.pointerUnreliable)));
    assert.strictEqual(fieldNamed(view, text.hotkey).querySelector(".hint").textContent, text.hotkeyLead, "without it, copying is the way");
    view.remove();

    /* Granted: said so, and each use with a switch or a field of its own. */
    view = await draw({}, true);
    field = fieldNamed(view, text.permission);
    assert.ok(field.textContent.includes(text.permissionHave));
    buttons = [...field.querySelectorAll("button")].map((node) => node.textContent);
    assert.deepStrictEqual(buttons, [text.permissionOpen]);
    const direct = fieldNamed(view, text.directSelection);
    assert.ok(shown(direct) && direct.textContent.includes(text.directSelectionLead));
    assert.strictEqual(direct.querySelector(".toggle").checked, true, "on once granted");
    assert.strictEqual(direct.nextElementSibling.textContent, text.pointerUnreliable, "what is unreliable comes after the selection");
    assert.ok(shown(direct.nextElementSibling));
    assert.strictEqual(fieldNamed(view, text.hotkey).querySelector(".hint").textContent, text.hotkeyLeadSelected);
    direct.querySelector(".toggle").click();
    assert.strictEqual(changes.at(-1).directSelection, false);
    view.remove();

    /* The selection's switch off: copying again, and nothing else changes. */
    view = await draw({ directSelection: false }, true);
    assert.strictEqual(fieldNamed(view, text.directSelection).querySelector(".toggle").checked, false);
    assert.strictEqual(fieldNamed(view, text.hotkey).querySelector(".hint").textContent, text.hotkeyLead);
    for (const name of [text.withSentence, text.wordHotkey, text.sentenceHotkey]) {
      assert.ok(shown(fieldNamed(view, name)), `${name} has nothing to do with it`);
    }
    view.remove();
  });
}

test("the hint under the shortcut teaches copying, which needs no permission", () => {
  assert.ok(labels("de").hotkeyLead.includes("kopieren"));
  assert.ok(labels("en").hotkeyLead.includes("copy"));
  assert.ok(labels("de").copyFirst("⌃⌥T").includes("⌃⌥T"));
});

/* On Windows there is no Apple translation, no permission and no Dock, so
   none of the three is offered — and the shortcut always takes the selection
   along. `TRIGLOSA_SYSTEM` makes the page believe it runs there. */
for (const code of ["de", "en"]) {
  test(`the Windows settings offer nothing that only a Mac has (${code})`, async () => {
    globalThis.TRIGLOSA_SYSTEM = "windows";
    try {
      const text = labels(code);
      const settings = normalizeSettings({ languages: [code, "es"] });
      const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
      document.body.append(view);
      await new Promise((resolve) => setTimeout(resolve, 20));
      const labelsShown = [...view.querySelectorAll(".field > label")].map((node) => node.textContent);
      for (const macOnly of [text.permission, text.directSelection, text.devicePairs, text.translator]) {
        assert.ok(!labelsShown.includes(macOnly), `${macOnly} is not offered`);
      }
      assert.strictEqual(view.querySelector("button.force-click"), null, "no force click to write into a field");
      /* The sentence that goes along and what is under the pointer need no
         permission there: offered as they are on the Mac, in the same order,
         after the shortcuts for text off the screen. */
      const order = [text.hotkey, text.screenHotkey, text.freshHotkey, text.cardHotkey, text.screenCardHotkey, text.screenCopyHotkey, text.withSentence, text.wordHotkey, text.sentenceHotkey].map((name) => labelsShown.indexOf(name));
      assert.ok(order.every((place, i) => place > -1 && (!i || place === order[i - 1] + 1)), `in order: ${order}`);
      assert.ok(view.textContent.includes(text.pointerUnreliable));
      /* What becomes of what is read, the screen's picture included, closes
         the page. */
      const reading = view.querySelector('.settings-page[data-page="reading"]');
      assert.strictEqual(reading.lastElementChild.textContent, text.readingPrivacy);
      assert.ok(reading.lastElementChild.classList.contains("group-hint"));
      /* The symbol in the notification area always stays; the taskbar button
         is the question. */
      const icon = [...view.querySelectorAll(".field")]
        .find((node) => node.querySelector("label")?.textContent === text.appIcon);
      assert.deepStrictEqual([...icon.querySelectorAll("option")].map((option) => option.value), ["menubar", "both"]);
      assert.deepStrictEqual([...icon.querySelectorAll("option")].map((option) => option.textContent),
        [text.appIcons.menubar, text.appIcons.both]);
      assert.ok(labelsShown.includes(text.glance), "the hover stays");
      /* No search engine of the system's to follow: DuckDuckGo stands in. */
      const search = [...view.querySelectorAll(".field")]
        .find((node) => node.querySelector("label")?.textContent === text.searchEngine).querySelector("select");
      assert.ok(![...search.options].some((option) => option.value === "system"));
      assert.strictEqual(search.value, "duckduckgo");
      const shortcut = [...view.querySelectorAll(".field")]
        .find((node) => node.querySelector("label")?.textContent === text.hotkey);
      assert.strictEqual(shortcut.querySelector(".hint").textContent, text.hotkeyLeadSelected);
      assert.doesNotMatch(view.textContent, /Apple|macOS|⌘/);
      view.remove();
    } finally {
      delete globalThis.TRIGLOSA_SYSTEM;
    }
  });
}

/* The force click is written into one of the two fields about what is
   under the pointer, by a button beside it, in place of a combination: in
   one of them at a time, and saying there how to keep Apple's Look Up out
   of it. */
for (const code of ["de", "en"]) {
  test(`the force click is written into the word's or the sentence's field by a button (${code})`, async () => {
    const text = labels(code);
    const combination = { accelerator: "Control+Alt+KeyW", label: "W" };
    const settings = normalizeSettings({ languages: [code, "es"], wordHotkey: combination });
    const draw = async (now) => {
      const changes = [];
      const view = settingsView({ settings: now, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} }, GRANTED);
      document.body.append(view);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { view, changes };
    };
    const buttonsOf = (row) => [...row.querySelectorAll("button")].map((node) => node.textContent);

    let { view, changes } = await draw(settings);
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.wordHotkey), names.indexOf(text.directSelection) + 2, "the word's shortcut under the selection's switch and the sentence that goes along");
    assert.ok(!names.includes(text.forceClick), "no row of its own");
    assert.ok(shown([...view.querySelectorAll(".hint")].find((node) => node.textContent === text.pointerUnreliable)),
      "said once over the whole block");
    for (const name of [text.hotkey, text.freshHotkey, text.cardHotkey]) {
      assert.ok(!buttonsOf(fieldNamed(view, name)).includes(text.forceClick), `${name} is not about the pointer`);
    }
    let word = fieldNamed(view, text.wordHotkey);
    assert.deepStrictEqual(buttonsOf(word), [text.forceClick, text.hotkeyClear]);
    assert.deepStrictEqual(buttonsOf(fieldNamed(view, text.sentenceHotkey)), [text.forceClick]);
    assert.ok(!view.textContent.includes(text.forceClickHint), "Look Up is no matter while the click is not set");
    word.querySelector("button.force-click").click();
    assert.strictEqual(changes.at(-1).forceClick, "word");
    assert.strictEqual(changes.at(-1).wordHotkey, null, "in place of the combination");
    view.remove();

    ({ view, changes } = await draw(changes.at(-1)));
    word = fieldNamed(view, text.wordHotkey);
    assert.strictEqual(word.querySelector("input").value, text.forceClick);
    assert.deepStrictEqual(buttonsOf(word), [text.hotkeyClear], "set, it is not offered again");
    assert.ok(word.textContent.includes(text.forceClickHint), "how to keep Look Up out");
    /* Set for the sentence, it leaves the word. */
    fieldNamed(view, text.sentenceHotkey).querySelector("button.force-click").click();
    assert.strictEqual(changes.at(-1).forceClick, "sentence");
    word.querySelector("button").click();
    assert.strictEqual(changes.at(-1).forceClick, false, "cleared like a combination");
    view.remove();

    ({ view } = await draw({ ...settings, wordHotkey: null, forceClick: "sentence" }));
    assert.strictEqual(fieldNamed(view, text.sentenceHotkey).querySelector("input").value, text.forceClick);
    assert.strictEqual(fieldNamed(view, text.wordHotkey).querySelector("input").value, "");
    assert.ok(fieldNamed(view, text.sentenceHotkey).textContent.includes(text.forceClickHint));
    view.remove();
  });

  test(`Apple's translation not answering comes with a button that asks again (${code})`, async () => {
    const text = labels(code);
    const view = settingsView({ settings: normalizeSettings({ languages: [code, "es"] }), apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const row = fieldNamed(view, text.devicePairs);
    assert.ok(row.textContent.includes(text.pairsNoDevice));
    const button = [...row.querySelectorAll("button")].find((node) => node.textContent === text.pairsRecheck);
    assert.ok(button, "the way to ask again");
    button.click();
    assert.ok(row.textContent.includes(text.pairsChecking), "asked again");
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual([...row.querySelectorAll("button")].filter((node) => node.textContent === text.pairsRecheck).length, 1, "and offered once");
    view.remove();
  });

  test(`how many readings are kept is a choice of five, ten, twenty or none, until the app quits (${code})`, async () => {
    const text = labels(code);
    const changes = [];
    const view = settingsView({ settings: normalizeSettings({ languages: [code, "es"] }), apiKey: "" },
      { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const row = fieldNamed(view, text.kept);
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.kept), names.indexOf(text.glance) + 1, "with the translations");
    const control = row.querySelector("select");
    assert.deepStrictEqual([...control.options].map((option) => option.textContent),
      [text.keptLast(5), text.keptLast(10), text.keptLast(20), text.optionOff]);
    assert.strictEqual(row.querySelector(".hint")?.textContent, text.keptHint);
    assert.strictEqual(control.value, "5");
    control.value = "0";
    control.dispatchEvent(new window.Event("change"));
    assert.strictEqual(changes.at(-1).kept, 0);
    view.remove();
  });

  test(`the sentence that goes along is a switch above the word's shortcut, on at first, saying how much (${code})`, async () => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const changes = [];
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} }, GRANTED);
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.sentenceHotkey), names.indexOf(text.wordHotkey) + 1);
    assert.strictEqual(names.indexOf(text.withSentence), names.indexOf(text.directSelection) + 1);
    assert.strictEqual(names.indexOf(text.wordHotkey), names.indexOf(text.withSentence) + 1);
    const row = fieldNamed(view, text.withSentence);
    assert.ok(shown(row) && row.textContent.includes(text.withSentenceLead));
    assert.match(text.withSentenceLead, /30/, "the most that goes along, in words");
    const control = row.querySelector(".toggle");
    assert.strictEqual(control.checked, true);
    control.click();
    assert.strictEqual(changes.at(-1).withSentence, false);
    view.remove();
  });

  test(`the next sentence is a switch under the sentence's shortcut, off at first (${code})`, async () => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const changes = [];
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} }, GRANTED);
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.nextSentence), names.indexOf(text.sentenceHotkey) + 1);
    const row = fieldNamed(view, text.nextSentence);
    assert.ok(shown(row) && row.textContent.includes(text.nextSentenceLead));
    const control = row.querySelector(".toggle");
    assert.strictEqual(control.checked, false);
    control.click();
    assert.strictEqual(changes.at(-1).nextSentence, true);
    view.remove();
  });
}

/* The word and the sentence under the pointer are read through the
   permission alone: their shortcuts stand with it, empty until set, gone
   until it is granted, and a combination one of the others holds is
   refused by that one's name. */
for (const code of ["de", "en"]) {
  test(`the shortcuts for what is under the pointer come with the permission (${code})`, async (t) => {
    const text = labels(code);
    const changes = [];
    const draw = async (granted) => {
      const settings = normalizeSettings({ languages: [code, "es"] });
      const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} },
        { permission: async () => granted });
      document.body.append(view);
      t.after(() => view.remove());
      await new Promise((resolve) => setTimeout(resolve, 20));
      return view;
    };
    let view = await draw(false);
    for (const name of [text.wordHotkey, text.sentenceHotkey]) assert.ok(!shown(fieldNamed(view, name)), name);
    view.remove();

    view = await draw(true);
    const rows = [text.wordHotkey, text.sentenceHotkey].map((name) => fieldNamed(view, name));
    assert.ok(rows.every(shown));
    assert.deepStrictEqual(rows.map((row) => row.querySelector("input").value), ["", ""]);
    assert.ok(rows[0].textContent.includes(text.wordHotkeyLead) && rows[1].textContent.includes(text.sentenceHotkeyLead));

    const input = rows[1].querySelector("input");
    input.dispatchEvent(new window.FocusEvent("focus"));
    input.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyT", key: "t", ctrlKey: true, altKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(rows[1].textContent.includes(text.hotkeyTakenHere(text.hotkey)));
    input.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyS", key: "s", ctrlKey: true, altKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.strictEqual(changes.at(-1).sentenceHotkey.accelerator, "Control+Alt+KeyS");
  });
}

for (const code of ["de", "en"]) {
  test(`three shortcuts in a group of their own, the two new ones empty, and none twice (${code})`, async () => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const changes = [];
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    document.body.append(view);

    const groups = [...view.querySelectorAll("h2.group")].map((node) => node.textContent);
    assert.strictEqual(groups[groups.indexOf(text.groupWindow) + 1], text.groupShortcuts, "right under the window group");
    const heading = [...view.querySelectorAll("h2.group")].find((node) => node.textContent === text.groupShortcuts);
    assert.strictEqual(heading.nextElementSibling.textContent, text.shortcutsLead);

    const rows = [text.hotkey, text.freshHotkey, text.cardHotkey].map((label) =>
      [...view.querySelectorAll(".field")].find((node) => node.querySelector("label")?.textContent === label));
    assert.ok(rows.every(Boolean), "all three are there");
    const inputs = rows.map((row) => row.querySelector("input"));
    assert.ok(inputs[0].value, "the first has its preset");
    assert.deepStrictEqual(inputs.slice(1).map((input) => input.value), ["", ""]);
    assert.ok(!rows[1].querySelector(".hint").textContent, "a blank reading needs no explaining");
    const hint = rows[0].querySelector(".hint");
    assert.ok(inputs[0].compareDocumentPosition(hint) & window.Node.DOCUMENT_POSITION_FOLLOWING,
      "the explanation stands under the field, as in every other group");

    /* The first one's combination pressed into the card's field. */
    inputs[2].dispatchEvent(new window.FocusEvent("focus"));
    inputs[2].dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyT", key: "t", ctrlKey: true, altKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(rows[2].textContent.includes(text.hotkeyTakenHere(text.hotkey)));
    assert.strictEqual(changes.length, 0, "not stored");

    inputs[2].dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyK", key: "k", ctrlKey: true, altKey: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.strictEqual(changes.at(-1).cardHotkey.accelerator, "Control+Alt+KeyK");
    view.remove();
  });
}

test("improving a card is on, and switched off in the flashcard group", () => {
  const text = labels("de");
  let changed = null;
  const draw = (stored) => {
    const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"], ...stored }), apiKey: "" },
      { onChange: (next) => { changed = next; }, onKeyChange: () => {} });
    return [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === text.cardsImprove);
  };
  const field = draw({});
  assert.ok(field, "the switch is there");
  const on = field.querySelector(".toggle");
  assert.strictEqual(on.checked, true);
  /* Not in a document, so no click: the switch as the reader leaves it. */
  on.checked = false;
  on.dispatchEvent(new window.Event("change"));
  assert.strictEqual(changed.cards.improve, false);
  assert.strictEqual(changed.cards.mode, "learned", "the other answer is untouched");
  assert.strictEqual(draw({ cards: { improve: false } }).querySelector(".toggle").checked, false);
  /* A reader who makes no cards out of a reading still makes them from the
     selection, so the question is asked either way. */
  assert.ok(draw({ cards: { mode: "never" } }), "offered whatever the answer above");
});

test("the search engine is the Mac's own unless another is chosen", async () => {
  const text = labels("en");
  const draw = (stored) => {
    const view = settingsView({ settings: normalizeSettings({ languages: ["en", "es"], ...stored }), apiKey: "" },
      { onChange: () => {}, onKeyChange: () => {} });
    return [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === text.searchEngine).querySelector("select");
  };
  const search = draw({});
  assert.strictEqual(search.options[0].value, "system");
  assert.strictEqual(search.options[0].textContent, text.searchSystem);
  assert.strictEqual(search.value, "system");
  assert.strictEqual(draw({ search: "bing" }).value, "bing");
});

/* A menu's groups, by the greyed entries that head them: [heading, options]. */
function groupsOf(node) {
  const groups = [];
  for (const child of node.children) {
    if (child.tagName !== "OPTION") continue;
    if (child.disabled) groups.push([child.textContent, []]);
    else if (groups.length) groups.at(-1)[1].push(child);
  }
  return groups;
}

for (const code of ["de", "en", "fr"]) {
  test(`the languages are offered in the alphabetical order of their names (${code})`, () => {
    const settings = normalizeSettings({ languages: [code, code === "en" ? "es" : "en", "it"] });
    const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    const selects = [...view.querySelectorAll("select")].filter((node) => !node.classList.contains("level")).slice(0, 3);
    const sorted = (names) => names.slice().sort((a, b) => a.localeCompare(b, code));
    /* The reader's own language has one list; a learned one has two, each
       under its heading and each in its own order. */
    for (const node of selects) {
      const groups = groupsOf(node);
      const lists = groups.length
        ? groups.map(([, options]) => options)
        : [[...node.options].filter((option) => option.value)];
      for (const list of lists) {
        const names = list.map((option) => option.textContent);
        assert.ok(names.length > 1);
        assert.deepStrictEqual(names, sorted(names));
      }
    }
  });
}

test("a learned language is chosen under one of two headings, and one without a pack says what that means", () => {
  const text = labels("de");
  const draw = (languages) => {
    const view = settingsView({ settings: normalizeSettings({ languages }), apiKey: "" },
      { onChange: () => {}, onKeyChange: () => {} });
    const row = (label) => [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === label);
    return { view, second: row(text.secondLanguage), third: row(text.thirdLanguage), verbs: row(text.showVerbs), terms: row(text.showTerms) };
  };

  const tuned = draw(["de", "es"]);
  const list = tuned.second.querySelector("select");
  const headings = groupsOf(list).map(([heading]) => heading);
  assert.deepStrictEqual(headings, [text.languagesTuned, text.languagesOther]);
  assert.ok(!list.querySelector("optgroup"), "not set in");
  assert.strictEqual(list.querySelectorAll("hr").length, 1, "a line before the second heading");
  const [first, others] = groupsOf(list).map(([, options]) => options.map((option) => option.value));
  assert.ok(first.includes("en") && first.includes("ar") && !first.includes("de"));
  assert.ok(others.includes("nl") && others.includes("ja") && !others.includes("es"));
  assert.ok(!tuned.second.textContent.includes(text.otherLanguageHint), "nothing to say about Spanish");
  assert.strictEqual(tuned.first, undefined);

  const other = draw(["de", "nl", "es"]);
  assert.strictEqual(other.second.querySelector("select").value, "nl");
  assert.ok(other.second.textContent.includes(text.otherLanguageHint));
  assert.ok(!other.third.textContent.includes(text.otherLanguageHint));
  assert.ok(other.second.querySelector("select.level"), "a level like any learned language");
  /* The verbs are never drawn for it, so its place is not offered there. */
  const modes = (row) => [...row.querySelector("select").options].map((option) => option.value);
  assert.deepStrictEqual(modes(other.verbs), ["never", "third", "foreign", "all"]);
  assert.deepStrictEqual(modes(other.terms), ["never", "second", "third", "foreign", "all"]);
  /* The reader's own language is one of those the interface is written in. */
  const own = [...other.view.querySelectorAll("select")][0];
  assert.strictEqual(groupsOf(own).length, 0);
  assert.ok(![...own.options].some((option) => option.value === "nl"));
});

test("the terms come before the verbs, as on the sheet", () => {
  const text = labels("de");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  const names = [...view.querySelectorAll(".field > label")].map((node) => node.textContent);
  assert.ok(names.indexOf(text.showTerms) > -1 && names.indexOf(text.showTerms) < names.indexOf(text.showVerbs));
});

for (const code of ["de", "en", "es", "fr", "it", "pt", "ru"]) {
  test(`the way to the project is a sentence with three links, the diagnostics under it (${code})`, () => {
    const text = labels(code);
    const view = settingsView({ settings: normalizeSettings({ languages: [code, code === "en" ? "es" : "en"] }), apiKey: "" },
      { onChange: () => {}, onKeyChange: () => {} });
    const sentence = view.querySelector(".about-links");
    const links = [...sentence.querySelectorAll("a")];
    assert.deepStrictEqual(links.map((link) => link.href), [
      "https://github.com/mdd335/triglosa",
      "https://github.com/mdd335/triglosa#readme",
      "https://github.com/mdd335/triglosa/issues",
    ]);
    assert.strictEqual(sentence.querySelectorAll("button").length, 0);
    const diagnostics = [...view.querySelectorAll("button")].find((node) => node.textContent === text.diagnosticsCopy);
    assert.ok(sentence.compareDocumentPosition(diagnostics) & window.Node.DOCUMENT_POSITION_FOLLOWING, "under it");
  });
}

/* A phone has one page under a finger: no window to fit, no shortcut, no
   other program to read from, no pointer to hover with, and nothing to
   install from inside the app. Cards it has, and an Anki of its own. */
for (const code of ["de", "en", "fr"]) {
  test(`the phone's settings offer only what a phone has (${code})`, async () => {
    globalThis.TRIGLOSA_SYSTEM = "ios";
    try {
      const text = labels(code);
      const settings = normalizeSettings({ languages: [code, "es"] });
      const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
      document.body.append(view);
      await new Promise((resolve) => setTimeout(resolve, 20));
      const labelsShown = [...view.querySelectorAll(".field > label")].map((node) => node.textContent);
      for (const absent of [text.permission, text.glance, text.fitWindow,
        text.appIcon, text.hotkey, text.cardHotkey, text.wordHotkey, text.withSentence]) {
        assert.ok(!labelsShown.includes(absent), `${absent} is not offered`);
      }
      for (const kept of [text.devicePairs, text.translator, text.showTerms, text.showVerbs, text.underline, text.searchEngine, text.kept,
        text.cardsEnabled, text.cardsImprove, text.ankiEnabled]) {
        assert.ok(labelsShown.includes(kept), `${kept} stays`);
      }
      const groups = [...view.querySelectorAll("h2, h3, .group")].map((node) => node.textContent);
      assert.ok(groups.includes(text.groupLanguages) && groups.includes(text.groupAbout));
      assert.ok(groups.includes(text.groupCards));
      for (const absent of [text.groupWindow, text.groupShortcuts, text.groupReading]) {
        assert.ok(!groups.includes(absent), `no group ${absent}`);
      }
      assert.ok(view.textContent.includes(text.modelIntro));
      assert.ok(!view.querySelector(".update-check"), "nothing to install from here");
      const offered = [...view.querySelectorAll(".setup-choice b")].map((node) => node.textContent);
      assert.deepStrictEqual(offered, [text.setupOnline, text.setupOwn], "no model on the phone itself to point at");
      /* The engine Safari is set to is the preset, as on the Mac. */
      const search = [...view.querySelectorAll(".field")]
        .find((node) => node.querySelector("label")?.textContent === text.searchEngine).querySelector("select");
      assert.strictEqual(search.value, "system");
      view.remove();
    } finally {
      delete globalThis.TRIGLOSA_SYSTEM;
    }
  });
}

test("syncing after every card is a switch under Anki's fields, off until set", async (t) => {
  const text = labels("en");
  const failing = globalThis.fetch;
  /* AnkiConnect answering, with one deck of one note type. */
  globalThis.fetch = async (url, { body }) => {
    if (!String(url).includes("8765")) throw new TypeError("fetch failed");
    const { action } = JSON.parse(body);
    const result = { version: 6, deckNames: ["Vokabeln"], modelNames: ["Basic"], findNotes: [],
      modelFieldNames: ["Front", "Back"] }[action] ?? null;
    return { ok: true, text: async () => JSON.stringify({ result, error: null }) };
  };
  t.after(() => { globalThis.fetch = failing; });
  const changes = [];
  const settings = normalizeSettings({ languages: ["en", "es"],
    cards: { anki: { enabled: true, decks: { es: { deck: "Vokabeln", noteType: "Basic", fields: { term: "Front" } } } } } });
  const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} });
  document.body.append(view);
  t.after(() => view.remove());
  await new Promise((resolve) => setTimeout(resolve, 20));
  /* What Anki said is kept for the session; an earlier test's silence is
     asked again. */
  const again = [...view.querySelectorAll(".anki-body button")].find((node) => node.textContent === text.ankiRecheck);
  if (again) {
    again.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const row = fieldNamed(view, text.ankiSync);
  assert.ok(row, "offered once Anki answers");
  assert.ok(row.textContent.includes(text.ankiSyncHint));
  const toggle = row.querySelector(".toggle");
  assert.strictEqual(toggle.checked, false, "off until set");
  toggle.click();
  assert.strictEqual(changes.at(-1).cards.anki.sync, true);
});

test("the phone's lists are fetched anew from right under the deck list", async (t) => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  const stored = new Map([["triglosa.anki-info", JSON.stringify({
    decks: ["Spanisch"], notetypes: [{ name: "Basic", fields: ["Front", "Back"] }],
  })]]);
  globalThis.localStorage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
  t.after(() => {
    delete globalThis.TRIGLOSA_SYSTEM;
    delete globalThis.localStorage;
  });
  const text = labels("de");
  const settings = normalizeSettings({ languages: ["de", "es"], cards: { anki: { enabled: true,
    decks: { es: { deck: "Spanisch", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "" } } } } } });
  const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
  document.body.append(view);
  t.after(() => view.remove());
  /* What an earlier test left of Anki's answer is asked again. */
  const again = () => [...view.querySelectorAll(".anki-body button")].find((node) => node.textContent === text.ankiRecheck);
  for (let tries = 0; tries < 20 && !again(); tries += 1) await new Promise((resolve) => setTimeout(resolve, 10));
  const deck = fieldNamed(view, text.ankiDeck);
  assert.ok(again(), "offered");
  assert.strictEqual(deck.nextElementSibling, again().closest(".field"), "right under the deck list");
});

test("the phone's Anki is fetched from on a button, and names no add-on", async () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const text = labels("en");
    const settings = normalizeSettings({ languages: ["en", "es"] });
    settings.cards.anki.enabled = true;
    const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const anki = view.querySelector(".anki");
    assert.ok(anki.textContent.includes("AnkiMobile") && !anki.textContent.includes("AnkiConnect"));
    assert.ok(anki.textContent.includes(text.ankiMissing));
    const buttons = [...anki.querySelectorAll(".anki-body button")].map((node) => node.textContent);
    assert.deepStrictEqual(buttons, [text.ankiLaunch]);
    assert.ok(!fieldNamed(view, text.ankiSync), "AnkiMobile syncs by itself");
    assert.strictEqual(text.ankiFailed({ kind: "absent" }), text.ankiAbsent);
    view.remove();
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

/* One deck per language for whoever learns two: a button per language over
   the deck's questions, and where cards are made in every language a plus
   that adds one more, and a cross that takes an added one away. */
test("each language a card goes to Anki from gets its own deck", async (t) => {
  const text = labels("de");
  const failing = globalThis.fetch;
  globalThis.fetch = async (url, { body }) => {
    if (!String(url).includes("8765")) throw new TypeError("fetch failed");
    const { action } = JSON.parse(body);
    const result = { version: 6, deckNames: ["Spanisch", "Französisch"], modelNames: ["Basic"], findNotes: [],
      modelFieldNames: ["Front", "Back"] }[action] ?? null;
    return { ok: true, text: async () => JSON.stringify({ result, error: null }) };
  };
  t.after(() => { globalThis.fetch = failing; });
  const spanish = { deck: "Spanisch", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "" } };
  const changes = [];
  const open = async (stored) => {
    const settings = normalizeSettings({ languages: ["de", "es", "fr"], ...stored });
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    document.body.append(view);
    t.after(() => view.remove());
    await new Promise((resolve) => setTimeout(resolve, 20));
    const again = [...view.querySelectorAll(".anki-body button")].find((node) => node.textContent === text.ankiRecheck);
    if (again) {
      again.click();
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return view;
  };
  const names = (view) => [...view.querySelectorAll(".anki-targets button")].map((node) => node.textContent);
  const pressed = (view) => view.querySelector(".anki-targets [aria-pressed=true]").textContent;
  const anki = { enabled: true, decks: { es: spanish } };

  const view = await open({ cards: { anki } });
  assert.deepStrictEqual(names(view), ["Spanisch", "Französisch"], "the default: the two languages being learned");
  assert.strictEqual(pressed(view), "Französisch", "opened on what is still missing");
  assert.ok(!view.querySelector(".anki-add"), "no plus where cards are made in these two alone");
  assert.strictEqual(view.querySelector(".anki-targets").previousElementSibling.textContent, text.ankiPerLanguage,
    "a line over the row says that what follows is per language");
  const deck = fieldNamed(view, text.ankiDeck).querySelector("select");
  assert.strictEqual(deck.value, "", "French takes no other language's deck");
  deck.value = "Französisch";
  deck.dispatchEvent(new window.Event("change"));
  const saved = changes.at(-1).cards.anki.decks;
  assert.strictEqual(saved.fr.deck, "Französisch");
  assert.deepStrictEqual(saved.es, spanish, "the Spanish deck is untouched");

  view.querySelector(".anki-targets [data-target=es]").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(pressed(view), "Spanisch");
  const spanishDeck = fieldNamed(view, text.ankiDeck).querySelector("select");
  assert.strictEqual(spanishDeck.value, "Spanisch");
  spanishDeck.value = "Französisch";
  spanishDeck.dispatchEvent(new window.Event("change"));
  assert.deepStrictEqual(changes.at(-1).cards.anki.decks.es,
    { deck: "Französisch", noteType: "", fields: { term: "", meaning: "", note: "" } },
    "another deck is asked its note type anew, the fields with it");

  const wide = await open({ cards: { mode: "foreign", anki } });
  const plus = wide.querySelector(".anki-add select");
  assert.ok(plus, "a plus where cards are made in every language");
  const offered = [...plus.options].map((o) => o.value).filter(Boolean);
  assert.ok(offered.includes("it") && !offered.includes("de") && !offered.includes("es"), "the rest, never the reader's own or one in the row");
  plus.value = "it";
  plus.dispatchEvent(new window.Event("change"));
  const added = changes.at(-1);
  assert.deepStrictEqual(Object.keys(added.cards.anki.decks), ["es", "it"]);

  const three = await open({ cards: { mode: "foreign", anki: added.cards.anki } });
  assert.deepStrictEqual(names(three), ["Spanisch", "Französisch", "Italienisch"]);
  three.querySelector(".anki-targets [data-target=it]").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(!three.querySelector("[data-target=es] .remove"), "a language of the reader's own has no cross");
  three.querySelector("[data-target=it] .remove").click();
  assert.deepStrictEqual(Object.keys(changes.at(-1).cards.anki.decks), ["es"], "the cross takes it away");

  const one = await open({ cards: { mode: "second", anki } });
  assert.deepStrictEqual(names(one), [], "one language, one deck, no row");
});

test("with two languages, the languages being learned are the second alone", () => {
  const text = labels("de");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"], cards: { mode: "second" } }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  const list = fieldNamed(view, text.cardsEnabled).querySelector("select");
  assert.deepStrictEqual([...list.options].map((o) => o.textContent),
    [text.cardModes.never, text.cardModes.second, text.cardModes.foreign]);
  assert.strictEqual(list.value, "learned");
});

test("the settings lead back to the first steps, on a phone too", () => {
  const view = settingsView({ settings: normalizeSettings({ welcome: false }), apiKey: "" }, {});
  const again = view.querySelector(".welcome-again");
  assert.strictEqual(again.textContent, labels("en").welcome.open);
  assert.strictEqual(again.tagName, "BUTTON", "it opens a window of the app, so it is a button and no link");
  const about = view.querySelector('.settings-page[data-page="about"]');
  assert.strictEqual(about.lastElementChild, again.parentElement, "last, under the links");
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const phone = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {});
    assert.ok(phone.querySelector(".welcome-again"), "a sheet there");
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("on a phone the model's page says whether texts go to the model at this address, and changes it", () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const text = labels("en", "ios");
    const changes = [];
    const settings = normalizeSettings({ endpoint: "https://openrouter.ai/api/v1", way: "online" });
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next.modelConsent) });
    const field = fieldNamed(view, text.modelConsentSetting);
    assert.ok(field, "the switch");
    assert.ok(field.textContent.includes("openrouter.ai"), "names the address");
    const toggle = field.querySelector("input");
    assert.strictEqual(toggle.checked, false, "not allowed until asked");
    toggle.checked = true;
    toggle.dispatchEvent(new dom.window.Event("change"));
    assert.deepStrictEqual(changes, [{ host: "openrouter.ai", allowed: true }]);
    const without = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {});
    assert.strictEqual(fieldNamed(without, text.modelConsentSetting), undefined, "no address, nothing to allow");
    const desktop = (delete globalThis.TRIGLOSA_SYSTEM, settingsView({ settings, apiKey: "" }, {}));
    assert.strictEqual(fieldNamed(desktop, labels("en").modelConsentSetting || "-"), undefined, "a computer does not ask");
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("the anonymous count is a switch under About on a computer, and not on a phone", () => {
  const text = labels("en");
  const changes = [];
  const view = settingsView({ settings: normalizeSettings({}), apiKey: "" }, { onChange: (next) => changes.push(next.stats) });
  const field = fieldNamed(view, text.statsSetting);
  assert.ok(field.closest('.settings-page[data-page="about"]'));
  const toggle = field.querySelector("input");
  assert.strictEqual(toggle.checked, false, "unanswered is off");
  toggle.checked = true;
  toggle.dispatchEvent(new dom.window.Event("change"));
  assert.deepStrictEqual(changes, [true]);
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    assert.strictEqual(fieldNamed(settingsView({ settings: normalizeSettings({}), apiKey: "" }, {}), text.statsSetting), undefined);
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("the release notes are a link beside the version, without an update check", () => {
  const text = labels("en");
  const view = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {});
  const link = [...view.querySelectorAll("a.text-link")].find((node) => node.textContent === text.aboutNotes);
  assert.ok(link, "there before any check");
  assert.strictEqual(link.href, "https://github.com/mdd335/triglosa/releases");
});

test("a copy from the Microsoft Store has no update check of its own", async () => {
  const text = labels("en");
  const view = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {}, { storeCopy: async () => true });
  assert.ok(view.querySelector(".update-check"), "until the shell has answered");
  await new Promise((done) => setTimeout(done, 0));
  assert.ok(!view.querySelector(".update-check"));
  assert.ok(!view.textContent.includes(text.updatesHint));
  assert.ok([...view.querySelectorAll("a.text-link")].some((node) => node.textContent === text.aboutNotes));
});

test("a newer version's page is a link behind what was found, never a button", async () => {
  const text = labels("en");
  const url = "https://github.com/mdd335/triglosa/releases/tag/v99.0.0";
  const view = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {},
    { findUpdate: async () => ({ newer: true, version: "99.0.0", url }) });
  document.body.append(view);
  try {
    view.querySelector(".update-check").click();
    await new Promise((done) => setTimeout(done, 20));
    const link = [...view.querySelectorAll("a.text-link")].find((node) => node.textContent === text.updatesDownload);
    assert.ok(link, "the way to the download page");
    assert.strictEqual(link.href, url);
    assert.ok(link.parentElement.textContent.startsWith(text.updatesFound("99.0.0")));
    assert.ok(![...view.querySelectorAll("button")].some((node) => node.textContent === text.updatesDownload));
  } finally {
    view.remove();
  }
});

test("what is about a whole group stands apart from the line under one control", () => {
  const text = labels("en");
  const view = settingsView({ settings: normalizeSettings({}), apiKey: "" }, {});
  const lead = [...view.querySelectorAll(".group-hint")].map((node) => node.textContent);
  assert.ok(lead.includes(text.shortcutsLead));
  assert.ok(lead.includes(text.pointerUnreliable));
  assert.ok(fieldNamed(view, text.permission).querySelector(".hint.standalone").textContent.startsWith(text.permissionTrust));
  assert.ok(!fieldNamed(view, text.glance).querySelector(".standalone"), "a switch's own line stays as it is");
});

test("each group is a page of its own, one shown at a time, chosen in the list beside them", () => {
  const text = labels("de");
  const draw = () => settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  openPage("languages");
  let view = draw();
  document.body.append(view);
  const entries = () => [...view.querySelectorAll(".settings-nav .settings-entry")];
  const pages = () => [...view.querySelectorAll(".settings-page")];
  assert.deepStrictEqual(entries().map((node) => node.textContent), [
    text.groupLanguages, text.groupModel, text.groupTranslation, text.groupSections, text.groupWindow,
    text.groupShortcuts, text.groupReading, text.groupCards, text.groupAbout,
  ]);
  assert.ok(entries().every((node) => node.querySelector("svg")), "each with its symbol");
  assert.deepStrictEqual(pages().map((node) => node.querySelector("h2.group").textContent),
    entries().map((node) => node.textContent), "each page under its own name");
  const showing = () => pages().filter((node) => !node.hidden).map((node) => node.dataset.page);
  assert.deepStrictEqual(showing(), ["languages"]);
  assert.strictEqual(entries()[0].getAttribute("aria-current"), "page");

  entries()[6].click();
  assert.deepStrictEqual(showing(), ["reading"], "a click shows that page alone");
  assert.ok(fieldNamed(view, text.permission), "with what stands in it");
  assert.strictEqual(entries()[0].getAttribute("aria-current"), null);

  /* A change redraws the window: it stays on the page. */
  view.remove();
  view = draw();
  document.body.append(view);
  assert.deepStrictEqual(showing(), ["reading"], "kept past a redraw");

  /* Up and down step through the list. */
  entries()[6].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  assert.deepStrictEqual(showing(), ["cards"]);
  entries()[7].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  assert.deepStrictEqual(showing(), ["reading"]);

  /* Asked for from outside: the update entry, a card's deck. */
  openPage("about");
  assert.deepStrictEqual(showing(), ["about"], "shown at once where the window stands");
  openPage("nonsense");
  assert.deepStrictEqual(showing(), ["languages"], "a page that does not exist opens the first");
  view.remove();
  openPage("languages");
});

test("the languages' page says what the list decides; the hover and the kept readings stand above who translates", () => {
  for (const code of ["de", "en", "es", "fr", "it", "pt", "ru"]) {
    const text = labels(code);
    assert.ok(text.languagesIntro && text.showTerms && text.showVerbs, `${code} has the words`);
  }
  const text = labels("de");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  const languages = view.querySelector('.settings-page[data-page="languages"]');
  assert.deepStrictEqual([...languages.querySelectorAll(".languages-after .group-hint")].map((node) => node.textContent),
    text.languagesIntro, "three paragraphs, under the rows");
  const names = [...view.querySelectorAll('.settings-page[data-page="translation"] .field > label')]
    .map((node) => node.textContent);
  assert.deepStrictEqual(names.slice(0, 2), [text.glance, text.kept]);
  assert.ok(names.indexOf(text.devicePairs) > names.indexOf(text.kept));
});

test("a setting with two answers is a switch beside its name, turned only by a click on itself", () => {
  const text = labels("en");
  const changes = [];
  const view = settingsView({ settings: normalizeSettings({ languages: ["en", "es"] }), apiKey: "" },
    { onChange: (next) => changes.push(next), onKeyChange: () => {} });
  document.body.append(view);
  const row = fieldNamed(view, text.glance);
  assert.ok(row.classList.contains("beside"), "at the row's right end");
  const toggle = row.querySelector("input.toggle");
  assert.strictEqual(toggle.type, "checkbox");
  assert.strictEqual(toggle.getAttribute("role"), "switch");
  assert.strictEqual(row.querySelector("select"), null, "no list of on and off");
  assert.strictEqual(toggle.getAttribute("aria-label"), text.glance);
  row.querySelector("label").click();
  assert.strictEqual(changes.length, 0, "the name does not turn it");
  toggle.click();
  assert.strictEqual(changes.at(-1).glance, !normalizeSettings({}).glance);
  view.remove();
});

/* The note type is asked about a deck: not shown before one is chosen, and
   once it is, one of Anki's own types is always set — no empty entry to go
   back to. */
test("the note type follows the deck and has no empty entry", async (t) => {
  const text = labels("en");
  const failing = globalThis.fetch;
  globalThis.fetch = async (url, { body }) => {
    if (!String(url).includes("8765")) throw new TypeError("fetch failed");
    const { action } = JSON.parse(body);
    const result = { version: 6, deckNames: ["Vokabeln"], modelNames: ["Basic", "Cloze"], findNotes: [],
      modelFieldNames: ["Front", "Back"] }[action] ?? null;
    return { ok: true, text: async () => JSON.stringify({ result, error: null }) };
  };
  t.after(() => { globalThis.fetch = failing; });
  const changes = [];
  const open = async (deck) => {
    const settings = normalizeSettings({ languages: ["en", "es"],
      cards: { anki: { enabled: true, decks: { es: { deck, noteType: "", fields: { term: "", meaning: "", note: "" } } } } } });
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    document.body.append(view);
    t.after(() => view.remove());
    await new Promise((resolve) => setTimeout(resolve, 20));
    const again = [...view.querySelectorAll(".anki-body button")].find((node) => node.textContent === text.ankiRecheck);
    if (again) {
      again.click();
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return view;
  };

  const none = await open("");
  assert.ok(fieldNamed(none, text.ankiDeck), "the deck is asked");
  assert.ok(!fieldNamed(none, text.ankiNoteType), "the note type not before a deck");

  const chosen = await open("Vokabeln");
  const list = fieldNamed(chosen, text.ankiNoteType).querySelector("select");
  assert.deepStrictEqual([...list.options].map((o) => o.value), ["Basic", "Cloze"], "no empty entry");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(changes.at(-1).cards.anki.decks.es.noteType, "Basic", "the first is set where none was");
});

test("the switch that improves cards says a card can always be improved on its button", () => {
  const text = labels("de");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  const row = fieldNamed(view, text.cardsImprove);
  assert.ok(row.textContent.includes(text.cardsImproveHint));
  assert.strictEqual(text.cardsImproveHint, "Karten können immer per Knopfdruck mit KI verbessert werden.", "worded so");
  assert.strictEqual(text.cardsEnabled, "Knopf für Lernkarten anzeigen", "worded so");
});

/* On a phone the list of pages is a screen of its own, as in the system's
   settings: an entry leads on to its page, the way back leads to the list,
   and the place survives the redraw every change causes. */
test("the phone's settings are a list that leads on to each page", () => {
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    const text = labels("de");
    const settings = normalizeSettings({ languages: ["de", "es"] });
    let placed = 0;
    const handlers = { onChange: () => {}, onKeyChange: () => {}, onPlace: () => { placed += 1; } };
    backToList();
    let view = settingsView({ settings, apiKey: "" }, handlers);
    assert.ok(view.classList.contains("on-list"), "opened on the list");
    const entries = [...view.querySelectorAll(".settings-entry")];
    assert.ok(entries.every((entry) => entry.querySelectorAll("svg").length === 2), "a symbol and a chevron each");
    view.querySelector('.settings-entry[data-page="model"]').click();
    assert.ok(!view.classList.contains("on-list"));
    assert.strictEqual(placed, 1, "the sheet is told, to change its bar");
    assert.strictEqual(onPageList(), false);
    view = settingsView({ settings, apiKey: "" }, handlers);
    assert.ok(!view.classList.contains("on-list"), "a redraw stays on the page");
    assert.strictEqual(view.querySelector(".settings-page:not([hidden])").dataset.page, "model");
    backToList();
    assert.ok(view.classList.contains("on-list"), "and the way back leads to the list");
    openPage("cards");
    assert.ok(!view.classList.contains("on-list"), "a page asked for from outside is opened");
    assert.strictEqual(view.querySelector(".settings-page:not([hidden])").dataset.page, "cards");
    assert.ok(text.settings);
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
    backToList();
  }
});

test("on a computer there is no list screen, whatever the phone left", () => {
  openPage("model");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  assert.ok(!view.classList.contains("on-list"));
  assert.ok([...view.querySelectorAll(".settings-entry")].every((entry) => entry.querySelectorAll("svg").length === 1));
});

test("entering it yourself offers the two local servers' addresses, on a computer", () => {
  const text = labels("en");
  const draw = (way) => {
    const changes = [];
    const view = settingsView({ settings: normalizeSettings({ languages: ["en", "es"], way, endpoint: "https://api.mistral.ai/v1" }), apiKey: "" },
      { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    return { buttons: [...fieldNamed(view, text.endpoint).querySelectorAll("button")], changes };
  };
  const { buttons, changes } = draw("own");
  assert.deepStrictEqual(buttons.map((button) => button.textContent),
    [text.endpointPreset("LM Studio"), text.endpointPreset("Ollama")]);
  buttons[1].click();
  assert.strictEqual(changes.at(-1).endpoint, "http://127.0.0.1:11434/v1");
  globalThis.TRIGLOSA_SYSTEM = "ios";
  try {
    assert.strictEqual(draw("own").buttons.length, 0, "a phone runs neither");
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

for (const code of ["de", "en"]) {
  test(`under the fields only what matters on the way chosen (${code})`, () => {
    const text = labels(code);
    const hints = (view, name) => fieldNamed(view, name).querySelector(".hint").textContent;
    for (const [way, endpoint] of [["online", "https://openrouter.ai/api/v1"], ["own", "https://api.mistral.ai/v1"]]) {
      const view = settingsView({ settings: normalizeSettings({ languages: [code, "es"], way, endpoint }), apiKey: "" },
        { onChange: () => {}, onKeyChange: () => {} });
      assert.strictEqual(hints(view, text.endpoint), text.endpointHints[way], way);
      assert.strictEqual(hints(view, text.model), text.modelHints[way], way);
      assert.strictEqual(hints(view, text.apiKey), text.apiKeyHints[way], way);
    }
    assert.ok(text.endpointHints.online.includes(text.setupOwn), "pointing at the way for another provider by its name");
  });

  test(`an address of a way changed by mistake is put back with a button (${code})`, () => {
    const text = labels(code);
    const draw = (way, endpoint) => {
      const changes = [];
      const view = settingsView({ settings: normalizeSettings({ languages: [code, "es"], way, endpoint }), apiKey: "" },
        { onChange: (next) => changes.push(next), onKeyChange: () => {} });
      return { button: fieldNamed(view, text.endpoint).querySelector("button"), changes };
    };
    assert.strictEqual(draw("online", "https://openrouter.ai/api/v1/").button, null, "a slash at the end is the same address");
    const { button, changes } = draw("online", "https://openrouter.ai/api/v");
    assert.strictEqual(button.textContent, text.endpointPreset("OpenRouter"));
    button.click();
    assert.strictEqual(changes.at(-1).endpoint, "https://openrouter.ai/api/v1");
  });
}

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

const { settingsView } = await import("../../src/ui/settings-view.js");
const { normalizeSettings } = await import("../../src/settings.js");
const { labels } = await import("../../src/ui/labels.js");

/* The fields a settings view draws, found by their heading. */
const fieldNamed = (view, name) => [...view.querySelectorAll(".field")]
  .find((node) => node.querySelector("label")?.textContent === name);
const shown = (node) => node.style.display !== "none" && (!node.parentElement || shown(node.parentElement));
/* macOS granting the permission, which outside the app it never does. */
const GRANTED = { permission: async () => true };

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
    for (const name of [text.directSelection, text.withSentence, text.wordHotkey, text.forceClick, text.sentenceHotkey]) {
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
    assert.strictEqual(direct.querySelector("select").value, "on", "on once granted");
    assert.strictEqual(direct.nextElementSibling.textContent, text.pointerUnreliable, "what is unreliable comes after the selection");
    assert.ok(shown(direct.nextElementSibling));
    assert.strictEqual(fieldNamed(view, text.hotkey).querySelector(".hint").textContent, text.hotkeyLeadSelected);
    direct.querySelector("select").value = "off";
    direct.querySelector("select").dispatchEvent(new window.Event("change"));
    assert.strictEqual(changes.at(-1).directSelection, false);
    view.remove();

    /* The selection's switch off: copying again, and nothing else changes. */
    view = await draw({ directSelection: false }, true);
    assert.strictEqual(fieldNamed(view, text.directSelection).querySelector("select").value, "off");
    assert.strictEqual(fieldNamed(view, text.hotkey).querySelector(".hint").textContent, text.hotkeyLead);
    for (const name of [text.withSentence, text.wordHotkey, text.forceClick, text.sentenceHotkey]) {
      assert.ok(shown(fieldNamed(view, name)), `${name} has nothing to do with it`);
    }
    view.remove();
  });
}

test("the hint under the shortcut teaches copying, which needs no permission", () => {
  assert.ok(labels("de").hotkeyLead.includes("kopieren"));
  assert.ok(labels("en").hotkeyLead.includes("copy"));
  assert.ok(labels("de").copyFirst("⌃⌥E").includes("⌃⌥E"));
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
      for (const macOnly of [text.permission, text.directSelection, text.devicePairs, text.translator, text.forceClick]) {
        assert.ok(!labelsShown.includes(macOnly), `${macOnly} is not offered`);
      }
      /* The sentence that goes along and what is under the pointer need no
         permission there: offered as they are on the Mac, in the same order. */
      const order = [text.cardHotkey, text.withSentence, text.wordHotkey, text.sentenceHotkey].map((name) => labelsShown.indexOf(name));
      assert.ok(order.every((place, i) => place > -1 && (!i || place === order[i - 1] + 1)), `in order: ${order}`);
      assert.ok(view.textContent.includes(text.pointerUnreliable));
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

/* The force click stands under the permission it needs, only once that is
   switched on, off until turned on itself, and says where it falls short
   and how to keep Apple's Look Up out of it. */
for (const code of ["de", "en"]) {
  test(`the force click is a switch under the permission, off at first (${code})`, async () => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const changes = [];
    const view = settingsView({ settings, apiKey: "" }, { onChange: (next) => changes.push(next), onKeyChange: () => {} }, GRANTED);
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.wordHotkey), names.indexOf(text.directSelection) + 2, "the word's shortcut under the selection's switch and the sentence that goes along");
    assert.strictEqual(names.indexOf(text.forceClick), names.indexOf(text.wordHotkey) + 1, "and its click under it");
    const row = fieldNamed(view, text.forceClick);
    assert.ok(shown(row));
    assert.ok(row.textContent.includes(text.forceClickLead));
    assert.ok(!row.textContent.includes(text.forceClickHint), "Look Up is no matter while the click is off");
    assert.ok(shown([...view.querySelectorAll(".hint")].find((node) => node.textContent === text.pointerUnreliable)),
      "said once over the whole block");
    const control = row.querySelector("select");
    assert.strictEqual(control.value, "off");
    control.value = "on";
    control.dispatchEvent(new window.Event("change"));
    assert.strictEqual(changes.at(-1).forceClick, true);
    view.remove();

    const on = settingsView({ settings: { ...settings, forceClick: true }, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} }, GRANTED);
    document.body.append(on);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(fieldNamed(on, text.forceClick).textContent.includes(text.forceClickHint), "switched on, how to keep Look Up out");
    on.remove();
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

  test(`how many readings are kept is a choice of five, ten or none (${code})`, async () => {
    const text = labels(code);
    const changes = [];
    const view = settingsView({ settings: normalizeSettings({ languages: [code, "es"] }), apiKey: "" },
      { onChange: (next) => changes.push(next), onKeyChange: () => {} });
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const row = fieldNamed(view, text.kept);
    assert.strictEqual(row.querySelector(".hint"), null, "said by its name alone");
    const names = [...view.querySelectorAll(".field")].map((node) => node.querySelector("label")?.textContent);
    assert.strictEqual(names.indexOf(text.kept), names.indexOf(text.glance) + 1, "with the translations");
    const control = row.querySelector("select");
    assert.deepStrictEqual([...control.options].map((option) => option.textContent),
      [text.keptLast(5), text.keptLast(10), text.optionOff]);
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
    assert.strictEqual(names.indexOf(text.sentenceHotkey), names.indexOf(text.forceClick) + 1);
    assert.strictEqual(names.indexOf(text.withSentence), names.indexOf(text.directSelection) + 1);
    assert.strictEqual(names.indexOf(text.wordHotkey), names.indexOf(text.withSentence) + 1);
    const row = fieldNamed(view, text.withSentence);
    assert.ok(shown(row) && row.textContent.includes(text.withSentenceLead));
    assert.match(text.withSentenceLead, /30/, "the most that goes along, in words");
    const control = row.querySelector("select");
    assert.strictEqual(control.value, "on");
    control.value = "off";
    control.dispatchEvent(new window.Event("change"));
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
    const control = row.querySelector("select");
    assert.strictEqual(control.value, "off");
    control.value = "on";
    control.dispatchEvent(new window.Event("change"));
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
    input.dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyE", key: "e", ctrlKey: true, altKey: true }));
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
    inputs[2].dispatchEvent(new window.KeyboardEvent("keydown", { code: "KeyE", key: "e", ctrlKey: true, altKey: true }));
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
  const on = field.querySelector("select");
  assert.strictEqual(on.value, "on");
  on.value = "off";
  on.dispatchEvent(new window.Event("change"));
  assert.strictEqual(changed.cards.improve, false);
  assert.strictEqual(changed.cards.mode, "foreign", "the other answer is untouched");
  assert.strictEqual(draw({ cards: { improve: false } }).querySelector("select").value, "off");
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

for (const code of ["de", "en", "fr"]) {
  test(`the languages are offered in the alphabetical order of their names (${code})`, () => {
    const settings = normalizeSettings({ languages: [code, code === "en" ? "es" : "en", "it"] });
    const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    const selects = [...view.querySelectorAll("select")].filter((node) => !node.classList.contains("level")).slice(0, 3);
    for (const node of selects) {
      const names = [...node.options].filter((option) => option.value).map((option) => option.textContent);
      assert.ok(names.length > 1);
      assert.deepStrictEqual(names, names.slice().sort((a, b) => a.localeCompare(b, code)));
    }
  });
}

test("the terms come before the verbs, as on the sheet", () => {
  const text = labels("de");
  const view = settingsView({ settings: normalizeSettings({ languages: ["de", "es"] }), apiKey: "" },
    { onChange: () => {}, onKeyChange: () => {} });
  const names = [...view.querySelectorAll(".field > label")].map((node) => node.textContent);
  assert.ok(names.indexOf(text.terms) > -1 && names.indexOf(text.terms) < names.indexOf(text.verbs));
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

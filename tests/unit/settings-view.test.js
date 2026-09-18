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

const { settingsView } = await import("../../src/ui/settings-view.js");
const { normalizeSettings } = await import("../../src/settings.js");
const { labels } = await import("../../src/ui/labels.js");

for (const code of ["de", "en"]) {
  test(`the Accessibility permission is optional and says what it is used for (${code})`, async (t) => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    document.body.append(view);
    t.after(() => view.remove());
    await new Promise((resolve) => setTimeout(resolve, 20));

    const field = [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === text.permission);
    assert.ok(field, "the field is there");
    assert.match(text.permissionWhy, /^Optional/, "said to be optional");
    assert.ok(field.textContent.includes(text.permissionWhy), "what it does");
    assert.ok(!field.textContent.includes(text.permissionHave), "not said to be on");
    assert.ok(field.textContent.includes(text.permissionTrust), "what it is used for");
    const shortcut = [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === text.hotkey);
    assert.strictEqual(shortcut.querySelector(".hint").textContent, text.hotkeyLead, "without it, copying is the way");
    const link = [...field.querySelectorAll("button")].find((node) => node.textContent === text.permissionCode);
    assert.ok(link, "a way to the code that does it");
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
      for (const macOnly of [text.permission, text.devicePairs, text.translator]) {
        assert.ok(!labelsShown.includes(macOnly), `${macOnly} is not offered`);
      }
      /* The symbol in the notification area always stays; the taskbar button
         is the question. */
      const icon = [...view.querySelectorAll(".field")]
        .find((node) => node.querySelector("label")?.textContent === text.appIcon);
      assert.deepStrictEqual([...icon.querySelectorAll("option")].map((option) => option.value), ["menubar", "both"]);
      assert.deepStrictEqual([...icon.querySelectorAll("option")].map((option) => option.textContent),
        [text.appIcons.menubar, text.appIcons.both]);
      assert.ok(labelsShown.includes(text.glance), "the hover stays");
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

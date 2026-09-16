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
  test(`the Accessibility permission is optional and says what it is used for (${code})`, async () => {
    const text = labels(code);
    const settings = normalizeSettings({ languages: [code, "es"] });
    const view = settingsView({ settings, apiKey: "" }, { onChange: () => {}, onKeyChange: () => {} });
    document.body.append(view);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const field = [...view.querySelectorAll(".field")]
      .find((node) => node.querySelector("label")?.textContent === text.permission);
    assert.ok(field, "the field is there");
    assert.ok(text.permission.includes("optional"), "said to be optional");
    assert.ok(field.textContent.includes(text.permissionWhy), "what it does");
    assert.ok(!field.textContent.includes(text.permissionHave), "not said to be on");
    assert.ok(field.textContent.includes(text.permissionTrust), "what it is used for");
    assert.ok(field.textContent.includes(text.permissionOff), "that it can be switched off");
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

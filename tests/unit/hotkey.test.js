import test from "node:test";
import assert from "node:assert";
import {
  hotkeyFrom,
  hotkeyLabel,
  menuAccelerator,
  isHotkey,
  isShortcutKey,
  keyLabel,
  shortcutTaken,
} from "../../src/hotkey.js";

/* What the platform answers when asked what is written on each key. A German
   keyboard, shortened to the keys these tests press. */
const GERMAN = { BracketLeft: "Ü", KeyL: "L", KeyY: "Z", KeyZ: "Y", Digit4: "4" };

/* The recorder only ever reads plain properties off the event, so a plain
   object is a key press as far as it is concerned. */
const press = (over) => ({
  code: "KeyL",
  key: "l",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...over,
});

test("a combination is recorded with the key in its place, not the character on it", () => {
  /* The German Ü sits where an American keyboard has the opening bracket.
     Recording the place is what keeps the shortcut working on both; what is
     shown comes from the layout, which is the only thing that knows. */
  const press_ = press({ code: "BracketLeft", key: "‘", ctrlKey: true, altKey: true });
  const recorded = hotkeyFrom(press_, GERMAN);
  assert.strictEqual(recorded.accelerator, "Control+Alt+BracketLeft");
  assert.strictEqual(recorded.label, "⌃⌥Ü", "shown is what is written on the key");

  /* Without a layout there is nothing to ask — a browser, where the display
     is only being looked at. The place is named instead of guessed at. */
  assert.strictEqual(hotkeyFrom(press_).label, "⌃⌥BracketLeft");
});

test("what the browser says was typed is never used for the label", () => {
  /* This is the whole reason the layout is asked for. Option composes
     characters on macOS, so with it held `key` is not the key at all: ⌥L
     reports @ on a German keyboard, and the settings said the shortcut was
     ⌃⌥@. The property is not read any more, and this test is here so it does
     not come back. */
  const recorded = hotkeyFrom(press({ code: "KeyL", key: "@", ctrlKey: true, altKey: true }), GERMAN);
  assert.strictEqual(recorded.label, "⌃⌥L");
});

test("the two swapped letters come out the way they are printed", () => {
  /* Y and Z sit the other way round on a German keyboard, and the code names
     the American position. Deriving the letter from the code would show the
     other one. */
  assert.strictEqual(keyLabel("KeyY", GERMAN), "Z");
  assert.strictEqual(keyLabel("KeyZ", GERMAN), "Y");
});

test("a combination somebody else holds is recognised as taken", () => {
  /* Two kinds, and they mean different things to the reader: one they can go
     and change, one they cannot. */
  assert.strictEqual(shortcutTaken({ accelerator: "CommandOrControl+Space" },
    ["CommandOrControl+Space"]), "system");
  assert.strictEqual(shortcutTaken({ accelerator: "CommandOrControl+KeyC" }, []), "everywhere",
    "taking copy globally would break copying in every program");
  assert.strictEqual(shortcutTaken({ accelerator: "Control+Alt+KeyE" }, []), "",
    "the preset one is free, or it would be refused on a first start");
  assert.strictEqual(shortcutTaken(null, []), "");
});

test("the command key is written as the one this platform uses for shortcuts", () => {
  /* A Windows version is intended, and someone pressing ⌘ means "the
     shortcut modifier", not "the key next to the space bar". */
  const recorded = hotkeyFrom(press({ metaKey: true, shiftKey: true }));
  assert.strictEqual(recorded.accelerator, "CommandOrControl+Shift+KeyL");
  assert.strictEqual(recorded.label, "⇧⌘L");
});

test("holding a modifier down is not yet a combination", () => {
  assert.strictEqual(hotkeyFrom(press({ code: "ControlLeft", key: "Control", ctrlKey: true })), null);
  assert.strictEqual(hotkeyFrom(press({ code: "MetaRight", key: "Meta", metaKey: true })), null);
});

test("shift alone is typing, not a shortcut", () => {
  /* ⇧A is A. Accepting it would make every capital letter a hotkey. */
  assert.strictEqual(hotkeyFrom(press({ shiftKey: true })), null);
  assert.strictEqual(hotkeyFrom(press({})), null);
});

test("only keys that can really carry a shortcut are recorded", () => {
  assert.ok(isShortcutKey("KeyA") && isShortcutKey("F5") && isShortcutKey("Space"));
  assert.ok(!isShortcutKey("AudioVolumeUp"), "a media key would record and never register");
  assert.strictEqual(hotkeyFrom(press({ code: "AudioVolumeUp", key: "AudioVolumeUp", ctrlKey: true })), null);
});

test("a key with no character of its own is named", () => {
  const recorded = hotkeyFrom(press({ code: "Space", key: " ", ctrlKey: true, altKey: true }));
  assert.strictEqual(recorded.label, "⌃⌥Space", "a blank would look like nothing was pressed");
  /* A named key keeps its symbol whatever the layout says about it. */
  assert.strictEqual(keyLabel("ArrowUp", GERMAN), "↑");
});

test("what a settings file may hand back", () => {
  assert.ok(isHotkey({ accelerator: "Control+Alt+KeyL", label: "⌃⌥L" }));
  assert.ok(!isHotkey("Control+Alt+KeyL"), "the string an older version wrote is not one");
  assert.ok(!isHotkey({ accelerator: "KeyL" }), "a bare key would take L away from typing");
  assert.ok(!isHotkey({ accelerator: "Shift+KeyL" }), "shift alone is still typing");
  assert.ok(!isHotkey({ accelerator: "Hyper+KeyL" }), "a modifier nothing can register");
});

test("a combination written by hand can still be shown", () => {
  assert.strictEqual(hotkeyLabel({ accelerator: "CommandOrControl+Shift+Digit4" }), "⇧⌘4");
  assert.strictEqual(hotkeyLabel(null), "");
});

test("the layout wins over the label that was stored with the combination", () => {
  /* They can disagree — set on one keyboard, read on another — and the key
     under the reader's finger today is the one worth naming. */
  const stored = { accelerator: "Control+Alt+BracketLeft", label: "⌃⌥[" };
  assert.strictEqual(hotkeyLabel(stored, GERMAN), "⌃⌥Ü");
  assert.strictEqual(hotkeyLabel(stored), "⌃⌥[", "without a layout the stored label is all there is");
});

test("a menu is handed the character on the key, not the key's American name", () => {
  assert.equal(menuAccelerator({ accelerator: "Control+Alt+KeyE", label: "⌃⌥E" }, null), "Control+Alt+e");
  assert.equal(menuAccelerator({ accelerator: "CommandOrControl+BracketLeft", label: "⌘Ü" }, { BracketLeft: "ü" }), "CommandOrControl+ü");
  assert.equal(menuAccelerator({ accelerator: "Control+Alt+KeyZ", label: "⌃⌥Y" }, { KeyZ: "y" }), "Control+Alt+y");
  assert.equal(menuAccelerator({ accelerator: "Control+Alt+Space", label: "⌃⌥Space" }, null), "Control+Alt+Space");
  assert.equal(menuAccelerator({ accelerator: "Control+F5", label: "⌃F5" }, null), "Control+F5");
  assert.equal(menuAccelerator(null, null), "");
});

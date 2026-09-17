/* Recording a key combination.

   Two things are kept, and they are not the same thing. What gets registered
   later is the *physical* key: `KeyU` is the third key of the top row
   wherever the keyboard was made, so a shortcut set on a German layout still
   works when the layout changes. A recorded character would not —
   `⌘Ü` cannot be pressed on a US keyboard at all.

   What gets shown is what the reader actually pressed. On a German keyboard
   that key is Ü, and telling them their shortcut is `⌃⌥[` because that is
   where the key sits on an American one would be true and useless.

   Nothing here registers anything — that is platform/shortcut.js, which
   hands the accelerator to the shell. This file only decides what a
   combination is and what it looks like.

   What is written on a key cannot be worked out here. `event.key` is the
   character the press *produced*, and with Option held that is a different
   character: ⌃⌥L on a German keyboard reports `@`. So the label comes from
   the platform, which asks the layout what the key types with nothing held —
   see `src-tauri/src/keyboard.rs`. Every function that shows a key takes
   that table and manages without it. */

import { currentSystem } from "./system.js";

/* What the app suggests when nobody has chosen. ⌃⌥ leaves every ⌘
   combination to the programs the reader is actually working in, which is
   where their own shortcuts live, and E stands for what the app does in both
   interface languages — erklären, explain. All three keys are reachable with
   the left hand alone.

   It was ⌃⌥D first, for the D of macOS' own look-up on ⌃⌘D. That key turned
   out to be swallowed before any window saw it on the one machine it was
   tried on. Which combination a given system
   leaves alone cannot be known from in here, so this is a better guess and
   not a safe one.

   It is a real default rather than a suggestion in a field: the shortcut is
   the whole point of the app, and one that has to be invented first is one
   most people never set. Clearing it stores nothing and is remembered as
   nothing — see normalizeSettings.

   One combination it is worth knowing about: with VoiceOver running, ⌃⌥ is
   its own modifier. That is a reason for the field, not against the
   default. */
export const DEFAULT_HOTKEY = { accelerator: "Control+Alt+KeyE", label: "⌃⌥E" };

/* On Windows Ctrl+Alt cannot be the preset: on a German, French, Spanish or
   Polish keyboard Ctrl+Alt *is* AltGr, and AltGr+E types €. Win+Shift leaves
   AltGr alone and every program's own Ctrl combinations too, and Windows
   gives no meaning of its own to Win+Shift+E. The E stays. */
export const WINDOWS_HOTKEY = { accelerator: "Super+Shift+KeyE", label: "Win+Shift+E" };

export function defaultHotkey(system = currentSystem()) {
  return system === "windows" ? WINDOWS_HOTKEY : DEFAULT_HOTKEY;
}

/* Pressing only Shift is typing, not a shortcut: ⇧A is A. One of the other
   three has to be down, or every capital letter in the window would be one. */
const HOLDING = ["metaKey", "ctrlKey", "altKey"];

/* macOS reads them in this order, and so does every menu in the system. */
const SYMBOLS = { control: "⌃", alt: "⌥", shift: "⇧", command: "⌘" };

/* Windows spells them out, joined by a plus, the Windows key first. */
const WINDOWS_NAMES = [
  ["Super", "Win"],
  ["Control", "Ctrl"],
  ["Alt", "Alt"],
  ["Shift", "Shift"],
];

/* What a stored combination is called on Windows. */
function windowsLabel(parts, key, layout) {
  const names = WINDOWS_NAMES.filter(([part]) => parts.includes(part)).map(([, name]) => name);
  return names.concat(windowsKeyLabel(key, layout)).join("+");
}

/* Arrows and the like have names on Windows, not the Mac's symbols. */
function windowsKeyLabel(code, layout) {
  if (/^Arrow/.test(code)) return code.slice(5);
  if (code === "Escape") return "Esc";
  if (code === "Delete") return "Del";
  if (NAMED[code]) return code.replace(/^Numpad/, "");
  return keyLabel(code, layout);
}

/* Keys with no character of their own. Anything not in here that has a
   single-character `key` shows that character instead. */
const NAMED = {
  Space: "Space",
  Enter: "↩",
  NumpadEnter: "↩",
  Escape: "⎋",
  Tab: "⇥",
  Backspace: "⌫",
  Delete: "⌦",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Home: "↖",
  End: "↘",
  PageUp: "⇞",
  PageDown: "⇟",
};

const isModifierKey = (code) => /^(Control|Shift|Alt|Meta)(Left|Right)$/.test(String(code || ""));

/* Which physical keys may carry a shortcut. Deliberately a list rather than
   "anything that is not a modifier": a dead key or a media key would record
   fine and then never register. */
export function isShortcutKey(code) {
  return /^(Key[A-Z]|Digit[0-9]|F[1-9][0-9]?|Numpad[0-9]|Space|Enter|Tab|Escape|Backspace|Delete|Arrow(Up|Down|Left|Right)|Home|End|Page(Up|Down)|Minus|Equal|Bracket(Left|Right)|Backslash|Semicolon|Quote|Comma|Period|Slash|Backquote)$/.test(
    String(code || ""),
  );
}

/* The name the shell will be handed. On a Mac ⌘ is `CommandOrControl`; on
   Windows the key that sets `metaKey` is the Windows key, which is `Super`,
   and Ctrl is Ctrl. */
function acceleratorOf(event, system) {
  const parts = [];
  if (event.metaKey) parts.push(system === "windows" ? "Super" : "CommandOrControl");
  if (event.ctrlKey) parts.push("Control");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(event.code);
  return parts.join("+");
}

function labelOf(event, layout, system) {
  if (system === "windows") {
    const parts = [];
    if (event.metaKey) parts.push("Super");
    if (event.ctrlKey) parts.push("Control");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    return windowsLabel(parts, event.code, layout);
  }
  let out = "";
  if (event.ctrlKey) out += SYMBOLS.control;
  if (event.altKey) out += SYMBOLS.alt;
  if (event.shiftKey) out += SYMBOLS.shift;
  if (event.metaKey) out += SYMBOLS.command;
  return out + keyLabel(event.code, layout);
}

/* The character the reader sees on the key.

   The layout table decides wherever it has an answer — it is the only source
   that is right on a keyboard that is not American. Without it the code's own
   name is used, which is correct for letters and digits on a US keyboard and
   an honest approximation everywhere else; it is only reached in a browser,
   where there is no platform to ask. */
export function keyLabel(code, layout) {
  if (NAMED[code]) return NAMED[code];
  const written = layout && layout[code];
  if (written) return String(written);
  const plain = String(code || "");
  if (/^Key[A-Z]$/.test(plain)) return plain.slice(3);
  if (/^Digit[0-9]$/.test(plain)) return plain.slice(5);
  if (/^Numpad[0-9]$/.test(plain)) return plain.slice(6);
  return plain;
}

/* What a key press amounts to: a combination, or nothing. Returning null for
   "not yet" is the normal case — the reader is still holding modifiers down
   while they decide. */
export function hotkeyFrom(event, layout, system = currentSystem()) {
  if (!event || isModifierKey(event.code)) return null;
  if (!HOLDING.some((flag) => event[flag])) return null;
  if (!isShortcutKey(event.code)) return null;
  return { accelerator: acceleratorOf(event, system), label: labelOf(event, layout, system) };
}

/* Whether something read back from the settings file is a combination at
   all. A hand-edited or older file must not hand the next phase something it
   cannot register. */
export function isHotkey(value) {
  if (!value || typeof value !== "object") return false;
  const parts = String(value.accelerator || "").split("+");
  const key = parts.pop();
  if (!isShortcutKey(key)) return false;
  if (!parts.length) return false;
  const allowed = ["CommandOrControl", "Control", "Alt", "Shift", "Super"];
  if (parts.some((part) => !allowed.includes(part))) return false;
  return parts.some((part) => part !== "Shift");
}

/* What to show for a stored combination.

   The current layout wins over the label that was stored with it. They can
   disagree — a combination set on one keyboard and read on another — and the
   key under the reader's finger today is the one worth naming. The stored
   label is what is left when there is no layout to ask, which is a browser
   and a settings file written by hand. */
export function hotkeyLabel(value, layout, system = currentSystem()) {
  if (!isHotkey(value)) return "";
  const parts = String(value.accelerator).split("+");
  const key = parts.pop();
  if (!layout && value.label) return String(value.label);
  if (system === "windows") {
    return windowsLabel(parts.map((part) => (part === "CommandOrControl" ? "Control" : part)), key, layout);
  }
  let out = "";
  if (parts.includes("Control")) out += SYMBOLS.control;
  if (parts.includes("Alt")) out += SYMBOLS.alt;
  if (parts.includes("Shift")) out += SYMBOLS.shift;
  if (parts.includes("CommandOrControl")) out += SYMBOLS.command;
  return out + keyLabel(key, layout);
}

/* The combination as a menu writes it beside an entry. A menu shows the
   character it is given, so the key goes in as what is written on it in the
   reader's layout — `Control+Alt+ü`, not the code of the key under an
   American Ü. Keys with no character keep their code. */
export function menuAccelerator(value, layout, system = currentSystem()) {
  if (!isHotkey(value)) return "";
  const parts = String(value.accelerator).split("+");
  const key = parts.pop();
  const written = NAMED[key] ? "" : keyLabel(key, layout);
  const character = [...written].length === 1 ? written.toLowerCase() : key;
  /* muda on Windows reads the key by its code and draws the label itself. */
  if (system === "windows") return parts.concat(key).join("+");
  return parts.concat(character).join("+");
}

/* The combinations no shortcut may take, whoever holds them.

   These are not the system's — those are read from the system itself, which
   knows them and knows what the reader changed. These are the ones every
   program has and nobody registers anywhere: taking ⌘C globally means the
   reader can no longer copy in any program at all, and the damage is done
   somewhere else entirely, which makes it very hard to connect back to a
   setting in this window.

   Deliberately short. A long list of "we know better" turns into a fight with
   someone who has a good reason. */
const RESERVED_MAC = [
  "KeyA", "KeyC", "KeyF", "KeyN", "KeyO", "KeyP", "KeyQ",
  "KeyS", "KeyT", "KeyV", "KeyW", "KeyX", "KeyZ",
].map((key) => `CommandOrControl+${key}`).concat([
  "CommandOrControl+Shift+KeyZ",
  "CommandOrControl+Tab",
]);

/* The same keys under Ctrl, and the few combinations Windows keeps for
   itself whatever a program registers. */
const RESERVED_WINDOWS = RESERVED_MAC.map((accelerator) => accelerator.replace("CommandOrControl", "Control"))
  .concat(RESERVED_MAC)
  .concat(["Alt+Tab", "Alt+F4", "Alt+Escape", "Control+Escape", "Control+Shift+Escape", "Control+Alt+Delete"]);

/* Whether a combination is already spoken for, and by whom. Two sources, and
   they mean different things to the reader: "the system" is something they
   can go and change, "every program" is not.

   Answers "" for a combination that is free. */
export function shortcutTaken(hotkey, taken, system = currentSystem()) {
  const accelerator = hotkey && hotkey.accelerator;
  if (!accelerator) return "";
  const reserved = system === "windows" ? RESERVED_WINDOWS : RESERVED_MAC;
  if (reserved.includes(accelerator)) return "everywhere";
  if (Array.isArray(taken) && taken.includes(accelerator)) return "system";
  return "";
}

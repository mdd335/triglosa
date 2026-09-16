/* Text that comes from another program, and text that goes back into one.

   Everything here needs the shell and the Accessibility permission behind it,
   so outside the app — in a plain browser, which is how the display gets
   checked — every call answers the same way it would with the permission
   refused. The window then shows exactly what a first-time reader sees,
   which is the state worth being able to look at.

   The shell answers with one word rather than a sentence: "accessibility",
   "empty", "focus". The wording belongs in labels.js, in the reader's own
   language, and not in the layer that only knows what happened. */

import { insideApp } from "./env.js";

async function shell(command, args) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, args);
}

/* Whether the app may read and write in other programs at all. Asked before
   every explanation the window shows about it, because the reader may have
   granted it in System Settings while the window sat there. */
export async function accessibilityGranted() {
  if (!insideApp()) return false;
  return shell("accessibility_granted");
}

/* The system's own consent dialog. It is asked for on a button press, after
   the window has said what it is for: an unexplained permission dialog costs
   half the users. Answers whether the permission is there now, which is
   normally false — macOS puts the app into the list and leaves the switch to
   the reader. */
export async function requestAccessibility() {
  if (!insideApp()) return false;
  return shell("request_accessibility");
}

export async function openAccessibilitySettings() {
  if (!insideApp()) return false;
  await shell("open_accessibility_settings");
  return true;
}

/* What is selected in whatever program is in front. Comes back as
   { text, source, route } — source is the program to write back into, and it
   may be 0, which means the text is here but the way back is not. */
export async function readSelection() {
  if (!insideApp()) throw new Error("accessibility");
  return shell("read_selection");
}

/* Into the program in front once the window is gone, and where none comes
   forward, into `source` — the program the text was read out of, or 0. The
   window has to hide itself first: while it is in front, it is the program a
   keystroke would reach. */
export async function insertText(source, text) {
  if (!insideApp()) throw new Error("accessibility");
  return shell("insert_text", { source, text });
}

/* What is written on each key in the layout being used right now, and which
   combinations the system already holds. Both come from the platform because
   neither can be seen from inside a page — see hotkey.js and
   src-tauri/src/keyboard.rs. Outside the app both are simply absent, and
   every caller manages without them. */
export async function keyLabels() {
  if (!insideApp()) return null;
  return shell("key_labels");
}

export async function takenShortcuts() {
  if (!insideApp()) return [];
  return shell("taken_shortcuts");
}

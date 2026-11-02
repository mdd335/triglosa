/* Text read off a piece of the screen (screen.rs in the shell): the frame
   the reader drew arrives as an event, and the text in it is asked for here
   — on the Mac from Apple's recognition in the helper, on Windows from the
   shell's own (ocr.rs). Either way the answer is lines with their boxes,
   which screen-text.js puts in order. */

import { insideApp, shell } from "./env.js";
import { readRecognized } from "./translation.js";
import { onWindows } from "../system.js";

/* The recognisers the shell has on Windows, by the script a language is
   written in as the platform knows it — no list of languages. */
const RECOGNISERS = { Latn: "latin", Cyrl: "cyrillic", Arab: "arabic", Hans: "chinese", Hant: "chinese", Jpan: "chinese", Hani: "chinese" };

export function scriptsFor(languages) {
  const scripts = new Set();
  for (const code of languages || []) {
    try {
      const script = new Intl.Locale(code).maximize().script;
      if (RECOGNISERS[script]) scripts.add(RECOGNISERS[script]);
    } catch {
      /* A code the platform does not know brings no script. */
    }
  }
  if (!scripts.size) scripts.add("latin");
  return [...scripts];
}

/* Whether the screen may be photographed: the Mac's Screen Recording
   permission; Windows asks none. */
export async function screenPermitted() {
  if (!insideApp()) return true;
  return shell("screen_permitted").catch(() => false);
}

/* The system's own question about it, asked once by macOS. */
export async function requestScreenPermission() {
  if (!insideApp()) return false;
  return shell("request_screen_permission").catch(() => false);
}

export async function openScreenSettings() {
  if (!insideApp()) return;
  await shell("open_screen_settings").catch(() => {});
}

/* The text in the frame just drawn: { lines, by } with by "device" (Apple)
   or "triglosa", or { failed } — "absent" where the recognition is missing
   from this installation, "helper" where Apple's did not answer. */
export async function readScreen({ translation, languages }) {
  if (onWindows()) {
    try {
      const lines = await shell("screen_text", { scripts: scriptsFor(languages) });
      return { lines: lines.map((line) => ({ t: line.text, b: line.b, c: line.c || [] })), by: "triglosa" };
    } catch (error) {
      return { failed: String(error) === "absent" ? "absent" : "helper" };
    }
  }
  const framed = await shell("screen_file").catch(() => null);
  if (!framed) return { failed: "helper" };
  const lines = await translation.recognize(framed.path, framed.rect, languages);
  return lines ? { lines, by: "device" } : { failed: "helper" };
}

/* An image file taken as the framed piece: selected in the Finder or
   Explorer and brought by the shortcut, or dropped on the window. False
   where it is no picture the shell can read. */
export async function frameImage(path) {
  if (!insideApp()) return false;
  return shell("screen_image", { path }).then(() => true, () => false);
}

/* Files dragged over the window and dropped on it: `onOver(true)` while
   one holding an image is over it, `onOver(false)` once it left or was
   dropped, and `onDrop` with the first image among them. */
export async function onImageDropped({ onDrop, onOver = () => {} }) {
  if (!insideApp()) return () => {};
  const { getCurrentWebview } = await import("@tauri-apps/api/webview");
  return getCurrentWebview().onDragDropEvent((event) => {
    const { type, paths } = event.payload;
    const image = (paths || []).find((path) => IMAGE.test(path));
    if (type === "enter") onOver(Boolean(image));
    else if (type === "leave") onOver(false);
    else if (type === "drop") {
      onOver(false);
      if (image) onDrop(image);
    }
  });
}

/* A picture's text on the phone, by Apple's recognition inside the app
   (Recognition.swift): a photograph taken with the camera ("camera"), one
   chosen in the photo library ("library"), or what was copied
   ("pasteboard"). The lines and their boxes, as readScreen answers them;
   `{ none: true }` where there was no picture — the reader cancelled — or
   why there are none. */
export async function readPicture(source, languages = [], onChosen = () => {}) {
  try {
    let from = source;
    /* The system's own sheet comes first: the reading begins once a picture
       came of it, and `onChosen` says so. */
    if (source !== "pasteboard") {
      const picked = await shell("apple_translation", { route: `/pick?from=${source}`, body: "" });
      if (picked?.status === 404) return { none: true };
      from = "picked";
    }
    onChosen();
    const route = `/recognize?from=${from}&langs=${languages.join(",")}`;
    const answer = await shell("apple_translation", { route, body: "" });
    if (answer?.status === 404) return { none: true };
    if (answer?.status !== 200) return { failed: "helper" };
    return { lines: readRecognized(answer.text), by: "device" };
  } catch {
    return { failed: "helper" };
  }
}

/* The kinds of picture the shell reads (screen.rs, is_image). */
const IMAGE = /\.(png|jpe?g|gif|bmp|tiff?|webp|heic|heif)$/i;

/* Where a program under the pointer handed over no text, the shell has
   photographed the screen around it: the word or the sentence shortcut
   (`sentence`) and where the pointer stands in the piece (`at`) — or, where
   it could not, why (`onFailed`: "permission" where the Mac may not record
   the screen, "screen" where the photograph was not taken). */
export async function onPointerScreen({ onRead, onFailed }) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const stops = [
    await listen("pointer-screen", (event) => onRead(event.payload)),
    await listen("pointer-failed", (event) => onFailed(String(event.payload || ""))),
  ];
  return () => stops.forEach((stop) => stop());
}

/* The screen read around the pointer after all: a program handed over a
   sentence of one word. */
export async function readUnderPointer(sentence) {
  if (!insideApp()) return;
  await shell("screen_under_pointer", { sentence }).catch(() => {});
}

/* Boxes in the piece read around the pointer, lit up where they stand. */
export async function lightScreen(boxes) {
  if (!insideApp() || !boxes?.length) return;
  await shell("light_screen", { boxes }).catch(() => {});
}

/* Text read off the screen put on the clipboard, for "copy text from a
   screenshot" — through the shell, since the window may be hidden. */
export async function copyRecognized(text) {
  if (!insideApp()) return;
  await shell("copy_text", { text });
}

/* What the shell says about a frame: drawn — with what it is for ("read",
   "copy", "card") and whether the reading window stood before — or no
   photograph to draw it on ("permission", "capture"), with what it was for. */
export async function onScreen(handlers) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const stops = [
    await listen("screen-chosen", (event) => handlers.onChosen(event.payload || { purpose: "read", shown: false })),
    await listen("screen-failed", (event) => {
      const said = event.payload;
      handlers.onFailed(typeof said === "string"
        ? { reason: said, purpose: "read" }
        : { reason: String(said?.reason || ""), purpose: said?.purpose || "read" });
    }),
  ];
  return () => stops.forEach((stop) => stop());
}

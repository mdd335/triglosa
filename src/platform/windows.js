/* The app's own windows and its place in the menu bar.

   Kept apart from capture.js on purpose: that one is about text in *other*
   programs, this one about the two windows this program has and the symbol
   that outlives them both. They ended up in one file while there was only one
   window, and the settings growing a window of their own is what separated
   them.

   Outside the app — in a plain browser, which is how the display gets checked
   — there is no shell to ask, so every call answers false and the caller
   manages. The settings page can be photographed on its own address instead;
   see scripts/shot.mjs. */

import { insideApp } from "./env.js";

async function shell(command, args) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, args);
}

export async function hideWindow() {
  if (!insideApp()) return false;
  await shell("hide_main_window");
  return true;
}

export async function showWindow({ veiled = false } = {}) {
  if (!insideApp()) return false;
  await shell("show_main_window", { veiled });
  return true;
}

/* A window shown veiled made visible — see appear() in app.js. */
export async function unveilWindow() {
  if (!insideApp()) return;
  await shell("unveil_main_window");
}

/* The settings, in a window of their own. It is opened rather than toggled:
   a second call brings the one that is already there to the front, so the
   gear and the menu bar entry cannot produce two of them.

   The title travels with the request for the same reason the menu bar entries
   do — the shell knows nothing about which language the reader set. */
export async function openSettings(title) {
  if (!insideApp()) return false;
  await shell("open_settings_window", { title });
  return true;
}

/* The way out of the settings window with the keyboard. There is no menu bar
   to hold ⌘W — an app without a dock icon gets none — so the window listens
   for the two keys itself and asks the shell to close it. */
export async function closeSettings() {
  if (!insideApp()) return false;
  await shell("close_settings_window");
  return true;
}

/* A flashcard, in a window of its own.

   A layer inside the reading window was the first answer and it was wrong for
   one reason: a card cannot be edited while looking something up in the
   reading, because a layer takes the whole window. Two windows switch, and
   the reading window stays standing — it asks every window this app has
   before it puts itself away.

   The card travels through the shell rather than through an event: there is no
   moment at which both ends are ready, so the page asks for it once it has
   loaded. */
export async function openCard(title, card) {
  if (!insideApp()) return false;
  await shell("open_card_window", { title, card: JSON.stringify(card) });
  return true;
}

/* What the card window asks for when it has loaded, and again when it is told
   the card changed. */
export async function takeCard() {
  if (!insideApp()) return null;
  const raw = await shell("take_card");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function closeCard() {
  if (!insideApp()) return false;
  await shell("close_card_window");
  return true;
}

/* The card window laid against what is in it.

   It holds a short form, and a fixed height left a hand's width of nothing
   under the buttons — most of it kept clear for a line that is only there
   when something went wrong. So the page measures itself and says how tall
   it needs to be.

   `grow` is the difference between a new card and a card that changed under
   the reader. A new one is fitted either way, up or down. A card already on
   screen only ever makes the window taller — a field being typed into, or a
   refusal arriving — because taking height away from somebody who has just
   dragged the corner is answering a question they did not ask.

   Answers the height it settled on, or 0 outside the app, where there is no
   window to measure against. */
export async function fitCardWindow(height, grow = false) {
  if (!insideApp()) return 0;
  const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
  const self = getCurrentWindow();
  const scale = await self.scaleFactor();
  const inner = (await self.innerSize()).toLogical(scale);
  /* Measured against the page's own viewport and set as a difference, not as
     the number. What the window calls its inner size includes the title bar
     here, so a window set to exactly the page's height came out one title bar
     short and cut off the buttons — and how tall that bar is is the system's
     business, so it is read off rather than written in. */
  const page = window.innerHeight;
  const wanted = fitTo(height, page, grow);
  if (wanted === null) return page;
  await self.setSize(new LogicalSize(inner.width, inner.height + (wanted - page)));
  return wanted;
}

/* The reading window to the height its page wants — `page` is measured by
   the page, in points — with its top edge standing still. `grow` lets a
   reading still arriving only make it taller. The rest is the shell's
   (fit_reading_window).

   What the frame adds to the page is read once, while nothing is moving:
   measured during the window's own animation, the frame and the page are at
   two different moments of it. */
let frameChrome = null;

async function measureReadingFrame() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const self = getCurrentWindow();
  const scale = await self.scaleFactor();
  const outer = (await self.outerSize()).toLogical(scale);
  frameChrome = Math.max(0, outer.height - window.innerHeight);
}

export async function fitReadingWindow(page, grow = false) {
  if (!insideApp()) return;
  if (frameChrome === null) await measureReadingFrame();
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("fit_reading_window", { height: page + frameChrome, grow });
}

/* Whether to resize at all, and to what — or null for leaving it alone.

   Kept apart from the resizing because it is the only part with a rule in it.
   A pixel or two either way is the measurement's own noise, and acting on
   that would make the window twitch on every keystroke in a field that grows
   with what is typed. */
export function fitTo(height, current, grow) {
  const enough = Math.abs(height - current) > 2;
  if (grow) return height > current + 2 ? height : null;
  return enough ? height : null;
}

/* A second row's button fills a window that is already open, and the page is
   long past asking by then. */
export async function onCardChanged(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen("card-changed", () => handler());
}

/* The window appearing again. It hides rather than closing, so this is the
   moment a session comes back to life — and the translation helper may have
   idled out in between and taken its open language pairs with it. */
/* The shell asking the page to bring the window forward — from the menu bar
   symbol or the Dock — so that it can be fitted before it is seen. */
export async function onAppearAsked(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen("appear", (event) => handler(event.payload === true));
}

/* A blank sheet asked for from the menu bar while the window stands open. */
export async function onFreshAsked(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen("fresh", () => handler());
}

export async function onWindowShown(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen("shown", () => handler());
}

/* The menu bar symbol, named in the interface language. Built here rather
   than in the shell for that one reason. The settings entry is named here
   too and the shell keeps it, because the menu can be opened long after this
   window last said anything. */
/* Whether the reading window goes away on a focus change, and where the app
   shows an icon — told to the shell, which acts on both. */
export async function applyPresence({ closeOnBlur, appIcon }) {
  if (!insideApp()) return;
  await shell("apply_presence", { closeOnBlur, icon: appIcon });
}

/* `shortcuts` names the combination beside each of the three entries a
   shortcut sets off — capture, fresh, card — and leaves out what is unset. */
export async function applyTray(words, shortcuts = {}) {
  if (!insideApp()) return false;
  await shell("apply_tray", {
    words,
    shortcuts: {
      capture: shortcuts.capture || null,
      fresh: shortcuts.fresh || null,
      card: shortcuts.card || null,
    },
  });
  return true;
}

/* Two windows now hold the same settings, so a change in one has to reach the
   other. The settings window says it saved; the shell says the window closed,
   which matters on its own — the recorder lets go of the shortcut while its
   field has focus, and closing the window that way would otherwise leave the
   app holding nothing. */
export async function settingsChanged() {
  if (!insideApp()) return false;
  const { emit } = await import("@tauri-apps/api/event");
  await emit("settings-changed");
  return true;
}

export async function onSettingsChanged(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const stops = [
    await listen("settings-changed", () => handler()),
    await listen("settings-closed", () => handler()),
  ];
  return () => stops.forEach((stop) => stop());
}

/* The settings window asked to show its last group — the menu bar's entry for
   updates, where the window was already open. */
export async function onAboutAsked(handler) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen("settings-about", () => handler());
}

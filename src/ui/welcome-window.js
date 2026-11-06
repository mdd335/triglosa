/* The first steps, in a window of their own.

   Nothing on the screen says that the app runs once it is started — on
   Windows its symbol stands behind the notification area's arrow — so this
   window opens at every start until the reader says not to. It reads the
   settings for itself, as every window does, and writes one of them. */

import { loadSettings, saveSettings } from "../platform/store.js";
import { accessibilityGranted, keyLabels } from "../platform/capture.js";
import { openUrl } from "../platform/env.js";
import { closeWelcome, fitCardWindow, onSettingsChanged, openSettings, settingsChanged } from "../platform/windows.js";
import { hotkeyLabel } from "../hotkey.js";
import { onWindows } from "../system.js";
import { HELP_URL, PRIVACY_URL } from "../updates.js";
import { labels, windowTitle } from "./labels.js";
import { welcomeView } from "./welcome-view.js";
import { exampleView } from "./example-view.js";
import { closeOnKeys, quietContextMenu } from "./elements.js";
/* The icon without the shadow the Mac's own carries under it. */
import icon from "../../src-tauri/icons/flat.png";

let settings = await loadSettings();
/* The question about counting stands every time the first steps open, with
   no answer marked; `answered` says the answer in its place once given.
   Left unanswered the first time it is a no, written at once. A reader of
   an earlier version who said not to show the first steps sees them once
   more for it, their box for that unticked. */
const first = settings.stats === null;
let answered = false;
let unhidden = first;
if (first) {
  settings = await saveSettings({ ...settings, stats: false });
  settingsChanged();
}
const layout = await keyLabels().catch(() => null);

const root = document.getElementById("app");
root.className = "welcome-window";

/* As tall as what it says, which differs by language and by system. */
const AIR = 40;
const ROOM = () => Math.max(300, (window.screen?.availHeight || 900) - 120);
const fit = () => {
  const sheet = root.querySelector(".welcome-sheet");
  if (sheet) fitCardWindow(Math.min(Math.ceil(sheet.getBoundingClientRect().height) + AIR, ROOM()));
};

/* The example is built once per reader's language and kept through every
   redraw — the window draws again whenever it comes forward, and a word
   picked in it would be gone. */
let example = null;
const exampleFor = (text, reader) => {
  if (example?.reader !== reader) {
    example = { reader, node: exampleView(text.welcome.example, reader, { onResize: () => fit() }) };
  }
  return example.node;
};

async function draw() {
  const reader = settings.languages[0];
  const text = labels(reader);
  document.title = windowTitle(text.welcome.steps);
  const permission = onWindows() ? false : await accessibilityGranted().catch(() => false);
  root.replaceChildren(welcomeView({
    text,
    icon,
    system: onWindows() ? "windows" : "mac",
    key: settings.hotkey ? hotkeyLabel(settings.hotkey, layout) : "",
    permission,
    hidden: !settings.welcome && !unhidden,
    example: exampleFor(text, reader),
    consent: settings.stats,
    asking: true,
    answered,
  }, {
    /* Read again first: another window may have written since. */
    onHide: async (hidden) => {
      unhidden = false;
      settings = await saveSettings({ ...(await loadSettings()), welcome: !hidden });
      settingsChanged();
    },
    onSettings: () => openSettings(windowTitle(text.settings)),
    onClose: closeWelcome,
    onReadme: () => openUrl(HELP_URL),
    onPrivacy: () => openUrl(PRIVACY_URL),
    /* The reading window hears of it and counts the day at once. */
    onConsent: async (yes) => {
      answered = true;
      settings = await saveSettings({ ...(await loadSettings()), stats: yes });
      settingsChanged();
      draw();
    },
  }));
  fit();
  root.querySelector(".welcome-icon")?.addEventListener("load", fit);
}

await draw();

/* The language, the shortcut and the permission are all set in the settings
   window this one sends the reader to. */
await onSettingsChanged(async () => {
  settings = await loadSettings();
  draw();
});
window.addEventListener("focus", draw);

quietContextMenu(document);
/* Nothing here is written in: Escape closes at once, also from the box
   that puts the first steps away. */
closeOnKeys(document, closeWelcome, { fields: null });

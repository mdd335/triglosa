/* Wiring the window.

   Text arrives — out of another program through the shortcut, or typed into
   the original field — the language is recognised, the panels fill. Everything
   the model would add sits below and stays visibly empty until an endpoint is
   configured; that is the one thing this window says about a missing key.

   There is no entry field of its own any more. The original field is the entry
   field: reading and writing are two states of one box, and which of the two
   it is in is the only piece of interface state this file keeps. The settings
   have a window of their own and are not part of this one. */

import { onWindows } from "../system.js";
import { SHORT_MAX_WORDS, runText, sentenceFor } from "../run.js";
import { wordAround, wordCount } from "../text.js";
import { detectLanguage, keepsChosenLanguage } from "../detect.js";
import { freeCard } from "../card.js";
import { addExample, explainMarked, explainMore } from "../ask.js";
import { otherPanels } from "../panels.js";
import { fragmentsAcross } from "../match/links.js";
import { HELPER_URL, createTranslationBackend } from "../platform/translation.js";
import { createLlmBackend } from "../platform/llm.js";
import { appFetch, copyText, ensureTranslationHelper, insideApp, languageIdentifier, modelFetch, noteFault, openUrl, searchUrl, wordAligner } from "../platform/env.js";
import { faultLine } from "../diagnostics.js";
import { accessibilityGranted, insertText, keyLabels, useDirectSelection } from "../platform/capture.js";
import { hotkeyLabel, menuAccelerator } from "../hotkey.js";
import { applyPresence, applyTray, fitReadingWindow, hideWindow, onAppearAsked, onFreshAsked, unveilWindow, onSettingsChanged, onWindowShown, openCard, openSettings, updateCard, showWindow } from "../platform/windows.js";
import { lightUp, listenForForceClick, onCapture, onCardCapture, registerShortcuts } from "../platform/shortcut.js";
import { selectionSpan, sentenceAfter, sentenceUnder } from "../sentence.js";
import { searchLink } from "../platform/search.js";
import { createSpeech } from "../platform/speech.js";
import { loadSettings, saveSettings } from "../platform/store.js";
import { loadApiKey } from "../platform/keychain.js";
import { faultOf } from "../faults.js";
import { faultText, labels, windowTitle } from "./labels.js";
import { MARKED, renderHeading, renderReading } from "./reading-view.js";
import { labelsInside } from "./elements.js";
import { watchGlance } from "./glance-view.js";
import { roomForExample, withExamples, withExplanationExamples } from "../examples.js";
import { cardLanguages, levelFor, neededPairs, offersCard, usesPermission } from "../settings.js";
import { dropOldest, keptReading, readingKey } from "../history.js";

let settings = await loadSettings();
/* Kept apart from the settings on purpose: the key lives in the system's own
   store and never travels with the settings file. */
let apiKey = await loadApiKey();
let text = labels(settings.languages[0]);

/* The window has no bar of its own and no traffic lights: the shell hides
   them, and what would have stood in a strip of its own stands at the right
   end of the first heading line instead — the line that says what the box
   under it is. The three buttons belong to the window rather than to the
   text, so that line is the one thing in the sheet that does not scroll away.

   Drawn rather than written: a gear character arrives as an emoji in some
   fonts and as a missing glyph in others. */
const chevron = (path) =>
  `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
     <path d="${path}"/>
   </svg>`;
const BACK = chevron("M10 3.5 5.5 8l4.5 4.5");
const FORWARD = chevron("M6 3.5 10.5 8 6 12.5");
/* A plus: a reading that is not there yet. It stands before the gear, on the
   side the reading itself is on, because it is about the text and not about
   the app; the cross stands after it, where a window's own close button
   stands on every other window. */
const FRESH = chevron("M8 3v10M3 8h10");
const CLOSE = chevron("M4 4l8 8M12 4l-8 8");
/* A pushpin, before the cross because it decides what the cross is for:
   pinned, the window stays above every other one until it is put away. Its
   body fills in while it is pinned. */
const PIN = `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
     <path class="pin-body" d="M5.5 2.5h5M6.6 2.5v3.8L4.5 9.5h7L9.4 6.3V2.5"/>
     <path d="M8 9.5v4"/>
   </svg>`;

const GEAR = `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
  ${[0, 45, 90, 135, 180, 225, 270, 315]
    .map((turn) => `<rect x="6.8" y="1.2" width="2.4" height="3.4" rx="0.5" transform="rotate(${turn} 8 8)"/>`)
    .join("")}
  <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" stroke-width="2.6"/>
</svg>`;

const root = document.getElementById("app");
root.innerHTML = `
  <div class="topline" data-tauri-drag-region>
    <div class="heading" id="heading" data-tauri-drag-region></div>
    <div class="window-actions">
      <button id="back" class="icon">${BACK}<span class="pill-label"></span></button>
      <button id="forward" class="icon">${FORWARD}<span class="pill-label"></span></button>
      <button id="fresh" class="icon">${FRESH}<span class="pill-label"></span></button>
      <button id="open-settings" class="icon">${GEAR}<span class="pill-label"></span></button>
      <button id="pin" class="icon">${PIN}<span class="pill-label"></span></button>
      <button id="close" class="icon">${CLOSE}<span class="pill-label"></span></button>
    </div>
  </div>
  <div class="sheet" id="sheet"></div>
  <div class="status-line" id="status"></div>
`;

const settingsButton = root.querySelector("#open-settings");
const freshButton = root.querySelector("#fresh");
const closeButton = root.querySelector("#close");
const pinButton = root.querySelector("#pin");
const backButton = root.querySelector("#back");
const forwardButton = root.querySelector("#forward");
const heading = root.querySelector("#heading");
const sheet = root.querySelector("#sheet");
const statusLine = root.querySelector("#status");

labelsInside(root);

/* What a word of the original became in the reader's own panel, over the
   word while the pointer rests on it. Only over a reading, never over a text
   being written. */
const glance = watchGlance({
  sheet,
  layer: root,
  reading: () => (current && !editing ? { state: current, reader: settings.languages[0] } : null),
});

/* Questions the reader is waiting on — a clicked word, a synonym — go
   before the hover's alignment, which nobody is waiting on. The run asks
   `quietTurn` before each of its sentences. */
let waiting = 0;
let released = [];
async function waitedOn(work) {
  waiting++;
  try {
    return await work();
  } finally {
    if (--waiting === 0) released.splice(0).forEach((resolve) => resolve());
  }
}
const quietTurn = () => (waiting ? new Promise((resolve) => released.push(resolve)) : Promise.resolve());

const say = (message) => { statusLine.textContent = message || ""; fitSoon(); };

/* The pending fit of the window to its page, and what watches the page for
   it — see pageHeight. */
let fitting = 0;
let fittingLate = 0;
let settling = Promise.resolve(false);
/* While a word is being picked the pointer is down and only its frame moves;
   the window keeps its size until the pointer is released. Fitted on the
   press and again on the release, the first pick of a reading — the one that
   adds the area for it — ran two animations to two different heights one
   after the other whenever the click was slower than a frame, and the window
   twitched. */
let pointerDown = false;
const letGo = () => {
  if (!pointerDown) return;
  /* After the pick has drawn what the release decided. */
  setTimeout(() => { pointerDown = false; fitSoon(); }, 0);
};
document.addEventListener("mouseup", letGo);
/* A button let go outside the window never reaches it as a mouseup, and the
   window would keep its size for good — through every reading after it. By
   the time another program has the focus, the press is over. */
window.addEventListener("blur", letGo);
const heightWatch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => fitSoon());

/* The program the current text was read out of, and the one a translation
   goes back into. Zero means there is none — the text was typed or pasted
   here, and then there is nothing to replace anywhere. */
let source = 0;

/* Whether the optional Accessibility permission is there (`trusted`), and
   whether the reader wants it used for the selection — the settings' switch
   (`granted`). Off, the shortcut reads
   what the reader copied, the menu bar's entry says so, and a translation
   has no Insert: that button is the permission's other half, and Copy stands
   beside it anyway. Asked again whenever the window comes forward — the
   reader turns the switch in System Settings, which takes the window away,
   and comes back — rather than on a timer. */
let granted = false;
let trusted = false;

async function checkPermission() {
  const there = insideApp() && await accessibilityGranted();
  const now = there && usesPermission(settings);
  if (now === granted && there === trusted) return;
  trusted = there;
  granted = now;
  /* A force click is heard only once the permission is there. */
  listenForForceClick(wantsForceClick());
  tools = makeTools();
  applyMenu();
  draw();
}

/* The one line that teaches copying before the shortcut, shown where the
   shortcut found nothing new copied. Once a copied text has come through in
   this session the reader knows, and a shortcut pressed only to bring the
   window back says nothing. */
let copiedOnce = false;

/* The original field's two states, and what stands in it. The text is kept
   here rather than read back out of the field, because the field only exists
   while it is being written in. */
let editing = true;
let draft = "";

/* The last state a run produced. The window keeps it so that picking a word
   redraws from it instead of starting over. Nothing means nothing has been
   read yet — or the last attempt came to nothing, which looks the same and
   should. */
let current = null;
/* What the last fold left folded away, for the next reading (see fold). */
let folds = new Set();
let currentLlm = null;
/* Whether a reading is being worked on. The warm-up asks, so that it never
   stands in front of the thing it exists to make faster. */
let reading = false;

/* The last few readings, whole — the panels, the verbs, the terms and every
   word that was explained. Going back to one therefore costs nothing at all:
   the answers are in it already and only have to be drawn again.

   In memory and nowhere else. The window hides rather than closes, so this
   outlives the way it is normally put away, and a reader's texts stay out of
   any file. How many is the reader's choice (`kept` in the settings); none
   still holds the one on screen, with no chevrons to step by.

   `place` is which of them is on screen. One past the end means a sheet that
   is not one of them yet: a blank one waiting to be written in, or a reading
   still being worked out. */
const history = [];
let place = 0;

function remember(entry) {
  history.push(entry);
  dropOldest(history, settings, entry);
  place = history.length - 1;
}

/* A run that produced nothing at all leaves no entry behind: there would be
   nothing in it to come back to, and it would take a place
   from a translation that has something to show. */
function forget(entry) {
  const index = history.indexOf(entry);
  if (index === -1) return;
  history.splice(index, 1);
  if (place > index) place--;
  else if (place === index) place = history.length;
}

async function goTo(index) {
  if (index < 0 || index >= history.length || index === place) return;
  place = index;
  edited = null;
  const entry = history[index];
  draft = entry.draft;
  source = entry.source;
  current = entry.state;
  editing = false;
  /* Rebuilt because the way back into another program hangs on which program
     this reading came out of, and that is different for every entry. */
  tools = await makeTools();
  draw();
  toTop();
  /* A kept reading carries its own reason, and it is as true now as it was
     then: this is the only place it stands. */
  sayFor(current);
}

/* Drawn from the state rather than kept alongside it: every path through this
   file ends in a drawing, and one that forgot to say so would leave a chevron
   pointing at nothing. */
function applyHistory() {
  backButton.disabled = place <= 0;
  forwardButton.disabled = place >= history.length - 1;
  for (const button of [backButton, forwardButton]) button.style.display = settings.kept ? "" : "none";
}

/* Which kept translation is on screen, and whether a run's answers still
   belong there. A run goes on filling its own entry wherever the reader has
   walked off to — that is the whole point of keeping unfinished ones — but it
   may only draw when it is the one being looked at, and not over a field
   somebody is typing in. */
const showing = () => history[place] || null;

function update(entry) {
  if (editing || showing() !== entry) return;
  current = entry.state;
  draw();
}

function applyLanguage() {
  /* Whatever stands in the status line was written in the language being left
     behind, and there is no way to write it again — it said what had just
     happened, and that is over. Better gone than half-translated. */
  if (text !== labels(settings.languages[0])) say("");
  text = labels(settings.languages[0]);
  nameTitleBar();
  showPin();
  /* The menu bar symbol is named in the same language as everything else,
     and it is the only piece of interface outside the two windows. */
  applyMenu();
}

/* The keys this window answers to itself, written the way each system
   writes them. */
const WINDOW_KEYS = onWindows()
  ? { close: "Esc", settings: "Ctrl+,", pin: "Ctrl+." }
  : { close: "esc", settings: "⌘,", pin: "⌘." };
const withKey = (name, key) => (key ? `${name} (${key})` : name);

/* Named the way every other symbol button in the window is named: the word
   appears over the button while the pointer rests on it. The system's own
   tooltip is not asked for on top of it — one button, one answer. A button
   a key also reaches names the key beside the word; a new translation only
   where the reader set a combination for it. */
async function nameTitleBar() {
  const name = (node, words) => {
    node.querySelector(".pill-label").textContent = words;
    node.setAttribute("aria-label", words);
  };
  name(backButton, text.historyBack);
  name(forwardButton, text.historyForward);
  name(settingsButton, withKey(text.settingsOpen, WINDOW_KEYS.settings));
  name(closeButton, withKey(text.closeWindow, WINDOW_KEYS.close));
  name(freshButton, text.newReading);
  if (!settings.freshHotkey) return;
  keyLayout = keyLayout || keyLabels();
  const layout = await keyLayout;
  /* Read again after the wait: the settings may have changed meanwhile. */
  name(freshButton, withKey(text.newReading, hotkeyLabel(settings.freshHotkey, layout)));
}

/* The menu bar symbol's entries, and the shortcut written beside the one that
   does what it does — in the characters of the reader's keyboard, which only
   the shell can read. Asked again after every settings change, because the
   shortcut may be what changed. */
let keyLayout = null;
async function applyMenu() {
  keyLayout = keyLayout || keyLabels();
  const words = {
    show: text.trayShow,
    capture: granted ? text.trayCapture : text.trayCaptureCopied,
    fresh: text.newReading,
    card: granted ? text.trayCard : text.trayCardCopied,
    blankCard: text.trayCardBlank,
    settings: text.settings,
    updates: text.trayUpdates,
    help: text.trayHelp,
    problem: text.trayProblem,
    restart: text.trayRestart,
    quit: text.trayQuit,
  };
  const layout = await keyLayout;
  /* A Windows menu writes whatever follows a tab at the right edge of its
     entry, which is where the shortcut goes, named the way the settings name
     it. Handed over as an accelerator instead, it was drawn from the key's
     American name: Ctrl+Ä came out as Ctrl+'. */
  const entries = { capture: settings.hotkey, fresh: settings.freshHotkey, card: settings.cardHotkey };
  if (onWindows()) {
    for (const [entry, hotkey] of Object.entries(entries)) {
      const label = hotkeyLabel(hotkey, layout);
      if (label) words[entry] += `\t${label}`;
    }
    applyTray(words);
    return;
  }
  applyTray(words, Object.fromEntries(Object.entries(entries)
    .map(([entry, hotkey]) => [entry, menuAccelerator(hotkey, layout)])));
}

/* The combinations, handed to the shell. Done again after every change in the
   settings, so an old one is never left holding on. */
async function applyShortcut() {
  await useDirectSelection(usesPermission(settings));
  const failed = await registerShortcuts(settings);
  if (failed) say(text.hotkeyFailed(failed));
  listenForForceClick(wantsForceClick());
}

/* The force click has a switch of its own; the shell hears it only with
   the permission. */
function wantsForceClick() {
  return settings.forceClick && !onWindows();
}

/* Everything a row's buttons can set off. Assembled once per run, because
   whether there is a program behind the text — and whether the flashcards are
   switched on — can have changed since the last one. */
function makeTools() {
  return {
    reader: settings.languages[0],
    copy: copyText,
    open: openUrl,
    /* Into the program the reader was last working in — they may have
       clicked into another field since the text was read, or typed the text
       here — and only where none is known into the one it was read out of;
       the shell brings that program in front. The window goes away first
       unless it is pinned, and comes back if the writing failed, or the
       reason for it would be announced to an empty screen. */
    insert: granted
      ? async (value) => {
          const pinned = settings.pinned;
          if (!pinned) await hideWindow();
          try {
            await insertText(source, value);
          } catch (error) {
            if (!pinned) await showWindow();
            throw new Error(text.insertNoWay(error.message || String(error)), { cause: error });
          }
        }
      : null,
    search: async (term) => openUrl(searchLink(await searchUrl(settings.search), term)),
    /* Opens the card in a window of its own and files nothing. What happens
       to it afterwards is that window's business — copied out field by field,
       copied as one line, or handed to Anki where the reader set that up. */
    card: async (card) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await openCard(windowTitle(text.cardCreate), { ...card, id });
    },
    /* Which languages are worth a card is the reader's answer, by place in
       their own list. Asked per row, because the language is the word's and
       not the text's. */
    cardFor: (code) => offersCard(settings, code),
    speak: speech.speak,
    canSpeak: speech.canSpeak,
  };
}

/* One for the window's life. Its voices can arrive after the first drawing,
   and a reading on screen then gets its loudspeakers. */
const speech = createSpeech(globalThis.speechSynthesis, globalThis.SpeechSynthesisUtterance, () => {
  if (current) draw();
});

let tools = { reader: settings.languages[0], copy: copyText, open: openUrl,
              search: async (term) => openUrl(searchLink(await searchUrl(settings.search), term)),
              card: null, cardFor: () => false, insert: null,
              speak: speech.speak, canSpeak: speech.canSpeak };

/* What the line under the sheet says while a reading is on screen: the one
   reason nothing came of it, or what the run is doing, or nothing at all.

   The reason stands here rather than in the areas that are empty because of
   it. One endpoint and one model fail for all of them at once, so a sentence
   in each would be the same sentence two, three or four times over — the
   areas say that they are empty, this says why. */
function sayFor(state) {
  if (state?.fault) return say(faultText(settings.languages[0], state.fault));
  say(state?.busy && !state.source ? text.detecting : "");
}

/* Back to the top of the sheet. Only where the sheet becomes a different one
   — a reading that has just started, one stepped back to, a blank sheet. A
   reader scrolled halfway down one reading would otherwise arrive halfway
   down the next, at whatever happens to stand there. Never during a run: the
   sheet fills while it is being read, and a page that jumped to the top on
   every arriving piece would take the reading away from the reader. */
const toTop = () => { sheet.scrollTop = 0; };

function draw() {
  /* The drawing answers with what the line above the sheet says — the
     original's heading, which lives up there because that line carries the
     window's buttons and they may not scroll away with the text. */
  drawReading();
  renderHeading(heading, current, {
    text, settings, editing, recent: recentChoices, onLanguage: current?.panels?.length ? chooseLanguage : null,
  });
  applyHistory();
  watchHeight();
  glance.refresh();
}

/* The window is as tall as what it holds, the way Spotlight is: a blank
   sheet is a field, a short reading a short window, and a long one grows to
   the bottom of the screen's free part and scrolls there. The top edge stands
   still and the change is animated (the shell's fit_reading_window).

   While answers are still arriving it only grows: a placeholder replaced by a
   shorter answer would otherwise make the window bob. Once they are in it
   fits exactly, and so on a fold, a step back or forward and a blank sheet.

   Measured rather than counted: the line above the sheet, the sheet down to
   the bottom of its last section and its own padding, and the line under it. */
function pageHeight() {
  const last = sheet.lastElementChild;
  const top = sheet.getBoundingClientRect().top;
  /* With the margin under it: the locked line's, measured, was six pixels
     the window could be scrolled by. */
  const margin = last ? parseFloat(getComputedStyle(last).marginBottom) || 0 : 0;
  const bottom = last ? last.getBoundingClientRect().bottom + margin + sheet.scrollTop : top;
  const padding = parseFloat(getComputedStyle(sheet).paddingBottom) || 0;
  return Math.ceil(root.querySelector(".topline").offsetHeight + (bottom - top) + padding + statusLine.offsetHeight);
}

const arriving = () =>
  !!current && (current.busy || current.markedStatus === "working" || current.markedStatus === "linking");

function fitSoon() {
  if (pointerDown || !settings.fitWindow) return;
  /* One measurement per burst: a run lands several pieces within a few
     milliseconds, and every one of them redraws. */
  cancelAnimationFrame(fitting);
  clearTimeout(fittingLate);
  const fit = () => {
    cancelAnimationFrame(fitting);
    clearTimeout(fittingLate);
    settling = fitReadingWindow(pageHeight(), arriving());
  };
  fitting = requestAnimationFrame(fit);
  /* A page the system gives no frames — a window behind another program's —
     is fitted all the same, a moment later. */
  fittingLate = setTimeout(fit, 250);
}

/* Now, without waiting for a frame — a hidden page is given none, and the
   shortcut fits the window before it shows it. */
function fitNow() {
  cancelAnimationFrame(fitting);
  clearTimeout(fittingLate);
  if (!settings.fitWindow) return settling = Promise.resolve(false);
  settling = fitReadingWindow(pageHeight(), false);
  return settling;
}

/* Once the window has the size the page last asked for: the answer from the
   shell, and the animation after it. */
async function settled() {
  /* Two frames: a fit asked for in this one is only sent in the next. */
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const resized = await settling;
  if (resized) await new Promise((resolve) => setTimeout(resolve, 220));
}

/* A field growing under what is typed, a longer explanation arriving — the
   sheet's sections change height without a redraw of the whole sheet. */
function watchHeight() {
  if (heightWatch) {
    heightWatch.disconnect();
    for (const section of sheet.children) heightWatch.observe(section);
    heightWatch.observe(statusLine);
  }
  fitSoon();
}

function drawReading() {
  return renderReading(sheet, current, {
    settings,
    tools,
    edit: {
      editing,
      draft,
      /* A text that has been changed here is no longer the one standing over
         there, so that program is no longer where it belongs. */
      onDraft: (value) => { draft = value; source = 0; },
      onEdit: startEditing,
      onTranslate: translate,
    },
    onPick: pick,
    onLookUp: lookUp,
    onStep: stepTrail,
    sentences: neighbours(),
    onSentence: stepSentence,
    onFold: fold,
    onMore: more,
    onExample: example,
  });
}

/* The field is built fresh by every drawing, so the caret has to be put back
   into it afterwards rather than kept in it. At the end of the text: what
   somebody who pressed Edit wants is to carry on, not to overwrite. */
function focusDraft() {
  const field = sheet.querySelector("#draft");
  if (!field) return;
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
}

/* A blank sheet: the plus, the menu's entry for it, or a selection that could
   not be had. What was read before is one chevron away. */
function startFresh() {
  edited = null;
  place = history.length;
  source = 0;
  draft = "";
  current = null;
  editing = true;
  draw();
  toTop();
  focusDraft();
}

function startEditing() {
  edited = chosen.get(showing()?.draft) || null;
  editedIn = showing()?.sentence ? { word: showing().draft, sentence: showing().sentence } : null;
  draft = current?.panels[0]?.text ?? draft;
  editing = true;
  draw();
  focusDraft();
  say("");
}

async function openSettingsWindow() {
  if (await openSettings(windowTitle(text.settings))) return;
  /* Outside the app there is no second window to open; the settings are a
     page of their own and can be looked at as one. */
  window.location.href = "settings.html";
}

/* One for the whole session, where the LLM backend is built per run.

   Not a tidying: what it knows is worth keeping. Which pairs the device has
   is asked once instead of once per reading, and the warm-up below has
   somewhere to remember that it has already run. The helper's own sessions
   would survive a new object, but nothing on this side would. */
let device = null;

async function deviceBackend() {
  if (!device) device = createTranslationBackend({ helperUrl: HELPER_URL }, await appFetch());
  return device;
}

async function backends() {
  const translation = await deviceBackend();
  const llm = settings.endpoint
    ? createLlmBackend(
        { endpoint: settings.endpoint, apiKey, model: settings.model },
        await modelFetch(),
      )
    : null;
  return { translation, llm, identifier: await languageIdentifier() };
}

async function translate() {
  const body = draft.trim();
  /* Nothing to read. The field is where that gets fixed, so the window goes
     into the state that has one — it may not be in it: the shortcut can
     arrive with a text that is nothing but spaces, and answering that with a
     caret nobody can see would leave the last reading standing over a window
     that has already forgotten it. */
  if (!body) {
    if (!editing) {
      draft = "";
      editing = true;
      draw();
    }
    focusDraft();
    return;
  }

  /* Read already — edited and not changed, or selected again in a program.
     A kept reading is the answer to exactly this text, so there is nothing to
     ask: it is shown again. Asked again it would pay for every call of a run —
     the translations, the verbs, the terms — for an answer that is there. A
     selection brings its own program to write back into; a text typed over
     and restored character for character is the one over there again, and
     `onDraft` had given up on it at the first keystroke. */
  /* Edited and not changed, a word looked up in its sentence is the same
     question: the sentence stays with it. Changed, it is a text of its own. */
  const lookedUp = lookup || (editing && editedIn?.word === body ? editedIn.sentence : null);
  lookup = null;
  editedIn = null;
  const kept = keptReading(history, body, settings, lookedUp?.text || "");
  if (kept) {
    const moved = history.indexOf(kept) !== place;
    place = history.indexOf(kept);
    draft = body;
    source = source || kept.source;
    kept.source = source;
    current = kept.state;
    editing = false;
    tools = makeTools();
    draw();
    if (moved) toTop();
    sayFor(current);
    return;
  }

  /* An edited text is the same text with a word changed, as a rule: the
     language the reader chose for it goes on with it, unless the function
     words are sure it is now another. */
  if (edited && !chosen.has(body) && keepsChosenLanguage(body, edited.code)) rememberChoice(body, edited);
  edited = null;

  draft = body;
  editing = false;
  current = null;
  /* Kept from the first moment, not from the last. A reader who walks back
     while this is still being worked out has to be able to walk forward into
     it again — and it goes on filling itself in the meantime, so what they
     come back to is further along than what they left. */
  const entry = { draft: body, source, state: null, key: readingKey(settings), sentence: lookedUp };
  remember(entry);
  draw();
  toTop();
  say(chosen.has(body) || entry.sentence?.detected.code ? "" : text.detecting);
  await read(entry);
}

/* The sentence a looked-up word came with, until its entry is asked for
   (onCapture). */
let lookup = null;

/* Stepping on through the text a sentence or a selection was read out of,
   a sentence at a time (author 2026-10-07): `around` is the text that came
   along with it, `spans` the sentences found in it so far, `at` the one on
   screen and `entries` their readings. Only forwards from where the reader
   started, and back as far as that; the next one is cut out of the text
   already here (sentenceAfter), so nothing is offered that is not there.

   The sentence stepped to takes the place of the one on screen among the
   kept readings — a walk is one reading there, not one per sentence — and
   the walk keeps its own, so a step back is drawn and not asked again. */
let walk = null;

function startWalk(selection, span) {
  walk = span && settings.nextSentence ? { around: selection.context, source: selection.source || 0, spans: [span], at: 0, entries: [] } : null;
}

const walked = () => (walk && settings.nextSentence && !editing && showing() && walk.entries[walk.at] === showing() ? walk : null);

/* The sentences before and after the one on screen, for the lines around
   the original — null where there is none to step to. */
function neighbours() {
  const here = walked();
  if (!here) return null;
  if (here.at === here.spans.length - 1 && !here.ended) {
    const next = sentenceAfter(here.around, here.spans[here.at].end);
    if (next) here.spans.push(next);
    else here.ended = true;
  }
  return { back: here.spans[here.at - 1]?.text || "", next: here.spans[here.at + 1]?.text || "" };
}

async function stepSentence(delta) {
  const here = walked();
  const span = here?.spans[here.at + delta];
  if (!span) return;
  const from = showing();
  here.at += delta;
  lightUp(span.start, span.end);
  /* The language the reader said the text is in goes on with it. */
  if (chosen.has(from.draft) && !chosen.has(span.text)) rememberChoice(span.text, chosen.get(from.draft));
  const kept = here.entries[here.at];
  const again = kept && kept.key === readingKey(settings) && !kept.state?.fault;
  const entry = again ? kept : { draft: span.text, source: here.source, state: null, key: readingKey(settings), sentence: null };
  here.entries[here.at] = entry;
  history[history.indexOf(from)] = entry;
  edited = null;
  lookup = null;
  draft = entry.draft;
  source = entry.source;
  current = entry.state;
  tools = await makeTools();
  draw();
  toTop();
  if (again) return sayFor(current);
  say(chosen.has(entry.draft) ? "" : text.detecting);
  await read(entry);
}

/* The languages the reader said a text is in, by text, for as long as the app
   runs: selected again, it is read in that language and not detected anew.
   In memory only, like the readings themselves, and only the latest few. */
const chosen = new Map();
const MOST_CHOSEN = 50;
/* The languages picked by hand, latest first: the top of the list, for the
   next text in the same language that detection gets wrong again. */
let recentChoices = [];
const MOST_RECENT = 5;
/* The choice of the reading being edited, carried to the edited text. */
let edited = null;
/* The sentence the reading being edited was looked up in. */
let editedIn = null;

function rememberChoice(text, choice) {
  chosen.delete(text);
  chosen.set(text, choice);
  while (chosen.size > MOST_CHOSEN) chosen.delete(chosen.keys().next().value);
}

/* The reader says the original is in another language. The reading is made
   again in it, in the place of the one that was wrong: every panel, row and
   marking hung on the language, so nothing of the old one carries over. A
   run of the old one still under way fills an entry nobody is shown. */
async function chooseLanguage(code) {
  const old = showing();
  if (!old || editing) return;
  rememberChoice(old.draft, { code, guesses: old.state?.source?.guesses || [] });
  recentChoices = [code, ...recentChoices.filter((c) => c !== code)].slice(0, MOST_RECENT);
  const entry = { draft: old.draft, source: old.source, state: null, key: readingKey(settings) };
  if (walked()) walk.entries[walk.at] = entry;
  history[history.indexOf(old)] = entry;
  draft = old.draft;
  current = null;
  draw();
  toTop();
  say("");
  await read(entry);
}

/* One reading, start to finish, into its entry. */
async function read(entry) {
  const choice = chosen.get(entry.draft);
  const { translation, llm, identifier } = await backends();
  currentLlm = llm;
  tools = await makeTools();
  await ensureTranslationHelper(translation);

  reading = true;
  try {
    await runText(entry.draft, {
      settings,
      translation,
      llm,
      aligner: await wordAligner(),
      identifier,
      waitTurn: quietTurn,
      language: choice?.code || entry.sentence?.detected.code || "",
      languageBy: choice?.code ? "reader" : entry.sentence?.detected.by || "",
      guesses: choice?.guesses || entry.sentence?.detected.guesses || [],
      sentence: entry.sentence
        ? { text: entry.sentence.text, start: entry.sentence.start, end: entry.sentence.end }
        : null,
      onChange(state) {
        /* Kept for a problem report, once per run: the diagnostics in the
           settings list the last few. */
        if (state.fault && !entry.noted) {
          entry.noted = true;
          noteFault(faultLine(state.fault));
        }
        if (showing() === entry && !editing) sayFor(state);
        if (!state.panels.length) return;
        /* The entry's own previous state, not the window's: while this runs,
           the window may be showing something else entirely. A word picked
           during the run keeps its place — the run knows nothing about it,
           and redrawing must not take it away. */
        const before = entry.state;
        entry.state = { ...state, selection: before?.selection, marked: before?.marked,
                        markedStatus: before?.markedStatus, folded: before?.folded ?? new Set(folds),
                        more: before?.more };
        update(entry);
      },
    });
    settle(entry);
  } catch (error) {
    /* The original field has to survive this: it holds the only copy of what
       the reader was about to read, and a sheet wiped clean for an error
       message would take it away with it. The message goes to the status
       line, where every other passing word goes. */
    noteFault(faultLine(faultOf(error)));
    if (settle(entry)) say(faultText(settings.languages[0], faultOf(error)));
  } finally {
    reading = false;
  }
}

/* Opening the device's language pairs before a reading needs them.

   The first translation through a pair pays for the session behind it —
   measured 0.70 s against 0.42 s once the pair has been used — and a reading
   fires on a keystroke, so that is paid here instead, while the reader is
   still looking at an empty field.

   Only the pairs the reader's own languages make. And never in front of a
   reading: the shortcut shows the window and starts a run in the same breath,
   and the helper works through translations singly, so warming up then would
   delay exactly the translation it is meant to speed up. A run is already
   opening the pairs it needs by using them. */
async function warmDevice() {
  /* Where the model translates first the device only steps in, and a
     stand-in is not worth keeping its sessions in memory for. Without a
     model it is the only engine there is. */
  if (reading || (settings.translator === "model" && settings.endpoint)) return;
  const translation = await deviceBackend();
  if (!(await ensureTranslationHelper(translation))) return;
  if (reading) return;
  await translation.warm(neededPairs(settings.languages));
}

/* A moment after the window appears, not at the moment: the shortcut's run
   starts in the same breath and has to be the one that gets there first. */
const WARM_DELAY_MS = 500;
let warmTimer = 0;

function warmSoon() {
  clearTimeout(warmTimer);
  warmTimer = setTimeout(() => { warmDevice().catch(() => {}); }, WARM_DELAY_MS);
}

/* A run has stopped, well or badly. Whether anything came of it decides
   whether it keeps its place, and whether the reader is looking at it decides
   whether any of that shows. Answers that last question, because the one
   caller with something more to say only has somewhere to say it then. */
function settle(entry) {
  const watched = showing() === entry;
  if (!entry.state) forget(entry);
  applyHistory();
  if (!watched || editing) return false;
  current = entry.state;
  draw();
  sayFor(current);
  /* Once more when every animation of the run is over: one still running
     when the last answer landed can end on a height of its own. */
  setTimeout(fitSoon, 400);
  return true;
}

/* The row under the pointer and its spots in the panels belong together. The
   attribute sits on the whole window rather than on the spans: the panels are
   rebuilt at any time, and classes set there would be lost. */
sheet.addEventListener("mouseover", (event) => {
  const row = event.target.closest?.(".row[data-hl]");
  if (row) root.dataset.hl = row.dataset.hl;
});
sheet.addEventListener("mouseout", (event) => {
  if (event.target.closest?.(".row[data-hl]")) delete root.dataset.hl;
});

/* A translation, the verbs, the terms or the picked word folded away or
   back. Kept with the reading, so one stepped back to is as it was left, and
   in `folds`, which a new reading starts from — until the app quits. The
   picked word is not carried over: a new pick opens it anyway. Redrawn
   rather than toggled, because the verbs and terms take their markings in
   the panels with them. */
function fold(key) {
  if (!current) return;
  const folded = (current.folded ||= new Set());
  if (folded.has(key)) folded.delete(key);
  else folded.add(key);
  folds = new Set([...folded].filter((name) => name !== MARKED));
  draw();
}

/* The paragraph a click showed first is replaced by the whole answer once
   the markings are in, so a longer explanation asked for in between belongs
   to both. */
function bothOf(marked, picked) {
  const targets = [marked];
  if (picked && current?.marked && current.marked !== marked && current.marked.text === marked.text) {
    targets.push(current.marked);
  }
  return targets;
}

function settleMore(marked, answer, status, picked) {
  for (const target of bothOf(marked, picked)) {
    target.more = answer?.text || "";
    target.examples = withExplanationExamples(target.examples, answer?.examples);
    target.moreStatus = status;
  }
}

function settleExample(marked, example, status, picked) {
  for (const target of bothOf(marked, picked)) {
    if (example) target.examples = withExamples(target.examples, [example]);
    target.exampleStatus = status;
  }
}

/* The language a question about a panel's words names. A language without a
   pack that the reader chose keeps its code apart from the panel's, which
   says only what the app can do with it. */
const askedLanguage = (panel) => panel.code || panel.iso || "";

/* What a row is asked about, and where its answer is kept: the picked word on
   itself, so the synonym trail finds it again; a verb or a term with the
   reading, by section and place, where a run still filling in cannot replace
   it. */
function askingFor({ kind, index, item }, shown) {
  if (kind === "marked") {
    const panel = shown.panels[shown.selection?.panel ?? 0];
    if (!panel) return null;
    const from = pickedText(shown.selection || {}, panel, shown);
    return {
      holder: item,
      ask: {
        term: item.text, base: item.infinitive, text: from || "", source: askedLanguage(panel),
        meaning: item.meaning, note: item.note,
        /* A word reached through a synonym does not stand in the text. */
        inText: !item.back && !!from,
      },
    };
  }
  const panel = shown.panels[0];
  if (!panel) return null;
  const holder = ((shown.more ||= {})[`${kind}:${index}`] ||= {});
  /* A looked-up word's term was found in its sentence, and may reach past
     the word into it. */
  const around = shown.sentence?.text || panel.text;
  const ask = kind === "verbs"
    ? { term: item.form, base: item.infinitive, text: around, source: askedLanguage(panel), meaning: item.meaning,
        note: [item.infinitive, item.person, item.tense].filter(Boolean).join(", ") }
    /* A looked-up verb form gets its examples by its base form, as a verb
       row and a picked verb do: written from the form, they kept its tense
       and person. Its note is an explanation, as a picked word's is. */
    : { term: item.text, base: item.verb?.infinitive, text: around, source: askedLanguage(panel), meaning: item.meaning,
        note: item.note };
  return { holder, ask };
}

/* A row explained at more length, asked for on its own button: the picked
   word, a verb or a term. */
async function more(row) {
  if (!currentLlm || !current) return;
  const shown = current;
  const asking = askingFor(row, shown);
  if (!asking) return;
  const { holder, ask } = asking;
  if (holder.moreStatus === "working") return;
  holder.moreStatus = "working";
  draw();
  try {
    const answer = await explainMore(currentLlm, { ...ask, reader: settings.languages[0],
                                                   level: levelFor(settings, ask.source),
                                                   /* What the reader has already asked for, so the
                                                      paragraph's own example is not one of them again. */
                                                   examples: holder.examples || [] });
    settleMore(holder, answer, answer ? "" : { kind: "empty" }, row.kind === "marked");
  } catch (error) {
    settleMore(holder, null, faultOf(error), row.kind === "marked");
  }
  if (current === shown) draw();
}

/* One more example sentence under a longer explanation, on the reader's
   request. The ones already there go with the question: what makes another
   one worth having is that it is unlike them. The text is not sent — an
   example is about the word and not about this passage. */
async function example(row) {
  if (!currentLlm || !current) return;
  const shown = current;
  const asking = askingFor(row, shown);
  if (!asking) return;
  const { holder, ask } = asking;
  if (holder.exampleStatus === "working") return;
  if (!roomForExample(holder.examples)) return;
  holder.exampleStatus = "working";
  draw();
  try {
    const answer = await addExample(currentLlm, {
      /* A verb by its base form: given the form from the text, both models
         wrote every sentence in that one tense and person. */
      term: ask.base || ask.term, source: ask.source, reader: settings.languages[0],
      level: levelFor(settings, ask.source), meaning: ask.meaning, note: ask.note,
      examples: holder.examples || [],
    });
    settleExample(holder, answer, answer ? "" : { kind: "empty" }, row.kind === "marked");
  } catch (error) {
    settleExample(holder, null, faultOf(error), row.kind === "marked");
  }
  if (current === shown) draw();
}

/* Back and forth along the words one synonym led to another. Every entry is
   still here, so a step costs no call — only a redraw. Brought into view like
   every other change to this area: what comes back may be taller than what
   stood there a moment ago.

   `markedPlace` may stand one past the end, while a look-up is on its way or
   after it failed: back from there is the last entry that did arrive. */
function stepTrail(delta) {
  const trail = current?.markedTrail;
  if (!trail) return;
  const place = Math.min(Math.max(current.markedPlace + delta, 0), trail.length - 1);
  current.markedPlace = place;
  current.marked = trail[place];
  current.markedStatus = "";
  current.selection = { ...current.selection, term: trail[place].text };
  draw();
  revealMarked();
}

/* Looking a synonym up in turn. It does not stand in the text, so there is
   nothing to find there and the spot question is dropped. The entry it came
   from is kept on a trail the area's two chevrons step along, or the look-up
   would be a dead end: a synonym cannot be unpicked by clicking it again. */
async function lookUp(word, previous) {
  if (!currentLlm || !current) return;
  const panel = current.panels[current.selection?.panel ?? 0];
  /* A new word cuts off whatever stood ahead of the one it was clicked in,
     the way a browser forgets its forward pages. */
  const trail = current.markedTrail
    ? current.markedTrail.slice(0, current.markedPlace + 1)
    : [previous];
  current.markedTrail = trail;
  current.markedPlace = trail.length;
  current.selection = { ...current.selection, term: word };

  /* A synonym already looked up in this reading is answered from what came
     back the first time. Its answer does not depend on the text — the text is
     not even sent — only on the word and the language it is in, so asking
     again would pay for the same answer twice. Kept with the reading, in
     memory like the reading itself. */
  const answers = (current.synonymAnswers ||= {});
  const key = `${panel.code}|${word}`;
  if (answers[key]) {
    current.marked = { ...answers[key], back: previous };
    current.markedStatus = "";
    trail.push(current.marked);
    current.markedPlace = trail.length - 1;
    draw();
    revealMarked();
    return;
  }

  current.marked = null;
  current.markedStatus = "working";
  draw();
  /* The area shrinks to one line while it waits — the synonyms that were
     clicked are the first thing to go — and it grows past the bottom edge
     again when the answer arrives. Both times it is brought into view, for
     the same reason a picked word is: the reader pressed something and the
     result must not be below the fold. */
  revealMarked();

  const others = otherPanels(current.selection.panel, current.panels[0].code, settings.languages)
    .map((index) => current.panels[index])
    .filter(Boolean)
    .map((entry) => ({ code: entry.code, text: entry.text }));

  try {
    const marked = await waitedOn(() => explainMarked(currentLlm, {
      term: word,
      text: panel.text,
      source: askedLanguage(panel),
      reader: settings.languages[0],
      others,
      /* It does not stand in the text — it came out of another word's
         synonyms — so the text is not sent and there is nothing to locate. */
      inText: false,
    }));
    if (marked) answers[key] = marked;
    if (current.selection?.term !== word) return;
    current.marked = marked ? { ...marked, back: previous } : null;
    current.markedStatus = "";
    if (current.marked) {
      trail.push(current.marked);
      current.markedPlace = trail.length - 1;
    }
  } catch (error) {
    current.marked = null;
    current.markedStatus = faultOf(error);
  }
  draw();
  revealMarked();
}

/* The answer to a clicked word is the last thing on the sheet, and on an
   ordinary reading it is below the fold — measured: three panels, the verbs
   and the terms come to some 890 px where the window has 732. The reader
   clicks a word and, as far as the screen is concerned, nothing happens.

   So the area is brought up, and only when it is not already standing there:
   on a short reading everything fits, and a page that jogs on every click
   would be answering a question nobody asked. */
/* After the window has grown to what it holds, not before: scrolled at once,
   the area lay below the edge the window was still growing past, the sheet
   scrolled to it and the growing window scrolled it straight back — a jolt,
   twice per pick. Once the window has its size the area is usually in view
   and nothing scrolls at all. */
async function revealMarked() {
  await settled();
  const area = sheet.querySelector(`[data-section="${MARKED}"]`);
  if (!area) return;
  const box = area.getBoundingClientRect();
  const frame = sheet.getBoundingClientRect();
  /* A pixel of slack. Scrolled to the very bottom the area sits exactly on
     the edge, and measured against a sub-pixel it reads as one pixel short —
     which would send the window scrolling to where it already is. */
  if (box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1) return;
  /* Its end, which is the part that was below the fold — unless the answer is
     taller than the window has room for. Then there is no showing all of it,
     and what is worth showing is the beginning: the word and what it means.
     The rest is a scroll away, which the end of a long answer is not. */
  const block = box.height > frame.height ? "start" : "end";
  area.scrollIntoView({ block, behavior: "smooth" });
}

/* The text a word was picked out of: a panel's, a line of a dictionary
   entry, or the sentence a short text was looked up in. */
const pickedText = (choice, panel, reading) =>
  choice.inSentence ? reading.sentence?.text
  : choice.entry == null ? panel?.text
  : panel?.alternatives?.[choice.entry]?.text;

/* Picking a word. While the pointer is still down only the frame moves — the
   question is asked once, when it is released. */
async function pick(choice) {
  if (!current || !current.panels.length) return;
  const panel = current.panels[choice.panel];
  /* In short mode a translation panel holds lines rather than a text, and a
     word picked there is picked out of its line. */
  const from = pickedText(choice, panel, current);
  if (!from) return;

  const term = from.slice(choice.start, choice.end).trim();
  /* Something new picked is something to read: its area opens again. */
  current.folded?.delete(MARKED);
  if (choice.dragging) {
    pointerDown = true;
    /* What was selected elsewhere before is not what ⌘C should copy now. */
    window.getSelection?.()?.removeAllRanges();
    /* A drag fires on every pointer move. Redrawing only when the range
       really changed keeps it from rebuilding the whole sheet dozens of
       times on the way. */
    const before = current.selection;
    if (before && before.panel === choice.panel && before.entry === choice.entry
        && !before.inSentence === !choice.inSentence && before.start === choice.start && before.end === choice.end) return;
    current.selection = { ...choice, term };
    current.markedTrail = null;
    current.marked = null;
    /* Already the state the release will put it in: said as "nothing found"
       for the moment between press and release, the area flashed a sentence
       that was about to be untrue. Where the release asks nothing — no model
       — it says so then. */
    current.markedStatus = term && currentLlm ? "working" : "";
    draw();
    return;
  }
  current.selection = { ...choice, term };
  current.markedTrail = null;
  if (!term || !currentLlm) { draw(); revealMarked(); return; }

  current.marked = null;
  current.markedStatus = "working";
  draw();
  revealMarked();

  const sourceCode = current.panels[0].code;
  const others = otherPanels(choice.panel, sourceCode, settings.languages)
    .map((index) => current.panels[index])
    .filter(Boolean)
    .map((entry) => ({ code: entry.code, text: entry.text }));

  /* A single word the aligner has a place for in both other panels is not
     asked about: an expression of several words is, like a term. */
  const places = wordCount(term) === 1 && current.links
    ? otherPanels(choice.panel, sourceCode, settings.languages)
      .filter((index) => current.panels[index])
      .map((index) => fragmentsAcross(current.links, current.panels.map((entry) => entry.text), choice.panel,
        { start: choice.start, end: choice.end }, index).join(" + "))
    : [];
  const knownSpot = places.length && places.every(Boolean) ? `${places[0]} | ${places[1] || "-"}` : "";

  const asked = term;
  try {
    const marked = await waitedOn(() => explainMarked(currentLlm, {
      spot: knownSpot,
      term,
      text: from,
      source: askedLanguage(panel),
      reader: settings.languages[0],
      others,
      /* In short mode the other panels hold a list of translations rather
         than a sentence, so there is no text to find the word in over there
         and the spot question would be asked about a hyphen. */
      withoutSpot: !!current.short,
      /* The paragraph as soon as it is whole, with the heading saying the
         markings are still being looked for. */
      onParagraph: (paragraph) => {
        if (current.selection?.term !== asked) return;
        current.marked = paragraph;
        current.markedStatus = "linking";
        draw();
        revealMarked();
      },
    }));
    /* A slower answer to a word the reader has already left must not
       overwrite the newer one. */
    if (current.selection?.term !== asked) return;
    const shown = current.marked;
    /* Who explained it and who placed it in the other panels, for the
       heading's hint. */
    const credited = marked && { ...marked, model: settings.model || "", assignedBy: knownSpot ? "aligner" : current.short ? "" : "model" };
    current.marked = credited && shown?.moreStatus !== undefined
      ? { ...credited, more: shown.more, moreStatus: shown.moreStatus,
          examples: shown.examples, exampleStatus: shown.exampleStatus }
      : credited;
    current.markedStatus = "";
  } catch (error) {
    current.marked = null;
    current.markedStatus = faultOf(error);
  }
  draw();
  /* Again, because the answer is taller than the word that stood in its
     place while it was being waited for. */
  revealMarked();
}

backButton.addEventListener("click", () => goTo(place - 1));
forwardButton.addEventListener("click", () => goTo(place + 1));
settingsButton.addEventListener("click", openSettingsWindow);
/* A blank sheet to write in, which is what the shortcut pressed with nothing
   selected gives — reachable without the shortcut, because the window is
   often already in front. What stood there before is one chevron away. */
freshButton.addEventListener("click", () => { startFresh(); say(""); });
/* The same as Escape and as the close button every other window has: the
   window goes away, the app stays. */
closeButton.addEventListener("click", () => { forgetPointer(); hideWindow(); });

/* The pin says what a click on it will do, and shows what it is. */
function showPin() {
  const name = withKey(settings.pinned ? text.unpinWindow : text.pinWindow, WINDOW_KEYS.pin);
  pinButton.querySelector(".pill-label").textContent = name;
  pinButton.setAttribute("aria-label", name);
  pinButton.setAttribute("aria-pressed", String(settings.pinned));
}
/* Kept in the settings file so it outlasts the app. Written over what the
   file holds now, not over this window's copy, and the settings window
   leaves it alone in turn (settings-window.js). */
async function togglePin() {
  settings = await saveSettings({ ...(await loadSettings()), pinned: !settings.pinned });
  showPin();
  applyPresence(settings);
}
pinButton.addEventListener("click", togglePin);
/* What every program on this system opens its settings with, and the key a
   window lying over somebody else's full screen has to answer to. Escape puts
   it away rather than ending anything: a reading still being worked out goes
   on, and the window comes back to it. */
document.addEventListener("keydown", (event) => {
  if (event.key === "," && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    openSettingsWindow();
    return;
  }
  if (event.key.toLowerCase() === "c" && (event.metaKey || event.ctrlKey) && copyPicked()) {
    event.preventDefault();
    return;
  }
  if (event.key === "." && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    togglePin();
    return;
  }
  if (event.key === "Escape") {
    /* A card on screen takes the key itself and stops it there, so this is
       reached only when there is none. */
    event.preventDefault();
    hideWindow();
  }
});

/* ⌘C on a word picked out of a panel. Picking is not the system's selection
   — the panels take the pointer for themselves — so the system has nothing
   to copy there. A selection of its own, in the field or in an explanation,
   stays the system's. */
function copyPicked() {
  const term = current?.selection?.term;
  if (!term) return false;
  const active = document.activeElement;
  if (active?.matches?.("textarea, input")) return false;
  if (String(window.getSelection?.() || "")) return false;
  copyText(term);
  return true;
}

/* The other window holds the same settings, so a change there has to arrive
   here. Closing it counts as a change: the recorder lets go of the shortcut
   while its field has focus, and a window closed at that moment would leave
   the app holding nothing. */
await onSettingsChanged(async () => {
  settings = await loadSettings();
  apiKey = await loadApiKey();
  /* Fewer kept from now on: the oldest go at once, not with the next
     reading. */
  const shown = showing();
  dropOldest(history, settings, shown);
  place = shown ? history.indexOf(shown) : history.length;
  applyLanguage();
  applyPresence(settings);
  await applyShortcut();
  tools = await makeTools();
  /* A word picked in a kept reading is asked about with the endpoint that is
     configured now, not the one that was configured when it was read. */
  currentLlm = (await backends()).llm;
  draw();
  checkPermission();
});

/* The shortcut, and what arrives through it. The selection is read before
   the window comes forward — the shell sees to that, because by the time this
   code runs the window is already in front and the focused element would be
   the original field. */
await applyShortcut();
await onCapture({
  async onText(selection) {
    if (selection.route === "copied") copiedOnce = true;
    source = selection.source || 0;
    edited = null;
    draft = selection.text;
    /* A program may answer with one character of a Chinese word as the word
       under the pointer: the text around it says which word that is. */
    if (selection.route === "pointer-word" && selection.context) {
      const { text: around, at } = selection.context;
      const word = around.slice(at, at + selection.text.length) === selection.text
        ? wordAround(around, at, at + selection.text.length)
        : null;
      if (word && word.end - word.start > selection.text.length) {
        selection = { ...selection, text: around.slice(word.start, word.end), context: { text: around, at: word.start } };
        draft = selection.text;
        lightUp(word.start, word.end);
      }
    }
    /* The sentence under the pointer arrives as the word the pointer was on
       and the text around it; the sentence is cut out of that here, read as
       a text of its own, and lit up where it stands. */
    let stretch = null;
    if (selection.route === "pointer-sentence") {
      const sentence = sentenceUnder(selection.context, selection.text.length);
      if (!sentence) return;
      draft = sentence.text;
      lightUp(sentence.start, sentence.end);
      stretch = sentence;
    } else if (selection.context && wordCount(selection.text) > SHORT_MAX_WORDS) {
      stretch = selectionSpan(selection.context, selection.text);
    }
    /* One to three words come with the text around them, and their sentence
       goes along where the reader switched that on (sentence.js). */
    lookup = settings.withSentence && selection.context
      && selection.route !== "pointer-sentence" && wordCount(selection.text) <= SHORT_MAX_WORDS
      ? await sentenceFor(selection.text, selection.context, { settings, ...(await backends()) }).catch(() => null)
      : null;
    editing = false;
    current = null;
    walk = null;
    translate();
    /* The reading it starts from is the one just put on screen. */
    startWalk(selection, stretch);
    if (walk && showing()?.draft === draft.trim()) {
      walk.entries[0] = showing();
      draw();
    } else {
      walk = null;
    }
    await appear();
  },
  /* Nothing came back. Nothing selected, or nothing new copied, brings back
     what was on screen when the window was put away: a reader pressing the
     shortcut without a selection wants the window back, and a blank sheet is
     one button away. Anything else leaves the window ready for the text to
     be pasted in. */
  async onFailed(reason) {
    if (reason === "empty") return appear();
    if (reason === "nothing-copied") {
      if (!copiedOnce && settings.hotkey) say(text.copyFirst(hotkeyLabel(settings.hotkey, await keyLayout)));
      return appear();
    }
    source = 0;
    startFresh();
    say(text.captureFailed);
    await appear();
  },
});

/* The card shortcut, and the menu's card entry. What was selected goes on
   the side of its language — found the way a reading finds it — and the
   card window opens with it; with nothing selected, blank. The reading
   window is not brought forward: the card is what was asked for.

   The window opens at once, with the text on the word side and a line
   saying the language is being found: finding it may take the model a
   second, and a card that waits for that is a shortcut that seems not to
   have been heard. The answer then replaces the card, unless another card
   has taken the window in the meantime. */
async function openFreeCard(selected) {
  const reader = settings.languages[0];
  const title = windowTitle(text.cardCreate);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const build = (detected) => {
    const { choices, preset } = cardLanguages(settings, detected);
    return { ...freeCard({ text: selected, detected, reader, choices, preset }), id };
  };
  if (!selected) return openCard(title, build(""));

  await openCard(title, { ...build(""), detecting: true });
  let detected = "";
  try {
    const { translation, llm, identifier } = await backends();
    detected = (await detectLanguage(selected, {
      languages: settings.languages, reader, translation, llm, identifier,
    })).code;
  } catch {
    /* Not named: the text goes on the word side, as any foreign word. */
  }
  await updateCard(build(detected));
}

await onCardCapture({
  onText: (selection) => openFreeCard(String(selection.text || "").trim()),
  onFailed: () => openFreeCard(""),
  onBlank: () => openFreeCard(""),
});

/* The window shown once the page has drawn what it holds and the window has
   its size — after the shortcut (set_shortcut in the shell), and when the
   menu bar symbol or the Dock asks for it (ask_to_show). */
/* Where the pointer last was over this page. A window shown again is sent a
   move at that same place before the real pointer has said anything — which
   is what kept the close button's label up when the close button was what
   put the window away. Only a move somewhere else is the pointer. */
let lastPointer = null;
window.addEventListener("pointermove", (event) => {
  const moved = !lastPointer
    || Math.abs(event.clientX - lastPointer.x) > 2
    || Math.abs(event.clientY - lastPointer.y) > 2;
  lastPointer = { x: event.clientX, y: event.clientY };
  if (moved) document.documentElement.classList.remove("pointer-stale");
}, true);

function forgetPointer() {
  /* And a symbol button keeps the focus its click gave it. Shown again by a
     key press, with no text field to take the focus instead, that button
     counts as focused from the keyboard and shows its label. */
  if (document.activeElement?.closest?.(".icon")) document.activeElement.blur();
  document.documentElement.classList.add("pointer-stale");
}

async function appear(fresh = false) {
  forgetPointer();
  if (fresh) { startFresh(); say(""); }
  try {
    await fitNow();
  } finally {
    /* Shown transparent, and made visible once the page has painted: hidden,
       it paints nothing, and the first frame would be the reading it was put
       away with. Two frames — the first is the one being laid out. */
    await showWindow({ veiled: true });
    focusDraft();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await unveilWindow();
    /* Once more now that it can be seen: hidden, the window's frame may not
       have been measurable (platform/windows.js). */
    fitSoon();
  }
}

/* The window comes back rather than being built again — it hides instead of
   closing — so the pairs are warmed every time it appears, and once now for
   the time it was started. The helper takes its sessions with it when it
   idles out, which is what makes the second and later times worth anything. */
await onWindowShown(() => { forgetPointer(); warmSoon(); checkPermission(); });
await onAppearAsked(appear);
await onFreshAsked(() => { startFresh(); say(""); });
warmSoon();
checkPermission();

applyLanguage();
applyPresence(settings);
draw();
focusDraft();

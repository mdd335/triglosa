/* The settings.

   Kept short on purpose: every entry here is a decision pushed onto the user,
   so anything that can be worked out instead of asked is worked out. A few
   short groups, because nine unlabelled rows in a column is a list and not a
   form — the languages, who translates, what gets shown, the model, the one
   key combination and the flashcards.

   The key is the one field that is not part of the settings object. It goes
   to the system's key store, so it arrives and leaves through its own pair of
   callbacks rather than through onChange. */

import { onWindows } from "../system.js";
import {
  DEFAULT_LEVEL,
  ENDPOINT_PRESETS,
  FIRST_LANGUAGES,
  LEVELS,
  APP_ICONS,
  CARD_MODES,
  HOTKEYS,
  SHOW_MODES,
  TRANSLATORS,
  choosableLanguages,
  collapsePairs,
  neededPairs,
} from "../settings.js";
import { displayName } from "../languages/index.js";
import { createLlmBackend } from "../platform/llm.js";
import {
  HELPER_URL,
  PAIR_DOWNLOADABLE,
  PAIR_INSTALLED,
  PAIR_UNSUPPORTED,
  createTranslationBackend,
} from "../platform/translation.js";
import {
  appFetch,
  appVersion,
  ensureTranslationHelper,
  openUrl,
  openLanguageSettings,
  prepareLanguages,
} from "../platform/env.js";
import {
  accessibilityGranted,
  keyLabels,
  openAccessibilitySettings,
  requestAccessibility,
  takenShortcuts,
} from "../platform/capture.js";
import { registerShortcuts } from "../platform/shortcut.js";
import { ANKICONNECT_CODE, createAnkiBackend } from "../platform/anki.js";
import { CARD_FIELDS, guessFieldMap } from "../card.js";
import { hotkeyFrom, hotkeyLabel, shortcutTaken } from "../hotkey.js";
import { faultOf } from "../faults.js";
import { CAPTURE_CODE_URL, HELP_URL, ISSUES_URL, MODEL_HELP_URL, PROJECT_URL, checkForUpdate } from "../updates.js";
import { faultText, labels } from "./labels.js";
import { keyHint } from "../platform/keychain.js";
import { element, field, group, reportOn, select, secretInput, textInput } from "./elements.js";

/* Asked once for the whole session rather than once per rendering. Changing a
   language redraws this view, and a pair that was asked about before must not
   be asked about again. */
let device = null;
/* Whether the system's download prompt has been asked for in this window's
   life. A download takes minutes and macOS shows nothing of it here, so once
   asked for, a pair still missing is said to be on its way — and how to ask
   again, for a reader who closed the system's prompt. */
let requested = false;

/* The keyboard as it is right now: what is written on each key, and what the
   system already holds. Asked once for the same reason, and filled in after
   the view is first drawn — a reader who swaps their keyboard layout while
   this window is open is not a case worth carrying state for. */
let keyboard = { layout: null, taken: [] };

export function settingsView({ settings, apiKey }, { onChange, onKeyChange }) {
  const reader = settings.languages[0];
  const text = labels(reader);
  const view = element("div", "settings");

  const named = (code) => ({ value: code, label: displayName(code, reader) || code });

  /* The list is ordered, and the order carries meaning: first the language
     explanations are written in, then the ones being learned.

     Choosing a language that already stands somewhere else swaps the two.
     Anything else silently throws one away — picking the second language as
     the first would leave a one-language list, which is not a setting the
     app can run on. */
  const change = (index, code) => {
    const next = settings.languages.slice();
    if (!code) {
      next.length = index;
    } else {
      const already = next.indexOf(code);
      if (already !== -1 && already !== index) next[already] = next[index];
      next[index] = code;
    }
    onChange({ ...settings, languages: next.filter(Boolean) });
  };

  /* How far along the reader is. Levels are kept for every language they
     ever set, so switching away and back finds the same answer. */
  const setLevel = (code, level) =>
    onChange({ ...settings, levels: { ...settings.levels, [code]: level } });

  const levelSelect = (code) => {
    const node = select(
      LEVELS.map((level) => ({ value: level, label: `${level} · ${text.levelNames[level]}` })),
      settings.levels[code] || DEFAULT_LEVEL,
    );
    node.className = "level short";
    node.addEventListener("change", () => setLevel(code, node.value));
    return node;
  };

  /* A language and how far along the reader is in it belong on one line:
     the level is a property of that language, not a setting of its own. */
  const languageRow = (control, code) => {
    if (!code) return control;
    const row = element("div", "with-level");
    row.append(control, levelSelect(code));
    return row;
  };

  /* ---- the languages ---- */

  view.append(group(text.groupLanguages));

  const first = select(FIRST_LANGUAGES.map(named), settings.languages[0]);
  first.classList.add("short");
  first.addEventListener("change", () => change(0, first.value));
  view.append(field({ label: text.firstLanguage, control: first }));

  const second = select(choosableLanguages(settings.languages[0]).map(named), settings.languages[1]);
  second.classList.add("short");
  second.addEventListener("change", () => change(1, second.value));
  view.append(field({
    label: text.secondLanguage,
    control: languageRow(second, settings.languages[1]),
  }));

  const thirdOptions = [{ value: "", label: text.noThird }].concat(
    choosableLanguages(settings.languages[0])
      .filter((code) => code !== settings.languages[1])
      .map(named),
  );
  const third = select(thirdOptions, settings.languages[2] || "");
  third.classList.add("short");
  third.addEventListener("change", () => change(2, third.value));
  view.append(field({
    label: text.thirdLanguage,
    control: languageRow(third, settings.languages[2]),
  }));

  /* ---- the model ---- */

  view.append(group(text.groupModel));

  /* What the whole group is for, and — for anyone who has never fetched an
     API key — where the long answer is. The answer itself belongs to setting
     the app up rather than to using it, so it is a section of the README and
     not three paragraphs pushing these three fields off the screen. A link
     that opens it: somebody who downloaded the app has no README beside it. */
  const modelHint = element("p", "hint group-hint", `${text.modelIntro} ${text.modelHelpAsk} `);
  const guide = element("button", "inline-link", text.modelHelpLink);
  guide.type = "button";
  guide.addEventListener("click", () => openUrl(MODEL_HELP_URL));
  modelHint.append(guide);
  view.append(modelHint);

  const endpoint = textInput(settings.endpoint, ENDPOINT_PRESETS[0].endpoint);
  const endpointRow = element("div", "with-presets");
  endpointRow.append(endpoint);
  for (const preset of ENDPOINT_PRESETS) {
    const button = element("button", "quiet", preset.label);
    button.addEventListener("click", () => {
      endpoint.value = preset.endpoint;
      onChange({ ...settings, endpoint: preset.endpoint });
    });
    endpointRow.append(button);
  }
  endpoint.addEventListener("change", () => onChange({ ...settings, endpoint: endpoint.value }));
  view.append(field({ label: text.endpoint, hint: text.endpointHint, control: endpointRow }));

  const model = textInput(settings.model);
  model.addEventListener("change", () => onChange({ ...settings, model: model.value }));
  view.append(field({ label: text.model, hint: text.modelHint, control: model }));

  /* The key never reaches the settings file, and it is never shown back
     either. The field stands empty and its placeholder carries the last four
     characters of what is stored — enough to tell "saved" from "empty" and
     nothing more. Typing into it replaces the key; the button next to it
     forgets it. */
  const key = secretInput(apiKey ? keyHint(apiKey) : text.apiKeyEmpty);
  let typed = null;
  key.addEventListener("input", () => { typed = key.value.trim(); });
  /* A store that refuses says so under the field: a key that silently did
     not arrive is found only later, as a refusal from the model. */
  const keyFailed = element("p", "hint failed");
  key.addEventListener("change", async () => {
    if (typed === null) return;
    keyFailed.textContent = "";
    try {
      await onKeyChange(typed);
    } catch (error) {
      keyFailed.textContent = text.keySaveFailed(String(error?.message || error || ""));
    }
  });
  const keyRow = element("div", "with-presets");
  keyRow.append(key);
  if (apiKey) {
    const forget = element("button", "quiet", text.forgetKey);
    forget.addEventListener("click", async () => {
      key.value = "";
      typed = null;
      await onKeyChange("");
    });
    keyRow.append(forget);
  }
  const keyField = field({ label: text.apiKey, hint: text.apiKeyHint, control: keyRow });
  keyField.append(keyFailed);
  view.append(keyField);

  /* Saying what answered saves half the support traffic: "nothing happens" and
     "the address is right but no model is loaded" look identical otherwise.
     The test uses whatever stands in the fields right now, not what was last
     saved — otherwise a corrected address tests the old one. */
  const test = element("button", null, text.testConnection);
  const result = element("p", "hint");
  test.addEventListener("click", async () => {
    result.textContent = text.testing;
    try {
      const backend = createLlmBackend(
        {
          endpoint: endpoint.value,
          apiKey: typed === null ? apiKey : typed,
          model: model.value,
        },
        await appFetch(),
      );
      const { chosen } = await backend.test();
      result.textContent = text.testOk(chosen);
    } catch (error) {
      /* The whole point of this button is to say what is wrong, so it says it
         the way the rest of the window would: in the reader's language, with
         what to do about it. */
      result.textContent = faultText(reader, faultOf(error));
    }
  });
  const testRow = element("div", "field");
  testRow.append(test, result);
  view.append(testRow);

  /* ---- the translations ---- */

  view.append(group(text.groupTranslation));
  /* Apple's translation is an extra: the model translates by default, and
     the device is set up here only by a reader who wants it fast or
     offline. So the group says that first, then how to set it up, then who
     goes first. */
  /* What the device can translate, and what it cannot yet. The three answers
     are different in kind and only one of them is actionable: a pair that is
     merely not downloaded can be fetched from here, while a pair the device
     does not know never will be. Both fall back to the model, so neither is
     fatal — this only says which is which. */
  /* On Windows there is no translation on the device: the model is the only
     translator, and the group holds nothing but the hover. */
  const onDevice = !onWindows();
  const pairs = element("p", "hint");
  pairs.textContent = text.pairsChecking;
  const pairsRow = element("div", "field pairs");
  pairsRow.append(element("label", null, text.devicePairs), element("p", "hint", text.deviceIntro), pairs);
  if (onDevice) view.append(pairsRow);
  /* Who goes first, and that the other steps in. */
  const translator = select(
    TRANSLATORS.map((value) => ({ value, label: text.translatorModes[value] })),
    settings.translator,
  );
  translator.addEventListener("change", () => onChange({ ...settings, translator: translator.value }));
  const translatorField = field({ label: text.translator, hint: text.translatorHint, control: translator });
  if (settings.translator === "model" && !settings.endpoint) {
    translatorField.append(element("p", "hint", text.translatorNoModel));
  }
  if (onDevice) view.append(translatorField);
  /* What a word became, on hover — a translation too, of one word at a time,
     and the last thing this group has to say. */
  view.append(field({
    label: text.glance,
    hint: text.glanceHint,
    control: switchFor(settings.glance, text, (on) => onChange({ ...settings, glance: on })),
  }));
  let fetchButton = null;
  let gaps = false;
  if (onDevice) showPairs();

  /* Asked again when the reader comes back to this window — from System
     Settings, or from the system's own prompt — and only while something was
     missing: that is when the answer can have changed. Not on a timer. */
  const recheck = () => {
    if (!pairs.isConnected) return window.removeEventListener("focus", recheck);
    if (!gaps) return;
    device = null;
    showPairs();
  };
  if (onDevice) window.addEventListener("focus", recheck);

  async function showPairs() {
    device = device || createTranslationBackend({ helperUrl: HELPER_URL }, await appFetch());
    /* Not a bare running() check: a helper left over from an older build
       holds the port and answers in a shape this window no longer reads.
       Retiring it is part of finding out whether the device is there. */
    if (!(await ensureTranslationHelper(device))) {
      pairs.textContent = text.pairsNoDevice;
      return;
    }
    const name = (code) => displayName(code, reader) || code;
    const missing = { downloadable: [], unsupported: [] };
    for (const pair of neededPairs(settings.languages)) {
      const status = await device.pairStatus(pair.from, pair.to);
      if (status === PAIR_INSTALLED || !status) continue;
      if (status === PAIR_DOWNLOADABLE) missing.downloadable.push(pair);
      else if (status === PAIR_UNSUPPORTED) missing.unsupported.push(pair);
    }
    /* The view is thrown away and rebuilt on every change, so an answer that
       arrives after that belongs to a window nobody is looking at. */
    if (!pairs.isConnected) return;
    const written = (entries) =>
      collapsePairs(settings.languages, entries)
        .map((e) => (e.language ? name(e.language) : text.pairArrow(name(e.from), name(e.to))))
        .join(", ");
    const lines = [];
    if (missing.downloadable.length) {
      lines.push(text.pairsDownloadable(written(missing.downloadable)));
      if (requested) lines.push(text.pairsOnTheirWay);
    } else {
      requested = false;
    }
    if (missing.unsupported.length) lines.push(text.pairsUnsupported(written(missing.unsupported)));
    pairs.textContent = lines.length ? lines.join(" ") : text.pairsAllInstalled;
    gaps = missing.downloadable.length > 0;
    fetchButton?.remove();
    fetchButton = null;
    if (gaps) offerDownload(missing.downloadable);
  }

  /* The system's own download prompt, asked for by the app. One request per
     language rather than per direction: fetching German → Russian installs
     Russian in every direction it takes part in.

     Where the prompt cannot be shown — during development the app is not a
     bundle and macOS gives it no window — the settings pane is opened
     instead, with the sentence that says what to look for there. */
  function offerDownload(downloadable) {
    /* Both ends of every gap, minus the reader's own language, which is the
       one the request is made from. A language already installed costs
       nothing to ask for — the prompt does not appear for it. */
    const wanted = [...new Set(downloadable.flatMap((pair) => [pair.from, pair.to]))]
      .filter((code) => code !== settings.languages[0]);
    const button = element("button", null, requested ? text.pairsFetchAgain : text.pairsFetch);
    fetchButton = button;
    button.addEventListener("click", () =>
      reportOn(button, async () => {
        const shown = await prepareLanguages(settings.languages[0], wanted, text.pairsPrompt);
        if (!shown) {
          await openLanguageSettings();
          throw new Error(text.pairsBySettings);
        }
        requested = true;
        /* Whatever was fetched, the answers from before are stale. */
        device = null;
        showPairs();
      }, text.pairsFetched));
    pairsRow.append(button);
  }

  /* ---- what gets shown ---- */

  view.append(group(text.groupSections));

  /* The same places a card is offered by, and the third left out where there
     is no third language, as it is there. */
  const showRow = (section, label, hint) => {
    const names = section === "terms" ? text.termModes : text.showModes;
    const node = select(
      SHOW_MODES.filter((mode) => mode !== "third" || settings.languages[2])
        .map((mode) => ({ value: mode, label: names[mode] })),
      settings.show[section],
    );
    node.addEventListener("change", () =>
      onChange({ ...settings, show: { ...settings.show, [section]: node.value } }));
    view.append(field({ label, hint, control: node }));
  };
  showRow("verbs", text.verbs, text.showVerbsHint);
  showRow("terms", text.terms, text.showTermsHint);
  view.append(field({
    label: text.underline,
    hint: text.underlineHint,
    control: switchFor(settings.underline, text, (on) => onChange({ ...settings, underline: on })),
  }));

  /* ---- the window ---- */

  view.append(group(text.groupWindow));
  view.append(field({
    label: text.closeOnBlur,
    control: switchFor(settings.closeOnBlur, text, (on) => onChange({ ...settings, closeOnBlur: on })),
  }));
  view.append(field({
    label: text.fitWindow,
    control: switchFor(settings.fitWindow, text, (on) => onChange({ ...settings, fitWindow: on })),
  }));
  /* On a Mac the menu bar, the Dock or both. On Windows the symbol in the
     notification area always stays, and the question is whether the open
     window also has a taskbar button — the Dock's counterpart, "both". */
  const iconChoices = onWindows() ? APP_ICONS.filter((value) => value !== "dock") : APP_ICONS;
  const icons = select(
    iconChoices.map((value) => ({ value, label: text.appIcons[value] })),
    iconChoices.includes(settings.appIcon) ? settings.appIcon : "both",
  );
  icons.classList.add("short");
  icons.addEventListener("change", () => onChange({ ...settings, appIcon: icons.value }));
  view.append(field({ label: text.appIcon, control: icons }));

  /* ---- the shortcuts ---- */

  view.append(group(text.groupShortcuts));
  view.append(element("p", "hint group-hint", text.shortcutsLead));

  /* One field per combination, what it does said under it like every other
     row's hint. What pressing it takes along depends on the permission below
     them, so the two that read a selection have a second line for when there
     is none. */
  const shortcuts = [
    { key: "hotkey", label: text.hotkey, lead: text.hotkeyLead, selected: text.hotkeyLeadSelected },
    { key: "freshHotkey", label: text.freshHotkey },
    { key: "cardHotkey", label: text.cardHotkey, lead: text.cardHotkeyLead, selected: text.cardHotkeyLeadSelected },
  ].map((one) => ({ ...one, ...shortcutField(one, { settings, text, onChange }) }));
  for (const one of shortcuts) view.append(one.row);

  /* Windows asks no permission for reading a selection, so there is nothing
     to explain and the shortcuts always take the selection along. */
  const leads = (granted) => {
    for (const one of shortcuts) if (one.selected) one.lead.textContent = granted ? one.selected : one.lead0;
  };
  if (onWindows()) leads(true);
  else view.append(permissionField(text, leads));

  /* Asked the first time this view is built, and the fields written again
     once the answers are in — a field would otherwise show a key by its
     American name until something else happened to redraw it. */
  if (!keyboard.layout) {
    Promise.all([keyLabels(), takenShortcuts()]).then(([layout, taken]) => {
      if (!layout) return;
      keyboard = { layout, taken: taken || [] };
      if (view.isConnected) for (const one of shortcuts) one.refresh();
    });
  }

  /* ---- the flashcards ---- */

  view.append(group(text.groupCards));
  /* By place in the reader's list, like the verbs and the terms. A third that
     is not set makes its own answer pointless, so it is not offered. */
  const modes = CARD_MODES.filter((mode) => mode !== "third" || settings.languages[2]);
  const howMany = select(
    modes.map((mode) => ({ value: mode, label: text.cardModes[mode] })),
    settings.cards.mode,
  );
  howMany.addEventListener("change", () =>
    onChange({ ...settings, cards: { ...settings.cards, mode: howMany.value } }));
  view.append(field({
    label: text.cardsEnabled,
    hint: text.cardsEnabledHint,
    control: howMany,
  }));
  if (settings.cards.mode !== "never") view.append(ankiFields(settings, text, onChange));

  view.append(...aboutFields(text));

  return view;
}

/* One combination's field. What is written down is the physical key rather
   than the character on it, so the combination survives a change of keyboard
   layout — see hotkey.js. Every change here is registered straight away; the
   window says so when the shell would not take it. */
function shortcutField({ key, label, lead }, { settings, text, onChange }) {
  const input = textInput("", text.hotkeyEmpty);
  input.readOnly = true;
  const shown = () => hotkeyLabel(settings[key], keyboard.layout);
  input.value = shown();
  const conflict = element("p", "hint");

  /* The shortcuts have to be let go of while one is being recorded. They are
     held system-wide, which means they are caught before this window ever
     sees the key — pressing the combination that is already set did nothing
     at all, and looked like a field that refuses certain keys. */
  let recorded = false;
  /* Nothing is accepted until the shell has actually let go. Started and not
     waited for, the first press after a click could still be swallowed by the
     combination this field is trying to replace. */
  let released = null;
  input.addEventListener("focus", () => {
    recorded = false;
    input.value = "";
    input.placeholder = text.hotkeyRecording;
    conflict.textContent = "";
    released = registerShortcuts({});
  });
  input.addEventListener("blur", () => {
    input.value = shown();
    input.placeholder = text.hotkeyEmpty;
    /* Only where nothing was recorded: a new combination is registered by
       the window itself, and taking the old ones back first would be a
       moment of holding the wrong one. */
    if (!recorded) registerShortcuts(settings);
  });
  input.addEventListener("keydown", async (event) => {
    /* Every key press while this field has focus belongs to the recording,
       including the ones the window would otherwise act on. */
    event.preventDefault();
    const pressed = hotkeyFrom(event, keyboard.layout);
    if (!pressed) return;
    await released;

    /* A combination somebody else holds is refused rather than stored. Taken
       globally, ⌘C would stop the reader copying in every program they own,
       and nothing about that failure would point back at this window. One of
       this app's own other two is refused as well: the shell would hold only
       one of them. */
    const taken = shortcutTaken(pressed, keyboard.taken);
    const mine = HOTKEYS.find((other) =>
      other !== key && settings[other] && settings[other].accelerator === pressed.accelerator);
    if (taken || mine) {
      input.value = hotkeyLabel(pressed, keyboard.layout);
      conflict.textContent = mine ? text.hotkeyTakenHere(HOTKEY_NAMES(text)[mine])
        : taken === "system" ? text.hotkeyTakenSystem : text.hotkeyTakenEverywhere;
      return;
    }
    recorded = true;
    input.blur();
    onChange({ ...settings, [key]: pressed });
  });
  const line = element("div", "with-presets");
  line.append(input);
  if (settings[key]) {
    const clear = element("button", "quiet", text.hotkeyClear);
    clear.addEventListener("click", () => onChange({ ...settings, [key]: null }));
    line.append(clear);
  }
  const row = field({ label, hint: lead, control: line });
  row.append(conflict);
  const refresh = () => {
    if (row.ownerDocument.activeElement !== input) input.value = shown();
  };
  return { row, lead0: lead, lead: row.querySelector(".hint"), refresh };
}

const HOTKEY_NAMES = (text) => ({ hotkey: text.hotkey, freshHotkey: text.freshHotkey, cardHotkey: text.cardHotkey });

/* What an update check found, kept past a redraw: every change in this window
   rebuilds the view, and the answer would otherwise vanish with it. */
let update = null;

/* Which version this is, whether there is a newer one, and the way to the
   project. The group the menu bar's update entry opens this window at — see
   showAbout in settings-window.js. */
function aboutFields(text) {
  const heading = group(text.groupAbout);
  heading.id = "about";

  const version = element("p", "hint");
  appVersion().then((value) => { version.textContent = value ? text.aboutVersion(value) : ""; });

  const result = element("p", "hint");
  const check = element("button", null, text.updatesCheck);
  check.className = "update-check";
  const download = element("button", "quiet", text.updatesDownload);
  const show = () => {
    download.remove();
    if (!update) return void (result.textContent = "");
    if (update.failed) return void (result.textContent = text.updatesFailed(update.status));
    if (!update.newer) return void (result.textContent = text.updatesNone);
    result.textContent = text.updatesFound(update.version);
    download.onclick = () => openUrl(update.url);
    buttons.append(download);
  };
  check.addEventListener("click", async () => {
    check.disabled = true;
    result.textContent = text.updatesChecking;
    try {
      update = await checkForUpdate(await appVersion(), await appFetch());
    } catch (error) {
      /* The number where GitHub answered with one; "Failed to fetch"
         explains nothing, so a request that never arrived gets no bracket. */
      update = { failed: true, status: error?.status || 0 };
    }
    check.disabled = false;
    if (row.isConnected) show();
  });
  const buttons = element("div", "with-presets");
  buttons.append(check);
  const row = element("div", "field");
  row.append(version, buttons, result, element("p", "hint", text.updatesHint));
  show();

  const links = element("div", "with-presets");
  for (const [label, url] of [[text.aboutProject, PROJECT_URL], [text.trayHelp, HELP_URL], [text.trayProblem, ISSUES_URL]]) {
    const link = element("button", "quiet", label);
    link.addEventListener("click", () => openUrl(url));
    links.append(link);
  }
  const linkRow = element("div", "field");
  linkRow.append(links);
  return [heading, row, linkRow];
}

/* A setting with two answers. The window has no switch of its own and one
   more shape is one more thing to look at; the lists beside it already read
   as "this, or that". */
function switchFor(on, text, apply) {
  const node = select(
    [{ value: "on", label: text.optionOn }, { value: "off", label: text.optionOff }],
    on ? "on" : "off",
  );
  node.className = "short";
  node.addEventListener("change", () => apply(node.value === "on"));
  return node;
}

/* What Anki reports about itself, asked once for the whole session rather
   than once per drawing: every change in this window redraws the view, and a
   deck list that is fetched again each time would flicker and could not hold
   a list open. Null means nobody has asked yet. */
let anki = null;

/* Anki, and the three questions it makes necessary — which deck, which note
   type, and which field of it takes which of the three lines.

   Nothing is asked until the reader switches the export on. Off, this is one
   line and one list: most readers have no Anki, and a card can be copied out
   without it. */
function ankiFields(settings, text, onChange) {
  const box = element("div", "anki");
  const config = settings.cards.anki;

  const save = (next) =>
    onChange({ ...settings, cards: { ...settings.cards, anki: { ...config, ...next } } });

  box.append(field({
    label: text.ankiEnabled,
    hint: text.ankiEnabledHint(ANKICONNECT_CODE),
    control: switchFor(config.enabled, text, (on) => save({ enabled: on })),
  }));
  if (!config.enabled) return box;

  const body = element("div", "anki-body");
  box.append(body);

  const backend = createAnkiBackend();

  const ask = async () => {
    const answering = await backend.answering();
    anki = {
      answering,
      decks: answering ? await backend.decks() : [],
      noteTypes: answering ? await backend.noteTypes() : [],
      /* Which note types the chosen deck is already built out of — the answer
         to the one question nobody has off the top of their head. Asked of
         the deck that is set now; choosing another asks again. */
      forDeck: config.deck,
      used: answering && config.deck ? await backend.noteTypesIn(config.deck) : [],
    };
    if (body.isConnected) draw();
  };

  function draw() {
    body.replaceChildren();
    if (!anki) {
      body.append(element("p", "hint", text.ankiSearching));
      ask();
      return;
    }
    if (!anki.answering) {
      body.append(element("p", "hint", text.ankiMissing));
      const buttons = element("div", "with-presets");
      const start = element("button", null, text.ankiLaunch);
      start.addEventListener("click", async () => {
        start.disabled = true;
        start.textContent = text.ankiStarting;
        await backend.start();
        anki = null;
        draw();
      });
      const again = element("button", "quiet", text.ankiRecheck);
      again.addEventListener("click", () => { anki = null; draw(); });
      buttons.append(start, again);
      body.append(buttons);
      return;
    }
    body.append(deckField(anki.decks, config, text, save, draw));
    /* A deck was chosen since this was last asked, and what the deck is built
       out of is the answer to the next question. */
    if (anki.forDeck !== config.deck) {
      anki = null;
      ask();
      body.append(element("p", "hint", text.ankiSearching));
      return;
    }
    body.append(noteTypeField(anki, settings, text, save, backend));
    if (config.noteType) body.append(mappingField(config, settings, text, save, backend));
  }

  draw();
  return box;
}

/* Whether the reader is typing a deck name rather than picking one. Not a
   setting: a half-typed name is not a deck, and a settings file has no use
   for the difference. It lasts as long as this window does. */
let typingDeck = false;

/* Any deck Anki reports, and a name that is not among them. A deck is created
   on first use, which saves a detour and takes nothing away — a note type
   never is, because that would reach into somebody's own card templates. */
function deckField(decks, config, text, save, redraw) {
  const row = element("div", "with-presets");

  /* A name Anki does not know is a name being typed, whether the reader
     started typing it this minute or set it in an older version. */
  if (typingDeck || (config.deck && !decks.includes(config.deck))) {
    const name = textInput(config.deck);
    /* Saved when the field is left, the way every other text field in this
       window is. */
    name.addEventListener("change", () => { typingDeck = false; save({ deck: name.value }); });
    row.append(name);
    const back = element("button", "quiet", text.ankiDeckList);
    back.addEventListener("click", () => { typingDeck = false; save({ deck: "" }); });
    row.append(back);
    return field({ label: text.ankiDeck, hint: text.ankiDeckHint, control: row });
  }

  const list = select(
    [{ value: "", label: "—" }]
      .concat(decks.map((name) => ({ value: name, label: name })))
      .concat([{ value: NEW_DECK, label: text.ankiNewDeck }]),
    config.deck,
  );
  list.addEventListener("change", () => {
    if (list.value !== NEW_DECK) return save({ deck: list.value });
    /* Nothing to save yet — there is no name. The field simply becomes one
       to type in. */
    typingDeck = true;
    redraw();
  });
  row.append(list);
  return field({ label: text.ankiDeck, hint: text.ankiDeckHint, control: row });
}

/* A value no deck can have, standing for "let me type one". */
const NEW_DECK = "\u0000new";

/* The note type decides which fields a card has, so choosing one has to bring
   its fields with it — and the mapping underneath is guessed from them right
   away. The reader sees the guess and changes it where it is wrong, which is
   the whole reason it is three lists and not a hidden rule.

   This is also the one question about Anki nobody has an answer to off the
   top of their head. Anki has one: whichever type the
   cards already in the deck use. So the types that deck is built out of are
   marked with how many of them there are, they stand at the top of the list,
   and where nothing is set yet the commonest is set — pick a deck and this
   question is answered without being asked. Where the deck is empty Anki
   cannot know either, and then the line underneath says where to look in
   Anki itself rather than pretending. */
function noteTypeField(anki, settings, text, save, backend) {
  const config = settings.cards.anki;
  const used = anki.used || [];
  const counted = new Map(used.map((entry) => [entry.noteType, entry.cards]));
  /* What the deck uses first, then everything else in Anki's own order. */
  const ordered = used.map((entry) => entry.noteType)
    .concat(anki.noteTypes.filter((name) => !counted.has(name)));

  const choose = async (noteType) => {
    if (!noteType) return save({ noteType: "", fields: { term: "", meaning: "", note: "" } });
    const names = await backend.fieldsOf(noteType);
    save({ noteType, fields: guessFieldMap(names, settings.languages) });
  };

  const list = select(
    [{ value: "", label: "—" }].concat(ordered.map((name) => ({
      value: name,
      label: counted.has(name) ? `${name} — ${text.ankiNoteTypeUsed(counted.get(name))}` : name,
    }))),
    config.noteType,
  );
  list.addEventListener("change", () => choose(list.value));

  const row = field({ label: text.ankiNoteType, hint: text.ankiNoteTypeHint, control: list });
  if (!config.deck) return row;
  if (used.length) {
    row.append(element("p", "hint", text.ankiNoteTypeFound(used[0].noteType)));
    /* Answered rather than asked. Only where nothing is set: a reader who
       chose another type on purpose does not get it taken away. */
    if (!config.noteType) choose(used[0].noteType);
  } else {
    row.append(element("p", "hint", text.ankiNoteTypeLook));
  }
  return row;
}

/* Three lists, one per field of a card. */
function mappingField(config, settings, text, save, backend) {
  /* Named generically here and by their language on the card itself. A
     setting covers every language the reader learns, and naming one of them
     would be right for one card in two. */
  const roles = [
    ["term", text.cardTerm],
    ["meaning", text.cardMeaning],
    ["note", text.cardNote],
  ];

  const draw = (names) => {
    row.replaceChildren();
    for (const [role, label] of roles) {
      const line = element("div", "mapping-row");
      line.append(element("span", "name", label));
      const list = select(
        [{ value: "", label: text.ankiNoField }]
          .concat(names.map((name) => ({ value: name, label: name }))),
        config.fields[role],
      );
      list.addEventListener("change", () =>
        save({ fields: { ...config.fields, [role]: list.value } }));
      line.append(list);
      row.append(line);
    }
  };

  const row = element("div", "mapping");
  const note = element("p", "hint");

  /* The names belong to the note type and are asked for once per drawing.
     Until they arrive the lists cannot be built at all — there is nothing to
     choose from — so the row stands empty for that moment. */
  draw([config.fields.term, config.fields.meaning, config.fields.note].filter(Boolean));
  backend.fieldsOf(config.noteType).then((names) => {
    if (!row.isConnected || !names.length) return;
    draw(names);
    /* Said rather than done quietly. The word is written into the note type's
       first field where no role points at it, because Anki judges emptiness
       there — and a reader who never mapped a field called "ID" should not
       have to work out why it filled itself. */
    const first = names[0];
    const claimed = CARD_FIELDS.some((role) => config.fields[role] === first);
    note.textContent = claimed ? "" : text.ankiFirstField(first);
  });
  const box = field({ label: text.ankiFields, hint: text.ankiFieldsHint, control: row });
  box.append(note);
  return box;
}

/* The one permission this app can ask for, and does not need. Without it the
   reader copies before pressing the shortcut; with it selecting is enough.
   Explained before the system asks: what it adds, that Triglosa uses it for
   those two things only, and where the code is that shows it — the system's
   own description of the permission sounds like a great deal more.

   It watches rather than asking once: the reader leaves for System Settings,
   turns the switch and comes back, and the window should already know. */
function permissionField(text, onGranted = () => {}) {
  const box = element("div", "field");
  box.append(element("label", null, text.permission));
  const why = element("p", "hint", text.permissionWhy);
  const trust = element("p", "hint", `${text.permissionTrust} `);
  const code = element("button", "inline-link", text.permissionCode);
  code.type = "button";
  code.addEventListener("click", () => openUrl(CAPTURE_CODE_URL));
  trust.append(code);
  const buttons = element("div", "with-presets");
  /* Whether it is on, under the buttons that change it. */
  const state = element("p", "hint");
  const note = element("p", "hint");
  box.append(why, trust, buttons, state, note);

  const draw = (granted, pending) => {
    onGranted(granted);
    buttons.replaceChildren();
    const open = element("button", "quiet", text.permissionOpen);
    open.addEventListener("click", () => openAccessibilitySettings());
    state.textContent = granted ? text.permissionHave : "";
    state.hidden = !granted;
    note.textContent = pending ? text.permissionPending : "";
    note.hidden = !pending;
    if (granted) {
      buttons.append(open);
      return;
    }
    const ask = element("button", null, text.permissionAsk);
    ask.addEventListener("click", async () => {
      await requestAccessibility();
      draw(false, true);
    });
    buttons.append(ask, open);
  };

  let granted = false;
  draw(false, false);

  /* Only redraw on a change: the two buttons must not lose a press to a
     rebuild happening underneath them. */
  const check = async () => {
    const now = await accessibilityGranted();
    if (now === granted) return;
    granted = now;
    draw(now, false);
  };

  /* The watcher asks whether it is still needed; the check itself only
     checks. Written the other way round, the first call — which happens
     before this node is in the document — read "not connected" and switched
     the watcher off, so the answer stayed at "not granted" for good. */
  const watch = setInterval(() => {
    if (!box.isConnected) return clearInterval(watch);
    check();
  }, 1500);
  check();

  return box;
}

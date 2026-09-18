import test from "node:test";
import assert from "node:assert";
import {
  DEFAULTS,
  DEFAULT_LEVEL,
  FIRST_LANGUAGES,
  ankiConfigured,
  choosableLanguages,
  firstStartLanguages,
  collapsePairs,
  offersCard,
  explanationsAvailable,
  levelFor,
  normalizeSettings,
  readerLanguage,
  showsSection,
} from "../../src/settings.js";
import { DEFAULT_HOTKEY, hotkeyFrom, hotkeyLabel, isHotkey } from "../../src/hotkey.js";
import { keyHint } from "../../src/platform/keychain.js";

test("a fresh install starts on two languages and nothing else", () => {
  const s = normalizeSettings(undefined);
  assert.deepStrictEqual(s.languages, DEFAULTS.languages);
  assert.strictEqual(s.endpoint, "");
  assert.deepStrictEqual(s.levels, {}, "no level until someone sets one");
  assert.strictEqual(s.show.verbs, "foreign", "not for the reader's own language");
  assert.strictEqual(s.cards.mode, "foreign", "a card for every language being learned");
  assert.strictEqual(s.cards.anki.enabled, false, "the export is a separate decision");
});

test("a settings file that was edited by hand cannot break the app", () => {
  const s = normalizeSettings({ languages: "de", endpoint: 7, cards: "yes", unknown: 1 });
  assert.deepStrictEqual(s.languages, DEFAULTS.languages);
  assert.strictEqual(s.endpoint, "");
  assert.strictEqual(s.cards.mode, "foreign");
  assert.strictEqual(s.cards.anki.enabled, false);
  assert.ok(!("unknown" in s), "unknown keys are dropped");
});

test("unsupported and repeated languages are dropped", () => {
  const s = normalizeSettings({ languages: ["de", "de", "xx", "es"] });
  assert.deepStrictEqual(s.languages, ["de", "es"]);
});

test("never more languages than there are panels", () => {
  const s = normalizeSettings({ languages: ["de", "en", "es", "fr"] });
  assert.strictEqual(s.languages.length, 3);
});

test("the first language has to be one explanations can be written in", () => {
  /* Arabic first would mean an interface read from right to left, which the
     window is not built for yet. */
  assert.deepStrictEqual(normalizeSettings({ languages: ["ar", "de"] }).languages, DEFAULTS.languages);
  assert.deepStrictEqual(normalizeSettings({ languages: ["es", "de"] }).languages, ["es", "de"]);
  assert.deepStrictEqual(normalizeSettings({ languages: ["ru", "en", "ar"] }).languages, ["ru", "en", "ar"]);
  assert.deepStrictEqual(FIRST_LANGUAGES, ["de", "en", "es", "fr", "it", "pt", "ru"]);
});

test("a first start reads in the system's language where it is a first language", () => {
  assert.deepStrictEqual(firstStartLanguages(["de-DE", "en-DE"]), ["de", "en"]);
  assert.deepStrictEqual(firstStartLanguages(["en-GB", "de-DE"]), ["en", "es"], "English keeps Spanish beside it");
  /* The first of the system's list that is a first language, not the first
     of the list: somebody with Dutch and then German reads German. */
  assert.deepStrictEqual(firstStartLanguages(["nl-NL", "de-AT"]), ["de", "en"]);
  assert.deepStrictEqual(firstStartLanguages(["ja-JP"]), ["en", "es"]);
  assert.deepStrictEqual(firstStartLanguages(["pt-BR"]), ["pt", "en"]);
  assert.deepStrictEqual(firstStartLanguages(["ar-SA", "fr-FR"]), ["fr", "en"], "Arabic is no first language yet");
  assert.deepStrictEqual(firstStartLanguages(undefined), DEFAULTS.languages);
  assert.deepStrictEqual(firstStartLanguages(["de_DE"]), ["de", "en"], "either separator");
});

test("the system's language is only what a missing choice falls back to", () => {
  const system = { systemLanguages: ["de-DE"] };
  assert.deepStrictEqual(normalizeSettings(undefined, system).languages, ["de", "en"]);
  assert.deepStrictEqual(normalizeSettings({ languages: ["en", "fr"] }, system).languages, ["en", "fr"]);
});

test("one language alone is not enough to show anything", () => {
  assert.deepStrictEqual(normalizeSettings({ languages: ["de"] }).languages, DEFAULTS.languages);
});

test("the other first-language option stays choosable as a foreign one", () => {
  const choices = choosableLanguages("de");
  assert.ok(choices.includes("en"), "reading German and learning English is ordinary");
  assert.ok(choices.includes("ar"));
  assert.ok(!choices.includes("de"));
});

test("switched on is not the same as set up", () => {
  /* Three answers to give, and a card has nowhere to go until all three are
     there — a note type without a field for the word itself would file an
     empty note. */
  const on = { cards: { anki: { enabled: true, deck: "Vokabeln", noteType: "Basic" } } };
  assert.strictEqual(normalizeSettings(on).cards.anki.enabled, true);
  assert.strictEqual(ankiConfigured(on), false, "no field for the word yet");
  const set = { cards: { anki: { ...on.cards.anki, fields: { term: "Front", meaning: "Back" } } } };
  assert.strictEqual(ankiConfigured(set), true);
  assert.strictEqual(ankiConfigured({ ...set, cards: { ...set.cards, mode: "both" } }), true);
});

/* Named by their place in the reader's list: the second language is usually
   the one being worked at, the third often read rather than learned. */
test("a card is offered for the languages the reader named", () => {
  const three = { languages: ["de", "es", "en"] };
  const forMode = (mode, code) => offersCard({ ...three, cards: { mode } }, code);

  assert.strictEqual(forMode("both", "de"), false, "never the reader's own");
  assert.strictEqual(forMode("both", "es"), true);
  assert.strictEqual(forMode("both", "en"), true);
  assert.strictEqual(forMode("second", "es"), true);
  assert.strictEqual(forMode("second", "en"), false);
  assert.strictEqual(forMode("third", "es"), false);
  assert.strictEqual(forMode("third", "en"), true);
  for (const code of ["de", "es", "en"]) assert.strictEqual(forMode("never", code), false);
});

/* A text in a language the reader never configured takes a panel of its own,
   and has no place in the list to be ruled out by. Under "both" they want a
   card for everything foreign; a narrower answer names which of their own
   languages, and this is not one of them. */
test("a language with no place in the list follows the widest answer only", () => {
  const three = { languages: ["de", "es", "en"] };
  assert.strictEqual(offersCard({ ...three, cards: { mode: "foreign" } }, "fr"), true);
  assert.strictEqual(offersCard({ ...three, cards: { mode: "second" } }, "fr"), false);
});

test("an older file that said yes or no keeps its answer", () => {
  assert.strictEqual(normalizeSettings({ cards: { enabled: true } }).cards.mode, "foreign");
  assert.strictEqual(normalizeSettings({ cards: { mode: "both" } }).cards.mode, "foreign", "both was every foreign language");
  assert.strictEqual(normalizeSettings({ cards: { enabled: false } }).cards.mode, "never");
});

test("a settings file that only ever named Anki keeps its deck", () => {
  /* The note type and the mapping were not questions that file could answer;
     they are guessed the first time the settings are opened. */
  const s = normalizeSettings({ anki: { enabled: true, deck: " Spanisch 5000 " } });
  assert.strictEqual(s.cards.anki.deck, "Spanisch 5000");
  assert.strictEqual(s.cards.anki.enabled, true);
  assert.strictEqual(s.cards.anki.noteType, "");
});

test("without an endpoint the explanations are locked, not broken", () => {
  assert.strictEqual(explanationsAvailable({}), false);
  assert.strictEqual(explanationsAvailable({ endpoint: "http://127.0.0.1:1234/v1" }), true);
});

test("the reader's language is the first one", () => {
  assert.strictEqual(readerLanguage({ languages: ["de", "es"] }), "de");
  assert.strictEqual(readerLanguage({}), "en");
});

/* The key is the one thing the user configures that must not travel with the
   settings file. Normalising drops it, so a key that reached the file by hand
   or by an older version does not get written back out again. */
test("a key never survives its way through the settings", () => {
  const s = normalizeSettings({ languages: ["de", "es"], apiKey: "sk-secret", key: "sk-secret" });
  assert.strictEqual(s.apiKey, undefined);
  assert.strictEqual(s.key, undefined);
  assert.ok(!JSON.stringify(s).includes("sk-secret"));
});

test("what the settings window shows of a stored key is not the key", () => {
  assert.strictEqual(keyHint(""), "");
  assert.strictEqual(keyHint("   "), "");
  assert.strictEqual(keyHint("sk-or-v1-0123456789abcdef"), "••••cdef");
  assert.strictEqual(keyHint("abc"), "•••", "a short key gives nothing away either");
  assert.ok(!keyHint("sk-or-v1-0123456789abcdef").includes("0123456789"));
});

test("a shortcut has three states, and a cleared one stays cleared", () => {
  const kept = { accelerator: "Control+Alt+BracketLeft", label: "⌃⌥Ü" };
  assert.deepStrictEqual(normalizeSettings({ hotkey: kept }).hotkey, kept);

  /* A file that never mentioned a shortcut is a first start. */
  assert.deepStrictEqual(normalizeSettings({}).hotkey, DEFAULT_HOTKEY);

  /* Clearing the field is a decision, and the default must not creep back
     in on the next start. */
  assert.strictEqual(normalizeSettings({ hotkey: null }).hotkey, null, "a cleared field stays cleared");

  /* Anything the shell could not register falls back to the default rather
     than to nothing — nothing is a decision only the reader gets to make. */
  assert.deepStrictEqual(
    normalizeSettings({ hotkey: "Command+U" }).hotkey,
    DEFAULT_HOTKEY,
    "the plain string an older version wrote is not a combination",
  );
  assert.deepStrictEqual(normalizeSettings({ hotkey: { accelerator: "KeyL" } }).hotkey, DEFAULT_HOTKEY);
});

test("the preset combination is one the recorder itself would produce", () => {
  /* The default is written by hand, and a hand-written accelerator that the
     registration cannot parse would be a shortcut nobody ever notices is
     missing. */
  assert.ok(isHotkey(DEFAULT_HOTKEY));
  assert.strictEqual(hotkeyLabel(DEFAULT_HOTKEY, { KeyE: "E" }), "⌃⌥E");
  assert.deepStrictEqual(
    hotkeyFrom({ code: "KeyE", key: "e", ctrlKey: true, altKey: true }, { KeyE: "E" }),
    DEFAULT_HOTKEY,
    "pressing it records exactly what is preset",
  );
});

test("a language missing in every direction is named once, not four times", () => {
  /* A pair is downloaded as a language, so that is the ordinary case and the
     one the sentence has to read well for. */
  const missing = [
    { from: "de", to: "ru" }, { from: "es", to: "ru" },
    { from: "ru", to: "de" }, { from: "ru", to: "es" },
  ];
  assert.deepStrictEqual(collapsePairs(["de", "es", "ru"], missing), [{ language: "ru" }]);
});

test("a one-sided gap is spelled out next to the language that explains the rest", () => {
  const missing = [
    { from: "de", to: "ru" }, { from: "es", to: "ru" },
    { from: "ru", to: "de" }, { from: "ru", to: "es" },
    { from: "de", to: "es" },
  ];
  assert.deepStrictEqual(collapsePairs(["de", "es", "ru"], missing), [
    { language: "ru" },
    { from: "de", to: "es" },
  ]);
});

test("a single gap names no language, because none of them is the reason", () => {
  /* German is not missing: it translates into Spanish perfectly well. */
  assert.deepStrictEqual(
    collapsePairs(["de", "es", "ru"], [{ from: "de", to: "ru" }]),
    [{ from: "de", to: "ru" }],
  );
});

test("where two answers are equally true the directions are listed instead", () => {
  /* With only German and Russian configured, "German is missing" and "Russian
     is missing" say the same thing and neither helps. */
  const missing = [{ from: "de", to: "ru" }, { from: "ru", to: "de" }];
  assert.deepStrictEqual(collapsePairs(["de", "ru"], missing), missing);
});

test("a level is kept for a language that is not currently chosen", () => {
  /* The point of remembering one is that it survives a detour. Someone who
     set Spanish to C1 and then reads French for a week finds C1 again. */
  const s = normalizeSettings({ languages: ["de", "fr"], levels: { es: "C1", fr: "A2" } });
  assert.strictEqual(levelFor(s, "es"), "C1");
  assert.strictEqual(levelFor(s, "fr"), "A2");
});

test("a level that is not one is dropped, and B1 applies", () => {
  const s = normalizeSettings({ levels: { es: "Z9", xx: "B2" } });
  assert.deepStrictEqual(s.levels, {});
  assert.strictEqual(levelFor(s, "es"), DEFAULT_LEVEL);
});

test("a section is shown for a foreign text and not for the reader's own", () => {
  const s = normalizeSettings({ languages: ["de", "es"] });
  assert.strictEqual(showsSection(s, "verbs", "es"), true);
  assert.strictEqual(showsSection(s, "verbs", "de"), false, "not their own language");
  assert.strictEqual(showsSection(s, "terms", "fr"), true, "an unconfigured language is foreign too");
});

test("never shows nothing, and no answer shows the reader's own language", () => {
  const off = normalizeSettings({ languages: ["de", "es"], show: { verbs: "never", terms: "foreign" } });
  assert.strictEqual(showsSection(off, "verbs", "es"), false);
  assert.strictEqual(showsSection(off, "terms", "de"), false);
});

test("a section follows the reader's list by place", () => {
  const three = { languages: ["de", "es", "en"] };
  const at = (mode, code) => showsSection(normalizeSettings({ ...three, show: { verbs: mode } }), "verbs", code);
  assert.strictEqual(at("second", "es"), true);
  assert.strictEqual(at("second", "en"), false);
  assert.strictEqual(at("third", "en"), true);
  assert.strictEqual(at("third", "es"), false);
  assert.strictEqual(at("second", "fr"), false, "a language with no place is named only by the widest answer");
  assert.strictEqual(at("foreign", "fr"), true);
});

test("an older always becomes every language, the reader's own included", () => {
  assert.strictEqual(normalizeSettings({ show: { verbs: "always" } }).show.verbs, "all");
});

test("all includes the reader's own language, and only the terms reach a language with no pack", () => {
  const s = (mode) => normalizeSettings({ languages: ["de", "es"], show: { verbs: mode, terms: mode } });
  assert.strictEqual(showsSection(s("all"), "verbs", "de"), true);
  assert.strictEqual(showsSection(s("foreign"), "verbs", "de"), false);
  assert.strictEqual(showsSection(s("foreign"), "terms", ""), true);
  assert.strictEqual(showsSection(s("all"), "verbs", ""), false, "a verb table needs a pack");
  assert.strictEqual(showsSection(s("second"), "terms", ""), false, "no place in the list");
});

test("the model translates first unless the reader hands the panels to the device", () => {
  assert.strictEqual(normalizeSettings({}).translator, "model");
  assert.strictEqual(normalizeSettings({ translator: "device" }).translator, "device");
  /* A value this version does not know is not a decision anybody made. */
  assert.strictEqual(normalizeSettings({ translator: "deepl" }).translator, "model");
});

test("the translation on hover is on unless switched off", () => {
  assert.strictEqual(normalizeSettings({}).glance, true);
  assert.strictEqual(normalizeSettings({ glance: false }).glance, false);
});

test("the underlines are on unless switched off", () => {
  assert.strictEqual(normalizeSettings({}).underline, true);
  assert.strictEqual(normalizeSettings({ underline: false }).underline, false);
  assert.strictEqual(normalizeSettings({ underline: "no" }).underline, true);
});

test("the window is not pinned and the app sits in the menu bar unless told otherwise", () => {
  assert.strictEqual(normalizeSettings({}).pinned, false);
  assert.strictEqual(normalizeSettings({ pinned: true }).pinned, true);
  assert.strictEqual(normalizeSettings({ closeOnBlur: false }).pinned, true);
  assert.strictEqual(normalizeSettings({ closeOnBlur: true }).pinned, false);
  assert.strictEqual(normalizeSettings({ closeOnBlur: false, pinned: false }).pinned, false);
  assert.strictEqual("closeOnBlur" in normalizeSettings({ closeOnBlur: false }), false);
  assert.strictEqual(normalizeSettings({}).fitWindow, true);
  assert.strictEqual(normalizeSettings({}).search, "system");
  assert.strictEqual(normalizeSettings({ search: "ecosia" }).search, "ecosia");
  assert.strictEqual(normalizeSettings({ search: "altavista" }).search, "system");
  assert.strictEqual(normalizeSettings({ fitWindow: false }).fitWindow, false);
  assert.strictEqual(normalizeSettings({ fitWindow: "no" }).fitWindow, true);
  assert.strictEqual(normalizeSettings({}).appIcon, "menubar");
  assert.strictEqual(normalizeSettings({ appIcon: "both" }).appIcon, "both");
  assert.strictEqual(normalizeSettings({ appIcon: "taskbar" }).appIcon, "menubar");
});

test("a first start reads English with Spanish and no third language", () => {
  assert.deepStrictEqual(normalizeSettings({}).languages, ["en", "es"]);
});

test("the two further shortcuts start empty, and are kept or cleared like the first", async () => {
  const { HOTKEYS } = await import("../../src/settings.js");
  assert.deepStrictEqual(HOTKEYS, ["hotkey", "freshHotkey", "cardHotkey"]);
  const first = normalizeSettings({});
  assert.strictEqual(first.freshHotkey, null);
  assert.strictEqual(first.cardHotkey, null);
  const kept = { accelerator: "Control+Alt+KeyK", label: "⌃⌥K" };
  assert.deepStrictEqual(normalizeSettings({ cardHotkey: kept }).cardHotkey, kept);
  assert.strictEqual(normalizeSettings({ cardHotkey: "junk" }).cardHotkey, null);
  assert.deepStrictEqual(normalizeSettings({ freshHotkey: null }).hotkey, DEFAULT_HOTKEY, "the first keeps its preset");
});

test("a card from the shortcut is offered in the learned languages, starting where the settings narrow it", async () => {
  const { cardLanguages } = await import("../../src/settings.js");
  const three = { languages: ["de", "en", "es"] };
  assert.deepStrictEqual(cardLanguages(three, "de"), { choices: ["en", "es"], preset: "en" }, "own language: the first learned");
  assert.deepStrictEqual(cardLanguages(three, "es"), { choices: ["en", "es"], preset: "es" }, "a learned language: that one");
  assert.deepStrictEqual(cardLanguages({ ...three, cards: { mode: "third" } }, "de").preset, "es");
  assert.deepStrictEqual(cardLanguages({ ...three, cards: { mode: "second" } }, "").preset, "en");
  assert.deepStrictEqual(cardLanguages(three, "fr"), { choices: ["en", "es", "fr"], preset: "fr" }, "what the text is in joins");
  assert.deepStrictEqual(cardLanguages({ languages: ["en", "es"], cards: { mode: "third" } }, ""), { choices: ["es"], preset: "es" },
    "no third language: the second");
});

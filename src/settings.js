/* Everything the user can decide, in one place.

   Every setting is a decision pushed onto someone, so this list stays short
   and every entry earns itself. Nothing in here has a value that only makes
   sense for one particular person.

   The file lives in the platform's own application-support directory, so no
   path is written down anywhere. The model key never lands in it: that goes
   to the system keychain. */

import { MAX_PANELS } from "./panels.js";
import { SUPPORTED, isSupported } from "./languages/index.js";
import { DEFAULT_HOTKEY, isHotkey } from "./hotkey.js";

/* The languages explanations can be written in. Both are also learnable, so
   they appear in the other list too. */
export const FIRST_LANGUAGES = ["de", "en"];

/* Click-to-fill addresses for the settings window: the two local servers and
   the one cloud service the README recommends. Local servers and cloud
   providers speak the same interface, so this is a convenience, not a
   choice between two modes. */
export const ENDPOINT_PRESETS = [
  { label: "LM Studio", endpoint: "http://127.0.0.1:1234/v1" },
  { label: "Ollama", endpoint: "http://127.0.0.1:11434/v1" },
  { label: "OpenRouter", endpoint: "https://openrouter.ai/api/v1" },
];

/* The Council of Europe's scale, the one printed on every language course.
   Six steps is already more than most people want to think about, so the
   window puts a word next to each. */
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const DEFAULT_LEVEL = "B1";

/* For which languages a section is filled: none, the second or the third of
   the reader's list, every foreign language, or every language including the
   reader's own — for somebody proofreading. Foreign is the default. What
   "every" reaches differs by section and is decided in showsSection. */
export const SHOW_MODES = ["never", "second", "third", "foreign", "all"];

/* An older file's "always" is what "all" is now. */
const showMode = (value, fallback) =>
  value === "always" ? "all" : SHOW_MODES.includes(value) ? value : fallback;

/* Which of the reader's languages a flashcard is offered for. Named by their
   place in the list rather than by "foreign", because that is the difference
   that matters here: the second language is usually the one being worked at,
   and the third one read rather than learned. */
export const CARD_MODES = ["never", "second", "third", "foreign"];

/* Where the running app shows itself: in the menu bar, in the Dock, or both. */
export const APP_ICONS = ["menubar", "dock", "both"];

/* Who translates the panels first. The other one steps in where the first
   cannot — so both answers still translate without a model, where the
   device can. */
export const TRANSLATORS = ["model", "device"];

export const DEFAULTS = {
  /* Ordered: the first is the language explanations are written in, the rest
     are being learned. Two of them mean two panels, three mean three. */
  languages: ["en", "es"],
  /* How far along the reader is in each language they are learning, on the
     scale the whole of Europe already uses. It decides what counts as hard,
     which is the one thing about the reader the prompt genuinely needs.

     Kept for every language, not only the two in use: someone who set
     Spanish to C1 and then reads French for a week should find Spanish at C1
     when they come back. */
  levels: {},
  /* Any endpoint that speaks the common interface. Empty means the
     translations still work and everything else is visibly locked. */
  endpoint: "",
  model: "",
  /* The device by default, because it is the one engine every reader has.
     Measured, it is also wrong in sense about one translation in four, where
     a cloud model is wrong in one of three hundred — so the settings say so,
     and a reader with a model can hand the panels to it. */
  translator: "model",
  /* For which languages the two model-filled sections appear. A German
     reader pasting a German text wants a translation, not a verb table of
     their own language, so that is never one of the answers. */
  show: { verbs: "foreign", terms: "foreign" },
  /* The coloured line under a verb's or a term's words in the panels. Off
     takes the line away and nothing else: the rows keep their colour at the
     edge, and the pointer on a row still lights its words up. */
  underline: true,
  /* What a word of the original became in the reader's own translation,
     over the word while the pointer rests on it. On, because it is what a
     reader looks for most often and it costs one question per sentence,
     asked after everything else a reading asks for. Off, nothing is asked. */
  glance: true,
  /* A card out of a row, in three fields: the word being learned, the word
     in the reader's own language, an explanation. On, because it costs
     nothing to have — the card is shown, corrected and copied, and nothing
     leaves the machine.

     Anki underneath it is off, and stays off until somebody switches it on.
     Most readers have no Anki, switched on it would ask three questions they
     have no answer to, and a card can be copied out without it. */
  cards: {
    mode: "foreign",
    anki: { enabled: false, deck: "", noteType: "", fields: { term: "", meaning: "", note: "" } },
  },
  /* Preset, because a shortcut nobody has set is a feature nobody uses. What
     is stored is the physical key together with the label the reader saw —
     see hotkey.js for why those are two different things, and why this
     particular combination.

     Clearing the field is a decision too, and it is kept: a settings file
     that says hotkey is null holds no combination, and the default does not
     creep back in on the next start. */
  hotkey: DEFAULT_HOTKEY,
  /* The reading window goes away when the focus leaves it, the way a menu
     does — on by default, and the reader's to switch off for a window that
     should stay standing beside something else. */
  closeOnBlur: true,
  /* The menu bar symbol alone by default: a window lying over another
     program's full screen should not bring a Dock icon and a Space along. */
  appIcon: "menubar",
};

const isPlainObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/* Bring anything that was read from disk into a shape the app can rely on.
   Unknown keys are dropped, bad values fall back to the default. A settings
   file from a newer version, or one edited by hand, must not be able to
   break the app. */
export function normalizeSettings(stored) {
  const raw = isPlainObject(stored) ? stored : {};

  const languages = [];
  for (const code of Array.isArray(raw.languages) ? raw.languages : []) {
    const c = String(code || "").toLowerCase();
    if (isSupported(c) && !languages.includes(c)) languages.push(c);
    if (languages.length === MAX_PANELS) break;
  }
  /* The first entry has to be a language explanations can be written in, and
     there have to be at least two languages for the app to show anything. */
  const valid = languages.length >= 2 && FIRST_LANGUAGES.includes(languages[0]);

  const show = isPlainObject(raw.show) ? raw.show : {};
  return {
    languages: valid ? languages : DEFAULTS.languages,
    levels: normalizeLevels(raw.levels),
    show: {
      verbs: showMode(show.verbs, DEFAULTS.show.verbs),
      terms: showMode(show.terms, DEFAULTS.show.terms),
    },
    underline: raw.underline !== false,
    glance: raw.glance !== false,
    endpoint: typeof raw.endpoint === "string" ? raw.endpoint.trim() : "",
    model: typeof raw.model === "string" ? raw.model.trim() : "",
    translator: TRANSLATORS.includes(raw.translator) ? raw.translator : DEFAULTS.translator,
    cards: normalizeCards(raw),
    /* Three states, not two. A combination is kept; an explicit null is the
       reader having cleared the field and stays cleared; a file that never
       mentioned a shortcut at all is a first start and gets the default.
       Anything else — the plain string an older version wrote, a hand-edited
       combination this app could not register — falls back to the default
       rather than to nothing, because nothing is a decision only the reader
       gets to make. */
    hotkey: normalizeHotkey(raw),
    closeOnBlur: raw.closeOnBlur !== false,
    appIcon: APP_ICONS.includes(raw.appIcon) ? raw.appIcon : DEFAULTS.appIcon,
  };
}

/* The flashcards, and Anki under them.

   Two switches rather than one: the card itself has no outside at all, so it
   is on, and the export to another program is a separate decision. An older
   settings file named Anki alone — that deck is kept, and the note type and
   the mapping are guessed the first time the settings are opened. */
function normalizeCards(raw) {
  const cards = isPlainObject(raw.cards) ? raw.cards : {};
  /* Where an older file said `anki`, the deck it names is still the deck. */
  const stored = isPlainObject(cards.anki) ? cards.anki
    : isPlainObject(raw.anki) ? raw.anki : {};
  const fields = isPlainObject(stored.fields) ? stored.fields : {};
  const word = (value) => (typeof value === "string" ? value.trim() : "");
  return {
    /* An older file said "both", which always meant every foreign language
       a card can be made in; older still, yes or no. */
    mode: CARD_MODES.includes(cards.mode) ? cards.mode
      : cards.mode === "both" ? "foreign"
      : cards.enabled === false ? "never" : DEFAULTS.cards.mode,
    anki: {
      enabled: stored.enabled === true,
      deck: word(stored.deck),
      noteType: word(stored.noteType),
      fields: {
        term: word(fields.term),
        meaning: word(fields.meaning),
        note: word(fields.note),
      },
    },
  };
}

function normalizeHotkey(raw) {
  if (isHotkey(raw.hotkey)) {
    return { accelerator: raw.hotkey.accelerator, label: String(raw.hotkey.label || "") };
  }
  if ("hotkey" in raw && raw.hotkey === null) return null;
  return DEFAULTS.hotkey;
}

/* Levels for languages nobody has selected are kept, not dropped: the point
   of remembering one is that it survives a detour through another language.
   Anything that is not a level, or not a language, goes. */
function normalizeLevels(stored) {
  const raw = isPlainObject(stored) ? stored : {};
  const out = {};
  for (const [code, level] of Object.entries(raw)) {
    const c = String(code || "").toLowerCase();
    if (isSupported(c) && LEVELS.includes(level)) out[c] = level;
  }
  return out;
}

/* B1 unless the reader said otherwise — the middle of the scale, and the
   point at which a text stops being an exercise and starts being reading. */
export function levelFor(settings, code) {
  return normalizeSettings(settings).levels[code] || DEFAULT_LEVEL;
}

/* Whether a section is filled for a text in this language.

   The reader's own language only under "all". A text in a language the app
   does not support has no code: the terms are asked about it under "foreign"
   and "all" — the question needs nothing from a pack that it cannot do
   without — and the verbs never, because a verb table is made of what only a
   pack knows: the persons, the tense names, the auxiliaries. A supported
   language with no place in the list is named only by the two widest answers,
   the same rule as offersCard. */
export function showsSection(settings, section, sourceCode) {
  const clean = normalizeSettings(settings);
  const mode = clean.show[section];
  const wide = mode === "foreign" || mode === "all";
  if (mode === "never") return false;
  if (!sourceCode) return section === "terms" && wide;
  if (sourceCode === clean.languages[0]) return mode === "all";
  if (sourceCode === clean.languages[1]) return mode === "second" || wide;
  if (sourceCode === clean.languages[2]) return mode === "third" || wide;
  return wide;
}

/* Which foreign languages may be offered next to a chosen first language:
   everything supported except that one. The other first-language option
   stays in the list — someone reading German may well be learning English. */
export function choosableLanguages(firstLanguage) {
  return SUPPORTED.filter((code) => code !== firstLanguage);
}

/* Every direction the device could be asked for. Any configured language may
   be the one a text arrives in, and the others are then its targets, so the
   pairs go both ways: two languages make two, three make six. */
export function neededPairs(languages) {
  const pairs = [];
  for (const from of languages) {
    for (const to of languages) if (from !== to) pairs.push({ from, to });
  }
  return pairs;
}

/* Naming the same gap four times over is not more precise, it is only
   longer. A pair is downloaded as a language and not as a direction, so
   normally one language explains every gap there is, and saying it once is
   the whole message: "Russian is not there".

   Which language that is, is a smallest-cover question — the fewest
   languages whose pairs account for every gap. Where two different smallest
   answers exist the question has no answer: with German and Russian
   configured and both directions missing, "German is missing" and "Russian is
   missing" are equally true and equally useless, so the directions are
   listed instead.

   Entries come back as { language } or as { from, to }. */
export function collapsePairs(languages, missing) {
  const key = (pair) => `${pair.from}>${pair.to}`;
  const gaps = new Set(missing.map(key));
  if (!gaps.size) return [];

  /* Only a language that is missing in every direction it takes part in can
     be the reason for one. A language with one gap and one working
     direction explains nothing — that gap is one-sided and gets spelled
     out. */
  const whole = languages.filter((code) => {
    const touching = neededPairs(languages).filter((p) => p.from === code || p.to === code);
    return touching.length && touching.every((p) => gaps.has(key(p)));
  });

  /* At most three languages, so every subset can simply be tried — smallest
     first. */
  const subsets = [];
  for (let mask = 1; mask < 1 << whole.length; mask++) {
    subsets.push(whole.filter((_, index) => mask & (1 << index)));
  }
  subsets.sort((a, b) => a.length - b.length);
  /* What is left over after a candidate set is named gets listed as pairs,
     so a set does not have to cover everything to be worth naming. The
     smallest set that leaves the least behind wins. */
  const left = (chosen) =>
    missing.filter((pair) => !chosen.includes(pair.from) && !chosen.includes(pair.to));
  const useful = subsets.filter((one) => left(one).length < missing.length);
  if (!useful.length) return missing.slice();
  const best = Math.min(...useful.map((one) => left(one).length + one.length));
  const smallest = useful.filter((one) => left(one).length + one.length === best);
  /* Several answers that disagree means the question has none: with two
     languages, "German is missing" and "Russian is missing" are equally true
     and equally useless. */
  if (smallest.length !== 1) return missing.slice();

  const named = smallest[0];
  return named.map((language) => ({ language })).concat(left(named));
}

/* Without an endpoint the translation panels still work and everything the
   model would add is visibly locked. This is the one question the interface
   asks about that state. */
export function explanationsAvailable(settings) {
  return !!normalizeSettings(settings).endpoint;
}

/* Whether a word in this language is worth a card.

   Never the reader's own: nobody learns vocabulary they are reading the
   explanation in. Beyond that the reader chooses by place in their list — the
   second language is usually the one being worked at, the third often read
   rather than learned.

   A language with no place in the list — a text in something the reader never
   configured, which takes a panel of its own — cannot be ruled out by a rule
   about places. Under "foreign" the reader wants a card for everything foreign
   and gets one; a narrower answer names which of their own languages, and
   this is not one of them. */
export function offersCard(settings, code) {
  const clean = normalizeSettings(settings);
  const mode = clean.cards.mode;
  if (mode === "never" || !code || code === clean.languages[0]) return false;
  if (code === clean.languages[1]) return mode === "second" || mode === "foreign";
  if (code === clean.languages[2]) return mode === "third" || mode === "foreign";
  return mode === "foreign";
}

/* Configured, not merely switched on. A deck and a note type without a field
   for the word itself has nowhere to put the word, and Anki would take an
   empty note. */
export function ankiConfigured(settings) {
  const { enabled, deck, noteType, fields } = normalizeSettings(settings).cards.anki;
  return !!(enabled && deck && noteType && fields.term);
}

export function readerLanguage(settings) {
  return normalizeSettings(settings).languages[0];
}

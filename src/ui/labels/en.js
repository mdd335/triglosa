import { why } from "./detail.js";

export default {
  placeholder: "Paste or type a text",
  /* The button at the original field is named after what it sets off. It
     stands where "Edit" stands while reading — one field, two states, one
     button in one place. */
  translate: "Translate",
  translateKeys: "Translate (⌘↩)",
  edit: "Edit",
  settings: "Settings",
  original: "Original",
  terms: "Terms",
  verbs: "Verbs",
  marked: "Selection",
  synonyms: "related",
  wordClasses: {
    noun: "noun",
    "proper noun": "proper noun",
    adjective: "adjective",
    adverb: "adverb",
    pronoun: "pronoun",
    preposition: "preposition",
    conjunction: "conjunction",
    article: "article",
    numeral: "numeral",
    interjection: "interjection",
    singular: "singular",
    plural: "plural",
    masculine: "masculine",
    feminine: "feminine",
    neuter: "neuter",
  },
  copy: "Copy",
  insert: "Insert",
  copied: "Copied",
  /* Both say that they lead out of the window: what they open is a page in
     the browser and nothing that stands here. */
  search: "Look up (external)",
  opened: "Opened",
  conjugation: "Conjugation (external)",
  /* Named after what it shows rather than after a program: what it opens
     is a card to read, correct and copy out — with or without Anki on the
     machine. */
  card: "Flashcard",
  /* What stands in the title bar of its own window. */
  cardCreate: "Create flashcard",
  cardLanguage: "Language of the flashcard",
  sourceLanguage: "Change the language",
  otherLanguage: "Other language…",
  findLanguage: "Type a language",
  unknownLanguage: "Unknown language",
  added: "Added",
  synonymBack: "Previous word",
  synonymForward: "Next word",
  /* The three field headings. The first two only stand where the language
     is unknown; otherwise the language's own name does, from its pack. */
  cardTerm: "Foreign language",
  cardMeaning: "Native language",
  cardNote: "Explanation",
  /* The two lines under an explanation. Unlabelled they were two paragraphs
     of running text, and nothing said that one was an example or that the
     other was that example translated. */
  cardCopyAll: "Copy all three",
  cardCopyField: "Copy field",
  cardToAnki: "Straight to Anki",
  cardAnkiStart: "Start Anki",
  cardAnkiStarting: "Starting Anki …",
  cardAnkiSetup: "Choose a deck",
  /* Without a field of its own the explanation would be lost in silence. */
  cardNoteUnmapped: "No field mapped — these lines will not go to Anki.",
  /* What came of the attempt, in a sentence that says what happened and
     what to do about it — and that stays. "Not added" on the button,
     vanishing after a second and a half, cost an afternoon: the actual
     cause was in Anki's answer and was being thrown away.

     Anki's own words follow in brackets where they are the explanation, and
     only there. The reader's own sentence comes first, because "cannot
     create note because it is empty" alone tells nobody what to do. */
  ankiSaved: "The card is in the deck.",
  ankiDuplicate: "This card is already in the deck — Anki compares the note type's first field.",
  ankiSending: "Adding …",
  ankiFailed: ({ kind, detail } = {}) => {
    const said = detail ? ` (${detail})` : "";
    if (kind === "unreachable") {
      return "Anki is not answering. Please start Anki and check that AnkiConnect is installed.";
    }
    if (kind === "unconfigured") {
      return "No deck chosen. Please choose one in the settings under \"Flashcards\".";
    }
    if (kind === "empty") {
      return "The note's first field would be empty" + said
        + ". Please map it to one of the three lines in the settings.";
    }
    if (kind === "no-deck") {
      return "Anki does not know this deck" + said + ". Please choose it again in the settings.";
    }
    if (kind === "no-note-type") {
      return "Anki does not know this note type" + said + ". Please choose it again in the settings.";
    }
    return "Anki did not add the card" + said + ". Please try again.";
  },
  detecting: "Recognising the language…",
  nothingOn: (word) => `No explanation received for “${word}”.`,
  searching: "searching…",
  cardImprove: "Improve with AI",
  cardImproving: "Improving the card…",
  cardUndo: "Undo AI improvement",
  cardImproveNothing: "No usable improvement received. The card stays as it was.",
  linking: "linking…",
  noTerms: "no difficult terms found",
  noVerbs: "no difficult verbs found",
  /* A locked area says what would stand in it — the same hint three times
     over reads as noise. How to open it stands once, underneath. */
  lockedHow:
    "Connect an AI model in the settings for more accurate translations, verbs, terms, explanations and other features.",
  /* Both ways were tried and neither answered. What must not stand here is
     the note about language packs: that one is only true where the device
     was the only engine there was. */
  /* The fact alone. The reason stands once under the sheet, and advice
     repeated in four areas at once is the same noise as the message it
     replaced. */
  noAnswer: "No answer received.",
  /* What went wrong, in one sentence that needs no knowledge of error
     codes: what happened and what can be done about it. The number comes
     along because it helps in a support answer — but never on its own.
     Which kind it is, is decided in faults.js.
     Every message has the same shape: briefly what happened, then one sentence with "Please" saying what to do. */
  faults: {
    unreachable:
      "No connection to the AI model. Please check your internet connection and the settings.",
    timeout: "The AI model took too long. Please try again.",
    key: (f) =>
      `The API key was rejected${why(f)}. Please check it in the settings.`,
    notFound: (f) =>
      `Address or model not found${why(f)}. Please check both in the settings `
      + "– often “/v1” is missing at the end of the address.",
    refused: (f) =>
      `The AI model rejected the request${why(f)}. Please check the model name in the settings.`,
    busy: (f) =>
      `The AI model is overloaded right now${why(f)}. Please try again later.`,
    server: (f) =>
      `The AI model's provider has a problem${why(f)}. Please try again shortly.`,
    status: (f) =>
      `Unexpected answer from the AI model${why(f)}. Please check the settings.`,
    empty: "The AI model sent an empty answer. Please try again.",
    thinking: (f) =>
      `${f.model || "This AI model"} thinks before every answer and is too slow for that. `
      + "Please choose another model in the settings.",
    noModel:
      "No model is loaded in the local server. Please load one or enter a model name in the settings.",
    unknown: (f) => f.detail || "Something went wrong. Please try again.",
  },
  /* Not the same as a missing language pack: here the helper is not there
     at all, and no download answers that. */
  noDevice:
    "Apple's translation is not answering. Please set up an AI model in the settings.",
  onlyKnownLanguages:
    "Apple's translation does not know this language. Please set up an AI model in the settings.",
  pairMissing: (from, to) =>
    `The language pack ${from} → ${to} is missing. Please set up an AI model in the settings, or download the language pack there under Translations.`,

  groupLanguages: "Languages",
  groupSections: "Verbs and terms",
  groupModel: "AI model",
  groupTranslation: "Translations",
  groupWindow: "Window",
  groupShortcuts: "Shortcuts",
  groupCards: "Flashcards",
  groupAbout: "About Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  aboutProject: "Triglosa on GitHub",
  updatesCheck: "Check for updates",
  updatesChecking: "Checking …",
  updatesHint: "Asks GitHub for the newest version. Triglosa only asks when you click here, and downloads nothing.",
  updatesNone: "You have the latest version.",
  updatesFound: (version) => `Version ${version} is available.`,
  updatesDownload: "Go to download",
  updatesFailed: (status) => `No answer from GitHub${status ? ` (${status})` : ""}. Please try again later.`,

  /* Two switches rather than one: the card itself never leaves the machine
     and is therefore on, while handing it to another program is a separate
     decision. */
  optionOn: "on",
  optionOff: "off",
  cardsEnabled: "Option to create flashcards",
  cardModes: {
    never: "never",
    second: "only for the second language",
    third: "only for the third language",
    foreign: "for all supported foreign languages",
  },
  ankiEnabled: "Export straight to Anki",
  ankiEnabledHint: (code) => `Needs Anki with the AnkiConnect add-on (code ${code}).`,
  ankiSearching: "Looking …",
  ankiMissing:
    "Anki is not answering. Please start Anki and check that AnkiConnect is installed.",
  ankiRecheck: "Look again",
  ankiLaunch: "Start Anki",
  ankiStarting: "Starting Anki …",
  ankiDeck: "Deck",
  ankiDeckHint:
    "Any deck Anki reports. A name that is not there yet is created the first time a card is saved.",
  ankiNewDeck: "New deck …",
  ankiDeckList: "From the list",
  ankiNoteType: "Note type",
  ankiNoteTypeHint: "The note type decides which fields a card has.",
  /* The note type is the question nobody has an answer to off the top of
     their head. Anki has one: which type the cards in this deck actually
     use. Where the deck is empty the choice is left to the reader: a tip
     about Anki's own screens was wrong, and its names are translated. */
  ankiNoteTypeUsed: (count) => `in this deck (${count})`,
  ankiNoteTypeFound: (name) =>
    `The cards in the selected deck use the note type "${name}".`,
  ankiNoteTypeLook:
    "The selected deck has no cards yet to read the note type from. Please choose it yourself.",
  ankiFields: "Fields",
  ankiFieldsHint: "Which field of the note type takes which of the three lines.",
  ankiNoField: "— do not write",
  /* Not magic: Anki decides at that one field whether a note is empty, and
     refuses it otherwise. On many note types it is called "ID"
     and means nothing to a reader, so nobody would have mapped it — and
     every card was refused. */
  ankiFirstField: (name) =>
    `The note type's first field ("${name}") also gets the foreign word. Anki will not take a note whose first field is empty.`,

  firstLanguage: "Native language",
  secondLanguage: "Second language",
  thirdLanguage: "Third language (optional)",
  noThird: "none",
  /* One word per step, for anyone the scale means nothing to. */
  levelNames: {
    A1: "Beginner",
    A2: "Basics",
    B1: "Intermediate",
    B2: "Upper",
    C1: "Advanced",
    C2: "Near-native",
  },
  showModes: {
    never: "never",
    second: "only for the second language",
    third: "only for the third language",
    foreign: "for all supported foreign languages",
    all: "for all supported languages",
  },
  /* Terms are found in languages the app does not support as well. */
  termModes: {
    never: "never",
    second: "only for the second language",
    third: "only for the third language",
    foreign: "for all foreign languages",
    all: "for all languages",
  },
  showVerbsHint: "Base form, person and tense for the three hardest verb forms in the text.",
  showTermsHint: "Explanations for up to three advanced words or idioms in the text.",
  underline: "Coloured underlines in the text",
  underlineHint: "Underlines the verbs and terms in the original and the translations.",
  searchEngine: "Search engine",
  searchHint: "For “Look up (external)” on verbs, terms and marked words. Opens in the default browser.",
  searchSystem: "as set in Safari",
  glance: "Translation on hover",
  glanceHint: "Shows over a word of the original what it corresponds to in your language.",
  /* What the three rows decide between them stands above them rather than
     in one row's hint: without a model half the app is gone, and that
     belongs at the head of the group. */
  modelIntro:
    "Without an AI model, only Apple's on-device translation is available, if set up below. Connect an AI model for more accurate translations, verbs, terms, explanations and other features.",
  /* For anyone who has never set up access to a model. The answer is three
     paragraphs — what the model is for here, how cloud and local differ,
     what goes in which field — and they live in the README rather than in
     this window: they belong to setting the app up rather than to using it,
     and in the window they would have pushed the three fields off screen. */
  modelHelpAsk: "Never set up an AI model?",
  modelHelpLink: "Read the guide",
  endpoint: "Model endpoint",
  endpointHint:
    "Any address with an OpenAI-compatible interface — in the cloud or local.",
  model: "Model",
  modelHint: "If left empty, the app takes the first model the endpoint offers.",
  apiKey: "Key",
  apiKeyEmpty: "none stored",
  apiKeyHint:
    "Goes into the system's key store, never into the settings file. A local model usually needs none.",
  forgetKey: "Forget",
  keySaveFailed: (detail) =>
    `The key was not saved${detail ? ` (${detail})` : ""}. Please try again.`,
  testConnection: "Test connection",
  testing: "Testing…",
  testOk: (name) => `Answers, with “${name}”.`,

  translator: "Translation by",
  translatorModes: { model: "AI model", device: "Apple (on-device)" },
  /* Apple's translation is an extra: measured, it is wrong in sense about
     one translation in four, a cloud model in one of three hundred. What
     speaks for it is speed, and that it works offline. */
  deviceIntro:
    "Optionally, you can set up Apple's on-device translation for the translations themselves. It is very fast and works offline, but often imprecise.",
  translatorHint: "If one of the two cannot translate, the other steps in, if it is set up.",
  translatorNoModel: "No AI model is set up yet. Until then, Apple translates where its language packs are installed.",
  translatedBy: { device: "translated by Apple", model: "translated by the AI model" },
  foldPanel: "Fold away",
  unfoldPanel: "Unfold",
  more: "Explain in more detail",
  moreWorking: "Explaining in more detail …",
  addExample: "Add an example sentence",
  exampleWorking: "Writing an example sentence…",
  devicePairs: "Use Apple's on-device translation",
  pairsChecking: "Checking…",
  pairsAllInstalled: "Every language pack for your languages is installed.",
  pairsNoDevice:
    "Apple's translation is not answering right now.",
  pairsDownloadable: (pairs) => `Not downloaded yet: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Not possible with Apple's translation: ${pairs}. That cannot be downloaded.`,
  pairsFetch: "Get the languages…",
  pairsFetchAgain: "Ask again…",
  pairsOnTheirWay:
    "The download runs in the background and can take a few minutes. If the macOS window was closed, just ask again.",
  pairsPrompt: "Download languages for Apple's translation",
  pairsFetched: "Requested",
  pairsBySettings:
    "Please add them under Language & Region, Translation Languages.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Fit the window's height to what it holds",
  appIcon: "Icon while Triglosa is running",
  appIcons: { menubar: "in the menu bar", dock: "in the Dock", both: "in the menu bar and the Dock" },
  shortcutsLead:
    "If nothing happens here in the window when you press a combination, it is already taken. Pick another one.",
  hotkey: "Start translation",
  hotkeyEmpty: "none set",
  hotkeyRecording: "Press a combination…",
  hotkeyClear: "Clear",
  hotkeyLead:
    "Translates text from any program: copy it (⌘C), then press the shortcut. Opens the last translation when nothing new was copied.",
  hotkeyLeadSelected:
    "Translates the selected text in any program. Opens the last translation when no text is selected.",
  freshHotkey: "New translation",
  cardHotkey: "Create flashcard",
  cardHotkeyLead:
    "Creates a flashcard from the copied text (⌘C). Opens a blank flashcard window when nothing new was copied.",
  cardHotkeyLeadSelected:
    "Creates a flashcard from the selected text. Opens a blank flashcard window when no text is selected.",
  hotkeyTakenHere: (name) => `This combination is already set for “${name}”. Please choose another one.`,
  /* What the shell says about it helps rarely, so the sentence that helps
     comes first and the shell's own words follow it in brackets. */
  hotkeyFailed: (reason) =>
    "The shortcut is probably taken already"
    + (reason ? ` (${reason})` : "") + ". Please choose another combination.",
  hotkeyTakenSystem:
    "This combination is taken by macOS. Please choose another one.",
  hotkeyTakenEverywhere:
    "Every program uses this combination itself. Please choose another one.",

  /* The permission is an extra, not a requirement. It is explained before
     the system dialog comes: what it adds, what Triglosa uses it for and
     what not, and where that can be checked. macOS describes it so
     broadly that without this sentence it sounds like far more than it
     does here. */
  permission: "Use selected text directly",
  permissionWhy:
    "Optionally, you can translate selected text or take it into a flashcard without copying it first, and insert translations straight into other programs.",
  permissionHave: "Switched on.",
  permissionTrust:
    "For this, Triglosa needs the macOS permission “Device Control and Data Access” under Privacy & Security (“Accessibility” up to macOS 26). Triglosa uses it only for reading the selected text and for inserting, and only when you ask it to. Triglosa is open source, so you can verify this:",
  permissionCode: "see the code",
  permissionAsk: "Allow…",
  permissionOpen: "Open System Settings",
  permissionPending:
    "macOS has added Triglosa to the list there. Please switch Triglosa on in the list — this window notices by itself.",
  copyFirst: (key) => `Tip: copy some text in any program (⌘C), then press ${key}.`,
  captureFailed: "The selection could not be read. Please copy the text and paste it here.",

  inserted: "Inserted",
  insertNoWay: (reason) =>
    reason === "focus" ? "No program to insert into"
    : reason === "accessibility" ? "Permission missing"
    : "Not inserted",

  trayCapture: "Translate selected text",
  trayCaptureCopied: "Translate copied text",
  trayCard: "Create flashcard from selected text",
  trayCardCopied: "Create flashcard from copied text",
  trayCardBlank: "New flashcard",
  trayShow: "Show window",
  trayUpdates: "Check for updates",
  trayHelp: "Help",
  trayProblem: "Report a problem",
  trayRestart: "Restart Triglosa",
  trayQuit: "Quit Triglosa",
  /* The wording that stands nowhere: a button without a caption needs a
     name for everyone who cannot see the window. */
  settingsOpen: "Open settings",
  historyBack: "Previous translation",
  historyForward: "Next translation",
  newReading: "New translation",
  closeWindow: "Close window",
  pinWindow: "Keep on top",
  unpinWindow: "Stop keeping on top",
};

export const windows = {
  noDevice: "No AI model is set up. Please set one up in the settings.",
  onlyKnownLanguages: "No AI model is set up. Please set one up in the settings.",
  pairMissing: () => "No AI model is set up. Please set one up in the settings.",
  modelIntro:
    "Triglosa translates and explains with an AI model. Connect one for translations, verbs, terms, explanations and other features.",
  lockedHow:
    "Connect an AI model in the settings for translations, verbs, terms, explanations and other features.",
  apiKeyHint:
    "Kept in the Windows Credential Manager, never in the settings file. A local model usually needs none.",
  hotkeyLead:
    "Translates the selected text in any program. Opens the last translation when no text is selected.",
  cardHotkeyLead:
    "Creates a flashcard from the selected text. Opens a blank flashcard window when no text is selected.",
  hotkeyTakenSystem: "This combination is taken by Windows. Please choose another one.",
  appIcons: { menubar: "only in the notification area", both: "also in the taskbar" },
  copyFirst: (key) => `Tip: select some text in any program, then press ${key}.`,
  translateKeys: "Translate (Ctrl+Enter)",
};

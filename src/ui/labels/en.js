import { why } from "./detail.js";

export default {
  placeholder: "Paste or type a text",
  /* The button at the original field is named after what it sets off. It
     stands where "Edit" stands while reading — one field, two states, one
     button in one place. */
  translate: "Translate",
  enterKey: "⌘↩",
  edit: "Edit",
  settings: "Settings",
  original: "Original",
  terms: "Terms",
  /* A dictionary lookup's one term. */
  term: "Term",
  verbs: "Verbs",
  marked: "Selection",
  /* The first line of a dictionary entry looked up with its sentence: the
     meaning it has there. And the way from the entry to the whole
     sentence read. */
  inSentence: "here",
  previousSentence: "Previous sentence",
  nextSentenceLine: "Next sentence",
  /* A looked-up word found misspelled: the line under it, the typed word
     in it a link that looks it up as typed. */
  correctedFrom: (typed) => `Corrected from ${typed}`,
  didYouMean: (word) => `Did you mean ${word}?`,
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
  paste: "Paste",
  settingsDone: "Done",
  /* Both say that they lead out of the window: what they open is a page in
     the browser and nothing that stands here. */
  search: "Look up (external)",
  speak: "Say aloud",
  opened: "Opened",
  conjugation: "Conjugation (external)",
  /* Named after what it shows rather than after a program: what it opens
     is a card to read, correct and copy out — with or without Anki on the
     machine. */
  card: "Make a flashcard",
  /* What stands in the title bar of its own window. */
  cardCreate: "Create flashcard",
  cardLanguage: "Language of the flashcard",
  sourceLanguage: "Change the language",
  addLanguage: "Add a language",
  removeLanguage: "Remove the language",
  unknownLanguage: "Unknown language",
  added: "Added",
  synonymBack: "Previous word",
  synonymForward: "Next word",
  /* The three field headings. The first two only stand where the language
     is unknown; otherwise the language's own name does, from its pack. */
  cardTerm: "Foreign language",
  cardMeaning: "Native language",
  cardNote: "Notes",
  /* The two lines under an explanation. Unlabelled they were two paragraphs
     of running text, and nothing said that one was an example or that the
     other was that example translated. */
  cardCopyAll: "Copy all three",
  cardCopyField: "Copy field",
  cardToAnki: "Save to Anki",
  cardAnkiStart: "Start Anki",
  cardAnkiStarting: "Starting Anki …",
  cardAnkiSetup: "Choose an Anki deck",
  /* Without a field of its own the explanation would be lost in silence. */
  cardNoteUnmapped: "No field mapped — these lines will not go to Anki.",
  /* What came of the attempt, in a sentence that says what happened and
     what to do about it — and that stays. "Not added" on the button,
     vanishing after a second and a half, cost an afternoon: the actual
     cause was in Anki's answer and was being thrown away.

     Anki's own words follow in brackets where they are the explanation, and
     only there. The reader's own sentence comes first, because "cannot
     create note because it is empty" alone tells nobody what to do. */
  ankiSaved: (deck) => (deck ? `The card is in the deck "${deck}".` : "The card is in the deck."),
  cardClosing: "The window will close.",
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
  cardDetecting: "Finding the language…",
  cardImproving: "Improving the card…",
  cardUndo: "Undo AI improvement",
  cardImproveNothing: "No usable improvement received. The card stays as it was.",
  linking: "linking…",
  noTerms: "no difficult terms found",
  noTerm: "no difficult term found",
  noVerbs: "no difficult verbs found",
  /* A locked area says what would stand in it — the same hint three times
     over reads as noise. How to open it stands once, underneath. */
  lockedHow:
    "Connect an AI model in the settings for more accurate translations, terms, verbs, explanations and other features.",
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
    insecure:
      "The AI model's address is unencrypted (http). Please use https or an address in your own network, in the settings.",
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
  groupSections: "Terms and verbs",
  groupModel: "AI model",
  groupTranslation: "Translations",
  groupWindow: "Window",
  groupShortcuts: "Shortcuts",
  groupReading: "Other programs",
  groupCards: "Flashcards",
  groupAbout: "About Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  aboutNotes: "Show release notes",
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa lives on ", link("project", "GitHub"), "; help is in its ", link("help", "README"), ". If you run into a problem or would like a feature, feel free to open an ", link("issues", "issue"), "."],
  updatesCheck: "Check for updates",
  updatesChecking: "Checking …",
  updatesHint: "Asks GitHub for the newest version. An update is downloaded only when you click “Install now”.",
  updatesNone: "You have the latest version.",
  updatesFound: (version) => `Version ${version} is available.`,
  updatesDownload: "Show download and release notes",
  updatesInstall: "Install now",
  updatesLoading: (percent) => `Downloading … ${percent} %`,
  updatesInstalling: "Installing … Triglosa will restart.",
  updatesInstallNone: "This version cannot be installed from here. Please download it yourself.",
  updatesInstallUnreachable: "The update could not be downloaded. Please try again later.",
  updatesInstallFailed: (detail) => `The update was not installed${detail ? ` (${detail})` : ""}. Please download it yourself.`,
  diagnosticsCopy: "Copy diagnostics",
  diagnosticsHint: "For a problem report: version, system, languages, AI model and recent failures. Never your texts or your API key. Nothing is sent; you paste it yourself.",
  updatesFailed: (status) => `No answer from GitHub${status ? ` (${status})` : ""}. Please try again later.`,

  /* Two switches rather than one: the card itself never leaves the machine
     and is therefore on, while handing it to another program is a separate
     decision. */
  optionOff: "off",
  cardsEnabled: "Show the flashcard button",
  cardModes: {
    never: "never",
    second: "only for the second language",
    third: "only for the third language",
    learned: "for the second and third language",
    foreign: "for all foreign languages",
  },
  cardsImprove: "Improve flashcards automatically with AI",
  cardsImproveHint: "Cards can always be improved with AI at the press of a button.",
  ankiEnabled: "Export straight to Anki",
  ankiEnabledHint: (code) => `Needs Anki with the AnkiConnect add-on (code ${code}).`,
  ankiSync: "Sync Anki after every card",
  ankiSyncHint:
    "Works only where AnkiWeb is set up.",
  ankiSearching: "Looking …",
  ankiMissing:
    "Anki is not answering. Please start Anki and check that AnkiConnect is installed.",
  ankiRecheck: "Look again",
  ankiLaunch: "Start Anki",
  ankiStarting: "Starting Anki …",
  ankiDeck: "Anki deck",
  ankiAddLanguage: "Add a language",
  ankiRemoveLanguage: "Remove language",
  ankiTargetChoice: "Language",
  ankiPerLanguage: "Anki settings per language",
  ankiDeckHint:
    "Any deck Anki reports. A name that is not there yet is created the first time a card is saved.",
  ankiNewDeck: "New deck …",
  ankiDeckList: "From the list",
  ankiNoteType: "Anki note type",
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
  ankiFields: "Anki fields",
  ankiFieldsHint: "Which field of the note type takes which of the three lines.",
  ankiNoField: "— do not write",
  /* Not magic: Anki decides at that one field whether a note is empty, and
     refuses it otherwise. On many note types it is called "ID"
     and means nothing to a reader, so nobody would have mapped it — and
     every card was refused. */
  ankiFirstField: (name) =>
    `The note type's first field ("${name}") also gets the foreign word. Anki will not take a note whose first field is empty.`,

  languagesIntro: ["Triglosa shows every text beside its translations into these languages (two translations at most).", "The level you set decides which terms and verbs get explained in each language.", "In the translation window you can change a translation’s language for a while or add a third. That holds until you quit Triglosa."],
  firstLanguage: "Native language",
  firstLanguageHint: "Also the app’s language.",
  secondLanguage: "Second language",
  thirdLanguage: "Third language (optional)",
  noThird: "none",
  languagesTuned: "Optimised",
  languagesOther: "Not optimised",
  otherLanguageHint:
    "Triglosa is not optimised for this language: mistakes are more frequent, and there is no “Verbs” section. The more capable the AI model, the better the result.",
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
    foreign: "for all optimised foreign languages",
    all: "for all optimised languages",
  },
  /* Terms are found in languages the app does not support as well. */
  termModes: {
    never: "never",
    second: "only for the second language",
    third: "only for the third language",
    foreign: "for all foreign languages",
    all: "for all languages",
  },
  showVerbsHint: "Base form, person and tense for up to three advanced verb forms in the text.",
  showTermsHint: "Explanations for up to three advanced words or idioms in the text.",
  showTerms: "Show terms",
  showVerbs: "Show verbs",
  underline: "Coloured underlines in the text",
  searchEngine: "Search engine",
  searchHint: "For “Look up (external)” on terms, verbs and marked words. Opens in the default browser.",
  searchSystem: "as set in Safari",
  glance: "Translation on hover",
  glanceHint: "Shows over words in foreign languages what they correspond to in your language.",
  /* What the three rows decide between them stands above them rather than
     in one row's hint: without a model half the app is gone, and that
     belongs at the head of the group. */
  modelIntro:
    "Without an AI model, only Apple's on-device translation is available, where its language pack is downloaded. An AI model brings more accurate translations, terms, verbs, explanations and other features. Triglosa does not come with one.",
  modelQuestion: "Which kind of connection would you like to use?",
  modelWays: "One way that works well is prepared. Alternatively, you can enter any provider.",
  setupOnline: "Online",
  setupOnlineVia: "through OpenRouter",
  setupOnlineLine: "Accurate and fast. OpenRouter is a provider of its own, where you have to top up credit.",
  setupOwn: "Enter it yourself",
  setupOwnVia: "any provider",
  setupRecommended: (name, filled) => `Recommended model: ${name}${filled ? ", already filled in" : ""}`,
  setupOnlineSteps: (site, key, privacy) => [
    ["Create an account at ", site("openrouter.ai"), "."],
    ["Add credit – €5 is enough for many thousands of translations."],
    ["Create an ", key("API key"), " and paste it below."],
    ["Optional: turn on “Zero Data Retention” in the ", privacy("privacy settings"), " for more privacy."],
  ],
  setupOnlineFree: (name) => `Without credit, a free version of ${name} offered by Google works too. But it is enough for only a few translations a day, and your texts may be stored by Google and used for training. So it is good for trying out only, and it does not work with Zero Data Retention turned on.`,
  setupOnlineFreeTake: "Fill in the free model",
  setupOnlinePaidTake: "Fill in the recommended model",
  setupMore: (guide) => ["More on choosing a provider, and a comparison of models, in the ", guide("README"), "."],
  setupChatbot: "If you get stuck, an AI chatbot you trust can help too.",
  setupGuide: "Setup guide",
  endpoint: "AI model's address",
  endpointHints: {
    online: "OpenRouter’s address. For another provider, choose “Enter it yourself” above.",
    own: "Any address with an OpenAI-compatible interface — in the cloud or local.",
  },
  endpointPreset: (name) => `Fill in ${name}’s address`,
  model: "Model",
  modelHints: {
    online: "Any model OpenRouter offers, by the name on its page there.",
    own: "If left empty, the app takes the first model offered at that address.",
  },
  apiKey: "API key",
  apiKeyEmpty: "none stored",
  apiKeyHints: {
    online: "The key from OpenRouter (step 3). Goes into the system's key store, never into the settings file.",
    own: "Goes into the system's key store, never into the settings file. A local model usually needs none.",
  },
  forgetKey: "Forget",
  keySaveFailed: (detail) =>
    `The API key was not saved${detail ? ` (${detail})` : ""}. Please try again.`,
  testConnection: "Test connection",
  testing: "Testing…",
  testOk: (name) => `Answers, with “${name}”.`,

  translator: "Translation by",
  translatorModes: { model: "AI model", device: "Apple (on-device)" },
  /* Apple's translation is an extra: measured, it is wrong in sense about
     one translation in four, a cloud model in one of three hundred. What
     speaks for it is speed, and that it works offline. */
  deviceIntro:
    "Apple's translation is part of macOS: very fast and offline, but often imprecise. With the language pack downloaded, it steps in automatically whenever the AI model does not answer.",
  translatorHint: "If one of the two cannot translate, the other steps in automatically.",
  translatorNoModel: "No AI model is set up yet. Until then, Apple translates where its language packs are downloaded.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "translated", explained: "explained", assigned: "matched", detected: "language detected", words: "words matched", recognized: "text recognised" },
    and: "and",
    by: ({ kind, name }) => ({ device: ["by", "Apple (on device)"], triglosa: ["by", "Triglosa"], triglosaDevice: ["by", "Triglosa (on device)"] })[kind] || ["by", name || "the AI model"],
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Language chosen by you",
  },
  foldPanel: "Fold away",
  unfoldPanel: "Unfold",
  more: "Explain in more detail",
  moreWorking: "Explaining in more detail …",
  addExample: "Add an example sentence",
  exampleWorking: "Writing an example sentence…",
  devicePairs: "Apple's on-device translation",
  pairsChecking: "Checking…",
  pairsAllInstalled: "Every language pack for your languages is downloaded.",
  pairsNoDevice:
    "Apple's translation is not answering right now.",
  pairsRecheck: "Check again",
  pairsDownloadable: (pairs) => `Not downloaded yet: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Not possible with Apple's translation: ${pairs}. That cannot be downloaded.`,
  pairsFetch: "Get the languages…",
  pairsFetchAgain: "Ask again…",
  pairsOnTheirWay:
    "The download runs in the background and can take a few minutes, and there is nothing more for you to do. While it runs, “Ask again” shows nothing. If the macOS window was closed, just ask again.",
  pairsPrompt: "Download languages for Apple's translation",
  pairsFetched: "Requested",
  pairsBySettings:
    "Please add them under Language & Region, Translation Languages.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Fit the window's height to what it holds",
  kept: "Remember past translations",
  keptHint: "Kept until you quit Triglosa.",
  keptLast: (n) => `the last ${n}`,
  appIcon: "Icon while Triglosa is running",
  appIcons: { menubar: "in the menu bar", dock: "in the Dock", both: "in the menu bar and the Dock" },
  shortcutsLead:
    "If nothing happens here in the window when you press a shortcut, it is already taken. Pick another one.",
  hotkey: "Start translation",
  hotkeyEmpty: "no shortcut set",
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
  hotkeyTakenHere: (name) => `This shortcut is already set for “${name}”. Please choose another one.`,
  /* What the shell says about it helps rarely, so the sentence that helps
     comes first and the shell's own words follow it in brackets. */
  hotkeyFailed: (reason) =>
    "The shortcut is probably taken already"
    + (reason ? ` (${reason})` : "") + ". Please choose another one.",
  hotkeyTakenSystem:
    "This shortcut is taken by macOS. Please choose another one.",
  hotkeyTakenEverywhere:
    "Every program uses this shortcut itself. Please choose another one.",

  /* A force click is the Mac trackpad's own gesture, so it is named the way
     macOS names it, and so are the trackpad settings the hint sends the
     reader to (from the Trackpad pane's own string table). */
  wordHotkey: "Word under the pointer",
  wordHotkeyLead: "Looks up the word the pointer is on.",
  sentenceHotkey: "Sentence under the pointer",
  sentenceHotkeyLead: "Translates the whole sentence the pointer is on.",
  forceClick: "Force Click",
  forceClickHint:
    "So that Apple’s Look Up does not open as well, turn off “Look up & data detectors” in System Settings, Trackpad.",
  pointerUnreliable: "The features below do not work reliably in every program.",
  /* The sentence around a looked-up word, which goes along unless this is
     switched off: it is more than the reader selected, so it says how much. */
  withSentence: "Send the sentence along",
  withSentenceLead:
    "When you look up three words or fewer, their sentence goes to the AI model with them (30 words at most). That improves language detection and translations.",
  nextSentence: "Offer the next sentence",
  nextSentenceLead:
    "Shows the sentence that follows in the source text under the original. A click translates it.",

  /* The permission is an extra, not a requirement. It is explained before
     the system dialog comes: what it adds, what Triglosa uses it for and
     what not, and where that can be checked. macOS describes it so
     broadly that without this sentence it sounds like far more than it
     does here. */
  permission: "macOS permission for reading and inserting",
  directSelection: "Read selected text and insert translations directly",
  directSelectionLead:
    "The shortcuts take the selected text without you copying it first, and translations can be inserted straight into other programs.",
  permissionHave: "The permission is granted in macOS.",
  permissionTrust:
    "Optional: with the macOS permission “Device Control and Data Access” (under Privacy & Security, “Accessibility” up to macOS 26), Triglosa can read selected text directly, read the word or the sentence under the pointer, and insert translations straight into other programs.",
  permissionTrustUse:
    "Triglosa uses the permission only for these features and only when you switch them on. Triglosa is open source, so you can verify this:",
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

  trayTranslating: "Translate",

  trayCards: "Flashcards",

  trayCapture: "Translate selected text",
  trayCaptureCopied: "Translate copied text",
  trayCard: "Create flashcard from selected text",
  trayCardCopied: "Create flashcard from copied text",
  trayCardBlank: "New flashcard",
  trayScreen: "Translate text from a screenshot",
  trayScreenCopy: "Copy text from a screenshot",
  trayScreenCard: "Create flashcard from a screenshot",
  screenHotkey: "Translate text from a screenshot",
  screenHotkeyLead: "You draw a frame around text on the screen; Triglosa recognises and translates it.",
  screenCopyHotkey: "Copy text from a screenshot",
  screenCopyHotkeyLead: "You draw a frame around text on the screen, and the recognised text goes to the clipboard. Triglosa stays closed.",
  screenCardHotkey: "Create flashcard from a screenshot",
  screenCardHotkeyLead: "You draw a frame around text on the screen, and the recognised text goes onto a new flashcard.",
  screenPrivacy: "Screenshots are processed on your device only. Only the recognised text goes to the AI model.",
  screenPermissionTitle: "macOS permission for screenshots",
  screenPermissionLead:
    "Optional: with the macOS permission “Screen & System Audio Recording” (under Privacy & Security), Triglosa can take a screenshot of text anywhere on the screen to translate it, copy it or put it on a flashcard, and read the word or the sentence under the pointer even where a program hands over no text.",
  screenPermissionUse:
    "Triglosa records the screen only when you use one of these features. Screenshots are processed on your device only. Only the recognised text goes to the AI model.",
  screenPermissionPending:
    "macOS has added Triglosa to the list there. Please switch Triglosa on in the list, then open Triglosa again.",
  screenHint: "Drag a frame around the text · Esc cancels",
  screenReading: "Recognising the text…",
  screenNothing: "No text recognised. Please choose another part of the screen.",
  imageUnreadable: "The picture could not be opened. Please choose another one.",
  imageNothing: "No text recognised in the picture. Please choose another one.",
  dropImage: "Drop the picture here to translate it",
  /* Under a new translation's field on a computer, where a phone has its
     camera, photos and clipboard. */
  dropHint: "Drag a picture into the window to translate it.",
  dropNeedsPin: (name, pin) => ["For this, “", name, "” ", pin, " has to be on."],
  screenNoAnswer: "The text recognition did not answer. Please try again.",
  screenAbsent: "The text recognition is missing from this installation. Please reinstall Triglosa.",
  screenPermission: "Triglosa may not record the screen. Please allow it in System Settings under “Screen & System Audio Recording”.",
  screenFailed: "The screenshot did not work. Please try again.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Recognising the text in a screenshot…",
  pointerNothing: "No text found under the pointer. Please point at a word and try again.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Camera",
  pictureLibrary: "Photos",
  clipboard: "Clipboard",
  pictureNothing: "No text recognised in the picture. Please try another picture.",
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
  welcomeFind:
    "Triglosa runs in the background. You will find its book symbol at the top right, in the menu bar.",
  welcomeModel: "An AI model translates more accurately and explains terms, verbs and every word you click, at your level. Connect one in the settings under “AI model”.",
  statsSetting: "Anonymous usage statistics",
  statsHint: "Sends at most once a day that Triglosa was used: the version, the system and the kind of AI model (OpenRouter, LM Studio or other). When something goes wrong, only the kind of error. Never your texts or anything that identifies you.",
  statsThanks: "Thank you.",
  welcome: {
    heading: "Welcome to Triglosa",
    steps: "First steps",
    exampleHint: "An example. Point at a word to see what it became in your language.",
    example: {
      source: "es",
      text: "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
      panels: [
        { code: "en", text: "Although it was raining cats and dogs, we went out for a walk in the old town." },
        { code: "fr", text: "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville." },
      ],
      terms: [
        { text: "llover a cántaros", spot: "llovía a cántaros", meaning: "rain cats and dogs", note: "To rain very heavily, said informally.", in: ["raining cats and dogs", "pleuvait à verse"] },
        { text: "casco antiguo", spot: "casco antiguo", meaning: "old town", note: "The historic centre of a town.", in: ["old town", "vieille ville"] },
      ],
      verbs: [
        { form: "salimos", infinitive: "salir", tense: "Indefinido", meaning: "go out", person: "1st person plural", in: ["went out", "sommes sortis"] },
      ],
      glance: "Aunque | Although | Même s’il\nllovía | it was raining | pleuvait\na cántaros | cats and dogs | à verse\nsalimos | we went out | nous sommes sortis\na pasear | for a walk | nous promener\npor | in | dans\nel | the | la\ncasco antiguo | old town | vieille ville",
    },
    languages: "Choose your own language and the languages you are learning in the settings under “Languages”.",
    start: {
      title: "Get started.",
      select: (key) => ["Select text in any program and press ", key, "."],
      copy: (key) => ["Copy text in any program (⌘C) and press ", key, "."],
      change: "You can change the shortcut in the settings under “Shortcuts”.",
      noKey: "your shortcut",
      set: "You set it in the settings under “Shortcuts”.",
    },
    permission: {
      title: "Optional: read text directly.",
      body: "With the macOS permission “Device Control and Data Access” (“Accessibility” up to macOS 26), Triglosa reads selected text without copying and inserts translations into other programs. You grant it in the settings under “Other programs”.",
    },
    stats: {
      off: "You can turn this off at any time in the settings.",
    },
    more: (link) => ["You will find all information about Triglosa in the ", link("Readme"), " on GitHub."],
    hide: "Don’t show again",
    settings: "Open settings",
    close: "Close this note",
    open: "Show first steps",
  },
};

export const windows = {
  pointerUnreliable: "The features below read text out of other programs. That does not work reliably with every program.",
  readingPrivacy: "Triglosa reads text out of another program only when you press a shortcut, and sends it nowhere but to the AI model. Where a program hands over no text, the word and the sentence under the pointer are read off a screenshot of the area around the pointer. Screenshots are processed only on your device. Only the recognised text goes to the AI model.",
  noDevice: "No AI model is set up. Please set one up in the settings.",
  onlyKnownLanguages: "No AI model is set up. Please set one up in the settings.",
  pairMissing: () => "No AI model is set up. Please set one up in the settings.",
  modelIntro:
    "Triglosa translates and explains with an AI model: translations, terms, verbs, explanations and other features. It does not come with one.",
  lockedHow:
    "Connect an AI model in the settings for translations, terms, verbs, explanations and other features.",
  apiKeyHints: {
    online: "The key from OpenRouter (step 3). Kept in the Windows Credential Manager, never in the settings file.",
    own: "Kept in the Windows Credential Manager, never in the settings file. A local model usually needs none.",
  },
  endpointHints: {
    online: "OpenRouter’s address. For another provider, choose “Enter it yourself” above.",
    own: "Any address with an OpenAI-compatible interface — in the cloud or local.",
  },
  hotkeyLead:
    "Translates the selected text in any program. Opens the last translation when no text is selected.",
  cardHotkeyLead:
    "Creates a flashcard from the selected text. Opens a blank flashcard window when no text is selected.",
  hotkeyTakenSystem: "This shortcut is taken by Windows. Please choose another one.",
  appIcons: { menubar: "only in the notification area", both: "also in the taskbar" },
  copyFirst: (key) => `Tip: select some text in any program, then press ${key}.`,
  enterKey: "Ctrl+Enter",
  welcomeFind:
    "Triglosa runs in the background. You will find its book symbol at the bottom right next to the clock, after clicking the small arrow (^) there. To keep it always in view, hold it down with the mouse and move it down, to the right of the arrow. A click on the symbol opens the window, a right click the menu.",
  welcomeModel: "Triglosa translates with an AI model, which also explains terms, verbs and every word you click, at your level. Connect one in the settings under “AI model”.",
};

export const phone = {
  translateClipboard: "Translate the clipboard",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
  lockedBy: "For now the translation comes from Apple (on your iPhone).",
  pasteSetting: "Paste without asking",
  pasteHint: "If iOS asks every time you paste, set “Paste from Other Apps” to “Allow” for Triglosa in the iPhone’s settings.",
  pasteLater: "Later",
  cardSheetClose: "Close",
  pasteOpen: "Open iPhone settings",
  modelConsentSetting: "Send texts to the AI model",
  modelConsentHint: (host) => `Your texts go to ${host}. Without this, Apple translates on this iPhone and no text leaves it.`,
  modelConsent: {
    title: "Send texts to the AI model?",
    body: (host) => `To translate and explain, Triglosa sends your texts to the AI model you set up, at ${host}. Its provider’s own terms and privacy policy apply. Without your permission, Apple translates on this iPhone and no text leaves it.`,
    allow: "Allow",
    deny: "Don’t allow",
  },
  /* The first steps, as a sheet over the reading at the first start. */
  welcomePhone: {
    setup: "Setup",
    start: "Start a translation",
    done: "Start",
    exampleHint: "An example: a sentence, its two translations and the words worth learning, marked.",
    paste: (button) => ["Copy a text in any app, then tap ", button, " in the bar below: Triglosa translates what you copied."],
    share: "Or select text in any app, tap “Share” and choose Triglosa.",
    plus: (button) => ["Or tap ", button, " to type or paste a new text, or take a photo of one."],
    languages: "Choose your own language and the ones you are learning in the settings under “Languages”.",
    model: "An AI model translates more accurately and explains terms, verbs and every word you tap, at your level. Connect one in the settings under “AI model”. Without one, Apple translates on this iPhone.",
    card: (button) => ["Tap a word to look it up. ", button, " makes a flashcard, which you can send straight to Anki."],
  },
  /* The phone runs no model of its own: one way is prepared there. */
  ankiEnabledHint: (_code) => "Needs the AnkiMobile app.",
  ankiMissing: "Triglosa asks Anki for your decks and note types. Anki opens briefly for that.",
  ankiLaunch: "Load from Anki",
  ankiStarting: "Opening Anki …",
  ankiSending: "Opening Anki …",
  ankiRecheck: "Update decks",
  ankiRecheckHint: "Fetches your decks and note types from Anki again.",
  ankiAbsent: "AnkiMobile is not installed. Please install it from the App Store.",
  ankiLeft: "Anki sent no list. Please try again, and allow pasting if iOS asks.",
  ankiDeckHint: "Any deck Anki reported.",
  ankiNoteTypeLook: "You can see in Anki which note type a deck uses: when you add a card to that deck there, the note type is shown at the top.",
  cardClosing: "",
};

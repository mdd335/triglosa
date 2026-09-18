import { currentSystem } from "../system.js";

const TABLE = {
  de: {
    placeholder: "Text einfügen oder eintippen",
    translate: "Übersetzen",
    translateKeys: "Übersetzen (⌘↩)",
    edit: "Editieren",
    settings: "Einstellungen",
    original: "Original",
    terms: "Begriffe",
    verbs: "Verben",
    marked: "Markierung",
    synonyms: "sinnverwandt",
    wordClasses: {
      noun: "Substantiv",
      "proper noun": "Eigenname",
      adjective: "Adjektiv",
      adverb: "Adverb",
      pronoun: "Pronomen",
      preposition: "Präposition",
      conjunction: "Konjunktion",
      article: "Artikel",
      numeral: "Zahlwort",
      interjection: "Interjektion",
      singular: "Singular",
      plural: "Plural",
      masculine: "Maskulinum",
      feminine: "Femininum",
      neuter: "Neutrum",
    },
    copy: "Kopieren",
    insert: "Einfügen",
    copied: "Kopiert",
    search: "Suchen (extern)",
    opened: "Geöffnet",
    conjugation: "Konjugation (extern)",
    card: "Lernkarte",
    cardCreate: "Lernkarte erstellen",
    cardLanguage: "Sprache der Lernkarte",
    added: "Angelegt",
    synonymBack: "Voriges Wort",
    synonymForward: "Nächstes Wort",
    cardTerm: "Fremdsprache",
    cardMeaning: "Muttersprache",
    cardNote: "Erklärung",
    cardCopyAll: "Alle drei kopieren",
    cardCopyField: "Feld kopieren",
    cardToAnki: "Direkt nach Anki",
    cardAnkiStart: "Anki starten",
    cardAnkiStarting: "Anki wird gestartet …",
    cardAnkiSetup: "Stapel wählen",
    cardNoteUnmapped: "Kein Feld zugeordnet — diese Zeilen gehen nicht nach Anki.",
    ankiSaved: "Die Karte liegt im Stapel.",
    ankiDuplicate: "Diese Karte liegt schon im Stapel — Anki vergleicht dazu das erste Feld des Notiztyps.",
    ankiSending: "Wird angelegt …",
    ankiFailed: ({ kind, detail } = {}) => {
      const said = detail ? ` (${detail})` : "";
      if (kind === "unreachable") {
        return "Anki antwortet nicht. Bitte starte Anki und prüfe, ob AnkiConnect installiert ist.";
      }
      if (kind === "unconfigured") {
        return "Kein Stapel gewählt. Bitte wähle einen in den Einstellungen unter „Lernkarten“.";
      }
      if (kind === "empty") {
        return "Das erste Feld der Notiz wäre leer" + said
          + ". Bitte ordne es in den Einstellungen einer der drei Zeilen zu.";
      }
      if (kind === "no-deck") {
        return "Anki kennt diesen Stapel nicht" + said + ". Bitte wähle ihn in den Einstellungen neu.";
      }
      if (kind === "no-note-type") {
        return "Anki kennt diesen Notiztyp nicht" + said + ". Bitte wähle ihn in den Einstellungen neu.";
      }
      return "Anki hat die Karte nicht angelegt" + said + ". Bitte versuche es noch einmal.";
    },
    detecting: "Sprache wird erkannt …",
    nothingOn: (word) => `Keine Erklärung zu „${word}“ erhalten.`,
    searching: "sucht …",
    cardImprove: "Mit KI verbessern",
    cardImproving: "Die Karte wird verbessert …",
    cardUndo: "KI-Verbesserung rückgängig",
    cardImproveNothing: "Keine brauchbare Verbesserung erhalten. Die Karte bleibt unverändert.",
    linking: "verknüpft …",
    noTerms: "keine schwierigen Begriffe gefunden",
    noVerbs: "keine schwierigen Verben gefunden",
    lockedHow:
      "Verbinde in den Einstellungen ein KI-Modell für genauere Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    noAnswer: "Keine Antwort erhalten.",
    faults: {
      unreachable:
        "Keine Verbindung zum KI-Modell. Bitte prüfe die Internetverbindung und die Einstellungen.",
      timeout: "Das KI-Modell hat zu lange gebraucht. Bitte versuche es noch einmal.",
      key: (f) =>
        `Der API-Schlüssel wurde abgelehnt${why(f)}. Bitte prüfe ihn in den Einstellungen.`,
      notFound: (f) =>
        `Adresse oder Modell nicht gefunden${why(f)}. Bitte prüfe beides in den Einstellungen `
        + "– oft fehlt „/v1“ am Ende der Adresse.",
      refused: (f) =>
        `Das KI-Modell hat die Anfrage abgelehnt${why(f)}. Bitte prüfe den Modellnamen in den Einstellungen.`,
      busy: (f) =>
        `Das KI-Modell ist gerade überlastet${why(f)}. Bitte versuche es später noch einmal.`,
      server: (f) =>
        `Störung beim Anbieter des KI-Modells${why(f)}. Bitte versuche es gleich noch einmal.`,
      status: (f) =>
        `Unerwartete Antwort vom KI-Modell${why(f)}. Bitte prüfe die Einstellungen.`,
      empty: "Das KI-Modell hat eine leere Antwort geschickt. Bitte versuche es noch einmal.",
      thinking: (f) =>
        `${f.model || "Dieses KI-Modell"} denkt vor jeder Antwort nach und ist dadurch zu langsam. `
        + "Bitte wähle in den Einstellungen ein anderes Modell.",
      noModel:
        "Im lokalen Server ist kein Modell geladen. Bitte lade eines oder trage einen Modellnamen in den Einstellungen ein.",
      unknown: (f) => f.detail || "Etwas ist schiefgegangen. Bitte versuche es noch einmal.",
    },
    noDevice:
      "Apples Übersetzung antwortet nicht. Bitte richte in den Einstellungen ein KI-Modell ein.",
    onlyKnownLanguages:
      "Diese Sprache kennt Apples Übersetzung nicht. Bitte richte in den Einstellungen ein KI-Modell ein.",
    pairMissing: (from, to) =>
      `Das Sprachpaket ${from} → ${to} fehlt. Bitte richte in den Einstellungen ein KI-Modell ein oder lade das Sprachpaket dort unter „Übersetzungen“.`,

    groupLanguages: "Sprachen",
    groupSections: "Verben und Begriffe",
    groupModel: "KI-Modell",
    groupTranslation: "Übersetzungen",
    groupWindow: "Fenster",
    groupShortcuts: "Tastenkürzel",
    groupCards: "Lernkarten",
    groupAbout: "Über Triglosa",
    aboutVersion: (version) => `Version ${version}`,
    aboutProject: "Triglosa auf GitHub",
    updatesCheck: "Nach Updates suchen",
    updatesChecking: "Suche …",
    updatesHint: "Fragt GitHub nach der neuesten Version. Triglosa fragt nur, wenn du hier klickst, und lädt nichts herunter.",
    updatesNone: "Du hast die neueste Version.",
    updatesFound: (version) => `Version ${version} ist verfügbar.`,
    updatesDownload: "Zum Download",
    updatesFailed: (status) => `Keine Antwort von GitHub${status ? ` (${status})` : ""}. Bitte versuche es später noch einmal.`,

    optionOn: "an",
    optionOff: "aus",
    cardsEnabled: "Option zum Erstellen von Lernkarten",
    cardModes: {
      never: "nie",
      second: "nur bei der zweiten Sprache",
      third: "nur bei der dritten Sprache",
      foreign: "bei allen unterstützten Fremdsprachen",
    },
    ankiEnabled: "Direkt nach Anki exportieren",
    ankiEnabledHint: (code) => `Braucht Anki mit dem Add-on AnkiConnect (Code ${code}).`,
    ankiSearching: "Wird gesucht …",
    ankiMissing:
      "Anki antwortet nicht. Bitte starte Anki und prüfe, ob AnkiConnect installiert ist.",
    ankiRecheck: "Nochmal suchen",
    ankiLaunch: "Anki starten",
    ankiStarting: "Anki wird gestartet …",
    ankiDeck: "Stapel",
    ankiDeckHint:
      "Jeder Stapel, den Anki meldet. Ein Name, den es dort noch nicht gibt, wird beim ersten Speichern angelegt.",
    ankiNewDeck: "Neuer Stapel …",
    ankiDeckList: "Aus der Liste",
    ankiNoteType: "Notiztyp",
    ankiNoteTypeHint: "Der Notiztyp entscheidet, welche Felder eine Karte hat.",
    ankiNoteTypeUsed: (count) => `in diesem Stapel (${count})`,
    ankiNoteTypeFound: (name) =>
      `Die Karten im ausgewählten Stapel nutzen den Notiztyp „${name}“.`,
    ankiNoteTypeLook:
      "Der ausgewählte Stapel hat noch keine Karten, an denen sich der Notiztyp ablesen lässt. Bitte wähle ihn selbst aus.",
    ankiFields: "Felder",
    ankiFieldsHint: "Welches Feld des Notiztyps welche der drei Zeilen bekommt.",
    ankiNoField: "— nicht schreiben",
    ankiFirstField: (name) =>
      `Das erste Feld des Notiztyps („${name}“) bekommt zusätzlich das Wort in der Fremdsprache. Anki nimmt Notizen mit leerem erstem Feld nicht an.`,

    firstLanguage: "Muttersprache",
    secondLanguage: "Zweite Sprache",
    thirdLanguage: "Dritte Sprache (optional)",
    noThird: "keine",
    levelNames: {
      A1: "Anfang",
      A2: "Grundlagen",
      B1: "Mittelstufe",
      B2: "Fortgeschritten",
      C1: "Sicher",
      C2: "Nahezu muttersprachlich",
    },
    showModes: {
      never: "nie",
      second: "nur bei der zweiten Sprache",
      third: "nur bei der dritten Sprache",
      foreign: "bei allen unterstützten Fremdsprachen",
      all: "bei allen unterstützten Sprachen",
    },
    termModes: {
      never: "nie",
      second: "nur bei der zweiten Sprache",
      third: "nur bei der dritten Sprache",
      foreign: "bei allen Fremdsprachen",
      all: "bei allen Sprachen",
    },
    showVerbsHint: "Grundform, Person und Zeit zu den drei schwersten Verbformen im Text.",
    showTermsHint: "Erklärungen zu bis zu drei fortgeschrittenen Wörtern oder Redewendungen im Text.",
    underline: "Farbige Unterstreichung im Text",
    underlineHint: "Unterstreicht die Verben und Begriffe in Original und Übersetzungen.",
    glance: "Übersetzung beim Überfahren",
    glanceHint: "Zeigt über einem Wort des Originals, was ihm in deiner Sprache entspricht.",
    modelIntro:
      "Ohne KI-Modell gibt es nur Apples Übersetzung auf dem Gerät, sofern unten eingerichtet. Verbinde ein KI-Modell für genauere Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    modelHelpAsk: "Noch nie ein KI-Modell eingerichtet?",
    modelHelpLink: "Zur Anleitung",
    endpoint: "Modell-Endpunkt",
    endpointHint:
      "Jede Adresse mit OpenAI-kompatibler Schnittstelle — in der Cloud oder lokal.",
    model: "Modell",
    modelHint: "Bleibt das Feld leer, nimmt die App das erste Modell, das der Endpunkt anbietet.",
    apiKey: "Schlüssel",
    apiKeyEmpty: "keiner hinterlegt",
    apiKeyHint:
      "Landet im Schlüsselbund des Systems, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
    forgetKey: "Vergessen",
    keySaveFailed: (detail) =>
      `Der Schlüssel wurde nicht gespeichert${detail ? ` (${detail})` : ""}. Bitte versuche es noch einmal.`,
    testConnection: "Verbindung prüfen",
    testing: "Wird geprüft …",
    testOk: (name) => `Antwortet, mit „${name}“.`,

    translator: "Übersetzung durch",
    translatorModes: { model: "KI-Modell", device: "Apple (auf dem Gerät)" },
    deviceIntro:
      "Optional kannst du für die Übersetzungen selbst Apples Übersetzung auf dem Gerät einrichten. Sie ist sehr schnell und funktioniert offline, ist aber oft ungenau.",
    translatorHint: "Kann eines der beiden nicht übersetzen, springt das andere ein, sofern es eingerichtet ist.",
    translatorNoModel: "Noch ist kein KI-Modell eingerichtet. Bis dahin übersetzt Apple, soweit die Sprachpakete installiert sind.",
    translatedBy: { device: "von Apple übersetzt", model: "vom KI-Modell übersetzt" },
    foldPanel: "Einklappen",
    unfoldPanel: "Ausklappen",
    more: "Ausführlicher erklären",
    moreWorking: "Wird ausführlicher erklärt …",
    addExample: "Beispielsatz hinzufügen",
    exampleWorking: "Beispielsatz wird geschrieben …",
    devicePairs: "Apples Übersetzung auf dem Gerät nutzen",
    pairsChecking: "Wird geprüft …",
    pairsAllInstalled: "Alle Sprachpakete für deine Sprachen sind installiert.",
    pairsNoDevice:
      "Apples Übersetzung antwortet gerade nicht.",
    pairsDownloadable: (pairs) => `Noch nicht geladen: ${pairs}.`,
    pairsUnsupported: (pairs) =>
      `Nicht möglich mit Apples Übersetzung: ${pairs}. Das lässt sich nicht nachladen.`,
    pairsFetch: "Sprachen laden …",
    pairsFetchAgain: "Erneut anfordern …",
    pairsOnTheirWay:
      "Der Download läuft im Hintergrund und kann einige Minuten dauern. Wurde das Fenster von macOS geschlossen, einfach erneut anfordern.",
    pairsPrompt: "Sprachen für Apples Übersetzung laden",
    pairsFetched: "Angefordert",
    pairsBySettings:
      "Bitte in „Sprache & Region“ unter „Übersetzungssprachen“ hinzufügen.",
    pairArrow: (from, to) => `${from} → ${to}`,

    closeOnBlur: "Übersetzungsfenster schließen, wenn woanders hingeklickt wird",
    fitWindow: "Fensterhöhe automatisch an den Inhalt anpassen",
    appIcon: "Symbol, während Triglosa läuft",
    appIcons: { menubar: "in der Menüleiste", dock: "im Dock", both: "in Menüleiste und Dock" },
    shortcutsLead:
      "Passiert beim Drücken einer Kombination hier im Fenster nichts, ist die Kombination schon vergeben. Wähle dann eine andere.",
    hotkey: "Übersetzung starten",
    hotkeyEmpty: "keines gesetzt",
    hotkeyRecording: "Kombination drücken …",
    hotkeyClear: "Löschen",
    hotkeyLead:
      "Übersetzt Text aus jedem Programm: Text kopieren (⌘C), dann das Kürzel drücken. Öffnet die letzte Übersetzung, wenn nichts Neues kopiert ist.",
    hotkeyLeadSelected:
      "Übersetzt den markierten Text in jedem Programm. Öffnet die letzte Übersetzung, wenn kein Text markiert ist.",
    freshHotkey: "Neue Übersetzung",
    cardHotkey: "Lernkarte erstellen",
    cardHotkeyLead:
      "Erstellt eine Lernkarte aus dem kopierten Text (⌘C). Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn nichts Neues kopiert ist.",
    cardHotkeyLeadSelected:
      "Erstellt eine Lernkarte basierend auf dem markierten Text. Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn kein Text markiert ist.",
    hotkeyTakenHere: (name) => `Diese Kombination ist schon für „${name}“ gesetzt. Bitte wähle eine andere.`,
    hotkeyFailed: (reason) =>
      "Das Tastenkürzel ist vermutlich schon vergeben"
      + (reason ? ` (${reason})` : "") + ". Bitte wähle eine andere Kombination.",
    hotkeyTakenSystem:
      "Diese Kombination ist von macOS belegt. Bitte wähle eine andere.",
    hotkeyTakenEverywhere:
      "Diese Kombination nutzt jedes Programm selbst. Bitte wähle eine andere.",

    permission: "Markierten Text direkt übernehmen",
    permissionWhy:
      "Optional kannst du markierten Text übersetzen oder als Lernkarte übernehmen, ohne ihn vorher zu kopieren, und Übersetzungen direkt in andere Programme einfügen.",
    permissionHave: "Eingeschaltet.",
    permissionTrust:
      "Dafür braucht Triglosa die macOS-Berechtigung „Gerätesteuerung und Datenzugriff“ unter Datenschutz & Sicherheit (bis macOS 26 „Bedienungshilfen“). Triglosa nutzt sie nur zum Lesen des markierten Texts und zum Einfügen, und nur, wenn du es darum bittest. Triglosa ist Open Source, du kannst das also nachprüfen:",
    permissionCode: "zum Code",
    permissionAsk: "Erlauben …",
    permissionOpen: "Systemeinstellungen öffnen",
    permissionPending:
      "macOS hat Triglosa dort in die Liste aufgenommen. Bitte schalte Triglosa in der Liste ein — dieses Fenster merkt es von selbst.",
    copyFirst: (key) => `Tipp: Text in einem Programm kopieren (⌘C), dann ${key} drücken.`,
    captureFailed: "Die Auswahl ließ sich nicht lesen. Bitte kopiere den Text und füge ihn hier ein.",

    inserted: "Eingefügt",
    insertNoWay: (reason) =>
      reason === "focus" ? "Kein Programm zum Einfügen"
      : reason === "accessibility" ? "Berechtigung fehlt"
      : "Nicht eingefügt",

    trayCapture: "Markierten Text übersetzen",
    trayCaptureCopied: "Kopierten Text übersetzen",
    trayCard: "Lernkarte aus markiertem Text erstellen",
    trayCardCopied: "Lernkarte aus kopiertem Text erstellen",
    trayCardBlank: "Neue Lernkarte",
    trayShow: "Fenster zeigen",
    trayUpdates: "Nach Updates suchen",
    trayHelp: "Hilfe",
    trayProblem: "Problem melden",
    trayRestart: "Triglosa neu starten",
    trayQuit: "Triglosa beenden",
    settingsOpen: "Einstellungen öffnen",
    historyBack: "Vorige Übersetzung",
    historyForward: "Nächste Übersetzung",
    newReading: "Neue Übersetzung",
    closeWindow: "Fenster schließen",
  },
  en: {
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

    closeOnBlur: "Close the translation window when clicking elsewhere",
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
  },
};

/* What stands in a window's title bar. The app's name is not translated and
   the rest is, so the two are joined in one place rather than in each
   window. */
export const windowTitle = (name) => `Triglosa · ${name}`;

/* What is worded differently on Windows: no translation on the device, so
   the model is what everything waits for; no permission to explain; the
   keyboard's Ctrl rather than ⌘; and the system's own name. Each sentence is
   written for somebody who only ever sees this system: nothing is worded as a
   difference from the other one. Laid over the
   table rather than beside it, so the Mac's wording has one place. */
const WINDOWS = {
  de: {
    noDevice: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
    onlyKnownLanguages: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
    pairMissing: () => "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
    modelIntro:
      "Triglosa übersetzt und erklärt mit einem KI-Modell. Verbinde eines für Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    lockedHow:
      "Verbinde in den Einstellungen ein KI-Modell für Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    apiKeyHint:
      "Landet in der Windows-Anmeldeinformationsverwaltung, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
    hotkeyLead:
      "Übersetzt den markierten Text in jedem Programm. Öffnet die letzte Übersetzung, wenn kein Text markiert ist.",
    cardHotkeyLead:
      "Erstellt eine Lernkarte basierend auf dem markierten Text. Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn kein Text markiert ist.",
    hotkeyTakenSystem: "Diese Kombination ist von Windows belegt. Bitte wähle eine andere.",
    appIcons: { menubar: "nur im Infobereich", both: "auch in der Taskleiste" },
    copyFirst: (key) => `Tipp: Text in einem Programm markieren, dann ${key} drücken.`,
    translateKeys: "Übersetzen (Strg+Enter)",
  },
  en: {
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
  },
};

const OVERLAID = {};

export function labels(code, system = currentSystem()) {
  const language = TABLE[String(code || "").toLowerCase()] ? String(code).toLowerCase() : "en";
  if (system !== "windows") return TABLE[language];
  OVERLAID[language] = OVERLAID[language] || { ...TABLE[language], ...WINDOWS[language] };
  return OVERLAID[language];
}

/* What goes in brackets after the fact: the HTTP number, where there is one,
   and the service's own words where they explain something. For a refusal
   they are often the whole of it — "model not found", "Reasoning is mandatory
   for this endpoint" — and for "nothing answered" they are "Failed to fetch",
   which explains nothing. English, because that is what came back. Right
   after the fact and before what to do, so the sentence still ends on that. */
const WITH_DETAIL = new Set(["refused", "notFound", "status", "server"]);

const why = (f) => {
  const said = [f.status, f.shown].filter(Boolean).join(": ");
  return said ? ` (${said})` : "";
};

/* One failure, in words: what happened, then what to do. Everything that
   goes wrong outside the process arrives here as a fault — see faults.js —
   and leaves as one sentence in the language the interface is in. */
export function faultText(code, fault) {
  const text = labels(code);
  const kind = (fault && fault.kind) || "unknown";
  const entry = text.faults[kind] || text.faults.unknown;
  const detail = WITH_DETAIL.has(kind) ? String((fault && fault.detail) || "").trim() : "";
  return typeof entry === "function" ? entry({ ...fault, shown: detail }) : entry;
}

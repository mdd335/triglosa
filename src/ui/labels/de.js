import { why } from "./detail.js";

export default {
  placeholder: "Text einfügen oder eintippen",
  translate: "Übersetzen",
  translateKeys: "Übersetzen (⌘↩)",
  enterKey: "⌘↩",
  edit: "Editieren",
  settings: "Einstellungen",
  original: "Original",
  terms: "Begriffe",
  term: "Begriff",
  verbs: "Verben",
  marked: "Markierung",
  inSentence: "hier",
  previousSentence: "Vorheriger Satz",
  nextSentenceLine: "Nächster Satz",
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
  speak: "Aussprechen",
  opened: "Geöffnet",
  conjugation: "Konjugation (extern)",
  card: "Lernkarte",
  cardCreate: "Lernkarte erstellen",
  cardLanguage: "Sprache der Lernkarte",
  sourceLanguage: "Sprache ändern",
  otherLanguage: "Andere Sprache …",
  findLanguage: "Sprache eingeben",
  unknownLanguage: "Unbekannte Sprache",
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
  cardClosing: "Das Fenster wird geschlossen.",
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
  cardDetecting: "Die Sprache wird erkannt …",
  cardImproving: "Die Karte wird verbessert …",
  cardUndo: "KI-Verbesserung rückgängig",
  cardImproveNothing: "Keine brauchbare Verbesserung erhalten. Die Karte bleibt unverändert.",
  linking: "verknüpft …",
  noTerms: "keine schwierigen Begriffe gefunden",
  noTerm: "kein schwieriger Begriff gefunden",
  noVerbs: "keine schwierigen Verben gefunden",
  lockedHow:
    "Verbinde in den Einstellungen ein KI-Modell für genauere Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen.",
  noAnswer: "Keine Antwort erhalten.",
  faults: {
    unreachable:
      "Keine Verbindung zum KI-Modell. Bitte prüfe die Internetverbindung und die Einstellungen.",
    insecure:
      "Die Adresse des KI-Modells ist unverschlüsselt (http). Bitte nutze in den Einstellungen https oder eine Adresse im eigenen Netz.",
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
  groupSections: "Begriffe und Verben",
  groupModel: "KI-Modell",
  groupTranslation: "Übersetzungen",
  groupWindow: "Fenster",
  groupShortcuts: "Tastenkürzel",
  groupReading: "Text aus anderen Programmen",
  groupCards: "Lernkarten",
  groupAbout: "Über Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa findest du auf ", link("project", "GitHub"), ", Hilfe dort in der ", link("help", "Readme"), ". Wenn dir ein Fehler auffällt oder du dir eine Funktion wünschst, eröffne gern ein ", link("issues", "Issue"), "."],
  updatesCheck: "Nach Updates suchen",
  updatesChecking: "Suche …",
  updatesHint: "Fragt GitHub nach der neuesten Version, nur wenn du hier klickst. Heruntergeladen wird erst, wenn du auf „Jetzt installieren“ klickst.",
  updatesNone: "Du hast die neueste Version.",
  updatesFound: (version) => `Version ${version} ist verfügbar.`,
  updatesDownload: "Zum Download",
  updatesInstall: "Jetzt installieren",
  updatesLoading: (percent) => `Wird geladen … ${percent} %`,
  updatesInstalling: "Wird installiert … Triglosa startet gleich neu.",
  updatesInstallNone: "Diese Version lässt sich nicht von hier aus installieren. Bitte nutze „Zum Download“.",
  updatesInstallUnreachable: "Das Update ließ sich nicht laden. Bitte versuche es später noch einmal.",
  updatesInstallFailed: (detail) => `Das Update wurde nicht installiert${detail ? ` (${detail})` : ""}. Bitte nutze „Zum Download“.`,
  diagnosticsCopy: "Diagnose kopieren",
  diagnosticsHint: "Für einen Problembericht: Version, System, Sprachen, KI-Modell und letzte Fehler. Nie deine Texte oder dein API-Schlüssel. Gesendet wird nichts, du fügst es selbst ein.",
  updatesFailed: (status) => `Keine Antwort von GitHub${status ? ` (${status})` : ""}. Bitte versuche es später noch einmal.`,

  optionOn: "an",
  optionOff: "aus",
  cardsEnabled: "Lernkarten anbieten",
  cardModes: {
    never: "nie",
    second: "nur bei der zweiten Sprache",
    third: "nur bei der dritten Sprache",
    foreign: "bei allen unterstützten Fremdsprachen",
  },
  cardsImprove: "Lernkarten automatisch mit KI verbessern",
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
  showVerbsHint: "Grundform, Person und Zeit zu bis zu drei fortgeschrittenen Verbformen im Text.",
  showTermsHint: "Erklärungen zu bis zu drei fortgeschrittenen Wörtern oder Redewendungen im Text.",
  underline: "Farbige Unterstreichung im Text",
  searchEngine: "Suchmaschine",
  searchHint: "Für „Suchen (extern)“ bei Begriffen, Verben und markierten Wörtern. Geöffnet wird im Standardbrowser.",
  searchSystem: "wie in Safari eingestellt",
  glance: "Wortübersetzung beim Zeigen",
  glanceHint: "Zeigt über Wörtern in Fremdsprachen, was ihnen in deiner Sprache entspricht.",
  modelIntro:
    "Ohne KI-Modell gibt es nur Apples Übersetzung auf dem Gerät, sofern das Sprachpaket geladen ist. Verbinde ein KI-Modell für genauere Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen.",
  modelHelpAsk: "Noch nie ein KI-Modell eingerichtet?",
  modelHelpLink: "Zur Anleitung",
  endpoint: "Adresse des KI-Modells",
  endpointHint:
    "Jede Adresse mit OpenAI-kompatibler Schnittstelle — in der Cloud oder lokal.",
  model: "Modell",
  modelHint: "Bleibt das Feld leer, nimmt die App das erste Modell, das unter der Adresse angeboten wird.",
  apiKey: "API-Schlüssel",
  apiKeyEmpty: "keiner hinterlegt",
  apiKeyHint:
    "Landet im Schlüsselbund des Systems, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
  forgetKey: "Vergessen",
  keySaveFailed: (detail) =>
    `Der API-Schlüssel wurde nicht gespeichert${detail ? ` (${detail})` : ""}. Bitte versuche es noch einmal.`,
  testConnection: "Verbindung prüfen",
  testing: "Wird geprüft …",
  testOk: (name) => `Antwortet, mit „${name}“.`,

  translator: "Übersetzung durch",
  translatorModes: { model: "KI-Modell", device: "Apple (auf dem Gerät)" },
  deviceIntro:
    "Apples Übersetzung ist Teil von macOS: sehr schnell und offline, aber oft ungenau. Ist das Sprachpaket geladen, springt sie automatisch ein, wenn das KI-Modell nicht antwortet.",
  translatorHint: "Kann eines von beiden nicht übersetzen, springt das andere automatisch ein.",
  translatorNoModel: "Noch ist kein KI-Modell eingerichtet. Bis dahin übersetzt Apple, soweit die Sprachpakete geladen sind.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "übersetzt", explained: "erklärt", assigned: "zugeordnet", detected: "Sprache erkannt", words: "Wörter zugeordnet" },
    and: "und",
    by: ({ kind, name }) => ({ device: ["von", "Apple (auf dem Gerät)"], triglosa: ["von", "Triglosa"] })[kind] || (name ? ["von", name] : ["vom", "KI-Modell"]),
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Sprache von dir gewählt",
  },
  foldPanel: "Einklappen",
  unfoldPanel: "Ausklappen",
  more: "Ausführlicher erklären",
  moreWorking: "Wird ausführlicher erklärt …",
  addExample: "Beispielsatz hinzufügen",
  exampleWorking: "Beispielsatz wird geschrieben …",
  devicePairs: "Apples Übersetzung auf dem Gerät",
  pairsChecking: "Wird geprüft …",
  pairsAllInstalled: "Alle Sprachpakete für deine Sprachen sind geladen.",
  pairsNoDevice:
    "Apples Übersetzung antwortet gerade nicht.",
  pairsRecheck: "Erneut prüfen",
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
    "Bitte in „Sprache & Region“ unter „Sprachen zum Übersetzen“ hinzufügen.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Fensterhöhe automatisch an den Inhalt anpassen",
  kept: "Vergangene Übersetzungen merken",
  keptLast: (n) => `die letzten ${n}`,
  appIcon: "Symbol, während Triglosa läuft",
  appIcons: { menubar: "in der Menüleiste", dock: "im Dock", both: "in Menüleiste und Dock" },
  shortcutsLead:
    "Passiert beim Drücken eines Tastenkürzels hier im Fenster nichts, ist es schon vergeben. Wähle dann ein anderes.",
  hotkey: "Übersetzung starten",
  hotkeyEmpty: "kein Tastenkürzel gesetzt",
  hotkeyRecording: "Kombination drücken …",
  hotkeyClear: "Löschen",
  hotkeyLead:
    "Übersetzt Text aus jedem Programm: Text kopieren (⌘C), dann das Tastenkürzel drücken. Öffnet die letzte Übersetzung, wenn nichts Neues kopiert ist.",
  hotkeyLeadSelected:
    "Übersetzt den markierten Text in jedem Programm. Öffnet die letzte Übersetzung, wenn kein Text markiert ist.",
  freshHotkey: "Neue Übersetzung",
  cardHotkey: "Lernkarte erstellen",
  cardHotkeyLead:
    "Erstellt eine Lernkarte aus dem kopierten Text (⌘C). Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn nichts Neues kopiert ist.",
  cardHotkeyLeadSelected:
    "Erstellt eine Lernkarte basierend auf dem markierten Text. Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn kein Text markiert ist.",
  hotkeyTakenHere: (name) => `Dieses Tastenkürzel ist schon für „${name}“ gesetzt. Bitte wähle ein anderes.`,
  hotkeyFailed: (reason) =>
    "Das Tastenkürzel ist vermutlich schon vergeben"
    + (reason ? ` (${reason})` : "") + ". Bitte wähle ein anderes.",
  hotkeyTakenSystem:
    "Dieses Tastenkürzel ist von macOS belegt. Bitte wähle ein anderes.",
  hotkeyTakenEverywhere:
    "Dieses Tastenkürzel nutzt jedes Programm selbst. Bitte wähle ein anderes.",

  wordHotkey: "Wort unter dem Zeiger",
  wordHotkeyLead: "Schlägt das Wort nach, auf dem der Zeiger steht.",
  sentenceHotkey: "Satz unter dem Zeiger",
  sentenceHotkeyLead: "Übersetzt den ganzen Satz, auf dem der Zeiger steht.",
  forceClick: "Wort mit kräftigem Klick nachschlagen",
  forceClickLead:
    "Ein kräftiger Klick auf dem Trackpad schlägt das Wort unter dem Zeiger nach.",
  forceClickHint:
    "Damit nicht zusätzlich Apples Nachschlagen aufgeht, deaktiviere in den Systemeinstellungen bei Trackpad die Option „Nachschlagen & Datenerkennung“.",
  pointerUnreliable: "Die folgenden Funktionen funktionieren nicht in jedem Programm zuverlässig.",
  withSentence: "Satz mitschicken",
  withSentenceLead:
    "Wenn du bis zu drei Wörter nachschlägst, geht ihr Satz mit an das KI-Modell (höchstens 30 Wörter). Das verbessert Spracherkennung und Übersetzungen.",
  nextSentence: "Nächsten Satz anbieten",
  nextSentenceLead:
    "Zeigt unter dem Original den Satz, der im Ursprungstext folgt. Ein Klick übersetzt ihn.",

  permission: "macOS-Berechtigung",
  directSelection: "Markierten Text direkt lesen und einfügen",
  directSelectionLead:
    "Die Tastenkürzel übernehmen markierten Text, ohne dass du ihn vorher kopierst, und Übersetzungen lassen sich direkt in andere Programme einfügen.",
  permissionHave: "Die Berechtigung ist in macOS erteilt.",
  permissionTrust:
    "Optional: Mit der macOS-Berechtigung „Gerätesteuerung und Datenzugriff“ (unter Datenschutz & Sicherheit, bis macOS 26 „Bedienungshilfen“) kann Triglosa markierten Text direkt lesen, das Wort oder den Satz unter dem Zeiger lesen und Übersetzungen direkt in andere Programme einfügen. Triglosa nutzt die Berechtigung nur für diese Funktionen und nur, wenn du sie aktivierst. Triglosa ist Open Source, du kannst das also nachprüfen:",
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
  pinWindow: "Im Vordergrund halten",
  unpinWindow: "Nicht mehr im Vordergrund halten",
};

export const windows = {
  noDevice: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  onlyKnownLanguages: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  pairMissing: () => "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  modelIntro:
    "Triglosa übersetzt und erklärt mit einem KI-Modell. Verbinde eines für Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen.",
  lockedHow:
    "Verbinde in den Einstellungen ein KI-Modell für Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen.",
  apiKeyHint:
    "Landet in der Windows-Anmeldeinformationsverwaltung, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
  hotkeyLead:
    "Übersetzt den markierten Text in jedem Programm. Öffnet die letzte Übersetzung, wenn kein Text markiert ist.",
  cardHotkeyLead:
    "Erstellt eine Lernkarte basierend auf dem markierten Text. Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn kein Text markiert ist.",
  hotkeyTakenSystem: "Dieses Tastenkürzel ist von Windows belegt. Bitte wähle ein anderes.",
  appIcons: { menubar: "nur im Infobereich", both: "auch in der Taskleiste" },
  copyFirst: (key) => `Tipp: Text in einem Programm markieren, dann ${key} drücken.`,
  translateKeys: "Übersetzen (Strg+Enter)",
  enterKey: "Strg+Enter",
};

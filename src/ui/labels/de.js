import { why } from "./detail.js";

export default {
  placeholder: "Text einfügen oder eintippen",
  translate: "Übersetzen",
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
  /* A looked-up word found misspelled: the line under it, the typed word
     in it a link that looks it up as typed. */
  correctedFrom: (typed) => `Korrigiert aus ${typed}`,
  didYouMean: (word) => `Meintest du ${word}?`,
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
  paste: "Einfügen",
  settingsDone: "Fertig",
  search: "Suchen (extern)",
  searchWith: (name) => `Mit ${name} suchen`,
  speak: "Aussprechen",
  opened: "Geöffnet",
  conjugation: "Konjugation (extern)",
  card: "Lernkarte erstellen",
  cardCreate: "Lernkarte erstellen",
  cardLanguage: "Sprache der Lernkarte",
  sourceLanguage: "Sprache ändern",
  addLanguage: "Sprache hinzufügen",
  removeLanguage: "Sprache entfernen",
  unknownLanguage: "Unbekannte Sprache",
  added: "Angelegt",
  synonymBack: "Voriges Wort",
  synonymForward: "Nächstes Wort",
  cardTerm: "Fremdsprache",
  cardMeaning: "Muttersprache",
  cardNote: "Notizen",
  cardCopyAll: "Lernkarte kopieren",
  cardCopyField: "Feld kopieren",
  cardToAnki: "In Anki speichern",
  cardAnkiStart: "Anki starten",
  cardAnkiStarting: "Anki wird gestartet …",
  cardAnkiSetup: "Anki-Stapel wählen",
  cardNoteUnmapped: "Kein Feld zugeordnet — diese Zeilen gehen nicht nach Anki.",
  ankiSaved: (deck) => (deck ? `Die Karte liegt im Stapel „${deck}“.` : "Die Karte liegt im Stapel."),
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
  /* Without a model: Apple writes the side a card is missing. */
  cardComplete: "Mit Apple übersetzen",
  cardCompleting: "Apple übersetzt …",
  cardCompleteUndo: "Übersetzung rückgängig",
  cardCompleteNothing: "Keine Übersetzung von Apple erhalten. Bitte prüfe die Sprachpakete in den Einstellungen.",
  cardHow: "Verbinde in den Einstellungen ein KI-Modell für eine genauere Übersetzung, eine Erklärung und Beispielsätze.",
  linking: "verknüpft …",
  noTerms: "keine schwierigen Begriffe gefunden",
  noTerm: "kein schwieriger Begriff gefunden",
  noVerbs: "keine schwierigen Verben gefunden",
  /* Said where Apple translated, before what a model adds there. */
  byApple: "Übersetzt von Apple (auf diesem Gerät).",
  lockedHow:
    "Verbinde in den Einstellungen ein KI-Modell für genauere Übersetzungen, Begriffe, Verben und Erklärungen zu jedem Wort.",
  lockedHowShort:
    "Verbinde in den Einstellungen ein KI-Modell für genauere Übersetzungen, weitere Bedeutungen und Erklärungen.",
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
  /* Only where the pack can be downloaded; where Apple cannot translate the
     pair at all, `pairUnsupported`. */
  packMissing: (from, to) =>
    `Das Sprachpaket ${from} → ${to} fehlt. Bitte lade es in den Einstellungen unter „Übersetzungen“.`,
  pairUnsupported: (from, to) =>
    `Apples Übersetzung kann ${from} → ${to} nicht übersetzen. Bitte richte in den Einstellungen ein KI-Modell ein.`,

  groupLanguages: "Sprachen",
  groupSections: "Begriffe und Verben",
  groupModel: "KI-Modell",
  groupTranslation: "Übersetzungen",
  groupWindow: "Fenster",
  groupShortcuts: "Tastenkürzel",
  groupReading: "Text aus anderen Programmen",
  groupReadingEntry: "Andere Programme",
  groupCards: "Lernkarten",
  groupAbout: "Über Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  aboutNotes: "Versionshinweise anzeigen",
  /* The way to the project, then a box for help and one for feedback, each with a sentence with its link in it. */
  aboutProject: (link) => ["Alle Infos und den Code von Triglosa findest du auf ", link("GitHub"), "."],
  groupHelp: "Hilfe",
  aboutHelp: (link) => ["Weitere Hilfe findest du in der ", link("Readme"), "."],
  groupFeedback: "Feedback",
  aboutIssues: (link) => ["Wenn dir ein Fehler auffällt oder du dir eine Funktion wünschst, eröffne gern ein ", link("Issue"), " auf GitHub."],
  /* The other two systems Triglosa is made for, the link leading to the README's installing. */
  aboutElsewhere: (system, link) => ["Es gibt Triglosa auch für ", link({ mac: "Windows und iPhone", windows: "Mac und iPhone", ios: "Windows und Mac" }[system]), "."],
  updatesCheck: "Nach Updates suchen",
  updatesChecking: "Suche …",
  updatesHint: "Fragt GitHub nach der neuesten Version. Heruntergeladen wird erst, wenn du auf „Jetzt installieren“ klickst.",
  updatesNone: "Du hast die neueste Version.",
  updatesFound: (version) => `Version ${version} ist verfügbar.`,
  updatesDownload: "Download und Versionshinweise anzeigen",
  updatesInstall: "Jetzt installieren",
  updatesLoading: (percent) => `Wird geladen … ${percent} %`,
  updatesInstalling: "Wird installiert … Triglosa startet gleich neu.",
  updatesInstallNone: "Diese Version lässt sich nicht von hier aus installieren. Bitte lade sie selbst herunter.",
  updatesInstallUnreachable: "Das Update ließ sich nicht laden. Bitte versuche es später noch einmal.",
  updatesInstallFailed: (detail) => `Das Update wurde nicht installiert${detail ? ` (${detail})` : ""}. Bitte lade es selbst herunter.`,
  diagnosticsCopy: "Diagnose kopieren",
  diagnosticsHint: "Für einen Problembericht: Version, System, Sprachen, KI-Modell und letzte Fehler. Nie deine Texte oder dein API-Schlüssel. Gesendet wird nichts, du fügst es selbst ein.",
  updatesFailed: (status) => `Keine Antwort von GitHub${status ? ` (${status})` : ""}. Bitte versuche es später noch einmal.`,

  optionOff: "aus",
  cardsEnabled: "Knopf für Lernkarten anzeigen",
  cardsEnabledHint:
    "„Lernkarte kopieren“ kopiert die drei Felder als eine Zeile mit Tabulatoren, für eine Tabelle oder Ankis Import aus einer Datei.",
  cardModes: {
    never: "nie",
    second: "nur bei der zweiten Sprache",
    third: "nur bei der dritten Sprache",
    learned: "bei der zweiten und dritten Sprache",
    foreign: "bei allen Fremdsprachen",
  },
  cardsImprove: "Lernkarten automatisch mit KI verbessern",
  cardsImproveHint: "Karten können immer per Knopfdruck mit KI verbessert werden.",
  ankiEnabled: "Direkt nach Anki exportieren",
  ankiEnabledHint: (code) => `Braucht Anki mit dem Add-on AnkiConnect (Code ${code}).`,
  ankiSync: "Anki nach jeder Karte synchronisieren",
  ankiSyncHint:
    "Funktioniert nur, wenn AnkiWeb eingerichtet ist.",
  ankiSearching: "Wird gesucht …",
  ankiMissing:
    "Anki antwortet nicht. Bitte starte Anki und prüfe, ob AnkiConnect installiert ist.",
  ankiRecheck: "Nochmal suchen",
  ankiLaunch: "Anki starten",
  ankiStarting: "Anki wird gestartet …",
  ankiDeck: "Anki-Stapel",
  ankiAddLanguage: "Sprache hinzufügen",
  ankiRemoveLanguage: "Sprache entfernen",
  ankiTargetChoice: "Sprache",
  ankiPerLanguage: "Anki-Einstellungen pro Sprache",
  ankiDeckHint:
    "Jeder Stapel, den Anki meldet. Ein Name, den es dort noch nicht gibt, wird beim ersten Speichern angelegt.",
  ankiNewDeck: "Neuer Stapel …",
  ankiDeckList: "Aus der Liste",
  ankiNoteType: "Anki-Notiztyp",
  ankiNoteTypeHint: "Der Notiztyp entscheidet, welche Felder eine Karte hat.",
  ankiNoteTypeUsed: (count) => `in diesem Stapel (${count})`,
  ankiNoteTypeFound: (name) =>
    `Die Karten im ausgewählten Stapel nutzen den Notiztyp „${name}“.`,
  ankiNoteTypeLook:
    "Der ausgewählte Stapel hat noch keine Karten, an denen sich der Notiztyp ablesen lässt. Bitte wähle ihn selbst aus.",
  ankiFields: "Anki-Felder",
  ankiFieldsHint: "Welches Feld des Notiztyps welche der drei Zeilen bekommt.",
  ankiNoField: "— nicht schreiben",
  ankiFirstField: (name) =>
    `Das erste Feld des Notiztyps („${name}“) bekommt zusätzlich das Wort in der Fremdsprache. Anki nimmt Notizen mit leerem erstem Feld nicht an.`,

  languagesIntro: ["Triglosa zeigt jeden Text neben seinen Übersetzungen in diesen Sprachen (höchstens zwei Übersetzungen).", "Dein eingestelltes Niveau bestimmt, welche Begriffe und Verben in der jeweiligen Sprache erklärt werden und wie einfach Erklärungen und Beispielsätze geschrieben sind, auch auf Lernkarten.", "Im Übersetzungsfenster kannst du die Sprache einer Übersetzung vorübergehend ändern oder eine dritte hinzufügen. Das gilt bis zum Beenden von Triglosa."],
  firstLanguage: "Muttersprache",
  firstLanguageHint: "Auch die Sprache der App.",
  secondLanguage: "Zweite Sprache",
  thirdLanguage: "Dritte Sprache (optional)",
  noThird: "keine",
  languagesTuned: "Optimiert",
  languagesOther: "Nicht optimiert",
  otherLanguageHint:
    "Für diese Sprache ist Triglosa nicht optimiert: Fehler sind häufiger, und der Abschnitt „Verben“ entfällt. Je leistungsfähiger das KI-Modell, desto besser das Ergebnis.",
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
    foreign: "bei allen optimierten Fremdsprachen",
    all: "bei allen optimierten Sprachen",
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
  showTerms: "Begriffe anzeigen",
  showVerbs: "Verben anzeigen",
  underline: "Farbige Unterstreichung im Text",
  searchEngine: "Suchmaschine",
  searchHint: "Für die Suche im Web bei Begriffen, Verben und markierten Wörtern. Geöffnet wird im Standardbrowser.",
  searchSystem: "wie in Safari eingestellt",
  glance: "Wortübersetzung beim Zeigen",
  glanceHint: "Zeigt über Wörtern in Fremdsprachen, was ihnen in deiner Sprache entspricht.",
  modelIntro:
    "Ohne KI-Modell gibt es nur Apples Übersetzung auf diesem Gerät, sofern das Sprachpaket geladen ist. Ein KI-Modell bringt genauere Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen. Triglosa bringt selbst keins mit.",
  modelQuestion: "Welche Art von Verbindung möchtest du nutzen?",
  modelWays: "Eine gut funktionierende Möglichkeit ist der etablierte Anbieter OpenRouter. Alternativ kannst du einen beliebigen Anbieter eintragen.",
  setupOnline: "OpenRouter",
  setupOnlineLine: "Genau und schnell. OpenRouter ist ein eigenständiger Anbieter, bei dem du Guthaben aufladen musst.",
  setupOwn: "Beliebiger Anbieter",
  setupRecommended: (name, filled) => `Empfohlenes Modell: ${name}${filled ? ", schon eingetragen" : ""}`,
  setupOnlineSteps: (site, key, privacy) => [
    ["Lege ein Konto an auf ", site("openrouter.ai"), "."],
    ["Lade Guthaben auf – 5 € reichen für viele tausend Übersetzungen."],
    ["Erstelle einen ", key("API-Schlüssel"), " und füge ihn unten ein."],
    ["Optional: Schalte in den ", privacy("Datenschutz-Einstellungen"), " „Zero Data Retention“ ein für mehr Datenschutz."],
  ],
  setupOnlineFree: (name) => `Ohne Guthaben funktioniert auch eine kostenlose Version von ${name}, die Google anbietet. Es reicht aber nur für wenige Übersetzungen am Tag, und deine Texte können von Google gespeichert und zum Training verwendet werden. Es eignet sich daher nur zum Ausprobieren und funktioniert nicht mit eingeschalteter Zero Data Retention.`,
  setupOnlineFreeTake: "Kostenloses Modell eintragen",
  setupOnlinePaidTake: "Empfohlenes Modell eintragen",
  setupMore: (guide) => ["Mehr Informationen zur Auswahl des Anbieters und einen Vergleich verschiedener Modelle findest du in der ", guide("README"), "."],
  setupChatbot: "Kommst du nicht weiter, kannst du den folgenden Prompt kopieren und einem KI-Chatbot deines Vertrauens schicken.",
  setupPromptCopy: "Prompt für Chatbot kopieren",
  /* What the chatbot is told: only what holds for every reader of this
     system, never what is set — a reader asking may have clicked about. */
  setupPrompt: ({ app, system, computer, servers, url, n }) => `Ich richte ${app} unter ${system} ein und brauche Hilfe beim Verbinden eines KI-Modells. Frag mich bitte zuerst, wo ich gerade stehe und woran ich hänge oder was mir unklar ist. Hilf mir dann Schritt für Schritt und antworte auf Deutsch. Wenn du wissen musst, was ich auf dem Bildschirm sehe, schlag mir vor, es zu beschreiben oder dir einen Screenshot zu schicken.

Zur App: Triglosa ist eine kostenlose, quelloffene App für Sprachlernende. Sie zeigt einen Text neben seinen Übersetzungen und erklärt Wörter. Dafür nutzt sie ein KI-Modell über eine beliebige OpenAI-kompatible Schnittstelle (Chat Completions), in der Cloud oder lokal. Ein Modell bringt sie nicht mit.

${computer ? `Cloud oder lokal: Weiß ich noch nicht, welcher Weg zu mir passt, erkläre mir kurz den Unterschied. In der Cloud gehen meine Texte an den Anbieter; das ist genau und schnell und kostet meist ein paar Cent im Monat. Ein lokales Modell läuft auf dem eigenen Computer, kostet nichts, und kein Text verlässt ihn; dafür ist es ungenauer und oft langsamer. Der Computer braucht 16 GB Arbeitsspeicher oder mehr, besser 24 GB; unter Windows hilft eine Grafikkarte mit eigenem Speicher. Die Anleitung empfiehlt Gemma 4 E4B in LM Studio, das auf Macs mit Intel-Chip nicht läuft. Wenn du genug über meinen Computer weißt, sag mir, ob ein lokales Modell darauf gut laufen könnte; sonst frag mich, was du dafür wissen musst.

` : ""}Eingerichtet wird das Modell in den Einstellungen von Triglosa auf der Seite „${n.page}“. Es gibt zwei Wege:
- „${n.online}“: ein Konto auf openrouter.ai anlegen, Guthaben aufladen, unter openrouter.ai/settings/keys einen API-Schlüssel erstellen und ihn ins Feld „${n.apiKey}“ einfügen. Die Adresse steht fest, das empfohlene Modell ist schon eingetragen.
- „${n.own}“: jeder andere Anbieter${computer ? ", auch ein lokales Modell" : ""}. Ins Feld „${n.endpoint}“ kommt die Basisadresse, meist mit /v1 am Ende (ohne /chat/completions), ins Feld „${n.model}“ der Name des Modells genau so, wie der Anbieter ihn schreibt, ins Feld „${n.apiKey}“ der Schlüssel${computer ? "; ein lokales Modell braucht meist keinen" : ""}.${computer ? ` Zwei Knöpfe tragen die Adressen von ${servers.join(" und ")} ein. Unverschlüsseltes http geht nur auf diesem Computer oder im lokalen Netz.` : ""}
Der Knopf „${n.test}“ zeigt, ob das Modell antwortet.

Gut zu wissen: Triglosa braucht ein Modell, das ohne langes Nachdenken antwortet. Die App schaltet das Nachdenken ab, wo der Anbieter das erlaubt, und lehnt ein Modell ab, das nur mit Nachdenken antwortet. Die Anleitung der App (auf Englisch): ${url}

Frag mich nie nach meinem API-Schlüssel.`,
  setupGuide: "Anleitung",
  endpoint: "Adresse des KI-Modells",
  endpointHints: {
    own: "Jede Adresse mit OpenAI-kompatibler Schnittstelle — in der Cloud oder lokal.",
  },
  endpointPreset: (name) => `${name}-Adresse eintragen`,
  model: "Modell",
  modelHints: {
    online: "Jedes Modell von OpenRouter, mit dem Namen, der auf seiner Seite dort steht.",
    own: "Bleibt das Feld leer, nimmt die App das erste Modell, das unter der Adresse angeboten wird.",
  },
  apiKey: "API-Schlüssel",
  apiKeyEmpty: "keiner hinterlegt",
  apiKeyHints: {
    online: "Der Schlüssel von OpenRouter (Schritt 3). Landet im Schlüsselbund des Systems, nie in der Einstellungsdatei.",
    own: "Landet im Schlüsselbund des Systems, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
  },
  forgetKey: "Vergessen",
  keySaveFailed: (detail) =>
    `Der API-Schlüssel wurde nicht gespeichert${detail ? ` (${detail})` : ""}. Bitte versuche es noch einmal.`,
  testConnection: "Verbindung prüfen",
  testing: "Wird geprüft …",
  testOk: (name) => `Antwortet, mit „${name}“.`,

  translator: "Übersetzung durch",
  translatorModes: { model: "KI-Modell", device: "Apple (auf diesem Gerät)" },
  deviceIntro:
    "Apples Übersetzung ist Teil von macOS: sehr schnell und offline, aber oft ungenau. Ist das Sprachpaket geladen, springt sie automatisch ein, wenn das KI-Modell nicht antwortet.",
  translatorHint: "Kann eines von beiden nicht übersetzen, springt das andere automatisch ein.",
  translatorNoModel: "Noch ist kein KI-Modell eingerichtet. Bis dahin übersetzt Apple, soweit die Sprachpakete geladen sind.",
  /* Under the choice where Apple goes first and a model is set: a word
     looked up is still the model's (author 2026-11-05). */
  translatorShort: "Schlägst du ein bis drei Wörter nach, antwortet weiterhin das KI-Modell: Apple liegt bei seltenen Wörtern oft falsch.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "übersetzt", explained: "erklärt", assigned: "zugeordnet", detected: "Sprache erkannt", words: "Wörter zugeordnet", recognized: "Text erkannt" },
    and: "und",
    by: ({ kind, name }) => ({ device: ["von", "Apple (auf diesem Gerät)"], triglosa: ["von", "Triglosa"], triglosaDevice: ["von", "Triglosa (auf diesem Gerät)"] })[kind] || (name ? ["von", name] : ["vom", "KI-Modell"]),
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Sprache von dir gewählt",
  },
  foldPanel: "Einklappen",
  unfoldPanel: "Ausklappen",
  more: "Ausführlicher erklären",
  moreWorking: "Wird ausführlicher erklärt …",
  addExample: "Beispielsatz hinzufügen",
  exampleWorking: "Beispielsatz wird geschrieben …",
  devicePairs: "Apples Übersetzung auf diesem Gerät",
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
    "Der Download läuft im Hintergrund und kann einige Minuten dauern, du musst nichts weiter tun. Während er läuft, zeigt „Erneut anfordern“ nichts an. Wurde das Fenster von macOS geschlossen, fordere einfach erneut an.",
  pairsPrompt: "Sprachen für Apples Übersetzung laden",
  pairsFetched: "Angefordert",
  pairsBySettings:
    "Bitte in „Sprache & Region“ unter „Sprachen zum Übersetzen“ hinzufügen.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Fensterhöhe automatisch an den Inhalt anpassen",
  kept: "Vergangene Übersetzungen merken",
  keptHint: "Bleiben gespeichert, bis du Triglosa beendest.",
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
  forceClick: "Kräftiger Klick",
  forceClickHint:
    "Damit nicht zusätzlich Apples Nachschlagen aufgeht, deaktiviere in den Systemeinstellungen bei Trackpad die Option „Nachschlagen & Datenerkennung“.",
  pointerUnreliable: "Die folgenden Funktionen funktionieren nicht in jedem Programm zuverlässig.",
  withSentence: "Satz mitschicken",
  withSentenceLead:
    "Wenn du bis zu drei Wörter nachschlägst, geht ihr Satz mit an das KI-Modell (höchstens 30 Wörter). Das verbessert Spracherkennung und Übersetzungen.",
  nextSentence: "Nächsten Satz anbieten",
  nextSentenceLead:
    "Zeigt unter dem Original den Satz, der im Ursprungstext folgt. Ein Klick übersetzt ihn.",

  permission: "macOS-Berechtigung zum Lesen und Einfügen",
  directSelection: "Markierten Text direkt lesen und einfügen",
  directSelectionLead:
    "Die Tastenkürzel übernehmen markierten Text, ohne dass du ihn vorher kopierst, und Übersetzungen lassen sich direkt in andere Programme einfügen.",
  permissionHave: "Die Berechtigung ist in macOS erteilt.",
  permissionTrust:
    "Optional: Mit der macOS-Berechtigung „Gerätesteuerung und Datenzugriff“ (unter Datenschutz & Sicherheit, bis macOS 26 „Bedienungshilfen“) kann Triglosa markierten Text direkt lesen, das Wort oder den Satz unter dem Zeiger lesen und Übersetzungen direkt in andere Programme einfügen.",
  permissionTrustUse:
    "Triglosa nutzt die Berechtigung nur für diese Funktionen und nur, wenn du sie aktivierst. Triglosa ist Open Source, du kannst das also nachprüfen:",
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

  trayTranslating: "Übersetzen",

  trayCards: "Lernkarten",

  trayCapture: "Markierten Text übersetzen",
  trayCaptureCopied: "Kopierten Text übersetzen",
  trayCard: "Lernkarte aus markiertem Text erstellen",
  trayCardCopied: "Lernkarte aus kopiertem Text erstellen",
  trayCardBlank: "Neue Lernkarte",
  trayScreen: "Text aus Bildschirmfoto übersetzen",
  trayScreenCopy: "Text aus Bildschirmfoto kopieren",
  trayScreenCard: "Lernkarte aus Bildschirmfoto erstellen",
  screenHotkey: "Text aus Bildschirmfoto übersetzen",
  screenHotkeyLead: "Du ziehst einen Rahmen um Text auf dem Bildschirm, Triglosa erkennt und übersetzt ihn.",
  screenCopyHotkey: "Text aus Bildschirmfoto kopieren",
  screenCopyHotkeyLead: "Du ziehst einen Rahmen um Text auf dem Bildschirm, und der erkannte Text kommt in die Zwischenablage. Triglosa bleibt geschlossen.",
  screenCardHotkey: "Lernkarte aus Bildschirmfoto erstellen",
  screenCardHotkeyLead: "Du ziehst einen Rahmen um Text auf dem Bildschirm, und der erkannte Text kommt auf eine neue Lernkarte.",
  screenPrivacy: "Bildschirmfotos werden nur auf deinem Gerät verarbeitet. An das KI-Modell geht nur der erkannte Text.",
  screenPermissionTitle: "macOS-Berechtigung für Bildschirmfotos",
  screenPermissionLead:
    "Optional: Mit der macOS-Berechtigung „Bildschirm- & Systemaudioaufnahme“ (unter Datenschutz & Sicherheit) kann Triglosa Text überall auf dem Bildschirm per Bildschirmfoto übersetzen, kopieren und auf Lernkarten bringen und das Wort oder den Satz unter dem Zeiger auch dort lesen, wo ein Programm keinen Text hergibt.",
  screenPermissionUse:
    "Triglosa nimmt den Bildschirm nur auf, wenn du eine dieser Funktionen verwendest. Bildschirmfotos werden nur auf deinem Gerät verarbeitet. An das KI-Modell geht nur der erkannte Text.",
  screenPermissionPending:
    "macOS hat Triglosa dort in die Liste aufgenommen. Bitte schalte Triglosa in der Liste ein und öffne Triglosa danach neu.",
  screenHint: "Ziehe einen Rahmen um den Text · Esc bricht ab",
  screenReading: "Text wird erkannt …",
  screenNothing: "Kein Text erkannt. Bitte wähle einen anderen Ausschnitt.",
  imageUnreadable: "Das Bild ließ sich nicht öffnen. Bitte wähle ein anderes Bild.",
  imageNothing: "Kein Text im Bild erkannt. Bitte wähle ein anderes Bild.",
  dropImage: "Bild hier ablegen, um es zu übersetzen",
  /* Under a new translation's field on a computer, where a phone has its
     camera, photos and clipboard. */
  screenNoAnswer: "Die Texterkennung hat nicht geantwortet. Bitte versuche es noch einmal.",
  screenAbsent: "Die Texterkennung fehlt in dieser Installation. Bitte installiere Triglosa neu.",
  screenPermission: "Triglosa darf den Bildschirm nicht aufnehmen. Bitte erlaube es in den Systemeinstellungen unter „Bildschirm- & Systemaudioaufnahme“.",
  screenFailed: "Das Bildschirmfoto ist nicht gelungen. Bitte versuche es noch einmal.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Text wird per Bildschirmfoto erkannt …",
  pointerNothing: "Unter dem Zeiger wurde kein Text gefunden. Bitte zeige auf ein Wort und versuche es noch einmal.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Kamera",
  pictureLibrary: "Fotos",
  pictureFiles: "Bild aus Dateien",
  clipboard: "Zwischen\u00ADablage",
  pictureNothing: "Im Bild wurde kein Text erkannt. Bitte versuche es mit einem anderen Bild.",
  /* The frame a picture is cut with: the way out without reading it. */
  cancel: "Abbrechen",
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
  welcomeFind:
    "Triglosa läuft im Hintergrund. Das Buch-Symbol findest du oben rechts in der Menüleiste.",
  welcomeModel: "Ein KI-Modell übersetzt genauer und erklärt Begriffe, Verben und jedes Wort, das du anklickst, passend zu deinem Niveau. Verbinde eines in den Einstellungen unter „KI-Modell“.",
  statsSetting: "Anonyme Nutzungsstatistik",
  statsHint: "Meldet höchstens einmal am Tag, dass Triglosa benutzt wurde: Version, System, ob dein KI-Modell lokal oder online läuft oder keines eingerichtet ist und ob es eines der voreingestellten ist, aber nie welches. Geht etwas schief, nur die Art des Fehlers. Nie deine Texte oder etwas, das dich erkennbar macht.",
  statsThanks: "Vielen Dank.",
  statsPrivacy: (link) => ["Mehr dazu in der ", link("Datenschutzerklärung"), "."],
  welcome: {
    heading: "Willkommen bei Triglosa",
    steps: "Erste Schritte",
    exampleHint: "Ein Beispiel. Zeig mit der Maus auf ein Wort, um zu sehen, was in deiner Sprache daraus wurde. Klick ein spanisches Wort an, um es dir erklären zu lassen.",
    example: {
      source: "es",
      text: "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
      panels: [
        { code: "de", text: "Obwohl es in Strömen regnete, gingen wir in der Altstadt spazieren." },
        { code: "en", text: "Although it was raining cats and dogs, we went out for a walk in the old town." },
      ],
      terms: [
        { text: "llover a cántaros", spot: "llovía a cántaros", meaning: "in Strömen regnen", note: "Sehr stark regnen, umgangssprachlich.", in: ["in Strömen regnete", "raining cats and dogs"] },
        { text: "casco antiguo", spot: "casco antiguo", meaning: "Altstadt", note: "Der historische Kern einer Stadt.", in: ["Altstadt", "old town"] },
      ],
      verbs: [
        { form: "salimos", infinitive: "salir", tense: "Indefinido", meaning: "hinausgehen", person: "1. Person Plural", in: ["gingen", "went out"] },
      ],
      /* What a word of the original says when it is picked. */
      picks: [
        { text: "Aunque", meaning: "obwohl", note: "Leitet einen Gegensatz ein, der am Folgenden nichts ändert.", wordClass: { kind: "conjunction" }, synonyms: ["si bien", "aun cuando"], in: ["Obwohl", "Although"] },
        { text: "llovía a cántaros", infinitive: "llover a cántaros", meaning: "in Strömen regnen", note: "Sehr stark regnen, umgangssprachlich.", person: "3. Person Singular", tense: "Imperfecto", synonyms: ["diluviar", "llover a mares"], in: ["in Strömen regnete", "raining cats and dogs"] },
        { text: "salimos", infinitive: "salir", meaning: "hinausgehen", note: "Einen Ort verlassen, hier, um spazieren zu gehen.", person: "1. Person Plural", tense: "Indefinido", synonyms: ["irse", "marcharse"], in: ["gingen", "went out"] },
        { text: "a", meaning: "zu", note: "Zeigt nach einem Verb der Bewegung an, was man vorhat.", wordClass: { kind: "preposition" }, in: ["", "for"] },
        { text: "pasear", infinitive: "pasear", meaning: "spazieren gehen", note: "Zu Fuß unterwegs sein, ohne Eile und zum Vergnügen.", synonyms: ["caminar", "andar"], in: ["spazieren", "walk"] },
        { text: "por", meaning: "durch", note: "Nennt den Raum, in dem man sich bewegt.", wordClass: { kind: "preposition" }, synonyms: ["a través de"], in: ["in", "in"] },
        { text: "el", meaning: "der", note: "Bestimmter Artikel vor einem männlichen Substantiv.", wordClass: { kind: "article", number: "singular", gender: "masculine" }, in: ["der", "the"] },
        { text: "casco antiguo", meaning: "Altstadt", note: "Der historische Kern einer Stadt.", wordClass: { kind: "noun", number: "singular", gender: "masculine" }, synonyms: ["centro histórico", "ciudad vieja"], in: ["Altstadt", "old town"] },
      ],
    },
    languages: "Wähle in den Einstellungen unter „Sprachen“ deine eigene Sprache und die Sprachen, die du lernst.",
    start: {
      title: "Loslegen.",
      select: (key) => ["Markiere Text in einem beliebigen Programm und drücke ", key, "."],
      copy: (key) => ["Kopiere Text in einem beliebigen Programm (⌘C) und drücke ", key, "."],
      change: "Das Tastenkürzel kannst du in den Einstellungen unter „Tastenkürzel“ ändern.",
      noKey: "dein Tastenkürzel",
      set: "Du legst es in den Einstellungen unter „Tastenkürzel“ fest.",
    },
    permission: {
      title: "Optional: Text direkt lesen.",
      body: "Mit der macOS-Berechtigung „Gerätesteuerung und Datenzugriff“ (bis macOS 26 „Bedienungshilfen“) liest Triglosa markierten Text ohne Kopieren und fügt Übersetzungen in andere Programme ein. Du erteilst sie in den Einstellungen unter „Andere Programme“.",
    },
    stats: {
      question: "Darf Triglosa anonym zählen?",
      yes: "Ja",
      no: "Nein",
      change: "Du kannst das jederzeit in den Einstellungen unter „Über Triglosa“ ändern.",
      yesDone: "Danke! Du kannst das in den Einstellungen unter „Über Triglosa“ ändern.",
      noDone: "Es wird nichts gezählt. Du kannst das in den Einstellungen unter „Über Triglosa“ ändern.",
    },
    more: (link) => ["Alle Informationen zu Triglosa findest du in der ", link("Readme"), " auf GitHub."],
    hide: "Nicht mehr anzeigen",
    settings: "Einstellungen öffnen",
    close: "Hinweis schließen",
    open: "Erste Schritte anzeigen",
  },
};

export const windows = {
  pointerUnreliable: "Die folgenden Funktionen lesen Text aus anderen Programmen aus. Das funktioniert nicht mit jedem Programm zuverlässig.",
  readingPrivacy: "Triglosa liest Text aus einem anderen Programm nur, wenn du ein Tastenkürzel drückst, und schickt ihn nirgendwohin außer an das KI-Modell. Gibt ein Programm keinen Text heraus, werden Wort und Satz unter dem Zeiger von einem Bildschirmfoto rund um den Zeiger gelesen. Bildschirmfotos werden nur auf deinem Gerät verarbeitet. An das KI-Modell geht nur der erkannte Text.",
  noDevice: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  onlyKnownLanguages: "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  pairMissing: () => "Kein KI-Modell eingerichtet. Bitte richte in den Einstellungen ein KI-Modell ein.",
  modelIntro:
    "Triglosa übersetzt und erklärt mit einem KI-Modell: Übersetzungen, Begriffe, Verben, Erklärungen und weitere Funktionen. Selbst bringt es keins mit.",
  lockedHow:
    "Verbinde in den Einstellungen ein KI-Modell für Übersetzungen, Begriffe, Verben und Erklärungen zu jedem Wort.",
  lockedHowShort:
    "Verbinde in den Einstellungen ein KI-Modell für Übersetzungen, Bedeutungen und Erklärungen.",
  apiKeyHints: {
    online: "Der Schlüssel von OpenRouter (Schritt 3). Landet in der Windows-Anmeldeinformationsverwaltung, nie in der Einstellungsdatei.",
    own: "Landet in der Windows-Anmeldeinformationsverwaltung, nie in der Einstellungsdatei. Ein lokales Modell braucht meist keinen.",
  },
  endpointHints: {
    own: "Jede Adresse mit OpenAI-kompatibler Schnittstelle — in der Cloud oder lokal.",
  },
  hotkeyLead:
    "Übersetzt den markierten Text in jedem Programm. Öffnet die letzte Übersetzung, wenn kein Text markiert ist.",
  cardHotkeyLead:
    "Erstellt eine Lernkarte basierend auf dem markierten Text. Öffnet ein leeres Fenster zur Lernkartenerstellung, wenn kein Text markiert ist.",
  hotkeyTakenSystem: "Dieses Tastenkürzel ist von Windows belegt. Bitte wähle ein anderes.",
  appIcons: { menubar: "nur im Infobereich", both: "auch in der Taskleiste" },
  copyFirst: (key) => `Tipp: Text in einem Programm markieren, dann ${key} drücken.`,
  enterKey: "Strg+Enter",
  welcomeFind:
    "Triglosa läuft im Hintergrund. Das Buch-Symbol findest du unten rechts neben der Uhr, wenn du dort auf den kleinen Pfeil (^) klickst. Damit es immer zu sehen ist, halte es mit der Maus gedrückt und schiebe es nach unten, rechts neben den Pfeil. Ein Klick auf das Symbol öffnet das Fenster, ein Rechtsklick das Menü.",
  welcomeModel: "Triglosa übersetzt mit einem KI-Modell, das auch Begriffe, Verben und jedes Wort, das du anklickst, passend zu deinem Niveau erklärt. Verbinde eines in den Einstellungen unter „KI-Modell“.",
};

export const phone = {
  groupReadingEntry: "Text aus anderen Apps",
  groupReading: "Text aus anderen Apps",
  translateClipboard: "Zwischenablage übersetzen",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
  pasteSetting: "Einfügen ohne Nachfrage",
  pasteHint: "Fragt iOS bei jedem Einfügen nach, stelle in den iPhone-Einstellungen bei Triglosa „Aus anderen Apps einfügen“ auf „Erlauben“.",
  pasteLater: "Später",
  cardSheetClose: "Schließen",
  pasteOpen: "iPhone-Einstellungen öffnen",
  modelConsentSetting: "Texte an das KI-Modell senden",
  modelConsentHint: (host) => `Deine Texte gehen an ${host}. Ohne das übersetzt Apple auf diesem iPhone, und kein Text verlässt es.`,
  modelConsent: {
    title: "Texte an das KI-Modell senden?",
    body: (host) => `Zum Übersetzen und Erklären schickt Triglosa deine Texte an das KI-Modell, das du eingerichtet hast, unter ${host}. Es gelten die Bedingungen und die Datenschutzerklärung des Anbieters. Ohne deine Erlaubnis übersetzt Apple auf diesem iPhone, und kein Text verlässt es.`,
    allow: "Erlauben",
    deny: "Nicht erlauben",
  },
  /* The first steps, as a sheet over the reading at the first start. */
  welcomePhone: {
    setup: "Einrichtung",
    start: "Eine Übersetzung starten",
    done: "Los geht’s",
    exampleHint: "Ein Beispiel: ein Satz, seine zwei Übersetzungen und die Wörter, die sich zu lernen lohnen, markiert. Tippe ein spanisches Wort an, um es dir erklären zu lassen.",
    paste: (button) => ["Kopiere einen Text in einer beliebigen App und tippe dann unten in der Leiste auf ", button, ": Triglosa übersetzt, was du kopiert hast."],
    share: "Markiere Text in einer beliebigen App, tippe auf „Teilen“ und wähle Triglosa.",
    plus: (button) => ["Tippe auf ", button, ", um einen neuen Text einzugeben, einzufügen oder zu fotografieren."],
    /* The Control Center's controls, in iOS's own word, which the reader adds there. */
    control: "Füge die Steuerelemente von Triglosa zum Kontrollzentrum hinzu, um es von überall aus zu starten.",
    languages: "Wähle in den Einstellungen unter „Sprachen“ deine eigene Sprache und die, die du lernst.",
    model: "Ein KI-Modell übersetzt genauer und erklärt Begriffe, Verben und jedes Wort, das du antippst, passend zu deinem Niveau. Verbinde eines in den Einstellungen unter „KI-Modell“. Ohne KI-Modell übersetzt Apple auf diesem iPhone.",
  },
  /* The phone runs no model of its own: one way is prepared there. */
  ankiEnabledHint: (_code) => "Braucht die App AnkiMobile.",
  ankiMissing: "Triglosa fragt Anki nach deinen Stapeln und Notiztypen. Anki öffnet sich dafür kurz.",
  ankiLaunch: "Aus Anki laden",
  ankiStarting: "Anki öffnet sich …",
  ankiSending: "Anki öffnet sich …",
  ankiRecheck: "Stapel aktualisieren",
  ankiRecheckHint: "Holt Stapel und Notiztypen neu aus Anki.",
  ankiAbsent: "AnkiMobile ist nicht installiert. Bitte installiere es aus dem App Store.",
  ankiLeft: "Anki hat keine Liste geschickt. Bitte versuche es noch einmal und erlaube das Einfügen, wenn iOS fragt.",
  ankiDeckHint: "Jeder Stapel, den Anki gemeldet hat.",
  ankiNoteTypeLook: "Welchen Notiztyp ein Stapel verwendet, siehst du in Anki: Wenn du dort eine Karte zu diesem Stapel hinzufügst, steht der Notiztyp oben.",
  cardClosing: "",
};

/* What the interface itself says, in the language explanations are written in.

   Only German and English, for the same reason as in strings.js: the first
   language is one of the two. A foreign language someone is learning never
   appears here — they would be reading their own interface as an exercise.

   Kept apart from strings.js on purpose. Those strings are read by parsers as
   well; these are only ever shown. */

const TABLE = {
  de: {
    placeholder: "Text einfügen oder eintippen",
    /* Der Knopf am Original-Feld heißt nach dem, was er auslöst. Er steht
       dort, wo im Lesemodus „Editieren“ steht — dasselbe Feld, zwei Zustände,
       an derselben Stelle ein Knopf. */
    translate: "Übersetzen",
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
    /* Beide sagen dazu, dass sie aus dem Fenster hinausführen: was sie
       öffnen, ist eine Seite im Browser und nichts, was hier steht. */
    search: "Suchen (extern)",
    opened: "Geöffnet",
    conjugation: "Konjugation (extern)",
    /* Der Knopf an einer Zeile heißt nach dem, was er zeigt, und nicht nach
       einem Programm: was er öffnet, ist eine Karte, die man lesen, ändern
       und herauskopieren kann — mit oder ohne Anki auf dem Rechner. */
    card: "Lernkarte",
    /* Was in der Titelleiste des eigenen Fensters steht. */
    cardCreate: "Lernkarte erstellen",
    added: "Angelegt",
    synonymBack: "Voriges Wort",
    synonymForward: "Nächstes Wort",
    /* Die Überschriften der drei Felder. Die ersten beiden stehen nur da, wo
       die Sprache unbekannt ist — sonst steht der Name der Sprache selbst,
       aus dem Pack. */
    cardTerm: "Fremdsprache",
    cardMeaning: "Muttersprache",
    cardNote: "Erklärung",
    /* Die beiden Zeilen unter einer Erklärung. Ohne Beschriftung standen dort
       zwei Absätze Lauftext, und nichts sagte, dass der eine ein Beispiel ist
       und der andere seine Übersetzung. */
    cardCopyAll: "Alle drei kopieren",
    cardCopyField: "Feld kopieren",
    cardToAnki: "Direkt nach Anki",
    cardAnkiStart: "Anki starten",
    cardAnkiStarting: "Anki wird gestartet …",
    cardAnkiSetup: "Stapel wählen",
    /* Ohne zugeordnetes Feld ginge die Erklärung stillschweigend verloren. */
    cardNoteUnmapped: "Kein Feld zugeordnet — diese Zeilen gehen nicht nach Anki.",
    /* Was aus dem Versuch geworden ist, in einem Satz, der sagt was passiert
       ist und was dagegen zu tun ist — und der stehen bleibt. „Nicht
       angelegt“ am Knopf, das nach anderthalb Sekunden wieder verschwand,
       hat einen Nachmittag gekostet: die eigentliche Ursache stand in Ankis
       Antwort und wurde weggeworfen.

       Ankis eigene Worte kommen in Klammern dahinter, wo sie die Erklärung
       sind — und nur da. Ein Satz in der Sprache des Lesers zuerst, weil
       „cannot create note because it is empty“ allein niemandem sagt, was zu
       tun ist. */
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
    /* Ein gesperrter Bereich sagt, was in ihm stünde — dreimal derselbe
       Hinweis liest sich als Rauschen. Wie man ihn aufmacht, steht einmal
       darunter. */
    lockedEntry: "Für einen Wörterbuch-Eintrag braucht es ein KI-Modell.",
    lockedHow:
      "Verbinde in den Einstellungen ein KI-Modell für genauere Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    /* Beide Wege haben es versucht und keiner hat geantwortet. Was hier nicht
       stehen darf, ist der Hinweis auf fehlende Sprachpakete: der ist nur
       richtig, wenn das Gerät der einzige Weg war. */
    /* Nur die Tatsache. Der Grund steht einmal unter dem Blatt, und ein
       Ratschlag, der in vier Flächen gleichzeitig steht, ist derselbe Lärm
       wie die Meldung, die er ersetzt hat. */
    noAnswer: "Keine Antwort erhalten.",
    /* Was schiefgegangen ist, in einem Satz, der ohne Fehlercode-Wissen
       auskommt: was passiert ist und was man dagegen tun kann. Die Nummer
       steht mit dabei, weil sie in einer Support-Antwort weiterhilft — aber
       nie als einziges. Welche Art es ist, entscheidet faults.js.
       Jede Meldung hat dieselbe Form: kurz, was passiert ist, dann ein Satz mit „Bitte“, der sagt, was zu tun ist. */
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
    /* Nicht dasselbe wie ein fehlendes Sprachpaket: hier ist der Dienst
       überhaupt nicht da, und nachladen lässt sich dagegen nichts. */
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
    groupControl: "Bedienung",
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

    /* Zwei Schalter, nicht einer: die Karte selbst verlässt den Rechner
       nicht und ist deshalb an, der Export in ein anderes Programm ist eine
       eigene Entscheidung. */
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
    /* Der Notiztyp ist die Frage, auf die niemand von sich aus eine Antwort
       hat. Anki weiß sie: welcher in diesem Stapel tatsächlich benutzt wird.
       Der Satz daneben sagt, wo man sie in Anki selbst findet. */
    ankiNoteTypeUsed: (count) => `in diesem Stapel (${count})`,
    ankiNoteTypeFound: (name) =>
      `Die Karten in diesem Stapel benutzen „${name}“ — das ist hier eingetragen.`,
    ankiNoteTypeLook:
      "Der Stapel ist leer, also kann Anki nicht sagen, welcher gemeint ist. In Anki steht er beim Bearbeiten einer Karte oben links; „Basic“ ist der eingebaute mit Vorder- und Rückseite.",
    ankiFields: "Felder",
    ankiFieldsHint: "Welches Feld des Notiztyps welche der drei Zeilen bekommt.",
    ankiNoField: "— nicht schreiben",
    /* Kein Zauber: Anki entscheidet an genau diesem Feld, ob eine Notiz leer
       ist, und lehnt sie sonst ab. Auf dem Notiztyp des Autors heißt es „ID“
       und sagt einem Leser nichts, also hätte es niemand zugeordnet — und
       jede Karte wurde abgelehnt. */
    ankiFirstField: (name) =>
      `Das erste Feld des Notiztyps („${name}“) bekommt zusätzlich das Wort in der Fremdsprache. Anki nimmt Notizen mit leerem erstem Feld nicht an.`,

    firstLanguage: "Muttersprache",
    secondLanguage: "Zweite Sprache",
    thirdLanguage: "Dritte Sprache (optional)",
    noThird: "keine",
    /* Ein Wort pro Stufe, für alle, denen die Skala nichts sagt. */
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
    /* Begriffe gibt es auch in Sprachen, die die App nicht unterstützt. */
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
    /* Was die drei Zeilen zusammen entscheiden, steht über ihnen und nicht
       im Hinweis einer von ihnen: ohne KI-Modell fällt die halbe App weg,
       und das gehört an den Anfang der Gruppe. */
    modelIntro:
      "Ohne KI-Modell gibt es nur Apples Übersetzung auf dem Gerät, sofern unten eingerichtet. Verbinde ein KI-Modell für genauere Übersetzungen, Verben, Begriffe, Erklärungen und weitere Funktionen.",
    /* Für alle, die noch nie einen Modell-Zugang eingerichtet haben. Die
       Antwort darauf sind drei Absätze — wofür das Modell hier gebraucht
       wird, worin sich Cloud und lokal unterscheiden, was in welches Feld
       gehört — und die stehen in der README und nicht in diesem Fenster: sie
       gehören zum Einrichten und nicht zum Bedienen, und im Fenster hätten
       sie die drei Felder vom Bildschirm geschoben. */
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
    testConnection: "Verbindung prüfen",
    testing: "Wird geprüft …",
    testOk: (name) => `Antwortet, mit „${name}“.`,

    translator: "Übersetzung durch",
    translatorModes: { model: "KI-Modell", device: "Apple (auf dem Gerät)" },
    /* Apples Übersetzung ist ein Zusatz: gemessen liegt sie bei etwa jeder
       vierten Übersetzung im Sinn daneben, ein Cloud-Modell bei einer von
       dreihundert. Was für sie spricht, ist Tempo und dass sie offline geht. */
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
    devicePairs: "Apples Übersetzung auf dem Gerät nutzen (optional)",
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
    appIcon: "Symbol, während Triglosa läuft",
    appIcons: { menubar: "in der Menüleiste", dock: "im Dock", both: "in Menüleiste und Dock" },
    hotkey: "Tastenkürzel zum Starten der Übersetzung",
    hotkeyEmpty: "keines gesetzt",
    hotkeyRecording: "Kombination drücken …",
    hotkeyClear: "Löschen",
    hotkeyLead: "Übersetzt Text aus jedem Programm: Text kopieren (⌘C), dann das Kürzel drücken.",
    hotkeyLeadSelected: "Übersetzt den markierten Text in jedem Programm.",
    hotkeyHint: "Passiert beim Drücken des Kürzels nichts, ist die Kombination schon vergeben. Wähle dann eine andere.",
    /* Was die Shell dazu sagt, steht auf Englisch und hilft selten weiter —
       deshalb erst der Satz, der weiterhilft, und die Worte der Shell danach
       in Klammern. */
    hotkeyFailed: (reason) =>
      "Das Tastenkürzel ist vermutlich schon vergeben"
      + (reason ? ` (${reason})` : "") + ". Bitte wähle eine andere Kombination.",
    hotkeyTakenSystem:
      "Diese Kombination ist von macOS belegt. Bitte wähle eine andere.",
    hotkeyTakenEverywhere:
      "Diese Kombination nutzt jedes Programm selbst. Bitte wähle eine andere.",

    /* Die Berechtigung ist ein Zusatz, keine Voraussetzung. Erklärt wird
       sie, bevor der Systemdialog kommt: was sie bringt, wofür Triglosa sie
       nutzt und wofür nicht, und wo sich das nachprüfen lässt. macOS
       beschreibt sie so allgemein, dass sie ohne diesen Satz nach viel mehr
       klingt, als sie hier tut. */
    permission: "Markierten Text direkt übernehmen (optional)",
    permissionWhy:
      "Markierten Text übersetzen, ohne ihn vorher zu kopieren, und Übersetzungen direkt in andere Programme einfügen.",
    permissionHave: "Eingeschaltet.",
    permissionTrust:
      "Dafür braucht Triglosa die macOS-Berechtigung „Bedienungshilfen“. Triglosa nutzt sie nur für diese zwei Dinge und nur, wenn du das Kürzel drückst oder auf „Einfügen“ klickst. Triglosa ist Open Source, du kannst das also nachprüfen:",
    permissionCode: "zum Code",
    permissionAsk: "Erlauben …",
    permissionOpen: "Systemeinstellungen öffnen",
    permissionOff: "Ausschalten lässt sie sich jederzeit in den Systemeinstellungen unter Datenschutz & Sicherheit → Bedienungshilfen.",
    permissionPending:
      "macOS hat Triglosa dort in die Liste aufgenommen. Bitte schalte Triglosa in der Liste ein — dieses Fenster merkt es von selbst.",
    copyFirst: (key) => `Tipp: Text in einem Programm kopieren (⌘C), dann ${key} drücken.`,
    captureFailed: "Die Auswahl ließ sich nicht lesen. Bitte kopiere den Text und füge ihn hier ein.",

    inserted: "Eingefügt",
    insertNoWay: (reason) =>
      reason === "focus" ? "Kein Programm zum Einfügen"
      : reason === "accessibility" ? "Bedienungshilfen fehlen"
      : "Nicht eingefügt",

    trayCapture: "Markierten Text übersetzen",
    trayCaptureCopied: "Kopierten Text übersetzen",
    trayShow: "Fenster zeigen",
    trayUpdates: "Nach Updates suchen",
    trayHelp: "Hilfe",
    trayProblem: "Problem melden",
    trayRestart: "Triglosa neu starten",
    trayQuit: "Triglosa beenden",
    /* Der Text, der nirgends steht: ein Knopf ohne Aufschrift braucht einen
       Namen für alle, die das Fenster nicht sehen. */
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
    lockedEntry: "A dictionary entry needs an AI model.",
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
    groupControl: "Controls",
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
       use. The sentence beside it says where to find it in Anki itself. */
    ankiNoteTypeUsed: (count) => `in this deck (${count})`,
    ankiNoteTypeFound: (name) =>
      `The cards in this deck use "${name}", so that is what is set here.`,
    ankiNoteTypeLook:
      "The deck is empty, so Anki cannot say which one is meant. In Anki it stands at the top left while you edit a card; \"Basic\" is the built-in one with a front and a back.",
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
    devicePairs: "Use Apple's on-device translation (optional)",
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
    appIcon: "Icon while Triglosa is running",
    appIcons: { menubar: "in the menu bar", dock: "in the Dock", both: "in the menu bar and the Dock" },
    hotkey: "Shortcut to start a translation",
    hotkeyEmpty: "none set",
    hotkeyRecording: "Press a combination…",
    hotkeyClear: "Clear",
    hotkeyLead: "Translates text from any program: copy it (⌘C), then press the shortcut.",
    hotkeyLeadSelected: "Translates the selected text in any program.",
    hotkeyHint: "If nothing happens when you press the shortcut, the combination is already taken. Pick another one.",
    /* What the shell says about it helps rarely, so the sentence that helps
       comes first and the shell's own words follow it in brackets. */
    hotkeyFailed: (reason) =>
      "The shortcut is probably taken already"
      + (reason ? ` (${reason})` : "") + ". Please choose another combination.",
    hotkeyTakenSystem:
      "This combination is taken by macOS. Please choose another one.",
    hotkeyTakenEverywhere:
      "Every program uses this combination itself. Please choose another one.",

    permission: "Use selected text directly (optional)",
    permissionWhy:
      "Translate selected text without copying it first, and insert translations straight into other programs.",
    permissionHave: "Switched on.",
    permissionTrust:
      "For this, Triglosa needs the macOS permission “Accessibility”. Triglosa uses it only for these two things, and only when you press the shortcut or click “Insert”. Triglosa is open source, so you can verify this:",
    permissionCode: "see the code",
    permissionAsk: "Allow…",
    permissionOpen: "Open System Settings",
    permissionOff: "You can switch it off at any time in System Settings under Privacy & Security → Accessibility.",
    permissionPending:
      "macOS has added Triglosa to the list there. Please switch Triglosa on in the list — this window notices by itself.",
    copyFirst: (key) => `Tip: copy some text in any program (⌘C), then press ${key}.`,
    captureFailed: "The selection could not be read. Please copy the text and paste it here.",

    inserted: "Inserted",
    insertNoWay: (reason) =>
      reason === "focus" ? "No program to insert into"
      : reason === "accessibility" ? "Accessibility is missing"
      : "Not inserted",

    trayCapture: "Translate selected text",
    trayCaptureCopied: "Translate copied text",
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

export function labels(code) {
  return TABLE[String(code || "").toLowerCase()] || TABLE.en;
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

import { why } from "./detail.js";

/* The Italian interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   Italian. */
export default {
  placeholder: "Incolla o scrivi un testo",
  translate: "Traduci",
  translateKeys: "Traduci (⌘↩)",
  edit: "Modifica",
  settings: "Impostazioni",
  original: "Originale",
  terms: "Termini",
  verbs: "Verbi",
  marked: "Selezione",
  synonyms: "affini",
  wordClasses: {
    noun: "sostantivo",
    "proper noun": "nome proprio",
    adjective: "aggettivo",
    adverb: "avverbio",
    pronoun: "pronome",
    preposition: "preposizione",
    conjunction: "congiunzione",
    article: "articolo",
    numeral: "numerale",
    interjection: "interiezione",
    singular: "singolare",
    plural: "plurale",
    masculine: "maschile",
    feminine: "femminile",
    neuter: "neutro",
  },
  copy: "Copia",
  insert: "Inserisci",
  copied: "Copiato",
  search: "Cerca (esterno)",
  opened: "Aperto",
  conjugation: "Coniugazione (esterno)",
  card: "Flashcard",
  cardCreate: "Crea flashcard",
  cardLanguage: "Lingua della flashcard",
  sourceLanguage: "Cambia la lingua",
  otherLanguage: "Altra lingua…",
  findLanguage: "Scrivi una lingua",
  unknownLanguage: "Lingua sconosciuta",
  added: "Aggiunta",
  synonymBack: "Parola precedente",
  synonymForward: "Parola successiva",
  cardTerm: "Lingua straniera",
  cardMeaning: "Lingua madre",
  cardNote: "Spiegazione",
  cardCopyAll: "Copia tutti e tre",
  cardCopyField: "Copia campo",
  cardToAnki: "Direttamente in Anki",
  cardAnkiStart: "Avvia Anki",
  cardAnkiStarting: "Avvio di Anki…",
  cardAnkiSetup: "Scegli un mazzo",
  cardNoteUnmapped: "Nessun campo assegnato — queste righe non andranno in Anki.",
  ankiSaved: "La flashcard è nel mazzo.",
  ankiDuplicate: "Questa flashcard è già nel mazzo — Anki confronta il primo campo del tipo di nota.",
  ankiSending: "Aggiunta in corso…",
  ankiFailed: ({ kind, detail } = {}) => {
    const said = detail ? ` (${detail})` : "";
    if (kind === "unreachable") {
      return "Anki non risponde. Avvia Anki e controlla che AnkiConnect sia installato.";
    }
    if (kind === "unconfigured") {
      return "Nessun mazzo scelto. Scegline uno nelle impostazioni, sotto «Flashcard».";
    }
    if (kind === "empty") {
      return "Il primo campo della nota sarebbe vuoto" + said
        + ". Assegnalo nelle impostazioni a una delle tre righe.";
    }
    if (kind === "no-deck") {
      return "Anki non conosce questo mazzo" + said + ". Sceglilo di nuovo nelle impostazioni.";
    }
    if (kind === "no-note-type") {
      return "Anki non conosce questo tipo di nota" + said + ". Sceglilo di nuovo nelle impostazioni.";
    }
    return "Anki non ha aggiunto la flashcard" + said + ". Riprova.";
  },
  detecting: "Riconoscimento della lingua…",
  nothingOn: (word) => `Nessuna spiegazione ricevuta per «${word}».`,
  searching: "ricerca…",
  cardImprove: "Migliora con l’IA",
  cardImproving: "Miglioramento della flashcard…",
  cardUndo: "Annulla il miglioramento con l’IA",
  cardImproveNothing: "Nessun miglioramento utilizzabile ricevuto. La flashcard resta com’era.",
  linking: "collegamento…",
  noTerms: "nessun termine difficile trovato",
  noVerbs: "nessun verbo difficile trovato",
  lockedHow:
    "Collega un modello di IA nelle impostazioni per traduzioni più precise, verbi, termini, spiegazioni e altre funzioni.",
  noAnswer: "Nessuna risposta ricevuta.",
  faults: {
    unreachable:
      "Nessuna connessione al modello di IA. Controlla la connessione a internet e le impostazioni.",
    timeout: "Il modello di IA ci ha messo troppo. Riprova.",
    key: (f) =>
      `La chiave API è stata rifiutata${why(f)}. Controllala nelle impostazioni.`,
    notFound: (f) =>
      `Indirizzo o modello non trovato${why(f)}. Controlla entrambi nelle impostazioni `
      + "– spesso manca «/v1» alla fine dell’indirizzo.",
    refused: (f) =>
      `Il modello di IA ha rifiutato la richiesta${why(f)}. Controlla il nome del modello nelle impostazioni.`,
    busy: (f) =>
      `Il modello di IA è sovraccarico in questo momento${why(f)}. Riprova più tardi.`,
    server: (f) =>
      `Guasto presso il fornitore del modello di IA${why(f)}. Riprova tra poco.`,
    status: (f) =>
      `Risposta inattesa dal modello di IA${why(f)}. Controlla le impostazioni.`,
    empty: "Il modello di IA ha inviato una risposta vuota. Riprova.",
    thinking: (f) =>
      `${f.model || "Questo modello di IA"} ragiona prima di ogni risposta e per questo è troppo lento. `
      + "Scegli un altro modello nelle impostazioni.",
    noModel:
      "Nel server locale non è caricato nessun modello. Caricane uno o inserisci il nome di un modello nelle impostazioni.",
    unknown: (f) => f.detail || "Qualcosa è andato storto. Riprova.",
  },
  noDevice:
    "La traduzione di Apple non risponde. Configura un modello di IA nelle impostazioni.",
  onlyKnownLanguages:
    "La traduzione di Apple non conosce questa lingua. Configura un modello di IA nelle impostazioni.",
  pairMissing: (from, to) =>
    `Manca il pacchetto lingua ${from} → ${to}. Configura un modello di IA nelle impostazioni oppure scarica lì il pacchetto lingua, sotto «Traduzioni».`,

  groupLanguages: "Lingue",
  groupSections: "Verbi e termini",
  groupModel: "Modello di IA",
  groupTranslation: "Traduzioni",
  groupWindow: "Finestra",
  groupShortcuts: "Scorciatoie da tastiera",
  groupCards: "Flashcard",
  groupAbout: "Informazioni su Triglosa",
  aboutVersion: (version) => `Versione ${version}`,
  aboutProject: "Triglosa su GitHub",
  updatesCheck: "Cerca aggiornamenti",
  updatesChecking: "Ricerca…",
  updatesHint: "Chiede a GitHub la versione più recente. Triglosa chiede solo quando fai clic qui e non scarica nulla.",
  updatesNone: "Hai la versione più recente.",
  updatesFound: (version) => `La versione ${version} è disponibile.`,
  updatesDownload: "Vai al download",
  updatesFailed: (status) => `Nessuna risposta da GitHub${status ? ` (${status})` : ""}. Riprova più tardi.`,

  optionOn: "sì",
  optionOff: "no",
  cardsEnabled: "Possibilità di creare flashcard",
  cardModes: {
    never: "mai",
    second: "solo per la seconda lingua",
    third: "solo per la terza lingua",
    foreign: "per tutte le lingue straniere supportate",
  },
  ankiEnabled: "Esporta direttamente in Anki",
  ankiEnabledHint: (code) => `Richiede Anki con il componente aggiuntivo AnkiConnect (codice ${code}).`,
  ankiSearching: "Ricerca…",
  ankiMissing:
    "Anki non risponde. Avvia Anki e controlla che AnkiConnect sia installato.",
  ankiRecheck: "Cerca di nuovo",
  ankiLaunch: "Avvia Anki",
  ankiStarting: "Avvio di Anki…",
  ankiDeck: "Mazzo",
  ankiDeckHint:
    "Qualsiasi mazzo che Anki segnala. Un nome che non esiste ancora viene creato al primo salvataggio.",
  ankiNewDeck: "Nuovo mazzo…",
  ankiDeckList: "Dall’elenco",
  ankiNoteType: "Tipo di nota",
  ankiNoteTypeHint: "Il tipo di nota decide quali campi ha una flashcard.",
  ankiNoteTypeUsed: (count) => `in questo mazzo (${count})`,
  ankiNoteTypeFound: (name) =>
    `Le flashcard del mazzo scelto usano il tipo di nota «${name}».`,
  ankiNoteTypeLook:
    "Il mazzo scelto non ha ancora flashcard da cui leggere il tipo di nota. Sceglilo tu.",
  ankiFields: "Campi",
  ankiFieldsHint: "Quale campo del tipo di nota riceve quale delle tre righe.",
  ankiNoField: "— non scrivere",
  ankiFirstField: (name) =>
    `Il primo campo del tipo di nota («${name}») riceve anche la parola straniera. Anki non accetta note con il primo campo vuoto.`,

  firstLanguage: "Lingua madre",
  secondLanguage: "Seconda lingua",
  thirdLanguage: "Terza lingua (facoltativa)",
  noThird: "nessuna",
  levelNames: {
    A1: "Principiante",
    A2: "Elementare",
    B1: "Intermedio",
    B2: "Intermedio superiore",
    C1: "Avanzato",
    C2: "Quasi madrelingua",
  },
  showModes: {
    never: "mai",
    second: "solo per la seconda lingua",
    third: "solo per la terza lingua",
    foreign: "per tutte le lingue straniere supportate",
    all: "per tutte le lingue supportate",
  },
  termModes: {
    never: "mai",
    second: "solo per la seconda lingua",
    third: "solo per la terza lingua",
    foreign: "per tutte le lingue straniere",
    all: "per tutte le lingue",
  },
  showVerbsHint: "Forma base, persona e tempo delle tre forme verbali più difficili del testo.",
  showTermsHint: "Spiegazioni di al massimo tre parole o espressioni avanzate del testo.",
  underline: "Sottolineatura colorata nel testo",
  underlineHint: "Sottolinea i verbi e i termini nell’originale e nelle traduzioni.",
  searchEngine: "Motore di ricerca",
  searchHint: "Per «Cerca (esterno)» su verbi, termini e parole selezionate. Si apre nel browser predefinito.",
  searchSystem: "quello impostato in Safari",
  glance: "Traduzione al passaggio del puntatore",
  glanceHint: "Mostra sopra una parola dell’originale a cosa corrisponde nella tua lingua.",
  modelIntro:
    "Senza un modello di IA è disponibile solo la traduzione di Apple sul dispositivo, se configurata qui sotto. Collega un modello di IA per traduzioni più precise, verbi, termini, spiegazioni e altre funzioni.",
  modelHelpAsk: "Non hai mai configurato un modello di IA?",
  modelHelpLink: "Leggi la guida",
  endpoint: "Indirizzo del modello",
  endpointHint:
    "Qualsiasi indirizzo con un’interfaccia compatibile con OpenAI — nel cloud o in locale.",
  model: "Modello",
  modelHint: "Se il campo resta vuoto, l’app usa il primo modello offerto dall’indirizzo.",
  apiKey: "Chiave",
  apiKeyEmpty: "nessuna salvata",
  apiKeyHint:
    "Finisce nel portachiavi del sistema, mai nel file delle impostazioni. Un modello locale di solito non ne ha bisogno.",
  forgetKey: "Dimentica",
  keySaveFailed: (detail) =>
    `La chiave non è stata salvata${detail ? ` (${detail})` : ""}. Riprova.`,
  testConnection: "Verifica connessione",
  testing: "Verifica in corso…",
  testOk: (name) => `Risponde, con «${name}».`,

  translator: "Traduzione con",
  translatorModes: { model: "Modello di IA", device: "Apple (sul dispositivo)" },
  deviceIntro:
    "Se vuoi, puoi configurare la traduzione di Apple sul dispositivo per le traduzioni vere e proprie. È molto veloce e funziona offline, ma spesso è imprecisa.",
  translatorHint: "Se uno dei due non può tradurre, subentra l’altro, se è configurato.",
  translatorNoModel: "Non è ancora configurato nessun modello di IA. Fino ad allora traduce Apple, dove i suoi pacchetti lingua sono installati.",
  translatedBy: { device: "tradotto da Apple", model: "tradotto dal modello di IA" },
  foldPanel: "Comprimi",
  unfoldPanel: "Espandi",
  more: "Spiega più nel dettaglio",
  moreWorking: "Spiegazione più dettagliata…",
  addExample: "Aggiungi una frase d’esempio",
  exampleWorking: "Scrittura di una frase d’esempio…",
  devicePairs: "Usa la traduzione di Apple sul dispositivo",
  pairsChecking: "Verifica…",
  pairsAllInstalled: "Tutti i pacchetti lingua per le tue lingue sono installati.",
  pairsNoDevice:
    "La traduzione di Apple al momento non risponde.",
  pairsDownloadable: (pairs) => `Non ancora scaricati: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Non possibile con la traduzione di Apple: ${pairs}. Non si può scaricare.`,
  pairsFetch: "Scarica le lingue…",
  pairsFetchAgain: "Richiedi di nuovo…",
  pairsOnTheirWay:
    "Il download avviene in background e può richiedere qualche minuto. Se la finestra di macOS è stata chiusa, richiedi di nuovo.",
  pairsPrompt: "Scarica lingue per la traduzione di Apple",
  pairsFetched: "Richiesto",
  pairsBySettings:
    "Aggiungile in «Lingua e zona», sotto «Lingue per la traduzione».",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Adatta l’altezza della finestra al contenuto",
  appIcon: "Icona mentre Triglosa è aperto",
  appIcons: { menubar: "nella barra dei menu", dock: "nel Dock", both: "nella barra dei menu e nel Dock" },
  shortcutsLead:
    "Se premendo una combinazione qui nella finestra non succede nulla, è già occupata. Scegline un’altra.",
  hotkey: "Avvia traduzione",
  hotkeyEmpty: "nessuna",
  hotkeyRecording: "Premi una combinazione…",
  hotkeyClear: "Cancella",
  hotkeyLead:
    "Traduce testo da qualsiasi programma: copialo (⌘C), poi premi la scorciatoia. Apre l’ultima traduzione se non è stato copiato nulla di nuovo.",
  hotkeyLeadSelected:
    "Traduce il testo selezionato in qualsiasi programma. Apre l’ultima traduzione se non c’è testo selezionato.",
  freshHotkey: "Nuova traduzione",
  cardHotkey: "Crea flashcard",
  cardHotkeyLead:
    "Crea una flashcard dal testo copiato (⌘C). Apre una finestra di flashcard vuota se non è stato copiato nulla di nuovo.",
  cardHotkeyLeadSelected:
    "Crea una flashcard dal testo selezionato. Apre una finestra di flashcard vuota se non c’è testo selezionato.",
  hotkeyTakenHere: (name) => `Questa combinazione è già assegnata a «${name}». Scegline un’altra.`,
  hotkeyFailed: (reason) =>
    "Probabilmente la scorciatoia è già occupata"
    + (reason ? ` (${reason})` : "") + ". Scegli un’altra combinazione.",
  hotkeyTakenSystem:
    "Questa combinazione è occupata da macOS. Scegline un’altra.",
  hotkeyTakenEverywhere:
    "Ogni programma usa questa combinazione per sé. Scegline un’altra.",

  permission: "Usa direttamente il testo selezionato",
  permissionWhy:
    "Se vuoi, puoi tradurre il testo selezionato o farne una flashcard senza copiarlo prima, e inserire le traduzioni direttamente in altri programmi.",
  permissionHave: "Attivato.",
  permissionTrust:
    "Per questo Triglosa ha bisogno dell’autorizzazione di macOS «Controllo del dispositivo e accesso ai dati» in Privacy e sicurezza («Accessibilità» fino a macOS 26). Triglosa la usa solo per leggere il testo selezionato e per inserire, e solo quando glielo chiedi. Triglosa è open source, quindi puoi verificarlo:",
  permissionCode: "vedi il codice",
  permissionAsk: "Consenti…",
  permissionOpen: "Apri Impostazioni di Sistema",
  permissionPending:
    "macOS ha aggiunto Triglosa all’elenco. Attiva Triglosa nell’elenco — questa finestra se ne accorge da sola.",
  copyFirst: (key) => `Suggerimento: copia un testo in qualsiasi programma (⌘C), poi premi ${key}.`,
  captureFailed: "Non è stato possibile leggere la selezione. Copia il testo e incollalo qui.",

  inserted: "Inserito",
  insertNoWay: (reason) =>
    reason === "focus" ? "Nessun programma in cui inserire"
    : reason === "accessibility" ? "Manca l’autorizzazione"
    : "Non inserito",

  trayCapture: "Traduci il testo selezionato",
  trayCaptureCopied: "Traduci il testo copiato",
  trayCard: "Crea flashcard dal testo selezionato",
  trayCardCopied: "Crea flashcard dal testo copiato",
  trayCardBlank: "Nuova flashcard",
  trayShow: "Mostra finestra",
  trayUpdates: "Cerca aggiornamenti",
  trayHelp: "Aiuto",
  trayProblem: "Segnala un problema",
  trayRestart: "Riavvia Triglosa",
  trayQuit: "Esci da Triglosa",
  settingsOpen: "Apri impostazioni",
  historyBack: "Traduzione precedente",
  historyForward: "Traduzione successiva",
  newReading: "Nuova traduzione",
  closeWindow: "Chiudi finestra",
  pinWindow: "Tieni in primo piano",
  unpinWindow: "Non tenere più in primo piano",
};

export const windows = {
  noDevice: "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  onlyKnownLanguages: "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  pairMissing: () => "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  modelIntro:
    "Triglosa traduce e spiega con un modello di IA. Collegane uno per traduzioni, verbi, termini, spiegazioni e altre funzioni.",
  lockedHow:
    "Collega un modello di IA nelle impostazioni per traduzioni, verbi, termini, spiegazioni e altre funzioni.",
  apiKeyHint:
    "Finisce in Gestione credenziali di Windows, mai nel file delle impostazioni. Un modello locale di solito non ne ha bisogno.",
  hotkeyLead:
    "Traduce il testo selezionato in qualsiasi programma. Apre l’ultima traduzione se non c’è testo selezionato.",
  cardHotkeyLead:
    "Crea una flashcard dal testo selezionato. Apre una finestra di flashcard vuota se non c’è testo selezionato.",
  hotkeyTakenSystem: "Questa combinazione è occupata da Windows. Scegline un’altra.",
  appIcons: { menubar: "solo nell’area di notifica", both: "anche nella barra delle applicazioni" },
  copyFirst: (key) => `Suggerimento: seleziona un testo in qualsiasi programma, poi premi ${key}.`,
  translateKeys: "Traduci (Ctrl+Invio)",
};

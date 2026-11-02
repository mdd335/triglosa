import { why } from "./detail.js";

/* The Italian interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   Italian. */
export default {
  placeholder: "Incolla o scrivi un testo",
  translate: "Traduci",
  enterKey: "⌘↩",
  edit: "Modifica",
  settings: "Impostazioni",
  original: "Originale",
  terms: "Termini",
  term: "Termine",
  verbs: "Verbi",
  marked: "Selezione",
  inSentence: "qui",
  previousSentence: "Frase precedente",
  nextSentenceLine: "Frase successiva",
  /* A looked-up word found misspelled: the line under it, the typed word
     in it a link that looks it up as typed. */
  correctedFrom: (typed) => `Corretto da ${typed}`,
  didYouMean: (word) => `Intendevi ${word}?`,
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
  paste: "Incolla",
  settingsDone: "Fine",
  search: "Cerca (esterno)",
  speak: "Pronuncia",
  opened: "Aperto",
  conjugation: "Coniugazione (esterno)",
  card: "Crea flashcard",
  cardCreate: "Crea flashcard",
  cardLanguage: "Lingua della flashcard",
  sourceLanguage: "Cambia la lingua",
  addLanguage: "Aggiungi una lingua",
  removeLanguage: "Togli la lingua",
  unknownLanguage: "Lingua sconosciuta",
  added: "Aggiunta",
  synonymBack: "Parola precedente",
  synonymForward: "Parola successiva",
  cardTerm: "Lingua straniera",
  cardMeaning: "Lingua madre",
  cardNote: "Note",
  cardCopyAll: "Copia tutti e tre",
  cardCopyField: "Copia campo",
  cardToAnki: "Salva in Anki",
  cardAnkiStart: "Avvia Anki",
  cardAnkiStarting: "Avvio di Anki…",
  cardAnkiSetup: "Scegli un mazzo Anki",
  cardNoteUnmapped: "Nessun campo assegnato — queste righe non andranno in Anki.",
  ankiSaved: (deck) => (deck ? `La flashcard è nel mazzo «${deck}».` : "La flashcard è nel mazzo."),
  cardClosing: "La finestra si chiude.",
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
  cardDetecting: "Riconoscimento della lingua…",
  cardImproving: "Miglioramento della flashcard…",
  cardUndo: "Annulla il miglioramento con l’IA",
  cardImproveNothing: "Nessun miglioramento utilizzabile ricevuto. La flashcard resta com’era.",
  linking: "collegamento…",
  noTerms: "nessun termine difficile trovato",
  noTerm: "nessun termine difficile trovato",
  noVerbs: "nessun verbo difficile trovato",
  lockedHow:
    "Collega un modello di IA nelle impostazioni per traduzioni più precise, termini, verbi, spiegazioni e altre funzioni.",
  noAnswer: "Nessuna risposta ricevuta.",
  faults: {
    unreachable:
      "Nessuna connessione al modello di IA. Controlla la connessione a internet e le impostazioni.",
    insecure:
      "L’indirizzo del modello di IA non è cifrato (http). Usa https o un indirizzo della tua rete nelle impostazioni.",
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
  groupSections: "Termini e verbi",
  groupModel: "Modello di IA",
  groupTranslation: "Traduzioni",
  groupWindow: "Finestra",
  groupShortcuts: "Scorciatoie da tastiera",
  groupReading: "Altri programmi",
  groupCards: "Flashcard",
  groupAbout: "Informazioni su Triglosa",
  aboutVersion: (version) => `Versione ${version}`,
  aboutNotes: "Mostra le note di rilascio",
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa si trova su ", link("project", "GitHub"), ", l’aiuto nel suo ", link("help", "README"), ". Se trovi un problema o desideri una funzione, apri pure una ", link("issues", "issue"), "."],
  updatesCheck: "Cerca aggiornamenti",
  updatesChecking: "Ricerca…",
  updatesHint: "Chiede a GitHub la versione più recente. L’aggiornamento viene scaricato solo quando fai clic su «Installa ora».",
  updatesNone: "Hai la versione più recente.",
  updatesFound: (version) => `La versione ${version} è disponibile.`,
  updatesDownload: "Mostra il download e le note di rilascio",
  updatesInstall: "Installa ora",
  updatesLoading: (percent) => `Download… ${percent} %`,
  updatesInstalling: "Installazione… Triglosa si riavvierà.",
  updatesInstallNone: "Questa versione non si può installare da qui. Scaricala manualmente.",
  updatesInstallUnreachable: "Non è stato possibile scaricare l’aggiornamento. Riprova più tardi.",
  updatesInstallFailed: (detail) => `L’aggiornamento non è stato installato${detail ? ` (${detail})` : ""}. Scaricalo manualmente.`,
  diagnosticsCopy: "Copia diagnostica",
  diagnosticsHint: "Per segnalare un problema: versione, sistema, lingue, modello di IA e ultimi errori. Mai i tuoi testi né la tua chiave API. Non viene inviato nulla; lo incolli tu.",
  updatesFailed: (status) => `Nessuna risposta da GitHub${status ? ` (${status})` : ""}. Riprova più tardi.`,

  optionOff: "no",
  cardsEnabled: "Mostrare il pulsante delle flashcard",
  cardModes: {
    never: "mai",
    second: "solo per la seconda lingua",
    third: "solo per la terza lingua",
    learned: "per la seconda e la terza lingua",
    foreign: "per tutte le lingue straniere",
  },
  cardsImprove: "Migliorare automaticamente le flashcard con l’IA",
  cardsImproveHint: "Le flashcard si possono sempre migliorare con l’IA premendo un pulsante.",
  ankiEnabled: "Esporta direttamente in Anki",
  ankiEnabledHint: (code) => `Richiede Anki con il componente aggiuntivo AnkiConnect (codice ${code}).`,
  ankiSync: "Sincronizza Anki dopo ogni carta",
  ankiSyncHint:
    "Funziona solo se AnkiWeb è configurato.",
  ankiSearching: "Ricerca…",
  ankiMissing:
    "Anki non risponde. Avvia Anki e controlla che AnkiConnect sia installato.",
  ankiRecheck: "Cerca di nuovo",
  ankiLaunch: "Avvia Anki",
  ankiStarting: "Avvio di Anki…",
  ankiDeck: "Mazzo Anki",
  ankiAddLanguage: "Aggiungi una lingua",
  ankiRemoveLanguage: "Rimuovi la lingua",
  ankiTargetChoice: "Lingua",
  ankiPerLanguage: "Impostazioni di Anki per lingua",
  ankiDeckHint:
    "Qualsiasi mazzo che Anki segnala. Un nome che non esiste ancora viene creato al primo salvataggio.",
  ankiNewDeck: "Nuovo mazzo…",
  ankiDeckList: "Dall’elenco",
  ankiNoteType: "Tipo di nota Anki",
  ankiNoteTypeHint: "Il tipo di nota decide quali campi ha una flashcard.",
  ankiNoteTypeUsed: (count) => `in questo mazzo (${count})`,
  ankiNoteTypeFound: (name) =>
    `Le flashcard del mazzo scelto usano il tipo di nota «${name}».`,
  ankiNoteTypeLook:
    "Il mazzo scelto non ha ancora flashcard da cui leggere il tipo di nota. Sceglilo tu.",
  ankiFields: "Campi Anki",
  ankiFieldsHint: "Quale campo del tipo di nota riceve quale delle tre righe.",
  ankiNoField: "— non scrivere",
  ankiFirstField: (name) =>
    `Il primo campo del tipo di nota («${name}») riceve anche la parola straniera. Anki non accetta note con il primo campo vuoto.`,

  languagesIntro: ["Triglosa mostra ogni testo accanto alle sue traduzioni in queste lingue (al massimo due traduzioni).", "Il livello che imposti decide quali termini e verbi vengono spiegati in ciascuna lingua.", "Nella finestra di traduzione puoi cambiare per un po’ la lingua di una traduzione o aggiungerne una terza. Vale finché non chiudi Triglosa."],
  firstLanguage: "Lingua madre",
  firstLanguageHint: "Anche la lingua dell’app.",
  secondLanguage: "Seconda lingua",
  thirdLanguage: "Terza lingua (facoltativa)",
  noThird: "nessuna",
  languagesTuned: "Ottimizzate",
  languagesOther: "Non ottimizzate",
  otherLanguageHint:
    "Triglosa non è ottimizzato per questa lingua: gli errori sono più frequenti e la sezione «Verbi» non c’è. Più il modello di IA è capace, migliore è il risultato.",
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
    foreign: "per tutte le lingue straniere ottimizzate",
    all: "per tutte le lingue ottimizzate",
  },
  termModes: {
    never: "mai",
    second: "solo per la seconda lingua",
    third: "solo per la terza lingua",
    foreign: "per tutte le lingue straniere",
    all: "per tutte le lingue",
  },
  showVerbsHint: "Forma base, persona e tempo di al massimo tre forme verbali avanzate del testo.",
  showTermsHint: "Spiegazioni di al massimo tre parole o espressioni avanzate del testo.",
  showTerms: "Mostra i termini",
  showVerbs: "Mostra i verbi",
  underline: "Sottolineatura colorata nel testo",
  searchEngine: "Motore di ricerca",
  searchHint: "Per «Cerca (esterno)» su termini, verbi e parole selezionate. Si apre nel browser predefinito.",
  searchSystem: "quello impostato in Safari",
  glance: "Traduzione al passaggio del puntatore",
  glanceHint: "Mostra sopra le parole in lingua straniera a cosa corrispondono nella tua lingua.",
  modelIntro:
    "Senza un modello di IA è disponibile solo la traduzione di Apple sul dispositivo, se il pacchetto lingua è scaricato. Un modello di IA porta traduzioni più precise, termini, verbi, spiegazioni e altre funzioni. Triglosa non ne include uno proprio.",
  modelQuestion: "Che tipo di connessione vuoi usare?",
  modelWays: "È pronta una strada che funziona bene. In alternativa puoi inserire un fornitore qualsiasi.",
  setupOnline: "Online",
  setupOnlineVia: "tramite OpenRouter",
  setupOnlineLine: "Preciso e veloce. OpenRouter è un fornitore indipendente su cui devi ricaricare del credito.",
  setupOwn: "Inseriscilo tu",
  setupOwnVia: "fornitore qualsiasi",
  setupRecommended: (name, filled) => `Modello consigliato: ${name}${filled ? ", già inserito" : ""}`,
  setupOnlineSteps: (site, key, privacy) => [
    ["Crea un account su ", site("openrouter.ai"), "."],
    ["Aggiungi credito: 5 € bastano per molte migliaia di traduzioni."],
    ["Crea una ", key("chiave API"), " e incollala qui sotto."],
    ["Facoltativo: attiva «Zero Data Retention» nelle ", privacy("impostazioni sulla privacy"), " per più privacy."],
  ],
  setupOnlineFree: (name) => `Senza credito funziona anche una versione gratuita di ${name} offerta da Google. Basta però solo per poche traduzioni al giorno, e Google può conservare i tuoi testi e usarli per l’addestramento. Serve quindi solo per provare e non funziona con Zero Data Retention attivato.`,
  setupOnlineFreeTake: "Inserisci il modello gratuito",
  setupOnlinePaidTake: "Inserisci il modello consigliato",
  setupMore: (guide) => ["Altre informazioni sulla scelta del fornitore e un confronto tra modelli nel ", guide("README"), "."],
  setupChatbot: "Se ti blocchi, può aiutarti anche un chatbot di IA di tua fiducia.",
  setupGuide: "Istruzioni",
  endpoint: "Indirizzo del modello di IA",
  endpointHints: {
    online: "L’indirizzo di OpenRouter. Per un altro fornitore, scegli «Inseriscilo tu» qui sopra.",
    own: "Qualsiasi indirizzo con un’interfaccia compatibile con OpenAI — nel cloud o in locale.",
  },
  endpointPreset: (name) => `Inserisci l’indirizzo di ${name}`,
  model: "Modello",
  modelHints: {
    online: "Qualsiasi modello offerto da OpenRouter, con il nome indicato sulla sua pagina.",
    own: "Se il campo resta vuoto, l’app usa il primo modello offerto dall’indirizzo.",
  },
  apiKey: "Chiave API",
  apiKeyEmpty: "nessuna salvata",
  apiKeyHints: {
    online: "La chiave di OpenRouter (passo 3). Finisce nel portachiavi del sistema, mai nel file delle impostazioni.",
    own: "Finisce nel portachiavi del sistema, mai nel file delle impostazioni. Un modello locale di solito non ne ha bisogno.",
  },
  forgetKey: "Dimentica",
  keySaveFailed: (detail) =>
    `La chiave API non è stata salvata${detail ? ` (${detail})` : ""}. Riprova.`,
  testConnection: "Verifica connessione",
  testing: "Verifica in corso…",
  testOk: (name) => `Risponde, con «${name}».`,

  translator: "Traduzione con",
  translatorModes: { model: "Modello di IA", device: "Apple (sul dispositivo)" },
  deviceIntro:
    "La traduzione di Apple fa parte di macOS: molto veloce e offline, ma spesso imprecisa. Con il pacchetto lingua scaricato, subentra automaticamente quando il modello di IA non risponde.",
  translatorHint: "Se uno dei due non può tradurre, subentra automaticamente l’altro.",
  translatorNoModel: "Non è ancora configurato nessun modello di IA. Fino ad allora traduce Apple, dove i suoi pacchetti lingua sono scaricati.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "tradotto", explained: "spiegato", assigned: "abbinato", detected: "lingua rilevata", words: "parole abbinate", recognized: "testo riconosciuto" },
    and: "e",
    by: ({ kind, name }) => ({ device: ["da", "Apple (sul dispositivo)"], triglosa: ["da", "Triglosa"], triglosaDevice: ["da", "Triglosa (sul dispositivo)"] })[kind] || (name ? ["da", name] : ["dal", "modello di IA"]),
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Lingua scelta da te",
  },
  foldPanel: "Comprimi",
  unfoldPanel: "Espandi",
  more: "Spiega più nel dettaglio",
  moreWorking: "Spiegazione più dettagliata…",
  addExample: "Aggiungi una frase d’esempio",
  exampleWorking: "Scrittura di una frase d’esempio…",
  devicePairs: "La traduzione di Apple sul dispositivo",
  pairsChecking: "Verifica…",
  pairsAllInstalled: "Tutti i pacchetti lingua per le tue lingue sono scaricati.",
  pairsNoDevice:
    "La traduzione di Apple al momento non risponde.",
  pairsRecheck: "Verifica di nuovo",
  pairsDownloadable: (pairs) => `Non ancora scaricati: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Non possibile con la traduzione di Apple: ${pairs}. Non si può scaricare.`,
  pairsFetch: "Scarica le lingue…",
  pairsFetchAgain: "Richiedi di nuovo…",
  pairsOnTheirWay:
    "Il download avviene in background e può richiedere qualche minuto; non devi fare altro. Nel frattempo «Richiedi di nuovo» non mostra nulla. Se la finestra di macOS è stata chiusa, richiedi di nuovo.",
  pairsPrompt: "Scarica lingue per la traduzione di Apple",
  pairsFetched: "Richiesto",
  pairsBySettings:
    "Aggiungile in «Lingua e zona», sotto «Lingue per la traduzione».",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Adatta l’altezza della finestra al contenuto",
  kept: "Ricordare le traduzioni precedenti",
  keptHint: "Restano salvate finché non chiudi Triglosa.",
  keptLast: (n) => `le ultime ${n}`,
  appIcon: "Icona mentre Triglosa è aperto",
  appIcons: { menubar: "nella barra dei menu", dock: "nel Dock", both: "nella barra dei menu e nel Dock" },
  shortcutsLead:
    "Se premendo una scorciatoia qui nella finestra non succede nulla, è già occupata. Scegline un’altra.",
  hotkey: "Avvia traduzione",
  hotkeyEmpty: "nessuna scorciatoia",
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
  hotkeyTakenHere: (name) => `Questa scorciatoia è già assegnata a «${name}». Scegline un’altra.`,
  hotkeyFailed: (reason) =>
    "Probabilmente la scorciatoia è già occupata"
    + (reason ? ` (${reason})` : "") + ". Scegline un’altra.",
  hotkeyTakenSystem:
    "Questa scorciatoia è occupata da macOS. Scegline un’altra.",
  hotkeyTakenEverywhere:
    "Ogni programma usa questa scorciatoia per sé. Scegline un’altra.",

  wordHotkey: "Parola sotto il puntatore",
  wordHotkeyLead: "Cerca la parola su cui si trova il puntatore.",
  sentenceHotkey: "Frase sotto il puntatore",
  sentenceHotkeyLead: "Traduce l’intera frase su cui si trova il puntatore.",
  forceClick: "Clic deciso",
  forceClickHint:
    "Perché non si apra anche la ricerca di Apple, disattiva «Cerca info e rilevatori dati» in Impostazioni di Sistema, Trackpad.",
  pointerUnreliable: "Le funzioni qui sotto non vanno in modo affidabile in tutti i programmi.",
  withSentence: "Inviare la frase",
  withSentenceLead:
    "Quando cerchi fino a tre parole, la loro frase va con loro al modello di IA (al massimo 30 parole). Migliora il riconoscimento della lingua e le traduzioni.",
  nextSentence: "Proporre la frase successiva",
  nextSentenceLead:
    "Mostra sotto l’originale la frase che segue nel testo di partenza. Un clic la traduce.",

  permission: "Autorizzazione di macOS per leggere e inserire",
  directSelection: "Leggi il testo selezionato e inserisci le traduzioni direttamente",
  directSelectionLead:
    "Le scorciatoie prendono il testo selezionato senza che tu lo copi prima, e le traduzioni si possono inserire direttamente in altri programmi.",
  permissionHave: "L’autorizzazione è concessa in macOS.",
  permissionTrust:
    "Facoltativo: con l’autorizzazione di macOS «Controllo del dispositivo e accesso ai dati» (in Privacy e sicurezza, «Accessibilità» fino a macOS 26), Triglosa può leggere direttamente il testo selezionato, leggere la parola o la frase sotto il puntatore e inserire le traduzioni direttamente in altri programmi.",
  permissionTrustUse:
    "Triglosa usa l’autorizzazione solo per queste funzioni e solo se le attivi. Triglosa è open source, quindi puoi verificarlo:",
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

  trayTranslating: "Tradurre",

  trayCards: "Flashcard",

  trayCapture: "Traduci il testo selezionato",
  trayCaptureCopied: "Traduci il testo copiato",
  trayCard: "Crea flashcard dal testo selezionato",
  trayCardCopied: "Crea flashcard dal testo copiato",
  trayCardBlank: "Nuova flashcard",
  trayScreen: "Traduci il testo da uno screenshot",
  trayScreenCopy: "Copia il testo da uno screenshot",
  trayScreenCard: "Crea flashcard da uno screenshot",
  screenHotkey: "Traduci il testo da uno screenshot",
  screenHotkeyLead: "Disegni una cornice attorno a un testo sullo schermo e Triglosa lo riconosce e lo traduce.",
  screenCopyHotkey: "Copia il testo da uno screenshot",
  screenCopyHotkeyLead: "Disegni una cornice attorno a un testo sullo schermo e il testo riconosciuto va negli appunti. Triglosa resta chiuso.",
  screenCardHotkey: "Crea flashcard da uno screenshot",
  screenCardHotkeyLead: "Disegni una cornice attorno a un testo sullo schermo e il testo riconosciuto va su una nuova flashcard.",
  screenPrivacy: "Gli screenshot vengono elaborati solo sul tuo dispositivo. Al modello di IA arriva solo il testo riconosciuto.",
  screenPermissionTitle: "Autorizzazione di macOS per gli screenshot",
  screenPermissionLead:
    "Facoltativo: con l’autorizzazione di macOS «Registrazione schermo e audio di sistema» (in Privacy e sicurezza), Triglosa può fare uno screenshot di qualsiasi testo sullo schermo per tradurlo, copiarlo o metterlo su una flashcard, e leggere la parola o la frase sotto il puntatore anche dove un programma non fornisce testo.",
  screenPermissionUse:
    "Triglosa registra lo schermo solo quando usi una di queste funzioni. Gli screenshot vengono elaborati solo sul tuo dispositivo. Al modello di IA arriva solo il testo riconosciuto.",
  screenPermissionPending:
    "macOS ha aggiunto Triglosa all’elenco. Attiva Triglosa nell’elenco, poi riapri Triglosa.",
  screenHint: "Disegna una cornice attorno al testo · Esc annulla",
  screenReading: "Riconoscimento del testo…",
  screenNothing: "Nessun testo riconosciuto. Scegli un’altra parte dello schermo.",
  imageUnreadable: "Non è stato possibile aprire l’immagine. Scegline un’altra.",
  imageNothing: "Nessun testo riconosciuto nell’immagine. Scegline un’altra.",
  dropImage: "Rilascia l’immagine qui per tradurla",
  /* Under a new translation's field on a computer, where a phone has its
     camera, photos and clipboard. */
  dropHint: "Trascina un’immagine nella finestra per tradurla.",
  dropNeedsPin: (name, pin) => ["Per farlo, «", name, "» ", pin, " deve essere attivo."],
  screenNoAnswer: "Il riconoscimento del testo non ha risposto. Riprova.",
  screenAbsent: "Il riconoscimento del testo manca in questa installazione. Reinstalla Triglosa.",
  screenPermission: "Triglosa non può registrare lo schermo. Consentilo in Impostazioni di Sistema, sotto «Registrazione schermo e audio di sistema».",
  screenFailed: "Lo screenshot non è riuscito. Riprova.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Riconoscimento del testo da uno screenshot…",
  pointerNothing: "Nessun testo trovato sotto il puntatore. Punta una parola e riprova.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Fotocamera",
  pictureLibrary: "Foto",
  clipboard: "Appunti",
  pictureNothing: "Nessun testo riconosciuto nell’immagine. Prova un’altra immagine.",
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
  welcomeFind:
    "Triglosa funziona in background. Trovi il suo simbolo, un libro, in alto a destra nella barra dei menu.",
  welcomeModel: "Un modello di IA traduce in modo più preciso e spiega termini, verbi e ogni parola su cui fai clic, in base al tuo livello. Collegane uno nelle impostazioni, in «Modello di IA».",
  statsSetting: "Statistiche d’uso anonime",
  statsHint: "Invia al massimo una volta al giorno che Triglosa è stato usato: la versione, il sistema e il tipo di modello di IA (OpenRouter, LM Studio o altro). Se qualcosa va storto, solo il tipo di errore. Mai i tuoi testi né nulla che ti identifichi.",
  statsThanks: "Grazie.",
  welcome: {
    heading: "Ti diamo il benvenuto in Triglosa",
    steps: "Primi passi",
    exampleHint: "Un esempio. Punta una parola con il mouse per vedere che cosa è diventata nella tua lingua.",
    example: {
      source: "es",
      text: "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
      panels: [
        { code: "it", text: "Anche se pioveva a dirotto, siamo usciti a passeggiare per il centro storico." },
        { code: "en", text: "Although it was raining cats and dogs, we went out for a walk in the old town." },
      ],
      terms: [
        { text: "llover a cántaros", spot: "llovía a cántaros", meaning: "piovere a dirotto", note: "Piovere moltissimo, nel linguaggio familiare.", in: ["pioveva a dirotto", "raining cats and dogs"] },
        { text: "casco antiguo", spot: "casco antiguo", meaning: "centro storico", note: "La parte storica di una città.", in: ["centro storico", "old town"] },
      ],
      verbs: [
        { form: "salimos", infinitive: "salir", tense: "Indefinido", meaning: "uscire", person: "1ª persona plurale", in: ["siamo usciti", "went out"] },
      ],
      glance: "Aunque | Anche se | Although\nllovía | pioveva | it was raining\na cántaros | a dirotto | cats and dogs\nsalimos | siamo usciti | we went out\na pasear | a passeggiare | for a walk\npor | per | in\nel | il | the\ncasco antiguo | centro storico | old town",
    },
    languages: "Scegli nelle impostazioni, in «Lingue», la tua lingua e le lingue che stai imparando.",
    start: {
      title: "Iniziare.",
      select: (key) => ["Seleziona un testo in qualsiasi programma e premi ", key, "."],
      copy: (key) => ["Copia un testo in qualsiasi programma (⌘C) e premi ", key, "."],
      change: "Puoi cambiare la scorciatoia nelle impostazioni, in «Scorciatoie da tastiera».",
      noKey: "la tua scorciatoia",
      set: "La scegli nelle impostazioni, in «Scorciatoie da tastiera».",
    },
    permission: {
      title: "Facoltativo: leggere il testo direttamente.",
      body: "Con l’autorizzazione di macOS «Controllo del dispositivo e accesso ai dati» («Accessibilità» fino a macOS 26), Triglosa legge il testo selezionato senza copiarlo e inserisce le traduzioni in altri programmi. La concedi nelle impostazioni, in «Altri programmi».",
    },
    stats: {
      off: "Puoi disattivarlo in qualsiasi momento nelle impostazioni.",
    },
    more: (link) => ["Tutte le informazioni su Triglosa sono nel ", link("README"), " su GitHub."],
    hide: "Non mostrare più",
    settings: "Apri le impostazioni",
    close: "Chiudi questo avviso",
    open: "Mostra i primi passi",
  },
};

export const windows = {
  pointerUnreliable: "Le funzioni qui sotto leggono il testo da altri programmi. Non funziona in modo affidabile con tutti i programmi.",
  readingPrivacy: "Triglosa legge il testo di un altro programma solo quando premi una scorciatoia, e non lo invia da nessuna parte se non al modello di IA. Se un programma non fornisce testo, la parola e la frase sotto il puntatore vengono lette da uno screenshot dell’area intorno al puntatore. Gli screenshot vengono elaborati solo sul tuo dispositivo. Al modello di IA arriva solo il testo riconosciuto.",
  noDevice: "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  onlyKnownLanguages: "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  pairMissing: () => "Nessun modello di IA configurato. Configurane uno nelle impostazioni.",
  modelIntro:
    "Triglosa traduce e spiega con un modello di IA: traduzioni, termini, verbi, spiegazioni e altre funzioni. Non ne include uno proprio.",
  lockedHow:
    "Collega un modello di IA nelle impostazioni per traduzioni, termini, verbi, spiegazioni e altre funzioni.",
  apiKeyHints: {
    online: "La chiave di OpenRouter (passo 3). Finisce in Gestione credenziali di Windows, mai nel file delle impostazioni.",
    own: "Finisce in Gestione credenziali di Windows, mai nel file delle impostazioni. Un modello locale di solito non ne ha bisogno.",
  },
  endpointHints: {
    online: "L’indirizzo di OpenRouter. Per un altro fornitore, scegli «Inseriscilo tu» qui sopra.",
    own: "Qualsiasi indirizzo con un’interfaccia compatibile con OpenAI — nel cloud o in locale.",
  },
  hotkeyLead:
    "Traduce il testo selezionato in qualsiasi programma. Apre l’ultima traduzione se non c’è testo selezionato.",
  cardHotkeyLead:
    "Crea una flashcard dal testo selezionato. Apre una finestra di flashcard vuota se non c’è testo selezionato.",
  hotkeyTakenSystem: "Questa scorciatoia è occupata da Windows. Scegline un’altra.",
  appIcons: { menubar: "solo nell’area di notifica", both: "anche nella barra delle applicazioni" },
  copyFirst: (key) => `Suggerimento: seleziona un testo in qualsiasi programma, poi premi ${key}.`,
  enterKey: "Ctrl+Invio",
  welcomeFind:
    "Triglosa funziona in background. Trovi il suo simbolo, un libro, in basso a destra accanto all’orologio, facendo clic sulla piccola freccia (^). Per averlo sempre in vista, tienilo premuto con il mouse e trascinalo in basso, a destra della freccia. Un clic sul simbolo apre la finestra, un clic destro apre il menu.",
  welcomeModel: "Triglosa traduce con un modello di IA, che spiega anche termini, verbi e ogni parola su cui fai clic, in base al tuo livello. Collegane uno nelle impostazioni, in «Modello di IA».",
};

export const phone = {
  translateClipboard: "Traduci gli appunti",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
  lockedBy: "Per ora la traduzione viene da Apple (sul tuo iPhone).",
  pasteSetting: "Incollare senza conferma",
  pasteHint: "Se iOS chiede ogni volta che incolli, imposta «Incolla da altre app» su «Consenti» per Triglosa nelle impostazioni dell’iPhone.",
  pasteLater: "Più tardi",
  cardSheetClose: "Chiudi",
  pasteOpen: "Apri le impostazioni dell’iPhone",
  modelConsentSetting: "Invia i testi al modello di IA",
  modelConsentHint: (host) => `I tuoi testi vanno a ${host}. Senza, Apple traduce su questo iPhone e nessun testo ne esce.`,
  modelConsent: {
    title: "Inviare i testi al modello di IA?",
    body: (host) => `Per tradurre e spiegare, Triglosa invia i tuoi testi al modello di IA che hai configurato, presso ${host}. Valgono i termini e l’informativa sulla privacy del suo fornitore. Senza il tuo permesso, Apple traduce su questo iPhone e nessun testo ne esce.`,
    allow: "Consenti",
    deny: "Non consentire",
  },
  /* The first steps, as a sheet over the reading at the first start. */
  welcomePhone: {
    setup: "Configurazione",
    start: "Avviare una traduzione",
    done: "Iniziamo",
    exampleHint: "Un esempio: una frase, le sue due traduzioni e le parole che vale la pena imparare, evidenziate.",
    paste: (button) => ["Copia un testo in qualsiasi app, poi tocca ", button, " nella barra in basso: Triglosa traduce ciò che hai copiato."],
    share: "Oppure seleziona del testo in qualsiasi app, tocca «Condividi» e scegli Triglosa.",
    plus: (button) => ["Oppure tocca ", button, " per scrivere o incollare un nuovo testo, o fotografarlo."],
    languages: "Scegli nelle impostazioni, in «Lingue», la tua lingua e quelle che stai imparando.",
    model: "Un modello di IA traduce in modo più preciso e spiega termini, verbi e ogni parola che tocchi, in base al tuo livello. Collegane uno nelle impostazioni, in «Modello di IA». Senza, Apple traduce su questo iPhone.",
    card: (button) => ["Tocca una parola per cercarla. ", button, " crea una scheda, che puoi inviare direttamente ad Anki."],
  },
  /* The phone runs no model of its own: one way is prepared there. */
  ankiEnabledHint: (_code) => "Richiede l’app AnkiMobile.",
  ankiMissing: "Triglosa chiede ad Anki i tuoi mazzi e tipi di nota. Anki si apre un attimo per questo.",
  ankiLaunch: "Carica da Anki",
  ankiStarting: "Apertura di Anki…",
  ankiSending: "Apertura di Anki…",
  ankiRecheck: "Aggiorna i mazzi",
  ankiRecheckHint: "Riprende da Anki i tuoi mazzi e tipi di nota.",
  ankiAbsent: "AnkiMobile non è installato. Installalo dall’App Store.",
  ankiLeft: "Anki non ha inviato nessun elenco. Riprova e consenti di incollare se iOS lo chiede.",
  ankiDeckHint: "Qualsiasi mazzo indicato da Anki.",
  ankiNoteTypeLook: "In Anki puoi vedere quale tipo di nota usa un mazzo: quando lì aggiungi una carta a quel mazzo, il tipo di nota è indicato in alto.",
  cardClosing: "",
};

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
  searchWith: (name) => `Cerca su ${name}`,
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
  cardCopyAll: "Copia flashcard",
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
  /* Without a model: Apple writes the side a card is missing. */
  cardComplete: "Traduci con Apple",
  cardCompleting: "Apple sta traducendo…",
  cardCompleteUndo: "Annulla la traduzione",
  cardCompleteNothing: "Nessuna traduzione ricevuta da Apple. Controlla i pacchetti lingua nelle impostazioni.",
  cardHow: "Collega un modello di IA nelle impostazioni per una traduzione più precisa, una spiegazione e frasi di esempio.",
  linking: "collegamento…",
  noTerms: "nessun termine difficile trovato",
  noTerm: "nessun termine difficile trovato",
  noVerbs: "nessun verbo difficile trovato",
  /* Said where Apple translated, before what a model adds there. */
  byApple: "Tradotto da Apple (su questo dispositivo).",
  lockedHow:
    "Collega un modello di IA nelle impostazioni per traduzioni più precise, termini, verbi e spiegazioni di ogni parola.",
  lockedHowShort:
    "Collega un modello di IA nelle impostazioni per traduzioni più precise, altri significati e spiegazioni.",
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
  /* Only where the pack can be downloaded; where Apple cannot translate the
     pair at all, `pairUnsupported`. */
  packMissing: (from, to) =>
    `Manca il pacchetto lingua ${from} → ${to}. Scaricalo nelle impostazioni, sotto «Traduzioni».`,
  pairUnsupported: (from, to) =>
    `La traduzione di Apple non sa tradurre ${from} → ${to}. Configura un modello di IA nelle impostazioni.`,

  groupLanguages: "Lingue",
  groupSections: "Termini e verbi",
  groupModel: "Modello di IA",
  groupTranslation: "Traduzioni",
  groupWindow: "Finestra",
  groupShortcuts: "Scorciatoie da tastiera",
  groupReading: "Testo da altri programmi",
  groupReadingEntry: "Altri programmi",
  groupCards: "Flashcard",
  groupAbout: "Informazioni su Triglosa",
  aboutVersion: (version) => `Versione ${version}`,
  aboutNotes: "Mostra le note di rilascio",
  /* The way to the project, then a box for help and one for feedback, each with a sentence with its link in it. */
  aboutProject: (link) => ["Tutte le informazioni e il codice di Triglosa sono su ", link("GitHub"), "."],
  groupHelp: "Aiuto",
  aboutHelp: (link) => ["Trovi altro aiuto nel ", link("README"), "."],
  groupFeedback: "Feedback",
  aboutIssues: (link) => ["Se trovi un problema o desideri una funzione, apri pure una ", link("issue"), " su GitHub."],
  /* The other two systems Triglosa is made for, the link leading to the README's installing. */
  aboutElsewhere: (system, link) => ["Triglosa è disponibile anche per ", link({ mac: "Windows e iPhone", windows: "Mac e iPhone", ios: "Windows e Mac" }[system]), "."],
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
  cardsEnabledHint:
    "«Copia flashcard» copia i tre campi come una riga separata da tabulazioni, per un foglio di calcolo o l’importazione di Anki da un file.",
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

  languagesIntro: ["Triglosa mostra ogni testo accanto alle sue traduzioni in queste lingue (al massimo due traduzioni).", "Il livello che imposti decide quali termini e verbi vengono spiegati in ciascuna lingua e quanto sono semplici le spiegazioni e le frasi di esempio, anche nelle flashcard.", "Nella finestra di traduzione puoi cambiare per un po’ la lingua di una traduzione o aggiungerne una terza. Vale finché non chiudi Triglosa."],
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
  searchHint: "Per cercare sul web termini, verbi e parole selezionate. Si apre nel browser predefinito.",
  searchSystem: "quello impostato in Safari",
  glance: "Traduzione al passaggio del puntatore",
  glanceHint: "Mostra sopra le parole in lingua straniera a cosa corrispondono nella tua lingua.",
  modelIntro:
    "Senza un modello di IA è disponibile solo la traduzione di Apple su questo dispositivo, se il pacchetto lingua è scaricato. Un modello di IA porta traduzioni più precise, termini, verbi, spiegazioni e altre funzioni. Triglosa non ne include uno proprio.",
  modelQuestion: "Che tipo di connessione vuoi usare?",
  modelWays: "Un’opzione che funziona bene è il fornitore affermato OpenRouter. In alternativa puoi inserire un fornitore qualsiasi.",
  setupOnline: "OpenRouter",
  setupOnlineLine: "Preciso e veloce. OpenRouter è un fornitore indipendente su cui devi ricaricare del credito.",
  setupOwn: "Qualsiasi fornitore",
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
  setupChatbot: "Se ti blocchi, puoi copiare il prompt seguente e inviarlo a un chatbot di IA di tua fiducia.",
  setupPromptCopy: "Copia il prompt per un chatbot",
  /* What the chatbot is told: only what holds for every reader of this
     system, never what is set — a reader asking may have clicked about. */
  setupPrompt: ({ app, system, computer, servers, url, n }) => `Sto configurando ${app} su ${system} e mi serve aiuto per collegare un modello di IA. Chiedimi prima a che punto sono e dove mi sono bloccato o cosa non mi è chiaro. Poi aiutami passo per passo e rispondi in italiano. Quando ti serve sapere cosa vedo sullo schermo, proponimi di descriverlo o di mandarti uno screenshot.

L’app: Triglosa è un’app gratuita e open source per chi impara le lingue. Mostra un testo accanto alle sue traduzioni e spiega le parole. Per farlo usa un modello di IA tramite qualsiasi interfaccia compatibile con OpenAI (chat completions), nel cloud o in locale. Non ne include nessuno.

${computer ? `Cloud o locale: se non so ancora quale modo fa per me, spiegami in breve la differenza. Nel cloud i miei testi vanno al fornitore; è preciso e veloce e di solito costa pochi centesimi al mese. Un modello locale gira sul mio computer, non costa nulla e nessun testo lascia quel computer; in cambio è meno preciso e spesso più lento. Il computer ha bisogno di 16 GB di memoria o più, meglio 24 GB; su Windows aiuta una scheda grafica con memoria propria. La guida consiglia Gemma 4 E4B in LM Studio, che non funziona sui Mac con chip Intel. Se sai abbastanza del mio computer, dimmi se un modello locale potrebbe girarci bene; altrimenti chiedimi cosa ti serve sapere.

` : ""}Il modello si configura nelle impostazioni di Triglosa, alla pagina «${n.page}». Ci sono due modi:
- «${n.online}»: creare un account su openrouter.ai, ricaricare il credito, creare una chiave API su openrouter.ai/settings/keys e incollarla nel campo «${n.apiKey}». L’indirizzo è fisso e il modello consigliato è già inserito.
- «${n.own}»: qualsiasi altro fornitore${computer ? ", anche un modello locale" : ""}. Nel campo «${n.endpoint}» va l’indirizzo di base, di solito con /v1 alla fine (senza /chat/completions); in «${n.model}» il nome del modello esattamente come lo scrive il fornitore; in «${n.apiKey}» la chiave${computer ? ", che a un modello locale di solito non serve" : ""}.${computer ? ` Due pulsanti inseriscono gli indirizzi di ${servers.join(" e ")}. L’http non cifrato funziona solo su questo computer o nella rete locale.` : ""}
Il pulsante «${n.test}» mostra se il modello risponde.

Da sapere: Triglosa ha bisogno di un modello che risponda senza ragionare a lungo. L’app disattiva il ragionamento dove il fornitore lo consente e rifiuta un modello che risponde solo ragionando. La guida dell’app (in inglese): ${url}

Non chiedermi mai la mia chiave API.`,
  setupGuide: "Istruzioni",
  endpoint: "Indirizzo del modello di IA",
  endpointHints: {
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
  translatorModes: { model: "Modello di IA", device: "Apple (su questo dispositivo)" },
  deviceIntro:
    "La traduzione di Apple fa parte di macOS: molto veloce e offline, ma spesso imprecisa. Con il pacchetto lingua scaricato, subentra automaticamente quando il modello di IA non risponde.",
  translatorHint: "Se uno dei due non può tradurre, subentra automaticamente l’altro.",
  translatorNoModel: "Non è ancora configurato nessun modello di IA. Fino ad allora traduce Apple, dove i suoi pacchetti lingua sono scaricati.",
  /* Under the choice where Apple goes first and a model is set: a word
     looked up is still the model's (author 2026-11-05). */
  translatorShort: "Per una ricerca da una a tre parole risponde comunque il modello di IA: Apple sbaglia spesso le parole rare.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "tradotto", explained: "spiegato", assigned: "abbinato", detected: "lingua rilevata", words: "parole abbinate", recognized: "testo riconosciuto" },
    and: "e",
    by: ({ kind, name }) => ({ device: ["da", "Apple (su questo dispositivo)"], triglosa: ["da", "Triglosa"], triglosaDevice: ["da", "Triglosa (su questo dispositivo)"] })[kind] || (name ? ["da", name] : ["dal", "modello di IA"]),
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Lingua scelta da te",
  },
  foldPanel: "Comprimi",
  unfoldPanel: "Espandi",
  more: "Spiega più nel dettaglio",
  moreWorking: "Spiegazione più dettagliata…",
  addExample: "Aggiungi una frase d’esempio",
  exampleWorking: "Scrittura di una frase d’esempio…",
  devicePairs: "La traduzione di Apple su questo dispositivo",
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
  screenNoAnswer: "Il riconoscimento del testo non ha risposto. Riprova.",
  screenAbsent: "Il riconoscimento del testo manca in questa installazione. Reinstalla Triglosa.",
  screenPermission: "Triglosa non può registrare lo schermo. Consentilo in Impostazioni di Sistema, sotto «Registrazione schermo e audio di sistema».",
  screenFailed: "Lo screenshot non è riuscito. Riprova.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Riconoscimento del testo da uno screenshot…",
  pointerNothing: "Nessun testo trovato sotto il puntatore. Punta una parola e riprova.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Foto\u00ADcamera",
  pictureLibrary: "Foto",
  pictureFiles: "Immagine da File",
  clipboard: "Appunti",
  pictureNothing: "Nessun testo riconosciuto nell’immagine. Prova un’altra immagine.",
  /* The frame a picture is cut with: the way out without reading it. */
  cancel: "Annulla",
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
  statsHint: "Invia al massimo una volta al giorno che Triglosa è stato usato: la versione, il sistema, se il tuo modello di IA funziona in locale o online o se non ne è configurato nessuno, e se è uno di quelli predefiniti, ma mai quale. Se qualcosa va storto, solo il tipo di errore. Mai i tuoi testi né nulla che ti identifichi.",
  statsThanks: "Grazie.",
  statsPrivacy: (link) => ["Maggiori dettagli nell’", link("informativa sulla privacy"), "."],
  welcome: {
    heading: "Ti diamo il benvenuto in Triglosa",
    steps: "Primi passi",
    exampleHint: "Un esempio. Punta una parola con il mouse per vedere che cosa è diventata nella tua lingua. Fai clic su una parola spagnola per fartela spiegare.",
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
      /* What a word of the original says when it is picked. */
      picks: [
        { text: "Aunque", meaning: "anche se", note: "Introduce un contrasto che non cambia ciò che segue.", wordClass: { kind: "conjunction" }, synonyms: ["si bien", "aun cuando"], in: ["Anche se", "Although"] },
        { text: "llovía a cántaros", infinitive: "llover a cántaros", meaning: "piovere a dirotto", note: "Piovere moltissimo, nel linguaggio familiare.", person: "3ª persona singolare", tense: "Imperfecto", synonyms: ["diluviar", "llover a mares"], in: ["pioveva a dirotto", "raining cats and dogs"] },
        { text: "salimos", infinitive: "salir", meaning: "uscire", note: "Lasciare un luogo, qui per andare a passeggiare.", person: "1ª persona plurale", tense: "Indefinido", synonyms: ["irse", "marcharse"], in: ["siamo usciti", "went out"] },
        { text: "a", meaning: "a", note: "Dopo un verbo di movimento, indica che cosa si va a fare.", wordClass: { kind: "preposition" }, in: ["a", "for"] },
        { text: "pasear", infinitive: "pasear", meaning: "passeggiare", note: "Andare a piedi, senza fretta e per piacere.", synonyms: ["caminar", "andar"], in: ["passeggiare", "walk"] },
        { text: "por", meaning: "per", note: "Indica lo spazio in cui ci si muove.", wordClass: { kind: "preposition" }, synonyms: ["a través de"], in: ["per", "in"] },
        { text: "el", meaning: "il", note: "Articolo determinativo davanti a un nome maschile.", wordClass: { kind: "article", number: "singular", gender: "masculine" }, in: ["il", "the"] },
        { text: "casco antiguo", meaning: "centro storico", note: "La parte storica di una città.", wordClass: { kind: "noun", number: "singular", gender: "masculine" }, synonyms: ["centro histórico", "ciudad vieja"], in: ["centro storico", "old town"] },
      ],
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
      question: "Triglosa può contare in modo anonimo?",
      yes: "Sì",
      no: "No",
      change: "Puoi cambiarlo in qualsiasi momento nelle impostazioni, in «Informazioni su Triglosa».",
      yesDone: "Grazie! Puoi cambiarlo nelle impostazioni, in «Informazioni su Triglosa».",
      noDone: "Non viene contato nulla. Puoi cambiarlo nelle impostazioni, in «Informazioni su Triglosa».",
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
    "Collega un modello di IA nelle impostazioni per traduzioni, termini, verbi e spiegazioni di ogni parola.",
  lockedHowShort:
    "Collega un modello di IA nelle impostazioni per traduzioni, significati e spiegazioni.",
  apiKeyHints: {
    online: "La chiave di OpenRouter (passo 3). Finisce in Gestione credenziali di Windows, mai nel file delle impostazioni.",
    own: "Finisce in Gestione credenziali di Windows, mai nel file delle impostazioni. Un modello locale di solito non ne ha bisogno.",
  },
  endpointHints: {
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
  groupReadingEntry: "Testo da altre app",
  groupReading: "Testo da altre app",
  translateClipboard: "Traduci gli appunti",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
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
    exampleHint: "Un esempio: una frase, le sue due traduzioni e le parole che vale la pena imparare, evidenziate. Tocca una parola spagnola per fartela spiegare.",
    paste: (button) => ["Copia un testo in qualsiasi app, poi tocca ", button, " nella barra in basso: Triglosa traduce ciò che hai copiato."],
    share: "Seleziona del testo in qualsiasi app, tocca «Condividi» e scegli Triglosa.",
    plus: (button) => ["Tocca ", button, " per scrivere o incollare un nuovo testo, o fotografarlo."],
    /* The Control Center's controls, in iOS's own word, which the reader adds there. */
    control: "Aggiungi i controlli di Triglosa al Centro di Controllo per aprirlo da qualsiasi punto.",
    languages: "Scegli nelle impostazioni, in «Lingue», la tua lingua e quelle che stai imparando.",
    model: "Un modello di IA traduce in modo più preciso e spiega termini, verbi e ogni parola che tocchi, in base al tuo livello. Collegane uno nelle impostazioni, in «Modello di IA». Senza, Apple traduce su questo iPhone.",
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

import { why } from "./detail.js";

/* The French interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   French. The spaces before « : ; ? ! » and inside the guillemets are
   no-break spaces, as French typography has them. */
export default {
  placeholder: "Colle ou tape un texte",
  translate: "Traduire",
  enterKey: "⌘↩",
  edit: "Modifier",
  settings: "Réglages",
  original: "Original",
  terms: "Termes",
  term: "Terme",
  verbs: "Verbes",
  marked: "Sélection",
  inSentence: "ici",
  previousSentence: "Phrase précédente",
  nextSentenceLine: "Phrase suivante",
  /* A looked-up word found misspelled: the line under it, the typed word
     in it a link that looks it up as typed. */
  correctedFrom: (typed) => `Corrigé de ${typed}`,
  didYouMean: (word) => `Tu voulais dire ${word} ?`,
  synonyms: "apparentés",
  wordClasses: {
    noun: "nom",
    "proper noun": "nom propre",
    adjective: "adjectif",
    adverb: "adverbe",
    pronoun: "pronom",
    preposition: "préposition",
    conjunction: "conjonction",
    article: "article",
    numeral: "numéral",
    interjection: "interjection",
    singular: "singulier",
    plural: "pluriel",
    masculine: "masculin",
    feminine: "féminin",
    neuter: "neutre",
  },
  copy: "Copier",
  insert: "Insérer",
  copied: "Copié",
  paste: "Coller",
  settingsDone: "OK",
  search: "Rechercher (externe)",
  speak: "Prononcer",
  opened: "Ouvert",
  conjugation: "Conjugaison (externe)",
  card: "Créer une fiche",
  cardCreate: "Créer une fiche",
  cardLanguage: "Langue de la fiche",
  sourceLanguage: "Changer la langue",
  addLanguage: "Ajouter une langue",
  removeLanguage: "Retirer la langue",
  unknownLanguage: "Langue inconnue",
  added: "Ajoutée",
  synonymBack: "Mot précédent",
  synonymForward: "Mot suivant",
  cardTerm: "Langue étrangère",
  cardMeaning: "Langue maternelle",
  cardNote: "Notes",
  cardCopyAll: "Copier les trois",
  cardCopyField: "Copier le champ",
  cardToAnki: "Enregistrer dans Anki",
  cardAnkiStart: "Lancer Anki",
  cardAnkiStarting: "Lancement d’Anki…",
  cardAnkiSetup: "Choisir un paquet Anki",
  cardNoteUnmapped: "Aucun champ attribué — ces lignes n’iront pas dans Anki.",
  ankiSaved: (deck) => (deck ? `La fiche est dans le paquet « ${deck} ».` : "La fiche est dans le paquet."),
  cardClosing: "La fenêtre se ferme.",
  ankiDuplicate: "Cette fiche est déjà dans le paquet — Anki compare pour cela le premier champ du type de note.",
  ankiSending: "Ajout…",
  ankiFailed: ({ kind, detail } = {}) => {
    const said = detail ? ` (${detail})` : "";
    if (kind === "unreachable") {
      return "Anki ne répond pas. Lance Anki et vérifie qu’AnkiConnect est installé.";
    }
    if (kind === "unconfigured") {
      return "Aucun paquet choisi. Choisis-en un dans les réglages, sous « Fiches ».";
    }
    if (kind === "empty") {
      return "Le premier champ de la note serait vide" + said
        + ". Attribue-le dans les réglages à l’une des trois lignes.";
    }
    if (kind === "no-deck") {
      return "Anki ne connaît pas ce paquet" + said + ". Choisis-le à nouveau dans les réglages.";
    }
    if (kind === "no-note-type") {
      return "Anki ne connaît pas ce type de note" + said + ". Choisis-le à nouveau dans les réglages.";
    }
    return "Anki n’a pas ajouté la fiche" + said + ". Réessaie.";
  },
  detecting: "Reconnaissance de la langue…",
  nothingOn: (word) => `Aucune explication reçue pour « ${word} ».`,
  searching: "recherche…",
  cardImprove: "Améliorer avec l’IA",
  cardDetecting: "Détection de la langue…",
  cardImproving: "Amélioration de la fiche…",
  cardUndo: "Annuler l’amélioration par l’IA",
  cardImproveNothing: "Aucune amélioration utilisable reçue. La fiche reste inchangée.",
  linking: "mise en relation…",
  noTerms: "aucun terme difficile trouvé",
  noTerm: "aucun terme difficile trouvé",
  noVerbs: "aucun verbe difficile trouvé",
  lockedHow:
    "Connecte un modèle d’IA dans les réglages pour des traductions plus précises, les termes, les verbes, les explications et d’autres fonctions.",
  noAnswer: "Aucune réponse reçue.",
  faults: {
    unreachable:
      "Pas de connexion au modèle d’IA. Vérifie la connexion internet et les réglages.",
    insecure:
      "L’adresse du modèle d’IA n’est pas chiffrée (http). Utilise https ou une adresse de ton propre réseau dans les réglages.",
    timeout: "Le modèle d’IA a mis trop de temps. Réessaie.",
    key: (f) =>
      `La clé API a été refusée${why(f)}. Vérifie-la dans les réglages.`,
    notFound: (f) =>
      `Adresse ou modèle introuvable${why(f)}. Vérifie les deux dans les réglages `
      + "– il manque souvent « /v1 » à la fin de l’adresse.",
    refused: (f) =>
      `Le modèle d’IA a refusé la requête${why(f)}. Vérifie le nom du modèle dans les réglages.`,
    busy: (f) =>
      `Le modèle d’IA est surchargé en ce moment${why(f)}. Réessaie plus tard.`,
    server: (f) =>
      `Panne chez le fournisseur du modèle d’IA${why(f)}. Réessaie dans un instant.`,
    status: (f) =>
      `Réponse inattendue du modèle d’IA${why(f)}. Vérifie les réglages.`,
    empty: "Le modèle d’IA a envoyé une réponse vide. Réessaie.",
    thinking: (f) =>
      `${f.model || "Ce modèle d’IA"} réfléchit avant chaque réponse et devient ainsi trop lent. `
      + "Choisis un autre modèle dans les réglages.",
    noModel:
      "Aucun modèle n’est chargé dans le serveur local. Charges-en un ou saisis un nom de modèle dans les réglages.",
    unknown: (f) => f.detail || "Quelque chose s’est mal passé. Réessaie.",
  },
  noDevice:
    "La traduction d’Apple ne répond pas. Configure un modèle d’IA dans les réglages.",
  onlyKnownLanguages:
    "La traduction d’Apple ne connaît pas cette langue. Configure un modèle d’IA dans les réglages.",
  pairMissing: (from, to) =>
    `Le pack de langue ${from} → ${to} manque. Configure un modèle d’IA dans les réglages ou télécharge-y le pack de langue, sous « Traductions ».`,

  groupLanguages: "Langues",
  groupSections: "Termes et verbes",
  groupModel: "Modèle d’IA",
  groupTranslation: "Traductions",
  groupWindow: "Fenêtre",
  groupShortcuts: "Raccourcis clavier",
  groupReading: "Autres programmes",
  groupCards: "Fiches",
  groupAbout: "À propos de Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  aboutNotes: "Afficher les notes de version",
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa se trouve sur ", link("project", "GitHub"), ", l’aide dans son ", link("help", "README"), ". Si tu rencontres un problème ou souhaites une fonction, n’hésite pas à ouvrir une ", link("issues", "issue"), "."],
  updatesCheck: "Rechercher des mises à jour",
  updatesChecking: "Recherche…",
  updatesHint: "Demande à GitHub la version la plus récente. La mise à jour n’est téléchargée que lorsque tu cliques sur « Installer maintenant ».",
  updatesNone: "Tu as la version la plus récente.",
  updatesFound: (version) => `La version ${version} est disponible.`,
  updatesDownload: "Afficher le téléchargement et les notes de version",
  updatesInstall: "Installer maintenant",
  updatesLoading: (percent) => `Téléchargement… ${percent} %`,
  updatesInstalling: "Installation… Triglosa va redémarrer.",
  updatesInstallNone: "Cette version ne peut pas être installée d’ici. Télécharge-la manuellement.",
  updatesInstallUnreachable: "La mise à jour n’a pas pu être téléchargée. Réessaie plus tard.",
  updatesInstallFailed: (detail) => `La mise à jour n’a pas été installée${detail ? ` (${detail})` : ""}. Télécharge-la manuellement.`,
  diagnosticsCopy: "Copier le diagnostic",
  diagnosticsHint: "Pour signaler un problème : version, système, langues, modèle d’IA et dernières erreurs. Jamais tes textes ni ta clé API. Rien n’est envoyé ; tu le colles toi-même.",
  updatesFailed: (status) => `Pas de réponse de GitHub${status ? ` (${status})` : ""}. Réessaie plus tard.`,

  optionOff: "non",
  cardsEnabled: "Afficher le bouton des fiches",
  cardModes: {
    never: "jamais",
    second: "seulement pour la deuxième langue",
    third: "seulement pour la troisième langue",
    learned: "pour la deuxième et la troisième langue",
    foreign: "pour toutes les langues étrangères",
  },
  cardsImprove: "Améliorer automatiquement les fiches avec l’IA",
  cardsImproveHint: "Les fiches peuvent toujours être améliorées avec l’IA d’une pression sur un bouton.",
  ankiEnabled: "Exporter directement vers Anki",
  ankiEnabledHint: (code) => `Nécessite Anki avec le module AnkiConnect (code ${code}).`,
  ankiSync: "Synchroniser Anki après chaque carte",
  ankiSyncHint:
    "Ne fonctionne que si AnkiWeb est configuré.",
  ankiSearching: "Recherche…",
  ankiMissing:
    "Anki ne répond pas. Lance Anki et vérifie qu’AnkiConnect est installé.",
  ankiRecheck: "Chercher à nouveau",
  ankiLaunch: "Lancer Anki",
  ankiStarting: "Lancement d’Anki…",
  ankiDeck: "Paquet Anki",
  ankiAddLanguage: "Ajouter une langue",
  ankiRemoveLanguage: "Retirer la langue",
  ankiTargetChoice: "Langue",
  ankiPerLanguage: "Réglages Anki par langue",
  ankiDeckHint:
    "Tout paquet qu’Anki indique. Un nom qui n’existe pas encore est créé au premier enregistrement.",
  ankiNewDeck: "Nouveau paquet…",
  ankiDeckList: "Dans la liste",
  ankiNoteType: "Type de note Anki",
  ankiNoteTypeHint: "Le type de note décide des champs qu’a une fiche.",
  ankiNoteTypeUsed: (count) => `dans ce paquet (${count})`,
  ankiNoteTypeFound: (name) =>
    `Les fiches du paquet choisi utilisent le type de note « ${name} ».`,
  ankiNoteTypeLook:
    "Le paquet choisi n’a pas encore de fiches d’où lire le type de note. Choisis-le toi-même.",
  ankiFields: "Champs Anki",
  ankiFieldsHint: "Quel champ du type de note reçoit laquelle des trois lignes.",
  ankiNoField: "— ne pas écrire",
  ankiFirstField: (name) =>
    `Le premier champ du type de note (« ${name} ») reçoit aussi le mot étranger. Anki n’accepte pas de note dont le premier champ est vide.`,

  languagesIntro: ["Triglosa affiche chaque texte à côté de ses traductions dans ces langues (deux traductions au plus).", "Le niveau que tu choisis décide quels termes et verbes sont expliqués dans chaque langue.", "Dans la fenêtre de traduction, tu peux changer temporairement la langue d’une traduction ou en ajouter une troisième. Cela vaut jusqu’à ce que tu quittes Triglosa."],
  firstLanguage: "Langue maternelle",
  firstLanguageHint: "Aussi la langue de l’app.",
  secondLanguage: "Deuxième langue",
  thirdLanguage: "Troisième langue (facultatif)",
  noThird: "aucune",
  languagesTuned: "Optimisées",
  languagesOther: "Non optimisées",
  otherLanguageHint:
    "Triglosa n’est pas optimisé pour cette langue : les erreurs sont plus fréquentes et il n’y a pas de section « Verbes ». Plus le modèle d’IA est performant, meilleur est le résultat.",
  levelNames: {
    A1: "Débutant",
    A2: "Élémentaire",
    B1: "Intermédiaire",
    B2: "Intermédiaire avancé",
    C1: "Avancé",
    C2: "Quasi natif",
  },
  showModes: {
    never: "jamais",
    second: "seulement pour la deuxième langue",
    third: "seulement pour la troisième langue",
    foreign: "pour toutes les langues étrangères optimisées",
    all: "pour toutes les langues optimisées",
  },
  termModes: {
    never: "jamais",
    second: "seulement pour la deuxième langue",
    third: "seulement pour la troisième langue",
    foreign: "pour toutes les langues étrangères",
    all: "pour toutes les langues",
  },
  showVerbsHint: "Forme de base, personne et temps de trois formes verbales avancées du texte au plus.",
  showTermsHint: "Explications de trois mots ou expressions avancés du texte au plus.",
  showTerms: "Afficher les termes",
  showVerbs: "Afficher les verbes",
  underline: "Soulignement en couleur dans le texte",
  searchEngine: "Moteur de recherche",
  searchHint: "Pour « Rechercher (externe) » sur les termes, les verbes et les mots marqués. S’ouvre dans le navigateur par défaut.",
  searchSystem: "celui réglé dans Safari",
  glance: "Traduction au survol",
  glanceHint: "Affiche au-dessus des mots en langue étrangère ce qui leur correspond dans ta langue.",
  modelIntro:
    "Sans modèle d’IA, seule la traduction d’Apple sur l’appareil est disponible, si le pack de langue est téléchargé. Un modèle d’IA apporte des traductions plus précises, les termes, les verbes, les explications et d’autres fonctions. Triglosa n’en fournit aucun.",
  modelQuestion: "Quel type de connexion veux-tu utiliser ?",
  modelWays: "Une solution qui fonctionne bien est préparée. Sinon, tu peux saisir n’importe quel fournisseur.",
  setupOnline: "En ligne",
  setupOnlineVia: "via OpenRouter",
  setupOnlineLine: "Précis et rapide. OpenRouter est un fournisseur indépendant chez qui tu dois recharger du crédit.",
  setupOwn: "Le saisir toi-même",
  setupOwnVia: "n’importe quel fournisseur",
  setupRecommended: (name, filled) => `Modèle recommandé : ${name}${filled ? ", déjà renseigné" : ""}`,
  setupOnlineSteps: (site, key, privacy) => [
    ["Crée un compte sur ", site("openrouter.ai"), "."],
    ["Ajoute du crédit : 5 € suffisent pour plusieurs milliers de traductions."],
    ["Crée une ", key("clé d’API"), " et colle-la ci-dessous."],
    ["Facultatif : active « Zero Data Retention » dans les ", privacy("paramètres de confidentialité"), " pour plus de confidentialité."],
  ],
  setupOnlineFree: (name) => `Sans crédit, une version gratuite de ${name} proposée par Google fonctionne aussi. Mais elle ne suffit que pour quelques traductions par jour, et Google peut conserver tes textes et les utiliser pour l’entraînement. Elle ne sert donc qu’à essayer et ne fonctionne pas avec Zero Data Retention activé.`,
  setupOnlineFreeTake: "Renseigner le modèle gratuit",
  setupOnlinePaidTake: "Renseigner le modèle recommandé",
  setupMore: (guide) => ["Plus d’informations sur le choix du fournisseur et une comparaison de modèles dans le ", guide("README"), "."],
  setupChatbot: "Si tu bloques, un chatbot d’IA de confiance peut aussi t’aider.",
  setupGuide: "Instructions",
  endpoint: "Adresse du modèle d’IA",
  endpointHints: {
    online: "L’adresse d’OpenRouter. Pour un autre fournisseur, choisis « Le saisir toi-même » ci-dessus.",
    own: "Toute adresse dotée d’une interface compatible OpenAI — dans le cloud ou en local.",
  },
  endpointPreset: (name) => `Renseigner l’adresse de ${name}`,
  model: "Modèle",
  modelHints: {
    online: "N’importe quel modèle proposé par OpenRouter, sous le nom indiqué sur sa page.",
    own: "Si le champ reste vide, l’app prend le premier modèle proposé à cette adresse.",
  },
  apiKey: "Clé d’API",
  apiKeyEmpty: "aucune enregistrée",
  apiKeyHints: {
    online: "La clé d’OpenRouter (étape 3). Va dans le trousseau du système, jamais dans le fichier de réglages.",
    own: "Va dans le trousseau du système, jamais dans le fichier de réglages. Un modèle local n’en a généralement pas besoin.",
  },
  forgetKey: "Oublier",
  keySaveFailed: (detail) =>
    `La clé d’API n’a pas été enregistrée${detail ? ` (${detail})` : ""}. Réessaie.`,
  testConnection: "Tester la connexion",
  testing: "Test en cours…",
  testOk: (name) => `Répond, avec « ${name} ».`,

  translator: "Traduction par",
  translatorModes: { model: "Modèle d’IA", device: "Apple (sur l’appareil)" },
  deviceIntro:
    "La traduction d’Apple fait partie de macOS : très rapide et hors ligne, mais souvent imprécise. Avec le pack de langue téléchargé, elle prend le relais automatiquement quand le modèle d’IA ne répond pas.",
  translatorHint: "Si l’un des deux ne peut pas traduire, l’autre prend le relais automatiquement.",
  translatorNoModel: "Aucun modèle d’IA n’est encore configuré. D’ici là, Apple traduit là où ses packs de langue sont téléchargés.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "traduit", explained: "expliqué", assigned: "associé", detected: "langue détectée", words: "mots associés", recognized: "texte reconnu" },
    and: "et",
    by: ({ kind, name }) => ({ device: ["par", "Apple (sur l’appareil)"], triglosa: ["par", "Triglosa"], triglosaDevice: ["par", "Triglosa (sur l’appareil)"] })[kind] || ["par", name || "le modèle d’IA"],
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Langue choisie par toi",
  },
  foldPanel: "Replier",
  unfoldPanel: "Déplier",
  more: "Expliquer plus en détail",
  moreWorking: "Explication plus détaillée…",
  addExample: "Ajouter une phrase d’exemple",
  exampleWorking: "Rédaction d’une phrase d’exemple…",
  devicePairs: "La traduction d’Apple sur l’appareil",
  pairsChecking: "Vérification…",
  pairsAllInstalled: "Tous les packs de langue pour tes langues sont téléchargés.",
  pairsNoDevice:
    "La traduction d’Apple ne répond pas pour le moment.",
  pairsRecheck: "Vérifier à nouveau",
  pairsDownloadable: (pairs) => `Pas encore téléchargé : ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Impossible avec la traduction d’Apple : ${pairs}. Cela ne peut pas être téléchargé.`,
  pairsFetch: "Télécharger les langues…",
  pairsFetchAgain: "Redemander…",
  pairsOnTheirWay:
    "Le téléchargement se fait en arrière-plan et peut prendre quelques minutes ; tu n’as rien d’autre à faire. Pendant ce temps, « Redemander » n’affiche rien. Si la fenêtre de macOS a été fermée, redemande simplement.",
  pairsPrompt: "Télécharger des langues pour la traduction d’Apple",
  pairsFetched: "Demandé",
  pairsBySettings:
    "Ajoute-les dans « Langue et région », sous « Langues pour la traduction ».",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Adapter la hauteur de la fenêtre à son contenu",
  kept: "Garder les traductions précédentes",
  keptHint: "Gardées jusqu’à ce que tu quittes Triglosa.",
  keptLast: (n) => `les ${n} dernières`,
  appIcon: "Icône pendant que Triglosa est ouvert",
  appIcons: { menubar: "dans la barre des menus", dock: "dans le Dock", both: "dans la barre des menus et le Dock" },
  shortcutsLead:
    "Si rien ne se passe ici dans la fenêtre quand tu appuies sur un raccourci, il est déjà pris. Choisis-en un autre.",
  hotkey: "Lancer la traduction",
  hotkeyEmpty: "aucun raccourci",
  hotkeyRecording: "Appuie sur une combinaison…",
  hotkeyClear: "Effacer",
  hotkeyLead:
    "Traduit du texte depuis n’importe quel programme : copie-le (⌘C), puis appuie sur le raccourci. Ouvre la dernière traduction si rien de nouveau n’a été copié.",
  hotkeyLeadSelected:
    "Traduit le texte sélectionné dans n’importe quel programme. Ouvre la dernière traduction si aucun texte n’est sélectionné.",
  freshHotkey: "Nouvelle traduction",
  cardHotkey: "Créer une fiche",
  cardHotkeyLead:
    "Crée une fiche à partir du texte copié (⌘C). Ouvre une fenêtre de fiche vide si rien de nouveau n’a été copié.",
  cardHotkeyLeadSelected:
    "Crée une fiche à partir du texte sélectionné. Ouvre une fenêtre de fiche vide si aucun texte n’est sélectionné.",
  hotkeyTakenHere: (name) => `Ce raccourci est déjà utilisé pour « ${name} ». Choisis-en un autre.`,
  hotkeyFailed: (reason) =>
    "Le raccourci est sans doute déjà pris"
    + (reason ? ` (${reason})` : "") + ". Choisis-en un autre.",
  hotkeyTakenSystem:
    "Ce raccourci est pris par macOS. Choisis-en un autre.",
  hotkeyTakenEverywhere:
    "Chaque programme utilise ce raccourci lui-même. Choisis-en un autre.",

  wordHotkey: "Mot sous le pointeur",
  wordHotkeyLead: "Cherche le mot sur lequel se trouve le pointeur.",
  sentenceHotkey: "Phrase sous le pointeur",
  sentenceHotkeyLead: "Traduit toute la phrase sur laquelle se trouve le pointeur.",
  forceClick: "Clic forcé",
  forceClickHint:
    "Pour que la recherche d’Apple ne s’ouvre pas en plus, désactive « Recherche et détection de données » dans Réglages Système, Trackpad.",
  pointerUnreliable: "Les fonctions ci-dessous ne marchent pas de manière fiable dans tous les programmes.",
  withSentence: "Envoyer la phrase",
  withSentenceLead:
    "Quand tu cherches trois mots ou moins, leur phrase part avec eux vers le modèle d’IA (30 mots au plus). Cela améliore la détection de la langue et les traductions.",
  nextSentence: "Proposer la phrase suivante",
  nextSentenceLead:
    "Affiche sous l’original la phrase qui suit dans le texte d’origine. Un clic la traduit.",

  permission: "Autorisation macOS pour lire et insérer",
  directSelection: "Lire le texte sélectionné et insérer les traductions directement",
  directSelectionLead:
    "Les raccourcis reprennent le texte sélectionné sans que tu le copies d’abord, et les traductions peuvent être insérées directement dans d’autres programmes.",
  permissionHave: "L’autorisation est accordée dans macOS.",
  permissionTrust:
    "Facultatif : avec l’autorisation macOS « Contrôle de l’appareil et accès aux données » (dans Confidentialité et sécurité, « Accessibilité » jusqu’à macOS 26), Triglosa peut lire directement le texte sélectionné, lire le mot ou la phrase sous le pointeur et insérer des traductions directement dans d’autres programmes.",
  permissionTrustUse:
    "Triglosa n’utilise l’autorisation que pour ces fonctions et seulement si tu les actives. Triglosa est open source, tu peux donc le vérifier :",
  permissionCode: "voir le code",
  permissionAsk: "Autoriser…",
  permissionOpen: "Ouvrir Réglages Système",
  permissionPending:
    "macOS a ajouté Triglosa à la liste. Active Triglosa dans la liste — cette fenêtre le remarque d’elle-même.",
  copyFirst: (key) => `Astuce : copie un texte dans n’importe quel programme (⌘C), puis appuie sur ${key}.`,
  captureFailed: "La sélection n’a pas pu être lue. Copie le texte et colle-le ici.",

  inserted: "Inséré",
  insertNoWay: (reason) =>
    reason === "focus" ? "Aucun programme où insérer"
    : reason === "accessibility" ? "Autorisation manquante"
    : "Non inséré",

  trayTranslating: "Traduire",

  trayCards: "Fiches",

  trayCapture: "Traduire le texte sélectionné",
  trayCaptureCopied: "Traduire le texte copié",
  trayCard: "Créer une fiche à partir du texte sélectionné",
  trayCardCopied: "Créer une fiche à partir du texte copié",
  trayCardBlank: "Nouvelle fiche",
  trayScreen: "Traduire le texte d’une capture d’écran",
  trayScreenCopy: "Copier le texte d’une capture d’écran",
  trayScreenCard: "Créer une fiche d’une capture d’écran",
  screenHotkey: "Traduire le texte d’une capture d’écran",
  screenHotkeyLead: "Tu traces un cadre autour d’un texte à l’écran, Triglosa le reconnaît et le traduit.",
  screenCopyHotkey: "Copier le texte d’une capture d’écran",
  screenCopyHotkeyLead: "Tu traces un cadre autour d’un texte à l’écran, et le texte reconnu va dans le presse-papiers. Triglosa reste fermé.",
  screenCardHotkey: "Créer une fiche d’une capture d’écran",
  screenCardHotkeyLead: "Tu traces un cadre autour d’un texte à l’écran, et le texte reconnu va sur une nouvelle fiche.",
  screenPrivacy: "Les captures d’écran ne sont traitées que sur ton appareil. Seul le texte reconnu est envoyé au modèle d’IA.",
  screenPermissionTitle: "Autorisation macOS pour les captures d’écran",
  screenPermissionLead:
    "Facultatif : avec l’autorisation macOS « Enregistrement de l’écran et de l’audio système » (dans Confidentialité et sécurité), Triglosa peut faire une capture de n’importe quel texte à l’écran pour le traduire, le copier ou le mettre sur une fiche, et lire le mot ou la phrase sous le pointeur même là où un programme ne fournit pas de texte.",
  screenPermissionUse:
    "Triglosa n’enregistre l’écran que lorsque tu utilises l’une de ces fonctions. Les captures d’écran ne sont traitées que sur ton appareil. Seul le texte reconnu est envoyé au modèle d’IA.",
  screenPermissionPending:
    "macOS a ajouté Triglosa à la liste. Active Triglosa dans la liste, puis rouvre Triglosa.",
  screenHint: "Trace un cadre autour du texte · Échap annule",
  screenReading: "Reconnaissance du texte…",
  screenNothing: "Aucun texte reconnu. Choisis une autre partie de l’écran.",
  imageUnreadable: "L’image n’a pas pu être ouverte. Choisis-en une autre.",
  imageNothing: "Aucun texte reconnu dans l’image. Choisis-en une autre.",
  dropImage: "Dépose l’image ici pour la traduire",
  /* Under a new translation's field on a computer, where a phone has its
     camera, photos and clipboard. */
  dropHint: "Fais glisser une image dans la fenêtre pour la traduire.",
  dropNeedsPin: (name, pin) => ["Pour cela, « ", name, " » ", pin, " doit être activé."],
  screenNoAnswer: "La reconnaissance de texte n’a pas répondu. Réessaie.",
  screenAbsent: "La reconnaissance de texte manque dans cette installation. Réinstalle Triglosa.",
  screenPermission: "Triglosa n’a pas le droit d’enregistrer l’écran. Autorise-le dans Réglages Système, sous « Enregistrement de l’écran et de l’audio système ».",
  screenFailed: "La capture d’écran n’a pas fonctionné. Réessaie.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Reconnaissance du texte d’une capture d’écran…",
  pointerNothing: "Aucun texte trouvé sous le pointeur. Pointe un mot et réessaie.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Appareil photo",
  pictureLibrary: "Photos",
  clipboard: "Presse-papiers",
  pictureNothing: "Aucun texte reconnu dans l’image. Essaie une autre image.",
  trayShow: "Afficher la fenêtre",
  trayUpdates: "Rechercher des mises à jour",
  trayHelp: "Aide",
  trayProblem: "Signaler un problème",
  trayRestart: "Redémarrer Triglosa",
  trayQuit: "Quitter Triglosa",
  settingsOpen: "Ouvrir les réglages",
  historyBack: "Traduction précédente",
  historyForward: "Traduction suivante",
  newReading: "Nouvelle traduction",
  closeWindow: "Fermer la fenêtre",
  pinWindow: "Garder au premier plan",
  unpinWindow: "Ne plus garder au premier plan",
  welcomeFind:
    "Triglosa fonctionne en arrière-plan. Tu trouveras son symbole, un livre, en haut à droite dans la barre des menus.",
  welcomeModel: "Un modèle d’IA traduit plus précisément et explique les termes, les verbes et chaque mot sur lequel tu cliques, selon ton niveau. Connectes-en un dans les réglages, sous « Modèle d’IA ».",
  statsSetting: "Statistiques d’utilisation anonymes",
  statsHint: "Envoie au plus une fois par jour que Triglosa a été utilisé : la version, le système et le type de modèle d’IA (OpenRouter, LM Studio ou autre). En cas de problème, seulement le type d’erreur. Jamais tes textes ni rien qui t’identifie.",
  statsThanks: "Merci.",
  welcome: {
    heading: "Bienvenue dans Triglosa",
    steps: "Premiers pas",
    exampleHint: "Un exemple. Pointe un mot avec la souris pour voir ce qu’il est devenu dans ta langue.",
    example: {
      source: "es",
      text: "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
      panels: [
        { code: "fr", text: "Même s’il pleuvait à verse, nous sommes sortis nous promener dans la vieille ville." },
        { code: "en", text: "Although it was raining cats and dogs, we went out for a walk in the old town." },
      ],
      terms: [
        { text: "llover a cántaros", spot: "llovía a cántaros", meaning: "pleuvoir à verse", note: "Pleuvoir très fort, dans la langue familière.", in: ["pleuvait à verse", "raining cats and dogs"] },
        { text: "casco antiguo", spot: "casco antiguo", meaning: "vieille ville", note: "Le centre historique d’une ville.", in: ["vieille ville", "old town"] },
      ],
      verbs: [
        { form: "salimos", infinitive: "salir", tense: "Indefinido", meaning: "sortir", person: "1re personne du pluriel", in: ["sommes sortis", "went out"] },
      ],
      glance: "Aunque | Même s’il | Although\nllovía | pleuvait | it was raining\na cántaros | à verse | cats and dogs\nsalimos | nous sommes sortis | we went out\na pasear | nous promener | for a walk\npor | dans | in\nel | la | the\ncasco antiguo | vieille ville | old town",
    },
    languages: "Choisis dans les réglages, sous « Langues », ta propre langue et les langues que tu apprends.",
    start: {
      title: "C’est parti.",
      select: (key) => ["Sélectionne un texte dans n’importe quel programme et appuie sur ", key, "."],
      copy: (key) => ["Copie un texte dans n’importe quel programme (⌘C) et appuie sur ", key, "."],
      change: "Tu peux changer le raccourci dans les réglages, sous « Raccourcis clavier ».",
      noKey: "ton raccourci",
      set: "Tu le définis dans les réglages, sous « Raccourcis clavier ».",
    },
    permission: {
      title: "Facultatif : lire le texte directement.",
      body: "Avec l’autorisation macOS « Contrôle de l’appareil et accès aux données » (« Accessibilité » jusqu’à macOS 26), Triglosa lit le texte sélectionné sans le copier et insère des traductions dans d’autres programmes. Tu l’accordes dans les réglages, sous « Autres programmes ».",
    },
    stats: {
      off: "Tu peux le désactiver à tout moment dans les réglages.",
    },
    more: (link) => ["Toutes les informations sur Triglosa se trouvent dans le ", link("README"), " sur GitHub."],
    hide: "Ne plus afficher",
    settings: "Ouvrir les réglages",
    close: "Fermer ce message",
    open: "Afficher les premiers pas",
  },
};

export const windows = {
  pointerUnreliable: "Les fonctions ci-dessous lisent le texte d’autres programmes. Cela ne marche pas de manière fiable avec tous les programmes.",
  readingPrivacy: "Triglosa ne lit le texte d’un autre programme que lorsque tu appuies sur un raccourci, et ne l’envoie nulle part ailleurs qu’au modèle d’IA. Quand un programme ne fournit pas de texte, le mot et la phrase sous le pointeur sont lus sur une capture d’écran autour du pointeur. Les captures d’écran sont traitées uniquement sur ton appareil. Seul le texte reconnu est envoyé au modèle d’IA.",
  noDevice: "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  onlyKnownLanguages: "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  pairMissing: () => "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  modelIntro:
    "Triglosa traduit et explique avec un modèle d’IA : traductions, termes, verbes, explications et d’autres fonctions. Il n’en fournit aucun.",
  lockedHow:
    "Connecte un modèle d’IA dans les réglages pour les traductions, les termes, les verbes, les explications et d’autres fonctions.",
  apiKeyHints: {
    online: "La clé d’OpenRouter (étape 3). Va dans le Gestionnaire d’identification de Windows, jamais dans le fichier de réglages.",
    own: "Va dans le Gestionnaire d’identification de Windows, jamais dans le fichier de réglages. Un modèle local n’en a généralement pas besoin.",
  },
  endpointHints: {
    online: "L’adresse d’OpenRouter. Pour un autre fournisseur, choisis « Le saisir toi-même » ci-dessus.",
    own: "Toute adresse dotée d’une interface compatible OpenAI — dans le cloud ou en local.",
  },
  hotkeyLead:
    "Traduit le texte sélectionné dans n’importe quel programme. Ouvre la dernière traduction si aucun texte n’est sélectionné.",
  cardHotkeyLead:
    "Crée une fiche à partir du texte sélectionné. Ouvre une fenêtre de fiche vide si aucun texte n’est sélectionné.",
  hotkeyTakenSystem: "Ce raccourci est pris par Windows. Choisis-en un autre.",
  appIcons: { menubar: "seulement dans la zone de notification", both: "aussi dans la barre des tâches" },
  copyFirst: (key) => `Astuce : sélectionne un texte dans n’importe quel programme, puis appuie sur ${key}.`,
  enterKey: "Ctrl+Entrée",
  welcomeFind:
    "Triglosa fonctionne en arrière-plan. Tu trouveras son symbole, un livre, en bas à droite près de l’horloge, en cliquant sur la petite flèche (^). Pour qu’il reste toujours visible, maintiens-le enfoncé avec la souris et fais-le glisser vers le bas, à droite de la flèche. Un clic sur le symbole ouvre la fenêtre, un clic droit ouvre le menu.",
  welcomeModel: "Triglosa traduit avec un modèle d’IA, qui explique aussi les termes, les verbes et chaque mot sur lequel tu cliques, selon ton niveau. Connectes-en un dans les réglages, sous « Modèle d’IA ».",
};

export const phone = {
  translateClipboard: "Traduire le presse-papiers",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
  lockedBy: "Pour l’instant, la traduction vient d’Apple (sur ton iPhone).",
  pasteSetting: "Coller sans confirmation",
  pasteHint: "Si iOS demande à chaque collage, règle « Coller depuis d’autres apps » sur « Autoriser » pour Triglosa dans les réglages de l’iPhone.",
  pasteLater: "Plus tard",
  cardSheetClose: "Fermer",
  pasteOpen: "Ouvrir les réglages de l’iPhone",
  modelConsentSetting: "Envoyer les textes au modèle d’IA",
  modelConsentHint: (host) => `Tes textes vont à ${host}. Sans cela, Apple traduit sur cet iPhone et aucun texte n’en sort.`,
  modelConsent: {
    title: "Envoyer les textes au modèle d’IA ?",
    body: (host) => `Pour traduire et expliquer, Triglosa envoie tes textes au modèle d’IA que tu as configuré, à ${host}. Les conditions et la politique de confidentialité de son fournisseur s’appliquent. Sans ton autorisation, Apple traduit sur cet iPhone et aucun texte n’en sort.`,
    allow: "Autoriser",
    deny: "Ne pas autoriser",
  },
  /* The first steps, as a sheet over the reading at the first start. */
  welcomePhone: {
    setup: "Configuration",
    start: "Lancer une traduction",
    done: "C’est parti",
    exampleHint: "Un exemple : une phrase, ses deux traductions et les mots qui valent la peine d’être appris, marqués.",
    paste: (button) => ["Copie un texte dans n’importe quelle app, puis touche ", button, " dans la barre en bas : Triglosa traduit ce que tu as copié."],
    share: "Ou sélectionne du texte dans n’importe quelle app, touche « Partager » et choisis Triglosa.",
    plus: (button) => ["Ou touche ", button, " pour saisir ou coller un nouveau texte, ou le photographier."],
    languages: "Choisis dans les réglages, sous « Langues », ta propre langue et celles que tu apprends.",
    model: "Un modèle d’IA traduit plus précisément et explique les termes, les verbes et chaque mot que tu touches, selon ton niveau. Connectes-en un dans les réglages, sous « Modèle d’IA ». Sans modèle, Apple traduit sur cet iPhone.",
    card: (button) => ["Touche un mot pour le chercher. ", button, " crée une fiche, que tu peux envoyer directement à Anki."],
  },
  /* The phone runs no model of its own: one way is prepared there. */
  ankiEnabledHint: (_code) => "Nécessite l’app AnkiMobile.",
  ankiMissing: "Triglosa demande à Anki tes paquets et tes types de note. Anki s’ouvre un instant pour cela.",
  ankiLaunch: "Charger depuis Anki",
  ankiStarting: "Ouverture d’Anki…",
  ankiSending: "Ouverture d’Anki…",
  ankiRecheck: "Actualiser les paquets",
  ankiRecheckHint: "Récupère à nouveau tes paquets et types de note depuis Anki.",
  ankiAbsent: "AnkiMobile n’est pas installé. Installe-le depuis l’App Store.",
  ankiLeft: "Anki n’a envoyé aucune liste. Réessaie et autorise le collage si iOS le demande.",
  ankiDeckHint: "Tout paquet qu’Anki a indiqué.",
  ankiNoteTypeLook: "Tu peux voir dans Anki quel type de note un paquet utilise : quand tu y ajoutes une carte à ce paquet, le type de note est affiché en haut.",
  cardClosing: "",
};

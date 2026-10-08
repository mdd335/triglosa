import { why } from "./detail.js";

/* The French interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   French. The spaces before « : ; ? ! » and inside the guillemets are
   no-break spaces, as French typography has them. */
export default {
  placeholder: "Colle ou tape un texte",
  translate: "Traduire",
  translateKeys: "Traduire (⌘↩)",
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
  search: "Rechercher (externe)",
  speak: "Prononcer",
  opened: "Ouvert",
  conjugation: "Conjugaison (externe)",
  card: "Fiche",
  cardCreate: "Créer une fiche",
  cardLanguage: "Langue de la fiche",
  sourceLanguage: "Changer la langue",
  otherLanguage: "Autre langue…",
  findLanguage: "Saisis une langue",
  unknownLanguage: "Langue inconnue",
  added: "Ajoutée",
  synonymBack: "Mot précédent",
  synonymForward: "Mot suivant",
  cardTerm: "Langue étrangère",
  cardMeaning: "Langue maternelle",
  cardNote: "Explication",
  cardCopyAll: "Copier les trois",
  cardCopyField: "Copier le champ",
  cardToAnki: "Directement dans Anki",
  cardAnkiStart: "Lancer Anki",
  cardAnkiStarting: "Lancement d’Anki…",
  cardAnkiSetup: "Choisir un paquet",
  cardNoteUnmapped: "Aucun champ attribué — ces lignes n’iront pas dans Anki.",
  ankiSaved: "La fiche est dans le paquet.",
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
  groupReading: "Texte d’autres programmes",
  groupCards: "Fiches",
  groupAbout: "À propos de Triglosa",
  aboutVersion: (version) => `Version ${version}`,
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa se trouve sur ", link("project", "GitHub"), ", l’aide dans son ", link("help", "README"), ". Si tu rencontres un problème ou souhaites une fonction, n’hésite pas à ouvrir une ", link("issues", "issue"), "."],
  updatesCheck: "Rechercher des mises à jour",
  updatesChecking: "Recherche…",
  updatesHint: "Demande à GitHub la version la plus récente seulement lorsque tu cliques ici. La mise à jour n’est téléchargée que lorsque tu cliques sur « Installer maintenant ».",
  updatesNone: "Tu as la version la plus récente.",
  updatesFound: (version) => `La version ${version} est disponible.`,
  updatesDownload: "Aller au téléchargement",
  updatesInstall: "Installer maintenant",
  updatesLoading: (percent) => `Téléchargement… ${percent} %`,
  updatesInstalling: "Installation… Triglosa va redémarrer.",
  updatesInstallNone: "Cette version ne peut pas être installée d’ici. Utilise « Aller au téléchargement ».",
  updatesInstallUnreachable: "La mise à jour n’a pas pu être téléchargée. Réessaie plus tard.",
  updatesInstallFailed: (detail) => `La mise à jour n’a pas été installée${detail ? ` (${detail})` : ""}. Utilise « Aller au téléchargement ».`,
  diagnosticsCopy: "Copier le diagnostic",
  diagnosticsHint: "Pour signaler un problème : version, système, langues, modèle d’IA et dernières erreurs. Jamais tes textes ni ta clé API. Rien n’est envoyé ; tu le colles toi-même.",
  updatesFailed: (status) => `Pas de réponse de GitHub${status ? ` (${status})` : ""}. Réessaie plus tard.`,

  optionOn: "oui",
  optionOff: "non",
  cardsEnabled: "Proposer des fiches",
  cardModes: {
    never: "jamais",
    second: "seulement pour la deuxième langue",
    third: "seulement pour la troisième langue",
    foreign: "pour toutes les langues étrangères prises en charge",
  },
  cardsImprove: "Améliorer automatiquement les fiches avec l’IA",
  ankiEnabled: "Exporter directement vers Anki",
  ankiEnabledHint: (code) => `Nécessite Anki avec le module AnkiConnect (code ${code}).`,
  ankiSearching: "Recherche…",
  ankiMissing:
    "Anki ne répond pas. Lance Anki et vérifie qu’AnkiConnect est installé.",
  ankiRecheck: "Chercher à nouveau",
  ankiLaunch: "Lancer Anki",
  ankiStarting: "Lancement d’Anki…",
  ankiDeck: "Paquet",
  ankiDeckHint:
    "Tout paquet qu’Anki indique. Un nom qui n’existe pas encore est créé au premier enregistrement.",
  ankiNewDeck: "Nouveau paquet…",
  ankiDeckList: "Dans la liste",
  ankiNoteType: "Type de note",
  ankiNoteTypeHint: "Le type de note décide des champs qu’a une fiche.",
  ankiNoteTypeUsed: (count) => `dans ce paquet (${count})`,
  ankiNoteTypeFound: (name) =>
    `Les fiches du paquet choisi utilisent le type de note « ${name} ».`,
  ankiNoteTypeLook:
    "Le paquet choisi n’a pas encore de fiches d’où lire le type de note. Choisis-le toi-même.",
  ankiFields: "Champs",
  ankiFieldsHint: "Quel champ du type de note reçoit laquelle des trois lignes.",
  ankiNoField: "— ne pas écrire",
  ankiFirstField: (name) =>
    `Le premier champ du type de note (« ${name} ») reçoit aussi le mot étranger. Anki n’accepte pas de note dont le premier champ est vide.`,

  firstLanguage: "Langue maternelle",
  secondLanguage: "Deuxième langue",
  thirdLanguage: "Troisième langue (facultatif)",
  noThird: "aucune",
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
    foreign: "pour toutes les langues étrangères prises en charge",
    all: "pour toutes les langues prises en charge",
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
  underline: "Soulignement en couleur dans le texte",
  searchEngine: "Moteur de recherche",
  searchHint: "Pour « Rechercher (externe) » sur les termes, les verbes et les mots marqués. S’ouvre dans le navigateur par défaut.",
  searchSystem: "celui réglé dans Safari",
  glance: "Traduction au survol",
  glanceHint: "Affiche au-dessus des mots en langue étrangère ce qui leur correspond dans ta langue.",
  modelIntro:
    "Sans modèle d’IA, seule la traduction d’Apple sur l’appareil est disponible, si le pack de langue est téléchargé. Connecte un modèle d’IA pour des traductions plus précises, les termes, les verbes, les explications et d’autres fonctions.",
  modelHelpAsk: "Jamais configuré de modèle d’IA ?",
  modelHelpLink: "Lire le guide",
  endpoint: "Adresse du modèle d’IA",
  endpointHint:
    "Toute adresse dotée d’une interface compatible OpenAI — dans le cloud ou en local.",
  model: "Modèle",
  modelHint: "Si le champ reste vide, l’app prend le premier modèle proposé à cette adresse.",
  apiKey: "Clé d’API",
  apiKeyEmpty: "aucune enregistrée",
  apiKeyHint:
    "Va dans le trousseau du système, jamais dans le fichier de réglages. Un modèle local n’en a généralement pas besoin.",
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
    verbs: { translated: "traduit", explained: "expliqué", assigned: "associé", detected: "Langue détectée", words: "mots associés" },
    and: "et",
    by: ({ kind, name }) => ({ device: ["par", "Apple (sur l’appareil)"], triglosa: ["par", "Triglosa"] })[kind] || ["par", name || "le modèle d’IA"],
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
    "Le téléchargement se fait en arrière-plan et peut prendre quelques minutes. Si la fenêtre de macOS a été fermée, redemande simplement.",
  pairsPrompt: "Télécharger des langues pour la traduction d’Apple",
  pairsFetched: "Demandé",
  pairsBySettings:
    "Ajoute-les dans « Langue et région », sous « Langues pour la traduction ».",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Adapter la hauteur de la fenêtre à son contenu",
  kept: "Garder les traductions précédentes",
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
  forceClick: "Chercher un mot par clic forcé",
  forceClickLead:
    "Un clic forcé sur le trackpad cherche le mot sous le pointeur.",
  forceClickHint:
    "Pour que la recherche d’Apple ne s’ouvre pas en plus, désactive « Recherche et détection de données » dans Réglages Système, Trackpad.",
  pointerUnreliable: "Les fonctions ci-dessous ne marchent pas de manière fiable dans tous les programmes.",
  withSentence: "Envoyer la phrase",
  withSentenceLead:
    "Quand tu cherches trois mots ou moins, leur phrase part avec eux vers le modèle d’IA (30 mots au plus). Cela améliore la détection de la langue et les traductions.",
  nextSentence: "Proposer la phrase suivante",
  nextSentenceLead:
    "Affiche sous l’original la phrase qui suit dans le texte d’origine. Un clic la traduit.",

  permission: "Autorisation macOS",
  directSelection: "Lire le texte sélectionné et insérer les traductions directement",
  directSelectionLead:
    "Les raccourcis reprennent le texte sélectionné sans que tu le copies d’abord, et les traductions peuvent être insérées directement dans d’autres programmes.",
  permissionHave: "L’autorisation est accordée dans macOS.",
  permissionTrust:
    "Facultatif : avec l’autorisation macOS « Contrôle de l’appareil et accès aux données » (dans Confidentialité et sécurité, « Accessibilité » jusqu’à macOS 26), Triglosa peut lire directement le texte sélectionné, lire le mot ou la phrase sous le pointeur et insérer des traductions directement dans d’autres programmes. Triglosa n’utilise l’autorisation que pour ces fonctions et seulement si tu les actives. Triglosa est open source, tu peux donc le vérifier :",
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

  trayCapture: "Traduire le texte sélectionné",
  trayCaptureCopied: "Traduire le texte copié",
  trayCard: "Créer une fiche à partir du texte sélectionné",
  trayCardCopied: "Créer une fiche à partir du texte copié",
  trayCardBlank: "Nouvelle fiche",
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
};

export const windows = {
  noDevice: "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  onlyKnownLanguages: "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  pairMissing: () => "Aucun modèle d’IA configuré. Configures-en un dans les réglages.",
  modelIntro:
    "Triglosa traduit et explique avec un modèle d’IA. Connectes-en un pour les traductions, les termes, les verbes, les explications et d’autres fonctions.",
  lockedHow:
    "Connecte un modèle d’IA dans les réglages pour les traductions, les termes, les verbes, les explications et d’autres fonctions.",
  apiKeyHint:
    "Va dans le Gestionnaire d’identification de Windows, jamais dans le fichier de réglages. Un modèle local n’en a généralement pas besoin.",
  hotkeyLead:
    "Traduit le texte sélectionné dans n’importe quel programme. Ouvre la dernière traduction si aucun texte n’est sélectionné.",
  cardHotkeyLead:
    "Crée une fiche à partir du texte sélectionné. Ouvre une fenêtre de fiche vide si aucun texte n’est sélectionné.",
  hotkeyTakenSystem: "Ce raccourci est pris par Windows. Choisis-en un autre.",
  appIcons: { menubar: "seulement dans la zone de notification", both: "aussi dans la barre des tâches" },
  copyFirst: (key) => `Astuce : sélectionne un texte dans n’importe quel programme, puis appuie sur ${key}.`,
  translateKeys: "Traduire (Ctrl+Entrée)",
  enterKey: "Ctrl+Entrée",
};

import { why } from "./detail.js";

/* The Spanish interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   Spanish. */
export default {
  placeholder: "Pega o escribe un texto",
  translate: "Traducir",
  translateKeys: "Traducir (⌘↩)",
  enterKey: "⌘↩",
  edit: "Editar",
  settings: "Ajustes",
  original: "Original",
  terms: "Términos",
  term: "Término",
  verbs: "Verbos",
  marked: "Selección",
  inSentence: "aquí",
  previousSentence: "Frase anterior",
  nextSentenceLine: "Frase siguiente",
  synonyms: "relacionadas",
  wordClasses: {
    noun: "sustantivo",
    "proper noun": "nombre propio",
    adjective: "adjetivo",
    adverb: "adverbio",
    pronoun: "pronombre",
    preposition: "preposición",
    conjunction: "conjunción",
    article: "artículo",
    numeral: "numeral",
    interjection: "interjección",
    singular: "singular",
    plural: "plural",
    masculine: "masculino",
    feminine: "femenino",
    neuter: "neutro",
  },
  copy: "Copiar",
  insert: "Insertar",
  copied: "Copiado",
  search: "Buscar (externo)",
  speak: "Pronunciar",
  opened: "Abierto",
  conjugation: "Conjugación (externo)",
  card: "Tarjeta",
  cardCreate: "Crear tarjeta",
  cardLanguage: "Idioma de la tarjeta",
  sourceLanguage: "Cambiar el idioma",
  otherLanguage: "Otro idioma…",
  findLanguage: "Escribe un idioma",
  unknownLanguage: "Idioma desconocido",
  added: "Añadida",
  synonymBack: "Palabra anterior",
  synonymForward: "Palabra siguiente",
  cardTerm: "Idioma extranjero",
  cardMeaning: "Lengua materna",
  cardNote: "Explicación",
  cardCopyAll: "Copiar las tres",
  cardCopyField: "Copiar campo",
  cardToAnki: "Directo a Anki",
  cardAnkiStart: "Abrir Anki",
  cardAnkiStarting: "Abriendo Anki…",
  cardAnkiSetup: "Elegir mazo",
  cardNoteUnmapped: "Ningún campo asignado: estas líneas no irán a Anki.",
  ankiSaved: "La tarjeta está en el mazo.",
  cardClosing: "La ventana se cierra.",
  ankiDuplicate: "Esta tarjeta ya está en el mazo; Anki lo compara por el primer campo del tipo de nota.",
  ankiSending: "Añadiendo…",
  ankiFailed: ({ kind, detail } = {}) => {
    const said = detail ? ` (${detail})` : "";
    if (kind === "unreachable") {
      return "Anki no responde. Abre Anki y comprueba que AnkiConnect esté instalado.";
    }
    if (kind === "unconfigured") {
      return "No has elegido ningún mazo. Elige uno en los ajustes, en “Tarjetas”.";
    }
    if (kind === "empty") {
      return "El primer campo de la nota quedaría vacío" + said
        + ". Asígnalo en los ajustes a una de las tres líneas.";
    }
    if (kind === "no-deck") {
      return "Anki no conoce este mazo" + said + ". Vuelve a elegirlo en los ajustes.";
    }
    if (kind === "no-note-type") {
      return "Anki no conoce este tipo de nota" + said + ". Vuelve a elegirlo en los ajustes.";
    }
    return "Anki no ha añadido la tarjeta" + said + ". Inténtalo de nuevo.";
  },
  detecting: "Reconociendo el idioma…",
  nothingOn: (word) => `No se ha recibido ninguna explicación de “${word}”.`,
  searching: "buscando…",
  cardImprove: "Mejorar con IA",
  cardDetecting: "Detectando el idioma…",
  cardImproving: "Mejorando la tarjeta…",
  cardUndo: "Deshacer la mejora con IA",
  cardImproveNothing: "No se ha recibido ninguna mejora útil. La tarjeta se queda como estaba.",
  linking: "enlazando…",
  noTerms: "no se han encontrado términos difíciles",
  noTerm: "no se ha encontrado ningún término difícil",
  noVerbs: "no se han encontrado verbos difíciles",
  lockedHow:
    "Conecta un modelo de IA en los ajustes para obtener traducciones más precisas, términos, verbos, explicaciones y otras funciones.",
  noAnswer: "No se ha recibido respuesta.",
  faults: {
    unreachable:
      "No hay conexión con el modelo de IA. Comprueba la conexión a internet y los ajustes.",
    insecure:
      "La dirección del modelo de IA no está cifrada (http). Usa https o una dirección de tu propia red en los ajustes.",
    timeout: "El modelo de IA ha tardado demasiado. Inténtalo de nuevo.",
    key: (f) =>
      `La clave de API ha sido rechazada${why(f)}. Revísala en los ajustes.`,
    notFound: (f) =>
      `No se ha encontrado la dirección o el modelo${why(f)}. Revisa ambos en los ajustes `
      + "– a menudo falta “/v1” al final de la dirección.",
    refused: (f) =>
      `El modelo de IA ha rechazado la petición${why(f)}. Revisa el nombre del modelo en los ajustes.`,
    busy: (f) =>
      `El modelo de IA está saturado en este momento${why(f)}. Inténtalo de nuevo más tarde.`,
    server: (f) =>
      `Fallo en el proveedor del modelo de IA${why(f)}. Inténtalo de nuevo en un momento.`,
    status: (f) =>
      `Respuesta inesperada del modelo de IA${why(f)}. Revisa los ajustes.`,
    empty: "El modelo de IA ha enviado una respuesta vacía. Inténtalo de nuevo.",
    thinking: (f) =>
      `${f.model || "Este modelo de IA"} piensa antes de cada respuesta y por eso es demasiado lento. `
      + "Elige otro modelo en los ajustes.",
    noModel:
      "No hay ningún modelo cargado en el servidor local. Carga uno o escribe el nombre de un modelo en los ajustes.",
    unknown: (f) => f.detail || "Algo ha salido mal. Inténtalo de nuevo.",
  },
  noDevice:
    "La traducción de Apple no responde. Configura un modelo de IA en los ajustes.",
  onlyKnownLanguages:
    "La traducción de Apple no conoce este idioma. Configura un modelo de IA en los ajustes.",
  pairMissing: (from, to) =>
    `Falta el paquete de idioma ${from} → ${to}. Configura un modelo de IA en los ajustes o descarga allí el paquete de idioma, en “Traducciones”.`,

  groupLanguages: "Idiomas",
  groupSections: "Términos y verbos",
  groupModel: "Modelo de IA",
  groupTranslation: "Traducciones",
  groupWindow: "Ventana",
  groupShortcuts: "Atajos de teclado",
  groupReading: "Texto de otros programas",
  groupCards: "Tarjetas",
  groupAbout: "Acerca de Triglosa",
  aboutVersion: (version) => `Versión ${version}`,
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["Triglosa está en ", link("project", "GitHub"), "; la ayuda, en su ", link("help", "README"), ". Si encuentras un problema o echas en falta una función, abre un ", link("issues", "issue"), "."],
  updatesCheck: "Buscar actualizaciones",
  updatesChecking: "Buscando…",
  updatesHint: "Pregunta a GitHub por la versión más reciente solo cuando haces clic aquí. La actualización se descarga solo cuando haces clic en «Instalar ahora».",
  updatesNone: "Tienes la versión más reciente.",
  updatesFound: (version) => `La versión ${version} está disponible.`,
  updatesDownload: "Ir a la descarga",
  updatesInstall: "Instalar ahora",
  updatesLoading: (percent) => `Descargando… ${percent} %`,
  updatesInstalling: "Instalando… Triglosa se reiniciará.",
  updatesInstallNone: "Esta versión no se puede instalar desde aquí. Usa «Ir a la descarga».",
  updatesInstallUnreachable: "No se ha podido descargar la actualización. Inténtalo de nuevo más tarde.",
  updatesInstallFailed: (detail) => `La actualización no se ha instalado${detail ? ` (${detail})` : ""}. Usa «Ir a la descarga».`,
  diagnosticsCopy: "Copiar diagnóstico",
  diagnosticsHint: "Para informar de un problema: versión, sistema, idiomas, modelo de IA y últimos errores. Nunca tus textos ni tu clave de API. No se envía nada; lo pegas tú.",
  updatesFailed: (status) => `GitHub no ha respondido${status ? ` (${status})` : ""}. Inténtalo de nuevo más tarde.`,

  optionOn: "sí",
  optionOff: "no",
  cardsEnabled: "Ofrecer tarjetas",
  cardModes: {
    never: "nunca",
    second: "solo para el segundo idioma",
    third: "solo para el tercer idioma",
    foreign: "para todos los idiomas extranjeros admitidos",
  },
  cardsImprove: "Mejorar las tarjetas automáticamente con IA",
  ankiEnabled: "Exportar directamente a Anki",
  ankiEnabledHint: (code) => `Necesita Anki con el complemento AnkiConnect (código ${code}).`,
  ankiSearching: "Buscando…",
  ankiMissing:
    "Anki no responde. Abre Anki y comprueba que AnkiConnect esté instalado.",
  ankiRecheck: "Buscar de nuevo",
  ankiLaunch: "Abrir Anki",
  ankiStarting: "Abriendo Anki…",
  ankiDeck: "Mazo",
  ankiDeckHint:
    "Cualquier mazo que indique Anki. Un nombre que aún no exista se crea al guardar la primera tarjeta.",
  ankiNewDeck: "Mazo nuevo…",
  ankiDeckList: "De la lista",
  ankiNoteType: "Tipo de nota",
  ankiNoteTypeHint: "El tipo de nota decide qué campos tiene una tarjeta.",
  ankiNoteTypeUsed: (count) => `en este mazo (${count})`,
  ankiNoteTypeFound: (name) =>
    `Las tarjetas del mazo elegido usan el tipo de nota “${name}”.`,
  ankiNoteTypeLook:
    "El mazo elegido aún no tiene tarjetas de las que leer el tipo de nota. Elígelo tú.",
  ankiFields: "Campos",
  ankiFieldsHint: "Qué campo del tipo de nota recibe cada una de las tres líneas.",
  ankiNoField: "— no escribir",
  ankiFirstField: (name) =>
    `El primer campo del tipo de nota (“${name}”) recibe además la palabra extranjera. Anki no acepta notas con el primer campo vacío.`,

  firstLanguage: "Lengua materna",
  secondLanguage: "Segundo idioma",
  thirdLanguage: "Tercer idioma (opcional)",
  noThird: "ninguno",
  levelNames: {
    A1: "Inicial",
    A2: "Básico",
    B1: "Intermedio",
    B2: "Intermedio alto",
    C1: "Avanzado",
    C2: "Casi nativo",
  },
  showModes: {
    never: "nunca",
    second: "solo para el segundo idioma",
    third: "solo para el tercer idioma",
    foreign: "para todos los idiomas extranjeros admitidos",
    all: "para todos los idiomas admitidos",
  },
  termModes: {
    never: "nunca",
    second: "solo para el segundo idioma",
    third: "solo para el tercer idioma",
    foreign: "para todos los idiomas extranjeros",
    all: "para todos los idiomas",
  },
  showVerbsHint: "Forma base, persona y tiempo de hasta tres formas verbales avanzadas del texto.",
  showTermsHint: "Explicaciones de hasta tres palabras o expresiones avanzadas del texto.",
  underline: "Subrayado de colores en el texto",
  searchEngine: "Buscador",
  searchHint: "Para “Buscar (externo)” en términos, verbos y palabras marcadas. Se abre en el navegador predeterminado.",
  searchSystem: "el configurado en Safari",
  glance: "Traducción al pasar el puntero",
  glanceHint: "Muestra sobre las palabras en otros idiomas a qué corresponden en tu idioma.",
  modelIntro:
    "Sin un modelo de IA solo está disponible la traducción de Apple en el dispositivo, si el paquete de idioma está descargado. Conecta un modelo de IA para obtener traducciones más precisas, términos, verbos, explicaciones y otras funciones.",
  modelHelpAsk: "¿Nunca has configurado un modelo de IA?",
  modelHelpLink: "Ver la guía",
  endpoint: "Dirección del modelo de IA",
  endpointHint:
    "Cualquier dirección con una interfaz compatible con OpenAI, en la nube o local.",
  model: "Modelo",
  modelHint: "Si lo dejas vacío, la app usa el primer modelo que ofrezca la dirección.",
  apiKey: "Clave de API",
  apiKeyEmpty: "ninguna guardada",
  apiKeyHint:
    "Se guarda en el llavero del sistema, nunca en el archivo de ajustes. Un modelo local no suele necesitarla.",
  forgetKey: "Olvidar",
  keySaveFailed: (detail) =>
    `La clave de API no se ha guardado${detail ? ` (${detail})` : ""}. Inténtalo de nuevo.`,
  testConnection: "Probar conexión",
  testing: "Probando…",
  testOk: (name) => `Responde, con “${name}”.`,

  translator: "Traducción con",
  translatorModes: { model: "Modelo de IA", device: "Apple (en el dispositivo)" },
  deviceIntro:
    "La traducción de Apple forma parte de macOS: muy rápida y sin conexión, pero a menudo imprecisa. Con el paquete de idioma descargado, entra automáticamente cuando el modelo de IA no responde.",
  translatorHint: "Si uno de los dos no puede traducir, el otro entra automáticamente.",
  translatorNoModel: "Aún no hay ningún modelo de IA configurado. Hasta entonces traduce Apple, donde estén descargados sus paquetes de idioma.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "traducido", explained: "explicado", assigned: "asignado", detected: "Idioma detectado", words: "palabras asignadas" },
    and: "y",
    by: ({ kind, name }) => ({ device: ["por", "Apple (en el dispositivo)"], triglosa: ["por", "Triglosa"] })[kind] || ["por", name || "el modelo de IA"],
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Idioma elegido por ti",
  },
  foldPanel: "Plegar",
  unfoldPanel: "Desplegar",
  more: "Explicar con más detalle",
  moreWorking: "Explicando con más detalle…",
  addExample: "Añadir una frase de ejemplo",
  exampleWorking: "Escribiendo una frase de ejemplo…",
  devicePairs: "La traducción de Apple en el dispositivo",
  pairsChecking: "Comprobando…",
  pairsAllInstalled: "Todos los paquetes de idioma para tus idiomas están descargados.",
  pairsNoDevice:
    "La traducción de Apple no responde en este momento.",
  pairsRecheck: "Comprobar de nuevo",
  pairsDownloadable: (pairs) => `Aún sin descargar: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `No es posible con la traducción de Apple: ${pairs}. No se puede descargar.`,
  pairsFetch: "Descargar los idiomas…",
  pairsFetchAgain: "Volver a pedir…",
  pairsOnTheirWay:
    "La descarga se hace en segundo plano y puede tardar unos minutos. Si se cerró la ventana de macOS, vuelve a pedirla.",
  pairsPrompt: "Descargar idiomas para la traducción de Apple",
  pairsFetched: "Solicitado",
  pairsBySettings:
    "Añádelos en “Idioma y región”, en “Idiomas de traducción”.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Ajustar la altura de la ventana a su contenido",
  kept: "Recordar traducciones anteriores",
  keptLast: (n) => `las últimas ${n}`,
  appIcon: "Icono mientras Triglosa está abierta",
  appIcons: { menubar: "en la barra de menús", dock: "en el Dock", both: "en la barra de menús y en el Dock" },
  shortcutsLead:
    "Si al pulsar un atajo no pasa nada aquí en la ventana, ya está ocupado. Elige otro.",
  hotkey: "Iniciar traducción",
  hotkeyEmpty: "ningún atajo",
  hotkeyRecording: "Pulsa una combinación…",
  hotkeyClear: "Borrar",
  hotkeyLead:
    "Traduce texto de cualquier programa: cópialo (⌘C) y pulsa el atajo. Abre la última traducción si no se ha copiado nada nuevo.",
  hotkeyLeadSelected:
    "Traduce el texto seleccionado en cualquier programa. Abre la última traducción si no hay texto seleccionado.",
  freshHotkey: "Nueva traducción",
  cardHotkey: "Crear tarjeta",
  cardHotkeyLead:
    "Crea una tarjeta con el texto copiado (⌘C). Abre una ventana de tarjeta vacía si no se ha copiado nada nuevo.",
  cardHotkeyLeadSelected:
    "Crea una tarjeta con el texto seleccionado. Abre una ventana de tarjeta vacía si no hay texto seleccionado.",
  hotkeyTakenHere: (name) => `Este atajo ya está asignado a “${name}”. Elige otro.`,
  hotkeyFailed: (reason) =>
    "Probablemente el atajo ya está ocupado"
    + (reason ? ` (${reason})` : "") + ". Elige otro.",
  hotkeyTakenSystem:
    "Este atajo lo usa macOS. Elige otro.",
  hotkeyTakenEverywhere:
    "Todos los programas usan este atajo. Elige otro.",

  wordHotkey: "Palabra bajo el puntero",
  wordHotkeyLead: "Busca la palabra sobre la que está el puntero.",
  sentenceHotkey: "Frase bajo el puntero",
  sentenceHotkeyLead: "Traduce la frase entera sobre la que está el puntero.",
  forceClick: "Buscar una palabra con clic fuerte",
  forceClickLead:
    "Un clic fuerte en el trackpad busca la palabra bajo el puntero.",
  forceClickHint:
    "Para que no se abra también la función Consultar de Apple, desactiva “Detectores de datos y Consultar” en Ajustes del Sistema, Trackpad.",
  pointerUnreliable: "Las funciones siguientes no van de forma fiable en todos los programas.",
  withSentence: "Enviar la frase",
  withSentenceLead:
    "Cuando buscas hasta tres palabras, su frase va con ellas al modelo de IA (30 palabras como máximo). Eso mejora la detección del idioma y las traducciones.",
  nextSentence: "Ofrecer la frase siguiente",
  nextSentenceLead:
    "Muestra bajo el original la frase que sigue en el texto de origen. Un clic la traduce.",

  permission: "Permiso de macOS",
  directSelection: "Leer el texto seleccionado e insertar traducciones directamente",
  directSelectionLead:
    "Los atajos toman el texto seleccionado sin que lo copies antes, y las traducciones se pueden insertar directamente en otros programas.",
  permissionHave: "El permiso está concedido en macOS.",
  permissionTrust:
    "Opcional: con el permiso de macOS “Control de dispositivos y acceso a datos” (en Privacidad y seguridad, “Accesibilidad” hasta macOS 26), Triglosa puede leer directamente el texto seleccionado, leer la palabra o la frase bajo el puntero e insertar traducciones directamente en otros programas. Triglosa solo usa el permiso para estas funciones y solo si las activas. Triglosa es de código abierto, así que puedes comprobarlo:",
  permissionCode: "ver el código",
  permissionAsk: "Permitir…",
  permissionOpen: "Abrir Ajustes del Sistema",
  permissionPending:
    "macOS ha añadido Triglosa a la lista. Activa Triglosa en la lista; esta ventana lo notará sola.",
  copyFirst: (key) => `Consejo: copia un texto en cualquier programa (⌘C) y pulsa ${key}.`,
  captureFailed: "No se ha podido leer la selección. Copia el texto y pégalo aquí.",

  inserted: "Insertado",
  insertNoWay: (reason) =>
    reason === "focus" ? "Ningún programa donde insertar"
    : reason === "accessibility" ? "Falta el permiso"
    : "No insertado",

  trayCapture: "Traducir el texto seleccionado",
  trayCaptureCopied: "Traducir el texto copiado",
  trayCard: "Crear tarjeta con el texto seleccionado",
  trayCardCopied: "Crear tarjeta con el texto copiado",
  trayCardBlank: "Nueva tarjeta",
  trayShow: "Mostrar ventana",
  trayUpdates: "Buscar actualizaciones",
  trayHelp: "Ayuda",
  trayProblem: "Informar de un problema",
  trayRestart: "Reiniciar Triglosa",
  trayQuit: "Salir de Triglosa",
  settingsOpen: "Abrir ajustes",
  historyBack: "Traducción anterior",
  historyForward: "Traducción siguiente",
  newReading: "Nueva traducción",
  closeWindow: "Cerrar ventana",
  pinWindow: "Mantener delante",
  unpinWindow: "Dejar de mantener delante",
};

export const windows = {
  noDevice: "No hay ningún modelo de IA configurado. Configura uno en los ajustes.",
  onlyKnownLanguages: "No hay ningún modelo de IA configurado. Configura uno en los ajustes.",
  pairMissing: () => "No hay ningún modelo de IA configurado. Configura uno en los ajustes.",
  modelIntro:
    "Triglosa traduce y explica con un modelo de IA. Conecta uno para obtener traducciones, términos, verbos, explicaciones y otras funciones.",
  lockedHow:
    "Conecta un modelo de IA en los ajustes para obtener traducciones, términos, verbos, explicaciones y otras funciones.",
  apiKeyHint:
    "Se guarda en el Administrador de credenciales de Windows, nunca en el archivo de ajustes. Un modelo local no suele necesitarla.",
  hotkeyLead:
    "Traduce el texto seleccionado en cualquier programa. Abre la última traducción si no hay texto seleccionado.",
  cardHotkeyLead:
    "Crea una tarjeta con el texto seleccionado. Abre una ventana de tarjeta vacía si no hay texto seleccionado.",
  hotkeyTakenSystem: "Este atajo lo usa Windows. Elige otro.",
  appIcons: { menubar: "solo en el área de notificación", both: "también en la barra de tareas" },
  copyFirst: (key) => `Consejo: selecciona un texto en cualquier programa y pulsa ${key}.`,
  translateKeys: "Traducir (Ctrl+Intro)",
  enterKey: "Ctrl+Intro",
};

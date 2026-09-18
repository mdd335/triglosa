import { why } from "./detail.js";

/* The Spanish interface. What each entry is for is said in en.js; the names
   of the system's own settings are the ones macOS and Windows show in
   Spanish. */
export default {
  placeholder: "Pega o escribe un texto",
  translate: "Traducir",
  translateKeys: "Traducir (⌘↩)",
  edit: "Editar",
  settings: "Ajustes",
  original: "Original",
  terms: "Términos",
  verbs: "Verbos",
  marked: "Selección",
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
  cardImproving: "Mejorando la tarjeta…",
  cardUndo: "Deshacer la mejora con IA",
  cardImproveNothing: "No se ha recibido ninguna mejora útil. La tarjeta se queda como estaba.",
  linking: "enlazando…",
  noTerms: "no se han encontrado términos difíciles",
  noVerbs: "no se han encontrado verbos difíciles",
  lockedHow:
    "Conecta un modelo de IA en los ajustes para obtener traducciones más precisas, verbos, términos, explicaciones y otras funciones.",
  noAnswer: "No se ha recibido respuesta.",
  faults: {
    unreachable:
      "No hay conexión con el modelo de IA. Comprueba la conexión a internet y los ajustes.",
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
  groupSections: "Verbos y términos",
  groupModel: "Modelo de IA",
  groupTranslation: "Traducciones",
  groupWindow: "Ventana",
  groupShortcuts: "Atajos de teclado",
  groupCards: "Tarjetas",
  groupAbout: "Acerca de Triglosa",
  aboutVersion: (version) => `Versión ${version}`,
  aboutProject: "Triglosa en GitHub",
  updatesCheck: "Buscar actualizaciones",
  updatesChecking: "Buscando…",
  updatesHint: "Pregunta a GitHub por la versión más reciente. Triglosa solo pregunta cuando haces clic aquí y no descarga nada.",
  updatesNone: "Tienes la versión más reciente.",
  updatesFound: (version) => `La versión ${version} está disponible.`,
  updatesDownload: "Ir a la descarga",
  updatesFailed: (status) => `GitHub no ha respondido${status ? ` (${status})` : ""}. Inténtalo de nuevo más tarde.`,

  optionOn: "sí",
  optionOff: "no",
  cardsEnabled: "Opción de crear tarjetas",
  cardModes: {
    never: "nunca",
    second: "solo para el segundo idioma",
    third: "solo para el tercer idioma",
    foreign: "para todos los idiomas extranjeros admitidos",
  },
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
  showVerbsHint: "Forma base, persona y tiempo de las tres formas verbales más difíciles del texto.",
  showTermsHint: "Explicaciones de hasta tres palabras o expresiones avanzadas del texto.",
  underline: "Subrayado de colores en el texto",
  underlineHint: "Subraya los verbos y términos en el original y en las traducciones.",
  searchEngine: "Buscador",
  searchHint: "Para “Buscar (externo)” en verbos, términos y palabras marcadas. Se abre en el navegador predeterminado.",
  searchSystem: "el configurado en Safari",
  glance: "Traducción al pasar el puntero",
  glanceHint: "Muestra sobre una palabra del original a qué corresponde en tu idioma.",
  modelIntro:
    "Sin un modelo de IA solo está disponible la traducción de Apple en el dispositivo, si la configuras abajo. Conecta un modelo de IA para obtener traducciones más precisas, verbos, términos, explicaciones y otras funciones.",
  modelHelpAsk: "¿Nunca has configurado un modelo de IA?",
  modelHelpLink: "Ver la guía",
  endpoint: "Dirección del modelo",
  endpointHint:
    "Cualquier dirección con una interfaz compatible con OpenAI, en la nube o local.",
  model: "Modelo",
  modelHint: "Si lo dejas vacío, la app usa el primer modelo que ofrezca la dirección.",
  apiKey: "Clave",
  apiKeyEmpty: "ninguna guardada",
  apiKeyHint:
    "Se guarda en el llavero del sistema, nunca en el archivo de ajustes. Un modelo local no suele necesitarla.",
  forgetKey: "Olvidar",
  keySaveFailed: (detail) =>
    `La clave no se ha guardado${detail ? ` (${detail})` : ""}. Inténtalo de nuevo.`,
  testConnection: "Probar conexión",
  testing: "Probando…",
  testOk: (name) => `Responde, con “${name}”.`,

  translator: "Traducción con",
  translatorModes: { model: "Modelo de IA", device: "Apple (en el dispositivo)" },
  deviceIntro:
    "Si quieres, puedes configurar la traducción de Apple en el dispositivo para las traducciones. Es muy rápida y funciona sin conexión, pero a menudo es imprecisa.",
  translatorHint: "Si uno de los dos no puede traducir, lo hace el otro, si está configurado.",
  translatorNoModel: "Aún no hay ningún modelo de IA configurado. Hasta entonces traduce Apple, donde estén instalados sus paquetes de idioma.",
  translatedBy: { device: "traducido por Apple", model: "traducido por el modelo de IA" },
  foldPanel: "Plegar",
  unfoldPanel: "Desplegar",
  more: "Explicar con más detalle",
  moreWorking: "Explicando con más detalle…",
  addExample: "Añadir una frase de ejemplo",
  exampleWorking: "Escribiendo una frase de ejemplo…",
  devicePairs: "Usar la traducción de Apple en el dispositivo",
  pairsChecking: "Comprobando…",
  pairsAllInstalled: "Todos los paquetes de idioma para tus idiomas están instalados.",
  pairsNoDevice:
    "La traducción de Apple no responde en este momento.",
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
  appIcon: "Icono mientras Triglosa está abierta",
  appIcons: { menubar: "en la barra de menús", dock: "en el Dock", both: "en la barra de menús y en el Dock" },
  shortcutsLead:
    "Si al pulsar una combinación no pasa nada aquí en la ventana, ya está ocupada. Elige otra.",
  hotkey: "Iniciar traducción",
  hotkeyEmpty: "ninguno",
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
  hotkeyTakenHere: (name) => `Esta combinación ya está asignada a “${name}”. Elige otra.`,
  hotkeyFailed: (reason) =>
    "Probablemente el atajo ya está ocupado"
    + (reason ? ` (${reason})` : "") + ". Elige otra combinación.",
  hotkeyTakenSystem:
    "Esta combinación la usa macOS. Elige otra.",
  hotkeyTakenEverywhere:
    "Todos los programas usan esta combinación. Elige otra.",

  permission: "Usar el texto seleccionado directamente",
  permissionWhy:
    "Si quieres, puedes traducir el texto seleccionado o convertirlo en tarjeta sin copiarlo antes, e insertar traducciones directamente en otros programas.",
  permissionHave: "Activado.",
  permissionTrust:
    "Para ello, Triglosa necesita el permiso de macOS “Control de dispositivos y acceso a datos” en Privacidad y seguridad (“Accesibilidad” hasta macOS 26). Triglosa solo lo usa para leer el texto seleccionado y para insertar, y solo cuando se lo pides. Triglosa es de código abierto, así que puedes comprobarlo:",
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
    "Triglosa traduce y explica con un modelo de IA. Conecta uno para obtener traducciones, verbos, términos, explicaciones y otras funciones.",
  lockedHow:
    "Conecta un modelo de IA en los ajustes para obtener traducciones, verbos, términos, explicaciones y otras funciones.",
  apiKeyHint:
    "Se guarda en el Administrador de credenciales de Windows, nunca en el archivo de ajustes. Un modelo local no suele necesitarla.",
  hotkeyLead:
    "Traduce el texto seleccionado en cualquier programa. Abre la última traducción si no hay texto seleccionado.",
  cardHotkeyLead:
    "Crea una tarjeta con el texto seleccionado. Abre una ventana de tarjeta vacía si no hay texto seleccionado.",
  hotkeyTakenSystem: "Esta combinación la usa Windows. Elige otra.",
  appIcons: { menubar: "solo en el área de notificación", both: "también en la barra de tareas" },
  copyFirst: (key) => `Consejo: selecciona un texto en cualquier programa y pulsa ${key}.`,
  translateKeys: "Traducir (Ctrl+Intro)",
};

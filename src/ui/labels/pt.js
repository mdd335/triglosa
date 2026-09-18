import { why } from "./detail.js";

/* The Portuguese interface. What each entry is for is said in en.js. No
   variant is chosen: the wording keeps to what Brazil and Portugal share,
   "você" with its third-person verbs, and takes the Brazilian form only
   where the two cannot meet — the names of the system's own settings, which
   are the ones macOS and Windows show in Brazilian Portuguese. */
export default {
  placeholder: "Cole ou digite um texto",
  translate: "Traduzir",
  translateKeys: "Traduzir (⌘↩)",
  edit: "Editar",
  settings: "Ajustes",
  original: "Original",
  terms: "Termos",
  verbs: "Verbos",
  marked: "Seleção",
  synonyms: "relacionadas",
  wordClasses: {
    noun: "substantivo",
    "proper noun": "nome próprio",
    adjective: "adjetivo",
    adverb: "advérbio",
    pronoun: "pronome",
    preposition: "preposição",
    conjunction: "conjunção",
    article: "artigo",
    numeral: "numeral",
    interjection: "interjeição",
    singular: "singular",
    plural: "plural",
    masculine: "masculino",
    feminine: "feminino",
    neuter: "neutro",
  },
  copy: "Copiar",
  insert: "Inserir",
  copied: "Copiado",
  search: "Pesquisar (externo)",
  opened: "Aberto",
  conjugation: "Conjugação (externo)",
  card: "Flashcard",
  cardCreate: "Criar flashcard",
  cardLanguage: "Idioma do flashcard",
  sourceLanguage: "Mudar o idioma",
  otherLanguage: "Outro idioma…",
  findLanguage: "Digite um idioma",
  unknownLanguage: "Idioma desconhecido",
  added: "Adicionado",
  synonymBack: "Palavra anterior",
  synonymForward: "Próxima palavra",
  cardTerm: "Língua estrangeira",
  cardMeaning: "Língua materna",
  cardNote: "Explicação",
  cardCopyAll: "Copiar os três",
  cardCopyField: "Copiar campo",
  cardToAnki: "Direto para o Anki",
  cardAnkiStart: "Abrir o Anki",
  cardAnkiStarting: "Abrindo o Anki…",
  cardAnkiSetup: "Escolher baralho",
  cardNoteUnmapped: "Nenhum campo atribuído — estas linhas não vão para o Anki.",
  ankiSaved: "O flashcard está no baralho.",
  ankiDuplicate: "Este flashcard já está no baralho — o Anki compara o primeiro campo do tipo de nota.",
  ankiSending: "Adicionando…",
  ankiFailed: ({ kind, detail } = {}) => {
    const said = detail ? ` (${detail})` : "";
    if (kind === "unreachable") {
      return "O Anki não responde. Abra o Anki e verifique se o AnkiConnect está instalado.";
    }
    if (kind === "unconfigured") {
      return "Nenhum baralho escolhido. Escolha um nos ajustes, em “Flashcards”.";
    }
    if (kind === "empty") {
      return "O primeiro campo da nota ficaria vazio" + said
        + ". Atribua-o nos ajustes a uma das três linhas.";
    }
    if (kind === "no-deck") {
      return "O Anki não conhece este baralho" + said + ". Escolha-o de novo nos ajustes.";
    }
    if (kind === "no-note-type") {
      return "O Anki não conhece este tipo de nota" + said + ". Escolha-o de novo nos ajustes.";
    }
    return "O Anki não adicionou o flashcard" + said + ". Tente de novo.";
  },
  detecting: "Reconhecendo o idioma…",
  nothingOn: (word) => `Nenhuma explicação recebida para “${word}”.`,
  searching: "pesquisando…",
  cardImprove: "Melhorar com IA",
  cardImproving: "Melhorando o flashcard…",
  cardUndo: "Desfazer a melhoria com IA",
  cardImproveNothing: "Nenhuma melhoria utilizável recebida. O flashcard fica como estava.",
  linking: "ligando…",
  noTerms: "nenhum termo difícil encontrado",
  noVerbs: "nenhum verbo difícil encontrado",
  lockedHow:
    "Conecte um modelo de IA nos ajustes para traduções mais precisas, verbos, termos, explicações e outras funções.",
  noAnswer: "Nenhuma resposta recebida.",
  faults: {
    unreachable:
      "Sem conexão com o modelo de IA. Verifique a conexão à internet e os ajustes.",
    timeout: "O modelo de IA demorou demais. Tente de novo.",
    key: (f) =>
      `A chave de API foi recusada${why(f)}. Verifique-a nos ajustes.`,
    notFound: (f) =>
      `Endereço ou modelo não encontrado${why(f)}. Verifique os dois nos ajustes `
      + "– muitas vezes falta “/v1” no fim do endereço.",
    refused: (f) =>
      `O modelo de IA recusou o pedido${why(f)}. Verifique o nome do modelo nos ajustes.`,
    busy: (f) =>
      `O modelo de IA está sobrecarregado neste momento${why(f)}. Tente de novo mais tarde.`,
    server: (f) =>
      `Falha no fornecedor do modelo de IA${why(f)}. Tente de novo daqui a pouco.`,
    status: (f) =>
      `Resposta inesperada do modelo de IA${why(f)}. Verifique os ajustes.`,
    empty: "O modelo de IA enviou uma resposta vazia. Tente de novo.",
    thinking: (f) =>
      `${f.model || "Este modelo de IA"} pensa antes de cada resposta e por isso fica lento demais. `
      + "Escolha outro modelo nos ajustes.",
    noModel:
      "Nenhum modelo está carregado no servidor local. Carregue um ou indique o nome de um modelo nos ajustes.",
    unknown: (f) => f.detail || "Algo deu errado. Tente de novo.",
  },
  noDevice:
    "A tradução da Apple não responde. Configure um modelo de IA nos ajustes.",
  onlyKnownLanguages:
    "A tradução da Apple não conhece este idioma. Configure um modelo de IA nos ajustes.",
  pairMissing: (from, to) =>
    `Falta o pacote de idioma ${from} → ${to}. Configure um modelo de IA nos ajustes ou baixe lá o pacote de idioma, em “Traduções”.`,

  groupLanguages: "Idiomas",
  groupSections: "Verbos e termos",
  groupModel: "Modelo de IA",
  groupTranslation: "Traduções",
  groupWindow: "Janela",
  groupShortcuts: "Atalhos de teclado",
  groupCards: "Flashcards",
  groupAbout: "Sobre o Triglosa",
  aboutVersion: (version) => `Versão ${version}`,
  aboutProject: "Triglosa no GitHub",
  updatesCheck: "Procurar atualizações",
  updatesChecking: "Procurando…",
  updatesHint: "Pergunta ao GitHub pela versão mais recente. O Triglosa só pergunta quando você clica aqui e não baixa nada.",
  updatesNone: "Você tem a versão mais recente.",
  updatesFound: (version) => `A versão ${version} está disponível.`,
  updatesDownload: "Ir para o download",
  updatesFailed: (status) => `Sem resposta do GitHub${status ? ` (${status})` : ""}. Tente de novo mais tarde.`,

  optionOn: "sim",
  optionOff: "não",
  cardsEnabled: "Opção de criar flashcards",
  cardModes: {
    never: "nunca",
    second: "só para o segundo idioma",
    third: "só para o terceiro idioma",
    foreign: "para todos os idiomas estrangeiros compatíveis",
  },
  ankiEnabled: "Exportar direto para o Anki",
  ankiEnabledHint: (code) => `Precisa do Anki com o complemento AnkiConnect (código ${code}).`,
  ankiSearching: "Procurando…",
  ankiMissing:
    "O Anki não responde. Abra o Anki e verifique se o AnkiConnect está instalado.",
  ankiRecheck: "Procurar de novo",
  ankiLaunch: "Abrir o Anki",
  ankiStarting: "Abrindo o Anki…",
  ankiDeck: "Baralho",
  ankiDeckHint:
    "Qualquer baralho que o Anki indicar. Um nome que ainda não exista é criado ao salvar o primeiro flashcard.",
  ankiNewDeck: "Novo baralho…",
  ankiDeckList: "Da lista",
  ankiNoteType: "Tipo de nota",
  ankiNoteTypeHint: "O tipo de nota decide quais campos um flashcard tem.",
  ankiNoteTypeUsed: (count) => `neste baralho (${count})`,
  ankiNoteTypeFound: (name) =>
    `Os flashcards do baralho escolhido usam o tipo de nota “${name}”.`,
  ankiNoteTypeLook:
    "O baralho escolhido ainda não tem flashcards de onde ler o tipo de nota. Escolha-o manualmente.",
  ankiFields: "Campos",
  ankiFieldsHint: "Que campo do tipo de nota recebe qual das três linhas.",
  ankiNoField: "— não escrever",
  ankiFirstField: (name) =>
    `O primeiro campo do tipo de nota (“${name}”) também recebe a palavra estrangeira. O Anki não aceita notas com o primeiro campo vazio.`,

  firstLanguage: "Língua materna",
  secondLanguage: "Segundo idioma",
  thirdLanguage: "Terceiro idioma (opcional)",
  noThird: "nenhum",
  levelNames: {
    A1: "Iniciante",
    A2: "Básico",
    B1: "Intermediário",
    B2: "Intermediário superior",
    C1: "Avançado",
    C2: "Quase nativo",
  },
  showModes: {
    never: "nunca",
    second: "só para o segundo idioma",
    third: "só para o terceiro idioma",
    foreign: "para todos os idiomas estrangeiros compatíveis",
    all: "para todos os idiomas compatíveis",
  },
  termModes: {
    never: "nunca",
    second: "só para o segundo idioma",
    third: "só para o terceiro idioma",
    foreign: "para todos os idiomas estrangeiros",
    all: "para todos os idiomas",
  },
  showVerbsHint: "Forma básica, pessoa e tempo das três formas verbais mais difíceis do texto.",
  showTermsHint: "Explicações de até três palavras ou expressões avançadas do texto.",
  underline: "Sublinhado colorido no texto",
  underlineHint: "Sublinha os verbos e termos no original e nas traduções.",
  searchEngine: "Buscador",
  searchHint: "Para “Pesquisar (externo)” em verbos, termos e palavras marcadas. Abre no navegador padrão.",
  searchSystem: "o definido no Safari",
  glance: "Tradução ao passar o cursor",
  glanceHint: "Mostra sobre uma palavra do original a que ela corresponde no seu idioma.",
  modelIntro:
    "Sem um modelo de IA, só está disponível a tradução da Apple no dispositivo, se configurada abaixo. Conecte um modelo de IA para traduções mais precisas, verbos, termos, explicações e outras funções.",
  modelHelpAsk: "Nunca configurou um modelo de IA?",
  modelHelpLink: "Ler o guia",
  endpoint: "Endereço do modelo",
  endpointHint:
    "Qualquer endereço com uma interface compatível com a OpenAI — na nuvem ou local.",
  model: "Modelo",
  modelHint: "Se o campo ficar vazio, o app usa o primeiro modelo que o endereço oferecer.",
  apiKey: "Chave",
  apiKeyEmpty: "nenhuma guardada",
  apiKeyHint:
    "Vai para o porta-chaves do sistema, nunca para o arquivo de ajustes. Um modelo local normalmente não precisa de uma.",
  forgetKey: "Esquecer",
  keySaveFailed: (detail) =>
    `A chave não foi guardada${detail ? ` (${detail})` : ""}. Tente de novo.`,
  testConnection: "Testar conexão",
  testing: "Testando…",
  testOk: (name) => `Responde, com “${name}”.`,

  translator: "Tradução por",
  translatorModes: { model: "Modelo de IA", device: "Apple (no dispositivo)" },
  deviceIntro:
    "Se quiser, você pode configurar a tradução da Apple no dispositivo para as traduções em si. É muito rápida e funciona offline, mas muitas vezes é imprecisa.",
  translatorHint: "Se um dos dois não puder traduzir, o outro assume, se estiver configurado.",
  translatorNoModel: "Ainda não há nenhum modelo de IA configurado. Até lá, a Apple traduz onde os pacotes de idioma estiverem instalados.",
  translatedBy: { device: "traduzido pela Apple", model: "traduzido pelo modelo de IA" },
  foldPanel: "Recolher",
  unfoldPanel: "Expandir",
  more: "Explicar em mais detalhe",
  moreWorking: "Explicando em mais detalhe…",
  addExample: "Adicionar uma frase de exemplo",
  exampleWorking: "Escrevendo uma frase de exemplo…",
  devicePairs: "Usar a tradução da Apple no dispositivo",
  pairsChecking: "Verificando…",
  pairsAllInstalled: "Todos os pacotes de idioma para os seus idiomas estão instalados.",
  pairsNoDevice:
    "A tradução da Apple não está respondendo agora.",
  pairsDownloadable: (pairs) => `Ainda não baixados: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Não é possível com a tradução da Apple: ${pairs}. Isso não pode ser baixado.`,
  pairsFetch: "Baixar os idiomas…",
  pairsFetchAgain: "Pedir de novo…",
  pairsOnTheirWay:
    "O download é feito em segundo plano e pode levar alguns minutos. Se a janela do macOS foi fechada, basta pedir de novo.",
  pairsPrompt: "Baixar idiomas para a tradução da Apple",
  pairsFetched: "Pedido",
  pairsBySettings:
    "Adicione-os em “Idioma e Região”, em “Idiomas de Tradução”.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Ajustar a altura da janela ao conteúdo",
  appIcon: "Ícone enquanto o Triglosa está aberto",
  appIcons: { menubar: "na barra de menus", dock: "no Dock", both: "na barra de menus e no Dock" },
  shortcutsLead:
    "Se nada acontecer aqui na janela ao pressionar uma combinação, ela já está ocupada. Escolha outra.",
  hotkey: "Iniciar tradução",
  hotkeyEmpty: "nenhum",
  hotkeyRecording: "Pressione uma combinação…",
  hotkeyClear: "Apagar",
  hotkeyLead:
    "Traduz texto de qualquer programa: copie-o (⌘C) e pressione o atalho. Abre a última tradução se nada de novo foi copiado.",
  hotkeyLeadSelected:
    "Traduz o texto selecionado em qualquer programa. Abre a última tradução se não houver texto selecionado.",
  freshHotkey: "Nova tradução",
  cardHotkey: "Criar flashcard",
  cardHotkeyLead:
    "Cria um flashcard com o texto copiado (⌘C). Abre uma janela de flashcard vazia se nada de novo foi copiado.",
  cardHotkeyLeadSelected:
    "Cria um flashcard com o texto selecionado. Abre uma janela de flashcard vazia se não houver texto selecionado.",
  hotkeyTakenHere: (name) => `Esta combinação já está definida para “${name}”. Escolha outra.`,
  hotkeyFailed: (reason) =>
    "Provavelmente o atalho já está ocupado"
    + (reason ? ` (${reason})` : "") + ". Escolha outra combinação.",
  hotkeyTakenSystem:
    "Esta combinação é usada pelo macOS. Escolha outra.",
  hotkeyTakenEverywhere:
    "Todos os programas usam esta combinação. Escolha outra.",

  permission: "Usar o texto selecionado diretamente",
  permissionWhy:
    "Se quiser, você pode traduzir o texto selecionado ou transformá-lo em flashcard sem copiá-lo antes, e inserir traduções diretamente em outros programas.",
  permissionHave: "Ativado.",
  permissionTrust:
    "Para isso, o Triglosa precisa da permissão do macOS “Controle do Dispositivo e Acesso a Dados” em Privacidade e Segurança (“Acessibilidade” até o macOS 26). O Triglosa só a usa para ler o texto selecionado e para inserir, e só quando você pede. O Triglosa é de código aberto, então você pode verificar isso:",
  permissionCode: "ver o código",
  permissionAsk: "Permitir…",
  permissionOpen: "Abrir os Ajustes do Sistema",
  permissionPending:
    "O macOS adicionou o Triglosa à lista. Ative o Triglosa na lista — esta janela percebe sozinha.",
  copyFirst: (key) => `Dica: copie um texto em qualquer programa (⌘C) e pressione ${key}.`,
  captureFailed: "Não foi possível ler a seleção. Copie o texto e cole-o aqui.",

  inserted: "Inserido",
  insertNoWay: (reason) =>
    reason === "focus" ? "Nenhum programa onde inserir"
    : reason === "accessibility" ? "Falta a permissão"
    : "Não inserido",

  trayCapture: "Traduzir o texto selecionado",
  trayCaptureCopied: "Traduzir o texto copiado",
  trayCard: "Criar flashcard com o texto selecionado",
  trayCardCopied: "Criar flashcard com o texto copiado",
  trayCardBlank: "Novo flashcard",
  trayShow: "Mostrar janela",
  trayUpdates: "Procurar atualizações",
  trayHelp: "Ajuda",
  trayProblem: "Relatar um problema",
  trayRestart: "Reiniciar o Triglosa",
  trayQuit: "Sair do Triglosa",
  settingsOpen: "Abrir ajustes",
  historyBack: "Tradução anterior",
  historyForward: "Próxima tradução",
  newReading: "Nova tradução",
  closeWindow: "Fechar janela",
  pinWindow: "Manter na frente",
  unpinWindow: "Deixar de manter na frente",
};

export const windows = {
  noDevice: "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  onlyKnownLanguages: "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  pairMissing: () => "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  modelIntro:
    "O Triglosa traduz e explica com um modelo de IA. Conecte um para traduções, verbos, termos, explicações e outras funções.",
  lockedHow:
    "Conecte um modelo de IA nos ajustes para traduções, verbos, termos, explicações e outras funções.",
  apiKeyHint:
    "Vai para o Gerenciador de Credenciais do Windows, nunca para o arquivo de ajustes. Um modelo local normalmente não precisa de uma.",
  hotkeyLead:
    "Traduz o texto selecionado em qualquer programa. Abre a última tradução se não houver texto selecionado.",
  cardHotkeyLead:
    "Cria um flashcard com o texto selecionado. Abre uma janela de flashcard vazia se não houver texto selecionado.",
  hotkeyTakenSystem: "Esta combinação é usada pelo Windows. Escolha outra.",
  appIcons: { menubar: "só na área de notificação", both: "também na barra de tarefas" },
  copyFirst: (key) => `Dica: selecione um texto em qualquer programa e pressione ${key}.`,
  translateKeys: "Traduzir (Ctrl+Enter)",
};

import { why } from "./detail.js";

/* The Portuguese interface. What each entry is for is said in en.js. No
   variant is chosen: the wording keeps to what Brazil and Portugal share,
   "você" with its third-person verbs, and takes the Brazilian form only
   where the two cannot meet — the names of the system's own settings, which
   are the ones macOS and Windows show in Brazilian Portuguese. */
export default {
  placeholder: "Cole ou digite um texto",
  translate: "Traduzir",
  enterKey: "⌘↩",
  edit: "Editar",
  settings: "Ajustes",
  original: "Original",
  terms: "Termos",
  term: "Termo",
  verbs: "Verbos",
  marked: "Seleção",
  inSentence: "aqui",
  previousSentence: "Frase anterior",
  nextSentenceLine: "Frase seguinte",
  /* A looked-up word found misspelled: the line under it, the typed word
     in it a link that looks it up as typed. */
  correctedFrom: (typed) => `Corrigido de ${typed}`,
  didYouMean: (word) => `Você quis dizer ${word}?`,
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
  paste: "Colar",
  settingsDone: "OK",
  search: "Pesquisar (externo)",
  speak: "Pronunciar",
  opened: "Aberto",
  conjugation: "Conjugação (externo)",
  card: "Criar flashcard",
  cardCreate: "Criar flashcard",
  cardLanguage: "Idioma do flashcard",
  sourceLanguage: "Mudar o idioma",
  addLanguage: "Adicionar um idioma",
  removeLanguage: "Remover o idioma",
  unknownLanguage: "Idioma desconhecido",
  added: "Adicionado",
  synonymBack: "Palavra anterior",
  synonymForward: "Próxima palavra",
  cardTerm: "Língua estrangeira",
  cardMeaning: "Língua materna",
  cardNote: "Notas",
  cardCopyAll: "Copiar os três",
  cardCopyField: "Copiar campo",
  cardToAnki: "Salvar no Anki",
  cardAnkiStart: "Abrir o Anki",
  cardAnkiStarting: "Abrindo o Anki…",
  cardAnkiSetup: "Escolher baralho do Anki",
  cardNoteUnmapped: "Nenhum campo atribuído — estas linhas não vão para o Anki.",
  ankiSaved: (deck) => (deck ? `O flashcard está no baralho “${deck}”.` : "O flashcard está no baralho."),
  cardClosing: "A janela será fechada.",
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
  cardDetecting: "Detectando o idioma…",
  cardImproving: "Melhorando o flashcard…",
  cardUndo: "Desfazer a melhoria com IA",
  cardImproveNothing: "Nenhuma melhoria utilizável recebida. O flashcard fica como estava.",
  linking: "ligando…",
  noTerms: "nenhum termo difícil encontrado",
  noTerm: "nenhum termo difícil encontrado",
  noVerbs: "nenhum verbo difícil encontrado",
  lockedHow:
    "Conecte um modelo de IA nos ajustes para traduções mais precisas, termos, verbos, explicações e outras funções.",
  noAnswer: "Nenhuma resposta recebida.",
  faults: {
    unreachable:
      "Sem conexão com o modelo de IA. Verifique a conexão à internet e os ajustes.",
    insecure:
      "O endereço do modelo de IA não é criptografado (http). Use https ou um endereço da sua própria rede nos ajustes.",
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
  groupSections: "Termos e verbos",
  groupModel: "Modelo de IA",
  groupTranslation: "Traduções",
  groupWindow: "Janela",
  groupShortcuts: "Atalhos de teclado",
  groupReading: "Outros programas",
  groupCards: "Flashcards",
  groupAbout: "Sobre o Triglosa",
  aboutVersion: (version) => `Versão ${version}`,
  aboutNotes: "Ver as notas de versão",
  /* The way to the project, as a sentence with its links in it. */
  aboutLinks: (link) => ["O Triglosa está no ", link("project", "GitHub"), ", a ajuda no ", link("help", "README"), ". Se você encontrar um problema ou quiser um recurso novo, abra uma ", link("issues", "issue"), "."],
  updatesCheck: "Procurar atualizações",
  updatesChecking: "Procurando…",
  updatesHint: "Pergunta ao GitHub pela versão mais recente. A atualização só é baixada quando você clica em “Instalar agora”.",
  updatesNone: "Você tem a versão mais recente.",
  updatesFound: (version) => `A versão ${version} está disponível.`,
  updatesDownload: "Ver o download e as notas de versão",
  updatesInstall: "Instalar agora",
  updatesLoading: (percent) => `Baixando… ${percent} %`,
  updatesInstalling: "Instalando… O Triglosa vai reiniciar.",
  updatesInstallNone: "Esta versão não pode ser instalada daqui. Baixe-a manualmente.",
  updatesInstallUnreachable: "Não foi possível baixar a atualização. Tente de novo mais tarde.",
  updatesInstallFailed: (detail) => `A atualização não foi instalada${detail ? ` (${detail})` : ""}. Baixe-a manualmente.`,
  diagnosticsCopy: "Copiar diagnóstico",
  diagnosticsHint: "Para relatar um problema: versão, sistema, idiomas, modelo de IA e últimos erros. Nunca seus textos nem sua chave de API. Nada é enviado; você mesmo cola.",
  updatesFailed: (status) => `Sem resposta do GitHub${status ? ` (${status})` : ""}. Tente de novo mais tarde.`,

  optionOff: "não",
  cardsEnabled: "Mostrar o botão de flashcards",
  cardModes: {
    never: "nunca",
    second: "só para o segundo idioma",
    third: "só para o terceiro idioma",
    learned: "para o segundo e o terceiro idioma",
    foreign: "para todos os idiomas estrangeiros",
  },
  cardsImprove: "Melhorar os flashcards automaticamente com IA",
  cardsImproveHint: "Os flashcards sempre podem ser melhorados com IA apertando um botão.",
  ankiEnabled: "Exportar direto para o Anki",
  ankiEnabledHint: (code) => `Precisa do Anki com o complemento AnkiConnect (código ${code}).`,
  ankiSync: "Sincronizar o Anki depois de cada cartão",
  ankiSyncHint:
    "Só funciona se o AnkiWeb estiver configurado.",
  ankiSearching: "Procurando…",
  ankiMissing:
    "O Anki não responde. Abra o Anki e verifique se o AnkiConnect está instalado.",
  ankiRecheck: "Procurar de novo",
  ankiLaunch: "Abrir o Anki",
  ankiStarting: "Abrindo o Anki…",
  ankiDeck: "Baralho do Anki",
  ankiAddLanguage: "Adicionar um idioma",
  ankiRemoveLanguage: "Remover idioma",
  ankiTargetChoice: "Idioma",
  ankiPerLanguage: "Ajustes do Anki por idioma",
  ankiDeckHint:
    "Qualquer baralho que o Anki indicar. Um nome que ainda não exista é criado ao salvar o primeiro flashcard.",
  ankiNewDeck: "Novo baralho…",
  ankiDeckList: "Da lista",
  ankiNoteType: "Tipo de nota do Anki",
  ankiNoteTypeHint: "O tipo de nota decide quais campos um flashcard tem.",
  ankiNoteTypeUsed: (count) => `neste baralho (${count})`,
  ankiNoteTypeFound: (name) =>
    `Os flashcards do baralho escolhido usam o tipo de nota “${name}”.`,
  ankiNoteTypeLook:
    "O baralho escolhido ainda não tem flashcards de onde ler o tipo de nota. Escolha-o manualmente.",
  ankiFields: "Campos do Anki",
  ankiFieldsHint: "Que campo do tipo de nota recebe qual das três linhas.",
  ankiNoField: "— não escrever",
  ankiFirstField: (name) =>
    `O primeiro campo do tipo de nota (“${name}”) também recebe a palavra estrangeira. O Anki não aceita notas com o primeiro campo vazio.`,

  languagesIntro: ["O Triglosa mostra cada texto ao lado das traduções para estes idiomas (no máximo duas traduções).", "O nível que você define decide quais termos e verbos são explicados em cada idioma.", "Na janela de tradução você pode mudar por um tempo o idioma de uma tradução ou adicionar uma terceira. Isso vale até você fechar o Triglosa."],
  firstLanguage: "Língua materna",
  firstLanguageHint: "Também o idioma do app.",
  secondLanguage: "Segundo idioma",
  thirdLanguage: "Terceiro idioma (opcional)",
  noThird: "nenhum",
  languagesTuned: "Otimizados",
  languagesOther: "Não otimizados",
  otherLanguageHint:
    "O Triglosa não está otimizado para este idioma: os erros são mais frequentes e não há a seção “Verbos”. Quanto mais capaz o modelo de IA, melhor o resultado.",
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
    foreign: "para todos os idiomas estrangeiros otimizados",
    all: "para todos os idiomas otimizados",
  },
  termModes: {
    never: "nunca",
    second: "só para o segundo idioma",
    third: "só para o terceiro idioma",
    foreign: "para todos os idiomas estrangeiros",
    all: "para todos os idiomas",
  },
  showVerbsHint: "Forma básica, pessoa e tempo de até três formas verbais avançadas do texto.",
  showTermsHint: "Explicações de até três palavras ou expressões avançadas do texto.",
  showTerms: "Mostrar termos",
  showVerbs: "Mostrar verbos",
  underline: "Sublinhado colorido no texto",
  searchEngine: "Buscador",
  searchHint: "Para “Pesquisar (externo)” em termos, verbos e palavras marcadas. Abre no navegador padrão.",
  searchSystem: "o definido no Safari",
  glance: "Tradução ao passar o cursor",
  glanceHint: "Mostra sobre as palavras em outros idiomas a que elas correspondem no seu idioma.",
  modelIntro:
    "Sem um modelo de IA, só está disponível a tradução da Apple no dispositivo, se o pacote de idioma estiver baixado. Um modelo de IA traz traduções mais precisas, termos, verbos, explicações e outras funções. O Triglosa não traz nenhum próprio.",
  modelQuestion: "Que tipo de conexão você quer usar?",
  modelWays: "Um caminho que funciona bem está preparado. Como alternativa, você pode inserir qualquer provedor.",
  setupOnline: "Online",
  setupOnlineVia: "pelo OpenRouter",
  setupOnlineLine: "Preciso e rápido. O OpenRouter é um provedor independente em que você precisa carregar crédito.",
  setupOwn: "Inserir você mesmo",
  setupOwnVia: "qualquer provedor",
  setupRecommended: (name, filled) => `Modelo recomendado: ${name}${filled ? ", já preenchido" : ""}`,
  setupOnlineSteps: (site, key, privacy) => [
    ["Crie uma conta em ", site("openrouter.ai"), "."],
    ["Adicione crédito: 5 € bastam para muitos milhares de traduções."],
    ["Crie uma ", key("chave de API"), " e cole abaixo."],
    ["Opcional: ative “Zero Data Retention” nas ", privacy("configurações de privacidade"), " para mais privacidade."],
  ],
  setupOnlineFree: (name) => `Sem crédito, também funciona uma versão gratuita do ${name} oferecida pelo Google. Mas ela só dá para poucas traduções por dia, e o Google pode armazenar seus textos e usá-los para treinamento. Serve apenas para experimentar e não funciona com o Zero Data Retention ativado.`,
  setupOnlineFreeTake: "Preencher o modelo gratuito",
  setupOnlinePaidTake: "Preencher o modelo recomendado",
  setupMore: (guide) => ["Mais informações sobre a escolha do provedor e uma comparação de modelos no ", guide("README"), "."],
  setupChatbot: "Se você travar, um chatbot de IA de sua confiança também pode ajudar.",
  setupGuide: "Instruções",
  endpoint: "Endereço do modelo de IA",
  endpointHints: {
    online: "O endereço do OpenRouter. Para outro provedor, escolha “Inserir você mesmo” acima.",
    own: "Qualquer endereço com uma interface compatível com a OpenAI — na nuvem ou local.",
  },
  endpointPreset: (name) => `Preencher o endereço do ${name}`,
  model: "Modelo",
  modelHints: {
    online: "Qualquer modelo que o OpenRouter oferece, com o nome que aparece na página dele.",
    own: "Se o campo ficar vazio, o app usa o primeiro modelo que o endereço oferecer.",
  },
  apiKey: "Chave de API",
  apiKeyEmpty: "nenhuma guardada",
  apiKeyHints: {
    online: "A chave do OpenRouter (passo 3). Vai para o porta-chaves do sistema, nunca para o arquivo de ajustes.",
    own: "Vai para o porta-chaves do sistema, nunca para o arquivo de ajustes. Um modelo local normalmente não precisa de uma.",
  },
  forgetKey: "Esquecer",
  keySaveFailed: (detail) =>
    `A chave de API não foi guardada${detail ? ` (${detail})` : ""}. Tente de novo.`,
  testConnection: "Testar conexão",
  testing: "Testando…",
  testOk: (name) => `Responde, com “${name}”.`,

  translator: "Tradução por",
  translatorModes: { model: "Modelo de IA", device: "Apple (no dispositivo)" },
  deviceIntro:
    "A tradução da Apple faz parte do macOS: muito rápida e offline, mas muitas vezes imprecisa. Com o pacote de idioma baixado, ela assume automaticamente quando o modelo de IA não responde.",
  translatorHint: "Se um dos dois não puder traduzir, o outro assume automaticamente.",
  translatorNoModel: "Ainda não há nenhum modelo de IA configurado. Até lá, a Apple traduz onde os pacotes de idioma estiverem baixados.",
  /* Who did what, under the pointer on a heading: who wrote a panel (said
     outright where it was not the reader's choice), who named the language
     and matched the words, who explained and placed a section's rows. Put
     together in labels.js (`creditLine`): `by` answers the word in front of
     a name and the name. */
  credits: {
    verbs: { translated: "traduzido", explained: "explicado", assigned: "associado", detected: "idioma detectado", words: "palavras associadas", recognized: "texto reconhecido" },
    and: "e",
    by: ({ kind, name }) => ({ device: ["pela", "Apple (no dispositivo)"], triglosa: ["pelo", "Triglosa"], triglosaDevice: ["pelo", "Triglosa (no dispositivo)"] })[kind] || (name ? ["por", name] : ["pelo", "modelo de IA"]),
    line: (verbs, who) => `${verbs} ${who}`,
    chosen: "Idioma escolhido por você",
  },
  foldPanel: "Recolher",
  unfoldPanel: "Expandir",
  more: "Explicar em mais detalhe",
  moreWorking: "Explicando em mais detalhe…",
  addExample: "Adicionar uma frase de exemplo",
  exampleWorking: "Escrevendo uma frase de exemplo…",
  devicePairs: "A tradução da Apple no dispositivo",
  pairsChecking: "Verificando…",
  pairsAllInstalled: "Todos os pacotes de idioma para os seus idiomas estão baixados.",
  pairsNoDevice:
    "A tradução da Apple não está respondendo agora.",
  pairsRecheck: "Verificar de novo",
  pairsDownloadable: (pairs) => `Ainda não baixados: ${pairs}.`,
  pairsUnsupported: (pairs) =>
    `Não é possível com a tradução da Apple: ${pairs}. Isso não pode ser baixado.`,
  pairsFetch: "Baixar os idiomas…",
  pairsFetchAgain: "Pedir de novo…",
  pairsOnTheirWay:
    "O download é feito em segundo plano e pode levar alguns minutos; você não precisa fazer mais nada. Enquanto isso, “Pedir de novo” não mostra nada. Se a janela do macOS foi fechada, basta pedir de novo.",
  pairsPrompt: "Baixar idiomas para a tradução da Apple",
  pairsFetched: "Pedido",
  pairsBySettings:
    "Adicione-os em “Idioma e Região”, em “Idiomas de Tradução”.",
  pairArrow: (from, to) => `${from} → ${to}`,

  fitWindow: "Ajustar a altura da janela ao conteúdo",
  kept: "Lembrar traduções anteriores",
  keptHint: "Ficam salvas até você fechar o Triglosa.",
  keptLast: (n) => `as últimas ${n}`,
  appIcon: "Ícone enquanto o Triglosa está aberto",
  appIcons: { menubar: "na barra de menus", dock: "no Dock", both: "na barra de menus e no Dock" },
  shortcutsLead:
    "Se nada acontecer aqui na janela ao pressionar um atalho, ele já está ocupado. Escolha outro.",
  hotkey: "Iniciar tradução",
  hotkeyEmpty: "nenhum atalho",
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
  hotkeyTakenHere: (name) => `Este atalho já está definido para “${name}”. Escolha outro.`,
  hotkeyFailed: (reason) =>
    "Provavelmente o atalho já está ocupado"
    + (reason ? ` (${reason})` : "") + ". Escolha outro.",
  hotkeyTakenSystem:
    "Este atalho é usado pelo macOS. Escolha outro.",
  hotkeyTakenEverywhere:
    "Todos os programas usam este atalho. Escolha outro.",

  wordHotkey: "Palavra sob o ponteiro",
  wordHotkeyLead: "Procura a palavra em que o ponteiro está.",
  sentenceHotkey: "Frase sob o ponteiro",
  sentenceHotkeyLead: "Traduz a frase inteira em que o ponteiro está.",
  forceClick: "Clique Forte",
  forceClickHint:
    "Para que a pesquisa da Apple não abra junto, desative “Pesquisa e detectores de dados” nos Ajustes do Sistema, em Trackpad.",
  pointerUnreliable: "As funções abaixo não funcionam de forma confiável em todos os programas.",
  withSentence: "Enviar a frase",
  withSentenceLead:
    "Quando você consulta até três palavras, a frase delas vai junto para o modelo de IA (no máximo 30 palavras). Isso melhora a detecção do idioma e as traduções.",
  nextSentence: "Oferecer a frase seguinte",
  nextSentenceLead:
    "Mostra sob o original a frase que se segue no texto de origem. Um clique a traduz.",

  permission: "Permissão do macOS para ler e inserir",
  directSelection: "Ler o texto selecionado e inserir traduções diretamente",
  directSelectionLead:
    "Os atalhos usam o texto selecionado sem que você o copie antes, e as traduções podem ser inseridas diretamente em outros programas.",
  permissionHave: "A permissão está concedida no macOS.",
  permissionTrust:
    "Opcional: com a permissão do macOS “Controle do Dispositivo e Acesso a Dados” (em Privacidade e Segurança, “Acessibilidade” até o macOS 26), o Triglosa pode ler diretamente o texto selecionado, ler a palavra ou a frase sob o ponteiro e inserir traduções diretamente em outros programas.",
  permissionTrustUse:
    "O Triglosa só usa a permissão para essas funções e só se você as ativar. O Triglosa é de código aberto, então você pode verificar isso:",
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

  trayTranslating: "Traduzir",

  trayCards: "Flashcards",

  trayCapture: "Traduzir o texto selecionado",
  trayCaptureCopied: "Traduzir o texto copiado",
  trayCard: "Criar flashcard com o texto selecionado",
  trayCardCopied: "Criar flashcard com o texto copiado",
  trayCardBlank: "Novo flashcard",
  trayScreen: "Traduzir texto de uma captura de tela",
  trayScreenCopy: "Copiar texto de uma captura de tela",
  trayScreenCard: "Criar flashcard de uma captura de tela",
  screenHotkey: "Traduzir texto de uma captura de tela",
  screenHotkeyLead: "Você desenha uma moldura em volta de um texto na tela, e o Triglosa o reconhece e traduz.",
  screenCopyHotkey: "Copiar texto de uma captura de tela",
  screenCopyHotkeyLead: "Você desenha uma moldura em volta de um texto na tela, e o texto reconhecido vai para a área de transferência. O Triglosa não abre.",
  screenCardHotkey: "Criar flashcard de uma captura de tela",
  screenCardHotkeyLead: "Você desenha uma moldura em volta de um texto na tela, e o texto reconhecido vai para um novo flashcard.",
  screenPrivacy: "As capturas de tela são processadas só no seu dispositivo. Ao modelo de IA só vai o texto reconhecido.",
  screenPermissionTitle: "Permissão do macOS para capturas de tela",
  screenPermissionLead:
    "Opcional: com a permissão do macOS “Gravação de Tela e Áudio do Sistema” (em Privacidade e Segurança), o Triglosa pode fazer uma captura de qualquer texto na tela para traduzi-lo, copiá-lo ou colocá-lo num flashcard, e ler a palavra ou a frase sob o ponteiro mesmo onde um programa não entrega texto.",
  screenPermissionUse:
    "O Triglosa só grava a tela quando você usa uma dessas funções. As capturas de tela são processadas só no seu dispositivo. Ao modelo de IA só vai o texto reconhecido.",
  screenPermissionPending:
    "O macOS adicionou o Triglosa à lista. Ative o Triglosa na lista e depois abra o Triglosa de novo.",
  screenHint: "Desenhe uma moldura em volta do texto · Esc cancela",
  screenReading: "Reconhecendo o texto…",
  screenNothing: "Nenhum texto reconhecido. Escolha outra parte da tela.",
  imageUnreadable: "Não foi possível abrir a imagem. Escolha outra.",
  imageNothing: "Nenhum texto reconhecido na imagem. Escolha outra.",
  dropImage: "Solte a imagem aqui para traduzi-la",
  /* Under a new translation's field on a computer, where a phone has its
     camera, photos and clipboard. */
  dropHint: "Arraste uma imagem para a janela para traduzi-la.",
  dropNeedsPin: (name, pin) => ["Para isso, “", name, "” ", pin, " precisa estar ativado."],
  screenNoAnswer: "O reconhecimento de texto não respondeu. Tente de novo.",
  screenAbsent: "O reconhecimento de texto falta nesta instalação. Reinstale o Triglosa.",
  screenPermission: "O Triglosa não pode gravar a tela. Permita isso nos Ajustes do Sistema, em “Gravação de Tela e Áudio do Sistema”.",
  screenFailed: "A captura de tela não funcionou. Tente de novo.",
  /* The word or the sentence under the pointer read off the screen. */
  pointerReading: "Reconhecendo o texto de uma captura de tela…",
  pointerNothing: "Nenhum texto encontrado sob o ponteiro. Aponte para uma palavra e tente de novo.",
  /* On a phone: a text from the camera, the photo library or the
     clipboard (the buttons under a new translation); a picture's text. */
  pictureCamera: "Câmera",
  pictureLibrary: "Fotos",
  clipboard: "Área de transferência",
  pictureNothing: "Nenhum texto reconhecido na imagem. Tente outra imagem.",
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
  welcomeFind:
    "O Triglosa funciona em segundo plano. Você encontra o símbolo dele, um livro, no canto superior direito, na barra de menus.",
  welcomeModel: "Um modelo de IA traduz com mais precisão e explica termos, verbos e cada palavra em que você clica, de acordo com o seu nível. Conecte um nos ajustes, em “Modelo de IA”.",
  statsSetting: "Estatísticas de uso anônimas",
  statsHint: "Envia no máximo uma vez por dia que o Triglosa foi usado: a versão, o sistema e o tipo de modelo de IA (OpenRouter, LM Studio ou outro). Se algo der errado, só o tipo de erro. Nunca os seus textos nem nada que identifique você.",
  statsThanks: "Muito obrigado.",
  welcome: {
    heading: "Boas-vindas ao Triglosa",
    steps: "Primeiros passos",
    exampleHint: "Um exemplo. Aponte para uma palavra com o mouse para ver em que ela se transformou no seu idioma.",
    example: {
      source: "es",
      text: "Aunque llovía a cántaros, salimos a pasear por el casco antiguo.",
      panels: [
        { code: "pt", text: "Embora chovesse a cântaros, saímos para passear pelo centro histórico." },
        { code: "en", text: "Although it was raining cats and dogs, we went out for a walk in the old town." },
      ],
      terms: [
        { text: "llover a cántaros", spot: "llovía a cántaros", meaning: "chover a cântaros", note: "Chover muito forte, na linguagem informal.", in: ["chovesse a cântaros", "raining cats and dogs"] },
        { text: "casco antiguo", spot: "casco antiguo", meaning: "centro histórico", note: "A parte histórica de uma cidade.", in: ["centro histórico", "old town"] },
      ],
      verbs: [
        { form: "salimos", infinitive: "salir", tense: "Indefinido", meaning: "sair", person: "1ª pessoa do plural", in: ["saímos", "went out"] },
      ],
      glance: "Aunque | Embora | Although\nllovía | chovesse | it was raining\na cántaros | a cântaros | cats and dogs\nsalimos | saímos | we went out\na pasear | para passear | for a walk\npor el | pelo | in the\ncasco antiguo | centro histórico | old town",
    },
    languages: "Escolha nos ajustes, em “Idiomas”, a sua língua e os idiomas que você está aprendendo.",
    start: {
      title: "Começar.",
      select: (key) => ["Selecione um texto em qualquer programa e pressione ", key, "."],
      copy: (key) => ["Copie um texto em qualquer programa (⌘C) e pressione ", key, "."],
      change: "Você pode mudar o atalho nos ajustes, em “Atalhos de teclado”.",
      noKey: "o seu atalho",
      set: "Você o define nos ajustes, em “Atalhos de teclado”.",
    },
    permission: {
      title: "Opcional: ler o texto diretamente.",
      body: "Com a permissão do macOS “Controle do Dispositivo e Acesso a Dados” (“Acessibilidade” até o macOS 26), o Triglosa lê o texto selecionado sem copiar e insere traduções em outros programas. Você a concede nos ajustes, em “Outros programas”.",
    },
    stats: {
      off: "Você pode desativar isso a qualquer momento nos ajustes.",
    },
    more: (link) => ["Todas as informações sobre o Triglosa estão no ", link("README"), " no GitHub."],
    hide: "Não mostrar novamente",
    settings: "Abrir os ajustes",
    close: "Fechar este aviso",
    open: "Mostrar os primeiros passos",
  },
};

export const windows = {
  pointerUnreliable: "As funções abaixo leem texto de outros programas. Isso não funciona de forma confiável com todos os programas.",
  readingPrivacy: "O Triglosa lê texto de outro programa só quando você pressiona um atalho, e não o envia a lugar nenhum além do modelo de IA. Quando um programa não entrega texto, a palavra e a frase sob o ponteiro são lidas de uma captura de tela da área ao redor do ponteiro. As capturas de tela são processadas apenas no seu dispositivo. Só o texto reconhecido vai para o modelo de IA.",
  noDevice: "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  onlyKnownLanguages: "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  pairMissing: () => "Nenhum modelo de IA configurado. Configure um nos ajustes.",
  modelIntro:
    "O Triglosa traduz e explica com um modelo de IA: traduções, termos, verbos, explicações e outras funções. Ele não traz nenhum próprio.",
  lockedHow:
    "Conecte um modelo de IA nos ajustes para traduções, termos, verbos, explicações e outras funções.",
  apiKeyHints: {
    online: "A chave do OpenRouter (passo 3). Vai para o Gerenciador de Credenciais do Windows, nunca para o arquivo de ajustes.",
    own: "Vai para o Gerenciador de Credenciais do Windows, nunca para o arquivo de ajustes. Um modelo local normalmente não precisa de uma.",
  },
  endpointHints: {
    online: "O endereço do OpenRouter. Para outro provedor, escolha “Inserir você mesmo” acima.",
    own: "Qualquer endereço com uma interface compatível com a OpenAI — na nuvem ou local.",
  },
  hotkeyLead:
    "Traduz o texto selecionado em qualquer programa. Abre a última tradução se não houver texto selecionado.",
  cardHotkeyLead:
    "Cria um flashcard com o texto selecionado. Abre uma janela de flashcard vazia se não houver texto selecionado.",
  hotkeyTakenSystem: "Este atalho é usado pelo Windows. Escolha outro.",
  appIcons: { menubar: "só na área de notificação", both: "também na barra de tarefas" },
  copyFirst: (key) => `Dica: selecione um texto em qualquer programa e pressione ${key}.`,
  enterKey: "Ctrl+Enter",
  welcomeFind:
    "O Triglosa funciona em segundo plano. Você encontra o símbolo dele, um livro, no canto inferior direito, ao lado do relógio, clicando na pequena seta (^). Para que ele fique sempre visível, mantenha-o pressionado com o mouse e arraste-o para baixo, à direita da seta. Um clique no símbolo abre a janela, um clique com o botão direito abre o menu.",
  welcomeModel: "O Triglosa traduz com um modelo de IA, que também explica termos, verbos e cada palavra em que você clica, de acordo com o seu nível. Conecte um nos ajustes, em “Modelo de IA”.",
};

export const phone = {
  translateClipboard: "Traduzir a área de transferência",
  /* Before a text goes to an AI model, once for each address (App Review
     5.1.2(i)): asked in a sheet at the first reading, changed in the
     settings. */
  lockedBy: "Por enquanto a tradução vem da Apple (no seu iPhone).",
  pasteSetting: "Colar sem perguntar",
  pasteHint: "Se o iOS perguntar sempre que você colar, ajuste “Colar de Outros Apps” para “Permitir” no Triglosa, nos ajustes do iPhone.",
  pasteLater: "Depois",
  cardSheetClose: "Fechar",
  pasteOpen: "Abrir ajustes do iPhone",
  modelConsentSetting: "Enviar textos ao modelo de IA",
  modelConsentHint: (host) => `Os seus textos vão para ${host}. Sem isso, a Apple traduz neste iPhone e nenhum texto sai dele.`,
  modelConsent: {
    title: "Enviar textos ao modelo de IA?",
    body: (host) => `Para traduzir e explicar, o Triglosa envia os seus textos ao modelo de IA que você configurou, em ${host}. Valem os termos e a política de privacidade do provedor. Sem a sua permissão, a Apple traduz neste iPhone e nenhum texto sai dele.`,
    allow: "Permitir",
    deny: "Não permitir",
  },
  /* The first steps, as a sheet over the reading at the first start. */
  welcomePhone: {
    setup: "Configuração",
    start: "Começar uma tradução",
    done: "Começar",
    exampleHint: "Um exemplo: uma frase, as suas duas traduções e as palavras que vale a pena aprender, marcadas.",
    paste: (button) => ["Copie um texto em qualquer app e toque em ", button, " na barra abaixo: o Triglosa traduz o que você copiou."],
    share: "Ou selecione um texto em qualquer app, toque em “Compartilhar” e escolha o Triglosa.",
    plus: (button) => ["Ou toque em ", button, " para digitar ou colar um novo texto, ou fotografá-lo."],
    languages: "Escolha nos ajustes, em “Idiomas”, a sua língua e as que você está aprendendo.",
    model: "Um modelo de IA traduz com mais precisão e explica termos, verbos e cada palavra que você toca, de acordo com o seu nível. Conecte um nos ajustes, em “Modelo de IA”. Sem ele, a Apple traduz neste iPhone.",
    card: (button) => ["Toque numa palavra para consultá-la. ", button, " cria um cartão, que você pode enviar direto para o Anki."],
  },
  /* The phone runs no model of its own: one way is prepared there. */
  ankiEnabledHint: (_code) => "Precisa do app AnkiMobile.",
  ankiMissing: "O Triglosa pede ao Anki seus baralhos e tipos de nota. O Anki abre por um instante para isso.",
  ankiLaunch: "Carregar do Anki",
  ankiStarting: "Abrindo o Anki…",
  ankiSending: "Abrindo o Anki…",
  ankiRecheck: "Atualizar baralhos",
  ankiRecheckHint: "Busca de novo no Anki seus baralhos e tipos de nota.",
  ankiAbsent: "O AnkiMobile não está instalado. Instale-o pela App Store.",
  ankiLeft: "O Anki não enviou nenhuma lista. Tente de novo e permita colar se o iOS perguntar.",
  ankiDeckHint: "Qualquer baralho que o Anki informou.",
  ankiNoteTypeLook: "No Anki você vê qual tipo de nota um baralho usa: ao adicionar lá um cartão a esse baralho, o tipo de nota aparece no alto.",
  cardClosing: "",
};

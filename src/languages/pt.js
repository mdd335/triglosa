/* Portuguese language pack. Function words only so far; see fr.js. */

import { conjugationAt } from "./conjugation.js";

/* Everyday vocabulary a learner past the first weeks already has. An entry
   whose words are all in here is not worth a slot, and the filter in
   vocabulary.js drops it. Nouns, adjectives and the words of daily life -
   never a verb, which the verb section answers for. Accents are written
   normally: the lookup folds both sides. */
const BASIC_WORDS =
  "apartamento apartamentos casa casas rua ruas carro carros mesa cadeira porta janela água comida " +
  "dinheiro semana mês dia dias noite homem mulher criança crianças menino menina coisa coisas " +
  "gente cidade aldeia praia parque livro loja varanda pão fruta café supermercado irmã irmão mãe " +
  "pai pais amigo amiga campo trabalho tempo vida mundo lugar forma parte momento verão inverno sol " +
  "calor frio chuva vento neve festa família escola preço nome caminho cozinha jardim árvore flor " +
  "cão gato filme música jogo desporto férias viagem queijo carne legumes vinho cerveja importante " +
  "fácil difícil rápido lento bonito bom mau grande pequeno novo velho jovem colega bairro chave " +
  "chaves roupa tarde ano hoje ontem amanhã encontro reunião telefone número hora horas minuto tio " +
  "tia";

export default {
  code: "pt",
  englishName: "Portuguese",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["eu", "tu", "ele/ela/você", "nós", "eles/elas/vocês"],
    tenses: [
      "presente", "pretérito perfeito", "pretérito imperfeito",
      "pretérito mais-que-perfeito", "futuro do presente", "futuro do pretérito",
      "conjuntivo presente", "conjuntivo imperfeito", "imperativo", "infinitivo",
      "gerúndio", "particípio",
    ],
    genders: ["masculine", "feminine"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("portuguese"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "o a os as um uma uns umas e ou mas nao tambem ja depois com de do da no na por " +
    "para que se este esta isso seu sua seus suas mais muito pelo pela dos das",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries:
    "sao sou somos era eram foi foram sera serao seja ser sido "
    + "tenho tem temos tinha tinham tera ha havia "
    + "estou esta estao estava estavam vou vai vamos vao pode podem deve devem",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  /* The definite articles, which put a noun on a flashcard the way a
     dictionary names it — with the gender a learner has to learn with it. */
  definiteArticles: "o a os as",
  conjunctions: "e ou mas nem porque se quando embora enquanto que como pois",
  basicVerbs: "ser estar ter haver fazer ir dizer ver dar saber poder querer vir",
  basicWords: BASIC_WORDS,
  loanwordSuffixes: null,
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-ção, -ões, ã, õ and lh nh point to Portuguese",
  /* What the aligned tables call this language in their columns. */
  columnName: "portugues",
};

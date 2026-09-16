/* Italian language pack. Function words only so far; see fr.js. */

import { conjugationAt } from "./conjugation.js";

/* Everyday vocabulary a learner past the first weeks already has. An entry
   whose words are all in here is not worth a slot, and the filter in
   vocabulary.js drops it. Nouns, adjectives and the words of daily life -
   never a verb, which the verb section answers for. Accents are written
   normally: the lookup folds both sides. */
const BASIC_WORDS =
  "appartamento appartamenti casa case strada strade macchina automobile tavolo sedia porta " +
  "finestra acqua cibo soldi settimana mese giorno giorni notte uomo donna bambino bambina ragazzo " +
  "ragazza cosa cose gente città paese spiaggia parco libro negozio terrazza pane frutta caffè " +
  "supermercato sorella fratello madre padre genitori amico amica campagna lavoro tempo vita mondo " +
  "luogo forma parte momento estate inverno sole caldo freddo pioggia vento neve festa famiglia " +
  "scuola prezzo nome cucina giardino albero fiore cane gatto film musica gioco sport vacanze " +
  "viaggio formaggio carne verdura vino birra importante facile difficile veloce lento bello buono " +
  "cattivo grande piccolo nuovo vecchio giovane collega quartiere chiave chiavi vestiti sera anno " +
  "oggi ieri domani appuntamento riunione telefono numero ora ore minuto zio zia";

export default {
  code: "it",
  englishName: "Italian",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["io", "tu", "lui/lei/Lei", "noi", "voi", "loro"],
    tenses: [
      "presente", "passato prossimo", "imperfetto", "passato remoto",
      "trapassato prossimo", "futuro semplice", "condizionale", "congiuntivo presente",
      "congiuntivo imperfetto", "imperativo", "infinito", "gerundio", "participio",
    ],
    genders: ["masculine", "feminine"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("italian"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "il lo la i gli le un uno una e ed o ma non anche gia dopo con di del al dal nel " +
    "per in che si questo questa questi queste suo sua loro piu molto sul della delle",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries:
    "sono sei siamo siete era erano fu furono sara saranno sia siano essere stato stata "
    + "ho hai ha abbiamo avete hanno aveva avevano avra avrebbe "
    + "sto stai sta stanno puo possono posso deve devono devo",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  /* The definite articles, which put a noun on a flashcard the way a
     dictionary names it — with the gender a learner has to learn with it. */
  definiteArticles: "il lo la i gli le l'",
  conjunctions: "e ed o od ma però perché se quando mentre benché che come oppure",
  basicVerbs: "essere avere fare andare dire vedere venire sapere potere volere dare stare",
  basicWords: BASIC_WORDS,
  loanwordSuffixes: null,
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-zione, -mente, doubled consonants and words ending in a vowel point to Italian",
  /* What the aligned tables call this language in their columns. */
  columnName: "italiano",
};

/* French language pack. Grammar table and function words; difficulty
   analysis runs on the generic path. */

import { conjugationAt } from "./conjugation.js";

/* Everyday vocabulary a learner past the first weeks already has. An entry
   whose words are all in here is not worth a slot, and the filter in
   vocabulary.js drops it. Nouns, adjectives and the words of daily life -
   never a verb, which the verb section answers for. Accents are written
   normally: the lookup folds both sides. */
const BASIC_WORDS =
  "appartement appartements maison maisons rue rues voiture voitures table chaise porte fenêtre eau " +
  "nourriture argent semaine mois jour jours nuit homme femme enfant enfants fille garçon chose " +
  "choses gens ville village plage parc livre magasin terrasse pain fruit café supermarché sœur " +
  "frère mère père parents ami amie campagne travail temps vie monde endroit forme partie moment " +
  "été hiver soleil chaleur froid pluie vent neige fête famille école prix nom chemin cuisine " +
  "jardin arbre fleur chien chat film musique jeu sport vacances voyage fromage viande légume vin " +
  "bière important facile difficile rapide lent joli bon mauvais grand petit nouveau vieux jeune " +
  "collègue quartier clé clés vêtements soir année aujourdhui hier demain réunion téléphone numéro " +
  "heure heures minute oncle tante";

export default {
  code: "fr",
  englishName: "French",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["je", "tu", "il/elle/on", "nous", "vous", "ils/elles"],
    tenses: [
      "présent", "passé composé", "imparfait", "passé simple", "plus-que-parfait",
      "futur simple", "conditionnel", "subjonctif présent", "subjonctif imparfait",
      "impératif", "futur proche", "infinitif", "participe présent", "participe passé",
    ],
    genders: ["masculine", "feminine"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("french"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "le la les un une des du au aux et ou mais ne pas plus aussi deja apres avec de " +
    "par pour dans que se ce cette ces son ses leur leurs qui tres sur nous vous ils " +
    "elle je tu il on mon ma mes ton ta tes notre votre a au en y",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries:
    "est sont suis es sommes etes etait etaient fut furent sera seront serait soit etre ete "
    + "ai as a avons avez ont avait avaient aura aurait eu "
    + "vais vas va allons vont peut peuvent peux doit doivent dois",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  /* The definite articles, which put a noun on a flashcard the way a
     dictionary names it — with the gender a learner has to learn with it. */
  definiteArticles: "le la les l'",
  conjunctions: "et ou mais ni donc car or que qu' si quand lorsque puisque comme parce",
  basicVerbs: "être avoir faire aller dire voir venir savoir pouvoir vouloir prendre donner",
  basicWords: BASIC_WORDS,
  /* -ment and -tion are native French endings, not signs of an English word. */
  loanwordSuffixes: null,
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-eau, -eux, -ment, ç and the accents è ê point to French",
  /* What the aligned tables call this language in their columns. */
  columnName: "francais",
};

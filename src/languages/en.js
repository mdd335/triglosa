/* English language pack. */

import { conjugationAt } from "./conjugation.js";

export default {
  code: "en",
  englishName: "English",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["I", "you", "he/she/it", "we", "they"],
    tenses: [
      "present simple", "present continuous", "past simple", "past continuous",
      "present perfect", "past perfect", "future", "conditional", "imperative",
      "infinitive", "gerund", "participle",
    ],
    genders: [],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("english"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "the a an and or but not also still after with from to of on in at as that this " +
    "these those it he she we they there their its for by",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries:
    "is are am be been being was were will would shall should can could may might must "
    + "has have had do does did",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  conjunctions: "and or but nor so yet because if when while although though that whether since unless until once which who",
  basicVerbs: "be have do go get make say come see know take give want like can will must",
  /* The particle a dictionary puts in front of a verb's base form. Shown
     wherever the base form is shown; the look-ups go without it. */
  infinitiveMarker: "to",
  basicWords:
    "house street table chair door window water food money week month year day night " +
    "man woman child children thing things people city town beach park book shop " +
    "work time place part moment summer winter sun rain wind snow party family friend " +
    "school price name way room kitchen garden tree flower dog cat film music game sport " +
    "holiday trip bread cheese meat fruit vegetable coffee wine beer important easy " +
    "difficult fast slow beautiful good bad big small new old young life world " +
    "sry lol omg okay thx pls asap fyi btw " +
    "board proposal meeting team report member group plan idea market company " +
    "office project budget email phone number hour minute",
  loanwordSuffixes: null,
  verbs: {
    /* English marks its infinitive in front instead of at the end, so there
       is nothing to test — only something to strip before testing. */
    infinitiveMarker: /^to\s+/,
  },
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-tion, -ness, -ly and th point to English",
  /* What the aligned tables call this language in their columns. */
  columnName: "english",
};

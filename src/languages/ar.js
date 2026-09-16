/* Arabic language pack. Function words only so far; see fr.js.
   The one pack that reads from right to left, and the only one that says so. */

import { conjugationAt } from "./conjugation.js";

export default {
  code: "ar",
  englishName: "Arabic",
  /* Which way this language is read. Seven packs say nothing and get the
     generic answer; this one is why the field exists. It reaches the window
     as the `dir` of a panel holding a text in this language - which is all
     the direction a panel needs, since a panel holds one language. */
  direction: "rtl",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["أنا", "أنت", "هو", "هي", "نحن", "أنتم", "هم"],
    tenses: [
      "الماضي", "المضارع", "الأمر", "المصدر", "اسم الفاعل", "اسم المفعول",
    ],
    genders: ["masculine", "feminine"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("arabic"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "في من على أن إلى عن مع هذا هذه ذلك التي الذي لا ما أو ثم قد كل بعد بين هو هي لم " +
    "لن هناك عند حيث كما لكن",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries: "كان كانت كانوا يكون تكون سيكون سوف قد ليس ليست",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  conjunctions: "و أو لكن ثم أن إن لأن إذا عندما بل حتى لكي",
  basicVerbs: "كان قال ذهب جاء رأى عرف أراد أخذ فعل عمل أعطى",
  basicWords: "",
  loanwordSuffixes: null,
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "Arabic script, the article ال and ة at word ends point to Arabic",
};

/* The language packs and the one way to reach them.

   A pack answers what is known about one language. The general code paths
   never name a language; they ask a pack and take the generic path when it
   knows nothing. Adding a language means adding a file here, not touching
   code elsewhere.

   A pack carries:

     code              ISO 639-1
     englishName       used inside prompts, which are written in English
     functionWords     articles, prepositions, conjunctions, pronouns —
                       space separated, lower case, without diacritics
     auxiliaries       forms of to be, to have and the modals, same shape.
                       Kept apart from functionWords because the two are
                       asked different questions: detection wants both, while
                       highlighting must not treat an auxiliary as bycatch —
                       in a copula sentence it is the only right spot
     basicWords        everyday vocabulary a learner already knows, same
                       shape; empty when the language has no list yet
     conjunctions      the words that join clauses — and, but, because, that —
                       same shape. The hover joins a function word to the word
                       after it, and a conjunction is the one kind that does
                       not belong to that word. Every pack carries it
     basicVerbs        the verbs of the first weeks, in their dictionary form,
                       same shape. Their rows are left out from B1 up
     capitalisesNouns  optional, true where a noun is written with a capital
                       (German), so a translation's first capital is kept
     definiteArticles  optional, the definite articles, same shape; an elided
                       one ends in its apostrophe. Only where an article
                       carries the gender a learner has to learn with the
                       noun: absent in English, Russian and Arabic
     infinitiveMarker  optional, the particle a dictionary writes in front of
                       a verb's base form ("to" in English). Absent where the
                       language has none, which is all but one of the eight
     loanwordSuffixes  RegExp for endings that mark an English word in this
                       language, or null when its own words end the same way
     direction         "rtl" where the language is read that way; absent
                       everywhere else, which means "ltr"
     grammar           what this language calls its six persons and its dozen
                       tenses. Written out of a grammar, not measured; it is
                       what keeps the verb table from naming a tense in some
                       other language. Every pack carries it
     conjugationUrl    optional, builds the address of a conjugation table
                       for one infinitive. A language that names none simply
                       offers no such button
     verbs             optional, and only where a language has been
                       calibrated:
                         isInfinitive(form)  does this stand as one
                         isCommon(word)      a verb a learner already knows
                         isCopula(form)      a plain form of "to be"
                         difficulty(form)    higher means harder to look up

   Only Spanish has a verbs section: it is the one language with a measured
   calibration behind it, and phase 6 measured that such calibration does not
   generalise. Where it is missing, showing one verb row too few beats showing
   a wrong one — while `grammar`, which does generalise, is filled everywhere. */

import { stripDiacritics } from "../text.js";
import ar from "./ar.js";
import de from "./de.js";
import en from "./en.js";
import es from "./es.js";
import fr from "./fr.js";
import it from "./it.js";
import pt from "./pt.js";
import ru from "./ru.js";

const PACKS = { ar, de, en, es, fr, it, pt, ru };

/* The languages a user can learn. German and English also serve as the
   first language; both are in here because a German text can equally be the
   one being studied. */
export const SUPPORTED = Object.keys(PACKS).sort();

/* Used for an unknown or not-yet-filled language. Every optional field is
   absent rather than empty-but-present, so callers test one thing. */
const GENERIC = {
  code: "",
  englishName: "an unknown language",
  functionWords: "",
  auxiliaries: "",
  basicWords: "",
  basicVerbs: "",
  conjunctions: "",
  loanwordSuffixes: null,
  direction: "ltr",
};

export function languagePack(code) {
  return PACKS[String(code || "").toLowerCase()] || GENERIC;
}

export function isSupported(code) {
  return Object.prototype.hasOwnProperty.call(PACKS, String(code || "").toLowerCase());
}

/* Which way a language is read. A pack that says nothing is read the way
   seven of the eight are, so the question has an answer for every language
   and for none of the callers a special case. */
export function writingDirection(code) {
  return languagePack(code).direction === "rtl" ? "rtl" : "ltr";
}

/* The name of a language in the interface language, from the platform's own
   table — eight languages times two interface languages is not a list worth
   maintaining by hand. Falls back to the English name where Intl has no
   entry. */
export function displayName(code, inLanguage) {
  const pack = languagePack(code);
  try {
    const names = new Intl.DisplayNames([inLanguage || "en"], { type: "language" });
    return names.of(pack.code || code) || pack.englishName;
  } catch {
    return pack.englishName;
  }
}

/* Word lookup sets, built once per language and cached. Several callers ask
   repeatedly per run. Pass more than one field to get their union — language
   detection wants function words and auxiliaries together, highlighting
   wants the function words alone.

   Folded on the way in, the same way every caller folds the word it looks up.
   Without that the two never meet where a script has more than one spelling
   of a letter: four of Arabic's 29 function words — على, أن, إلى, أو — could
   not be found at all, because the lookup normalises the alef and the alef
   maqsura and the list does not. */
const wordSets = new Map();

export function wordSet(code, ...fields) {
  const key = code + "/" + fields.join("+");
  let set = wordSets.get(key);
  if (!set) {
    const pack = languagePack(code);
    set = new Set(
      fields
        .flatMap((f) => String(pack[f] || "").split(/\s+/))
        .filter(Boolean)
        .map((word) => stripDiacritics(word).toLowerCase()),
    );
    wordSets.set(key, set);
  }
  return set;
}

/* A verb's base form the way a dictionary of its language writes it: with the
   particle in front where the language has one, and never twice. The bare
   form is what a conjugation table and a search are asked about. */
export function citationForm(code, infinitive) {
  const bare = bareInfinitive(code, infinitive);
  const marker = languagePack(code).infinitiveMarker;
  return marker && bare ? `${marker} ${bare}` : bare;
}

export function bareInfinitive(code, infinitive) {
  const text = String(infinitive || "").trim();
  const marker = languagePack(code).infinitiveMarker;
  if (!marker) return text;
  const lead = `${marker} `;
  return text.toLowerCase().startsWith(lead) ? text.slice(lead.length).trim() : text;
}

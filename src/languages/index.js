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
     masculineArticles, feminineArticles
                       optional, which of them go with a masculine and with
                       a feminine noun in the singular, same shape: a card's
                       word listed for a man and a woman takes one of each
                       and names the woman second
     articles          optional, every article written apart from its noun,
                       definite and indefinite, in all its forms, same shape;
                       an elided one ends in its apostrophe. A word looked up
                       with one is answered with one, and the same word under
                       two articles is one entry. Absent in Russian, and in
                       Arabic, which writes its article onto the word
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
   calibration behind it, and the prompt measurements showed such calibration does not
   generalise. Where it is missing, showing one verb row too few beats showing
   a wrong one — while `grammar`, which does generalise, is filled everywhere. */

import { stripDiacritics } from "../text.js";
import { ISO_639_1 } from "./iso639.js";
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

/* Languages a reader may set as a learned one although the app has no pack
   for them: the settings list them apart, as not optimised. What such a
   reader gets was measured for six of them (run forty-nine); the list is
   the languages many people learn that the app's identifier names, that the
   platform has a name for, and of which no two are taken for each other in
   a sentence. Everything a pack would know is missing for them - the verb
   table above all, which is not drawn. */
export const WITHOUT_PACK = (
  "bg bn ca cs da el et fa fi he hi hr hu id is ja ko la lt lv nl no pl ro sk sl sr sv sw th tr uk ur vi zh"
).split(" ");

/* Whether a reader may set this language: one with a pack, or one of the
   others the settings offer. */
export function isChoosable(code) {
  const c = String(code || "").toLowerCase();
  return isSupported(c) || WITHOUT_PACK.includes(c);
}

/* The scripts a language is written in, by their Unicode names, from the
   platform's own table; null where it has none. Three codes of that table
   stand for more than one script. */
const SEVERAL_SCRIPTS = { Jpan: ["Han", "Hiragana", "Katakana"], Kore: ["Hangul", "Han"], Hans: ["Han"], Hant: ["Han"] };
const scriptTests = new Map();

function scriptTest(code) {
  if (!scriptTests.has(code)) {
    let test = null;
    try {
      const script = new Intl.Locale(code).maximize().script;
      const names = SEVERAL_SCRIPTS[script] || (script ? [script] : []);
      if (names.length) test = new RegExp(`^(?:${names.map((name) => `\\p{Script=${name}}`).join("|")})$`, "u");
    } catch {
      /* A code the platform does not know, or a script this engine has no
         table for: nothing is said about it. */
    }
    scriptTests.set(code, test);
  }
  return scriptTests.get(code);
}

/* How a text's letters stand to a language's script: "all" of them are in
   it, "some", or "none"; "" where the text has no letters or the script is
   not known. A word in Han is no Spanish word, whoever says so. */
export function lettersInScriptOf(code, text) {
  const test = scriptTest(String(code || "").toLowerCase());
  const letters = String(text || "").match(/\p{L}/gu) || [];
  if (!test || !letters.length) return "";
  const inside = letters.filter((letter) => test.test(letter)).length;
  return inside === letters.length ? "all" : inside ? "some" : "none";
}

export function isSupported(code) {
  return Object.prototype.hasOwnProperty.call(PACKS, String(code || "").toLowerCase());
}

/* Which way a language is read. A pack that says nothing is read the way
   seven of the eight are, so the question has an answer for every language
   and for none of the callers a special case. */
export function writingDirection(code) {
  if (isSupported(code) || !code) return languagePack(code).direction === "rtl" ? "rtl" : "ltr";
  /* A language without a pack that the reader named: the platform knows
     which way Persian or Hebrew runs. */
  try {
    const locale = new Intl.Locale(code);
    const info = locale.getTextInfo ? locale.getTextInfo() : locale.textInfo;
    return info?.direction === "rtl" ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}

/* The name a prompt gives a language. A pack's own where there is one; for a
   language without a pack whose code is known — one the reader named — the
   platform's English name, so that a question about a Persian word says
   Persian. Nothing known is the generic pack's "an unknown language". */
export function englishName(code) {
  if (isSupported(code) || !code) return languagePack(code).englishName;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    return name && name !== code ? name : GENERIC.englishName;
  } catch {
    return GENERIC.englishName;
  }
}

/* The name of a language in the interface language, from the platform's own
   table — eight languages times two interface languages is not a list worth
   maintaining by hand. Falls back to the English name where Intl has no
   entry. */
export function displayName(code, inLanguage) {
  /* No code, no name: the generic pack's "an unknown language" is written
     for prompts, in English, and a heading has a word of its own for it. */
  if (!code) return "";
  const pack = languagePack(code);
  try {
    const names = new Intl.DisplayNames([inLanguage || "en"], { type: "language" });
    return names.of(pack.code || code) || pack.englishName;
  } catch {
    return pack.englishName;
  }
}

/* The code of a language the platform's table knows by this name — in the
   given language, in English or in its own — or "". For a language without
   a pack that somebody named in words. */
const namedCodes = new Map();

export function codeNamed(name, inLanguage) {
  const wanted = String(name || "").trim().toLowerCase();
  if (!wanted) return "";
  const key = inLanguage || "en";
  if (!namedCodes.has(key)) {
    const known = new Map();
    for (const code of ISO_639_1) {
      for (const language of [key, "en", code]) {
        try {
          const found = new Intl.DisplayNames([language], { type: "language", fallback: "none" }).of(code);
          if (found && !known.has(found.toLowerCase())) known.set(found.toLowerCase(), code);
        } catch {
          /* A language the platform has no table for. */
        }
      }
    }
    namedCodes.set(key, known);
  }
  return namedCodes.get(key).get(wanted) || "";
}

/* The same name where it stands on its own — a menu entry, a heading, a
   field's title — with a capital at the front. Intl gives the form that
   stands inside a sentence, which in French, Spanish, Italian, Portuguese and
   Russian is lower case: right in "pas encore téléchargé : russe", wrong as a
   menu entry reading "russe". */
export function languageLabel(code, inLanguage) {
  const name = displayName(code, inLanguage);
  if (!name) return name;
  try {
    return name.charAt(0).toLocaleUpperCase(inLanguage || "en") + name.slice(1);
  } catch {
    return name.charAt(0).toUpperCase() + name.slice(1);
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

/* A word without the article in front of it, by the pack's `articles`; the
   text as it is where none leads it or nothing follows. */
export function withoutArticle(code, text) {
  const whole = String(text || "").trim();
  const lead = whole.replace(/’/g, "'").toLowerCase();
  for (const article of String((code && languagePack(code).articles) || "").split(/\s+/).filter(Boolean)) {
    if (!lead.startsWith(article)) continue;
    const rest = whole.slice(article.length);
    if (article.endsWith("'") ? /^\S/.test(rest) : /^\s+\S/.test(rest)) return rest.trimStart();
  }
  return whole;
}

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

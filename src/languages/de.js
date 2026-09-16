/* German language pack. Function words, everyday vocabulary and the one verb
   rule German gives away for free; difficulty analysis runs on the generic
   path. */

import { stripDiacritics } from "../text.js";
import { conjugationAt } from "./conjugation.js";


/* The register note the dictionary prompt asks for comes back in English
   often enough to be worth fixing rather than re-asking. Rule 4 already says
   the note is German; measured, the model still writes "most common" or
   "mainly British" a good part of the time, and a note in the wrong language
   is the one thing on that row a German reader cannot use.

   It lives in the German pack because it is about the language the note is
   written in, not about the language being read. A reader working in English
   gets the notes in English and needs nothing. */
const NOTE_WORDS = [
  [/\bmost commonly used\b/gi, "am üblichsten"],
  [/\bmost common\b/gi, "am üblichsten"],
  [/\bmost usual\b/gi, "am üblichsten"],
  [/\b(common|general|standard|neutral)\s+(usage|term|word|expression)\b/gi, "am üblichsten"],
  [/\bin\s+(common|general)\s+use\b/gi, "am üblichsten"],
  [/\bslightly\b/gi, "etwas"],
  [/\bsomewhat\b/gi, "etwas"],
  [/\bvery\b/gi, "sehr"],
  [/\bderogatory|pejorative\b/gi, "abwertend"],
  [/\btechnical\b/gi, "fachsprachlich"],
  [/\bregional\b/gi, "regional"],
  [/\bmás común\b/gi, "am üblichsten"],
  [/\bmore formal\b/gi, "förmlicher"],
  [/\b(more polite|polite)\b/gi, "höflicher"],
  [/\b(informal|casual|colloquial|coloquial)\b/gi, "umgangssprachlich"],
  [/\bformal\b/gi, "förmlich"],
  [/\b(less common|least common|rarer|rare|uncommon)\b/gi, "seltener"],
  [/\b(old-fashioned|outdated|dated|archaic)\b/gi, "veraltet"],
  [/\b(written|literary)\b/gi, "eher schriftlich"],
  [/\bspoken\b/gi, "eher gesprochen"],
  [/\b(mainly|mostly|chiefly|especially|primarily|typically|common|used)\s+in\b/gi, "v.a."],
  [/\besp\.?\s+in\b/gi, "v.a."],
  [/\bsobre todo en\b/gi, "v.a."],
  [/\b(españa|spain)\b/gi, "Spanien"],
  [
    /\b(latin america|latinoamérica|latinoamerica|américa latina|america latina)\b/gi,
    "Lateinamerika",
  ],
  [/\b(méxico|mexico)\b/gi, "Mexiko"],
  [/\bcolombia\b/gi, "Kolumbien"],
  [/\bargentina\b/gi, "Argentinien"],
  [/\b(usa|u\.s\.a\.|u\.s\.|american|united states)\b/gi, "USA"],
  [/\b(uk|u\.k\.|britain|british|england|great britain)\b/gi, "Großbritannien"],
  [/\bregional\b/gi, "regional"],
];

function normalizeNote(note) {
  let s = String(note || "");
  for (const [pattern, replacement] of NOTE_WORDS) s = s.replace(pattern, replacement);
  return s.replace(/\s+/g, " ").trim();
}

export default {
  normalizeNote,
  code: "de",
  englishName: "German",
  /* What this language calls its persons and its tenses.

     Written out of a grammar rather than measured: there is nothing in it to
     tune and no corpus behind it. It is what closes both leaks at once — the
     verb prompt naming a Spanish tense under a Portuguese text, and a bare
     prompt naming a German one. Kept apart from `verbs` below, which holds
     calibration; the two are different kinds of knowledge and phase 6
     measured that only this one generalises. */
  grammar: {
    persons: ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"],
    tenses: [
      "Präsens", "Präteritum", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II",
      "Konjunktiv I", "Konjunktiv II", "Imperativ", "Infinitiv", "Partizip I",
      "Partizip II",
    ],
    /* The genders a noun can have, by their English names: what a word's
       class line may say, and nothing else. */
    genders: ["masculine", "feminine", "neuter"],
  },
  /* Where a conjugation table for this language lives. A verb row offers it
     as a button; a language that names none simply does not offer one, and
     the web search beside it still does. */
  conjugationUrl: conjugationAt("german"),
  /* Articles, prepositions, conjunctions, pronouns: words that carry no
     meaning worth highlighting on their own. */
  functionWords:
    "der die das den dem des ein eine einen einem einer eines und oder aber nicht " +
    "auch noch schon auf in im an am zu zum zur mit von vom bei nach ueber uber unter " +
    "vor durch um als wie dass sich es er sie wir ich man aus fuer",
  /* Forms of to be, to have and the modals. Frequent enough to matter for
     detection, but never bycatch: in a copula sentence the auxiliary is the
     only right spot to highlight. */
  auxiliaries:
    "ist sind bin bist seid war waren gewesen wird werden wurde wurden worden "
    + "hat haben habe hast habt hatte hatten "
    + "kann kannst konnen konnte konnten muss musst mussen musste mussten "
    + "will willst wollen wollte wollten soll sollen sollte sollten "
    + "darf durfen durfte mag mochte mogen",
  /* The verbs a learner meets in the first weeks, in the form a dictionary
     lists them. A verb row whose base form stands here is left out for a
     reader from B1 up, and in their own language: a table explaining it
     explains nothing. */
  /* German writes every noun with a capital, so a capital at the start of a
     translation may be the right spelling and is left as the model wrote it. */
  capitalisesNouns: true,
  /* The definite articles, which put a noun on a flashcard the way a
     dictionary names it — with the gender a learner has to learn with it. */
  definiteArticles: "der die das",
  conjunctions: "und oder aber sondern denn doch dass ob weil wenn als da damit obwohl während nachdem bevor sobald falls sowie",
  basicVerbs: "sein haben werden machen gehen kommen sagen geben sehen wissen nehmen wollen können müssen sollen dürfen mögen",
  basicWords:
    "haus tisch stuhl tur fenster wasser essen geld woche monat jahr tag nacht mann frau " +
    "kind kinder ding dinge leute stadt dorf strand buch laden strasse " +
    "termin auto arbeit zeit morgen abend nachricht anruf frage antwort grund teil ende " +
    "anfang freund schule preis land person name platz weg zimmer kuche garten baum blume " +
    "hund katze film musik spiel sport urlaub reise wetter sonne regen schnee wind kaffee " +
    "bier wein brot kase fleisch obst gemuse kurzfristig wichtig einfach schwierig " +
    "schnell langsam gross klein " +
    "geben machen sagen gehen kommen sehen lassen stehen bleiben finden bringen halten " +
    "bescheid bzw usw " +
    "wohnung wohnungen kaufer verkaufer erwerber bahnhof see gemeinsam trinken " +
    "unverzuglich nachbar nachbarn arzt geschaft brief zug bus fahrt gesprach " +
    "besuch antrag formular rechnung vertrag frist unterlagen",
  /* No loanword suffixes: Dokument, Argument and Element end in -ment and are
     plainly German. */
  loanwordSuffixes: null,
  verbs: {
    /* A German infinitive ends in -en, -eln or -ern. Coarse on purpose: it
       only has to catch a field that is plainly not a base form. */
    isInfinitive: (form) => /e[lrn]?n$/.test(stripDiacritics(String(form || "")).trim().toLowerCase()),
  },
  /* How this language gives itself away in spelling — used by the
     detector prompt, where the input is often a single word. */
  spellingHints: "-ung, -keit, -heit, umlauts and ß point to German",
  /* What the aligned tables call this language in their columns. */
  columnName: "deutsch",
  /* How a note in this language has to be written. A model that drops the
     umlauts writes something the reader reads as a typo, and the dictionary
     note is four words long — there is no context to repair it from. English
     names none, and contributes no rule. */
  spellingNote: "Write proper German with umlauts (ä, ö, ü) and ß - never ae, oe, ue or ss.",
};

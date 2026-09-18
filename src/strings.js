/* Text shown to the reader, in the language they read explanations in.

   One entry per first language, and only those: every explanation the model
   writes is in the reader's first language. A foreign language a user is
   learning never appears in this table.

   These strings are read by parsers as well as by the interface — the hedge
   in front of an abbreviation is part of the parsed result, not decoration
   added on the way out. */

const TABLE = {
  de: {
    /* Three levels rather than two, and the strongest one says nothing. A
       caveat in front of every expansion blunts itself: put it where the
       text spells the expansion out, and it gets read past everywhere. */
    /* Shown where the model could not place the letters at all. Not a magic
       value in the code — the parser returns an empty expansion and the
       label is chosen here. */
    /* What the definition prompt is told to answer when it does not know
       the word, and what the parser then looks for. */
    unknownWord: "UNBEKANNT",
    unresolvedAbbreviation: "Abkürzung",
    likely: "vermutlich",
    couldStandFor: "könnte stehen für",
    /* Hedges the model puts in front of its own answer. They are stripped
       and decided again, because which level fits is decided from the text
       and the model writes its warning even in front of an expansion that
       stands three lines above it verbatim. */
    hedges: ["könnte stehen für", "vermutlich", "möglicherweise", "wahrscheinlich", "steht wohl für"],
    /* What the model writes into a list where it has nothing to put — read
       together with every language's unknownWord, since a model does not
       always answer in the language it was asked for. */
    nothing: ["keine", "kein bekanntes wort"],
  },
  en: {
    unknownWord: "UNKNOWN",
    unresolvedAbbreviation: "Abbreviation",
    likely: "probably",
    couldStandFor: "could stand for",
    hedges: ["could stand for", "probably", "possibly", "presumably", "likely stands for"],
    nothing: ["none", "unknown word"],
  },
  es: {
    unknownWord: "DESCONOCIDO",
    unresolvedAbbreviation: "Abreviatura",
    likely: "probablemente",
    couldStandFor: "podría significar",
    hedges: ["podría significar", "probablemente", "posiblemente", "seguramente", "quizás", "quizá"],
    nothing: ["ninguna", "ninguno", "desconocida"],
  },
  fr: {
    unknownWord: "INCONNU",
    unresolvedAbbreviation: "Abréviation",
    likely: "probablement",
    couldStandFor: "pourrait signifier",
    hedges: ["pourrait signifier", "probablement", "peut-être", "sans doute", "signifie sans doute"],
    nothing: ["aucune", "aucun", "inconnue"],
  },
  it: {
    unknownWord: "SCONOSCIUTO",
    unresolvedAbbreviation: "Abbreviazione",
    likely: "probabilmente",
    couldStandFor: "potrebbe significare",
    hedges: ["potrebbe significare", "probabilmente", "presumibilmente", "forse", "sta probabilmente per"],
    nothing: ["nessuna", "nessuno", "sconosciuta"],
  },
  pt: {
    unknownWord: "DESCONHECIDO",
    unresolvedAbbreviation: "Abreviatura",
    likely: "provavelmente",
    couldStandFor: "pode significar",
    hedges: ["pode significar", "poderia significar", "provavelmente", "possivelmente", "talvez"],
    nothing: ["nenhuma", "nenhum", "desconhecida"],
  },
  ru: {
    unknownWord: "НЕИЗВЕСТНО",
    unresolvedAbbreviation: "Сокращение",
    likely: "вероятно",
    couldStandFor: "может означать",
    hedges: ["может означать", "вероятно", "возможно", "предположительно", "скорее всего"],
    nothing: ["нет", "неизвестное слово"],
  },
};

export function strings(code) {
  return TABLE[String(code || "").toLowerCase()] || TABLE.en;
}

/* The hedge patterns as one expression, longest first so that "could stand
   for" is not half-matched by a shorter entry. */
export function hedgePattern(code) {
  const escaped = strings(code)
    .hedges.slice()
    .sort((a, b) => b.length - a.length)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^(?:${escaped.join("|")})(?![\\p{L}\\p{N}])\\s*:?\\s*`, "iu");
}

/* Every language's words for "unknown", folded to lower case — a model asked
   for the reader's marker answers in English often enough. */
const UNKNOWN = ["unknown", ...Object.values(TABLE).map((t) => t.unknownWord.toLowerCase())];
const NOTHING = new Set([...UNKNOWN, ...Object.values(TABLE).flatMap((t) => t.nothing)]);

/* Does an answer begin with a marker for a word the model does not know? */
export function startsUnknown(text) {
  const head = String(text || "").trim().toLowerCase();
  return UNKNOWN.some((word) => head.startsWith(word) && !/^[\p{L}\p{N}]/u.test(head.slice(word.length)));
}

/* Is a whole entry a way of saying there is nothing — "none", "UNKNOWN",
   "n/a", a dash? */
export function saysNothing(text) {
  const t = String(text || "").trim().toLowerCase();
  return NOTHING.has(t) || t === "n/a" || /^-+$/.test(t);
}

/* Text shown to the reader, in the language they read explanations in.

   Only German and English exist here, and that is not an oversight: the
   first language is one of the two, and every explanation the model writes
   is in it. A foreign language a user is learning never appears in this
   table.

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
  },
  en: {
    unknownWord: "UNKNOWN",
    unresolvedAbbreviation: "Abbreviation",
    likely: "probably",
    couldStandFor: "could stand for",
    hedges: ["could stand for", "probably", "possibly", "presumably", "likely stands for"],
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
  return new RegExp(`^(?:${escaped.join("|")})\\s*:?\\s*`, "i");
}

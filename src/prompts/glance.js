/* What a word of the original became in the reader's own translation — asked
   once per sentence, so that hovering over a word can say it without asking
   anything.

   The model cuts the sentence into units itself. Handed the words one by one
   instead, the local model lost its place in every third sentence and then
   gave one word the rest of the translation; cutting its own units, it keeps
   its place and makes them coarser. And one sentence at a time, never the
   whole text: asked about a paragraph, the same model shifted every unit of
   an Arabic sentence onto the next one's rendering. Measured in the
   sixteenth run.

   Names no language of its own: the user line labels both sides. */

/* What one unit is — the same sentence in both questions, because it is the
   same question about the same reader. */
const UNIT_RULE = "2. A unit is what a reader would look up together, usually one to three words: a noun with its article, preposition or adjective, a verb with its auxiliary, particle or negation, and words the translation renders as one word. A fixed expression, an idiom or a name is one unit however long it is. A conjunction stands alone.";

export function glancePrompt() {
  return [
    "You align a sentence with its translation, unit by unit, so that a reader hovering over any word of the original can see what it corresponds to.",
    "",
    "HARD RULES:",
    "1. Cut the ORIGINAL into consecutive units, in order, from its first word to its last, leaving no word out. One line per unit: <unit> | <stretch>. Leave out punctuation.",
    UNIT_RULE,
    "3. <unit> is copied EXACTLY from the original. <stretch> is copied EXACTLY from the translation - same spelling, never invented, never inflected.",
    "4. The translation often restructures the sentence - follow the meaning, not the position. If the stretch is split, join its parts with ' ... '.",
    "5. If the translation renders the unit with nothing (an article, a particle), write a single hyphen.",
    "6. The angle brackets mark the fields. Do not write them. No numbering, no extra text.",
  ].join("\n");
}

export function glanceInput({ sourceName, targetName, sentence, translation }) {
  return `Original (${sourceName}): ${sentence}\nTranslation (${targetName}): ${translation}`;
}

/* Three panels: the same question with a column more. One question rather
   than two — measured against a second question handed the units of the
   first, which the local model answered with whole clauses in seven of 33
   sentences against three. The column the reader reads does not suffer from
   the extra one; it came out a shade better on both models. And one list of
   units means one grouping for every panel, which is what a reader sees.

   Beside the one-translation question rather than replacing it: with two
   panels there is no B, and asking about a column nobody reads costs
   answers. */
export function glanceWidePrompt() {
  return [
    "You align a sentence with its two translations, unit by unit, so that a reader hovering over any word of the original can see what it corresponds to.",
    "",
    "HARD RULES:",
    "1. Cut the ORIGINAL into consecutive units, in order, from its first word to its last, leaving no word out. One line per unit: <unit> | <A> | <B>. Leave out punctuation.",
    UNIT_RULE,
    "3. <unit> is copied EXACTLY from the original. <A> is copied EXACTLY from the text labelled A and <B> from the text labelled B - same spelling, never invented, never inflected.",
    "4. The translation often restructures the sentence - follow the meaning, not the position. If a stretch is split, join its parts with ' ... '.",
    "5. If the translation renders the unit with nothing (an article, a particle), write a single hyphen.",
    "6. The angle brackets mark the fields. Do not write them. No numbering, no extra text.",
  ].join("\n");
}

/* The labels carry the languages, so the question names none. */
export function glanceWideInput({ sourceName, aName, bName, sentence, a, b }) {
  return `Original (${sourceName}): ${sentence}\nA (${aName}): ${a}\nB (${bName}): ${b}`;
}

/* Improving a flashcard, on the reader's request — in two questions.

   A card made out of a row is the word as it happened to stand in one text —
   a plural, a conjugated form, a pronoun that belongs to one sentence — with
   whatever explanation that row had. What a deck wants is the word a
   dictionary lists and an explanation that teaches it: other meanings,
   examples, how it is used.

   The first question needs the sentence: it tells which of two words spelled
   alike is meant and which sense goes on the back. The explanation is asked
   apart, of the word and its meaning alone: shown the sentence, both models
   turned what stood in it into a habit of the word — "often in the plural"
   because the sentence had a plural, "often with feio" because it had feio.

   Described rather than shown: no example stands in here, for the reason
   no prompt in this app carries one, and nothing names a language but from
   a pack.

   A line of irregular present-tense forms was asked for too, and taken out
   again: measured, it was wrong more often than right. A memory aid went with
   it, most of either model's invented; an origin or a related word is asked
   again among the notes, now that every note is checked before it stands. */

export function improveCardPrompt({ term, reader, termCapitals, readerCapitals, hasSentence, hasTranslation, readerLines = false }) {
  const capitals = (language, nouns) => nouns
    ? `a noun with a capital first letter and every other word in lower case, as ${language} writes it`
    : `in lower case unless ${language} writes it with a capital, as for a proper name`;
  const translates = hasSentence && !hasTranslation;
  const own = translates ? 4 : 3;

  return [
    `You correct the word and its meaning on a vocabulary flashcard for a reader whose own language is ${reader} and who is learning ${term}.`,
    "",
    "Rewrite both fields, correct what is wrong, and keep what is right.",
    "",
    `FIELD 1 - the ${term} word or phrase as a ${term} dictionary lists it. The form on the card is often the one that stood in the sentence - a plural, a conjugated verb, an adjective agreeing with something. First work out which word it is a form of - the meaning on the card and the sentence tell you which of two words spelled alike is meant - then write that word, even where it is spelled differently:`,
    `- a verb in its dictionary form, never conjugated;`,
    `- a noun in the singular, unless ${term} uses it only or normally in the plural;`,
    `- an adjective in its dictionary form;`,
    `- a fixed expression with a verb in it: that verb in its dictionary form too, and a pronoun or object that belongs to this one sentence replaced the way a dictionary lists the expression; an optional word in brackets;`,
    `- ${capitals(term, termCapitals)};`,
    `- the same word as on the card, never a synonym or a word that only looks similar;`,
    `- without an article.`,
    "",
    `FIELD 2 - its meaning in ${reader}: the sense it has in the sentence from the text, as ONE ${reader} word or expression. A second, separated by "; ", ONLY where a ${term} dictionary gives this word a clearly different sense of its own that a learner will meet often. TEST: could the two ${reader} words stand for each other in a sentence? Then they are one sense - write only the first. Never a near-synonym, a variant or a more specific word of the first. The same part of speech as field 1 - a verb is translated by verbs, a noun by nouns, a fixed expression by an expression of the same meaning; never a noun for a verb or a single word out of an expression. Each in its dictionary form, ${capitals(reader, readerCapitals)}, without an article. No explanation in this field.`,
    ...(translates
      ? ["", `FIELD 3 - the sentence from the text, copied word for word as given, followed by its ${reader} translation in round brackets. Nothing else.`]
      : []),
    ...(readerLines
      ? ["", `FIELD ${own} - every line under "Lines the reader wrote" that is written in ${term}, copied word for word as given, followed by its ${reader} translation in round brackets, one per line. Leave out every line in another language.`]
      : []),
    "",
    "Answer in exactly this shape and nothing else:",
    "<field 1>",
    "<field 2>",
    ...(translates || readerLines ? ["---"] : []),
    ...(translates ? ["<field 3>"] : []),
    ...(readerLines ? [`<field ${own}, one line each>`] : []),
    "The angle brackets mark the fields. Do not write them.",
  ].join("\n");
}

/* `readerLines` are the lines the reader wrote into the explanation; those
   still without a translation are listed apart, and the note keeps the rest.
   Several meanings stand on one line here, as the answer gives them. */
export function improveCardInput({ term, reader, card, readerLines = [] }) {
  const context = card.context || {};
  const asked = readerLines.filter((line) => line.untranslated).map((line) => line.line);
  const note = asked.length
    ? String(card.note || "").split("\n").filter((line) => !asked.includes(line.trim())).join("\n").trim()
    : String(card.note || "").trim();
  return [
    `Field 1 (${term}): ${card.term || ""}`,
    `Field 2 (${reader}): ${String(card.meaning || "").replace(/\s*;?\s*\n\s*/g, "; ")}`,
    note ? `Note on the card: ${note}` : null,
    context.sentence ? `Sentence from the text (${term}): ${context.sentence}` : "There is no sentence from a text.",
    context.sentence && context.translation ? `Its ${reader} translation: ${context.translation}` : null,
    asked.length ? `Lines the reader wrote:\n${asked.join("\n")}` : null,
  ].filter(Boolean).join("\n");
}

/* The explanation under an improved card's sentence: up to three notes on
   the word - where it is said differently, how it is used, what is worth
   knowing about it - and one or two further examples, asked of the word and
   its meaning, never of the text it came from.

   The notes name what a teacher would say rather than a list of categories
   to fill: given "register, region, construction, false friend", both models
   wrote one of each whether they knew one or not ("in South America vela
   can also mean a sail"). The reader's level is not named: a model told it
   wrote it into the note ("in everyday B1 Spanish"); it shapes the
   examples, said in words. The two forms of a person or an animal are named
   only where the card shows both - said to every card, the model explained
   why a candle has none. Every note is then checked (`checkCardNotesPrompt`). */
const EXAMPLE_STYLE = {
  A1: "very short and simple, in everyday words",
  A2: "very short and simple, in everyday words",
  B1: "short, in everyday words",
  B2: "natural and of everyday length",
  C1: "natural, as a native speaker writes",
  C2: "natural, as a native speaker writes",
};

export function explainCardPrompt({ term, reader, level, spelling, articles, bothForms = false }) {
  const article = articles ? "its article or its gender - the card adds the article itself" : "its article";
  const style = EXAMPLE_STYLE[level] || EXAMPLE_STYLE.B1;
  return [
    `You write the notes on a vocabulary flashcard for a reader whose own language is ${reader} and who is learning ${term}. The card shows a ${term} word and its meaning in ${reader}. The notes add what a good teacher who is a native speaker of ${term} would tell a learner about this word - nothing its meaning already says.`,
    "",
    ...(bothForms ? ["The card names a person or an animal in both forms: explain the word alike for both, never say which sex one form names."] : []),
    `NOTES - up to three, each one sentence in ${reader} of at most 25 words, each about something different. Worth a note:`,
    `- a fixed expression or construction the word typically appears in (a preposition, a reflexive use, a case it takes), or its register where it is not neutral;`,
    `- a real difference between regions: where the word is not said, or means something else, and what is said there instead - only where the word itself differs; most words are said alike everywhere;`,
    `- its origin or a related word that helps to remember it, a word it is easily confused with, a false friend in ${reader}, a fact of the culture behind it.`,
    `Write a note only where you know it for certain and it holds everywhere it says. Many words have one or two such notes, a plain word none: then write NONE. Never a note that restates the meaning or describes what the thing is. Never ${article}.`,
    "Nowhere say how the word is conjugated or declined - regular or irregular, its class, its other forms.",
    "",
    `EXAMPLES - one or two ${term} sentences, ${style}, each on a line of its own and followed by its ${reader} translation in round brackets on the same line, showing a typical combination or, where the word has two senses, the second.`,
    ...(spelling ? ["", spelling] : []),
    "",
    "Answer in exactly this shape, plain text, no markdown:",
    "NOTES:",
    "<one note per line, or NONE>",
    "EXAMPLES:",
    "<one example per line>",
    "The angle brackets mark what to write. Do not write them.",
  ].join("\n");
}

export function explainCardInput({ term, reader, word, meaning }) {
  return [`Word (${term}): ${word}`, `Meaning (${reader}): ${meaning}`].join("\n");
}

/* Every note checked by the same model, asked apart and at temperature 0.
   Shown the usage lines of run 57 one by one, the cloud model judged 11 of 16
   wrong ones wrong and kept 37 of 45 right ones; the local one called nearly
   everything true, but both set aside about three in four that only restated
   the meaning. Asked for the wrong detail instead, both found one in almost
   every note. Only a note judged true and new is kept (run 74). */
export function checkCardNotesPrompt({ term, reader }) {
  return [
    `You check the notes on a vocabulary flashcard for a learner of ${term} whose own language is ${reader}. The card shows a ${term} word and its meaning in ${reader}.`,
    "",
    "Notes like these are often partly invented: a region where the word is said to be used, a preposition or construction it is said to take, a register, an origin, an expression that does not exist. Judge every note on two things:",
    `1. TRUE if every detail in it is right, as a ${term} dictionary and native speakers would confirm; FALSE if any detail is wrong; UNSURE if you cannot confirm every detail.`,
    "2. NEW if it tells the learner something the word and its meaning do not already say; OBVIOUS if it only restates the meaning, says something any learner would assume, or names a region where nothing differs.",
    "",
    "Answer with one line per note and nothing else: its number, then TRUE, FALSE or UNSURE, then NEW or OBVIOUS.",
  ].join("\n");
}

export function checkCardNotesInput({ term, reader, word, meaning, notes }) {
  return [
    explainCardInput({ term, reader, word, meaning }),
    "",
    "Notes:",
    ...notes.map((note, index) => `${index + 1}. ${note}`),
  ].join("\n");
}

/* The word on a flashcard, the way a dictionary of its language names it —
   asked of each side of an improved card on its own, after the card is
   written.

   A noun learned without its article is learned without its gender, and
   gender is knowledge, not spelling. Asked inside the prompt above, both
   models put articles in front of verbs and phrases, and the local one turned
   verbs into nouns to have something to put one in front of; asked alone,
   measured, it is right for every noun and leaves everything else alone.

   A person or an animal with a feminine form of its own is listed with
   both, as a learner's dictionary does. */
export function headwordPrompt({ language }) {
  return [
    `You write one ${language} word or short phrase as the headword of a ${language} dictionary entry.`,
    "",
    "RULES:",
    `1. If it is a noun, put its definite article in front, in the singular, the way a ${language} dictionary or a learner's vocabulary list names the noun.`,
    `2. If a ${language} dictionary lists that noun in a masculine and a feminine form - as it does for most professions and roles and for some animals - write both forms in the singular, each with its definite article, the masculine first, also when the given word is the feminine form: <article> <masculine form> / <article> <feminine form>. If one and the same word serves for both, write it once with both articles: <article>/<article> <word>. Most nouns have one gender and stay as in rule 1, also when they name a person. Never make up a form.`,
    "3. If it is not a noun - a verb, an adjective, an adverb, a phrase - leave it exactly as it is.",
    `4. Capitalise it exactly as ${language} requires, and change nothing else: same word, same spelling.`,
    "5. Answer with the headword alone: no explanation, no quotation marks, no second line.",
  ].join("\n");
}

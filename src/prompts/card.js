/* Improving a flashcard, on the reader's request.

   A card made out of a row is the word as it happened to stand in one text —
   a plural, a conjugated form, a pronoun that belongs to one sentence — with
   whatever explanation that row had. What a deck wants is the word a
   dictionary lists and an explanation that teaches it: other meanings,
   examples, how it is used.

   Described rather than shown: no example stands in here, for the reason
   no prompt in this app carries one, and nothing names a language but from
   a pack.

   A memory aid and a line of irregular present-tense forms were asked for
   too, and taken out again: measured, most of either model's memory aids
   were invented and the irregular line was wrong more often than right. */

export function improveCardPrompt({ term, reader, level, termCapitals, readerCapitals, spelling, hasSentence }) {
  const capitals = (language, nouns) => nouns
    ? `a noun with a capital first letter and every other word in lower case, as ${language} writes it`
    : `in lower case unless ${language} writes it with a capital, as for a proper name`;

  const noteItems = [
    hasSentence
      ? `The sentence from the text, copied word for word as given, followed by its given ${reader} translation in round brackets. Always the first line.`
      : null,
    `How the word is used, where field 2 alone does not say it: register, region, the construction it typically appears in (a preposition, a reflexive use, a pronoun or case it takes), a false friend. One line, only what a learner needs. Never describe the grammar of the form on the card or in the sentence - which person, tense, number or case it is: the card is about the word, not about one form of it.`,
    `One or two further short, natural ${term} sentences, each followed by its ${reader} translation in round brackets on the same line, showing a typical combination or, where field 2 has one, its second sense. Keep them at the reader's level.`,
  ].filter(Boolean);

  return [
    `You improve a vocabulary flashcard for a reader whose own language is ${reader} and who is learning ${term} at level ${level}.`,
    "",
    "The card has three fields. Rewrite all three, correct what is wrong, and keep what is right.",
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
    "",
    `FIELD 3 - the explanation, written in ${reader} apart from the ${term} sentences. Plain text: no headings, no bullets, no numbering, no markdown. A blank line between items. In this order, leaving out what does not apply:`,
    ...noteItems.map((item, index) => `${index + 1}. ${item}`),
    ...(spelling ? ["", spelling] : []),
    "",
    "Answer in exactly this shape and nothing else:",
    "<field 1>",
    "<field 2>",
    "---",
    "<field 3>",
    "The angle brackets mark the fields. Do not write them.",
  ].filter((line) => line !== null).join("\n");
}

export function improveCardInput({ term, reader, card }) {
  const context = card.context || {};
  return [
    `Field 1 (${term}): ${card.term || ""}`,
    `Field 2 (${reader}): ${card.meaning || ""}`,
    `Field 3: ${String(card.note || "").trim() || "-"}`,
    context.sentence ? `Sentence from the text (${term}): ${context.sentence}` : "There is no sentence from a text.",
    context.sentence && context.translation ? `Its ${reader} translation: ${context.translation}` : null,
  ].filter(Boolean).join("\n");
}

/* The word on a flashcard, the way a dictionary of its language names it —
   asked of each side of an improved card on its own, after the card is
   written.

   A noun learned without its article is learned without its gender, and
   gender is knowledge, not spelling. Asked inside the prompt above, both
   models put articles in front of verbs and phrases, and the local one turned
   verbs into nouns to have something to put one in front of; asked alone,
   measured, it is right for every noun and leaves everything else alone. */
export function headwordPrompt({ language }) {
  return [
    `You write one ${language} word or short phrase as the headword of a ${language} dictionary entry.`,
    "",
    "RULES:",
    `1. If it is a noun, put its definite article in front, in the singular, the way a ${language} dictionary or a learner's vocabulary list names the noun.`,
    "2. If it is not a noun - a verb, an adjective, an adverb, a phrase - leave it exactly as it is.",
    `3. Capitalise it exactly as ${language} requires, and change nothing else: same word, same spelling.`,
    "4. Answer with the headword alone: no explanation, no quotation marks, no second line.",
  ].join("\n");
}

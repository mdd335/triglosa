/* Finding the same difficult words again in both translations.

   The panels are labelled in the user line, so the prompt names no language
   of its own. Its examples were Spanish with German and English answers and
   are gone with the rest of them: a schematic line shows the shape of an
   answer without putting a language into the question. */

export function alignWordsPrompt() {
  return [
    "You align words between a text and its two translations.",
    "",
    "HARD RULES:",
    "1. Output one line per given word, in the given order, exactly: <original> | <A> | <B>",
    "2. Copy the words EXACTLY as they appear in that translation - same spelling, same capitalisation. Never invent, never inflect, never translate yourself.",
    "3. If a translation renders the word with several words, join them with a plus sign.",
    "4. Only the words carrying the meaning. No articles, no auxiliaries, unless they belong to the term itself.",
    "4a. Each original word gets its own words. Never map two different original words to the same word of a translation.",
    "4b. A translation often restructures the sentence - follow the meaning, not the position.",
    "5. If a translation does not render the word at all, write a single hyphen for that field.",
    "6. <original> repeats the given word unchanged. <A> holds words out of the text labelled A, <B> words out of the text labelled B, and their languages change from request to request.",
    "7. The angle brackets mark the fields. Do not write them.",
    "8. No numbering, no bullets, no quotation marks, no extra text.",
  ].join("\n");
}

/* One translation instead of two.

   It is the two-translation question with the second column taken out, down to
   the wording of the rules that survive.

   Asking the two-column question with one translation named twice was the
   alternative, and it costs a column of answers nobody reads. */
export function alignWordsSinglePrompt() {
  return [
    "You align words between a text and its translation.",
    "",
    "HARD RULES:",
    "1. Output one line per given word, in the given order, exactly: <original> | <A>",
    "2. Copy the words EXACTLY as they appear in the translation - same spelling, same capitalisation. Never invent, never inflect, never translate yourself.",
    "3. If the translation renders the word with several words, join them with a plus sign.",
    "4. Only the words carrying the meaning. No articles, no auxiliaries, unless they belong to the term itself.",
    "4a. Each original word gets its own words. Never map two different original words to the same word of the translation.",
    "4b. A translation often restructures the sentence - follow the meaning, not the position.",
    "5. If the translation does not render the word at all, write a single hyphen for that field.",
    "6. <original> repeats the given word unchanged. <A> holds words out of the text labelled A, whose language changes from request to request.",
    "7. The angle brackets mark the fields. Do not write them.",
    "8. No numbering, no bullets, no quotation marks, no extra text.",
  ].join("\n");
}

/* The user line carries the labels. Their languages change from request to
   request, which rule 6 says out loud. */
export function alignWordsInput({ sourceName, aName, bName, text, aText, bText, words }) {
  return [
    `Original (${sourceName}): ${text}`,
    `A (${aName}): ${aText}`,
    ...(bName ? [`B (${bName}): ${bText}`] : []),
    `Words: ${words.join(", ")}`,
  ].join("\n");
}

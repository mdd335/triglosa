/* The two questions about the verbs of a whole text, and the one that maps
   them onto the translations.

   The first two are written in English whatever the languages are, name both
   of them outright, and take the persons and the tense names from the
   language's own grammar table. They carry no examples: phase 6 measured
   that a model imitates the language of an example more reliably than it
   follows a rule, and every case of a Spanish tense under a text that was
   not Spanish came from the examples that used to stand here — 20 of them
   over four models, against none without. Naming the tenses of the text's
   own language closes the mirror image, where a bare prompt answers in the
   reader's language instead.

   The third one, the alignment, is generic for the same reason, and was the
   last place a Spanish sentence stood. It asks for words copied out of two
   translations that are in front of the model, and what it answers is checked
   against those translations before anything is drawn — so a schematic line
   carries the shape of an answer, and no sentence has to.

   Step one only finds the forms, step two annotates the ones chosen in
   between. Splitting them was measured: the selection sits on the critical
   path, and a heavier single prompt pulls the model away from the forms. */

import { languagePack } from "../languages/index.js";
import { withArticle } from "../text.js";

/* Step one: the bare list of forms. */
export function findVerbsPrompt({ source }) {
  return [
    `You extract verb forms from a ${source} text. Nothing else.`,
    "",
    "RULES:",
    "1. Output ONLY the verb forms, one per line, in the exact order they appear in the text.",
    "2. Copy each form exactly as written, including capitalisation and accents.",
    "3. Include every verb form: conjugated verbs, infinitives, participles, gerunds, verbs with attached pronouns, and the forms of to be and to have.",
    "4. A compound or periphrastic form is ONE line and includes its auxiliary.",
    "5. Include a reflexive or object pronoun that belongs to the verb.",
    `6. Where ${source} pulls one verb apart - a separable particle, an auxiliary standing far from its participle - give the parts in the order the text has them, joined by a plus sign: "part + part". Never invent the contiguous form.`,
    "7. Only actual verb forms. A noun or an adjective derived from a verb is not a verb, however verbal it looks. If a word carries an article or a plural ending, it is a noun. Output nothing rather than invent a verb for it.",
    "8. Work through the sentence from beginning to end. Do not stop early, do not jump ahead.",
    "9. If the text holds no verb form at all, output nothing.",
    "10. No numbering, no translations, no explanations, no empty lines.",
  ].join("\n");
}

/* Step two: choose the forms worth a row, then form | infinitive | meaning |
   person | tense.

   The choice is the model's. It used to be made in code before this call,
   from word endings or simply from the order of the text, and a table of
   "comunicamos", "effettuare" and "sia" left out subsanar, decurtato and
   borbottava — how hard a verb is to a reader is a question about the verb,
   and only the model knows verbs. It costs no call: this one was being made
   anyway, and it still answers three lines.

   "At most three" was measured and lost: the local model took it as leave to
   answer one or two, and covered fewer hard verbs than the heuristic it
   replaced. "The three hardest, or all of them" keeps its rows and still
   moves the auxiliaries to the back.

   Rule 7 is the one that closes the leak, and it needs the tense list beside
   it: told only to write the tense in the language of the text, a model
   reaches for the nearest name it knows, which is the reader's. */
export function annotateVerbsPrompt({ source, reader, level, tenses, persons }) {
  const own = source === reader;
  return [
    own
      ? `You choose and annotate the ${source} verb forms worth explaining to ${withArticle(reader)} reader.`
      : `You choose and annotate the ${source} verb forms worth explaining to ${withArticle(reader)} learner${level ? ` at level ${level}` : ""}.`,
    "",
    "HARD RULES:",
    own
      ? "1. Of the given forms take THE THREE a native speaker would most likely have to look up, or all of them where three or fewer are given: rare, literary, regional or technical verbs first. Output one line per form taken, in the given order, exactly:"
      : "1. Of the given forms take THE THREE hardest for this learner, or all of them where three or fewer are given. Hardest means: a rare, idiomatic, colloquial or technical verb, an irregular form, a tense learned late. An auxiliary or a copula on its own, or a very common verb in a plain tense, is taken only when nothing harder is left. Output one line per form taken, in the given order, exactly:",
    "<form> | <infinitive> | <meaning> | <person> | <tense>",
    "2. <form> = copy the given form unchanged, plus sign and all.",
    `3. <infinitive> = the form this verb is listed under in ${withArticle(source)} dictionary - the infinitive where ${source} has one, and whatever ${source} uses as its citation form where it does not. It must be a real ${source} verb: if the given form is not a verb at all, skip that line entirely rather than build one from a noun.`,
    "3a. Carry a reflexive pronoun into the citation form only where the given form actually has one.",
    `4. <meaning> = one or two ${reader} infinitives, no article, no explanation, the meaning fitting THIS sentence first. Give a second one only where the verb means something genuinely different in another context - if the two could be swapped without changing what is meant, they are synonyms, and one is enough.`,
    `5. <person> = exactly one of: ${persons}. Never a name and never a noun.`,
    `6. <tense> = what ${source} grammar itself calls this tense, written in ${source}: ${tenses}`,
    own
      ? `7. Every field is written in ${source}, and never in any other language.`
      : `7. <person> and <tense> are always written in ${source}, never in ${reader} and never in any third language. <meaning> is the only field written in ${reader}.`,
    "8. The angle brackets mark the fields. Do not write them.",
    "9. No numbering, no bullets, no quotation marks, no extra text.",
  ].join("\n");
}

/* Rule 5a of both alignment prompts. It named four Spanish periphrases, which
   under any other source language read "a Russian periphrasis - llevar +
   gerundio" — not an example in the wrong language but a plain untruth about
   the language being read. The point the rule makes does not depend on the
   list, and every language gets it. */
function periphrasisRule(source) {
  return `5a. A hyphen is a correct answer and often the only correct one. A ${source} periphrasis - two or more words carrying one verbal meaning between them - is usually rendered by ONE verb in the translation. Give that verb to the form carrying the meaning and a hyphen to the other. Do NOT split one translated verb across two lines.`;
}

/* Step three: the same verbs found again in both translations. a and b are
   the two translated panels, and their languages change from run to run. */
export function alignVerbsPrompt({ source, a, b, fieldSource, fieldA, fieldB }) {
  return [
    `You align verbs between a ${source} sentence and its ${a} and ${b} translation.`,
    "",
    "HARD RULES:",
    `1. Output one line per given ${source} verb, exactly: ${fieldSource} | ${fieldA} | ${fieldB}`,
    "2. Copy the words EXACTLY as they appear in the translation - same spelling, same capitalisation. Never invent, never inflect, never translate yourself.",
    `3. If the verb is split in a translation (${a} separable verbs, auxiliary far from participle), give the parts separated by a plus sign.`,
    "4. Only the verb words themselves. No subjects, no objects, no articles, no adverbs.",
    `4a. Each ${source} verb gets its own words. Never map two different ${source} verbs to the same word of a translation.`,
    `4b. Every verb comes with its ${a} meaning in brackets. Use it as the anchor: find the words in each translation that carry THAT meaning, not the nearest auxiliary. A translation often restructures the sentence - follow the meaning, not the position.`,
    "5. If you cannot find it in a translation, write a single hyphen for that field.",
    periphrasisRule(source),
    `5b. The same verb form often occurs several times in a translation, in different clauses. Only the occurrence in the clause that corresponds to the ${source} verb counts. If that clause has no separate verb, write a hyphen. Never take a matching form from another clause just to fill the field - a wrong occurrence is worse than a hyphen.`,
    `6. The ${fieldSource} field repeats the given ${source} verb unchanged. The ${fieldA} and ${fieldB} fields hold words copied out of the two translations, each in its own language.`,
    "7. No numbering, no bullets, no quotation marks, no extra text.",
  ].join("\n");
}

/* One translation instead of two.

   It is the two-translation question with the second column taken out: the same
   rules in the same order. Rule 5a keeps its point: a periphrasis is usually rendered by one verb, and
   the form not carrying the meaning gets a hyphen. */
export function alignVerbsSinglePrompt({ source, a, fieldSource, fieldA }) {
  return [
    `You align verbs between a ${source} sentence and its ${a} translation.`,
    "",
    "HARD RULES:",
    `1. Output one line per given ${source} verb, exactly: ${fieldSource} | ${fieldA}`,
    "2. Copy the words EXACTLY as they appear in the translation - same spelling, same capitalisation. Never invent, never inflect, never translate yourself.",
    `3. If the verb is split in the translation (${a} separable verbs, auxiliary far from participle), give the parts separated by a plus sign.`,
    "4. Only the verb words themselves. No subjects, no objects, no articles, no adverbs.",
    `4a. Each ${source} verb gets its own words. Never map two different ${source} verbs to the same word of the translation.`,
    `4b. Every verb comes with its ${a} meaning in brackets. Use it as the anchor: find the words in the translation that carry THAT meaning, not the nearest auxiliary. A translation often restructures the sentence - follow the meaning, not the position.`,
    "5. If you cannot find it in the translation, write a single hyphen for that field.",
    periphrasisRule(source),
    `5b. The same verb form often occurs several times in a translation, in different clauses. Only the occurrence in the clause that corresponds to the ${source} verb counts. If that clause has no separate verb, write a hyphen. Never take a matching form from another clause just to fill the field - a wrong occurrence is worse than a hyphen.`,
    `6. The ${fieldSource} field repeats the given ${source} verb unchanged. The ${fieldA} field holds words copied out of the translation, in its own language.`,
    "7. No numbering, no bullets, no quotation marks, no extra text.",
  ].join("\n");
}

/* The column names of the aligned table. They were measured as Spanish,
   German and English words, and the model writes them back — so where a
   language pack names its columns, that name is used, and otherwise the
   English name of the language stands in. */
export function fieldName(code) {
  return languagePack(code).columnName || languagePack(code).englishName.toLowerCase();
}

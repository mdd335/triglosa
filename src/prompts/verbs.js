/* The two questions about the verbs of a whole text. Where they stand in
   the translations is the word aligner's (run.js, run eighty-four).

   The first two are written in English whatever the languages are, name both
   of them outright, and take the persons and the tense names from the
   language's own grammar table. They carry no examples: it was measured
   that a model imitates the language of an example more reliably than it
   follows a rule, and every case of a Spanish tense under a text that was
   not Spanish came from examples in this prompt — 20 of them over four
   models, against none without. Naming the tenses of the text's
   own language closes the mirror image, where a bare prompt answers in the
   reader's language instead.

   Step one only finds the forms, step two annotates the ones chosen in
   between. Splitting them was measured: the selection sits on the critical
   path, and a heavier single prompt pulls the model away from the forms. */

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

   The choice is the model's. Made in code before this call, from word
   endings or simply from the order of the text, it gave a table of
   "comunicamos", "effettuare" and "sia" that left out subsanar, decurtato
   and borbottava — how hard a verb is to a reader is a question about the verb,
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

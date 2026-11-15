/* The questions asked about the one word a reader clicked.

   One path for all eight languages. Every prompt names the language of the
   text and the language the reader gets their answer in, and every field
   carries a rule saying which of the two it is written in. No examples: the
   examples these four carried were Spanish with German answers, which is the
   mechanism behind the leak rather than a cure for it — measured
   on the word and verb prompts, and the same shape of fault here.

   Why the abbreviation gets a question of its own instead of a rule inside
   the meaning prompt: measured on "currando", the most sensitive case of
   that prompt, a rule about expanding abbreviations cost the infinitive 0 of
   3, and two examples for it likewise 0 of 3 — each of them ALONE, against 3
   of 3 without them. Anything that makes the enumeration in rule 2 heavier
   pulls the model away from the verb form. A separate question costs none of
   that, sees only the sentence and the abbreviation, and can be as long as
   it needs to be. */

import { languagePack } from "../languages/index.js";

/* What the term means. The one prompt everything else is measured against.

   inText says whether the term actually stands in the text that comes with
   it. It does for a word the reader clicked, and it does NOT for one reached
   through another word's synonyms — there is no text then, and every sentence
   about "here" is about a place the word never was.

   That distinction is also where the note's own rule comes from. Measured on
   41 words in eight languages: with the note asked for
   what the term means HERE, 46 % of the explanations of a clicked word talked
   about the sentence rather than the word — "bezieht sich hier auf eine
   formelle juristische Verzögerung im Verfahrensablauf" says nothing about
   the word at all — and for a word that came through a synonym it was 63 %,
   which is worse *and* every one of them wrong. The reader has the text in
   front of them; what they clicked a word for is the word. */
/* The reader's language said once more, as the last line of the input rather
   than as one more rule — only when a question is asked again because its
   note came back in the text's language (askedInReaderLanguage in ask.js).
   Between close languages the cloud model does that although the rules name
   the reader's language twice. See the twentieth run. */
export function writtenIn(reader, fields) {
  return `Write ${fields} in ${reader}.`;
}

export function meaningPrompt({ source, reader, inText = true }) {
  const own = source === reader;
  return [
    inText
      ? `A reader picked ONE word or phrase out of a ${source} text. Explain the term itself.`
      : `A reader asked about ONE ${source} word or phrase on its own. There is NO text: they reached it through another word's synonyms. Explain the term itself.`,
    "",
    "HARD RULES:",
    "1. Reply with EXACTLY ONE line, exactly: <base> | <meaning> | <note>",
    `2. <base>: ONLY for a verb form - a participle and a gerund count as one - its INFINITIVE in ${source}, in the plain form a ${source} dictionary lists it under. If the term is a whole phrase built around a verb, give the infinitive of THAT verb; keep the words belonging to the verb itself, drop subject and articles. For anything that is not a verb - a noun, an adjective, a name, an abbreviation - repeat the term EXACTLY as given, typos included. Never its singular, never any other base form: a plural noun stays plural, a misspelling stays misspelled.`,
    inText
      ? `3. <meaning>: its ${reader} equivalent AS USED HERE - the sense this text gives it, not the most common one. No article. The TERM ALONE: if it stands inside a longer expression, render only the term, never the whole expression. For a verb form, a ${reader} infinitive, never a conjugated form.`
      : `3. <meaning>: its ${reader} equivalent - the sense the word carries on its own, the one a dictionary names first. No article. The TERM ALONE: if it is part of a longer expression, render only the term, never the whole expression. For a verb form, a ${reader} infinitive, never a conjugated form.`,
    `3a. The reader is learning vocabulary, not only reading this text. Where the term has another common use that ${reader} renders with a DIFFERENT word, add that word too - two in all at most, separated by a comma.`,
    inText
      ? "3b. Order: the one fitting THIS text first, then the most common others."
      : "3b. Order: the most common first.",
    `3c. TEST every addition: does it name a use or sense of the term that the words before it do not cover? A ${reader} word meaning the same as one already given - a synonym, a stronger or weaker word, the same word for another gender - is padding: leave it out.`,
    "3d. A technical term, a proper name and a term of several words almost never carry a second meaning. Give ONE.",
    /* A word of the reader's own language: what it refers to, not the word
       (run 80). */
    own
      ? `4. <note>: the explanation, in ${reader}, 6 to 11 words. Explain what the TERM refers to, not the word: for a thing, a place, a person, an event or an institution, the facts that matter about it; for an action, a quality or an idea, what it means in plain words. Never its register, its field or how it differs from other words: the reader knows the language. Only facts you are sure of.`
      : `4. <note>: the explanation, in ${reader}, 6 to 11 words. Explain the TERM: what kind of thing it is, the domain it belongs to, its register, its connotation, how it differs from a plainer word - what <meaning> does not already say.`,
    inText
      ? "4a. NOT the sentence. The reader can read that themselves: no retelling of this text, no saying who or what it happens to be about here, and no \"here\" at all unless the term would be misread without it. Where the context genuinely decides the sense, ONE short clause at the end carries it."
      : "4a. There is no text and no situation. Never write \"here\", never put the word into a text, never invent a context for it.",
    "5. Explain the word you were given, not a similar-looking word in another language.",
    "6. If you genuinely do not know the word, write UNKNOWN as <note> and invent nothing.",
    own
      ? `7. All three fields are written in ${source}, and never in any other language.`
      : `7. <base> is written in ${source}. <meaning> and <note> are written in ${reader}, never in ${source} and never in any third language.`,
    /* Measured on the local model: as a rule of its own next to rule 4 this
       cost the base form in rule 2 seven items of 120; at the end of the list
       it costs three, and still takes the grammar labels out of the note —
       a third of the notes had been "Verb, past tense" and nothing else. */
    "7a. In <note>, never name the part of speech or the grammatical form - the reader is shown those already. Never open with \"this is\" or \"the word\": begin with the substance.",
    "8. The angle brackets mark the fields. Do not write them.",
    "9. No numbering, no bullets, no quotation marks, no extra text, no second line.",
  ].join("\n");
}

/* A passage — a clause or a sentence, see isPassage — is asked one question
   instead of four: what exactly it says (where it stands in the other panels
   is the word aligner's). The meaning prompt asks about ONE term, and handed a sentence it
   chooses a piece of it: "Se trata de ocho esculturas que representan a
   canes…" came back as "es handelt sich um" on the cloud model and as
   "darstellen" on the local one, with a note about that piece.

   The text goes with it, because a piece of a sentence translated on its own
   is a different piece: "stiegen die Mieten weiter an" became a question on
   both models, and the local one turned an idiom into its opposite. */
export function passagePrompt({ source, target }) {
  return [
    `A reader marked a PASSAGE - several words, a clause or a sentence - in a ${source} text and wants to know exactly what those words say.`,
    "",
    "HARD RULES:",
    `1. Reply with the ${target} translation of the Passage and nothing else, on ONE line.`,
    "2. Translate EXACTLY the Passage: every word of it, and nothing outside it. Never complete it into a full sentence, never add words from the text around it, never leave a part of it out.",
    "3. The Text is there so the Passage is understood as it is meant in it: keep its tense, its person and the sense its words have there. A piece of a sentence stays a piece, and a statement stays a statement. An idiom is rendered by what it means, not word for word.",
    `4. Written in ${target}, never in ${source} and never in any third language.`,
    "5. No quotation marks, no explanation, no note, no second line.",
  ].join("\n");
}

/* Person and tense — and, since a reader may pick two words, whether the term
   is one verb form at all.

   That second job is new and it is the reason this question is worth its
   tokens twice over. The meaning prompt answers a phrase built around a verb
   with the infinitive of that verb, which is right for what THAT question is
   for and useless as a test: a verb standing next to a word it has nothing to
   do with answers just as confidently as a compound tense does. Rule 2 of the
   meaning prompt is also the one field measured to be ruined by any extra
   clause, so the test cannot live there. It lives here, in a question that is
   asked in parallel anyway, sees the same term, and already had to say when
   something is not a verb form.

   Rule 5 is the whole of it, and it is written in categories rather than in
   words of any one language: what counts as one form is a construction spread
   over several words, what does not is a verb plus anything that is not part
   of the form. Nothing in it is true of German or Spanish and false of
   Arabic. */
export function verbFormPrompt({ source, reader, tenses, persons }) {
  const own = source === reader;
  return [
    `A reader picked ONE ${source} verb form out of a text. Name its person and tense.`,
    "",
    "HARD RULES:",
    "1. Reply with EXACTLY ONE line, exactly: <person> | <tense>",
    `2. <person> = exactly one of: ${persons}. Never a name and never a noun.`,
    `3. <tense> = what ${source} grammar itself calls this tense, written in ${source}: ${tenses}`,
    "4. Judge the FORM, not the sentence around it: the person is the one the ending carries. Only where the form carries no person at all - a past tense marked for gender and number alone - does the subject in the text decide.",
    "5. The term has to be ONE verb form and nothing besides. A form spread over several words is still one form: an auxiliary with its participle or infinitive, a reflexive or other pronoun belonging to the verb, a particle or prefix written apart from its verb, a negation carried by the form itself. The tense is then the one of the whole construction.",
    "5a. A verb standing next to a word that is not part of the form is NOT one form: its subject, its object, an article, a preposition, an adverb, a second verb of its own. Neither is a term with no verb in it at all.",
    `6. In every case that is not one ${source} verb form, reply with a single hyphen and nothing else. Judge what you were given, not what a part of it could be on its own.`,
    own
      ? `7. Both fields are written in ${source}, and never in any other language.`
      : `7. Both fields are written in ${source}, never in ${reader} and never in any third language.`,
    "8. The angle brackets mark the fields. Do not write them.",
    "9. No numbering, no quotation marks, no extra text, no second line.",
  ].join("\n");
}

/* What kind of word it is — noun, adjective, and for a noun its number and
   gender — shown beside a clicked word and a term the way person and tense
   stand beside a verb.

   A question of its own rather than a field in the meaning prompt, whose base
   form is the field measured to suffer from any extra clause. The answer is
   chosen from fixed English names and put into the reader's language by the
   window, so no language can leak into it and anything off the list is
   thrown away: nothing at all is a better answer than a wrong one, and the
   rules say so. The genders come from the pack; a language without any is
   never asked for one. */
export const WORD_CLASSES = [
  "noun", "proper noun", "adjective", "adverb", "pronoun", "preposition",
  "conjunction", "article", "numeral", "interjection", "verb",
];

export function wordClassPrompt({ source, genders = [], inText = true }) {
  return [
    inText
      ? `A reader picked ONE ${source} word out of a text, possibly together with its article. Name its word class.`
      : `A reader asked about ONE ${source} word on its own, possibly together with its article. Name its word class.`,
    "",
    "HARD RULES:",
    "1. Reply with EXACTLY ONE line, exactly: <class> | <number> | <gender>",
    `2. <class> = exactly one of: ${WORD_CLASSES.join(", ")}.${inText ? " Judge the word as it is used in THIS text." : ""}`,
    "3. <number> = singular or plural, only for a noun, a pronoun or an adjective whose form shows it. Otherwise a single hyphen.",
    genders.length
      ? `4. <gender> = only for a noun: its grammatical gender, exactly one of: ${genders.join(", ")}. Otherwise a single hyphen.`
      : `4. <gender> = a single hyphen. ${source} nouns have no grammatical gender.`,
    "5. An article in front of the word, or a preposition or article written onto it, belongs to it: judge the word itself.",
    "6. If the term is several words that are not one word with its article, or if you are not sure, reply with a single hyphen and nothing else. A wrong answer is far worse than none.",
    "7. Only the English names listed above. The angle brackets mark the fields. No quotation marks, no extra text, no second line.",
  ].join("\n");
}

/* The expansion, asked in place of the synonyms when the word is an abbreviation. */
export function abbreviationPrompt({ source, reader }) {
  const own = source === reader;
  return [
    `A reader picked an ABBREVIATION out of a ${source} text. Spell it out.`,
    "",
    "HARD RULES:",
    "1. Reply with EXACTLY ONE line, exactly: <expansion> | <translation>",
    `2. <expansion>: the words the letters stand for, in ${source}, written out in full. Not a translation, not a description of the thing - the words behind the letters.`,
    own
      ? "3. <translation>: a single hyphen. The expansion is already in the reader's language."
      : `3. <translation>: the ${reader} rendering of <expansion>. If <expansion> is a name nobody translates, write a single hyphen there.`,
    "4. If you cannot place the letters, reply with a single hyphen and nothing else. A confidently wrong expansion is the worst possible answer, far worse than none.",
    "5. If the word is no abbreviation at all, the same: a single hyphen and nothing else.",
    "6. Never repeat the abbreviation itself, never explain what the thing is, never add a second line.",
    "7. The angle brackets mark the fields. Do not write them.",
  ].join("\n");
}

/* Words that could stand in its place. Without a text — a synonym of a
   synonym — the two rules that test a candidate against "this sentence" have
   nothing to test against, so they ask the question they can answer. */
export function synonymPrompt({ source, inText = true }) {
  return [
    inText
      ? `A reader picked ONE word or phrase out of a ${source} text. Name synonyms for it.`
      : `A reader asked about ONE ${source} word or phrase on its own. Name synonyms for it.`,
    "",
    "HARD RULES:",
    "1. Reply with EXACTLY ONE line: <syn> | <syn> | <syn>",
    `2. Answer in ${source}, the language of the Word, always. Never translate it, and never answer in the reader's language. The language of these instructions means nothing here - only the language of the Word counts.`,
    "3. At most three, and fewer is better. One good synonym beats three weak ones. Never pad to reach three.",
    inText
      ? "4. The sense the Word carries in THIS text, not another sense it has elsewhere."
      : "4. The sense the Word carries on its own, the most common one.",
    inText
      ? "5. TEST every candidate: put it into this very sentence in place of the Word. Does the sentence still say the same thing? If not, drop it."
      : "5. TEST every candidate: could it stand in place of the Word in an ordinary sentence without changing what is said? If not, drop it.",
    "6. Never the Word itself and never an inflected form of it. Never a broader or a narrower term - a hypernym is not a synonym.",
    `7. Dictionary form: a verb as the ${source} infinitive, a noun in the singular, an expression in its citation form.`,
    "8. A synonym is a word or a fixed expression that could stand in the text. Never a definition, never a paraphrase, never an explanation.",
    "9. If there is no real synonym - a proper name, a number, a technical term without one - reply with a single hyphen and nothing else.",
    "10. The angle brackets mark the fields. Do not write them.",
    "11. No numbering, no bullets, no quotation marks, no extra text, no second line.",
  ].join("\n");
}

/* The tense names a language uses. All eight packs carry them; without a
   list the model is asked for the usual name in that language, which is what
   the rule already said in words. */
export function tenseNames(code) {
  const names = languagePack(code).grammar?.tenses;
  return names ? names.join(", ") : "usual name in that language";
}

/* The same question for the grammatical person. A fixed Spanish list in the
   two verb prompts puts "ellos/ustedes" under an English sentence and "tú"
   under a German one — measured on the everyday corpus, the single largest
   source of wrong output in the whole run.

   The four form names stay, because they are grammatical categories rather
   than pronouns and nothing in the code reads them. They are English because
   the prompt around them is: Spanish names would put four Spanish words in
   the middle of a Russian question, in the very prompt whose leak was
   measured shut. */
const FORM_PERSONS = "infinitive, gerund, participle, impersonal";

export function personNames(code) {
  const names = languagePack(code).grammar?.persons;
  const persons = names ? names.join(", ") : "the pronouns of that language";
  return `${persons} - or ${FORM_PERSONS}`;
}

/* The longer explanation of a picked word, asked for on a click and only
   then. The short note says what the term is in a line; this is the answer a
   reader would get from asking a knowledgeable person about the word — the
   idea behind it, where it is used, what it is not — in one paragraph.

   It is told what the short answer already said, so it goes past it rather
   than repeating it, and the reader's level decides how plain it is. The
   level is absent where the word is in the reader's own language.

   In the reader's own language the paragraph is about the thing, not the
   word: register, situations and the words nearest to it told a native
   reader what they knew, and an example sentence showed them a word they
   use (run 80). No example comes with it there; the button for one stays.
   The rules are numbered as they stand, so a learner's question reads as
   it always did. */
export function explainMorePrompt({ source, reader, level, inText = true, spelling, hasExamples = false }) {
  const own = source === reader;
  const rules = [
    `Write ONE paragraph of 40 to 70 words in ${reader}, on a single line. No heading, no list, no markdown.`,
    own
      ? "Explain what the TERM refers to, the way a knowledgeable person answers when asked about it. For a name - a place, a person, an event, an institution - or a thing or idea of a particular field: the facts and background worth knowing - what it is, where and when, how it works, why it matters. For an ordinary verb, adjective or noun: what it means and involves in general, never the people, places or events of the text. The main facts before details: a figure, a date or a rule only where it is well known. Not the word: never its register, the situations it is used in or how it differs from similar words - the reader knows the language."
      : "Explain the TERM itself, the way a knowledgeable person explains a word when asked: what it means, the idea or picture behind it, in which situations and registers it is used, and how it differs from the words closest to it.",
    ...(own
      ? ["Write the paragraph and nothing else: no example sentence."]
      : [
        "Then end the paragraph and write ONE example sentence, on a NEW line starting with the word EXAMPLE, in this shape and nothing else. Write a second such line only where the term has a second use so different that one sentence cannot show it:\n" +
          `EXAMPLE: <kind> | <a short natural ${source} sentence> | <its ${reader} translation>`,
        `<kind> is ONE word in ${reader} - two only where one will not do - saying what kind of use the sentence shows: the register, the situation or which sense of the term it is. Leave it empty for an ordinary use of the term, and keep the two separators.`,
        hasExamples
          /* Only where there are any: a rule about examples already shown is a
             clause that costs a small model something and answers nothing in the
             ordinary case, where the reader has asked for no sentence yet. */
          ? "Every sentence is new - never the sentence from the text, and never one of the sentences already shown to the reader or a variation of one - and short: at most 9 words."
          : "Every sentence is new - never the sentence from the text - and short: at most 9 words.",
      ]),
    "The paragraph is read straight after the short note, as its continuation: add what the note leaves out. Never restate what the note or the meaning already says, not even in other words, and do not open by defining the term again.",
    own
      ? "Write for an adult reader of the language."
      : "Match the level: plain words for a beginner, nuance for an advanced reader, and sentences a reader at that level can read.",
    inText
      ? "The reader has the text in front of them: never retell it, never say what the term means in it, never write \"in your sentence\" or \"here\"."
      : "There is no text: never write \"here\" and never invent a context for the word.",
    "Never make the part of speech or the grammatical form the explanation.",
    own
      ? "If you do not know the term, say so in one sentence and invent nothing. State only facts you are sure of; leave out the rest."
      : "If you do not know the term, say so in one sentence, write no example and invent nothing.",
    own
      ? `Everything is written in ${reader}.`
      : `Everything is written in ${reader}, apart from the term itself and the ${source} example sentences.`,
  ];
  return [
    inText
      ? `A reader picked ONE word or phrase out of a ${source} text and has read a short note on it. They asked for more.`
      : `A reader asked about ONE ${source} word or phrase on its own and has read a short note on it. They asked for more.`,
    own
      ? `${source} is the reader's own language.`
      : `The reader's own language is ${reader}; they are learning ${source} at level ${level}.`,
    "",
    "RULES:",
    ...rules.map((rule, i) => `${i + 1}. ${rule}`),
    ...(spelling ? [spelling] : []),
  ].join("\n");
}

/* One more example sentence, on a button of its own under the longer
   explanation. A reader who asks for another one has read the ones already
   there, so the only useful answer is one that is unlike them, and the ones
   already shown therefore go into the question; the level decides both the
   words and how long the sentence may be.

   Unlike them in how the sentence is built, and not only in what it shows:
   asked for "another situation, another register, or another sense", both
   models kept the frame and swapped the nouns ("That song is emblematic of
   the nineties") and reached for "colloquial" again and again, not being
   shown the kinds already used. Told the kinds and the frame, and asked with
   a higher temperature, rows with two alike sentences went from 11 of 21 to
   4 on the cloud model. A verb comes as its base form and may take any tense
   or person: given the form from the text, every sentence stood in that one. */
export function exampleSentencePrompt({ source, reader, level, spelling }) {
  const own = source === reader;
  return [
    `A reader is learning about ONE ${source} word or phrase and asked for one more example sentence.`,
    own
      ? `${source} is the reader's own language.`
      : `The reader's own language is ${reader}; they are learning ${source} at level ${level}.`,
    "",
    "RULES:",
    "1. Answer with ONE line and nothing else, in this shape:",
    own
      ? `EXAMPLE: <kind> | <the ${source} sentence> |`
      : `EXAMPLE: <kind> | <the ${source} sentence> | <its ${reader} translation>`,
    `2. <kind> is ONE word in ${reader} - two only where one will not do - saying what kind of use the sentence shows: the register, the situation or which sense of the term it is. Leave it empty for an ordinary use of the term, and keep the two separators.`,
    "3. The sentence holds the TERM itself, in whatever form the sentence needs. A verb may stand in any tense, person or mood, and a different one is a good way to differ.",
    "4. It differs from every example already shown in what it shows - another situation or another sense of the term - AND in how it is built: the term in another role or place in the sentence, another construction, other opening words. The same sentence frame with other words filled in is the same example.",
    "4a. The kind must be true of the sentence. Never a kind already shown unless the sentence really is of that kind, and never an ordinary sentence labelled colloquial or formal to make it look different.",
    own
      ? "5. A natural sentence an adult reader of the language would meet."
      : "5. Match the level: words and sentence shapes a reader at that level can read.",
    own
      ? `5a. The sentence is written in ${source}.`
      /* The one rule this question never carried, and the only one it was
         seen to break: asked for a sentence unlike the ones already shown,
         the model wrote a German one under an English term and copied it into
         the translation field, so the row showed the same sentence twice. A
         term that is a name looks the same in both languages and is where it
         happens, which is why the rule says so. Measured over 15 answers per
         model: the cloud model 12 of 15 without it, 14 with it, the local
         model 15. Its position is not what decides — at the head of the list
         it is no better — but naming the name case is. */
      : `5a. The sentence itself is written in ${source}, never in ${reader} - also where the term is a name written the same way in both. ${reader} appears only in the translation, and the translation never repeats the sentence.`,
    "6. At most 9 words. No heading, no list, no markdown, no explanation.",
    ...(spelling ? [spelling] : []),
  ].join("\n");
}

function kindsShown(examples) {
  const kinds = [...new Set(examples.map((one) => one.kind).filter(Boolean))];
  return kinds.length ? [`Kinds already shown: ${kinds.join(", ")}`] : [];
}

export function exampleSentenceInput({ source, term, meaning, note, examples = [] }) {
  return [
    `Term (${source}): ${term}`,
    `Short note already shown: ${[meaning, note].filter(Boolean).join(" - ") || "-"}`,
    examples.length
      ? `Examples already shown:\n${examples.map((one) => `- ${one.sentence}`).join("\n")}`
      : "No example has been shown yet.",
    /* The kinds on a line of their own, not in front of each sentence: written
       there, the local model copied the shape and dropped the separator. */
    ...kindsShown(examples),
  ].join("\n");
}

export function explainMoreInput({ source, term, text, meaning, note, inText = true, examples = [] }) {
  return [
    inText ? `Text (${source}): ${text}` : null,
    `Term: ${term}`,
    `Short note already shown: ${[meaning, note].filter(Boolean).join(" - ") || "-"}`,
    examples.length
      ? `Example sentences already shown:\n${examples.map((one) => `- ${one.sentence}`).join("\n")}`
      : null,
  ].filter(Boolean).join("\n");
}

/* The longer explanation, checked line by line before it is shown. In the
   reader's own language it is about the thing and holds facts, and the cloud
   model got about one answer in twelve wrong (run 80); for a learner it is
   about the word — a sense, a register, a construction, where the word comes
   from — and an example sentence is a claim about the word too. A card's
   notes are checked the same way (run 74). Each line is judged alone, and
   only one called TRUE stands. */
export function checkFactsPrompt({ source, reader = source }) {
  if (source !== reader) {
    return [
      `You check a short explanation of a ${source} word, written in ${reader} for a learner of ${source} whose own language is ${reader}, and the ${source} example sentences that come with it.`,
      "",
      "Explanations like this are often partly invented: a sense the word does not have, a region, a construction or preposition it is said to take, an origin, a word it is said to differ from, a sentence no native speaker would say. Judge every numbered line on its own:",
      `TRUE if every detail in it is right, as a ${source} dictionary and native speakers would confirm - a remark on tone or register where native speakers would broadly agree with it, an example where a native speaker would say it so and it uses the word in a sense it has; FALSE if any detail is wrong; UNSURE if you cannot confirm every detail.`,
      "",
      "Answer with one line per numbered line and nothing else: its number, then TRUE, FALSE or UNSURE.",
    ].join("\n");
  }
  return [
    `You check a short explanation of a ${source} term, written for a reader whose own language is ${source}.`,
    "",
    "Explanations like this are often partly invented: a date, a number, a place, a name, who is in charge, a rule, a cause, a part said to belong to it. Judge every sentence on its own:",
    "TRUE if every detail in it is right, as a good reference work would confirm; FALSE if any detail is wrong; UNSURE if you cannot confirm every detail.",
    "",
    "Answer with one line per sentence and nothing else: its number, then TRUE, FALSE or UNSURE.",
  ].join("\n");
}

/* The text the term stands in, the term, and the lines to judge, numbered:
   the paragraph's sentences, then each example with its translation. */
export function checkFactsInput({ source, term, text, sentences, examples = [] }) {
  return [
    ...(text ? [`Text (${source}): ${text}`] : []),
    `Term: ${term}`,
    "",
    "Explanation:",
    ...sentences.map((sentence, index) => `${index + 1}. ${sentence}`),
    ...(examples.length ? ["", "Examples:"] : []),
    ...examples.map((one, index) =>
      `${sentences.length + index + 1}. ${one.sentence}${one.translation ? ` (${one.translation})` : ""}`),
  ].join("\n");
}

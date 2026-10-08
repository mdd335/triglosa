/* The question about the words worth explaining.

   Written in English whatever the two languages are; it names the language
   of the text, the language the reader thinks in, and the level the reader
   set for this language. Nothing in it belongs to a particular language, and
   nothing in it is an example.

   Both of those are measured rather than preferred. The run was 18 texts
   in seven languages against five models, and the two findings that shaped this file are that examples steer
   a model towards the language they are written in — 20 cases of a Spanish
   tense under a text that was not Spanish, against zero here — and that the
   restraint the calibrated prompt piled up costs coverage on every model
   measured, without buying any precision back.

   So the bar is stated once and the reader's level carries it, which is what
   the level is for. Changing that is a measurable change. */

import { languagePack } from "../languages/index.js";
import { withArticle } from "../text.js";

/* Who the reader is: their languages and how far along they are in each.
   That is the whole of it, and it is the one thing about them the question
   genuinely needs — it decides what counts as hard.

   The first language is the one they think in, so it needs no level. The
   others carry the one the reader set, on the scale every language course
   already prints on its cover. */
export function readerProfile({ languages, levels }) {
  const level = (code) => (levels || {})[code] || "B1";
  return (languages || [])
    .map((code, i) =>
      i === 0
        ? `${languagePack(code).englishName} native speaker`
        : `${languagePack(code).englishName} at ${level(code)}`)
    .join(", ") + ".";
}

/* What the reader already knows, said out loud. The level's name alone did
   not move the list: a native reader, one at C2 and one at A2 were given the
   same three items for the same plain text. */
const LEVEL_KNOWS = {
  A1: "At A1 they know only the most basic words and phrases.",
  A2: "At A2 they know the basic vocabulary of everyday life: family, home, food, shopping, work, travel, time.",
  B1: "At B1 they know the vocabulary of everyday life and familiar topics, and the most common idioms.",
  B2: "At B2 they know the general vocabulary of most topics, including many common idioms and colloquial phrases.",
  C1: "At C1 they know nearly all general vocabulary, most idioms and common colloquial speech; specialist, rare, regional and slang usage can still be new to them.",
  C2: "At C2 they know the language nearly as a native speaker does; only specialist, rare, old-fashioned or regional usage and recent slang can be new to them.",
};

const OWN_KNOWS =
  "They know its everyday and educated vocabulary, its common idioms and its colloquial speech. Words every adult meets in daily life - renting, banks, offices, shops, travel, cars, work, well-known places - are never items, even where they belong to a field.";

const LEARNER_COUNTS = [
  "- Technical and domain vocabulary, very much including everyday domains: renting, administration, contracts, medicine, finance. An ordinary-looking word carrying a fixed domain meaning is the most useful item there is.",
  "- Fixed expressions and idioms whose meaning does not follow from the single words.",
  "- Colloquial, slang and regional usage.",
  "- Cultural references and local customs a foreigner would not know.",
  "- Figurative use of otherwise plain words.",
];

/* A native reader's bar is a different one, not a higher level: the
   everyday domains that are the best items for a learner are exactly what
   a native speaker never looks up. */
const OWN_COUNTS = [
  "- Specialist vocabulary a layperson would not know: law, medicine, science, finance, a trade.",
  "- Rare, literary, old-fashioned or archaic words and expressions.",
  "- Regional or dialect usage from another region, and the slang or jargon of a particular group.",
  "- Cultural or historical references most people would not know.",
];

/* Only set internally, after an answer made of nothing but words of a
   language the reader already reads. */
const RETRY = [
  "",
  "IMPORTANT - SECOND ATTEMPT: your previous answer consisted only of words the reader already knows from another language, and those are not allowed here. Ignore them completely, as if they were not in the text. Read the sentence again and pick only words of its own language - the administrative, academic or technical vocabulary around them.",
];

/* A dictionary lookup (up to three words, see run.js) asks the same
   question for one term, the one worth explaining: the entry beside it
   gives the translations, and the note is what it adds. `lookup.inSentence`
   says the text is the sentence the looked-up words stand in (they follow
   it in the question, lookupInput), which the term may reach into only to
   complete a fixed expression.
   Without a lookup the question is the one every longer text is asked,
   word for word. */
export function wordsPrompt({ code, name, languages, levels, retry, lookup = null }) {
  const source = name || languagePack(code).englishName;
  const reader = languagePack(languages[0]).englishName;
  const level = (levels || {})[code] || "B1";
  /* A reader's own language is not a foreign one, and the whole question
     changes shape there: what is hard is what a native speaker would have to
     look up, and there is no level to speak of. */
  const own = code === languages[0];
  const beginner = !own && /^A/.test(level);

  return [
    `You help ${withArticle(reader)} reader understand ${withArticle(source)} text.`,
    own
      ? `${source} is their own language, so only what a native speaker would have to look up counts.`
      : `They speak ${reader} natively and read ${source} at level ${level} on the CEFR scale.`,
    /* Read against the level: a beginner is helped by an everyday word, and
       everybody else is not. Measured, saying ONLY-when-unclear here held the
       local model to about half its items; this wording costs it nothing on
       plain texts and keeps the cloud model off them. */
    lookup
      ? beginner
        ? "They already see dictionary translations of the words they looked up next to it."
        : "They already see dictionary translations of the words they looked up next to it, so an everyday word those render plainly is never an item."
      : beginner
      ? "They already see a full translation of the text next to it."
      : "They already see a full translation of the text next to it, so an everyday word that translation renders plainly is never an item.",
    own ? OWN_KNOWS : LEVEL_KNOWS[level] || LEVEL_KNOWS.B1,
    "",
    "WHAT COUNTS:",
    ...(own ? OWN_COUNTS : LEARNER_COUNTS),
    "- Proper names: people, products, organisations. Say who or what they are, and say so instead of inventing it where you are not sure.",
    "- Abbreviations the text does not spell out. Give an expansion only where you are sure of it: a confidently wrong one is the worst possible answer.",
    /* A lookup has no verb table beside it, and a looked-up verb form is
       often exactly what is hard: its base form, person and tense are asked
       after this (ask.js). */
    lookup
      ? "- A verb form counts like any other word: <term> is the form as the text has it, and <meaning> and <note> are about the verb itself. A fixed expression built around a verb counts as the whole expression."
      : "- NOT a single verb: verb forms have a table of their own. A fixed expression built around a verb does count.",
    "",
    "SELECTION:",
    own
      ? "- Judge difficulty against a native speaker: an ordinary word of their own language is never an item."
      : `- Judge difficulty against level ${level}, not against a beginner and not against a native speaker.`,
    /* "At most 3" alone was read as three to fill: on plain texts the cloud
       model named the market and the travel agency to a native reader. */
    lookup
      ? "- At most 1 item, the hardest. Looking words up does not make them hard: where they are ordinary vocabulary at this reader's level, the whole answer is NONE."
      : "- At most 3 items, the hardest first. Never fill the places for their own sake: where nothing in the text is new to this reader, the whole answer is NONE.",
    ...(lookup?.inSentence
      ? ["- The reader looked up only the words given as \"Looked up\". The item must contain at least one of them. It may reach into the rest of the sentence only where they belong to a fixed expression there; otherwise the sentence is context and nothing else."]
      : []),
    "",
    "FORMAT - one line per item, nothing else:",
    own || lookup ? "<term> | <meaning> | <note> | <known>" : "<term> | <meaning> | <note>",
    `- <term> is copied EXACTLY from the ${source} text: same spelling, same capitalisation, same inflected form, one contiguous piece. Never a dictionary form, never invented.`,
    `- <meaning> is the ${reader} equivalent, no article, no sentence. Where ${reader} renders the term with different words in different uses, give two, separated by a comma, the one fitting this text first - never two ${reader} words that mean the same thing. For an abbreviation, what it stands for; for a proper name, what kind of thing it is.`,
    /* Not "what the thing is here": measured over 41 explanations, that
       wording produced notes that retold the sentence instead of explaining
       the word. See the note in prompts/marked.js. And "no full sentence"
       beside "the exact sense or nuance, then the field" had the local model
       write two labels and nothing else; a short sentence is allowed,
       measured. */
    `- <note> is written in ${reader}, at most 16 words: first what the term actually means or refers to, in plain words a reader who has never met it would understand - a short sentence is fine - then the field or register after a semicolon. Never a repeat of <meaning>, never the part of speech. A field or a category alone is not a note.`,
    "- <note> explains the TERM, not the sentence. The reader has the text in front of them, so no retelling of it and no \"here\" unless the term would be misread without it.",
    /* Told not to, the cloud model still named Reisebüro and caution to a
       native reader; asked to rate them, it rated both "most", and the
       rating is what drops them (knownToReader). A learner's list is not
       rated: the extra field alone cost the local model a sixth of its
       items on dense texts. A learner's lookup is: without its sentence the
       cloud model explained two in three everyday words to a reader at C1,
       and a lookup has one item to lose. */
    ...(own
      ? ["- <known> is how many adult native speakers know the term without looking it up: most, some or few. Be honest: a word of daily life is known by most."]
      : lookup
      ? [`- <known> is how many ${source} learners at level ${level} know the term without looking it up: most, some or few. Be honest: a word of daily life is known by most.`]
      : []),
    "- The angle brackets mark the fields. Do not write them.",
    "- No numbering, no bullets, no quotation marks, no headings, no extra text.",
    "- The input may be a single word or a short phrase instead of a sentence. Judge it the same way.",
  ]
    .concat(retry ? RETRY : [])
    .join("\n");
}

/* The line after the text in a lookup's question, where the text is the
   sentence: which of its words the reader looked up. */
export const lookupInput = (words) => `Looked up: ${words}`;

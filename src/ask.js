/* Asking the model, and cleaning up what comes back.

   Every function here is one question: the prompt modules hold the wording,
   the parse modules hold the reading, and this file is what sits between
   them — sending, filtering out what cannot be used, and putting the result
   in the order the text has.

   Nothing here decides what to ask for. That is run.js. */

import { cleanLine, orderByTextPosition, wordCount } from "./text.js";
import { englishName, languagePack } from "./languages/index.js";
import { formInText, longestRunInText } from "./match/positions.js";
import { contentWordCount, isBasicWord, isLoanword } from "./vocabulary.js";
import { VERB_CANDIDATES, mergeSameVerb, parseVerbForms, parseVerbTable, selectVerbForms, withoutBasicVerbs } from "./parse/verbs.js";
import { MAX_WORDS, firstFieldLine, isPassage, parseMarkedWord, parsePassage, asksForWordClass, parseWordClass, parseWords, withoutNestedTerms } from "./parse/words.js";
import { asksForSynonyms } from "./parse/synonyms.js";
import { abbreviationParts, looksLikeAbbreviation, parseAbbreviation, withoutSecondMeaning } from "./parse/abbreviations.js";
import { parseAlign } from "./parse/align.js";
import { startsUnknown } from "./strings.js";
import {
  findVerbsPrompt,
  annotateVerbsPrompt,
  alignVerbsPrompt,
  alignVerbsSinglePrompt,
  fieldName,
} from "./prompts/verbs.js";
import { wordsPrompt } from "./prompts/words.js";
import { alignWordsPrompt, alignWordsSinglePrompt, alignWordsInput } from "./prompts/words-align.js";
import {
  abbreviationPrompt,
  exampleSentenceInput,
  exampleSentencePrompt,
  explainMoreInput,
  explainMorePrompt,
  meaningPrompt,
  writtenIn,
  passagePrompt,
  passageSpotPrompt,
  spotPrompt,
  synonymPrompt,
  tenseNames,
  personNames,
  verbFormPrompt,
  wordClassPrompt,
} from "./prompts/marked.js";
import {
  translatePrompt,
  definitionPrompt,
  alternativesPrompt,
  readerSpelling,
  alternativesInput,
  unknownMarker,
} from "./prompts/translation.js";
import { parseAlternatives } from "./parse/alternatives.js";
import { headwordPrompt, improveCardPrompt, improveCardInput } from "./prompts/card.js";
import { parseImprovedCard } from "./parse/card.js";
import { parseHeadword } from "./parse/headword.js";
import { parseExample, parseMore, readsAs } from "./parse/more.js";
import { glanceInput, glancePrompt, glanceWideInput, glanceWidePrompt } from "./prompts/glance.js";
import { parseGlance, parseGlanceWide } from "./parse/glance.js";


/* A whole text through the model — first or as the stand-in, whichever the
   reader chose. */
export async function translateText(llm, { text, target }) {
  return llm.chat({
    system: translatePrompt({ target: englishName(target) }),
    user: text,
    maxTokens: 2000,
  });
}

/* Step one towards the alternatives: have the word explained in its own
   language.

   Without it the model guesses rare words from their shape — soslayable came
   back as "sozialisierbar", truculent as "truchtig", Kladderadatsch
   unchanged. With the definition in front it hits the meaning. Once per run,
   not once per target language.

   An empty answer is a fine answer: the alternatives are then asked without
   it, which is what the whole path did before this step existed. */
export async function defineWord(llm, { text, source, reader }) {
  const unknown = unknownMarker(reader);
  try {
    const answer = cleanLine(await llm.chat({
      system: definitionPrompt({ source: englishName(source), unknown }),
      user: text,
      maxTokens: 90,
    }));
    if (!answer || startsUnknown(answer)) return "";
    return answer;
  } catch {
    return "";
  }
}

/* Up to three translations of one word, each with a note on register or
   region. Which of three words to use is exactly what a dictionary is for,
   and picking one for the reader throws that away. */
export async function alternativesFor(llm, { text, source, target, reader, meaning }) {
  const raw = await llm.chat({
    system: alternativesPrompt({
      source: englishName(source),
      target: englishName(target),
      reader: englishName(reader),
      spelling: readerSpelling(reader),
      capitalisesNouns: !!languagePack(target).capitalisesNouns,
    }),
    user: alternativesInput({
      source: englishName(source),
      target: englishName(target),
      text,
      meaning,
    }),
    maxTokens: 200,
  });
  return parseAlternatives(raw, text, reader, target);
}

/* Step one of the verbs: the bare forms, nothing annotated.

   Only forms that stand in the text verbatim survive. The model otherwise
   answers with the infinitive instead of the conjugated form, and what is not
   in the text cannot be highlighted later. */
export async function findVerbForms(llm, { text, source }) {
  const raw = await llm.chat({
    system: findVerbsPrompt({ source: englishName(source) }),
    user: "Text: " + text,
    maxTokens: 200,
    temperature: 0,
  });

  return parseVerbForms(raw, text, source);
}

/* Step two: form | infinitive | meaning | person | tense, for the chosen few.

   Sorted by text position again, not only after step one: the parser takes
   the model's line order, and that strays from "in the given order" now and
   then. */
export async function annotateVerbs(llm, { text, source, reader, level, forms }) {
  const raw = await llm.chat({
    system: annotateVerbsPrompt({
      source: englishName(source),
      reader: englishName(reader),
      level,
      tenses: tenseNames(source),
      persons: personNames(source),
    }),
    user: ["Text: " + text, "Forms: " + forms.join(", ")].join("\n"),
    maxTokens: 380,
  });
  const verbs = withoutBasicVerbs(parseVerbTable(raw, source), source, { level, own: source === reader });
  return orderByTextPosition(mergeSameVerb(verbs, text), text, "form");
}

/* The whole verb section in one call, both stages. run.js uses the stages
   separately — the forms alone are enough for the word alignment, which
   should not wait for the much longer annotation. */
export async function verbsFor(llm, { text, source, reader, level }) {
  const forms = await findVerbForms(llm, { text, source });
  if (!forms.length) return { forms: [], verbs: [] };
  const verbs = await annotateVerbs(llm, {
    text,
    source,
    reader,
    level,
    forms: selectVerbForms(forms, VERB_CANDIDATES, source),
  });
  return { forms: forms.map((form) => ({ form })), verbs };
}

/* An abbreviation in the word list gets its own question. Written out, it is
   worth more than any translation of the letters. */
async function resolveAbbreviations(llm, { list, text, source, reader }) {
  const open = list.filter((word) => looksLikeAbbreviation(word.text));
  if (!open.length) return list;

  await Promise.all(open.map(async (word) => {
    try {
      const raw = await llm.chat({
        system: abbreviationPrompt({ source: englishName(source), reader: englishName(reader) }),
        user: `Text (${englishName(source)}): ${text}\nWord: ${word.text}`,
        maxTokens: 60,
      });
      const expansion = parseAbbreviation(raw, word.text);
      if (expansion) word.meaning = expansion;
    } catch {
      /* No expansion is a fine answer; a confidently wrong one is not. */
    }
  }));

  for (const word of open) {
    word.abbreviation = abbreviationParts(word.meaning, text, word.text, reader);
    word.meaning = word.abbreviation.text;
  }
  return list;
}

/* The word class beside a term of one word, or of a word with its article —
   asked of each at once, with the text; see asksForWordClass. A question that fails leaves the class out and nothing else. */
async function classifyTerms(llm, { list, text, source }) {
  await Promise.all(list.map(async (word) => {
    if (!asksForWordClass(word.text, source)) return;
    try {
      const raw = await llm.chat({
        system: wordClassPrompt({ source: englishName(source), genders: languagePack(source).grammar?.genders }),
        user: `Text (${englishName(source)}): ${text}\nWord: ${word.text}`,
        maxTokens: 30,
      });
      const found = parseWordClass(raw, { term: word.text, code: source });
      if (found) word.wordClass = found;
    } catch {
      /* No class is an answer. */
    }
  }));
}

const MAX_TERM_WORDS = 3;

/* A note written in the text's language rather than the reader's. Between
   close languages the cloud model does it although the question names the
   reader's language twice and the input once more: a Spanish reader got
   Italian notes for Italian slang in a quarter of the cases, whatever the
   wording (the twentieth run). It is caught here, by the packs' function
   words and everyday words, and asked again once: measured over 313 notes
   between the three, it caught 27, about five of them wrongly — a wrong
   catch costs one question and nothing else, since the second answer is kept
   only where it reads better. A note that carries none reads as neither and
   is let through; a second answer as wrong as the first stands —
   a note in the neighbouring language is still more than none. */
const NOTE = {
  fields: ["functionWords", "auxiliaries", "conjunctions", "basicWords", "basicVerbs"],
  decisive: 1,
};

function noteInTextLanguage(note, source, reader) {
  return !!note && source !== reader && readsAs(note, source, reader, NOTE) === source;
}

/* Asks once more where the first answer's notes are in the text's language,
   and keeps whichever answer has fewer of them — the first on a tie. The
   second question is asked warmer — at the usual temperature the same input
   came back word for word, Italian again — and ends on a line naming the
   reader's language once more (writtenIn). Only the second: on the first
   question that line cost the local model its base forms, which it then
   copied from the text (kündigte for kündigen, 5 of 45). */
const AGAIN = { temperature: 0.7, remind: true };

async function askedInReaderLanguage(ask, notesOf, source, reader) {
  const wrong = (raw) => notesOf(raw).filter((note) => noteInTextLanguage(note, source, reader)).length;
  const first = await ask();
  const missed = wrong(first);
  if (!missed) return first;
  const second = await ask(AGAIN).catch(() => "");
  return second && wrong(second) < missed ? second : first;
}

/* The difficult words of a text.

   Invented words are dropped — highlighting works from the exact spot in the
   text, so what is not in it is useless. Basic vocabulary goes too: the ban in
   the prompt demonstrably does not hold on its own. */
export async function wordsFor(llm, { text, source, sourceName = "", languages, levels, retry }) {
  /* A language the app does not support has no pack and no English name; the
     name the detection found stands in for it. */
  const name = sourceName || englishName(source);
  const raw = await askedInReaderLanguage((again = {}) => llm.chat({
    temperature: again.temperature,
    system: wordsPrompt({ code: source, name, languages, levels, retry }),
    user: [
      `Text (${name}): ${text}`,
      ...(again.remind ? [writtenIn(englishName(languages[0]), "<meaning> and <note>")] : []),
    ].join("\n"),
    maxTokens: 800,
  }), (answer) => parseWords(answer).map((word) => word.note), source, languages[0]);

  const dropped = [];
  let list = withoutNestedTerms(parseWords(raw)
    .filter((word) => {
      word.spot = longestRunInText(text, word.text, [source]);
      let reason = "";
      if (!word.spot) reason = "not in the text";
      else if (isBasicWord(word.text, source)) reason = "basic vocabulary";
      else if (isLoanword(word.text, source)) reason = "a loanword";
      /* "rimborso potrebbe essere decurtato": half a sentence handed back as
         a term. A fixed expression carries three meaning words at most. */
      else if (contentWordCount(word.text, [source]) > MAX_TERM_WORDS) reason = "a piece of a sentence";
      if (reason) dropped.push(`${word.text} (${reason})`);
      return !reason;
    }))
    .map((word) => ({ ...word, meaning: withoutSecondMeaning(word.meaning, word.text) }))
    .slice(0, MAX_WORDS);

  /* Trim first, then sort: which three terms it becomes is a question of
     difficulty, and only the model knows that. The order they stand in is a
     question of the text. */
  list = orderByTextPosition(list, text, "spot");
  [list] = await Promise.all([
    resolveAbbreviations(llm, { list, text, source, reader: languages[0] }),
    classifyTerms(llm, { list, text, source }),
  ]);

  /* Nothing left after the loanword filter means the model only saw the
     foreign chunks — typical of university and government letters. A note in
     the prompt did not help, asking again pointedly did. Exactly once, and
     only in this case. */
  if (!list.length && !retry && dropped.some((entry) => entry.endsWith("(a loanword)"))) {
    return wordsFor(llm, { text, source, sourceName, languages, levels, retry: true });
  }
  return list;
}

/* Everything about the one word the reader picked out.

   The shape of the questions never changes — what rotates is which text goes
   in as "Text" and which as A and B. Picking a word inside a translation
   therefore costs not one line of prompt.

   others are the other panels in the order the prompts call A and B. A panel
   that is not there is a hyphen, which the prompts already expect.

   inText says whether the term stands in that text at all. It does for a word
   the reader clicked and it does NOT for one reached through another word's
   synonyms — and then the text is not sent at all, rather than sent along for
   the model to explain the word against. Measured, sending it is what
   produced explanations like "bezeichnet hier den Vermieter im Kontext eines
   Mietverhältnisses" for a word that was never in the text: 63 % of them.
   Without a text there is also nothing to locate, so the spot question falls
   away by itself.

   Three questions in parallel, plus a fourth. The extras catch their own
   errors: they are the additions, and an addition must not take the
   explanation down with it. */
export async function explainMarked(
  llm,
  { term, text, source, reader, others, withoutSpot, inText = true, onParagraph },
) {
  const head = `Text (${englishName(source)}): ${text}`;
  if (inText && isPassage(term)) {
    return explainPassage(llm, { term, source, reader, others, withoutSpot, head, onParagraph });
  }
  const meaningInput = inText
    ? [head, "Word: " + term].join("\n")
    : `Word (${englishName(source)}): ${term}`;
  const spotInput = [
    head,
    `A (${others[0] ? englishName(others[0].code) : "another language"}): ${others[0]?.text || "-"}`,
    `B (${others[1] ? englishName(others[1].code) : "another language"}): ${others[1]?.text || "-"}`,
    "Word: " + term,
  ].join("\n");

  const quiet = (promise) => promise.catch(() => "");

  /* Synonyms are asked for up to two words only. Above that the term is a
     phrase or a technical one, and what comes back is a paraphrase rather
     than a replacement. Not asked also means not paid for: the call is
     dropped entirely. */
  const extra = looksLikeAbbreviation(term)
    ? quiet(llm.chat({ system: abbreviationPrompt({ source: englishName(source), reader: englishName(reader) }), user: meaningInput, maxTokens: 60 }))
    : asksForSynonyms(term)
      ? quiet(llm.chat({ system: synonymPrompt({ source: englishName(source), inText }), user: meaningInput, maxTokens: 60 }))
      : Promise.resolve("");

  /* Person and tense go to exactly the prompt that fills the verb table — it
     answers the same question already. Whether the word is a verb at all
     nobody needs to know beforehand: the rules leave the line out if it is
     not.

     The gate is the pack's grammar table, which all eight carry. */
  const grammar = languagePack(source).grammar
    ? quiet(llm.chat({ system: verbFormPrompt({ source: englishName(source), reader: englishName(reader), tenses: tenseNames(source), persons: personNames(source) }), user: meaningInput, maxTokens: 30 }))
    : Promise.resolve("");

  /* The word class, for a word or a word with its article. Where the answers
     make it a verb, the verb's own line says more and the class is dropped. */
  const kind = asksForWordClass(term, source)
    ? quiet(llm.chat({ system: wordClassPrompt({ source: englishName(source), genders: languagePack(source).grammar?.genders, inText }), user: meaningInput, maxTokens: 30 }))
    : Promise.resolve("");

  const asksSpot = !withoutSpot && inText;
  const spot = asksSpot
    ? quiet(llm.chat({ system: spotPrompt({ source: englishName(source), reader: englishName(reader) }), user: spotInput, maxTokens: 60 }))
    : Promise.resolve("");

  /* Several words are also translated whole, with the text: what the reader
     marked is what they want to read in their language. Not their own
     language, where the equivalent is not shown at all, and not a synonym,
     which has no text to translate it in. */
  const whole = inText && source !== reader && wordCount(term) > 1
    ? quiet(llm.chat({ system: passagePrompt({ source: englishName(source), target: englishName(reader) }), user: [head, "Passage: " + term].join("\n"), maxTokens: 200 }))
    : Promise.resolve("");

  const [meaningRaw, thirdRaw, grammarRaw, wholeRaw, kindRaw] = await Promise.all([
    askedInReaderLanguage((again = {}) => llm.chat({
      temperature: again.temperature,
      system: meaningPrompt({ source: englishName(source), reader: englishName(reader), inText }),
      user: again.remind ? [meaningInput, writtenIn(englishName(reader), "<meaning> and <note>")].join("\n") : meaningInput,
      maxTokens: 160,
    }), (answer) => [firstFieldLine(answer).split("|").slice(2).join("|").trim()], source, reader),
    extra,
    grammar,
    whole,
    kind,
  ]);

  const parse = (spotRaw) => parseMarkedWord({
    meaningRaw,
    spotRaw,
    term,
    code: source,
    thirdRaw,
    grammarRaw,
    wholeRaw,
    kindRaw,
    lang: reader,
    codes: [source, ...others.map((o) => o.code)],
  });

  /* The paragraph is three of the four answers and the markings are the
     fourth, so the paragraph need not wait for them. Measured on a cloud
     model, the spot question was the last to come back in a third of the
     clicks, by up to 1.3 s. The paragraph is shown whole, never piece by
     piece: a row that grows a base form or a line of synonyms after it has
     been read asks to be read again. */
  if (asksSpot && onParagraph) {
    const paragraph = parse("");
    if (paragraph) onParagraph(paragraph);
  }

  return parse(await spot);
}

/* A passage is translated and located, and nothing else: see passagePrompt.
   Translated into the reader's language — unless it already is in it, and
   then into the language of the first other panel, which is the original
   wherever the reader picked in a translation. */
async function explainPassage(llm, { term, source, reader, others, withoutSpot, head, onParagraph }) {
  const target = source === reader ? others.find((o) => o.code && o.code !== reader)?.code : reader;
  if (!target) return null;
  const spotInput = [
    head,
    `A (${others[0] ? englishName(others[0].code) : "another language"}): ${others[0]?.text || "-"}`,
    `B (${others[1] ? englishName(others[1].code) : "another language"}): ${others[1]?.text || "-"}`,
    "Passage: " + term,
  ].join("\n");
  const asksSpot = !withoutSpot;
  const spot = asksSpot
    ? llm.chat({ system: passageSpotPrompt({ source: englishName(source), reader: englishName(reader) }), user: spotInput, maxTokens: 400 }).catch(() => "")
    : Promise.resolve("");
  const translationRaw = await llm.chat({
    system: passagePrompt({ source: englishName(source), target: englishName(target) }),
    user: [head, "Passage: " + term].join("\n"),
    maxTokens: 400,
  });
  const parse = (spotRaw) => parsePassage({ translationRaw, spotRaw, term, target });
  if (asksSpot && onParagraph) {
    const first = parse("");
    if (first) onParagraph(first);
  }
  return parse(await spot);
}

/* The longer explanation of a picked word, on the reader's request. One
   question, one paragraph, told what the short answer already said so that
   it goes past it. */
export async function explainMore(llm, { term, text, source, reader, level, meaning, note, inText = true, examples = [] }) {
  const raw = await llm.chat({
    system: explainMorePrompt({
      source: englishName(source),
      reader: englishName(reader),
      level,
      inText,
      spelling: readerSpelling(reader),
      hasExamples: examples.length > 0,
    }),
    user: explainMoreInput({ source: englishName(source), term, text, meaning, note, inText, examples }),
    maxTokens: 400,
  });
  return parseMore(raw, { source, reader });
}

/* One more example sentence for a term already explained, on the reader's
   request. The ones already shown go with the question, because what makes
   another one worth asking for is that it is unlike them. */
export async function addExample(llm, { term, source, reader, level, meaning, note, examples = [] }) {
  const raw = await llm.chat({
    system: exampleSentencePrompt({
      source: englishName(source),
      reader: englishName(reader),
      level,
      spelling: readerSpelling(reader),
    }),
    user: exampleSentenceInput({ source: englishName(source), term, meaning, note, examples }),
    maxTokens: 150,
    /* The one question whose whole point is to differ from the answers before
       it. At the default the same sentence frame came back with other words
       filled in. */
    temperature: 0.8,
  });
  return parseExample(raw, { source, reader });
}

/* The same words found again in the translations. With two panels there is
   only one of them, and then the question has one column fewer. */
export async function alignWords(llm, { text, list, source, sourceName = "", a, b, aText, bText }) {
  const raw = await llm.chat({
    system: b ? alignWordsPrompt() : alignWordsSinglePrompt(),
    user: alignWordsInput({
      sourceName: sourceName || englishName(source),
      aName: englishName(a),
      bName: b ? englishName(b) : "",
      text,
      aText,
      bText,
      words: list.map((word) => word.text),
    }),
    maxTokens: 250,
  });
  return parseAlign(raw, list.map((word) => word.text), "Word", [a, b].filter(Boolean), b ? 2 : 1);
}

/* One sentence of the original against the same sentence of its
   translations, for the hover. The second panel comes in the same question
   rather than one of its own: one list of units is one grouping for every
   panel, and measured, two questions cost the local model seven sentences of
   33. Null where the answer cannot be laid over the sentence — see
   parse/glance.js. */
export async function glanceSentence(llm, { sentence, translation, second, source, target, secondTarget }) {
  if (!second) {
    const raw = await llm.chat({
      system: glancePrompt(),
      user: glanceInput({
        sourceName: englishName(source),
        targetName: englishName(target),
        sentence,
        translation,
      }),
      maxTokens: 1200,
    });
    return parseGlance(raw, sentence, translation, [source, target]);
  }
  const raw = await llm.chat({
    system: glanceWidePrompt(),
    user: glanceWideInput({
      sourceName: englishName(source),
      aName: englishName(target),
      bName: englishName(secondTarget),
      sentence,
      a: translation,
      b: second,
    }),
    maxTokens: 1600,
  });
  return parseGlanceWide(raw, sentence, translation, second, [source, target, secondTarget]);
}

/* And the same for the verb forms. With two panels there is one translation
   instead of two, and the question has one column fewer.

   Every form comes with its meaning in brackets: that meaning, not the
   nearest auxiliary, is what the model anchors on. */
export async function alignVerbs(llm, { text, verbs, source, a, b, aText, bText }) {
  const system = b
    ? alignVerbsPrompt({
        source: englishName(source),
        a: englishName(a),
        b: englishName(b),
        fieldSource: fieldName(source),
        fieldA: fieldName(a),
        fieldB: fieldName(b),
      })
    : alignVerbsSinglePrompt({
        source: englishName(source),
        a: englishName(a),
        fieldSource: fieldName(source),
        fieldA: fieldName(a),
      });

  const raw = await llm.chat({
    system,
    /* Labelled by language name, the way the examples in the prompt are, and
       only the first meaning: a second one in brackets weakens the anchor
       instead of sharpening it. */
    user: [
      `${englishName(source)}: ${text}`,
      `${englishName(a)}: ${aText}`,
      ...(b ? [`${englishName(b)}: ${bText}`] : []),
      "Verbs: " + verbs.map((verb) => {
        const meaning = String(verb.meaning || "").split(",")[0].trim();
        return meaning ? `${verb.form} (${meaning})` : verb.form;
      }).join(", "),
    ].join("\n"),
    maxTokens: 250,
  });
  return parseAlign(raw, verbs.map((verb) => verb.form), "Verb", [a, b].filter(Boolean), b ? 2 : 1);
}

/* The side of a card nobody wrote, filled before the card is improved: the
   dictionary entry short mode asks for, where the written side is short
   enough to be looked up, and a plain translation where it is not. The word
   side takes the first entry, the meaning side all of them — which of the
   meanings stays is the improving question's to decide. Answers the card
   unchanged where both sides are written or nothing came back. */
const LOOKED_UP_WORDS = 3;

export async function completeCard(llm, card) {
  const term = String(card.term || "").trim();
  const meaning = String(card.meaning || "").trim();
  if ((term && meaning) || (!term && !meaning)) return card;
  const [text, source, target] = term
    ? [term, card.termLanguage, card.meaningLanguage]
    : [meaning, card.meaningLanguage, card.termLanguage];
  let found = [];
  if (wordCount(text) <= LOOKED_UP_WORDS) {
    const definition = await defineWord(llm, { text, source, reader: card.meaningLanguage });
    const entries = await alternativesFor(llm, {
      text, source, target, reader: card.meaningLanguage, meaning: definition,
    });
    found = entries.map((entry) => entry.text).filter(Boolean);
  }
  if (!found.length) {
    const translated = String(await translateText(llm, { text, target }) || "").trim();
    if (translated) found = [translated];
  }
  if (!found.length) return card;
  return term ? { ...card, meaning: found.join(", ") } : { ...card, term: found[0] };
}

/* A flashcard made general and given an explanation worth learning from, on
   the reader's request in the card window. Answers the three fields, or null
   where nothing usable came back — the card on screen then stays as it is. */
export async function improveCard(llm, card, { level }) {
  const term = englishName(card.termLanguage);
  const reader = englishName(card.meaningLanguage);
  const own = languagePack(card.termLanguage);
  const theirs = languagePack(card.meaningLanguage);
  const raw = await llm.chat({
    system: improveCardPrompt({
      term,
      reader,
      level,
      termCapitals: !!own.capitalisesNouns,
      readerCapitals: !!theirs.capitalisesNouns,
      spelling: readerSpelling(card.meaningLanguage),
      hasSentence: !!card.context?.sentence,
    }),
    user: improveCardInput({ term, reader, card }),
    maxTokens: 900,
  });
  const improved = parseImprovedCard(raw, card);
  if (!improved) return null;
  const withArticles = await headwordsFor(llm, { ...card, ...improved });
  return withArticles ? { term: withArticles.term, meaning: withArticles.meaning, note: improved.note } : improved;
}

/* Each side's nouns with their articles, in a language whose pack names them:
   only for what is short enough to be a headword, and a side holding several
   meanings ("Kasse; bezahlen") asked about one by one. Answers the card with
   its sides replaced, or null where nothing changed. */
const HEADWORD_MOST_WORDS = 3;

function headwordParts(value, code) {
  if (!value || !languagePack(code).definiteArticles) return null;
  const pieces = String(value).split(/(\s*[;,]\s*)/);
  const words = pieces.filter((_, index) => index % 2 === 0);
  if (words.some((part) => !part || part.split(/\s+/).length > HEADWORD_MOST_WORDS)) return null;
  return pieces;
}

export async function headwordsFor(llm, card) {
  const side = async (value, code) => {
    const pieces = headwordParts(value, code);
    if (!pieces) return value;
    const answered = await Promise.all(pieces.map(async (part, index) => {
      if (index % 2) return part;
      try {
        const raw = await llm.chat({
          system: headwordPrompt({ language: englishName(code) }),
          user: part,
          maxTokens: 30,
        });
        return parseHeadword(raw, part, code);
      } catch {
        return part;
      }
    }));
    return answered.join("");
  };
  const [term, meaning] = await Promise.all([
    side(card.term, card.termLanguage),
    side(card.meaning, card.meaningLanguage),
  ]);
  if (term === card.term && meaning === card.meaning) return null;
  return { ...card, term, meaning };
}

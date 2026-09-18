/* The list of difficult words, and the one word the reader clicked. */

import { cleanLine, containsWord, flattenField, stripDiacritics, stripQuotes, wordCount } from "../text.js";
import { looksLikeAbbreviation, parseAbbreviation, withoutSecondMeaning } from "./abbreviations.js";
import { parseSynonyms } from "./synonyms.js";
import { isBaseForm, isPartOfTerm, repeatsTerm, trimToBaseForm } from "./terms.js";
import { grammarOf } from "./verbs.js";
import { isFunctionWord } from "../vocabulary.js";
import { isSupported, languagePack } from "../languages/index.js";
import { WORD_CLASSES } from "../prompts/marked.js";
import { startsUnknown } from "../strings.js";

export const MAX_WORDS = 3;
/* How many words a picked term may have and still be read as a verb form.
   Two, because that is how the eight languages write a compound tense, a
   reflexive and a separable verb. See parseMarkedWord. */
export const MAX_VERB_WORDS = 2;
/* The longest pick still asked about as a word or an expression. Idioms of
   five and six words ("kicked the can down the road", "deu com a língua nos
   dentes") are explained well; a clause or a sentence is not — the meaning
   question is about ONE term, so it picks a piece of the passage and explains
   that. See isPassage. */
export const MAX_PHRASE_WORDS = 6;
/* Read in more generously than is shown: the filters trim afterwards, and
   something should be left over when they do. */
const READ_AHEAD = 3;

/* A term standing inside another one goes: "query" beside "start a query"
   is the same spot twice, and a spot carries one colour. The longer one
   stays — it holds the shorter one and says more. The same spot twice goes
   too, the first one staying. Compared by the spot in the text, so a
   dictionary form and the form the text holds are one term. */
export function withoutNestedTerms(list) {
  const key = (word) => stripDiacritics(String(word.spot || word.text || "")).toLowerCase().trim();
  const keys = list.map(key);
  return list.filter((_, i) => keys[i] && !keys.some((other, j) =>
    j !== i && (other === keys[i] ? j < i : other.length > keys[i].length && containsWord(other, keys[i]))));
}

/* term | equivalent | explanation. Further pipes belong to the explanation,
   not to a fourth column. */
export function parseWords(raw) {
  const out = [];
  for (const line of String(raw || "").split(/\r?\n/)) {
    const L = cleanLine(line);
    if (!L) continue;
    const parts = L.split("|");
    if (parts.length < 2) continue;
    const term = stripQuotes(parts[0]);
    if (!term) continue;
    /* Two fields where three were asked for, the local model having written
       the note behind a semicolon instead of a pipe: "Probetag; Sport". The
       equivalent is one or two words and never holds a semicolon itself. */
    const [meaning, ...rest] = parts.length === 2 ? parts[1].split(";") : [parts[1]];
    out.push({
      text: term,
      meaning: stripQuotes(meaning),
      note: stripQuotes(parts.length === 2 ? rest.join(";") : parts.slice(2).join("|")).replace(/\s*[;,]$/, ""),
    });
    if (out.length >= MAX_WORDS + READ_AHEAD) break;
  }
  return out;
}

/* Person and tense for the clicked verb. A bare dash means "not a verb", and
   that is an answer. */
export function parseVerbGrammar(raw) {
  const line = String(raw || "")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)[0];
  if (!line || /^[-–—]+$/.test(line.trim())) return null;
  const fields = line.split("|").map((x) => stripQuotes(x).trim());
  if (fields.length < 2 || !fields[0] || !fields[1]) return null;
  if (/^[-–—]+$/.test(fields[0]) || /^[-–—]+$/.test(fields[1])) return null;
  return { person: fields[0], tense: fields[1] };
}

/* The word class of a pick of one word, or of a word with the article or
   preposition in front of it: "das Haus", "la flemme". Two words of which
   neither is a function word are a phrase — "días hábiles", "zähen
   Verhandlungen" — and asked about one anyway the local model named the class
   of one of the two. Only names from the list stand, a number only on a noun
   or a pronoun, a gender only on a noun and only one the language's pack
   knows — anything else is left out rather than shown half right. A verb is
   left to the verb path, which says more. */
const NUMBERED = new Set(["noun", "proper noun", "pronoun"]);

export function asksForWordClass(term, code) {
  /* A language with no pack has no function words to tell a phrase by, and
     no genders: nothing is shown rather than a guess. */
  if (!isSupported(code)) return false;
  const words = String(term || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length || words.length > MAX_VERB_WORDS || looksLikeAbbreviation(term)) return false;
  return words.length === 1 || isFunctionWord(words[0], [code]);
}

export function parseWordClass(raw, { term, code }) {
  if (!asksForWordClass(term, code)) return null;
  const line = firstFieldLine(raw) || cleanLine(String(raw || "").split(/\r?\n/)[0] || "");
  const fields = line.split("|").map((field) => stripQuotes(field).trim().toLowerCase());
  const kind = fields[0];
  if (!WORD_CLASSES.includes(kind) || kind === "verb") return null;
  const number = NUMBERED.has(kind) && ["singular", "plural"].includes(fields[1]) ? fields[1] : "";
  const genders = languagePack(code).grammar?.genders || [];
  const gender = kind === "noun" && genders.includes(fields[2]) ? fields[2] : "";
  return { kind, number, gender };
}

/* Whether a pick is a passage rather than a word or an expression: more than
   six words, counted off the selection, which is a fact. Punctuation plays no
   part. A comma or a stop inside a pick looked like a clause boundary and was
   just as often "0.5 m", "Dr. Müller" or "I, Robot" — telling them apart
   takes a list of abbreviations per language, which is exactly what may not
   stand outside a pack. A short clause on the word path costs little: it is
   shown translated whole like every pick of several words. */
export function isPassage(term) {
  return wordCount(term) > MAX_PHRASE_WORDS;
}

/* The translation of a whole pick: its first line, unquoted. */
export function parseTranslation(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => stripQuotes(cleanLine(line)))
    .find(Boolean) || "";
}

/* A passage's answer: its translation, and where it stands in the two other
   panels. Nothing else is asked, so nothing else is filled in — the row draws
   the translation instead of an explanation. */
export function parsePassage({ translationRaw, spotRaw, term, target }) {
  const translation = parseTranslation(translationRaw);
  if (!translation) return null;
  const spot = firstFieldLine(spotRaw).split("|");
  const field = (i) => usableSpot(stripQuotes(spot[i]), term).replace(/[\s.,;:!?،؛]+$/u, "");
  return {
    text: term,
    passage: true,
    meaning: translation,
    meaningLanguage: target,
    infinitive: "",
    person: "",
    tense: "",
    note: "",
    synonyms: [],
    a: spot.length >= 2 ? field(0) : "",
    b: spot.length >= 2 ? field(1) : "",
  };
}

/* Two ways a spot field says nothing while looking like an answer.

   The model writes the label back instead of the words: measured, "comité"
   in a Spanish sentence came back as "A | committee" in three runs of three —
   the English half trivial because the words are cognates, the German half
   given up on and filled with the letter above it. Searched for in the
   German text, a bare "A" hits the first stray a and would colour it.

   And it repeats the term, which rule 5 forbids: the term stands in the
   source panel, not in a translation, so it is not a spot either. */
export function usableSpot(field, term) {
  /* Or it writes the label in front of the words, "<A> Arbeit", or closes it
     behind them, "an</A>". The words are right; only the label goes. */
  const value = String(field || "")
    .replace(/<\/?[AB]>/g, "")
    .replace(/^[AB]\s*[:=>]\s*/, "")
    .replace(/^<|>$/g, "")
    .trim();
  if (!value || value === "-" || /^[AB]$/.test(value)) return "";
  return value.toLowerCase() === String(term || "").trim().toLowerCase() ? "" : value;
}

/* The first usable line of an answer. Without a pipe it says nothing about
   where the fields end, and therefore does not count. */
export function firstFieldLine(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    /* A hyphen in front of a pipe is an empty first field, not a bullet. */
    .map((line) => (/^\s*[-–—]\s*\|/.test(line) ? line.trim() : cleanLine(line)))
    /* The local model writes the line as a table row, "|rügen|anfechten|…|",
       or wraps all of it in the angle brackets meant for one field. Either
       way the first field came out empty or began with a bracket. */
    .map((L) => L.replace(/^<(?!\/?[AB]>)|>$/g, "").replace(/^\|\s*|\s*\|$/g, "").trim())
    .find((L) => L && L.includes("|")) || "";
}

/* Three answers, one line each. Field 1 is NOT displayed the way the model
   returns it but the way it stands in the text — the rule asking for that is
   not followed reliably, and the highlight hangs on the real spot.

   code is the language of the text, lang the language the reader gets
   explanations in, codes the languages of the whole run. */
export function parseMarkedWord({ meaningRaw, spotRaw, term, code, thirdRaw, grammarRaw, wholeRaw, kindRaw, lang, codes }) {
  const meaningLine = firstFieldLine(meaningRaw);
  if (!meaningLine) return null;

  const fields = meaningLine.split("|");
  let meaning = "";
  let note;
  if (fields.length >= 3) {
    meaning = stripQuotes(fields[1]);
    note = stripQuotes(fields.slice(2).join("|"));
  } else if (fields.length === 2) {
    /* Field 2 missing: then only the explanation is certain, and it stands
       at the back. Better to leave the equivalent out than to guess it. */
    note = stripQuotes(fields[1]);
  } else {
    return null;
  }
  if (!note || startsUnknown(note)) return null;

  /* A spot line without a pipe does not say which of the two panels is
     meant — better no highlight than one in the wrong panel. */
  const spot = firstFieldLine(spotRaw).split("|");
  const a = spot.length >= 2 ? usableSpot(stripQuotes(spot[0]), term) : "";
  const b = spot.length >= 2 ? usableSpot(stripQuotes(spot[1]), term) : "";

  /* Field 1 carries the infinitive, but only where it is one, contributes
     something of its own, and the thing asked about is a verb form at all.

     A verb form is at most TWO words, counted off the selection rather than
     off the answer, because the selection is a fact and cannot drift: a
     compound tense, a reflexive and a separable verb are written in two
     words in the eight languages, and a form written in three is not one a
     reader picks whole. Above that the row was drawn as a line of the verb
     table — arrow, person, tense, and a button offering to conjugate half a
     clause.

     Two words are not enough on their own, though, and this is where they
     differ from one. "die Tür öffnete" is a verb standing next to a word
     that has nothing to do with it, and the meaning question answers such a
     phrase with the infinitive of the verb in it — by its own rule 2, which
     is right for what that question is for. So a two-word pick needs a
     SECOND vote: the verb-form question, which is asked in parallel anyway
     and costs nothing, has to come back with a person and a tense rather
     than the hyphen its rules ask for when the term is not one verb form.
     One word keeps the single vote it was measured with.

     Where a language carries no grammar table there is no second question to
     ask, and a two-word pick is then not a verb — one row too few rather
     than a wrong one. All eight carry one.

     The test that field 1 brings a word of its own loosens with the same
     step, and for the same reason: a form written in two words carries its
     base form inside it, so the strict test rejected the right answer in five
     of the eight languages. Two words keep only the bar the strict test was
     written for — that field 1 is not the term written out again — and hand
     the rest to the second question. */
  const words = term.trim().split(/\s+/).length;
  const said = parseVerbGrammar(grammarRaw);
  /* One exception to the repeat test: an infinitive clicked as it stands IS
     its own base form, and tumbar, bosser, restituer and indemnify all lost
     their table to it. Where the verb-form question names the form an
     infinitive, the repeat is the right answer. A conjugated form the model
     merely repeated stays out.

     It holds for a form written in two words as well. English writes a
     phrasal verb's citation form exactly as the text has it, and "hold off"
     came back as its own base form, correctly — whereupon the trimming, which
     is there to cut a subject the model named along with the verb, took the
     verb for the subject and left "off". Where the field is the term again
     and the form is an infinitive, nothing is cut and nothing is doubted. */
  const ownInfinitive = /infinit/i.test(firstFieldLine(grammarRaw) || String(grammarRaw || "").trim());
  const given = stripQuotes(fields[0]);
  const field1 = ownInfinitive && repeatsTerm(given, term) ? given.trim() : trimToBaseForm(given, term);
  const ownWords = words === 1
    ? ownInfinitive || !isPartOfTerm(field1, term)
    : ownInfinitive || !repeatsTerm(field1, term);
  const verbLike = words <= MAX_VERB_WORDS && isBaseForm(field1, code) && ownWords;

  /* Person and tense only for a word this section itself takes for a verb
     form. If the meaning call says "not a verb" and the annotation says "1st
     person, present", the row would stand against itself — and field 1 is
     the calibrated answer to that question, not the side question. */
  const grammar = verbLike ? said : null;
  const infinitive = verbLike && (words === 1 || grammar) ? field1 : "";

  meaning = withoutSecondMeaning(meaning, term);

  /* The same slot, two questions: an abbreviation has no synonyms, so asking
     for them there would be wasted. The expansion replaces the equivalent —
     for "IVA" it carries both, and the explanation beside it says what it is
     about anyway. */
  const expansion = looksLikeAbbreviation(term) ? parseAbbreviation(thirdRaw, term) : "";
  const synonyms = expansion ? [] : parseSynonyms(thirdRaw, term, codes);
  if (expansion) meaning = expansion;

  /* A pick of several words is shown translated whole. The meaning question
     renders the TERM, and handed "The label itself is not written" it chose
     "schreiben". A verb form keeps its infinitive, which is what the verb
     table shows too. */
  const whole = parseTranslation(wholeRaw);
  if (whole && !infinitive && !expansion) meaning = whole;

  /* Read the same way as a row of the verb table: the person only where the
     language knows it by that name, and not twice over. */
  const shown = infinitive && grammar ? grammarOf(grammar.person, grammar.tense, code) : null;

  /* A verb says what it is on the verb line; the class is for everything else. */
  const wordClass = infinitive || expansion ? null : parseWordClass(kindRaw, { term, code });

  return {
    text: term,
    infinitive,
    wordClass,
    person: shown ? shown.person : "",
    tense: shown ? shown.tense : "",
    meaning: flattenField(meaning),
    a,
    b,
    note,
    synonyms,
    /* The raw lines stay attached to the result — the first place to look
       when an infinitive is missing or a spot lands beside the mark. They
       are never displayed. */
    raw:
      meaningLine +
      (spot.length >= 2 ? "   ›   " + spot.join("|") : "") +
      (synonyms.length ? "   ›   " + synonyms.join(" | ") : "") +
      (expansion ? "   ›   " + expansion : "") +
      (grammar ? "   ›   " + [grammar.person, grammar.tense].filter(Boolean).join(" | ") : ""),
  };
}

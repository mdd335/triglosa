/* A flashcard, and everything that can be worked out about one without a
   window and without Anki.

   Three fields, always the same three: the word in the language being
   learned, the word in the reader's own language, and an explanation. That
   is the shape every flashcard program agrees on, so it is the shape the
   reader is shown and the shape that gets copied out. Whether it then goes
   into Anki, into a text file or into somebody else's program is not decided
   here.

   Which of the two words goes in which field is decided by the *language*
   and not by where it came from: the side written in the reader's first
   language is the reader's side. Read off the position it would be wrong in
   short mode, where the reader types a word of their own and the panels
   answer with the foreign ones. */

import { citationForm, displayName } from "./languages/index.js";
import { sentenceIndexOf, sentenceWith, stripDiacritics, toSentences } from "./text.js";

/* The fields in the order they are shown and copied: the word being learned
   first, because that is the front of a card in every deck anybody has. */
export const CARD_FIELDS = ["term", "meaning", "note"];

const joined = (...parts) => parts.filter(Boolean).join("\n\n");

/* The example on the back of a card: the one sentence the word stands in,
   followed by that sentence in the reader's own language in brackets — the
   way every further example on an improved card is written, so the first one
   does not look like a different kind of thing.

   `word` is how the sentence is found in the text and `spot` how it is found
   in the translation — the form as it actually stands there, which is what
   the run's alignment already worked out for the panels.

   Answered as its two parts. The card carries them apart from the
   explanation as well, because improving a card has to keep that sentence
   word for word, and it cannot be trusted to find it again in a note it is
   about to rewrite. */
function exampleOf({ sentence, translation, word, spot }) {
  const sentences = toSentences(sentence);
  const index = sentenceIndexOf(sentences, word);
  const one = index === -1 ? (sentences.length === 1 ? sentences[0] : "") : sentences[index];
  /* Where the spot is not found over there, the sentence in the same place
     is — but only where the two texts have the same number of sentences. */
  const other = one ? sentenceWith(translation, spot, { index, total: sentences.length }) : "";
  return { sentence: one, translation: other };
}

export function exampleLine({ sentence, translation }) {
  if (!sentence) return "";
  return translation ? `${sentence} (${translation})` : sentence;
}

/* A verb goes into the deck in its base form. "andar" is vocabulary,
   "anduvo" is a spot in one text and nowhere else — the same reason the verb
   row's two buttons look up the base form. The inflected form is not lost:
   it stands in the explanation with its person and tense, which is what
   makes the card about this reading rather than about a dictionary. */
export function verbCard(verb, { sourceLanguage, reader, sentence, translation, spot }) {
  const grammar = [verb.person, verb.tense].filter(Boolean).join(" · ");
  const context = exampleOf({ sentence, translation, word: verb.form, spot });
  return {
    term: citationForm(sourceLanguage, verb.infinitive) || verb.form,
    termLanguage: sourceLanguage,
    meaning: verb.meaning || "",
    meaningLanguage: reader,
    /* Found by the form that stands in the text, not by the base form: the
       base form is what a dictionary is written about and is usually nowhere
       in the sentence. */
    note: joined(
      [verb.form, grammar].filter(Boolean).join(" — "),
      exampleLine(context),
    ),
    context,
  };
}

/* A difficult word goes in as it stands. Unlike a verb it has no base form
   the reader would look up instead — the form in the text is the word. */
export function termCard(word, { sourceLanguage, reader, sentence, translation, spot }) {
  const context = exampleOf({ sentence, translation, word: word.spot || word.text, spot });
  return {
    term: word.text,
    termLanguage: sourceLanguage,
    meaning: word.meaning || word.note || "",
    meaningLanguage: reader,
    note: joined(word.meaning ? word.note : "", exampleLine(context)),
    context,
  };
}

/* The picked word. A verb among them is treated as one, base form and all.

   Reached through a synonym it does not stand in the text, so the two
   sentences are left out: an example sentence without the vocabulary in it is
   worse on a card than no example at all. */
export function markedCard(marked, { wordLanguage, reader, sentence, translation }) {
  const inText = !marked.back;
  /* Its equivalent is how the sentence is found on the other side: it is the
     answer to the meaning question, written in exactly that language, and it
     is what the reader would look for themselves. */
  const context = inText
    ? exampleOf({ sentence, translation, word: marked.text, spot: marked.meaning })
    : { sentence: "", translation: "" };
  /* A passage that is its whole sentence would stand on the card twice. */
  const bare = (s) => String(s || "").replace(/[\s.,;:!?¡¿…،؛؟"«»“”]+/gu, " ").trim().toLowerCase();
  const repeats = marked.passage && bare(context.sentence) === bare(marked.text);
  return {
    term: citationForm(wordLanguage, marked.infinitive) || marked.text,
    termLanguage: wordLanguage,
    meaning: marked.meaning || marked.note || "",
    meaningLanguage: reader,
    note: joined(marked.meaning ? marked.note : "", repeats ? "" : exampleLine(context)),
    context,
  };
}

/* Short mode: one line of a dictionary entry. The panel's word is the one
   being learned, and the other side is always in the reader's own language.
   Where the reading was typed in that language it is the reading itself —
   the reader asked how their own word is said. Where it was in a third
   language ("checkout", looked up by a German reader learning Spanish) the
   reading is no side of this card at all: the reader's own panel holds the
   answer in their language, and that goes on the back, with the word that
   was looked up named in the explanation so the card still says where it
   came from. */
export function entryCard(item, { panelLanguage, reader, sentence, sourceLanguage, readerAlternatives }) {
  const own = !sourceLanguage || sourceLanguage === reader;
  const theirs = (Array.isArray(readerAlternatives) ? readerAlternatives : [])
    .map((entry) => entry && entry.text).filter(Boolean);
  return {
    term: item.text,
    termLanguage: panelLanguage,
    meaning: own || !theirs.length ? (own ? sentence : "") : theirs.join(", "),
    meaningLanguage: reader,
    note: own ? item.note || "" : [item.note, sentence].filter(Boolean).join("\n"),
  };
}

/* The reading itself, in short mode. Up to three words in a language being
   learned is a vocabulary item and nothing else — which is why the card is
   offered on the original field there and not on a paragraph.

   Its other side is the dictionary entry the panels already hold: the
   translations as the meaning, and the ones carrying a note on register or
   region named again underneath, because which of three words to use is the
   question the entry answers. */
export function readingCard({ text, sourceLanguage, reader, alternatives }) {
  const list = (Array.isArray(alternatives) ? alternatives : []).filter((item) => item && item.text);
  return {
    term: text,
    termLanguage: sourceLanguage,
    meaning: list.map((item) => item.text).join(", "),
    meaningLanguage: reader,
    note: list.filter((item) => item.note).map((item) => `${item.text} — ${item.note}`).join("\n"),
  };
}

/* One line, the fields separated by tabs — what Anki, Quizlet and most of
   the rest read when a deck is imported from a file. A field's own line
   breaks cannot survive as line breaks, or the line would become three, so
   they go in as the break every one of those programs renders. */
export function cardLine(card) {
  return CARD_FIELDS.map((name) => String(card[name] || "").replace(/\s*\n\s*/g, "<br>"))
    .join("\t");
}

export const escapeHtml = (s) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* A field on its way into a note: escaped, and its line breaks kept as the
   breaks a card template renders. */
export const asHtml = (s) => escapeHtml(s).replace(/\r?\n/g, "<br>");

/* Whether there is a card here at all. An empty word is nothing to learn. */
export const hasCard = (card) => !!(card && String(card.term || "").trim());

const fold = (s) => stripDiacritics(String(s || "")).toLowerCase().trim();

/* Which of a note type's fields each of the three belongs in.

   Guessed rather than asked, because the reader can see and change the
   answer in three lists right underneath — and for Anki's own built-in note
   type the guess is simply right. Two rules, and neither of them knows a
   word of any language:

   A field named after a language takes that language. The names come from
   the packs, asked in three ways a deck might spell one — the reader's
   language, English, and the language's own — so "Spanisch", "Spanish" and
   "Español" all find the same field. This is what every vocabulary note type
   anybody builds looks like, and it is why there is no list of words like
   "front" and "back" here: such a list would be a language named outside a
   pack, and would cover the two languages it was written in and no others.

   Anything still unplaced goes by position, and where it starts counting from
   depends on what was matched. With nothing matched — Anki's `Basic`, whose
   fields are Front and Back — it counts from the first field, which is the
   right answer. With a language field found, it counts from **after** the
   last one: a note type's fields run front to back, so the explanation comes
   after the two words. Only if there is nothing after does it look at what
   came before.

   That is not a refinement, it is the difference between right and wrong on a
   real note type. On a note type with thirteen fields — `ID`, two
   language fields, `Beispiel`, then nine more — counting leftovers from
   the front put the explanation into `ID` and left `Beispiel` empty.

   The note type's **first field** is offered to the word alone. It is the
   front of the card and the field Anki judges duplicates and emptiness by, so
   it belongs to the word or to nothing — an explanation standing there is a
   card with its answer on the front. */
export function guessFieldMap(fieldNames, languages) {
  const fields = (Array.isArray(fieldNames) ? fieldNames : []).map(String);
  const [reader, ...learned] = Array.isArray(languages) ? languages : [];
  const map = { term: "", meaning: "", note: "" };

  const namesOf = (code) => {
    if (!code) return [];
    const asked = [reader, "en", code].filter(Boolean);
    return asked.map((inLanguage) => fold(displayName(code, inLanguage)));
  };
  const readerNames = namesOf(reader);
  /* Every language being learned may turn up as the word's own, and a deck
     names the field after one of them. The first match wins — a note type
     with a field per language is one deck per language anyway. */
  const learnedNames = learned.flatMap(namesOf);

  const taken = new Set();
  let lastMatch = -1;
  fields.forEach((field, index) => {
    const name = fold(field);
    if (!map.meaning && readerNames.includes(name)) {
      map.meaning = field;
      taken.add(field);
      lastMatch = index;
    } else if (!map.term && learnedNames.includes(name)) {
      map.term = field;
      taken.add(field);
      lastMatch = index;
    }
  });

  const free = (from, to) =>
    fields.slice(from, to).filter((field) => !taken.has(field));
  const left = lastMatch === -1
    ? free(0)
    : free(lastMatch + 1).concat(free(0, lastMatch));

  for (const role of CARD_FIELDS) {
    if (map[role]) continue;
    const next = left.findIndex((field) => role === "term" || field !== fields[0]);
    if (next === -1) continue;
    map[role] = left.splice(next, 1)[0];
  }
  return map;
}

/* The note Anki is handed. Only the fields the reader mapped are written —
   a role pointing at nothing is a role they said not to write, and a field of
   the note type nobody pointed at is left for whatever else fills it.

   With one exception, and it is the whole reason a card can be filed at all:
   **the note type's first field gets the word** where nothing else was mapped
   to it. Anki decides at that one field whether a note is empty and whether
   it is a duplicate, and it refuses a note whose first field is blank —
   `cannot create note because it is empty`. On a note type where
   that field is called `ID` and means nothing to a reader, so nobody would
   ever map it, and every card was refused.

   Doing it here rather than in the mapping keeps the three lists
   about the three fields a reader can see, and makes the duplicate check the
   one that is wanted: the same word twice. `order` is the note type's fields
   as Anki lists them; without it nothing is added, because the first field is
   then unknown. */
export function noteFields(card, mapping, order) {
  const fields = {};
  for (const role of CARD_FIELDS) {
    const name = mapping && mapping[role];
    if (name) fields[name] = asHtml(card[role]);
  }
  const first = Array.isArray(order) ? order[0] : null;
  if (first && !(first in fields)) fields[first] = asHtml(card.term);
  return fields;
}

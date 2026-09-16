/* Reading back the longer explanation of a picked word: one paragraph of
   plain text and the example sentences under it. What a model writes around
   them anyway — markdown emphasis, a heading, a bullet, a line break, the
   paragraph in quotation marks — is taken off rather than held against it.

   An example is a line of its own in a shape that names no language:
   `EXAMPLE: <kind> | <sentence> | <translation>`. The kind and the
   translation may both be missing — a word in the reader's own language has
   nothing to translate into — and a line with neither a sentence nor the
   separators is not an example and stays in the paragraph. */

import { wordSet } from "../languages/index.js";
import { stripDiacritics } from "../text.js";

const MARKER = /^\s*(?:EXAMPLE|BEISPIEL)\s*[:\-–]\s*/i;
/* The same word wherever it stands: a model asked for a paragraph and then
   example lines writes all of it on one line — measured, 19 of 19 on a local
   model — and the marker is then the only thing saying where the paragraph
   ends. */
const ANYWHERE = /(?:^|\s)(?:EXAMPLE|BEISPIEL)\s*[:\-–]\s*/i;

function clean(value) {
  return String(value || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[\s(])\*(\S(?:.*?\S)?)\*(?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“„«»](.*)["”“«»]$/s, "$1")
    .trim();
}

/* The lines a model's answer is made of, with what it wrapped them in taken
   off: a heading's hashes, a bullet, a fence. */
function linesOf(raw) {
  return String(raw || "")
    .replace(/```[a-z]*\n?/gi, "")
    /* The marker begins a line wherever a model put it. */
    .replace(new RegExp(ANYWHERE.source, "gi"), "\nEXAMPLE: ")
    .split(/\n+/)
    .map((line) => line
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
      /* Bold marks come off before the marker is looked for, or an example a
         model set in bold — `**EXAMPLE:**` — would read as a paragraph. */
      .replace(/\*\*/g, "")
      .trim())
    .filter(Boolean);
}

/* How many words a piece of text is made of, in any script. */
const words = (value) => (value.match(/\S+/g) || []).length;

/* The kind of use an example shows is one word, two at the outside. Anything
   longer is not a kind: it is one of the two sentences, standing in the wrong
   field. */
const KIND_WORDS = 3;

function fields(line) {
  const parts = line.replace(MARKER, "").split("|").map(clean);
  /* Three fields are asked for, and a model that has been told it may leave
     the first one empty writes the separator anyway and starts the line with
     it: `| | sentence | translation`. Anything empty in front of the three is
     dropped, and anything after them belongs to the last of them — a
     translation with a separator in it is likelier than a fourth field. */
  while (parts.length > 3 && parts[0] === "") parts.shift();
  if (parts.length > 3) parts.splice(2, parts.length, parts.slice(2).filter(Boolean).join(" "));

  let [kind, sentence, translation] = ["", "", ""];
  if (parts.length >= 3) {
    [kind, sentence, translation] = parts;
  } else if (parts.length === 2) {
    /* Two fields and no way to be told which pair they are, except by their
       length: a kind is a word or two, a sentence is not. */
    if (words(parts[0]) > KIND_WORDS) [sentence, translation] = parts;
    else [kind, sentence] = parts;
  } else {
    sentence = parts[0] || "";
  }

  /* A whole sentence where the kind belongs: the model wrote the translation
     first and the sentence after it. It goes where it was meant to go, unless
     something already stands there, and then it is dropped — a sentence
     nobody can place is worse than none. */
  if (words(kind) > KIND_WORDS) {
    translation = translation || kind;
    kind = "";
  }
  /* The fields shifted by one: told it may leave the kind empty and keep the
     separators, a model writes the kind in the sentence's place and the
     sentence in the translation's. One word is no sentence in any language,
     and that is the whole test. */
  if (sentence && translation && !/\s/.test(sentence)) {
    [kind, sentence, translation] = [kind || sentence, translation, ""];
  }
  if (!sentence) return null;
  /* "[/]", "[__]", "[-]": the local model keeps the separators it was told to
     keep and writes a placeholder between them. A kind with no letter in it
     is no kind. */
  if (kind && !/\p{L}/u.test(kind)) kind = "";
  /* The translation written out as the sentence over again. It says nothing,
     and beside the sentence in italics it reads as though the two were
     different. The sentence is the part that was asked for, so the copy
     goes. */
  const bare = (value) => String(value || "").replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
  if (translation && bare(translation) === bare(sentence)) translation = "";
  return { kind: kind || "", sentence, translation: translation || "" };
}

/* Which of two languages a line reads as, by the function words it carries.
   An example sentence is nine words at most and may carry only one of them,
   so the question is not which language is likelier in general but which of
   these two it is — and that is decided where one of them is touched and the
   other is not at all, or where one leads by two. A sentence carrying none of
   either reads as neither. Nothing here knows a word of any language: both
   lists come from the packs. */
const DECISIVE = 2;

function readsAs(line, a, b) {
  const found = stripDiacritics(String(line || "")).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const score = (code) => {
    const words = wordSet(code, "functionWords", "auxiliaries", "conjunctions");
    return found.reduce((n, word) => n + (words.has(word) ? 1 : 0), 0);
  };
  const first = score(a);
  const second = score(b);
  const wins = (mine, theirs) => (mine && !theirs) || mine - theirs >= DECISIVE;
  if (wins(first, second)) return a;
  if (wins(second, first)) return b;
  return "";
}

/* An example written in the wrong language, put right where it can be and
   dropped where it cannot.

   The question says which language the sentence is in, and both models still
   write the reader's own under a term that is a name — "Terminal-Bench v2 ist
   viel zu schwer", with the same sentence again as its translation. The local
   model does it the other way round and fills the two fields in swapped
   order, which is an answer with its labels crossed rather than a wrong
   answer: those are simply turned back. Where only the sentence is in the
   reader's language there is nothing to turn, and an example in the language
   the reader already speaks teaches nothing, so it goes. */
export function rightWayRound(example, source, reader) {
  if (!example || !source || !reader || source === reader) return example;
  const of = (line) => readsAs(line, source, reader);
  if (of(example.sentence) !== reader) return example;
  if (example.translation && of(example.translation) === source) {
    return { ...example, sentence: example.translation, translation: example.sentence };
  }
  return null;
}

/* One example line. The marker is what tells an example from the paragraph
   around it — but asked for one line and nothing else, a model answers with
   the fields alone and no marker at all: measured, 5 of 19 on a cloud model.
   So a line carrying the two separators is an example whether it names
   itself one or not.

   Nothing here is null but the whole example: a sentence alone is an
   example, a kind alone is not. */
/* A kind written in brackets in front of the sentence, "[Besitz] sentence |
   translation", is the kind in a field of its own: the local model writes the
   line that way once the question lists the kinds already shown. */
const BRACKETED = /^((?:EXAMPLE|BEISPIEL)\s*[:\-–]\s*)?\[([^\]|]{1,40})\]\s*/i;

export function parseExample(raw, { source, reader } = {}) {
  const lines = linesOf(raw).map((line) => line.replace(BRACKETED, (_, marker, kind) => `${marker || ""}${kind} | `));
  for (const line of lines) {
    if (!MARKER.test(line)) continue;
    const one = rightWayRound(fields(line), source, reader);
    if (one) return one;
  }
  for (const line of lines) {
    if (line.split("|").length < 3) continue;
    const one = rightWayRound(fields(line), source, reader);
    if (one) return one;
  }
  return null;
}

export function parseMore(raw, { source, reader } = {}) {
  const paragraph = [];
  const examples = [];
  for (const line of linesOf(raw)) {
    if (MARKER.test(line)) {
      const example = parseExample(line, { source, reader });
      if (example) examples.push(example);
      continue;
    }
    paragraph.push(line);
  }
  const text = clean(paragraph.join(" "));
  if (!text && !examples.length) return null;
  return { text, examples };
}

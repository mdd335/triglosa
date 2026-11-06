/* Reading an improved card back.

   The word and its meaning: two lines, and where the sentence from the text
   came without a translation, a line of three hyphens and the sentence
   translated underneath. The local model leaves the hyphens out about half
   the time and keeps the rest of the shape, so without them the first two
   lines are taken as the two words. Anything else is not taken: the card on
   screen stays as it was, and the reader has lost nothing.

   The sentence from the text is the one thing the explanation must keep, and
   it is not left to the model: it is written as it stood, at the top, with
   the translation it came with or the one the answer gave. A model given half
   a sentence — a selection, a line without its full stop — hands it back
   tidied, with a capital and a stop: that is the same sentence. */

import { exampleLine } from "../card.js";

const MOST_TERM_WORDS = 8;

const unwrap = (line) => String(line || "")
  .replace(/^\s*(?:field\s*[123]\s*[:.-]|[-*•]\s+)/i, "")
  .trim()
  .replace(/^<|>$/g, "")
  .replace(/^["“„«]|["”»]$/g, "")
  .trim();

const bare = (s) => String(s || "").replace(/[\s\p{P}]+/gu, " ").trim().toLowerCase();

/* An example line as its two parts: the sentence, and the translation in the
   brackets that close the line. Brackets inside the translation are its own. */
function exampleParts(line) {
  const text = String(line || "").trim().replace(/(\))[.!?]$/, "$1");
  if (!text.endsWith(")")) return { sentence: text, translation: "" };
  let depth = 0;
  for (let at = text.length - 1; at >= 0; at -= 1) {
    if (text[at] === ")") depth += 1;
    else if (text[at] === "(" && (depth -= 1) === 0) {
      return { sentence: text.slice(0, at).trim(), translation: text.slice(at + 1, -1).trim() };
    }
  }
  return { sentence: text, translation: "" };
}

/* The explanation as items, a blank line between every two. A translation
   the model put on a line of its own belongs to the example above it: one
   example, one line. And a translation in square brackets is one in round
   ones that the local model wrote the other way. Two examples one under the
   other read as one block on a card. */
function items(text) {
  return text
    .replace(/ \[([^[\]\n]+)\](?=[.!?]?[ \t]*$)/gm, " ($1)")
    .replace(/\n[ \t]*(?=\([^\n]*\)[ \t]*$)/gm, " ")
    .replace(/[ \t]*\n\s*/g, "\n\n")
    .trim();
}

const unfenced = (raw) => String(raw || "")
  .replace(/^\s*```[a-z]*\s*$/gim, "")
  .replace(/\r/g, "");

/* What the reader wrote into the explanation themselves: every line of it
   that neither the app nor the model put there (`card.given`, the note as
   it last arrived) and that is not the text's own sentence. Kept on an
   improved card, after the text's sentence, and a sentence among them in the
   language being learned gets its translation as that one does. A line
   that already ends in a translation is kept as it stands. */
export function readerLines(card) {
  const given = new Set(String(card?.given ?? card?.note ?? "").split("\n").map(bare).filter(Boolean));
  const own = bare(card?.context?.sentence);
  return String(card?.note || "").split("\n").map((line) => line.trim())
    .filter((line) => line && !given.has(bare(line)) && !(own && bare(line).includes(own)))
    .map((line) => ({ line, untranslated: !exampleParts(line).translation }));
}

/* The word, its meaning, and the sentence from the text as the card's first
   line ("" where there is none); `own` the reader's lines, each with the
   translation the answer gave it where it asked for one. */
export function parseImprovedCard(raw, card) {
  const lines = unfenced(raw).split("\n");
  let rule = lines.findIndex((line) => /^\s*-{3,}\s*$/.test(line));
  let rest = rule + 1;
  if (rule === -1) {
    const filled = lines.map((line, index) => [line, index]).filter(([line]) => line.trim());
    if (filled.length < 2) return null;
    rule = rest = filled[1][1] + 1;
  }

  const head = lines.slice(0, rule).map(unwrap).filter(Boolean);
  if (head.length < 2) return null;
  const [term, meaning] = head;
  if (term.split(/\s+/).length > MOST_TERM_WORDS) return null;

  let sentence = "";
  const context = card && card.context;
  const given = items(lines.slice(rest).filter((line) => !/^\s*-{3,}\s*$/.test(line)).join("\n")).split("\n\n");
  const translationOf = (said) => {
    const found = given.find((item) => item.includes(said) || bare(exampleParts(item).sentence) === bare(said));
    return found ? exampleParts(found).translation : "";
  };
  if (context && context.sentence) {
    sentence = exampleLine({ sentence: context.sentence, translation: context.translation || translationOf(context.sentence) });
  }
  const own = readerLines(card).map(({ line, untranslated }) =>
    untranslated ? exampleLine({ sentence: line, translation: translationOf(line) }) : line);
  /* Two senses one under the other, the semicolon kept at the end of the
     first line. */
  return { term, meaning: meaning.replace(/\s*;\s*/g, ";\n"), sentence, own };
}

/* The explanation asked apart: its items, without a line that repeats the
   card's own sentence. */
export function parseCardExplanation(raw, sentence = "", others = []) {
  const text = items(unfenced(raw).split("\n").filter((line) => !/^\s*-{3,}\s*$/.test(line)).join("\n"));
  const own = new Set([sentence, ...others].map((line) => bare(exampleParts(line).sentence)).filter(Boolean));
  return text.split("\n\n").filter((item) => item && !own.has(bare(exampleParts(item).sentence))).join("\n\n");
}

/* The explanation's answer as its two parts: the notes, one sentence each,
   and the examples, one line each. Read by the headings where they came;
   where one is missing, a line ending in a bracketed translation is an
   example and anything else a note. "NONE", or a label alone, is no note. */
export function parseCardNotes(raw) {
  const lines = items(unfenced(raw).split("\n").filter((line) => !/^\s*-{3,}\s*$/.test(line)).join("\n"))
    .split("\n\n").map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/\*\*/g, "").trim());
  const notes = [];
  const examples = [];
  let part = "";
  for (const line of lines) {
    const heading = line.match(/^(NOTES?|EXAMPLES?)\s*:\s*(.*)$/i);
    const text = heading ? heading[2].trim() : line;
    if (heading) part = /^N/i.test(heading[1]) ? "notes" : "examples";
    if (!text || /^\W*none\W*$/i.test(text)) continue;
    const example = !!exampleParts(text).translation;
    if (part === "examples" || (!part && example)) examples.push(text);
    else if (/\p{L}{2}/u.test(text) && !/:$/.test(text)) notes.push(text);
  }
  return { notes, examples };
}

/* The check's verdicts: a note is kept only where its line says TRUE and
   NEW. A note the answer said nothing about is not kept. */
export function parseNoteVerdicts(raw, count) {
  const kept = Array(count).fill(false);
  for (const line of unfenced(raw).split("\n")) {
    const found = line.match(/^\W*(\d+)\W+(TRUE|FALSE|UNSURE)\W+(NEW|OBVIOUS)\b/i);
    if (!found) continue;
    const at = Number(found[1]) - 1;
    if (at >= 0 && at < count) kept[at] = /^TRUE$/i.test(found[2]) && /^NEW$/i.test(found[3]);
  }
  return kept;
}

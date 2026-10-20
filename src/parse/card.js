/* Reading an improved card back.

   Three fields: two lines, a line of three hyphens, and the explanation
   underneath. The local model leaves the hyphens out about half the time and
   keeps the rest of the shape, so without them the first two lines are taken
   as the two words — where there are at least three. Anything else is not
   taken: the card on screen stays as it was, and the reader has lost nothing.

   The sentence from the text is the one thing the explanation must keep, and
   it is not left to the model: where the answer does not carry it, it is put
   back at the top. A model given half a sentence — a selection, a line
   without its full stop — hands it back tidied, with a capital and a stop:
   that is the same sentence, and it is written as it stood, once. */

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

export function parseImprovedCard(raw, card) {
  const text = String(raw || "")
    .replace(/^\s*```[a-z]*\s*$/gim, "")
    .replace(/\r/g, "");
  const lines = text.split("\n");
  let rule = lines.findIndex((line) => /^\s*-{3,}\s*$/.test(line));
  if (rule === -1) {
    const filled = lines.map((line, index) => [line, index]).filter(([line]) => line.trim());
    if (filled.length < 3) return null;
    rule = filled[1][1] + 1;
    lines.splice(rule, 0, "---");
  }

  const head = lines.slice(0, rule).map(unwrap).filter(Boolean);
  if (head.length < 2) return null;
  const [term, meaning] = head;
  if (term.split(/\s+/).length > MOST_TERM_WORDS) return null;

  /* A translation the model put on a line of its own belongs to the example
     above it: one example, one line. And a translation in square brackets is
     one in round ones that the local model wrote the other way. Every line
     then an item of its own, a blank line between them: two examples one
     under the other read as one block on a card. */
  let note = lines.slice(rule + 1).join("\n")
    .replace(/ \[([^[\]\n]+)\](?=[.!?]?[ \t]*$)/gm, " ($1)")
    .replace(/\n[ \t]*(?=\([^\n]*\)[ \t]*$)/gm, " ")
    .replace(/[ \t]*\n\s*/g, "\n\n")
    .trim();
  if (!note) return null;

  const context = card && card.context;
  if (context && context.sentence && !note.includes(context.sentence)) {
    const items = note.split("\n\n");
    const at = items.findIndex((item) => bare(exampleParts(item).sentence) === bare(context.sentence));
    const theirs = at === -1 ? "" : exampleParts(items.splice(at, 1)[0]).translation;
    const line = exampleLine({ sentence: context.sentence, translation: context.translation || theirs });
    note = [line, ...items].join("\n\n");
  }
  /* Two senses one under the other, the semicolon kept at the end of the
     first line. */
  return { term, meaning: meaning.replace(/\s*;\s*/g, ";\n"), note };
}

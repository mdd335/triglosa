/* Where a word went, read off the word aligner's links instead of asked of
   the model.

   `links` is what a reading keeps of the aligner's answer (run.js): the
   panels it was asked about and, sentence by sentence, where the sentence
   stands in the original and in each of those panels, with the pairs
   [word of the original, word of the panel] for each. Pure: no DOM, no
   model, no shell. */

import { toTokens } from "../text.js";

const wordsIn = (text, range) => toTokens(text.slice(range.start, range.end))
  .filter((token) => token.isWord)
  .map((token) => ({ start: range.start + token.start, end: range.start + token.end }));

/* Where the words of a range of one panel stand in another: one range per
   run of words standing side by side, in the order of the text. Empty where
   the links say nothing — a panel the aligner was not asked about, a range in
   no sentence, a word linked to nothing.

   `from` and `to` are panel numbers, 0 the original. Between two
   translations the way leads through the original. */
export function rangesAcross(links, texts, from, range, to) {
  if (!links || from === to) return [];
  const column = (panel) => (panel === 0 ? -1 : links.panels.indexOf(panel));
  const [fromColumn, toColumn] = [column(from), column(to)];
  if ((from !== 0 && fromColumn === -1) || (to !== 0 && toColumn === -1)) return [];
  const side = (sentence, at) => (at === -1 ? sentence : at === 0 ? sentence.to : sentence.second);

  const found = [];
  for (const sentence of links.sentences) {
    const here = side(sentence, fromColumn);
    const there = side(sentence, toColumn);
    if (!here || !there || range.start >= here.end || range.end <= here.start) continue;
    const marked = wordsIn(texts[from], here)
      .map((word, index) => (word.start < range.end && word.end > range.start ? index : -1))
      .filter((index) => index !== -1);
    const original = fromColumn === -1
      ? marked
      : (sentence.links[fromColumn] || []).filter(([, word]) => marked.includes(word)).map(([word]) => word);
    const landed = toColumn === -1
      ? original
      : (sentence.links[toColumn] || []).filter(([word]) => original.includes(word)).map(([, word]) => word);
    const words = wordsIn(texts[to], there);
    for (const index of [...new Set(landed)].sort((x, y) => x - y)) {
      if (!words[index]) continue;
      const last = found[found.length - 1];
      if (last && last.index === index - 1 && /^[\s'’-]*$/.test(texts[to].slice(last.end, words[index].start))) {
        last.end = words[index].end;
        last.index = index;
      } else {
        found.push({ ...words[index], index });
      }
    }
  }
  return found.map((run) => ({ start: run.start, end: run.end }));
}

/* The same as the fragments an assignment holds: the words themselves. */
export function fragmentsAcross(links, texts, from, range, to) {
  return rangesAcross(links, texts, from, range, to).map((run) => texts[to].slice(run.start, run.end));
}

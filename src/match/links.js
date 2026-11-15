/* Where a word went, read off the word aligner's links instead of asked of
   the model.

   `links` is what a reading keeps of the aligner's answer (run.js): the
   panels it was asked about and, sentence by sentence, where the sentence
   stands in the original and in each of those panels, with the pairs
   [word of the original, word of the panel] for each. Pure: no DOM, no
   model, no shell. */

import { toTokens } from "../text.js";
import { isFunctionWord } from "../vocabulary.js";

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
    /* A gap of one or two small words of the panel's language that nobody
       took is no gap: "chatbot de IA" for "KI-Chatbot", where the aligner
       links the two words carrying meaning and leaves "de" to nobody. */
    const code = links.codes?.[to];
    const taken = new Set(toColumn === -1
      ? (sentence.links || []).flatMap((column) => (column || []).map(([word]) => word))
      : (sentence.links[toColumn] || []).map(([, word]) => word));
    const bridged = (from, until) => {
      if (!code || until - from > 2) return false;
      for (let at = from; at < until; at++) {
        const word = texts[to].slice(words[at].start, words[at].end);
        if (taken.has(at) || !isFunctionWord(word, [code])) return false;
      }
      return true;
    };
    const runs = [];
    for (const index of [...new Set(landed)].sort((x, y) => x - y)) {
      if (!words[index]) continue;
      const last = runs[runs.length - 1];
      const apart = last && last.last < index - 1 && bridged(last.last + 1, index);
      if (last && (last.last === index - 1 || apart) && /^[\s\p{L}\p{N}'’-]*$/u.test(texts[to].slice(words[last.last].end, words[index].start))) {
        last.last = index;
      } else {
        runs.push({ first: index, last: index });
      }
    }
    const grown = fromColumn === -1 && marked.length > 1
      ? grow(runs, words, texts[to], marked, sentence.links[toColumn] || [], sentence.best?.[toColumn], code)
      : runs;
    for (const run of grown) found.push({ start: words[run.first].start, end: words[run.last].end });
  }
  return found;
}

/* How far a mark of several words reaches in a translation, past what the
   links say (run eighty-four). The aligner links word to word and leaves
   the word at the edge of an expression alone — "lazy" for "too lazy",
   "Lust" for "keine Lust", "had dozed" for "had dozed off" — and that word
   is often the one that carries the sense. The entry's place in the
   original is known, so a word of the translation beside a run, or in a
   gap between two, is taken in where no word outside the entry is linked to
   it and the word of the original it holds on to most (`best`, the
   aligner's own scores) stands inside the entry: two at most on each side,
   never across punctuation. Taken in by links alone, without the scores,
   it brought an article or a preposition from beside the entry ("meet up
   on", "the key rate unchanged") more often than the word that was
   missing. */
const GROW = 2;
function grow(runs, words, text, marked, links, best, code) {
  if (!runs.length || !Array.isArray(best)) return runs;
  const inside = new Set(marked);
  const claimed = new Set(links.filter(([word]) => !inside.has(word)).map(([, word]) => word));
  const free = (at) => at >= 0 && at < words.length && !claimed.has(at) && inside.has(best[at]);
  const between = (a, b) => text.slice(words[a].end, words[b].start);
  const plain = (a, b) => /^[\s'’-]*$/.test(between(a, b));
  const joined = [];
  for (const run of runs) {
    const last = joined[joined.length - 1];
    let open = !!last;
    for (let at = last ? last.last + 1 : 0; open && at < run.first; at++) open = free(at) && plain(at - 1, at);
    /* Two runs side by side with only a comma between them are one piece
       of the entry: a passage keeps the comma it has. */
    const comma = !!last && run.first === last.last + 1 && /^[\s,;:]+$/.test(between(last.last, run.first));
    if ((open && plain(run.first - 1, run.first)) || comma) last.last = run.last;
    else joined.push({ ...run });
  }
  /* One word cut in two by the counting is one word: "can't", "I'm",
     "49.3". */
  const glued = (a, b) => /^['’]$/.test(between(a, b))
    || (/^[.,]$/.test(between(a, b)) && /^\p{N}+$/u.test(text.slice(words[a].start, words[a].end)) && /^\p{N}+$/u.test(text.slice(words[b].start, words[b].end)));
  const small = (at) => !!code && isFunctionWord(text.slice(words[at].start, words[at].end), [code]);
  for (const run of joined) {
    for (let n = 0; n < GROW && free(run.first - 1) && plain(run.first - 1, run.first); n++) run.first--;
    const linked = run.last;
    for (let n = 0; n < GROW && free(run.last + 1) && plain(run.last, run.last + 1); n++) run.last++;
    /* A small word taken in at the end leans on what follows: "had taken
       from", "decided to", "angesichts der" (run eighty-four). In front it
       is the entry's own — "se abstendría", "the key rate". */
    while (run.last > linked && small(run.last)) run.last--;
    while (run.first > 0 && glued(run.first - 1, run.first)) run.first--;
    while (run.last < words.length - 1 && glued(run.last, run.last + 1)) run.last++;
  }
  /* Two runs that met while growing are one. */
  return joined.reduce((out, run) => {
    const last = out[out.length - 1];
    if (last && run.first <= last.last + 1 && (plain(last.last, run.first) || /^[\s,;:]+$/.test(between(last.last, run.first)))) last.last = Math.max(last.last, run.last);
    else out.push({ ...run });
    return out;
  }, []);
}

/* The same as the fragments an assignment holds: the words themselves. */
export function fragmentsAcross(links, texts, from, range, to) {
  return rangesAcross(links, texts, from, range, to).map((run) => texts[to].slice(run.start, run.end));
}

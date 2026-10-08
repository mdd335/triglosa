/* Which fragments get coloured in which panel.

   Panel 0 holds the original, so the spots are the words and forms
   themselves. In a translation the model said where they went: column A is
   the first translation, column B the second.

   Words before verbs: where both point at the same spot, the colour belongs
   to the term. First come, first coloured. */

import { distributeSpots } from "./match/columns.js";
import { rangesOf, spotsFor } from "./match/positions.js";
import { otherPanels } from "./panels.js";
import { namesTheLookup } from "./parse/words.js";

export function fragmentsForPanel(state, index) {
  const words = state.words || [];
  const verbs = state.verbs || [];

  if (index === 0) {
    /* A lookup's term is marked only where it differs from the words
       themselves: here where it stands among them, in the sentence where it
       reaches beyond them (fragmentsForSentence). Left out here, it keeps
       its place in the list, so its colour stays its row's. */
    const marked = (word) => !state.short
      || (differsFromLookup(state, word) && (!state.sentence || withinLookup(state, word)));
    return {
      words: words.map((word) => (marked(word) ? [word.spot || word.text] : [])),
      verbs: verbs.map((verb) => [verb.form]),
    };
  }

  const column = index === 1 ? "a" : "b";
  return {
    words: state.wordAlign ? state.wordAlign[column] || [] : [],
    verbs: state.verbAlign ? state.verbAlign[column] || [] : [],
    /* Whereabouts each one stands, where the word aligner knows: see run.js. */
    near: {
      words: state.wordAlign?.near?.[column] || [],
      verbs: state.verbAlign?.near?.[column] || [],
    },
  };
}

/* Is a lookup's term more, or less, than the looked-up words? Then it has
   a row of its own, a place to mark and a card; otherwise the entry above
   already is all of that, and the term adds its note. */
export function differsFromLookup(state, word) {
  return !namesTheLookup(word.text, state.text, state.panels[0]?.code);
}

/* Does a lookup's term stand among the looked-up words, every part of it? */
function withinLookup(state, word) {
  const parts = String(word.spot || word.text).split("+").map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((part) => spotsFor(state.text, part).length > 0);
}

/* The term marked in the sentence a short text was looked up in, where it
   reaches beyond the looked-up words. */
export function fragmentsForSentence(state) {
  if (!state.short || !state.sentence) return [];
  return (state.words || []).map((word) =>
    (differsFromLookup(state, word) && !withinLookup(state, word) ? [word.spot || word.text] : []));
}

/* Where the word the reader picked out stands, panel by panel.

   In the panel it came from it is the selection itself. In the others the
   model said where it went, A and B in the order otherPanels() gives — the
   reader's own language first, because every example in the prompt shows A
   that way and the model follows the examples more reliably than the labels. */
export function selectionForPanel(state, index, languages) {
  const selection = state.selection;
  /* Picked in the sentence under a short text, it stands in no panel. */
  if (!selection || selection.inSentence) return null;
  if (selection.panel === index) return [{ start: selection.start, end: selection.end }];
  if (!state.marked) return null;

  const source = state.panels[0]?.code;
  const others = otherPanels(selection.panel, source, languages);
  const position = others.indexOf(index);
  if (position === -1) return null;

  const codes = state.panels.map((panel) => panel.code).filter(Boolean);
  const pair = distributeSpots(
    state.marked,
    state.panels[others[0]]?.text || "",
    state.panels[others[1]]?.text || "",
    codes,
  );
  return pair[position] || fromEquivalent(state, index, languages, codes);
}

/* The spot question fails on one panel often enough to be worth catching: the
   model gives up on the harder half and writes the label back, or names words
   that are not in that text. For the reader's own panel there is a second
   answer already in hand — the equivalent from the meaning question, written
   in exactly that language. It is what the reader would look for anyway.

   Only there. In a panel of a third language nothing else is known, and a
   guess would be worse than no colour. */
function fromEquivalent(state, index, languages, codes) {
  const reader = (languages || [])[0];
  if (state.panels[index]?.code !== reader) return null;
  const equivalent = state.marked?.meaning;
  if (!equivalent) return null;
  return rangesOf(state.panels[index].text || "", equivalent, state.marked.text, codes, { passage: !!state.marked.passage });
}

/* Which fragments get coloured in which panel.

   Panel 0 holds the original, so the spots are the words and forms
   themselves. In a translation the model said where they went: column A is
   the first translation, column B the second.

   Words before verbs: where both point at the same spot, the colour belongs
   to the term. First come, first coloured. */

import { spotsFor } from "./match/positions.js";
import { namesTheLookup } from "./parse/words.js";

export function fragmentsForPanel(state, index) {
  const words = state.words || [];
  const verbs = state.verbs || [];
  /* A term that is the whole text is marked nowhere: a line under every
     word says nothing a line under none would not (author 2026-11-05), as
     a lookup's term that names the looked-up words is not marked either.
     Left out, it keeps its place in the list and its row its colour. */
  const whole = (word) => !state.short && !!state.text && namesTheLookup(word.text, state.text, state.panels?.[0]?.code);

  if (index === 0) {
    /* A lookup's term is marked only where it differs from the words
       themselves: here where it stands among them, in the sentence where it
       reaches beyond them (fragmentsForSentence). Left out here, it keeps
       its place in the list, so its colour stays its row's. */
    const marked = (word) => !state.short
      || (differsFromLookup(state, word) && (!state.sentence || withinLookup(state, word)));
    return {
      words: words.map((word) => (marked(word) && !whole(word) ? [word.spot || word.text] : [])),
      verbs: verbs.map((verb) => [verb.form]),
    };
  }

  const column = index === 1 ? "a" : "b";
  return {
    words: state.wordAlign ? (state.wordAlign[column] || []).map((spots, i) => (words[i] && whole(words[i]) ? [] : spots)) : [],
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
   word aligner said where it went (`marked.ranges`, worked out in app.js
   from the reading's links, run eighty-four); where it found no place the
   panel shows none — no model is asked. */
export function selectionForPanel(state, index) {
  const selection = state.selection;
  /* Picked in the sentence under a short text, it stands in no panel. */
  if (!selection || selection.inSentence) return null;
  if (selection.panel === index) return [{ start: selection.start, end: selection.end }];
  const ranges = state.marked?.ranges?.[index];
  return ranges?.length ? ranges : null;
}

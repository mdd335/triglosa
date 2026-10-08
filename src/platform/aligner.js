/* The word aligner in the shell: which words of a sentence became which
   words of its translation, worked out on this machine (src-tauri/src/align.rs).

   `invoke` is handed in, so that this file is the same in the app and in a
   test. Positions go out as the window counts them; the shell does its own
   counting. */

import { toTokens } from "../text.js";

const wordsOf = (text) => toTokens(text).filter((token) => token.isWord).map((token) => [token.start, token.end]);

export function createAligner(invoke) {
  return {
    /* Whether the model's files are on this machine. False rather than a
       failure: without them the hover is asked of the AI model. */
    ready: () => invoke("aligner_ready").then((answer) => !!answer, () => false),

    /* For every { source, target } the pairs [word of the source, word of
       the target], by their numbers among the words of each. */
    align: (pairs) => invoke("align_words", {
      pairs: pairs.map(({ source, target }) => ({
        source,
        target,
        source_words: wordsOf(source),
        target_words: wordsOf(target),
      })),
    }),
  };
}

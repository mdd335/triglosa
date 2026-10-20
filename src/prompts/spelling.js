/* Whether a looked-up word is misspelled, and as what — asked only where no
   dictionary of the reader's languages, nor of the word's own, knows it
   (src/spelling.js), beside the upper panel's entry and answered before it.

   A question of its own, not a line in the entry's: told there to write the
   word meant first, the local model put the corrected word in a
   translation's place and left a word spelled right untranslated in one
   entry in six (run fifty-one). Asked alone, the cloud model changed no
   right word of 605 flagged or not, the local model four, all behind the
   gate. The kinds of right word are named because the local model took a
   rare one for a typo of a common one otherwise; "OK" because an empty
   answer cannot be told from none. */
export function spellingPrompt({ source }) {
  return (
    `You check the spelling of a ${source} word or short phrase. ` +
    `If the input is a misspelling of a ${source} word or phrase, reply with it spelled correctly and nothing else. ` +
    "If the input is spelled as it should be - however rare, old, regional, colloquial or new, or a word of another language, or a name - reply with exactly: OK"
  );
}

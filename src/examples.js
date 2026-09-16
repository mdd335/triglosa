/* The example sentences under a row, and the one rule they follow.

   They arrive from two places — with a longer explanation, and one at a time
   on the button beside it — and neither may throw the other's away: a reader
   who asked for two sentences and then for the explanation has asked for
   both. So the lists are joined rather than replaced, oldest first, and the
   ceiling counts them all. */

/* How many example sentences one row may hold, whichever question brought
   them. More than this about one word is a dictionary. */
export const MAX_EXAMPLES = 4;

/* Letters and digits of any script. `\W` counts no Cyrillic and no Arabic
   character as a word character at all, so two different Russian sentences
   would both fold to nothing and read as the same one. */
const bare = (one) => String(one || "").replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();

/* One list out of two: what is there, then what has arrived, without a
   sentence that already stands there and without more than the ceiling. */
export function withExamples(existing = [], arriving = []) {
  const kept = [...(existing || [])];
  for (const one of arriving || []) {
    if (!one?.sentence) continue;
    if (kept.some((there) => bare(there.sentence) === bare(one.sentence))) continue;
    /* A kind already standing above says nothing the second time. Asked not
       to repeat one, the cloud model still wrote "umgangssprachlich" under
       four sentences of eight rows in ten, so it is left off here instead. */
    const said = one.kind && kept.some((there) => bare(there.kind) === bare(one.kind));
    kept.push(said ? { ...one, kind: "" } : one);
  }
  return kept.slice(0, MAX_EXAMPLES);
}

/* Whether one more may be asked for. */
export function roomForExample(examples) {
  return (examples?.length || 0) < MAX_EXAMPLES;
}

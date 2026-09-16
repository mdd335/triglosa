/* Which of the two answer columns belongs to which panel.

   The model does not always keep to the A/B labelling. The prompt examples
   show the user's own language in A, and it holds to that even when A is
   labelled otherwise. It shows: the swapped reading finds more spots. On a
   tie the straight reading stands — a swap has to earn itself. */

import { rangesOf, spotsFor } from "./positions.js";

/* For one entry. */
export function distributeSpots(entry, aText, bText, codes) {
  const kind = { passage: !!entry.passage };
  const straight = [rangesOf(aText, entry.a, entry.text, codes, kind), rangesOf(bText, entry.b, entry.text, codes, kind)];
  const swapped = [rangesOf(aText, entry.b, entry.text, codes, kind), rangesOf(bText, entry.a, entry.text, codes, kind)];
  const count = (pair) => (pair[0]?.length ? 1 : 0) + (pair[1]?.length ? 1 : 0);
  return count(swapped) > count(straight) ? swapped : straight;
}

/* The same principle for a whole assignment. The check existed for the
   clicked word all along; the two tables lacked it, and there one panel's
   spots were searched for in the other panel's text, finding nothing. */
export function fixSwappedColumns(assignment, aText, bText) {
  if (!assignment || !assignment.a || !assignment.b) return assignment;
  const count = (groups, text) =>
    (groups || []).reduce(
      (n, group) => n + (group || []).filter((f) => spotsFor(text, f).length).length,
      0,
    );
  const straight = count(assignment.a, aText) + count(assignment.b, bText);
  const swapped = count(assignment.b, aText) + count(assignment.a, bText);
  return swapped > straight ? { a: assignment.b, b: assignment.a } : assignment;
}

/* What a field says about the term the reader picked.

   Three questions the marked-word section and the synonym line both ask: is
   this a base form at all, does it contribute anything of its own, and where
   does the entry actually begin. */

import { stripDiacritics } from "../text.js";
import { languagePack } from "../languages/index.js";
import { isFunctionWord } from "../vocabulary.js";

const wordsOf = (s) =>
  stripDiacritics(String(s || ""))
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/* Does field 1 consist only of words that stand in the term itself? Then it
   is not an infinitive but a piece of the selection. Two cases:

     - The model repeats the term instead of writing the required dash
       ("fianza" for "fianza") — a row without content.
     - For a phrase it names one word out of it instead of the verb. Measured
       on "The defendant objected", where "defendant" came back and passed as
       an English infinitive, because English has no ending separating the
       two.

   A real infinitive brings at least one word that does not stand there:
   "tirar" in "tirar la toalla" against "tiramos la toalla".

   This is the right question for a synonym and for a term of one word, and
   the wrong one for a form written in two — see repeatsTerm below. */
export function isPartOfTerm(field, term) {
  const inField = wordsOf(field);
  if (!inField.length) return true;
  const inTerm = wordsOf(term);
  return inField.every((w) => inTerm.includes(w));
}

/* Is field 1 nothing but the term written out again?

   The weaker test, and the one a term of several words needs. A form its
   language writes in two carries its own base form inside it — an auxiliary
   with an infinitive, a particle with its verb, a future marker with its verb
   — so isPartOfTerm, which asks whether field 1 brings a word of its own,
   rejects the correct answer. Measured across the eight languages it threw
   away "appeal" for "will appeal", "chegar" for "vão chegar", "выступать"
   for "будет выступать" and every one of the four Arabic forms.

   What is left is the case that test was written for: the model repeating the
   term instead of writing a base form. Everything else the second question
   decides — see parseMarkedWord. */
export function repeatsTerm(field, term) {
  const inField = wordsOf(field);
  if (!inField.length) return true;
  const inTerm = wordsOf(term);
  return inField.length === inTerm.length && inTerm.every((w) => inField.includes(w));
}

/* Cut leading words that already stand in the term. For a phrase the model
   likes to name the subject along with it: for "El demandado impugnó" it
   returned "demandado impugnar", for "The defendant objected" accordingly
   "defendant object". What is left is the infinitive.
   An expression loses nothing: in "tirar la toalla", "tirar" does not stand
   in the term that way ("tiramos"), so nothing is cut. */
export function trimToBaseForm(field, term) {
  const inTerm = wordsOf(term);
  const parts = String(field || "").trim().split(/\s+/);
  while (parts.length > 1) {
    const head = wordsOf(parts[0])[0];
    if (!head || !inTerm.includes(head)) break;
    parts.shift();
  }
  return parts.join(" ");
}

/* Does this look like a base form? The bar is deliberately coarse: the real
   lock is that the model writes a dash for non-verbs and that the infinitive
   has to differ from the word clicked. Only what plainly is not a base form
   falls out here — "ser (implícito)", whole phrases, empty dashes.

   Where a language pack has no infinitive rule, anything that is not one of
   that language's own function words passes: showing one row too few beats a
   wrong one, but so does not suppressing a correct row on a guess. */
export function isBaseForm(s, code) {
  const verbs = languagePack(code).verbs;
  let t = stripDiacritics(String(s || "")).trim().toLowerCase();
  if (verbs?.infinitiveMarker) t = t.replace(verbs.infinitiveMarker, "");
  if (!t || t === "-" || /[()|]/.test(t)) return false;
  /* Multipart is allowed, but only just: "negarse a" yes, a sentence no. */
  const parts = t.split(/\s+/);
  if (parts.length > 3) return false;
  /* The word the field is actually about. A function word standing ALONE is
     a base form in no language — measured, exactly one row on the
     eight-language corpus, where Arabic's على arrived as a verb's base form.
     A function word standing in FRONT of one is a different thing entirely:
     five of the eight write a reflexive infinitive that way, and testing the
     head alone threw every one of them away. */
  const head = parts.find((part) => !isFunctionWord(part, [code]));
  if (!head) return false;
  return verbs?.isInfinitive ? verbs.isInfinitive(head) : true;
}

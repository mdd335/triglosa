/* Which language stands in which of the three panels.

   Panel 0 holds the original, 1 and 2 the translations. Since the clicked
   word can come out of any of the three, every language-dependent decision
   follows the panel it stands in, not the source language.

   The user's languages are one ordered list. The first entry is the language
   they read explanations in; the rest are the ones they are learning, freely
   chosen and including the other first-language option. Two of them mean two
   panels, three mean three.

   The exception is a text in a language the user has not configured: it
   stays where it is and takes a panel of its own, so a two-language setup
   shows three panels for as long as such a text is on screen. Three is the
   ceiling — beyond that the window has no room and the third translation
   would be one nobody asked for. */

import { languagePack } from "./languages/index.js";

export const MAX_PANELS = 3;

/* The languages of the panels, source first. Two or three of them. */
export function panelLanguages(source, languages) {
  const configured = (languages || []).filter(Boolean);
  const rest = configured.includes(source)
    ? configured.filter((c) => c !== source)
    : configured;
  return [source, ...rest].slice(0, MAX_PANELS);
}

/* The two languages a text gets translated into. The word explanation has to
   name the same two, or field A points at the wrong panel. */
export function targetLanguages(source, languages) {
  return panelLanguages(source, languages).slice(1);
}

export function panelLanguage(index, source, languages) {
  return panelLanguages(source, languages)[index] || "";
}

/* The other two panels, the one in the reader's own language first.

   The reason is measured: every example in the prompt shows A as the panel in
   the reader's language, and the model follows the examples more reliably
   than the labels. Clicking into the English translation of a Spanish text,
   where A was labelled Spanish, it still wrote the German equivalent into A
   and the Spanish into B — both spots were lost. */
export function otherPanels(index, source, languages) {
  const first = (languages || [])[0];
  const count = panelLanguages(source, languages).length;
  const rest = Array.from({ length: count }, (_, i) => i).filter((x) => x !== index);
  if (rest.length < 2) return rest;
  return panelLanguage(rest[1], source, languages) === first ? [rest[1], rest[0]] : rest;
}

/* The English name of a panel's language, for the prompts — they are written
   in English and name the languages in it. */
export function panelEnglishName(index, source, languages) {
  return languagePack(panelLanguage(index, source, languages)).englishName;
}

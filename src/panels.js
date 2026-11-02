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
   would be one nobody asked for.

   The reader may add a third panel where there are two, and put another
   language in place of a translation where there are three — never in
   place of their own language, which stays wherever the text is not
   written in it. The window keeps that choice until the app quits or the
   settings' languages change (`choice`): which configured language another
   stands in for (`swaps`), and which one was added (`added`). Every
   reading applies it to the panels the settings give it, so a text in the
   chosen language itself gets the configured one in that place. */

import { languagePack } from "./languages/index.js";

export const MAX_PANELS = 3;

/* The languages of the panels, source first. Two or three of them, with
   the reader's `choice` laid over them where there is one. */
export function panelLanguages(source, languages, choice = null) {
  const configured = (languages || []).filter(Boolean);
  const rest = configured.includes(source)
    ? configured.filter((c) => c !== source)
    : configured;
  const codes = [source, ...rest].slice(0, MAX_PANELS);
  if (!choice) return codes;
  const chosen = codes.map((code, index) => {
    const instead = index > 0 && choice.swaps?.[code];
    return instead && instead !== source && !codes.includes(instead) ? instead : code;
  });
  const added = choice.added;
  if (chosen.length === 2 && added && !chosen.includes(added)) chosen.push(added);
  return chosen;
}

/* How many panels the settings alone give a reading: one more is a panel
   the reader added. */
export function configuredCount(source, languages) {
  return panelLanguages(source, languages).length;
}

/* The two languages a text gets translated into. The word explanation has to
   name the same two, or field A points at the wrong panel. */
export function targetLanguages(source, languages) {
  return panelLanguages(source, languages).slice(1);
}

export function panelLanguage(index, source, languages) {
  return panelLanguages(source, languages)[index] || "";
}

/* The other two panels, the one in the reader's own language first. `codes`
   are the panels' languages as they stand.

   The reason is measured: every example in the prompt shows A as the panel in
   the reader's language, and the model follows the examples more reliably
   than the labels. Clicking into the English translation of a Spanish text,
   where A was labelled Spanish, it still wrote the German equivalent into A
   and the Spanish into B — both spots were lost. */
export function otherPanels(index, codes, reader) {
  const rest = (codes || []).map((_, i) => i).filter((x) => x !== index);
  if (rest.length < 2) return rest;
  return codes[rest[1]] === reader ? [rest[1], rest[0]] : rest;
}

/* The translations whose language the reader may change for one reading:
   where there are three panels, every one but the panel in their own
   language. Two panels get a third added instead, whichever they are. */
export function changeablePanels(codes, reader) {
  if ((codes || []).length < MAX_PANELS) return [];
  return codes.map((_, i) => i).filter((i) => i > 0 && codes[i] !== reader);
}

/* Whether a third panel may be added. */
export function canAddPanel(codes) {
  return (codes || []).length === 2;
}

/* The choice after the reader picked `code` for panel `index` of a reading
   whose panels are `codes` — one past the last adds a panel, and an empty
   `code` takes the added one away. `configured` is how many panels the
   settings give that reading. A panel put back to its configured language
   drops out of the choice. */
export function chooseLanguage(choice, { codes, configured, index, code }) {
  const swaps = { ...(choice?.swaps || {}) };
  let added = choice?.added || "";
  if (!code || index >= configured) {
    added = code || "";
  } else {
    const standing = codes[index];
    const original = Object.keys(swaps).find((from) => swaps[from] === standing) || standing;
    if (code === original) delete swaps[original];
    else swaps[original] = code;
  }
  return Object.keys(swaps).length || added ? { swaps, added } : null;
}

/* The English name of a panel's language, for the prompts — they are written
   in English and name the languages in it. */
export function panelEnglishName(index, source, languages) {
  return languagePack(panelLanguage(index, source, languages)).englishName;
}

/* Whether a text has been read already, and the reading can be shown again
   instead of being asked for a second time. */

/* Everything in the settings that changes what a run produces. A reading made
   with other languages, another level, another model or another translator is an answer to a
   different question, even where the text is the same. The shortcut and the
   flashcards shape nothing in it. */
export function readingKey(settings) {
  return JSON.stringify([settings.languages, settings.levels, settings.show,
    settings.endpoint, settings.model, settings.translator, settings.glance]);
}

/* The latest kept reading of exactly this text under these settings. One that
   failed is not an answer worth keeping: selecting the text again is how a
   reader tries once more. One still being worked out is, because it goes on
   filling itself in. */
export function keptReading(history, text, settings) {
  const key = readingKey(settings);
  return history.findLast((entry) =>
    entry.draft === text && entry.key === key && !entry.state?.fault) || null;
}

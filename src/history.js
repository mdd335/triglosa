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

/* The oldest readings beyond what the settings keep, taken out of the list.
   The one on screen stays whatever its age — a run goes on filling it — and
   it is the one reading held where none are kept. */
export function dropOldest(history, settings, shown = null) {
  const most = Math.max(1, settings.kept);
  for (let index = 0; history.length > most && index < history.length;) {
    if (history[index] === shown) index++;
    else history.splice(index, 1);
  }
}

/* The latest kept reading of exactly this text under these settings. One that
   failed is not an answer worth keeping: selecting the text again is how a
   reader tries once more. One still being worked out is, because it goes on
   filling itself in. A word looked up in its sentence is the same text only
   in the same sentence: the entry is an answer about that sentence. */
export function keptReading(history, text, settings, sentence = "") {
  const key = readingKey(settings);
  return history.findLast((entry) =>
    entry.draft === text && (entry.sentence?.text || "") === sentence
    && entry.key === key && !entry.state?.fault) || null;
}

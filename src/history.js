/* Whether a text has been read already, and the reading can be shown again
   instead of being asked for a second time. */

/* Everything in the settings that changes what a run produces. A reading made
   with other languages, another level, another model or another translator is an answer to a
   different question, even where the text is the same, and so is one made
   with other panels chosen in the window (`choice`, panels.js). The
   shortcut and the flashcards shape nothing in it. */
export function readingKey(settings, choice = null) {
  return JSON.stringify([settings.languages, settings.levels, settings.show,
    settings.endpoint, settings.model, settings.translator, settings.glance, choice]);
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

/* The furthest place the chevrons reach: the last kept reading, or one past
   it where a blank sheet was written in and not read yet. Stepped back from,
   that text is not thrown away: the step forward leads to it again. */
export function lastPlace(history, unsent = "") {
  return unsent.trim() ? history.length : history.length - 1;
}

/* The latest kept reading of exactly this text under these settings. One that
   failed is not an answer worth keeping: selecting the text again is how a
   reader tries once more. One still being worked out is, because it goes on
   filling itself in. A word looked up in its sentence is the same text only
   in the same sentence: the entry is an answer about that sentence. */
export function keptReading(history, text, settings, sentence = "", choice = null) {
  const key = readingKey(settings, choice);
  return history.findLast((entry) =>
    entry.draft === text && (entry.sentence?.text || "") === sentence
    && entry.key === key && !entry.state?.fault) || null;
}

/* A reading that will not change any more: its run has ended and no section
   is still being asked for. Only such a reading can be carried into another
   page — the run filling it in stays behind in the old one. */
export function settled(entry) {
  const state = entry?.state;
  if (!state || state.busy) return false;
  return !Object.values(state.status || {}).some((value) => value === "working" || value === "linking");
}

/* What a page that is taken down leaves for the one built in its place (the
   shell's rebuild_reading_window): the settled readings, which of them was
   on screen, and the selection a reading still being worked out came from,
   to be read once more. Anything that does not survive JSON is left out with
   its reading. */
export function handOver(history, place, pending = null) {
  const shown = history[place] || null;
  const readings = [];
  for (const entry of history) {
    if (!settled(entry)) continue;
    try {
      readings.push(JSON.parse(JSON.stringify(entry)));
    } catch {
      continue;
    }
    if (entry === shown) readings.at(-1).shown = true;
  }
  const unsettled = !shown || !settled(shown);
  return JSON.stringify({ readings, pending: unsettled ? pending : null });
}

/* The other end: the readings in the order they were kept, where the one on
   screen stands among them, and the selection to read again. */
export function takeOver(handed) {
  let parsed;
  try {
    parsed = JSON.parse(handed);
  } catch {
    parsed = null;
  }
  const readings = Array.isArray(parsed?.readings) ? parsed.readings : [];
  const shown = readings.findIndex((entry) => entry.shown);
  for (const entry of readings) delete entry.shown;
  return { readings, place: shown === -1 ? readings.length : shown, pending: parsed?.pending || null };
}

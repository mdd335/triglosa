/* Deciding the language of a text from its function words.

   The promise is: rather stay silent than be wrong. An empty answer means
   "ask something that knows better" — Apple's recognizer, then the model.
   Costs nothing and takes no process start, which is why it runs first.

   Calibrated on the labelled corpus and on a set of texts in languages the
   app does not offer, which is where it used to be wrong: a Czech sentence
   scored Portuguese on se, do, a and pro, a Croatian one French, and both
   reached the reader as a supported language with everything under the
   panels built for it. Function words are short and cheap, and a language
   outside the eight hits a few of them by accident — so the bar is what
   tells an accident from a language: four hits, twice the runner-up, and at
   least an eighth of the text. At those values it decides 49 of the 108
   labelled texts, none of them wrongly, and names none of the 26 foreign
   ones. What it gives up was measured through the stage behind it: of the 33
   texts long enough to judge that it now refuses, the recognizer answers 31
   correctly in about 4 ms and is silent on 2 — so the price of the caution is
   nothing a reader can feel. What stays open is the short input where
   function words give nothing away, and that runs in short mode anyway. */

import { cleanLine, stripDiacritics, stripQuotes } from "./text.js";
import { SUPPORTED, displayName, isSupported, languageLabel, wordSet } from "./languages/index.js";
import { detectPrompt } from "./prompts/detect.js";

export const MIN_WORDS = 8;
export const MIN_HITS = 4;
export const MIN_LEAD = 2;
/* The share of the text the hits have to make up. A language reads its own
   function words at about a third; a coincidence in a foreign language has
   the few it hits spread thinly. */
export const MIN_SHARE = 0.12;

/* Letters and digits of any script, so that Cyrillic or Arabic text does not
   come out as an empty word list. */
function words(text) {
  return stripDiacritics(String(text || ""))
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/* candidates limits what may be answered — normally every supported
   language, because a text in a language the user has not configured still
   takes a panel of its own. Scoring runs against every pack either way: a
   language that is not among the candidates can still take the lead away
   from one that is, and that is the point. Returns a language code or "". */
export function detectByStopwords(text, candidates) {
  const allowed = candidates && candidates.length ? candidates : SUPPORTED;
  const found = words(text);
  if (found.length < MIN_WORDS) return "";

  const score = {};
  SUPPORTED.forEach((code) => {
    const frequent = wordSet(code, "functionWords", "auxiliaries");
    score[code] = found.reduce((n, w) => n + (frequent.has(w) ? 1 : 0), 0);
  });

  const ranked = SUPPORTED.slice().sort((x, y) => score[y] - score[x]);
  const winner = ranked[0];
  if (allowed.indexOf(winner) === -1) return "";
  if (score[winner] < MIN_HITS) return "";
  if (score[winner] < score[ranked[1]] * MIN_LEAD) return "";
  if (score[winner] / found.length < MIN_SHARE) return "";
  return winner;
}

/* All three stages, in the order that costs least.

     1. function words — free, decides 49 of the 108 corpus texts
     2. the device's recognizer — a few ms, decides almost all of the rest
     3. the model — about 1.4 s, whatever is left

   Both early stages may refuse, and on the corpus neither is ever wrong.
   That counts for more than coverage here: detection stands at the head of
   the longest path and everything waits on it, but a wrong language spoils
   the entire run.

   Returns { code, name }. code is a supported language — not necessarily one
   the user configured, since such a text keeps a panel of its own — or ""
   when the text is in none of them, in which case name carries the language's
   name for display and nothing else is known about it. */
export async function detectLanguage(text, { languages, reader, translation, llm }) {
  const local = detectByStopwords(text, SUPPORTED);
  if (local) return { code: local, name: displayName(local, reader), guesses: [] };

  /* What the recognizer thought likeliest, kept for a reader who corrects
     the answer: it is the first place to look for the language it missed. */
  let guesses = [];
  if (translation) {
    /* The reader's own languages break a tie the recognizer cannot. */
    const device = await translation.detect(text, SUPPORTED, languages || [], (found) => { guesses = found; });
    if (device) return { code: device, name: displayName(device, reader), guesses };
  }

  if (!llm) return { code: "", name: "", guesses };
  return { ...(await detectByModel(text, { languages, reader, llm })), guesses };
}

/* What the reader said the text is in, in the shape detection answers with.
   A language without a pack keeps its code apart (`iso`): `code` says what
   the app can do with a language, and that is still nothing, but the
   questions to the model can name it. */
export function chosenLanguage(language, reader) {
  const iso = String(language || "").toLowerCase();
  if (isSupported(iso)) return { code: iso, name: displayName(iso, reader) };
  return { code: "", iso, name: languageLabel(iso, reader) };
}

/* Whether the language a reader chose for a text still holds for an edited
   version of it. It does, unless the function words are sure of another of
   the eight: they were never wrong in any measurement, where the recognizer
   names a language it does not know as its neighbour with full confidence.
   Silence keeps the choice — a text in Hungarian gives them nothing to say. */
export function keepsChosenLanguage(text, code) {
  const found = detectByStopwords(text, SUPPORTED);
  return !found || found === code;
}

/* The third stage on its own. */
export async function detectByModel(text, { languages, reader, llm }) {
  /* A long text says everything it needs to in its first characters, and the
     answer is one word either way. */
  const sample = text.length > 600 ? text.slice(0, 600) : text;
  const answer = stripQuotes(cleanLine(await llm.chat({
    system: detectPrompt({ languages, reader }),
    user: sample,
    maxTokens: 12,
  })));
  const code = answer.toLowerCase().match(/^([a-z]{2})\b/);
  if (code && SUPPORTED.includes(code[1])) {
    return { code: code[1], name: displayName(code[1], reader) };
  }
  const name = answer.replace(/[.!?,;:]+$/, "").trim();
  /* The prompt asks for a name only for a language the app does not support,
     and a model answers "Deutsch" for "Kummerspeck" all the same. Taken as
     unsupported, a German word got a German panel next to it. */
  const named = SUPPORTED.find((c) =>
    [displayName(c, reader), displayName(c, c), displayName(c, "en")]
      .some((known) => known.toLowerCase() === name.toLowerCase()));
  if (named) return { code: named, name: displayName(named, reader) };
  /* A language the app does not support: the model was asked for its name in
     the reader's language, and that is all that is needed — the text keeps
     its own panel and gets translated into the configured ones. */
  return { code: "", name };
}

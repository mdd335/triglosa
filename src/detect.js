/* Deciding the language of a text from its function words.

   The promise is: rather stay silent than be wrong. An empty answer means
   "ask something that knows better" — the identifier, Apple's recognizer,
   then the model. Costs nothing and takes no process start, which is why it
   runs first.

   Calibrated on the labelled corpus and on a set of texts in languages the
   app does not offer, which is where a lower bar goes wrong: a Czech sentence
   scores Portuguese on se, do, a and pro, a Croatian one French, and both
   would reach the reader as a supported language with everything under the
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

import { cleanLine, stripDiacritics, stripQuotes, unspacedWords } from "./text.js";
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
    .filter(Boolean)
    .flatMap(unspacedWords);
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

/* From this share on the identifier's likeliest language is taken. Lower,
   and a word written alike in two languages is named the wrong one; at this
   value it named none of the corpus's texts wrongly (run forty-one). */
export const IDENTIFIER_THRESHOLD = 0.9;

/* What the identifier's answer — the likeliest languages with a share each,
   likeliest first — says: a supported language it is sure of (`code`), or
   that it is sure of one the app does not offer (`foreign`), or nothing. The
   reader's own languages are given no precedence here: every wrong answer it
   gave in the measurement came from one. */
export function readIdentified(top) {
  const [code, share] = (top || [])[0] || [];
  if (!code || !(share >= IDENTIFIER_THRESHOLD)) return { code: "", foreign: false };
  return SUPPORTED.includes(code) ? { code, foreign: false } : { code: "", foreign: true };
}

/* All four stages, in the order that costs least.

     1. function words — free, decides 49 of the 108 corpus texts
     2. the identifier — a hundredth of a millisecond, decides two thirds
     3. the device's recognizer — a few ms, decides almost all of the rest
     4. the model — about 1.4 s, whatever is left

   The early stages may refuse, and that counts for more than coverage
   here: detection stands at the head of the longest path and everything
   waits on it, but a wrong language spoils the entire run.

   Returns { code, name, by }: by says who named it — "text" for the
   function words and the identifier, "device" or "model". code is a supported language — not necessarily one
   the user configured, since such a text keeps a panel of its own — or ""
   when the text is in none of them, in which case name carries the language's
   name for display and nothing else is known about it. */
export async function detectLanguage(text, { languages, reader, translation, llm, identifier }) {
  const local = detectByStopwords(text, SUPPORTED);
  if (local) return { code: local, name: displayName(local, reader), guesses: [], by: "text" };

  const identified = readIdentified(identifier ? await identifier.identify(text).catch(() => null) : null);
  if (identified.code) return { code: identified.code, name: displayName(identified.code, reader), guesses: [], by: "text" };

  /* What the recognizer thought likeliest, kept for a reader who corrects
     the answer: it is the first place to look for the language it missed.
     unsure is what it would name if nobody else could. */
  let guesses = [];
  let unsure = "";
  /* The reader's own languages break a tie the recognizer cannot. */
  const askDevice = async () => (translation
    ? translation.detect(text, SUPPORTED, languages || [], (found) => {
      guesses = found?.guesses || [];
      unsure = found?.unsure || "";
    })
    : "");
  /* A language the app does not offer is one the recognizer may not know
     either, and it then names the nearest it has, sure of it: Persian comes
     back Arabic, Serbian Russian. Where the identifier is sure of such a
     language the recognizer's own verdict is passed over, and the model
     asked. */
  const device = await askDevice();
  if (device && !(identified.foreign && llm)) {
    return { code: device, name: displayName(device, reader), guesses, by: "device" };
  }

  /* Nobody left to ask. A single word carries no function words and the
     recognizer is rarely sure enough of one, so the model was the third and
     last stage — and where it is not there, or cannot be reached, the panels
     stayed empty although the device could have translated the word: it
     only ever needed a language to translate from. Apple's own best reading
     is taken instead. Measured in run twenty-four, its first guess is the
     model's answer for 73-76 % of one-language inputs; the other quarter
     gets a wrong language rather than nothing, and the heading's
     list is where the reader says which it is (author 2026-09-22). */
  const guessed = () => (unsure
    ? { code: unsure, name: displayName(unsure, reader), guesses, by: "device" }
    : { code: "", name: "", guesses });

  if (!llm) return guessed();
  try {
    return { ...(await detectByModel(text, { languages, reader, llm })), guesses, by: "model" };
  } catch (error) {
    /* A model that answered something unusable is not a model that failed:
       only an unreachable one comes through here, and the run records the
       reason from the questions that follow. */
    if (!unsure) throw error;
    return guessed();
  }
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

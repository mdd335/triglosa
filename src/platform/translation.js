/* Translation on the device.

   The seam has three questions: can this pair be translated at all, translate
   this, and what language is this. A resident helper answers them over HTTP;
   the app starts it when it opens and stops it when it closes.

   Every one of them may refuse. A refusal is silent and means "ask something
   else" — the model then does the work. A wrong answer here would spoil the
   whole run, so refusing is always the safer half. */

import { currentSystem } from "../system.js";
import { stripModelWrapping } from "../text.js";

/* Where the resident helper listens. One number, in one place: the window,
   the settings and the measurement harness all have to agree on it. */
export const HELPER_URL = "http://127.0.0.1:51737";

/* Which shape of answers this code expects. The helper outlives the app and
   keeps the port, so a new window can meet an old helper; when the two do
   not match, the window retires it and starts its own. */
export const PROTOCOL = 4;

export function readProtocol(answer) {
  const match = String(answer || "").trim().match(/^ok(?:\s+(\d+))?$/);
  if (!match) return 0;
  return Number(match[1] || 1);
}

export const TRANSLATE_TIMEOUT_MS = 120000;
export const PROBE_TIMEOUT_MS = 2000;

/* What is sent through a pair to open it. Anything does — measured, a single
   full stop warms a pair exactly as well as a real word does — so it is a
   full stop: a word would have to be a word of some language, and no language
   is named outside a pack.

   Warming at most this often. The helper closes down after five minutes
   idle and takes its sessions with it, so coming back to the window is worth
   a fresh warm; showing it three times in a minute is not. */
export const WARM_TOKEN = ".";
export const WARM_AGAIN_AFTER_MS = 240000;
/* Below this confidence the recognizer says nothing. Measured on 90 labelled
   texts, over the 32 the function words leave open: at 0.90 it decides 14 of
   them more and not one of them wrongly. At 0.80 it would be 15, also without
   error, so the threshold is not sitting on an edge. The two words the model
   itself fails on fall through by themselves. */
export const CONFIDENCE_THRESHOLD = 0.9;

/* The device translates line by line and returns every line with a blank one
   behind it: three bullet points come back as six lines. The model is asked
   to preserve line breaks at the same place, so this is straightened here
   rather than in the display — otherwise the same translation would have a
   different shape depending on which engine produced it.

   Only where the source holds no blank line itself: a text with real
   paragraphs keeps its paragraphs. */
export function keepParagraphShape(source, translated) {
  if (/\n[ \t]*\n/.test(source)) return translated;
  return String(translated || "").replace(/\n[ \t]*\n+/g, "\n");
}

/* The device knows three answers about a pair, and the middle one is the
   useful one: not installed, but installable. That is the difference between
   "this will never work here" and "one download away", and only the second is
   worth putting in front of the reader.

   Anything unexpected reads as unsupported: claiming a pair works and then
   silently falling back is worse than saying it does not. */
export const PAIR_INSTALLED = "installed";
export const PAIR_DOWNLOADABLE = "supported";
export const PAIR_UNSUPPORTED = "unsupported";

export function readPairStatus(answer) {
  const word = String(answer || "").trim().split(/\s+/).pop() || "";
  if (word === PAIR_INSTALLED) return PAIR_INSTALLED;
  if (word === PAIR_DOWNLOADABLE) return PAIR_DOWNLOADABLE;
  if (word === PAIR_UNSUPPORTED) return PAIR_UNSUPPORTED;
  /* A word this version does not know means nothing is known — an older
     helper still holding the port answered. Saying "unsupported" there put
     "the device cannot do German → English" in front of a reader once, and a
     confident wrong answer is worse than none. */
  return "";
}

/* A language of the reader's own, lying close behind a leader the reader
   never configured, is taken instead of it. Short input is where the
   recognizer is torn, and it is torn between neighbours: measured on 54 short
   words and phrases, "empresa" comes back Portuguese 0.60 and Spanish 0.28,
   "comunicamos" 0.50 against 0.49, "la casa" Catalan 0.36 and Spanish 0.32 —
   words that are written that way in both. For a reader learning Spanish and
   not Portuguese they are Spanish. Under this share nothing is taken: a
   Portuguese "a casa" gives Spanish 0.07, and that is no reading of it. */
export const PREFERRED_FLOOR = 0.25;

/* The recognizer answers one "code confidence" line per hypothesis, most
   likely first. The leader decides above the threshold, if it is among the
   candidates. Below it, one of the reader's own languages (`preferred`) is
   taken where it lies close behind a leader that is not one of them.

   A leader that is itself one of the reader's languages is not promoted from
   low confidence: that is the recognizer being unsure, not torn, and a rare
   Spanish word comes back English at 0.47. Anything unusable means silence. */
export function readDetection(answer, candidates, preferred = []) {
  const lines = String(answer || "").trim().split("\n").map((line) => line.trim()).filter(Boolean);
  const hypotheses = [];
  for (const line of lines) {
    const match = line.match(/^([a-z-]+)\s+([0-9.]+)$/);
    if (!match) return "";
    hypotheses.push({ code: match[1], confidence: parseFloat(match[2]) });
  }
  if (!hypotheses.length) return "";
  hypotheses.sort((a, b) => b.confidence - a.confidence);
  const allowed = (code) => !candidates || candidates.includes(code);

  const [leader] = hypotheses;
  if (leader.confidence >= CONFIDENCE_THRESHOLD) return allowed(leader.code) ? leader.code : "";
  if (preferred.includes(leader.code)) return "";
  const own = hypotheses.find((h) => preferred.includes(h.code) && allowed(h.code));
  return own && own.confidence >= PREFERRED_FLOOR ? own.code : "";
}

/* The languages the recognizer thought likeliest, for a reader who is
   correcting it: the first few it gave any real weight to, most likely
   first, whether the app has a pack for them or not. Nothing to read is no
   guess at all. */
export const GUESS_FLOOR = 0.01;
export const MOST_GUESSES = 3;

export function readGuesses(answer) {
  const guesses = [];
  for (const line of String(answer || "").trim().split("\n")) {
    const match = line.trim().match(/^([a-z]{2,3})(?:-[a-zA-Z]+)?\s+([0-9.]+)$/);
    if (!match) continue;
    const confidence = parseFloat(match[2]);
    if (confidence >= GUESS_FLOOR && !guesses.some((g) => g.code === match[1])) {
      guesses.push({ code: match[1], confidence });
    }
  }
  return guesses.sort((a, b) => b.confidence - a.confidence).slice(0, MOST_GUESSES).map((g) => g.code);
}

const trimSlash = (s) => String(s || "").replace(/\/+$/, "");

/* Windows has no translation on the device. What stands in for it answers
   every question the way a helper that is not running does, which is a state
   the run already handles: the model translates, and without one the panels
   say what is missing. */
const ABSENT = {
  running: async () => false,
  current: () => false,
  retire: async () => {},
  pairStatus: async () => "",
  canTranslate: async () => false,
  warm: async () => 0,
  translate: async () => "",
  detect: async () => "",
};

export function createTranslationBackend({ helperUrl, system = currentSystem() }, fetchImpl = fetch) {
  if (system === "windows") return ABSENT;
  const base = trimSlash(helperUrl);
  /* Answered once per session. A failure is NOT remembered: then every call
     simply goes the slow way, and next time it is tried again. */
  let available = null;
  let pairs = null;
  let warmed = 0;

  async function ask(path, { body, timeout } = {}) {
    const response = await fetchImpl(base + path, {
      method: body === undefined ? "GET" : "POST",
      body,
      signal: AbortSignal.timeout(timeout || PROBE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(String(response.status));
    return response.text();
  }

  let spoken = 0;

  async function running() {
    if (available === true) return true;
    try {
      spoken = readProtocol(await ask("/ping"));
      available = true;
    } catch {
      available = false;
    }
    return available;
  }

  async function pairStatus(from, to) {
    if (!(await running())) return "";
    pairs = pairs || new Map();
    const key = `${from}>${to}`;
    if (!pairs.has(key)) {
      try {
        pairs.set(key, readPairStatus(await ask(`/available?from=${from}&to=${to}`)));
      } catch {
        /* Nothing known, not "it cannot". The helper answers one client at a
           time, so this question can simply have been standing behind a long
           translation when the two-second probe ran out — and "the device
           cannot do German → English" is precisely the confident wrong answer
           `readPairStatus` refuses to give for the same reason. The run then
           lets the model take over without a word, and the settings say
           nothing about a pair they could not ask about. */
        pairs.set(key, "");
      }
    }
    return pairs.get(key);
  }

  return {
    running,

    /* Whether the helper that answered speaks this version's protocol. Only
       meaningful once running() has been asked. */
    current: () => spoken === PROTOCOL,

    /* Retire a helper of an older build so a current one can take the port.
       A helper that does not know the route simply stays, and the window is
       no worse off than before it asked. */
    async retire() {
      try {
        await ask("/quit");
      } catch {
        /* It may well close the connection instead of answering. */
      }
      available = null;
      pairs = null;
      spoken = 0;
      warmed = 0;
    },

    /* What the device can do with a pair. Asked once per pair and kept, so
       the settings window may ask for all six of them without cost.

       Without the helper the answer is an empty string rather than
       "unsupported": nothing was asked, so nothing is known, and the window
       has a different sentence for that. */
    pairStatus,

    /* The run only ever asks the one question: will the device do this pair,
       here, now. Installable is not installed. */
    async canTranslate(from, to) {
      return (await pairStatus(from, to)) === PAIR_INSTALLED;
    },

    /* Opening the pairs the reader is configured for, before a reading needs
       them. The first translation through a pair pays for the session behind
       it: measured over three runs on a fresh helper, es→de came back in
       0.70 s cold and 0.42 s once the pair had been used, and the same gap
       showed for every pair tried. A reading fires on a keystroke, so those
       280 ms are the difference between the panel filling and the panel
       being waited for.

       Only pairs the device says are installed — anything else would open a
       session that cannot exist. Only the reader's own languages: which pairs
       those are is a settings question and arrives as an argument.

       One at a time, and the answers are thrown away. It costs about half a
       second per pair, all of it before anybody has asked for anything; a
       reading that starts in the middle of it queues behind one of these at
       worst, and pays that pair's setup either way. */
    async warm(pairs, now = Date.now()) {
      if (!(await running())) return 0;
      if (warmed && now - warmed < WARM_AGAIN_AFTER_MS) return 0;
      warmed = now;
      let opened = 0;
      for (const { from, to } of pairs || []) {
        if ((await pairStatus(from, to)) !== PAIR_INSTALLED) continue;
        try {
          await ask(`/translate?from=${from}&to=${to}`,
            { body: WARM_TOKEN, timeout: TRANSLATE_TIMEOUT_MS });
          opened += 1;
        } catch {
          /* A pair that will not open is the run's problem, not this one's.
             Nothing is shown and nothing is remembered. */
        }
      }
      return opened;
    },

    async translate(from, to, text) {
      if (!(await running())) return "";
      try {
        const answer = await ask(`/translate?from=${from}&to=${to}`,
          { body: text, timeout: TRANSLATE_TIMEOUT_MS });
        const cleaned = stripModelWrapping(answer);
        return cleaned ? keepParagraphShape(text, cleaned) : "";
      } catch {
        return "";
      }
    },

    /* The second of the three detection stages. Costs about 40 ms including
       the process start, against 1.4 s for a model round trip. */
    async detect(text, candidates, preferred, onGuesses) {
      if (!(await running())) return "";
      try {
        const answer = await ask("/detect", { body: text });
        if (onGuesses) onGuesses(readGuesses(answer));
        return readDetection(answer, candidates, preferred);
      } catch {
        return "";
      }
    },
  };
}

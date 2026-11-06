/* The wand behind a card, where there is a model to ask and a language to
   ask it about. Whoever shows the card reads the endpoint and the key for
   itself, the way it reads the settings. A fault is worded here, in the
   reader's language, so the card only has to show the sentence. */

import { ensureTranslationHelper, modelFetch, translationFetch } from "../platform/env.js";
import { HELPER_URL, PAIR_DOWNLOADABLE, PAIR_UNSUPPORTED, createTranslationBackend } from "../platform/translation.js";
import { loadApiKey } from "../platform/keychain.js";
import { createLlmBackend } from "../platform/llm.js";
import { completeCard, improveCard } from "../ask.js";
import { exampleLine } from "../card.js";
import { asHeadword } from "../parse/alternatives.js";
import { faultOf } from "../faults.js";
import { isChoosable, languageLabel } from "../languages/index.js";
import { levelFor, modelConsentFor } from "../settings.js";
import { onPhone, onWindows } from "../system.js";
import { faultText, labels } from "./labels.js";

const letters = (value) => (String(value || "").match(/\p{L}/gu) || []).length;

/* Without an AI model, Apple's translation writes the side a card is
   missing (author 2026-11-05): the word's meaning in the reader's language,
   or the word for a meaning they typed — and the translation behind the
   sentence a looked-up word brought along, as an improved card has it.
   Nothing more — no explanation, no better word — and only where one side
   stands and the other is empty, or the sentence stands untranslated.
   Windows has no such translation. `by` tells the card whose it is. A
   pack that can be downloaded and is not is said by name, with where to
   load it; `backend` stands in for Apple in a test. */
export function deviceCompleter(card, { reader = "", backend = null } = {}) {
  if (onWindows() || !card.termLanguage || !card.meaningLanguage || card.termLanguage === card.meaningLanguage) return null;
  let translation = backend;
  const missing = (current) => {
    const term = letters(current.term) >= 2 && !String(current.meaning || "").trim();
    const meaning = letters(current.meaning) >= 2 && !String(current.term || "").trim();
    return term ? "meaning" : meaning ? "term" : "";
  };
  /* The sentence as the card brought it, still in the note and still
     without its translation behind it. */
  const untranslated = (current) => {
    const sentence = current.context?.sentence;
    if (!sentence || current.context?.translation) return false;
    const note = String(current.note || "");
    return note.includes(sentence) && !note.includes(`${sentence} (`);
  };
  const complete = async (current) => {
    const side = missing(current);
    const sentence = untranslated(current);
    if (!side && !sentence) return null;
    if (!translation) {
      translation = createTranslationBackend({ helperUrl: HELPER_URL }, await translationFetch());
      try {
        await ensureTranslationHelper(translation);
      } catch {
        /* Asked anyway: the reading window may have started it. */
      }
    }
    const asked = (from, to, text) => translation.translate(from, to, String(text).trim()).then((answer) => String(answer || "").trim(), () => "");
    let next = current;
    let [from, to] = [current.termLanguage, current.meaningLanguage];
    if (side) {
      const text = side === "meaning" ? current.term : current.meaning;
      if (side === "term") [from, to] = [to, from];
      /* Written as a dictionary writes it, as the model's side is. */
      const found = asHeadword(await asked(from, to, text), text, to);
      if (found) next = { ...next, [side]: found };
    }
    if (sentence && (!side || next !== current)) {
      const { sentence: said } = current.context;
      const translated = await asked(current.termLanguage, current.meaningLanguage, said);
      if (translated) {
        next = { ...next, note: String(next.note || "").replace(said, () => exampleLine({ sentence: said, translation: translated })),
                 context: { ...current.context, translation: translated } };
      }
    }
    if (next !== current) return next;
    const pair = await Promise.resolve(translation.pairStatus?.(from, to)).catch(() => "");
    /* Said as the reading's panel says it: a pack to load, or a pair Apple
       cannot do at all. */
    const named = [languageLabel(from, reader) || from, languageLabel(to, reader) || to];
    if (pair === PAIR_DOWNLOADABLE && reader) throw new Error(labels(reader).packMissing(...named));
    if (pair === PAIR_UNSUPPORTED && reader) throw new Error(labels(reader).pairUnsupported(...named));
    return null;
  };
  complete.by = "device";
  complete.ready = (current) => !!missing(current) || untranslated(current);
  return complete;
}

export async function improverFor(settings, card) {
  /* A phone's reader allowed texts to go to this model, or none go. */
  const model = !!settings.endpoint && !(onPhone() && modelConsentFor(settings) !== true);
  if (!model) {
    const completer = deviceCompleter(card, { reader: settings.languages?.[0] || "" });
    /* A model is set up, and the reader did not let the text go to it. */
    if (completer) completer.declined = !!settings.endpoint;
    return completer;
  }
  if (!isChoosable(card.termLanguage) || !isChoosable(card.meaningLanguage)) return null;
  const llm = createLlmBackend(
    { endpoint: settings.endpoint, apiKey: await loadApiKey(settings), model: settings.model },
    await modelFetch(),
  );
  /* A card with one side written — from the shortcut, or typed into a blank
     one — gets the other side first, and is then improved like any card. */
  return async (current) => {
    try {
      const whole = await completeCard(llm, current);
      const better = await improveCard(llm, whole, { level: levelFor(settings, whole.termLanguage) });
      /* The side just found is kept even where the improving came to nothing. */
      return better || (whole !== current ? whole : null);
    } catch (error) {
      throw new Error(faultText(settings.languages[0], faultOf(error)), { cause: error });
    }
  };
}

/* The wand behind a card, where there is a model to ask and a language to
   ask it about. Whoever shows the card reads the endpoint and the key for
   itself, the way it reads the settings. A fault is worded here, in the
   reader's language, so the card only has to show the sentence. */

import { modelFetch } from "../platform/env.js";
import { loadApiKey } from "../platform/keychain.js";
import { createLlmBackend } from "../platform/llm.js";
import { completeCard, improveCard } from "../ask.js";
import { faultOf } from "../faults.js";
import { isChoosable } from "../languages/index.js";
import { levelFor, modelConsentFor } from "../settings.js";
import { onPhone } from "../system.js";
import { faultText } from "./labels.js";

export async function improverFor(settings, card) {
  if (!settings.endpoint || !isChoosable(card.termLanguage) || !isChoosable(card.meaningLanguage)) {
    return null;
  }
  /* A phone's reader allowed texts to go to this model, or none go. */
  if (onPhone() && modelConsentFor(settings) !== true) return null;
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

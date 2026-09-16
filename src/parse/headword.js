/* Reading a headword back, and trusting it only as far as it can be checked.

   The answer may add one thing, a definite article of the word's own language
   — which the pack lists — and, in a language that capitalises its nouns,
   the word's first capital. Everywhere else the word keeps the letters it was
   asked with and the article is written small: a small model answers
   "La caja" and "Pagar" as though each began a sentence. Anything else is a model
   rewriting the word the reader chose, and then the word stays as it was: a
   card without its article is worse than none only by the article, a card
   with a different word on it is simply wrong. */

import { cleanLine, stripDiacritics, stripQuotes } from "../text.js";
import { languagePack, wordSet } from "../languages/index.js";

const fold = (s) => stripDiacritics(String(s || "")).replace(/’/g, "'").toLowerCase().trim();

export function parseHeadword(raw, word, code) {
  const asked = String(word || "").trim();
  const line = stripQuotes(cleanLine(String(raw || "").split(/\r?\n/).find((l) => l.trim()) || ""))
    .replace(/[.。]$/, "").trim();
  if (!line || !asked) return asked;
  const capitals = !!languagePack(code).capitalisesNouns;
  const spelled = (given) => (capitals ? given : asked);
  if (fold(line) === fold(asked)) return spelled(line);

  const articles = wordSet(code, "definiteArticles");
  for (const article of articles) {
    const elided = article.endsWith("'");
    const lead = line.slice(0, article.length);
    if (fold(lead) !== article) continue;
    const rest = line.slice(article.length);
    const joined = elided ? rest.replace(/^\s*/, "") : rest.startsWith(" ") ? rest.trimStart() : null;
    if (joined === null || fold(joined) !== fold(asked)) continue;
    const small = lead.toLowerCase();
    return elided ? `${small}${spelled(joined)}` : `${small} ${spelled(joined)}`;
  }
  return asked;
}

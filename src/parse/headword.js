/* Reading a headword back, and trusting it only as far as it can be checked.

   The answer may add a definite article of the word's own language — which
   the pack lists — and, in a language that capitalises its nouns, the word's
   first capital; and for a person or an animal the other gender's form, with
   its article, where the two begin alike. Everywhere else the word keeps the letters it was
   asked with and the article is written small: a small model answers
   "La caja" and "Pagar" as though each began a sentence. Anything else is a model
   rewriting the word the reader chose, and then the word stays as it was: a
   card without its article is worse than none only by the article, a card
   with a different word on it is simply wrong. */

import { cleanLine, stripDiacritics, stripQuotes } from "../text.js";
import { languagePack, wordSet } from "../languages/index.js";

const fold = (s) => stripDiacritics(String(s || "")).replace(/’/g, "'").toLowerCase().trim();

/* An article of the language at the start of `text`, and what follows it:
   `{ article, rest }`, or null where none stands there. */
function articled(text, code) {
  for (const article of wordSet(code, "definiteArticles")) {
    const elided = article.endsWith("'");
    const lead = text.slice(0, article.length);
    if (fold(lead) !== article) continue;
    const rest = text.slice(article.length);
    if (elided) return { article: lead.toLowerCase(), rest: rest.trimStart(), elided };
    if (/^[\s/]/.test(rest)) return { article: lead.toLowerCase(), rest, elided };
  }
  return null;
}

const written = ({ article, elided }, word) => (elided ? `${article}${word}` : `${article} ${word}`);

/* The masculine and the feminine form of one word begin alike. */
const PAIR_SHARES = 3;
const sameStem = (a, b) => {
  const [x, y] = [fold(a), fold(b)];
  let shared = 0;
  while (shared < x.length && shared < y.length && x[shared] === y[shared]) shared += 1;
  return shared >= PAIR_SHARES;
};

export function parseHeadword(raw, word, code) {
  const asked = String(word || "").trim();
  const line = stripQuotes(cleanLine(String(raw || "").split(/\r?\n/).find((l) => l.trim()) || ""))
    .replace(/[.。]$/, "").trim();
  if (!line || !asked) return asked;
  const capitals = !!languagePack(code).capitalisesNouns;
  const spelled = (given) => (capitals ? given : asked);
  /* The other form of a pair is the model's own word: in the asked one's
     case where the language writes its nouns small. */
  const other = (given) => (capitals || asked !== asked.toLowerCase() ? given : given.toLowerCase());
  if (fold(line) === fold(asked)) return spelled(line);

  const first = articled(line, code);
  if (!first) return asked;
  const masculine = wordSet(code, "masculineArticles");
  const feminine = wordSet(code, "feminineArticles");
  const gender = (x) => (x.elided ? "" : masculine.has(x.article) ? "m" : feminine.has(x.article) ? "f" : "other");
  /* Two articles make a man and a woman where one is masculine and one
     feminine; an article cut short in front of a vowel can be either. */
  const manAndWoman = (x, y) => {
    const [a, b] = [gender(x), gender(y)];
    return a !== "other" && b !== "other" && (!a || !b || a !== b);
  };
  /* One word under both articles, the woman's second; under one, that one. */
  const both = (x, y, noun) => {
    if (x.article === y.article) return written(x, noun);
    if (x.elided || y.elided) return written(x.elided ? x : y, noun);
    if (!manAndWoman(x, y)) return asked;
    const [man, woman] = gender(x) === "f" ? [y, x] : [x, y];
    return `${man.article}/${written(woman, noun)}`;
  };

  /* One word for both: two articles with a stroke between them. */
  if (first.rest.startsWith("/")) {
    const second = articled(first.rest.slice(1).trimStart(), code);
    const noun = second ? second.rest.trim() : "";
    if (!second || fold(noun) !== fold(asked)) return asked;
    return both(first, second, spelled(noun));
  }

  /* Two forms, each with its article. One of them is the word asked about;
     the other is taken where it is plainly a form of the same word, and
     dropped where it is not. */
  const [left, right, ...more] = first.rest.split(/\s*\/\s*/);
  const second = right !== undefined && !more.length ? articled(right.trim(), code) : null;
  if (second) {
    const [a, b] = [left.trim(), second.rest.trim()];
    /* The word written out twice is one word for both. */
    if (fold(a) === fold(b)) return fold(a) === fold(asked) ? both(first, second, spelled(a)) : asked;
    const mine = fold(a) === fold(asked) ? first : fold(b) === fold(asked) ? second : null;
    if (!mine) return asked;
    if (!sameStem(a, b) || !manAndWoman(first, second)) return written(mine, spelled(mine === first ? a : b));
    const forms = [
      { ...first, word: mine === first ? spelled(a) : other(a) },
      { ...second, word: mine === second ? spelled(b) : other(b) },
    ];
    if (gender(first) === "f" || gender(second) === "m") forms.reverse();
    return forms.map((form) => written(form, form.word)).join(" / ");
  }
  /* An article and the word, whatever was written after it. */
  if (right !== undefined && fold(left.trim()) === fold(asked)) return written(first, spelled(left.trim()));

  const noun = first.rest.trim();
  return fold(noun) === fold(asked) ? written(first, spelled(noun)) : asked;
}

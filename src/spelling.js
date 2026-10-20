/* A word looked up with a typo (run fifty-one).

   The system's own spelling checker cannot be trusted to correct anything:
   in the reader's other languages it "corrects" too (wierd → wird), and a
   word of a language the reader does not have it bends into one of theirs
   (pádel → Pudel). What it is good at is saying that a word may be
   misspelled: no dictionary of the reader's languages, nor of the language
   the word was found to be in, knows it. That was 81 % of the typos and
   7–12 % of hard words spelled right. Only then is the model asked, in a
   question of its own, what the word meant is; told the same inside the
   entry's question, the local model broke the entry instead. Asked about
   every word, the local model changed one right word in five — the gate is
   what makes the question safe, and where there is no dictionary for the
   language there is no question.

   Without a model nothing is changed by itself: the checker's own word is
   offered, and the reader decides. */

import { lettersInScriptOf } from "./languages/index.js";
import { cleanLine, stripModelWrapping, stripQuotes, wordPieces } from "./text.js";

/* The words of a looked-up text, as a spelling checker is asked about them:
   what stands around a word goes, what joins two parts of one stays. */
export function spellingWords(text) {
  return wordPieces(text)
    .map((piece) => piece.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, ""))
    .filter(Boolean);
}

/* The languages to ask about: the one the text was found to be in and the
   reader's. */
export function spellingLanguages(source, languages) {
  return [...new Set([source, ...(languages || [])].filter(Boolean))];
}

/* Whether a language's dictionaries can say anything about a word: there
   are some, and the word is in the language's script — a checker takes a
   word of another script as known. */
function judges(verdict, code, word) {
  return !!verdict?.there && lettersInScriptOf(code, word) === "all";
}

const knows = (verdict, code, word) => judges(verdict, code, word) && !!verdict.known;

/* A word the dictionary of its language does not know, nor any of the
   reader's. */
function suspectWord(word, verdicts, source, languages) {
  const of = verdicts?.[word] || {};
  if (!judges(of[source], source, word) || of[source].known) return false;
  return !spellingLanguages(source, languages).some((code) => knows(of[code], code, word));
}

/* Whether the looked-up text may hold a typo. `verdicts` is the shell's
   answer: word → language → { there, known, correction, guesses }. */
export function mayBeMisspelled(text, verdicts, { source, languages }) {
  if (!source) return false;
  return spellingWords(text).some((word) => suspectWord(word, verdicts, source, languages));
}

const fold = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/* Letters put in, left out, changed or swapped with a neighbour, accents
   and capitals aside. */
export function typoDistance(a, b) {
  const x = [...fold(a)];
  const y = [...fold(b)];
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[x.length][y.length];
}

/* Whether a word meant can be what was typed: a third of its letters apart
   at most, and two always. Further than that the model answered with a
   translation (addresse → dirección) or another word, which the local model
   did now and then. */
export function nearTyped(typed, meant) {
  return typoDistance(typed, meant) <= Math.max(2, Math.ceil([...String(typed)].length / 3));
}

/* The word meant, out of the model's answer; "" where the input is spelled
   as it should be, or where what came back is no correction of it. */
export function readSpelling(answer, typed) {
  const first = stripModelWrapping(answer).split("\n").map(cleanLine).find(Boolean) || "";
  const bare = (line) => line.replace(/^\*+|\*+$/g, "").replace(/[.!。]+$/u, "").trim();
  const meant = bare(stripQuotes(bare(first)));
  if (!meant || /^ok$/i.test(meant)) return "";
  if (meant.toLowerCase() === String(typed || "").trim().toLowerCase()) return "";
  return nearTyped(typed, meant) ? meant : "";
}

/* What the checker itself would put for one word: a word it would put in by
   itself, or its likeliest guess, where either can be what was typed — more
   than a change of capitals, the first letter kept, at most two letters
   apart, and not the typed word with an ending put on. */
function offerFor(word, verdict) {
  const plausible = (offered) => {
    if (!offered || offered.toLowerCase() === word.toLowerCase()) return false;
    if (fold([...word][0]) !== fold([...offered][0])) return false;
    if (offered.toLowerCase().startsWith(word.toLowerCase())) return false;
    return typoDistance(word, offered) <= 2;
  };
  if (plausible(verdict?.correction)) return verdict.correction;
  return (verdict?.guesses || []).find(plausible) || "";
}

/* Without a model: the text as the checker of its language would write it,
   offered rather than taken; "" where it has nothing to offer. */
export function checkerOffer(text, verdicts, { source, languages }) {
  let changed = false;
  let out = String(text || "");
  for (const word of spellingWords(text)) {
    if (!suspectWord(word, verdicts, source, languages)) continue;
    const offered = offerFor(word, verdicts[word][source]);
    if (!offered) continue;
    out = out.replace(word, offered);
    changed = true;
  }
  return changed ? out : "";
}

/* The language of a word looked up in its sentence where that is not the
   sentence's — "encender" in an English sentence: the sentence language's
   dictionaries do not know it, or it is in none of that language's letters,
   and of the reader's other languages exactly one knows every word of it.
   "" where the sentence's language stands: its dictionaries know the word
   ("kindergarten" in English), or every dictionary concerned is there and
   no other language, or more than one, knows it whole ("neve", Italian and
   Portuguese). Null where the dictionaries cannot tell: the sentence
   language's is not on the machine, or one of the reader's languages that
   might know the word has none — Windows has a dictionary only for a
   language added to the system. */
export function wordLanguage(text, verdicts, { source, languages }) {
  const words = spellingWords(text);
  if (!source || !words.length) return "";
  const there = (code) => words.every((word) => verdicts?.[word]?.[code]?.there || lettersInScriptOf(code, word) === "none");
  if (!there(source)) return null;
  const known = (code) => words.filter((word) => knows(verdicts?.[word]?.[code], code, word)).length;
  if (known(source) === words.length) return "";
  const others = (languages || []).filter((code) => code !== source);
  const whole = others.filter((code) => known(code) === words.length);
  if (whole.length === 1) return whole[0];
  return whole.length || others.every(there) ? "" : null;
}

/* The code out of the model's answer to the question about a word's
   language (prompts/word-language.js); "" where it names none of those
   offered. */
export function readWordLanguage(answer, codes) {
  const first = stripModelWrapping(answer).split("\n").map(cleanLine).find(Boolean) || "";
  const code = (first.toLowerCase().match(/\b[a-z]{2}\b/) || [""])[0];
  return (codes || []).includes(code) ? code : "";
}

/* The language of a short text the detection could only name as one the
   app does not offer — "Wrot", "Schnieke" and "Odem" came back Dutch,
   "Standart" Turkish: the one of the reader's languages whose dictionaries
   know more of its words than any other's, or, where none knows any, the
   one with the nearest correction that can be what was typed — its own, or
   the likeliest guess, which is all Windows offers as a rule: "Bibliotehk"
   is a letter from German's Bibliothek and two from Spanish's Biblioteca.
   "" where that is not one language. Measured on single words, it put 26 such readings right
   and none wrong (run fifty-one); asked of any reading, it broke more than
   it mended, so it is asked only of these. */
export function languageByDictionaries(text, verdicts, languages) {
  const words = spellingWords(text);
  const known = (languages || []).map((code) => ({
    code,
    count: words.filter((word) => knows(verdicts?.[word]?.[code], code, word)).length,
  }));
  const best = Math.max(0, ...known.map((entry) => entry.count));
  if (best > 0) {
    const leaders = known.filter((entry) => entry.count === best);
    return leaders.length === 1 ? leaders[0].code : "";
  }
  const nearest = (languages || []).map((code) => {
    const apart = words.map((word) => {
      const verdict = verdicts?.[word]?.[code];
      const offered = judges(verdict, code, word) && !verdict.known && offerFor(word, verdict);
      return offered ? typoDistance(word, offered) : Infinity;
    });
    return { code, apart: Math.min(...apart) };
  }).filter((entry) => entry.apart < Infinity);
  const least = Math.min(...nearest.map((entry) => entry.apart));
  const closest = nearest.filter((entry) => entry.apart === least);
  return closest.length === 1 ? closest[0].code : "";
}

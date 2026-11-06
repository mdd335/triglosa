/* What each word of a sentence became in its translation, for the hover:
   the word aligner's links laid out as units — groups of words that belong
   together, each with the stretch it became in every translation asked
   about.

   Every position here is a position in the text handed in — the sentence and
   its translation — so the run only has to add where those stand.

   The promise is the same as everywhere a spot is found: no answer is better
   than the wrong one. A reader hovering over a word trusts what appears over
   it, and one that has lost its place looks exactly as confident as one that
   has not. */

import { stripDiacritics, toTokens } from "../text.js";
import { glossOf } from "../glance.js";
import { isFunctionWord } from "../vocabulary.js";
import { wordSet } from "../languages/index.js";

const fold = (word) => stripDiacritics(word).toLowerCase();

/* Ranges with nothing but a space between them are one range: "die" and
   "Regierung" are lit as "die Regierung", not as two boxes with a gap. */
function closed(text, ranges) {
  const out = [];
  for (const range of ranges) {
    const last = out[out.length - 1];
    if (last && /^[\s'’-]*$/.test(text.slice(last.end, range.start))) last.end = Math.max(last.end, range.end);
    else out.push({ ...range });
  }
  return out;
}

/* A group of words that belongs together is one unit, however the links cut
   it: the hover lights it as one and writes one sign over it.

   Words that became the same word of the translation are one: "motor
   económico" is "Wirtschaftsmotor", "central bank" is "Zentralbank". And a
   function word goes with the word after it where what it became stands in
   front of what that word became — "el gobierno", "die Regierung" — or where
   it became nothing at all. One function word, in front of a word that
   carries meaning, and never a conjunction, which the pack names: "y el
   gato" is the conjunction glued to a noun it has nothing to do with. */
const AHEAD = 3;

export function joinUnits(units, sentence, translation, codes) {
  const touching = (text, left, right) => /^[\s'’-]*$/.test(text.slice(left.end, right.start));
  const merge = (left, right) => ({
    start: left.start,
    end: right.end,
    /* Every column keeps its own ranges, so that one grouping serves them
       all: the reader sees the same words held together in every panel. */
    columns: left.columns.map((ranges, i) => [...ranges, ...right.columns[i]]
      .filter((range, at, all) => all.findIndex((other) => other.start === range.start) === at)
      .sort((x, y) => x.start - y.start)),
    to: [...left.to, ...right.to]
      .filter((range, at, all) => all.findIndex((other) => other.start === range.start) === at)
      .sort((x, y) => x.start - y.start),
    ...(left.words && right.words ? { words: [...left.words, ...right.words] } : {}),
  });
  const wordsOf = (unit) => toTokens(sentence.slice(unit.start, unit.end)).filter((token) => token.isWord);
  const bare = (unit) => wordsOf(unit).every((token) => isFunctionWord(token.text, codes.slice(0, 1)));
  const joining = wordSet(codes[0], "conjunctions");
  const leads = (unit) => bare(unit)
    && !wordsOf(unit).some((token) => joining.has(stripDiacritics(token.text).toLowerCase()));
  const sameWord = (left, right) => left.to.some((range) => right.to.some((other) => other.start === range.start));
  /* Side by side, or a few words ahead of it: a translation puts adjectives
     and numbers between an article and its noun in another order than the
     original — "el coche rojo" is "das rote Auto", "los años 1970" is "den
     1970er Jahren" — and the article is still that noun's. */
  const sideBySide = (left, right) => {
    if (!left.to.length) return true;
    if (!right.to.length) return false;
    const end = left.to[left.to.length - 1].end;
    const start = right.to[0].start;
    if (start < end) return false;
    return toTokens(translation.slice(end, start)).filter((token) => token.isWord).length <= AHEAD;
  };

  const together = (list) => {
    const out = [];
    for (const unit of list) {
      const last = out[out.length - 1];
      if (last && touching(sentence, last, unit) && sameWord(last, unit)) out[out.length - 1] = merge(last, unit);
      else out.push(unit);
    }
    return out;
  };
  const joined = together(units);

  /* Back to front, so that a function word meets the word after it as it
     stands, and a word that has taken one already takes no second. */
  const out = [];
  for (let i = joined.length - 1; i >= 0; i--) {
    const unit = joined[i];
    const next = out[0];
    if (next && !next.led && leads(unit) && !bare(next) && touching(sentence, unit, next) && sideBySide(unit, next)) {
      out[0] = { ...merge(unit, next), led: true };
    } else {
      out.unshift(unit);
    }
  }
  /* Once more: a word that took its article may now stand beside the next
     word that became the same word — "las ayudas" and "al alquiler" are both
     "Mietbeihilfen". */
  return together(out.map(({ led, ...unit }) => unit));
}

/* One column of a group, as the window wants it: the ranges closed up where
   only a space parts them, and the words they cover. */
export const column = (group, at, text) => {
  const to = closed(text, group.columns[at]);
  return { to, gloss: glossOf(text, to) };
};

/* The same filling on the sentence's own side: a function word or an
   auxiliary of the sentence the aligner linked to nothing takes the links
   of the word carrying meaning right after it — "de" and "la" in "de la
   ciudad", "be" in "won't be able". Only from a word carrying meaning, or
   a small word that took one's: "hat sich nach" is not "After". Back to
   front, so that "de la" both reach "ciudad". A small word at a clause's
   end takes nothing: there it is a verb's particle as often as not. */
function filled(sentence, words, links, code) {
  const helping = wordSet(code, "auxiliaries");
  const joining = wordSet(code, "conjunctions");
  const small = (word) => isFunctionWord(word.text, [code]) || helping.has(fold(word.text));
  const own = words.map((_, at) => links.filter(([from]) => from === at).map(([, to]) => to));
  const lent = words.map((word, at) => own[at].length && !small(word));
  const touching = (left, right) => /^[\s'’]*$/.test(sentence.slice(words[left].end, words[right].start));
  for (let at = words.length - 2; at >= 0; at--) {
    const word = words[at];
    if (own[at].length || !small(word) || joining.has(stripDiacritics(word.text).toLowerCase())) continue;
    if (!lent[at + 1] || !touching(at, at + 1)) continue;
    own[at] = [...own[at + 1]];
    lent[at] = true;
  }
  /* A small word linked to nothing between two that render the same word
     is theirs: "cats and dogs" is "in Strömen", "and" included. Not a word
     carrying meaning: "the bill for" is not "на". */
  for (let at = 1; at < words.length - 1; at++) {
    const word = words[at];
    if (own[at].length || !(small(word) || joining.has(stripDiacritics(word.text).toLowerCase()))) continue;
    if (!touching(at - 1, at) || !touching(at, at + 1)) continue;
    const shared = own[at - 1].filter((to) => own[at + 1].includes(to));
    if (shared.length) own[at] = shared;
  }
  return own.flatMap((targets, from) => targets.map((to) => [from, to]));
}

/* How many small words of a translation in front of a linked word go to it
   where that word is itself a small one: "to" goes with "an" (for "einem"),
   but "it to an" in "send it to an AI chatbot" stops short of the object
   pronoun. A word carrying meaning takes every small word in front of it:
   "de la ciudad", "in a timely", "of the landlord" (run seventy-five). */
const REACH = 1;

/* The same units from a word aligner's links instead of a model's answer:
   `links` pairs a word of the sentence with a word of the translation, each
   by its number among the words `toTokens` cuts. `other` is the second
   translation, { text, links, codes }, where there is one.

   An aligner links the words carrying meaning and leaves the small words of
   a translation to nobody — "Regierung" for "Die Regierung", "gebilligt" for
   "gebilligt hat". A function word or an auxiliary nobody took goes to the
   linked word right after it, and an auxiliary left at the end of a clause
   to the word right before it ("gebilligt hat"). Any other small word there
   goes to nobody: it is a verb's particle as often as not — "die
   Kontroversen an" — as on the sentence's own side (run seventy). Two words of the sentence
   with nothing but an apostrophe between them are one unit, as a model
   writes them. The grouping after that is the one every answer gets. */
export function unitsFromLinks(sentence, translation, links, codes, other = null, { fill = false, reach = REACH } = {}) {
  const words = toTokens(sentence).filter((token) => token.isWord);
  if (!words.length) return null;
  const targets = [{ text: translation, links: fill ? filled(sentence, words, links, codes[0]) : links, code: codes[1] }];
  if (other) targets.push({ text: other.text, links: fill ? filled(sentence, words, other.links, codes[0]) : other.links, code: other.codes[1] });

  const columns = targets.map((target) => {
    const into = toTokens(target.text).filter((token) => token.isWord);
    const taken = new Set(target.links.map(([, to]) => to));
    const all = target.links.filter(([from, to]) => words[from] && into[to]).map((link) => [...link]);
    const helping = wordSet(target.code, "auxiliaries");
    const helps = (at) => helping.has(fold(into[at].text));
    const bare = (at) => !!into[at] && !taken.has(at) && (isFunctionWord(into[at].text, [target.code]) || helps(at));
    const between = (left, right) => target.text.slice(into[left].end, into[right].start);
    const give = (owner, at) => {
      for (const [from, to] of target.links) if (to === owner) all.push([from, at]);
      taken.add(at);
    };
    const linked = [...taken].filter((at) => into[at]).sort((x, y) => y - x);
    for (const at of linked) {
      const mine = [];
      /* An auxiliary only right in front of its verb: in "hat das Dekret"
         the article is the noun's and "hat" is not. */
      const lends = isFunctionWord(into[at].text, [target.code]) || helps(at) ? reach : Infinity;
      for (let before = at - 1; before >= 0 && at - before <= lends && bare(before) && /^[\s'’]*$/.test(between(before, before + 1)); before--) {
        if (helps(before) && before !== at - 1) break;
        mine.push(before);
      }
      for (const before of mine) give(at, before);
    }
    for (let at = 1; at < into.length; at++) {
      const closes = at === into.length - 1 || /[^\s'’\p{L}\p{N}-]/u.test(between(at, at + 1));
      if (bare(at) && helps(at) && closes && taken.has(at - 1) && /^\s*$/.test(between(at - 1, at))) give(at - 1, at);
    }
    return { into, all };
  });

  const units = [];
  for (let first = 0; first < words.length; first++) {
    let last = first;
    while (words[last + 1] && /^['’]$/.test(sentence.slice(words[last].end, words[last + 1].start))) last++;
    const ranges = columns.map(({ into, all }) => [...new Set(all.filter(([from]) => from >= first && from <= last).map(([, to]) => to))]
      .sort((x, y) => x - y)
      .map((to) => ({ start: into[to].start, end: into[to].end })));
    const start = words[first].start;
    const end = words[last].end;
    units.push({ start, end, columns: ranges, to: ranges[0], words: [{ start, end, columns: ranges }] });
    first = last;
  }

  const groups = joinUnits(units, sentence, translation, codes);
  const empty = !!other && groups.every((group) => !group.columns[1].length);
  return groups.map((group) => ({
    start: group.start,
    end: group.end,
    ...column(group, 0, translation),
    ...(other ? { second: empty ? null : column(group, 1, other.text) } : {}),
    /* What each word of the group became on its own, for a mark that cuts
       one of them out: its counterparts go with it. */
    parts: group.words.map((word) => ({
      start: word.start,
      end: word.end,
      to: word.columns[0],
      ...(other && !empty ? { second: word.columns[1] } : {}),
    })),
  }));
}

/* The hover over the third panel — a translation that is not the reader's
   own, beside one that is: its words grouped in its own language and laid
   over the reader's translation straight, not by way of the original. Its
   links to the reader's are the aligner's between the two (`between`) and
   those that lead through a word of the original (`own`, `other`: the
   original's links to each); the two together leave far fewer words bare
   than either (run sixty-eight). Each unit says where it stands in the
   panel (`start`, `end`), what it became in the reader's (`to`, `gloss`)
   and which words of the original it renders (`source`). */
export function unitsOfThird({ original, own, other, links, codes, reach = REACH }) {
  const [, ownCode, otherCode] = codes;
  const through = links.other.flatMap(([from, to]) => links.own.filter(([at]) => at === from).map(([, mine]) => [to, mine]));
  const seen = new Set();
  const joined = [...links.between, ...through].filter((link) => !seen.has(link.join()) && seen.add(link.join()));
  const units = unitsFromLinks(other, own, joined, [otherCode, ownCode], null, { fill: true, reach });
  if (!units) return null;
  const sentenceWords = toTokens(original).filter((token) => token.isWord);
  const panelWords = toTokens(other).filter((token) => token.isWord);
  return units.map((unit) => {
    const mine = panelWords.map((word, at) => (word.start >= unit.start && word.end <= unit.end ? at : -1)).filter((at) => at !== -1);
    const from = [...new Set(links.other.filter(([, to]) => mine.includes(to)).map(([at]) => at))].sort((x, y) => x - y);
    const source = closed(original, from.map((at) => ({ start: sentenceWords[at].start, end: sentenceWords[at].end })));
    return { ...unit, source };
  });
}

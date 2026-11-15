import test from "node:test";
import assert from "node:assert";
import { fragmentsAcross, rangesAcross } from "../../src/match/links.js";

/* Two sentences in three panels, linked the way an aligner links them: the
   words carrying meaning, by their numbers within each sentence. */
const TEXTS = [
  "El Gobierno ha aprobado la ley. Los vecinos no entienden nada.",
  "Die Regierung hat das Gesetz gebilligt. Die Anwohner verstehen gar nichts.",
  "The government has passed the law. The residents don't understand a thing.",
];
const range = (text, piece) => ({ start: text.indexOf(piece), end: text.indexOf(piece) + piece.length });
const LINKS = {
  panels: [1, 2],
  sentences: [
    {
      ...range(TEXTS[0], "El Gobierno ha aprobado la ley."),
      to: range(TEXTS[1], "Die Regierung hat das Gesetz gebilligt."),
      second: range(TEXTS[2], "The government has passed the law."),
      links: [
        [[1, 1], [2, 2], [3, 5], [5, 4]],
        [[1, 1], [2, 2], [3, 3], [5, 5]],
      ],
    },
    {
      ...range(TEXTS[0], "Los vecinos no entienden nada."),
      to: range(TEXTS[1], "Die Anwohner verstehen gar nichts."),
      second: range(TEXTS[2], "The residents don't understand a thing."),
      links: [
        [[1, 1], [3, 2], [4, 4]],
        [[1, 1], [2, 2], [2, 3], [3, 4], [4, 6]],
      ],
    },
  ],
};
const across = (from, piece, to) => fragmentsAcross(LINKS, TEXTS, from, range(TEXTS[from], piece), to);

test("a word of the original is found in each translation, in its own sentence", () => {
  assert.deepStrictEqual(across(0, "vecinos", 1), ["Anwohner"]);
  assert.deepStrictEqual(across(0, "vecinos", 2), ["residents"]);
  assert.deepStrictEqual(across(0, "ley", 1), ["Gesetz"]);
});

test("words side by side are one fragment, words apart are two", () => {
  const no = { start: TEXTS[0].indexOf(" no ") + 1, end: TEXTS[0].indexOf(" no ") + 3 };
  assert.deepStrictEqual(fragmentsAcross(LINKS, TEXTS, 0, no, 2), ["don't"], "two words with an apostrophe between them");
  assert.deepStrictEqual(across(0, "ha aprobado", 1), ["hat", "gebilligt"]);
  assert.deepStrictEqual(across(0, "ha aprobado", 2), ["has passed"]);
});

test("from a translation back to the original, and from one translation to the other", () => {
  assert.deepStrictEqual(across(1, "Anwohner", 0), ["vecinos"]);
  assert.deepStrictEqual(across(2, "residents", 1), ["Anwohner"]);
  assert.deepStrictEqual(across(1, "gebilligt", 2), ["passed"]);
});

test("where the links say nothing there is no fragment", () => {
  assert.deepStrictEqual(across(0, "Los", 1), [], "a word linked to nothing");
  assert.deepStrictEqual(fragmentsAcross(null, TEXTS, 0, range(TEXTS[0], "ley"), 1), [], "no aligner");
  assert.deepStrictEqual(fragmentsAcross({ ...LINKS, panels: [1] }, TEXTS, 0, range(TEXTS[0], "ley"), 2), [], "a panel it was not asked about");
  assert.deepStrictEqual(fragmentsAcross(LINKS, TEXTS, 0, { start: 900, end: 905 }, 1), [], "a range in no sentence");
  assert.deepStrictEqual(across(0, "ley", 0), [], "a panel and itself");
});

test("the same as ranges, for telling one occurrence of a word from another", () => {
  const [run] = rangesAcross(LINKS, TEXTS, 0, range(TEXTS[0], "vecinos"), 1);
  assert.strictEqual(TEXTS[1].slice(run.start, run.end), "Anwohner");
  assert.strictEqual(run.start, TEXTS[1].indexOf("Anwohner"));
});


test("a small word linked to nothing between two pieces of one word's place is part of it", () => {
  /* "KI-Chatbot" is "chatbot de IA": the aligner links "KI" and "Chatbot"
     and nobody "de", which stood unmarked between the two (author
     2026-11-06). Only small words of the panel's language, at most two,
     linked to nothing; a word carrying meaning keeps the pieces apart. */
  const texts = ["Schick ihn einem KI-Chatbot.", "Envíalo a un chatbot de IA.", "Envíalo a un chatbot moderno IA."];
  const links = {
    panels: [1, 2],
    codes: ["de", "es", "es"],
    sentences: [{
      start: 0, end: texts[0].length,
      to: { start: 0, end: texts[1].length },
      second: { start: 0, end: texts[2].length },
      links: [[[0, 0], [2, 2], [3, 5], [4, 3]], [[0, 0], [2, 2], [3, 5], [4, 3]]],
    }],
  };
  const term = range(texts[0], "KI-Chatbot");
  assert.deepStrictEqual(fragmentsAcross(links, texts, 0, term, 1), ["chatbot de IA"]);
  assert.deepStrictEqual(fragmentsAcross(links, texts, 0, term, 2), ["chatbot", "IA"], "an adjective between");
  const linked = { ...links, sentences: [{ ...links.sentences[0], links: [[[0, 0], [1, 4], [2, 2], [3, 5], [4, 3]], []] }] };
  assert.deepStrictEqual(fragmentsAcross(linked, texts, 0, term, 1), ["chatbot", "IA"], "a small word with a place of its own");
  assert.deepStrictEqual(fragmentsAcross({ ...links, codes: undefined }, texts, 0, term, 1), ["chatbot", "IA"], "no language known");
});

/* A sentence and its translation with the aligner's scores beside its links:
   for every word of the translation the word of the original it holds on to
   most. Run eighty-four. */
function scored(source, target, links, best, codes = ["fr", "en"]) {
  return {
    texts: [source, target],
    links: { panels: [1], codes, sentences: [{ start: 0, end: source.length, to: { start: 0, end: target.length }, links: [links], best: [best] }] },
  };
}
const placed = ({ texts, links }, piece) => fragmentsAcross(links, texts, 0, range(texts[0], piece), 1);

test("an entry of several words grows by the neighbour that holds on to a word inside it", () => {
  /* "la flemme" → "too lazy": the aligner links "lazy" alone, and "too" —
     linked to nothing — holds on to "flemme" most. */
  const s = scored("J'ai la flemme ce soir.", "I'm too lazy tonight.",
    [[0, 0], [1, 1], [3, 3], [4, 4], [5, 4]],
    [0, 1, 3, 3, 4]);
  assert.deepStrictEqual(placed(s, "la flemme"), ["too lazy"]);
  /* A single word does not grow: a word is its own place. */
  assert.deepStrictEqual(placed(s, "flemme"), ["lazy"]);
});

test("a neighbour linked to a word outside the entry, or holding on to one, stays out", () => {
  const s = scored("On se capte demain.", "Shall we meet up tomorrow.",
    [[0, 1], [2, 2], [2, 3], [3, 4]],
    [2, 0, 2, 2, 3]);
  /* "we" is "On"'s, so "Shall" beyond it is out of reach; "tomorrow" is
     "demain"'s. */
  assert.deepStrictEqual(placed(s, "se capte"), ["meet up"]);
  const t = scored("On se capte demain.", "Shall we meet up tomorrow.",
    [[2, 2], [2, 3], [3, 4]],
    [2, 1, 2, 2, 3]);
  assert.deepStrictEqual(placed(t, "On se capte"), ["Shall we meet up"], "the gap and the edge, where the entry holds both");
});

test("growing stops at punctuation, and a word cut by an apostrophe is one", () => {
  const s = scored("J'ai la flemme, vraiment.", "I can't be bothered, really.",
    [[0, 0], [3, 4], [4, 6]],
    [0, 3, 3, 3, 3, 3, 4]);
  /* "can" "t" "be" "bothered": "can't" is kept whole; "really" lies past the comma. */
  assert.deepStrictEqual(placed(s, "la flemme"), ["can't be bothered"]);
  const n = scored("Il a dégainé le 49.3 hier.", "He drew on Article 49.3 yesterday.",
    [[0, 0], [2, 1], [4, 4], [6, 6]],
    [0, 2, 2, 4, 4, 5, 6]);
  assert.deepStrictEqual(placed(n, "dégainé le 49.3"), ["drew on Article 49.3"]);
});

test("a passage keeps the comma it has: two runs either side of it are one", () => {
  const s = scored("Aunque nadie lo esperaba, ganó el equipo.", "Although no one expected it, the team won.",
    [[0, 0], [1, 1], [1, 2], [3, 3], [2, 4], [4, 7], [5, 5], [6, 6]],
    [0, 1, 1, 3, 2, 5, 6, 4], ["es", "en"]);
  assert.deepStrictEqual(placed(s, "Aunque nadie lo esperaba, ganó el equipo"), ["Although no one expected it, the team won"]);
});

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


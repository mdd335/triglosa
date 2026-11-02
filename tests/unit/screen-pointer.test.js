/* The word under the pointer, found in what was read off the screen around
   it. */

import test from "node:test";
import assert from "node:assert";
import { wordUnderPointer } from "../../src/screen-pointer.js";
import { runsTogether, sentenceUnder } from "../../src/sentence.js";

/* Two lines of a paragraph, each character 10 pixels wide. */
const at = (text, left, top) => ({
  t: text,
  b: [left, top, left + text.length * 10, top + 20],
  c: [...text].map((_, i) => [left + i * 10, left + (i + 1) * 10]),
});
const PARAGRAPH = [
  at("Der Hund schläft. Die Katze", 0, 0),
  at("spielt im Garten.", 0, 30),
];

test("the word whose characters the pointer is on", () => {
  /* "schläft" runs from 90 to 160. */
  const found = wordUnderPointer(PARAGRAPH, [120, 10]);
  assert.strictEqual(found.word, "schläft");
  assert.strictEqual(found.context.text, "Der Hund schläft. Die Katze spielt im Garten.");
  assert.strictEqual(found.context.text.slice(found.context.at, found.context.at + found.word.length), "schläft");
  assert.deepStrictEqual(found.boxes(found.context.at, found.context.at + found.word.length), [[90, 0, 160, 20]]);
});

test("its sentence is cut out of the text in reading order, and lit up line by line", () => {
  const found = wordUnderPointer(PARAGRAPH, [75, 40]);
  assert.strictEqual(found.word, "im");
  const sentence = sentenceUnder(found.context, found.word.length);
  assert.strictEqual(sentence.text, "Die Katze spielt im Garten.");
  assert.deepStrictEqual(found.boxes(sentence.start, sentence.end), [[180, 0, 270, 20], [0, 30, 170, 50]]);
});

test("a little above or below a line is still that line; far from any, nothing", () => {
  assert.strictEqual(wordUnderPointer(PARAGRAPH, [120, 25])?.word, "schläft", "five pixels under it");
  assert.strictEqual(wordUnderPointer(PARAGRAPH, [120, 80]), null);
  assert.strictEqual(wordUnderPointer([], [0, 0]), null);
});

test("a line without a letter or a figure is left out of the text around", () => {
  const found = wordUnderPointer([...PARAGRAPH, { t: "□-□", b: [300, 30, 320, 50], c: [] }], [120, 10]);
  assert.strictEqual(found.context.text, "Der Hund schläft. Die Katze spielt im Garten.");
});

test("between words is no word", () => {
  assert.strictEqual(wordUnderPointer(PARAGRAPH, [35, 10]), null, "the space after Der");
});

test("without a place for every character, a character's share of the line stands in", () => {
  const line = { t: "uno dos tres", b: [0, 0, 120, 20], c: [] };
  assert.strictEqual(wordUnderPointer([line], [55, 10]).word, "dos");
});

test("Apple's boxes, a word's for each of its characters and none for a space, find the word too", () => {
  const line = { t: "Mache ich", b: [19, 23, 200, 63], c: [[19, 107], [19, 107], [19, 107], [19, 107], [19, 107], [0, 0], [112, 168], [112, 168], [112, 168]] };
  assert.strictEqual(wordUnderPointer([line], [140, 40]).word, "ich");
  assert.strictEqual(wordUnderPointer([line], [109, 40]), null, "the space between them");
});

test("a script without spaces is cut into words as it is everywhere else", () => {
  const line = at("私は学生です", 0, 0);
  const found = wordUnderPointer([line], [25, 10]);
  assert.ok(found && "私は学生です".includes(found.word) && found.word.length < 6, found?.word);
});

test("a word the piece's edge cuts through is left out of the text around", () => {
  /* The first line starts at the piece's left edge, the second runs into
     its right edge. */
  const lines = [at("ght cold day in Paris and", 0, 0), at("April, and the clocks were stri", 15, 30)];
  const found = wordUnderPointer(lines, [140, 40], { size: [330, 60] });
  assert.strictEqual(found.word, "the");
  assert.strictEqual(found.context.text, "cold day in Paris and April, and the clocks were");
  assert.strictEqual(found.context.text.slice(found.context.at, found.context.at + 3), "the");
  assert.deepStrictEqual(found.boxes(found.context.at, found.context.at + 3), [[125, 30, 155, 50]]);
});

test("the word under the pointer is kept even where the edge cuts it", () => {
  const found = wordUnderPointer([at("striking thirteen", 0, 0)], [20, 10], { size: [400, 20] });
  assert.strictEqual(found.word, "striking");
});

test("a search result read off the screen gives its sentence alone, where the program ran its blocks together", () => {
  /* Chrome hands the result over as one text; the screen shows its name,
     address, title and text apart. */
  const program = "Data Basecamphttps://databasecamp.de › ki › lstmDas Ziel des LSTMs ist es, die Lücke zu füllen.";
  assert.ok(runsTogether(sentenceUnder({ text: program, at: program.indexOf("Ziel") }, 4).text));
  const lines = [
    { t: "Data Basecamp", b: [120, 20, 330, 50] },
    { t: "https://databasecamp.de › ki › lstm", b: [120, 55, 500, 80] },
    { t: "LSTM einfach erklärt: Aufbau, Gates", b: [50, 95, 760, 140] },
    { t: "& Python Beispiel", b: [50, 150, 395, 195] },
    { t: "Das Ziel des LSTMs ist es, die Lücke zu füllen. Das Modell", b: [50, 215, 780, 245] },
    { t: "durchläuft also Wort für Wort, bis es an der Lücke…", b: [50, 255, 700, 285] },
  ];
  const under = wordUnderPointer(lines, [300, 230], { size: [800, 300] });
  const sentence = sentenceUnder(under.context, under.word.length);
  assert.strictEqual(sentence.text, "Das Ziel des LSTMs ist es, die Lücke zu füllen.");
  assert.ok(!runsTogether(sentence.text));
});

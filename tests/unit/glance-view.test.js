/* The hover over a reading, in a document of its own: what stands over a
   word, what lights up, and when nothing does. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Node = dom.window.Node;

const { renderReading } = await import("../../src/ui/reading-view.js");
const { GLANCE_DELAY, watchGlance } = await import("../../src/ui/glance-view.js");
const { glancePairs, placeThird, placeUnits } = await import("../../src/glance.js");
const { unitsFromLinks, unitsOfThird } = await import("../../src/parse/glance.js");
const { parseGlance, parseGlanceWide } = await import("../glance-answers.mjs");

const SETTINGS = {
  languages: ["de", "es", "en"],
  levels: {},
  show: { verbs: "foreign", terms: "foreign" },
  endpoint: "http://model.invalid/v1",
  model: "a-model",
  glance: true,
  cards: { mode: "foreign", anki: { enabled: false, decks: {} } },
};
const TOOLS = { reader: "de", copy: async () => {}, open: async () => {}, search: async () => {},
                card: null, cardFor: () => false, insert: null };

const ORIGINAL = "Ayer el gobierno impugnó el acuerdo.";
const GERMAN = "Gestern focht die Regierung das Abkommen an.";

function glanceOf(answer) {
  const [pair] = glancePairs(ORIGINAL, GERMAN);
  const units = parseGlance(answer, ORIGINAL, GERMAN, ["es", "de"]);
  return { panels: [1], reader: 1, sentences: [{ ...pair, status: "done", units: placeUnits(pair, units) }] };
}

const ENGLISH = "Yesterday the government challenged the agreement.";

/* The same answer with the second translation's column beside it. */
function wideGlance(answer) {
  const [pair] = glancePairs(ORIGINAL, GERMAN);
  const [second] = glancePairs(ORIGINAL, ENGLISH);
  const units = parseGlanceWide(answer, ORIGINAL, GERMAN, ENGLISH, ["es", "de", "en"]);
  return {
    panels: [1, 2],
    reader: 1,
    sentences: [{ ...pair, second: second.to, status: "done", units: placeUnits(pair, units, { to: second.to }) }],
  };
}

const ANSWER = "Ayer | Gestern\nel | die\ngobierno | Regierung\nimpugnó | focht ... an\nel | das\nacuerdo | Abkommen";

function reading(over = {}) {
  return {
    text: ORIGINAL,
    short: false,
    source: { code: "es", name: "Spanisch" },
    panels: [
      { code: "es", status: "ready", text: ORIGINAL },
      { code: "de", status: "ready", text: GERMAN },
      { code: "en", status: "ready", text: ENGLISH },
    ],
    words: [],
    verbs: [],
    forms: [],
    wordAlign: null,
    verbAlign: null,
    status: { words: "", verbs: "", panels: "" },
    fault: null,
    busy: false,
    glance: glanceOf(ANSWER),
    ...over,
  };
}

function view(state) {
  const root = document.getElementById("app");
  root.textContent = "";
  const sheet = document.createElement("div");
  root.append(sheet);
  let current = state;
  const glance = watchGlance({ sheet, layer: root, reading: () => ({ state: current, reader: "de" }) });
  const draw = () => {
    renderReading(sheet, current, {
      settings: SETTINGS, tools: TOOLS,
      edit: { editing: false, draft: "", onDraft() {}, onEdit() {}, onTranslate() {} },
      onPick() {}, onLookUp() {}, onStep() {}, onFold() {}, onMore() {}, onExample() {},
    });
    glance.refresh();
  };
  draw();
  const panel = (index) => sheet.querySelector(`.words[data-panel="${index}"]`);
  const word = (index, text) => [...panel(index).querySelectorAll(".w")].find((node) => node.textContent === text);
  return {
    sheet,
    sign: root.querySelector(".glance"),
    /* The lit stretches of a panel, each as the text it covers. */
    lit: (index) => {
      const runs = [];
      for (const node of panel(index).querySelectorAll(".glance-lit")) {
        if (node.classList.contains("glance-start")) runs.push("");
        runs[runs.length - 1] += node.textContent;
      }
      return runs;
    },
    async hover(index, text) {
      word(index, text).dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, GLANCE_DELAY + 30));
    },
    update(next) {
      current = next;
      draw();
    },
  };
}

test("resting on a word of the original shows what it became and lights both places", async () => {
  const drawn = view(reading());
  await drawn.hover(0, "gobierno");
  assert.ok(drawn.sign.classList.contains("shown"));
  assert.strictEqual(drawn.sign.textContent, "die Regierung");
  assert.deepStrictEqual(drawn.lit(0), ["el gobierno"], "the article with its noun, spaces and all");
  assert.deepStrictEqual(drawn.lit(1), ["die Regierung"]);
  await drawn.hover(0, "impugnó");
  assert.strictEqual(drawn.sign.textContent, "focht … an");
  assert.deepStrictEqual(drawn.lit(1), ["focht", "an"], "two stretches where the translation parts them");
});

test("before the pointer has rested only its own group lights, at once and whole", async () => {
  /* Entering a panel, the word under the pointer showed its own darker
     ground first and its group a moment later (author 2026-11-06). Now the
     group stands at once; the other panels and the sign wait. */
  const drawn = view(reading());
  const enter = (text) => [...drawn.sheet.querySelectorAll(".words[data-panel=\"0\"] .w")]
    .find((node) => node.textContent === text).dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  enter("acuerdo");
  assert.ok(!drawn.sign.classList.contains("shown"));
  assert.deepStrictEqual(drawn.lit(0), ["el acuerdo"], "the group, not the word alone");
  assert.deepStrictEqual(drawn.lit(1), [], "the other panels wait");
  enter("Ayer");
  assert.ok(!drawn.sign.classList.contains("shown"), "a pointer travelling on is not answered at once");
  assert.deepStrictEqual(drawn.lit(0), ["Ayer"]);
  assert.deepStrictEqual(drawn.lit(1), []);
  await new Promise((resolve) => setTimeout(resolve, GLANCE_DELAY + 30));
  assert.strictEqual(drawn.sign.textContent, "Gestern");
  assert.deepStrictEqual(drawn.lit(1), ["Gestern"]);
});

test("over the reader's own panel the original lights up and nothing is written", async () => {
  const drawn = view(reading());
  await drawn.hover(1, "Abkommen");
  assert.ok(!drawn.sign.classList.contains("shown"));
  assert.deepStrictEqual(drawn.lit(0), ["el acuerdo"]);
});

test("every word of a group shows the group's sign, articles included", async () => {
  const drawn = view(reading());
  const articles = [...drawn.sheet.querySelectorAll(".words[data-panel=\"0\"] .w")].filter((node) => node.textContent === "el");
  articles[1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, GLANCE_DELAY + 30));
  assert.strictEqual(drawn.sign.textContent, "das Abkommen");
  assert.deepStrictEqual(drawn.lit(1), ["das Abkommen"]);
  await drawn.hover(0, "acuerdo");
  assert.strictEqual(drawn.sign.textContent, "das Abkommen");
});

test("a sentence still being asked about says so, and the answer replaces it in place", async () => {
  const [pair] = glancePairs(ORIGINAL, GERMAN);
  const drawn = view(reading({ glance: { panels: [1], reader: 1, sentences: [{ ...pair, status: "waiting", units: null }] } }));
  await drawn.hover(0, "gobierno");
  assert.ok(drawn.sign.classList.contains("pending"));
  assert.strictEqual(drawn.sign.textContent, "…");
  drawn.update(reading());
  assert.strictEqual(drawn.sign.textContent, "die Regierung");
  assert.ok(!drawn.sign.classList.contains("pending"));
});

test("before the run has reached the hover at all, the sign already says it is coming", async () => {
  const drawn = view(reading({ glance: { pending: true }, busy: true }));
  await drawn.hover(0, "acuerdo");
  assert.strictEqual(drawn.sign.textContent, "…");
});

test("a sentence with no answer, and a reading without the hover, show nothing", async () => {
  const [pair] = glancePairs(ORIGINAL, GERMAN);
  const refused = view(reading({ glance: { panels: [1], reader: 1, sentences: [{ ...pair, status: "done", units: null }] } }));
  await refused.hover(0, "gobierno");
  assert.ok(!refused.sign.classList.contains("shown"));
  const off = view(reading({ glance: null }));
  await off.hover(0, "gobierno");
  assert.ok(!off.sign.classList.contains("shown"));
  assert.deepStrictEqual(off.lit(1), []);
});

test("a term the reading marked keeps its own grouping and its own counterpart", async () => {
  /* The hover's answer cuts "el acuerdo" differently and calls it "das
     Abkommen an"; the term's alignment found "Abkommen", and that wins. */
  const drawn = view(reading({
    words: [{ text: "el acuerdo", meaning: "das Abkommen", note: "Vertrag." }],
    wordAlign: { a: [["das Abkommen"]], b: [["the agreement"]] },
    glance: glanceOf("Ayer | Gestern\nel | die\ngobierno | Regierung\nimpugnó el | focht\nacuerdo | Abkommen an"),
  }));
  await drawn.hover(0, "acuerdo");
  assert.strictEqual(drawn.sign.textContent, "das Abkommen");
  assert.deepStrictEqual(drawn.lit(0), ["el acuerdo"]);
  assert.deepStrictEqual(drawn.lit(1), ["das Abkommen"]);
});

test("a pressed word is a pick, and the sign gets out of its way", async () => {
  const drawn = view(reading());
  await drawn.hover(0, "gobierno");
  assert.ok(drawn.sign.classList.contains("shown"));
  drawn.sheet.querySelector(".words[data-panel=\"0\"] .w").dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  assert.ok(!drawn.sign.classList.contains("shown"));
  assert.deepStrictEqual(drawn.lit(1), []);
});

test("a marked term is its own group, and a unit running into it keeps only what lies outside", async () => {
  /* The hover's answer took the preposition into the term's unit: "del
     acuerdo" → "des Abkommens". The term is "acuerdo" alone, so "del" says
     what it became and nothing of the term's. */
  const original = "Hablaron del acuerdo.";
  const german = "Sie sprachen des Abkommens wegen.";
  const [pair] = glancePairs(original, german);
  const units = parseGlance("Hablaron | Sie sprachen\ndel acuerdo | des Abkommens", original, german, ["es", "de"]);
  const drawn = view(reading({
    text: original,
    panels: [
      { code: "es", status: "ready", text: original },
      { code: "de", status: "ready", text: german },
      { code: "en", status: "ready", text: "They talked about the agreement." },
    ],
    words: [{ text: "acuerdo", meaning: "Abkommen", note: "Vertrag." }],
    wordAlign: { a: [["Abkommens"]], b: [["agreement"]] },
    glance: { panels: [1], reader: 1, sentences: [{ ...pair, status: "done", units: placeUnits(pair, units) }] },
  }));
  await drawn.hover(0, "del");
  assert.strictEqual(drawn.sign.textContent, "des");
  assert.deepStrictEqual(drawn.lit(0), ["del"]);
  assert.deepStrictEqual(drawn.lit(1), ["des"]);
  await drawn.hover(0, "acuerdo");
  assert.strictEqual(drawn.sign.textContent, "Abkommens");
  assert.deepStrictEqual(drawn.lit(0), ["acuerdo"]);
});

test("the pointer between two words has not left them", async () => {
  const drawn = view(reading());
  await drawn.hover(0, "gobierno");
  assert.ok(drawn.sign.classList.contains("shown"));
  const space = [...drawn.sheet.querySelectorAll(".words[data-panel=\"0\"] .g")]
    .find((node) => Number(node.dataset.from) === ORIGINAL.indexOf("gobierno") - 1);
  drawn.sheet.querySelector(".words[data-panel=\"0\"] .w").dispatchEvent(
    new MouseEvent("mouseout", { bubbles: true, relatedTarget: space }),
  );
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.ok(drawn.sign.classList.contains("shown"), "the sign stays on a space between words");
  assert.deepStrictEqual(drawn.lit(1), ["die Regierung"]);
});

test("with three panels the pointer lights all of them, and both translations get the reader's own words", async () => {
  const drawn = view(reading({
    glance: wideGlance([
      "Ayer | Gestern | Yesterday",
      "el | die | the",
      "gobierno | Regierung | government",
      "impugnó | focht ... an | challenged",
      "el | das | the",
      "acuerdo | Abkommen | agreement",
    ].join("\n")),
  }));
  await drawn.hover(0, "gobierno");
  assert.strictEqual(drawn.sign.textContent, "die Regierung", "the reader's language, over the original");
  assert.deepStrictEqual(drawn.lit(1), ["die Regierung"]);
  assert.deepStrictEqual(drawn.lit(2), ["the government"]);

  /* Over the second foreign panel: the sign is the reader's language again,
     and the other two panels light up. */
  await drawn.hover(2, "government");
  assert.strictEqual(drawn.sign.textContent, "die Regierung");
  assert.deepStrictEqual(drawn.lit(0), ["el gobierno"]);
  assert.deepStrictEqual(drawn.lit(1), ["die Regierung"]);

  /* Over the reader's own panel nothing is written, and both others light. */
  await drawn.hover(1, "Regierung");
  assert.ok(!drawn.sign.classList.contains("shown"));
  assert.deepStrictEqual(drawn.lit(0), ["el gobierno"]);
  assert.deepStrictEqual(drawn.lit(2), ["the government"]);
});

test("the third panel from the aligner: its own words grouped, the reader's words over them, all three lit", async () => {
  /* Ayer el gobierno impugnó el acuerdo . / Gestern focht die Regierung das Abkommen an . /
     Yesterday the government challenged the agreement . */
  const own = [[0, 0], [1, 2], [2, 3], [3, 1], [3, 6], [4, 4], [5, 5]];
  const other = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]];
  /* Straight between English and German: "the agreement" only, which the
     way through the original already knows. */
  const between = [[4, 4], [5, 5]];
  const [pair] = glancePairs(ORIGINAL, GERMAN);
  const [second] = glancePairs(ORIGINAL, ENGLISH);
  const sentence = { ...pair, second: second.to };
  const units = unitsFromLinks(ORIGINAL, GERMAN, own, ["es", "de"], { text: ENGLISH, links: other, codes: ["es", "en"] }, { fill: true });
  const third = unitsOfThird({ original: ORIGINAL, own: GERMAN, other: ENGLISH, links: { own, other, between }, codes: ["es", "de", "en"] });
  const drawn = view(reading({
    glance: {
      panels: [1, 2],
      reader: 1,
      by: "aligner",
      sentences: [{ ...sentence, status: "done", units: placeUnits(sentence, units, { to: second.to }), third: placeThird(sentence, third) }],
    },
  }));
  await drawn.hover(2, "challenged");
  assert.strictEqual(drawn.sign.textContent, "focht … an");
  assert.deepStrictEqual(drawn.lit(2), ["challenged"]);
  assert.deepStrictEqual(drawn.lit(1), ["focht", "an"]);
  assert.deepStrictEqual(drawn.lit(0), ["impugnó"]);
  await drawn.hover(2, "government");
  assert.strictEqual(drawn.sign.textContent, "die Regierung");
  assert.deepStrictEqual(drawn.lit(2), ["the government"]);
  assert.deepStrictEqual(drawn.lit(0), ["el gobierno"]);
  /* Over the original, as before. */
  await drawn.hover(0, "acuerdo");
  assert.strictEqual(drawn.sign.textContent, "das Abkommen");
});

test("a text in the reader's own language signs both translations with the source text's words", async () => {
  const german = "Die Regierung focht das Abkommen an.";
  const spanish = "El gobierno impugnó el acuerdo.";
  const english = "The government challenged the agreement.";
  const [pair] = glancePairs(german, spanish);
  const [second] = glancePairs(german, english);
  const units = parseGlanceWide(
    "Die Regierung | El gobierno | The government\nfocht | impugnó | challenged\ndas Abkommen | el acuerdo | the agreement\nan | - | -",
    german, spanish, english, ["de", "es", "en"]);
  const drawn = view(reading({
    text: german,
    panels: [
      { code: "de", status: "ready", text: german },
      { code: "es", status: "ready", text: spanish },
      { code: "en", status: "ready", text: english },
    ],
    glance: {
      panels: [1, 2],
      reader: 0,
      sentences: [{ ...pair, second: second.to, status: "done", units: placeUnits(pair, units, { to: second.to }) }],
    },
  }));
  await drawn.hover(1, "gobierno");
  assert.strictEqual(drawn.sign.textContent, "Die Regierung", "the source text's own words");
  assert.deepStrictEqual(drawn.lit(0), ["Die Regierung"]);
  assert.deepStrictEqual(drawn.lit(2), ["The government"]);

  await drawn.hover(2, "agreement");
  assert.strictEqual(drawn.sign.textContent, "das Abkommen");

  await drawn.hover(0, "Regierung");
  assert.ok(!drawn.sign.classList.contains("shown"), "nothing over the reader's own language");
  assert.deepStrictEqual(drawn.lit(1), ["El gobierno"]);
});

test("a word cut out of a unit by a marked term takes its own counterparts along", async () => {
  /* "einem KI" is one unit from the aligner, the article led by its noun;
     "KI-Chatbot" is a term. Cut out of the unit, "KI" takes "IA" and the
     "de" in front of it, which was its own: "einem" is "a un", not
     "a un … de". */
  const german = "Schick ihn einem KI-Chatbot deines Vertrauens.";
  const english = "Send it to an AI chatbot you trust.";
  const spanish = "Envíalo a un chatbot de IA de tu confianza.";
  const [pair] = glancePairs(german, english);
  const [second] = glancePairs(german, spanish);
  const units = unitsFromLinks(german, english, [[0, 0], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]], ["de", "en"],
    { text: spanish, links: [[0, 0], [2, 2], [3, 5], [4, 3], [5, 8], [6, 9]], codes: ["de", "es"] }, { fill: true });
  const drawn = view(reading({
    text: german,
    source: { code: "de", name: "Deutsch" },
    panels: [
      { code: "de", status: "ready", text: german },
      { code: "en", status: "ready", text: english },
      { code: "es", status: "ready", text: spanish },
    ],
    words: [{ text: "KI-Chatbot", meaning: "AI chatbot", note: "Ein Chatprogramm." }],
    wordAlign: { a: [["AI chatbot"]], b: [["chatbot", "IA"]] },
    glance: {
      panels: [1, 2],
      reader: 0,
      sentences: [{ ...pair, second: second.to, status: "done", units: placeUnits(pair, units, { to: second.to }) }],
    },
  }));
  await drawn.hover(2, "un");
  assert.strictEqual(drawn.sign.textContent, "einem");
  assert.deepStrictEqual(drawn.lit(0), ["einem"]);
  assert.deepStrictEqual(drawn.lit(2), ["a un"]);
  await drawn.hover(2, "de");
  assert.ok(!drawn.sign.classList.contains("shown"), "the term's own small word says nothing of the article");
});

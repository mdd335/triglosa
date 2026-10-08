import test from "node:test";
import assert from "node:assert";
import { runText, sentenceFor } from "../../src/run.js";

/* A German reader learning English and Spanish. */
const SETTINGS = {
  languages: ["de", "en", "es"],
  levels: {},
  show: { verbs: "foreign", terms: "foreign" },
  endpoint: "https://example.invalid/v1",
  model: "a-model",
  /* Most of these tests are about what the device does, so it goes first
     here; the default is tested on its own below. */
  translator: "device",
};

/* Indonesian: none of the eight languages' function words appear in it, and
   the device will not name it either — the case a reader runs into on any
   page outside the languages they configured. */
const UNNAMED = "ialah gagasan tentang sesuatu masyarakat tertindas dan terkawal "
  + "yang seringnya bertopengkan utopia, sebagaimana diperihalkan dalam buku-buku.";

/* A device that answers everything with a refusal, which is what it does for
   a language it cannot name. */
const noDevice = {
  running: async () => true,
  detect: async () => "",
  translate: async () => "",
  pairStatus: async () => "",
  canTranslate: async () => false,
};

/* A model that names the language the way one does — in the reader's
   language, not as a code — and translates whatever it is given. The
   translation call is the long one; the detection asks for twelve tokens. */
function model(name = "Niederländisch") {
  const asked = [];
  return {
    asked,
    async chat({ system, user, maxTokens }) {
      asked.push({ system, user, maxTokens });
      if (maxTokens <= 12) return name;
      return `übersetzt: ${user.slice(0, 12)}`;
    },
  };
}

/* The last state a run reported. */
async function run(options) {
  let last = null;
  const state = await runText(UNNAMED, { ...options, onChange: (s) => { last = s; } });
  return { state, last };
}

test("a text in a language nobody can name is still translated by the model", async () => {
  const llm = model();
  const { state } = await run({ settings: SETTINGS, translation: noDevice, llm });

  assert.strictEqual(state.source.code, "");
  assert.strictEqual(state.source.name, "Niederländisch");
  /* Every panel but the original is filled — by the model, standing in for
     a device that could not. */
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "ready");
    assert.match(panel.text, /^übersetzt: /);
    assert.strictEqual(panel.fallback, true);
  }
});

test("an unnamed language takes a panel of its own and no more than three", async () => {
  /* Three configured languages plus a text in a fourth is four languages and
     three panels: the original and the first two. */
  const { state } = await run({ settings: SETTINGS, translation: noDevice, llm: model() });
  assert.strictEqual(state.panels.length, 3);
  assert.deepStrictEqual(state.panels.map((panel) => panel.code), ["", "de", "en"]);
});

test("a language there is no pack for gets its terms and no verb table", async () => {
  /* The verb table is made of what only a pack knows, so it is not asked for.
     The terms are: the name, one translation per panel, and the list. */
  const llm = model();
  await run({ settings: SETTINGS, translation: noDevice, llm });
  assert.strictEqual(llm.asked.length, 4);
  assert.strictEqual(llm.asked.filter((call) => call.maxTokens <= 12).length, 1);
  assert.strictEqual(llm.asked.filter((call) => call.maxTokens === 800).length, 1, "the term list");
});

test("switched to the reader's own languages only, a language there is no pack for asks nothing more", async () => {
  const llm = model();
  await run({ settings: { ...SETTINGS, show: { verbs: "foreign", terms: "second" } }, translation: noDevice, llm });
  assert.strictEqual(llm.asked.length, 3);
});

test("without an endpoint the panels say what is missing", async () => {
  const { state } = await run({ settings: SETTINGS, translation: noDevice, llm: null });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "unknown-source");
    assert.strictEqual(panel.text, "");
  }
});

test("a pair the device refuses goes to the model", async () => {
  /* The device names the language but will not translate the pair — a pair
     that is supported and not downloaded, which is every pair of a language
     the reader never configured. */
  const device = { ...noDevice, detect: async () => "ru" };
  const llm = model();
  const { state } = await run({
    settings: { ...SETTINGS, show: { verbs: "never", terms: "never" } },
    translation: device,
    llm,
  });

  assert.strictEqual(state.source.code, "ru");
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "ready");
    assert.match(panel.text, /^übersetzt: /);
  }
});

/* What a panel says when nothing came of it. The two causes are different in
   kind and only one of them is the reader's to fix, so they may not share a
   status: "missing" carries the sentence about the device's language
   downloads, and that sentence is only true where the device was the only
   engine there was. */
test("a pair nothing could translate says so, and blames nobody", async () => {
  const llm = {
    async chat({ maxTokens }) {
      if (maxTokens <= 12) return "Niederländisch";
      throw new Error("the endpoint answered 500");
    },
  };
  const { state } = await run({
    settings: { ...SETTINGS, show: { verbs: "never", terms: "never" } },
    translation: noDevice,
    llm,
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "no-answer");
  }
});

test("without an endpoint a refused pair stays the device's own gap", async () => {
  /* The device names the language and will not translate the pair, and there
     is nothing to take over: the language downloads are exactly what is
     missing here, so this is the one case that keeps "missing". */
  const device = { ...noDevice, detect: async () => "ru" };
  const { state } = await run({ settings: SETTINGS, translation: device, llm: null });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "missing");
  }
});

test("a dictionary entry the model did not give is translated by the device", async () => {
  /* No internet: the model fails, and a word is still worth a plain
     translation. The panel says who made it, because the reader chose the
     model. */
  const llm = {
    async chat({ maxTokens }) {
      if (maxTokens <= 12) return "es";
      throw new Error("the endpoint answered 500");
    },
  };
  const device = { ...noDevice, translate: async (from, to, text) => `${to}:${text}` };
  const state = await runText("meter la pata", {
    settings: SETTINGS,
    translation: device,
    llm,
    onChange: () => {},
  });
  assert.strictEqual(state.short, true);
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "ready");
    assert.strictEqual(panel.text, `${panel.code}:meter la pata`);
    assert.strictEqual(panel.fallback, true);
  }
});

test("a dictionary entry without a model is the device's translation, not a stand-in", async () => {
  const device = { ...noDevice, detect: async () => "es", translate: async (from, to, text) => `${to}:${text}` };
  const state = await runText("meter la pata", {
    settings: SETTINGS,
    translation: device,
    llm: null,
    onChange: () => {},
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "ready");
    assert.strictEqual(panel.fallback, false);
  }
});

test("a dictionary entry neither engine gave names no language pack while a model is set", async () => {
  /* With an endpoint the model has tried and failed too, so the downloads
     are not the thing to point at. */
  const llm = {
    async chat({ maxTokens }) {
      if (maxTokens <= 12) return "es";
      throw new Error("the endpoint answered 500");
    },
  };
  const state = await runText("meter la pata", {
    settings: SETTINGS,
    translation: noDevice,
    llm,
    onChange: () => {},
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "no-answer");
  }
});

test("a model that cannot be reached does not stop the device from translating", async () => {
  const llm = { async chat() { const e = new Error("Failed to fetch"); e.fault = { kind: "unreachable" }; throw e; } };
  const device = { ...noDevice, translate: async (from, to, text) => `${to}:${text}` };
  const state = await runText("soslayable", {
    settings: SETTINGS,
    translation: device,
    llm,
    onChange: () => {},
  });
  assert.strictEqual(state.fault.kind, "unreachable");
  assert.strictEqual(state.source.code, "");
});

test("a helper that is not there is not a language pack that is missing", async () => {
  /* Nothing to take over and nothing answering: the download the other
     message points at would not help, because there is nothing to download
     it into. */
  const away = { ...noDevice, running: async () => false, detect: async () => "ru" };
  const { state } = await run({ settings: SETTINGS, translation: away, llm: null });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "no-device");
  }
});

test("a panel that came to nothing says why, where the reason is known", async () => {
  /* "Nothing answers at this address" is worth more to the reader than "no
     answer came back", and by this point the seam has classified it. */
  const llm = {
    async chat({ maxTokens }) {
      if (maxTokens <= 12) return "Niederländisch";
      const error = new Error("Failed to fetch");
      error.fault = { kind: "unreachable" };
      throw error;
    },
  };
  const { state } = await run({
    settings: { ...SETTINGS, show: { verbs: "never", terms: "never" } },
    translation: noDevice,
    llm,
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "no-answer");
    assert.strictEqual(panel.fault.kind, "unreachable");
  }
});

test("a verb section whose question failed does not claim the text has no verbs", async () => {
  /* Measured by looking: with a dead endpoint the section said "keine Verben
     gefunden" about a sentence full of them. The first of the two verb stages
     had swallowed its own failure and answered with an empty list, which is
     an answer — and a wrong one. */
  const llm = {
    async chat({ maxTokens, system }) {
      if (maxTokens <= 12) return "es";
      if (/verb/i.test(system)) throw new Error("the endpoint answered 500");
      return "übersetzt";
    },
  };
  let state = null;
  await runText("Ayer el gobierno impugnó el acuerdo y provocó un revuelo.", {
    settings: { ...SETTINGS, show: { verbs: "foreign", terms: "never" } },
    translation: noDevice,
    llm,
    onChange: (s) => { state = s; },
  });
  assert.strictEqual(state.verbs, null, "no answer, rather than an empty one");
  assert.strictEqual(typeof state.status.verbs, "object", "and the section says why");
  assert.ok(state.fault, "the reason is recorded once for the whole run");
});

/* Who translates first is the reader's to decide, and the other engine steps
   in wherever the first one cannot. Where that happened the panel carries it,
   because the reader chose one of them for a reason. */
const RUSSIAN = { ...noDevice, detect: async () => "ru", translate: async () => "vom Gerät" };
const QUIET = { verbs: "never", terms: "never" };

test("handed to the device, the device translates first, and nothing is flagged", async () => {
  const llm = model();
  const { state } = await run({ settings: { ...SETTINGS, show: QUIET, glance: false, translator: "device" }, translation: RUSSIAN, llm });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.text, "vom Gerät");
    assert.strictEqual(panel.engine, "device");
    assert.strictEqual(panel.fallback, false);
  }
  assert.strictEqual(llm.asked.filter((call) => call.maxTokens > 12).length, 0);
});

test("by default the model translates and the device is not asked", async () => {
  let asked = 0;
  const device = { ...RUSSIAN, translate: async () => { asked += 1; return "vom Gerät"; } };
  const { state } = await run({
    settings: { ...SETTINGS, show: QUIET, translator: undefined },
    translation: device,
    llm: model(),
  });
  for (const panel of state.panels.slice(1)) {
    assert.match(panel.text, /^übersetzt: /);
    assert.strictEqual(panel.engine, "model");
    assert.strictEqual(panel.model, "a-model", "named as it was when written");
    assert.strictEqual(panel.fallback, false);
  }
  assert.strictEqual(asked, 0);
});

test("a model that fails hands the panel to the device, and the panel says so", async () => {
  const llm = {
    async chat({ maxTokens }) {
      if (maxTokens <= 12) return "ru";
      throw new Error("the endpoint answered 500");
    },
  };
  const { state } = await run({
    settings: { ...SETTINGS, show: QUIET, translator: "model" },
    translation: RUSSIAN,
    llm,
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "ready");
    assert.strictEqual(panel.text, "vom Gerät");
    assert.strictEqual(panel.engine, "device");
    assert.strictEqual(panel.fallback, true);
  }
});

test("a device that refuses hands the panel to the model, and the panel says so", async () => {
  const device = { ...noDevice, detect: async () => "ru" };
  const { state } = await run({ settings: { ...SETTINGS, show: QUIET, translator: "device" }, translation: device, llm: model() });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.engine, "model");
    assert.strictEqual(panel.fallback, true);
  }
});

test("handed to the model with no endpoint, the device translates and is not a stand-in", async () => {
  /* Without a model there was no choice to honour: the device is the only
     engine, and the line under the panels already says what a model adds. */
  const { state } = await run({
    settings: { ...SETTINGS, show: QUIET, translator: "model" },
    translation: RUSSIAN,
    llm: null,
  });
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.text, "vom Gerät");
    assert.strictEqual(panel.fallback, false);
  }
});

/* The hover's alignment: what each word of the original became in the
   reader's own panel. Asked last, one question per sentence, and never where
   there is nothing for it to say. */
const TWO_SENTENCES = "Он пришёл домой. Кошка спала.";
const TWO_TRANSLATED = {
  ...noDevice,
  detect: async () => "ru",
  translate: async (from, to) => (to === "de" ? "Er kam nach Hause. Die Katze schlief." : "He came home. The cat slept."),
};

/* A third panel whose translation does not come apart into as many sentences
   as the original: it is left out rather than paired by guesswork. */
const ONE_SENTENCE_ENGLISH = {
  ...TWO_TRANSLATED,
  translate: async (from, to) => (to === "de" ? "Er kam nach Hause. Die Katze schlief." : "He came home and the cat slept."),
};

function aligning(answer = (user) => {
  if (user.includes("Он пришёл")) return "Он | Er | He\nпришёл | kam | came\nдомой | nach Hause | home";
  return "Кошка | Die Katze | The cat\nспала | schlief | slept";
}) {
  const asked = [];
  return {
    asked,
    async chat({ system, user, maxTokens }) {
      asked.push({ system, user });
      if (maxTokens <= 12) return "ru";
      if (system.includes("hovering")) return answer(user);
      return "übersetzt";
    },
  };
}

test("the hover's alignment is asked sentence by sentence, after everything else", async () => {
  const llm = aligning();
  const seen = [];
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET },
    translation: TWO_TRANSLATED,
    llm,
    onChange: (s) => seen.push(s.glance && (s.glance.pending ? "pending" : s.glance.sentences.map((x) => x.status).join())),
  });
  assert.ok(seen.indexOf("pending") < seen.findIndex((entry) => entry && entry !== "pending"),
    "said to be coming before any sentence is asked");
  assert.strictEqual(llm.asked.filter((call) => call.system.includes("hovering")).length, 2);
  assert.deepStrictEqual(state.glance.panels, [1, 2], "the reader's own panel first, the other beside it");
  assert.strictEqual(state.glance.reader, 1);
  const units = state.glance.sentences.flatMap((sentence) => sentence.units);
  const cat = units.find((unit) => TWO_SENTENCES.slice(unit.start, unit.end) === "Кошка");
  assert.strictEqual(cat.gloss, "Die Katze");
  assert.strictEqual(state.panels[1].text.slice(cat.to[0].start, cat.to[0].end), "Die Katze");
  assert.strictEqual(state.fault, null);

  /* The third panel comes in the same question, so that both hold the same
     words together, and the sign over either says the reader's language. */
  assert.strictEqual(cat.second.gloss, "The cat");
  assert.strictEqual(state.panels[2].text.slice(cat.second.to[0].start, cat.second.to[0].end), "The cat");
  assert.ok(llm.asked.some((call) => call.system.includes("two translations")));
  assert.strictEqual(llm.asked.filter((call) => call.system.includes("hovering")).length, 2,
    "one question per sentence, not one per panel");
});

/* The word aligner in the shell, as the run sees it: every word linked to
   the word in the same place, which is right for these two sentences. */
function aligner({ ready = true, fail = false } = {}) {
  const asked = [];
  return {
    asked,
    ready: async () => ready,
    async align(pairs) {
      asked.push(pairs);
      if (fail) throw new Error("the model would not load");
      return pairs.map(({ source }) => source.split(" ").map((_, index) => [index, index + (source.startsWith("Кошка") ? 1 : 0)]));
    },
  };
}

test("with the word aligner the hover asks the model nothing, and does not wait for the rest", async () => {
  const llm = aligning();
  const words = aligner();
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET },
    translation: TWO_TRANSLATED,
    llm,
    aligner: words,
    onChange: () => {},
  });
  assert.strictEqual(llm.asked.filter((call) => call.system.includes("hovering")).length, 0);
  assert.strictEqual(words.asked.length, 1, "every sentence in one go");
  assert.strictEqual(words.asked[0].length, 4, "two sentences, each against both translations");
  assert.deepStrictEqual(state.glance.panels, [1, 2]);
  const cat = state.glance.sentences.flatMap((sentence) => sentence.units)
    .find((unit) => TWO_SENTENCES.slice(unit.start, unit.end) === "Кошка");
  assert.strictEqual(cat.gloss, "Die Katze");
  assert.strictEqual(cat.second.gloss, "The cat");
  assert.strictEqual(state.panels[1].text.slice(cat.to[0].start, cat.to[0].end), "Die Katze");
});

test("an aligner without its model, or one that fails, leaves the hover to the AI model", async () => {
  for (const words of [aligner({ ready: false }), aligner({ fail: true })]) {
    const llm = aligning();
    const state = await runText(TWO_SENTENCES, {
      settings: { ...SETTINGS, show: QUIET },
      translation: TWO_TRANSLATED,
      llm,
      aligner: words,
      onChange: () => {},
    });
    assert.strictEqual(llm.asked.filter((call) => call.system.includes("hovering")).length, 2);
    assert.ok(state.glance.sentences.every((sentence) => sentence.units));
  }
});

test("with the word aligner the hover works without an AI model, and is not promised where it fails", async () => {
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET, endpoint: "" },
    translation: TWO_TRANSLATED,
    llm: null,
    aligner: aligner(),
    onChange: () => {},
  });
  assert.ok(state.glance.sentences.every((sentence) => sentence.units.length));
  const failed = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET, endpoint: "" },
    translation: TWO_TRANSLATED,
    llm: null,
    aligner: aligner({ fail: true }),
    onChange: () => {},
  });
  assert.strictEqual(failed.glance, null);
});

test("with the hover switched off the aligner is still asked, for the marks, and draws no hover", async () => {
  const off = aligner();
  const state = await runText(TWO_SENTENCES, { settings: { ...SETTINGS, show: QUIET, glance: false }, translation: TWO_TRANSLATED, llm: aligning(), aligner: off, onChange: () => {} });
  assert.strictEqual(off.asked.length, 1);
  assert.strictEqual(state.glance, null);
  assert.deepStrictEqual(state.links.panels, [1, 2]);
  const short = aligner();
  await runText("Кошка", { settings: { ...SETTINGS, show: QUIET }, translation: TWO_TRANSLATED, llm: aligning(), aligner: short, onChange: () => {} });
  assert.strictEqual(short.asked.length, 0, "a single word has no sentences to align");
});

/* A model that names two terms — one of a single word, one of two — and
   says where a term went when asked. */
function withTerms(terms = "спала | schlief | im Schlaf liegen, ruhen\nпришёл домой | kam nach Hause | die Rückkehr in die eigene Wohnung") {
  const asked = [];
  return {
    asked,
    async chat({ system, user, maxTokens }) {
      asked.push({ system, user });
      if (maxTokens <= 12) return "ru";
      if (system.includes("You align words")) {
        /* For the single word it names the other occurrence's neighbour, so
           that a test can tell whose answer was taken. */
        return user.split("\n").filter((line) => line.startsWith("Words:")).join("").includes("спала")
          ? "пришёл домой | kam + nach + Hause | came + home\nспала | Katze | cat"
          : "пришёл домой | kam + nach + Hause | came + home";
      }
      if (system.includes("FORMAT - one line per item")) return terms;
      return "";
    },
  };
}
const TERMS_ONLY = { verbs: "never", terms: "foreign" };
const linking = (llm) => llm.asked.filter((call) => call.system.includes("You align words"));

test("a term of one word is marked by the aligner, a term of several is still the model's", async () => {
  const llm = withTerms();
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: TERMS_ONLY, levels: { ru: "A1" } },
    translation: TWO_TRANSLATED,
    llm,
    aligner: aligner(),
    onChange: () => {},
  });
  const names = state.words.map((word) => word.text);
  assert.deepStrictEqual(names, ["пришёл домой", "спала"]);
  assert.strictEqual(linking(llm).length, 1);
  const wanted = linking(llm)[0].user.split("\n").find((line) => line.startsWith("Words:"));
  assert.ok(wanted.includes("пришёл домой") && wanted.includes("спала"),
    "asked about the whole list, as it always was: alone, the terms of several words are answered differently");
  assert.deepStrictEqual(state.wordAlign.a, [["kam", "nach", "Hause"], ["schlief"]]);
  assert.deepStrictEqual(state.wordAlign.b, [["came", "home"], ["slept"]]);
  /* Whereabouts each stands, for telling two occurrences of a word apart. */
  assert.deepStrictEqual(state.wordAlign.near.a, [state.panels[1].text.indexOf("kam"), state.panels[1].text.indexOf("schlief")]);
});

test("where every term is one word the model is not asked where they went", async () => {
  const llm = withTerms("спала | schlief | im Schlaf liegen, ruhen");
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: TERMS_ONLY, levels: { ru: "A1" } },
    translation: TWO_TRANSLATED,
    llm,
    aligner: aligner(),
    onChange: () => {},
  });
  assert.strictEqual(linking(llm).length, 0);
  assert.deepStrictEqual([state.wordAlign.a, state.wordAlign.b], [[["schlief"]], [["slept"]]]);
});

test("without an aligner, or where it found no place, every term goes to the model as before", async () => {
  for (const words of [null, aligner({ fail: true })]) {
    const llm = withTerms();
    const state = await runText(TWO_SENTENCES, {
      settings: { ...SETTINGS, show: TERMS_ONLY, levels: { ru: "A1" } },
      translation: TWO_TRANSLATED,
      llm,
      aligner: words,
      onChange: () => {},
    });
    assert.strictEqual(linking(llm).length, 1);
    assert.ok(linking(llm)[0].user.includes("спала"));
    assert.deepStrictEqual(state.wordAlign.a[1], ["Katze"], "the model's own answer");
  }
});

test("a sentence whose alignment fails leaves the others and blames nobody", async () => {
  const llm = aligning((user) => {
    if (user.includes("Он пришёл")) throw new Error("the endpoint answered 429");
    return "Кошка | Die Katze\nспала | schlief";
  });
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET },
    translation: TWO_TRANSLATED,
    llm,
    onChange: () => {},
  });
  assert.strictEqual(state.glance.sentences[0].units, null);
  assert.strictEqual(state.glance.sentences[0].status, "done");
  assert.strictEqual(state.glance.sentences[1].units.length, 2);
  assert.strictEqual(state.fault, null, "nothing the reader asked for failed");
});

test("the hover's alignment is not asked where it has nothing to say", async () => {
  const hovering = async (settings, translation, text = TWO_SENTENCES) => {
    const llm = aligning();
    const state = await runText(text, { settings, translation, llm, onChange: () => {} });
    return { state, asked: llm.asked.filter((call) => call.system.includes("hovering")).length };
  };
  const off = await hovering({ ...SETTINGS, show: QUIET, glance: false }, TWO_TRANSLATED);
  assert.deepStrictEqual([off.state.glance, off.asked], [null, 0], "switched off");


  const short = await hovering({ ...SETTINGS, show: QUIET }, TWO_TRANSLATED, "Кошка");
  assert.deepStrictEqual([short.state.glance, short.asked], [null, 0], "a single word");
});

test("the hover's alignment waits its turn behind a clicked word", async () => {
  const llm = aligning();
  let open = null;
  const turn = new Promise((resolve) => { open = resolve; });
  let asked = 0;
  const running = runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET },
    translation: TWO_TRANSLATED,
    llm,
    onChange: () => { asked = llm.asked.filter((call) => call.system.includes("hovering")).length; },
    waitTurn: () => turn,
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(asked, 0);
  open();
  const state = await running;
  assert.ok(state.glance.sentences.every((sentence) => sentence.units));
});

test("a third panel that cannot be paired sentence by sentence is left out", async () => {
  const llm = aligning((user) => (user.includes("Он пришёл")
    ? "Он | Er\nпришёл | kam\nдомой | nach Hause"
    : "Кошка | Die Katze\nспала | schlief"));
  const state = await runText(TWO_SENTENCES, {
    settings: { ...SETTINGS, show: QUIET },
    translation: ONE_SENTENCE_ENGLISH,
    llm,
    onChange: () => {},
  });
  assert.deepStrictEqual(state.glance.panels, [1]);
  assert.ok(llm.asked.every((call) => !call.system.includes("two translations")));
  assert.ok(state.glance.sentences.every((sentence) => sentence.units.length));
});

/* A text in the reader's own language: their language is the original, both
   panels are foreign, and the sign over either is the source text's own words. */
test("a text in the reader's own language is aligned with both translations", async () => {
  const llm = aligning((user) => (user.includes("Er kam")
    ? "Er | He | Он\nkam | came | пришёл\nnach Hause | home | домой"
    : "Die Katze | The cat | Кошка\nschlief | slept | спала"));
  const german = {
    ...noDevice,
    detect: async () => "de",
    translate: async (from, to) => (to === "en" ? "He came home. The cat slept." : "Он пришёл домой. Кошка спала."),
  };
  const state = await runText("Er kam nach Hause. Die Katze schlief.", {
    settings: { ...SETTINGS, show: QUIET, languages: ["de", "en", "ru"] },
    translation: german,
    llm,
    onChange: () => {},
  });
  assert.strictEqual(state.glance.reader, 0, "the original itself holds the reader's language");
  assert.deepStrictEqual(state.glance.panels, [1, 2]);
  const cat = state.glance.sentences[1].units.find((unit) => unit.gloss === "The cat");
  assert.strictEqual(state.panels[2].text.slice(cat.second.to[0].start, cat.second.to[0].end), "Кошка");
});

test("a language the reader chose is not detected again, and the questions name it", async () => {
  const llm = model();
  const { state } = await run({ settings: SETTINGS, translation: noDevice, llm, language: "fa", guesses: ["ar", "ur"] });

  /* No twelve-token question: detection was not asked. */
  assert.ok(!llm.asked.some((a) => a.maxTokens <= 12));
  assert.strictEqual(state.source.code, "");
  assert.strictEqual(state.source.iso, "fa");
  assert.deepStrictEqual(state.source.guesses, ["ar", "ur"]);
  assert.strictEqual(state.panels[0].code, "");
  assert.strictEqual(state.panels[0].iso, "fa");
  /* The terms question says Persian, not "an unknown language". */
  const terms = llm.asked.find((a) => /^Text \(/.test(a.user));
  assert.ok(terms, "the terms were asked");
  assert.match(terms.user, /^Text \(Persian\)/);
  /* Nothing a pack would answer: no verb question. */
  assert.strictEqual(state.verbs, null);
});

test("a supported language the reader chose is that language, with its panels", async () => {
  const llm = model();
  const { state } = await run({ settings: SETTINGS, translation: noDevice, llm, language: "es" });

  assert.ok(!llm.asked.some((a) => a.maxTokens <= 12));
  assert.strictEqual(state.source.code, "es");
  assert.strictEqual(state.source.by, "reader", "the heading's hover says who named it");
  assert.deepStrictEqual(state.panels.map((p) => p.code), ["es", "de", "en"]);
  assert.strictEqual(state.panels[0].iso, undefined);

  /* Named by the sentence it was looked up in, it keeps who named that. */
  const found = await run({ settings: SETTINGS, translation: noDevice, llm: model(), language: "es", languageBy: "model" });
  assert.deepStrictEqual([found.state.source.by, found.state.source.model], ["model", "a-model"]);
});

test("a looked-up word takes its sentence along, named by the sentence's language", async () => {
  const paragraph = "El mercado abrió temprano. Los comerciantes del barrio dudaban de que llegaran clientes con una tormenta y un viento tan fuertes.";
  const found = await sentenceFor("comerciantes", { text: paragraph, at: paragraph.indexOf("comerciantes") },
    { settings: SETTINGS, translation: noDevice, llm: null });
  assert.strictEqual(found.detected.code, "es", "named by the sentence's function words, nobody asked");
  assert.strictEqual(found.detected.by, "text");
  assert.strictEqual(found.text, "Los comerciantes del barrio dudaban de que llegaran clientes con una tormenta y un viento tan fuertes.");
  assert.strictEqual(found.text.slice(found.start, found.end), "comerciantes");
});

test("a looked-up word with nothing around it goes alone", async () => {
  const options = { settings: SETTINGS, translation: noDevice, llm: null };
  assert.strictEqual(await sentenceFor("Einstellungen", null, options), null);
  assert.strictEqual(await sentenceFor("Einstellungen", { text: "Einstellungen", at: 0 }, options), null);
});

test("a dictionary entry is one question per panel, with the sentence where there is one", async () => {
  const llm = model();
  const sentence = { text: "Je cherche une prise pour mon ordinateur.", start: 14, end: 19 };
  const state = await runText("prise", {
    settings: { ...SETTINGS, translator: "model" },
    translation: noDevice,
    llm,
    language: "fr",
    sentence,
    onChange: () => {},
  });
  const entries = llm.asked.filter((call) => !isTermQuestion(call));
  assert.strictEqual(entries.length, 2, "no definition in front: one question per panel");
  assert.ok(entries.every((call) => call.user.includes("The input stands in this sentence: Je cherche une prise")));
  assert.deepStrictEqual(state.sentence, sentence);

  const alone = model();
  await runText("prise", { settings: SETTINGS, translation: noDevice, llm: alone, language: "fr", onChange: () => {} });
  assert.ok(alone.asked.every((call) => !call.user.includes("sentence")), "without one, the word alone");
});

/* ---- the one term under a dictionary entry ---- */

const isTermQuestion = (call) => call.system.includes("WHAT COUNTS:");

/* A model that gives every entry a line and answers the term question with
   `term`, recording what was asked in the order it was asked. */
function lookupModel(term) {
  const asked = [];
  return {
    asked,
    async chat(call) {
      asked.push(call);
      return isTermQuestion(call) ? term : "Steckdose | Stromnetz";
    },
  };
}

const lookUp = (word, llm, { sentence = null, settings = {} } = {}) => runText(word, {
  settings: { ...SETTINGS, translator: "model", ...settings },
  translation: noDevice,
  llm,
  language: "es",
  sentence,
  onChange: () => {},
});

test("a dictionary entry asks for one term, after the upper panel and beside the lower one", async () => {
  const llm = lookupModel("zascandil | Wichtigtuer | jemand, der sich überall einmischt; umgangssprachlich");
  const state = await lookUp("zascandil", llm);
  assert.deepStrictEqual(llm.asked.slice(0, 3).map(isTermQuestion), [false, false, true],
    "the upper panel alone, then the lower panel's question sent before the term's");
  const [term] = llm.asked.filter(isTermQuestion);
  assert.ok(term.system.includes("At most 1 item"));
  assert.ok(term.user.startsWith("Text (Spanish): zascandil"), "without a sentence the text is the word");
  assert.ok(!term.user.includes("Looked up"));
  assert.deepStrictEqual(state.words.map((word) => [word.text, word.meaning]), [["zascandil", "Wichtigtuer"]]);
  assert.strictEqual(state.status.words, "");
});

test("in its sentence the term may reach past the looked-up word, never beside it", async () => {
  const sentence = { text: "Otra vez metí la pata delante de todos.", start: 17, end: 21 };
  const reached = lookupModel("metí la pata | sich blamieren | einen peinlichen Fehler machen; umgangssprachlich");
  const state = await lookUp("pata", reached, { sentence });
  const [term] = reached.asked.filter(isTermQuestion);
  assert.ok(term.user.includes("Text (Spanish): Otra vez metí la pata delante de todos."));
  assert.ok(term.user.includes("Looked up: pata"));
  assert.ok(term.system.includes("The item must contain at least one of them"));
  assert.deepStrictEqual(state.words.map((word) => word.text), ["metí la pata"]);

  const beside = lookupModel("delante de todos | vor allen | in aller Öffentlichkeit");
  assert.deepStrictEqual((await lookUp("pata", beside, { sentence })).words, [],
    "a phrase next to the word is the sentence's, not the word's");
});

test("a dictionary entry asks for no term where terms are off or there is no model", async () => {
  const off = lookupModel("zascandil | Wichtigtuer | jemand");
  const state = await lookUp("zascandil", off, { settings: { show: { verbs: "foreign", terms: "never" } } });
  assert.ok(!off.asked.some(isTermQuestion));
  assert.deepStrictEqual([state.words, state.status.words], [null, ""]);

  const device = { ...noDevice, translate: async (from, to, text) => `${to}:${text}` };
  const plain = await runText("zascandil", { settings: SETTINGS, translation: device, llm: null, language: "es", onChange: () => {} });
  assert.deepStrictEqual([plain.words, plain.status.words], [null, ""]);
});

test("a term question that failed says so, and the entry stands", async () => {
  const llm = {
    async chat(call) {
      if (isTermQuestion(call)) throw Object.assign(new Error("500"), { fault: { kind: "server", status: 500 } });
      return "Steckdose | Stromnetz";
    },
  };
  const state = await lookUp("zascandil", llm);
  assert.strictEqual(state.status.words.kind, "server");
  assert.strictEqual(state.panels[1].status, "alternatives");
});

test("with the sentence, a note marked as another meaning is that meaning in the reader's language, without a label", async () => {
  const answer = "Steckdose | \n= | Aktenmappe\nGriff | = Bedeutung: grip\nEinnahme | gehoben";
  const llm = { asked: [], async chat({ user }) { this.asked.push(user); return answer; } };
  const sentence = { text: "Je cherche une prise pour mon ordinateur.", start: 14, end: 19 };
  const state = await runText("prise", {
    settings: { ...SETTINGS, translator: "model" },
    translation: noDevice,
    llm,
    language: "fr",
    sentence,
    onChange: () => {},
  });
  const [german, english] = [state.panels[1].alternatives, state.panels[2].alternatives];
  assert.deepStrictEqual(german.map(({ note, gloss }) => [note, gloss]), [["", undefined], ["grip", undefined], ["gehoben", undefined]],
    "a list in the reader's own language says the meaning itself: its notes lose the label, and are no translation");
  assert.deepStrictEqual(english.slice(1).map(({ note, gloss }) => [note, gloss]), [["grip", true], ["gehoben", undefined]],
    "only a note marked as a meaning is one; a near-synonym's says how it is used; a line with the mark for a translation is dropped");
  assert.ok(!english[0].gloss, "the first line is the meaning in the sentence");
  assert.ok(llm.asked[1].includes("that meaning in German"));
  assert.ok(llm.asked[0].includes("names the field or situation"));
});

import test from "node:test";
import assert from "node:assert";
import { runText } from "../../src/run.js";

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

test("a dictionary entry that did not come back names no language pack", async () => {
  /* Short mode never asks the device at all, so a panel of it saying "not
     installed on this device" would name a cause that was never in it. */
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
  assert.strictEqual(state.short, true);
  for (const panel of state.panels.slice(1)) {
    assert.strictEqual(panel.status, "no-answer");
  }
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

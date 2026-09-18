import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONFIDENCE_THRESHOLD,
  PAIR_DOWNLOADABLE,
  PAIR_INSTALLED,
  PAIR_UNSUPPORTED,
  createTranslationBackend,
  keepParagraphShape,
  readDetection,
  readPairStatus,
  readProtocol,
} from "../../src/platform/translation.js";
import { neededPairs } from "../../src/settings.js";
import {
  RETRIES,
  chatPayload,
  createLlmBackend,
  nextReasoningMode,
  pickModel,
  readAnswer,
  refusesReasoning,
  retryDelay,
} from "../../src/platform/llm.js";
import {
  accessibilityGranted,
  keyLabels,
  openAccessibilitySettings,
  readSelection,
  insertText,
  requestAccessibility,
  takenShortcuts,
} from "../../src/platform/capture.js";
import {
  applyTray,
  hideWindow,
  fitTo,
  onSettingsChanged,
  openSettings,
  settingsChanged,
  showWindow,
} from "../../src/platform/windows.js";
import { onCapture, onCardCapture, registerShortcuts } from "../../src/platform/shortcut.js";
import { detectByStopwords, detectLanguage } from "../../src/detect.js";
import { SUPPORTED as SUPPORTED_CODES } from "../../src/languages/index.js";
import { SEARCH_URLS, searchLink, searchUrlFor } from "../../src/platform/search.js";
import { createAnkiBackend, readAddResult } from "../../src/platform/anki.js";
import { languagesFromReport } from "../../src/platform/env.js";

/* Answers an Anki request from a table of canned results. The backend takes
   its transport rather than a fetch: inside the app the question goes through
   the shell, because Tauri's own fetch sets an Origin AnkiConnect refuses. */
function fakeAnki(answers) {
  return async (body) => {
    const { action } = JSON.parse(body);
    if (action === "version") return JSON.stringify({ result: 6 });
    return JSON.stringify({ result: answers[action] ?? null });
  };
}
const jsonResponse = (body) => ({ ok: true, json: async () => body });

const here = path.dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(fs.readFileSync(path.join(here, "..", "corpus.json"), "utf8"));
/* The recorded values of the device's recognizer over the same corpus. They
   sit in a file so the measurement stays reproducible without the device. */
const recorded = JSON.parse(fs.readFileSync(path.join(here, "..", "recognizer.json"), "utf8"));

const labelled = [];
for (const set of Object.keys(corpus)) {
  for (const e of corpus[set]) {
    if (e.lang) labelled.push({ id: `${set}/${e.id}`, lang: e.lang, text: e.text });
  }
}
const CONFIGURED = ["de", "en", "es"];

/* ---- the device's recognizer: same promise, another stage ---- */

test("the second stage decides only above its threshold", () => {
  assert.strictEqual(readDetection("es 0.994", CONFIGURED), "es");
  assert.strictEqual(readDetection("es 0.899", CONFIGURED), "", "just below does not count");
});

test("a language that is not configured is handed on, however sure it is", () => {
  assert.strictEqual(readDetection("fr 1.000", CONFIGURED), "");
  assert.strictEqual(readDetection("pt 0.987", CONFIGURED), "");
});

test("a reader's own language close behind a leader they never configured is taken", () => {
  /* Measured answers of the recognizer, for words written that way in both. */
  const empresa = "pt 0.600\nes 0.280\nca 0.110";
  assert.strictEqual(readDetection(empresa, SUPPORTED_CODES, ["de", "es", "en"]), "es");
  assert.strictEqual(readDetection(empresa, SUPPORTED_CODES, ["en", "pt"]), "", "their own leads, unsure: handed on");
  assert.strictEqual(readDetection("ca 0.360\nes 0.320\nit 0.200", SUPPORTED_CODES, ["de", "es", "en"]), "es");
  assert.strictEqual(readDetection("ca 0.360\nes 0.320\nit 0.200", SUPPORTED_CODES, ["de", "it", "fr"]), "", "too far behind");
});

test("a sure leader stays, and an unsure one of the reader's own is not promoted", () => {
  assert.strictEqual(readDetection("pt 0.990\nes 0.010", SUPPORTED_CODES, ["de", "es", "en"]), "pt");
  /* A rare Spanish word the recognizer calls English. */
  assert.strictEqual(readDetection("en 0.470\nfr 0.110\nes 0.070", SUPPORTED_CODES, ["de", "es", "en"]), "");
  assert.strictEqual(readDetection("pt 0.990\nes 0.010", SUPPORTED_CODES), "pt", "without a preference, as before");
});

test("unusable output means silence, not guessing", () => {
  for (const answer of ["", "  ", "broken", "es", "0.99", "es 0.9 toomuch"]) {
    assert.strictEqual(readDetection(answer, CONFIGURED), "", JSON.stringify(answer));
  }
});

test("the two words the model itself fails on fall through", () => {
  /* One is Spanish and comes back as English at 0.47, the other as English
     at 0.40 — both far below the threshold. That is exactly what it is for:
     a single rare word must not be decided here. */
  for (const id of ["dev/01", "dev/21"]) {
    assert.ok(recorded[id].confidence < CONFIDENCE_THRESHOLD, `${id} sits at ${recorded[id].confidence}`);
  }
});

test("across the whole corpus the two early stages are never wrong", () => {
  const wrong = [];
  for (const t of labelled) {
    if (detectByStopwords(t.text, CONFIGURED)) continue;
    const n = recorded[t.id];
    if (!n || n.confidence < CONFIDENCE_THRESHOLD) continue;
    const got = readDetection(`${n.nl} ${n.confidence}`, CONFIGURED);
    if (got && got !== t.lang) wrong.push(`${t.id}: is ${t.lang}, read as ${got}`);
  }
  assert.deepStrictEqual(wrong, []);
});

test("the second stage decides enough to be worth the detour", () => {
  const open = labelled.filter((t) => !detectByStopwords(t.text, CONFIGURED));
  const taken = open.filter((t) => {
    const n = recorded[t.id];
    return n && readDetection(`${n.nl} ${n.confidence}`, CONFIGURED);
  });
  assert.ok(taken.length >= 12, `only ${taken.length} of ${open.length} decided on top`);
});

/* ---- the shape a translation comes back in ---- */

test("doubled line breaks are brought back to the shape of the source", () => {
  /* The device translates line by line and appends a blank line to each.
     Three bullet points would otherwise become six lines — and the same
     translation would look different depending on the engine. */
  assert.strictEqual(keepParagraphShape("- uno\n- dos", "- eins\n\n- zwei"), "- eins\n- zwei");
  assert.strictEqual(keepParagraphShape("a\nb\nc", "x\n\ny\n\nz"), "x\ny\nz");
});

test("real paragraphs in the source are left alone", () => {
  const source = "Erster Absatz.\n\nZweiter Absatz.";
  assert.strictEqual(keepParagraphShape(source, "One.\n\nTwo."), "One.\n\nTwo.");
});

test("single-line text comes back single-line", () => {
  assert.strictEqual(keepParagraphShape("Hola.", "Hallo."), "Hallo.");
});

/* ---- the three stages together ---- */

const silentDevice = { detect: async () => "" };

test("the free stage answers alone where it can", () => {
  assert.strictEqual(
    detectByStopwords("Der Beklagte rügte die örtliche Zuständigkeit und beantragte hilfsweise die Verweisung.", CONFIGURED),
    "de",
  );
  assert.strictEqual(
    detectByStopwords("The committee had spent months reviewing the proposal, yet the final vote was postponed.", CONFIGURED),
    "en",
  );
  assert.strictEqual(
    detectByStopwords("Cuando llegamos al pueblo, la niebla cubría los tejados y apenas se distinguían las siluetas de las casas.", CONFIGURED),
    "es",
  );
});

/* Its neighbours share too many short words for a clear lead, and a Spanish
   sentence carrying five of them against French's three is exactly the shape
   a Czech sentence had when it came back Portuguese. The stage behind this
   one answers it in a few milliseconds. */
test("a lead too narrow to be sure of is handed on", () => {
  assert.strictEqual(
    detectByStopwords("El contrato se firma ante notario y las arras se pierden si te echas atrás.", CONFIGURED),
    "",
  );
});

test("the model is only asked when both early stages refuse", async () => {
  let asked = 0;
  const llm = { chat: async () => { asked++; return "es"; } };
  const decided = await detectLanguage(
    "Cuando llegamos al pueblo, la niebla cubría los tejados y apenas se distinguían las siluetas de las casas.",
    { languages: CONFIGURED, reader: "de", translation: silentDevice, llm },
  );
  assert.strictEqual(decided.code, "es");
  assert.strictEqual(asked, 0, "the free stage had already decided");

  const rare = await detectLanguage("soslayable", {
    languages: CONFIGURED, reader: "de", translation: silentDevice, llm,
  });
  assert.strictEqual(rare.code, "es");
  assert.strictEqual(asked, 1);
});

test("a fourth language comes back named, not forced into a code", async () => {
  const llm = { chat: async () => "Niederländisch" };
  const decided = await detectLanguage("soslayable", {
    languages: CONFIGURED, reader: "de", translation: silentDevice, llm,
  });
  assert.strictEqual(decided.code, "");
  assert.strictEqual(decided.name, "Niederländisch");
});

test("a decided language is named in the reader's own language", async () => {
  const decided = await detectLanguage("soslayable", {
    languages: CONFIGURED, reader: "de", translation: { detect: async () => "es" }, llm: null,
  });
  assert.strictEqual(decided.code, "es");
  assert.strictEqual(decided.name, "Spanisch");
});

/* ---- talking to the model ---- */

test("an instruction-tuned model wins over an uncensored one", () => {
  /* A server lists alphabetically, so an uncensored variant sorts first. It
     answers technical vocabulary with slang and invents words. */
  assert.strictEqual(pickModel(["gemma-3-abliterated", "gemma-3-it"]), "gemma-3-it");
  assert.strictEqual(pickModel(["some-model-uncensored", "some-model-instruct"]), "some-model-instruct");
  assert.strictEqual(pickModel(["only-one"]), "only-one");
  assert.strictEqual(pickModel([]), "");
});

test("reasoning is switched off in every request", () => {
  /* Reasoning counts against the token budget: it eats the budget, the
     answer stays empty, and the request ends as "length". */
  const payload = chatPayload({ model: "m", system: "s", user: "u", maxTokens: 100 });
  assert.strictEqual(payload.reasoning_effort, "none");
  assert.strictEqual(payload.stream, false);
  assert.deepStrictEqual(payload.messages.map((m) => m.role), ["system", "user"]);
});

/* ---- and what to do with a model that will not switch it off ---- */

test("both rungs send a field, and neither buys room for thinking", () => {
  /* There is no rung that pays for thinking any more. It existed, and what
     it did was worse than the failure it caught: the rung is kept for the
     whole backend, so one awkward text put every later question of the
     session into a thinking mode nobody asked for — measured at thirty times
     the output tokens against gemini-3.8-flash. */
  for (const rung of ["none", "minimal"]) {
    const payload = chatPayload({ model: "m", system: "s", user: "u", maxTokens: 100, reasoning: rung });
    assert.strictEqual(payload.reasoning_effort, rung);
    assert.strictEqual(payload.max_tokens, 100, "the budget is the size of an answer");
  }
});

test("only a refusal that names reasoning is one to answer differently", () => {
  assert.ok(refusesReasoning(400, "Reasoning is mandatory for this endpoint and cannot be disabled."));
  assert.ok(!refusesReasoning(400, "model not found"), "another 400 is a wrong request");
  assert.ok(!refusesReasoning(401, "Reasoning is mandatory"), "a wrong key is not this");
  assert.ok(!refusesReasoning(400, ""), "a refusal that says nothing says nothing");
});

test("the ladder is climbed one rung at a time, and only for its own failures", () => {
  const refused = Object.assign(new Error("400"), { reasoningRefused: true });
  assert.strictEqual(nextReasoningMode("none", refused), "minimal");
  assert.strictEqual(nextReasoningMode("minimal", refused), "", "nothing left to try");
  /* "minimal" is never the first rung: for gemma-4-31b-it it is the switch
     that turns thinking ON, 201 tokens where there were none. */
  assert.strictEqual(nextReasoningMode("none", new Error("401")), "");
  /* A model that thought anyway climbs the same ladder. It used to jump
     past "minimal" to a rung that merely paid for the thinking — and
     "minimal" is the one field that quiets the models refusing "none", so
     the jump skipped the only rung that could have helped. */
  const thought = Object.assign(new Error("empty"), { onlyReasoned: true });
  assert.strictEqual(nextReasoningMode("none", thought), "minimal");
  assert.strictEqual(nextReasoningMode("minimal", thought), "");
});

test("an answer that is all thinking is recognized however the endpoint says so", () => {
  for (const body of [
    { choices: [{ message: { content: "", reasoning_content: "hmm" } }] },
    { choices: [{ message: { content: "", reasoning: "hmm" } }] },
    { choices: [{ message: { content: "" } }], usage: { completion_tokens_details: { reasoning_tokens: 44 } } },
    { choices: [{ finish_reason: "length", message: { content: "" } }] },
  ]) {
    assert.throws(() => readAnswer(body), (error) => error.onlyReasoned);
  }
  /* An empty answer with nothing behind it is an empty answer, not a budget
     that ran out. Asking again with more room would only cost time. */
  assert.strictEqual(readAnswer({ choices: [{ message: { content: "" } }] }), "");
});

/* Answers a refusal carrying a message, then 200. The GLM family, in a
   test double: it refuses "none" and accepts "minimal". */
function picky(refuse) {
  const calls = [];
  const impl = async (_url, init) => {
    const sent = JSON.parse(init.body);
    calls.push(sent);
    if (refuse(sent)) {
      return {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: { get: () => "" },
        text: async () => JSON.stringify({
          error: { message: "Reasoning is mandatory for this endpoint and cannot be disabled." },
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "fine" } }] }) };
  };
  impl.calls = calls;
  return impl;
}

test("a model that must think is asked again in a way it accepts", async () => {
  const impl = picky((sent) => sent.reasoning_effort === "none");
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  assert.strictEqual(await llm.chat({ system: "s", user: "u", maxTokens: 100 }), "fine");
  assert.deepStrictEqual(
    impl.calls.map((c) => c.reasoning_effort),
    ["none", "minimal"],
    "the standard field first, then the one a mandatory-reasoning model takes",
  );
  /* Found once and kept: a reading asks eight questions and a model does not
     change its mind between two of them. */
  await llm.chat({ system: "s", user: "u", maxTokens: 100 });
  assert.strictEqual(impl.calls.length, 3, "the second question does not start at the top again");
  assert.strictEqual(llm.reasoning, "minimal");
});

test("a model that refuses every field is refused in turn, by name", async () => {
  /* The app asks models not to think. One that cannot be asked is one it
     does not use, and the message has to say that: "it never wrote an
     answer" is something the reader can do nothing with. */
  const impl = picky((sent) => "reasoning_effort" in sent);
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  await assert.rejects(
    llm.chat({ system: "s", user: "u", maxTokens: 100 }),
    /answers only by thinking first/,
  );
  assert.deepStrictEqual(impl.calls.map((c) => c.reasoning_effort), ["none", "minimal"],
    "both rungs tried, and no third that pays for the thinking");
});

test("a model that thinks anyway is asked once more on the quieter rung", async () => {
  const calls = [];
  const impl = async (_url, init) => {
    const sent = JSON.parse(init.body);
    calls.push(sent);
    return {
      ok: true,
      status: 200,
      json: async () =>
        "reasoning_effort" in sent
          ? { choices: [{ message: { content: "", reasoning: "thinking" } }] }
          : { choices: [{ message: { content: "fine" } }] },
    };
  };
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  await assert.rejects(llm.chat({ system: "s", user: "u", maxTokens: 100 }),
    /answers only by thinking first/);
  assert.deepStrictEqual(calls.map((c) => c.reasoning_effort), ["none", "minimal"],
    "one rung at a time, and no rung that accepts the thinking");
});

test("eight questions at once climb one ladder, not eight", async () => {
  /* A reading asks its questions in parallel. They all fail at the first rung
     together, and the one that catches last must not read a rung its
     neighbours have already climbed and conclude there is nothing left to
     try. That cost the verb list of a Russian text: it gave up at the top of
     the ladder without ever having asked from it. */
  const impl = picky((sent) => sent.reasoning_effort === "none");
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  const answers = await Promise.all(
    Array.from({ length: 8 }, () => llm.chat({ system: "s", user: "u", maxTokens: 100 })),
  );
  assert.deepStrictEqual(answers, Array(8).fill("fine"), "every one of them got an answer");
  assert.strictEqual(llm.reasoning, "minimal", "and the ladder moved exactly one rung");
  const minimal = impl.calls.filter((c) => c.reasoning_effort === "minimal");
  assert.strictEqual(minimal.length, 8, "each asked again on the rung that now applies");
});

test("what the endpoint said about a refusal reaches the reader", async () => {
  /* It used to arrive as "answered 400 Bad Request" with the reason thrown
     away, and the reason is sometimes the whole of it. */
  const impl = picky(() => true);
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  await assert.rejects(() => llm.chat({ system: "s", user: "u", maxTokens: 100 }), /Reasoning is mandatory/);
});

test("a failure is reported rather than passed on as an empty section", () => {
  assert.throws(() => readAnswer(null), /returned nothing/);
  assert.throws(() => readAnswer({ error: { message: "no model loaded" } }), /no model loaded/);
  assert.throws(
    () => readAnswer({ choices: [{ message: { content: "", reasoning_content: "hmm" } }] }),
    /only reasoned/,
  );
});

test("a good answer comes back stripped of what the model wraps around it", () => {
  assert.strictEqual(readAnswer({ choices: [{ message: { content: "```\nfianza\n```" } }] }), "fianza");
});

/* ---- looking a word up ---- */

test("the search button follows the system's own setting", () => {
  const report = (id) => `NSWebServicesProviderWebSearch = { NSProviderIdentifier = "${id}"; };`;
  assert.strictEqual(searchUrlFor(report("com.duckduckgo")), SEARCH_URLS.duckduckgo);
  /* The identifier is sometimes com.google and sometimes com.google.www. */
  assert.strictEqual(searchUrlFor(report("com.google.www")), SEARCH_URLS.google);
  assert.strictEqual(searchUrlFor(report("com.ecosia")), SEARCH_URLS.ecosia);
  /* No deviating setting and an unknown engine both fall back to the system
     default. */
  assert.strictEqual(searchUrlFor(""), SEARCH_URLS.google);
  assert.strictEqual(searchUrlFor(report("com.something")), SEARCH_URLS.google);
});

test("a chosen search engine wins, and Windows stands in with DuckDuckGo", async () => {
  const { searchUrl } = await import("../../src/platform/env.js");
  assert.strictEqual(await searchUrl("bing"), SEARCH_URLS.bing);
  globalThis.TRIGLOSA_SYSTEM = "windows";
  try {
    assert.strictEqual(await searchUrl("system"), SEARCH_URLS.duckduckgo);
    assert.strictEqual(await searchUrl("ecosia"), SEARCH_URLS.ecosia);
  } finally {
    delete globalThis.TRIGLOSA_SYSTEM;
  }
});

test("the term is escaped into the link", () => {
  assert.strictEqual(
    searchLink(SEARCH_URLS.duckduckgo, "tirar la toalla"),
    "https://duckduckgo.com/?q=tirar%20la%20toalla",
  );
});

/* ---- handing a card to Anki ---- */

const DECK = { deck: "Vokabeln", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "" } };

test("the settings are offered what Anki actually has", async () => {
  const anki = createAnkiBackend(fakeAnki({
    deckNames: ["Default", "Vokabeln"],
    modelNames: ["Basic", "Cloze"],
    modelFieldNames: ["Front", "Back"],
  }));
  assert.deepStrictEqual(await anki.decks(), ["Default", "Vokabeln"]);
  assert.deepStrictEqual(await anki.noteTypes(), ["Basic", "Cloze"]);
  assert.deepStrictEqual(await anki.fieldsOf("Basic"), ["Front", "Back"]);
});

test("a deck's note types are counted over the whole deck, not the sample", async () => {
  /* The types are found in the first hundred notes; how many use each is
     asked of Anki for the whole deck, or a deck of 400 said "(100)". */
  const ids = Array.from({ length: 400 }, (_, i) => i);
  const anki = createAnkiBackend(async (body) => {
    const { action, params } = JSON.parse(body);
    if (action === "findNotes") {
      if (params.query.includes('note:"Basic"')) return JSON.stringify({ result: ids.slice(0, 300) });
      if (params.query.includes('note:"Cloze"')) return JSON.stringify({ result: ids.slice(0, 100) });
      return JSON.stringify({ result: ids });
    }
    if (action === "notesInfo") {
      assert.strictEqual(params.notes.length, 100, "only a sample is read");
      return JSON.stringify({ result: params.notes.map((id) => ({ modelName: id < 70 ? "Basic" : "Cloze" })) });
    }
    return JSON.stringify({ result: null });
  });
  assert.deepStrictEqual(await anki.noteTypesIn("Vokabeln"),
    [{ noteType: "Basic", cards: 300 }, { noteType: "Cloze", cards: 100 }]);
});

/* Anki's own words are kept beside the kind, not thrown away: a card that
   was refused said only "not added" before, and the reason — the note type's
   first field — was in the answer all along. */
test("what came of an attempt, and what Anki said about it", () => {
  assert.deepStrictEqual(readAddResult({ result: 1 }), { kind: "saved", detail: "" });
  assert.strictEqual(
    readAddResult({ error: "cannot create note because it is a duplicate" }).kind, "duplicate");
  assert.strictEqual(
    readAddResult({ error: "cannot create note because it is empty" }).kind, "empty");
  assert.strictEqual(readAddResult({ error: "deck was not found" }).kind, "no-deck");
  assert.strictEqual(readAddResult({ error: "model was not found" }).kind, "no-note-type");

  const odd = readAddResult({ error: "collection is not available" });
  assert.strictEqual(odd.kind, "error");
  assert.strictEqual(odd.detail, "collection is not available", "kept for the sentence");

  /* Neither a result nor an error is an answer this version cannot read, and
     saying nothing about it would claim the card was filed. */
  assert.strictEqual(readAddResult(null).kind, "error");
  assert.strictEqual(readAddResult({ result: null, error: null }).kind, "error");
});

test("nothing is saved when Anki is not running", async () => {
  const anki = createAnkiBackend(async () => { throw new Error("refused"); });
  assert.strictEqual(
    (await anki.add({ term: "x", meaning: "y", note: "" }, DECK)).kind, "unreachable");
});

/* Not the same answer as "not running": nothing was tried, and the reader has
   a question to answer rather than a program to start. */
test("a card goes nowhere while no deck has been chosen", async () => {
  let asked = false;
  const anki = createAnkiBackend(async (...args) => { asked = true; return fakeAnki({})(...args); });
  assert.strictEqual((await anki.add({ term: "x" }, { deck: "", noteType: "" })).kind, "unconfigured");
  assert.strictEqual(asked, false, "Anki is not even asked");
});

test("the note carries the reader's own mapping and nothing else", async () => {
  let sent = null;
  const anki = createAnkiBackend(async (raw) => {
    const asked = JSON.parse(raw);
    if (asked.action === "addNote") sent = asked.params.note;
    return JSON.stringify({ result: 1 });
  });
  const card = { term: "fianza", meaning: "Kaution", note: "El casero\nse negó." };
  await anki.add(card, {
    deck: "Vokabeln",
    noteType: "Eigener Typ",
    fields: { term: "Wort", meaning: "Bedeutung", note: "" },
  });
  assert.strictEqual(sent.deckName, "Vokabeln");
  assert.strictEqual(sent.modelName, "Eigener Typ");
  /* The explanation was mapped to nothing, so it is not written — and no
     field of the note type is invented to hold it. */
  assert.deepStrictEqual(sent.fields, { Wort: "fianza", Bedeutung: "Kaution" });
});

test("markup in a card is escaped and its line breaks survive", async () => {
  let sent = null;
  const anki = createAnkiBackend(async (raw) => {
    const asked = JSON.parse(raw);
    if (asked.action === "addNote") sent = asked.params.note;
    return JSON.stringify({ result: 1 });
  });
  await anki.add({ term: "a<b>", meaning: "x & y", note: "one\ntwo" }, {
    deck: "D", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "Extra" },
  });
  assert.strictEqual(sent.fields.Front, "a&lt;b&gt;");
  assert.strictEqual(sent.fields.Back, "x &amp; y");
  assert.strictEqual(sent.fields.Extra, "one<br>two");
});

/* ---- a cloud endpoint rate-limits, a local one does not ---- */

/* Answers with the given statuses in order, then 200. Records how often it
   was asked. */
function flaky(statuses, header) {
  const calls = [];
  const impl = async (_url, init) => {
    calls.push(init);
    const status = statuses[calls.length - 1];
    if (!status) {
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "fine" } }] }) };
    }
    return {
      ok: false,
      status,
      statusText: "nope",
      headers: { get: () => header || "" },
    };
  };
  impl.calls = calls;
  return impl;
}

test("too many requests is waited out, not handed to the reader", async () => {
  const impl = flaky([429]);
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  assert.strictEqual(await llm.chat({ system: "s", user: "u" }), "fine");
  assert.strictEqual(impl.calls.length, 2, "asked again once");
});

test("a wrong key is answered at once — asking again gives the same answer", async () => {
  const impl = flaky([401, 401, 401]);
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  await assert.rejects(() => llm.chat({ system: "s", user: "u" }), /401/);
  assert.strictEqual(impl.calls.length, 1, "not asked twice");
});

test("a server that keeps refusing is given up on rather than hung on", async () => {
  const impl = flaky([503, 503, 503, 503]);
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, impl);
  await assert.rejects(() => llm.chat({ system: "s", user: "u" }), /503/);
  assert.strictEqual(impl.calls.length, RETRIES + 1);
});

test("a server that says how long to wait is believed, within reason", () => {
  assert.strictEqual(retryDelay("", 0), 1200, "no header means the plain backoff");
  assert.strictEqual(retryDelay("3", 0), 3000);
  assert.strictEqual(retryDelay("1", 0), 1200, "never shorter than the backoff");
  assert.strictEqual(retryDelay("99999", 0), 1200, "longer than the timeout is not a wait");
  assert.strictEqual(retryDelay("not a number", 1), 2400);
});

/* ---- what the device can translate ---- */

test("the device's three answers are kept apart", () => {
  /* Installed and installable are not the same thing, and the difference is
     the only one the reader can act on. */
  assert.strictEqual(readPairStatus("pl installed"), PAIR_INSTALLED);
  assert.strictEqual(readPairStatus("pl supported"), PAIR_DOWNLOADABLE);
  assert.strictEqual(readPairStatus("pl unsupported"), PAIR_UNSUPPORTED);
});

test("anything unexpected from the device means nothing is known", () => {
  /* Claiming a pair works and then silently falling back is bad; claiming
     it can never work is worse, because there is nothing to be done about
     it. An answer this version cannot read says neither. */
  assert.strictEqual(readPairStatus(""), "");
  assert.strictEqual(readPairStatus("pl nonsense"), "");
});

test("only an installed pair is one the run may use", async () => {
  const answers = { "de>es": "es installed", "de>pl": "es supported" };
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async (url) => {
    if (String(url).endsWith("/ping")) return new Response("ok");
    const match = String(url).match(/from=(\w+)&to=(\w+)/);
    return new Response(answers[`${match[1]}>${match[2]}`] || "x unsupported");
  });
  assert.strictEqual(await backend.canTranslate("de", "es"), true);
  assert.strictEqual(await backend.canTranslate("de", "pl"), false, "installable is not installed");
  assert.strictEqual(await backend.pairStatus("de", "pl"), PAIR_DOWNLOADABLE);
});

test("without the helper nothing is known about a pair, which is not the same as no", async () => {
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async () => {
    throw new Error("nothing there");
  });
  assert.strictEqual(await backend.pairStatus("de", "es"), "");
});

test("a question that ran out of time knows nothing either", async () => {
  /* The helper answers one client at a time, so this question can have been
     standing behind a long translation when the probe ran out. Reading that
     as "the device cannot do this pair" is the confident wrong answer, and it
     reached a reader once as exactly that sentence. */
  let asked = 0;
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async (url) => {
    if (String(url).endsWith("/ping")) return new Response("ok 2");
    asked++;
    throw new Error("timed out");
  });
  assert.strictEqual(await backend.pairStatus("de", "es"), "");
  assert.strictEqual(await backend.canTranslate("de", "es"), false);
  assert.strictEqual(asked, 1, "and the answer is kept, however empty");
});

test("every direction the panels could need is asked about", () => {
  /* Any configured language may be the one a text arrives in, so the pairs
     go both ways. */
  assert.strictEqual(neededPairs(["de", "es"]).length, 2);
  assert.strictEqual(neededPairs(["de", "en", "es"]).length, 6);
  assert.ok(!neededPairs(["de", "es"]).some((p) => p.from === p.to));
});

/* The warm-up. Opening a pair costs the reading 280 ms it should not be
   paying, so the pairs are used once before anybody asks for anything. */
function warmingBackend(installed) {
  const asked = { available: [], translated: [] };
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async (url, options) => {
    const address = String(url);
    if (address.endsWith("/ping")) return new Response("ok 2");
    const [, from, to] = address.match(/from=(\w+)&to=(\w+)/);
    if (address.includes("/available")) {
      asked.available.push(`${from}>${to}`);
      return new Response(installed.includes(`${from}>${to}`) ? "x installed" : "x unsupported");
    }
    asked.translated.push({ pair: `${from}>${to}`, body: options?.body });
    return new Response("·");
  });
  return { backend, asked };
}

test("the pairs of the reader's own languages are opened before a reading needs them", async () => {
  const { backend, asked } = warmingBackend(["de>es", "es>de"]);
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"])), 2);
  assert.deepStrictEqual(asked.translated.map((t) => t.pair), ["de>es", "es>de"]);
  /* Anything opens a pair — measured, a full stop as well as a word — so it
     is a full stop: a word would have to be a word of some language. */
  assert.ok(asked.translated.every((t) => t.body === "."));
});

test("a pair the device does not have is not warmed", async () => {
  /* Opening a session for it would be asking for one that cannot exist. */
  const { backend, asked } = warmingBackend(["de>es"]);
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"])), 1);
  assert.deepStrictEqual(asked.translated.map((t) => t.pair), ["de>es"]);
});

test("showing the window three times in a minute warms once", async () => {
  /* The helper closes down after five minutes idle and takes its open pairs
     with it, so coming back later is worth a fresh warm. Coming back at once
     is not. */
  const { backend } = warmingBackend(["de>es", "es>de"]);
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"]), 1000), 2);
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"]), 20000), 0);
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"]), 1000 + 240001), 2);
});

test("without a helper there is nothing to warm", async () => {
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async () => {
    throw new Error("nothing there");
  });
  assert.strictEqual(await backend.warm(neededPairs(["de", "es"])), 0);
});

test("a helper from an older build is recognised as one", () => {
  /* It keeps the port and goes on answering, so the window has to be able
     to tell. The first version said only "ok". */
  assert.strictEqual(readProtocol("ok 2"), 2);
  assert.strictEqual(readProtocol("ok"), 1, "the version that had no version");
  assert.strictEqual(readProtocol("something else"), 0);
});

test("an answer this version does not know means nothing is known", () => {
  /* The older helper answered "pl yes". Reading that as "unsupported" put
     "the device cannot do German to English" in front of a reader once. */
  assert.strictEqual(readPairStatus("pl yes"), "");
  assert.strictEqual(readPairStatus(""), "");
});

test("a helper is retired only when it speaks another protocol", async () => {
  const asked = [];
  const backend = createTranslationBackend({ helperUrl: "http://h" }, async (url) => {
    asked.push(String(url));
    return new Response(String(url).endsWith("/ping") ? "ok 1" : "bye");
  });
  await backend.running();
  assert.strictEqual(backend.current(), false, "protocol 1 is not this one");
  await backend.retire();
  assert.ok(asked.some((url) => url.endsWith("/quit")));
});

/* Everything that reaches into another program goes through one seam, and
   outside the app there is nothing on the other side of it. That is not a
   corner case: it is how the display gets checked in a browser, and a call
   that reached for the shell there would throw where the window expects an
   answer. */
test("outside the app the capture seam answers instead of reaching for the shell", async () => {
  assert.strictEqual(await accessibilityGranted(), false);
  assert.strictEqual(await requestAccessibility(), false);
  assert.strictEqual(await openAccessibilitySettings(), false);
  /* Both are absent rather than wrong: the recorder then names the place on
     the keyboard instead of what is printed on it, and refuses nothing. */
  assert.strictEqual(await keyLabels(), null);
  assert.deepStrictEqual(await takenShortcuts(), []);
});

test("outside the app the window seam answers instead of reaching for the shell", async () => {
  /* The settings are a second window in the app and a page of their own
     outside it, so this one answering false is what tells app.js to go to
     that page rather than to wait for a window that will never open. */
  assert.strictEqual(await hideWindow(), false);
  assert.strictEqual(await showWindow(), false);
  assert.strictEqual(await openSettings("Settings"), false);
  assert.strictEqual(await applyTray({ show: "show", settings: "settings", quit: "quit" }, { capture: "Control+Alt+e" }), false);
  assert.strictEqual(await settingsChanged(), false);
  const stop = await onSettingsChanged(() => {});
  assert.strictEqual(typeof stop, "function");
  stop();
});

test("reading and replacing refuse with the same word the shell would use", async () => {
  /* The window turns these words into sentences in the reader's own
     language, so they have to be the words and not descriptions of them. */
  await assert.rejects(readSelection(), /accessibility/);
  await assert.rejects(insertText(0, "text"), /accessibility/);
});

test("a shortcut is not registered outside the app, and says nothing went wrong", async () => {
  /* "" means it worked. Outside the app there is nothing to hold, and
     reporting a failure here would put an error in a window that is only
     being looked at. */
  assert.strictEqual(await registerShortcuts({ hotkey: { accelerator: "Control+Alt+KeyD" }, cardHotkey: null }), "");
  assert.strictEqual(await registerShortcuts({}), "");
  const stop = await onCapture({ onText() {}, onFailed() {} });
  assert.strictEqual(typeof stop, "function");
  stop();
  const stopCard = await onCardCapture({ onText() {}, onFailed() {}, onBlank() {} });
  assert.strictEqual(typeof stopCard, "function");
  stopCard();
});

/* AnkiConnect always answers something. An empty reply is a helper that went
   away mid-question, and reading it as JSON would throw where the caller
   expects a state it can report. */
test("an empty reply from Anki is not an answer", async () => {
  const anki = createAnkiBackend(async () => "");
  assert.strictEqual(await anki.answering(), false);
  assert.deepStrictEqual(await anki.decks(), []);
});

/* ---- the card window laid against what is in it ---- */

/* It holds a short form, and a fixed height left a hand's width of nothing
   under the buttons — most of it kept clear for a line that is only there
   when something went wrong. */
test("a new card fits the window either way, a changed one only grows it", () => {
  /* A new card: the height the last one needed says nothing about this one. */
  assert.strictEqual(fitTo(300, 500, false), 300, "shrinks to the content");
  assert.strictEqual(fitTo(600, 500, false), 600);

  /* A card already on screen: a field being typed into, or a refusal
     arriving. Taking height away from somebody who has just dragged the
     corner is answering a question they did not ask. */
  assert.strictEqual(fitTo(300, 500, true), null, "leaves it alone");
  assert.strictEqual(fitTo(600, 500, true), 600);
});

/* Acting on the measurement's own noise would make the window twitch on
   every keystroke in a field that grows with what is typed. */
test("a pixel or two is not a resize", () => {
  assert.strictEqual(fitTo(501, 500, true), null);
  assert.strictEqual(fitTo(502, 500, false), null);
  assert.strictEqual(fitTo(498, 500, false), null);
  assert.strictEqual(fitTo(503, 500, true), 503);
});

test("the Mac's language list is read the way defaults prints it", () => {
  /* A tag with a hyphen comes quoted, a bare code does not. */
  const report = '(\n    "de-DE",\n    en,\n    "fr-CA"\n)\n';
  assert.deepStrictEqual(languagesFromReport(report), ["de-DE", "en", "fr-CA"]);
  assert.deepStrictEqual(languagesFromReport(""), []);
});

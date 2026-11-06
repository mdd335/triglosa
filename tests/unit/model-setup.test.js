/* The two ways to an AI model at the head of the settings' model group. */

import test from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><div id=\"app\"></div>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
globalThis.fetch = async () => { throw new TypeError("fetch failed"); };

const { helpPrompt, modelSetup } = await import("../../src/ui/model-setup.js");
const { MODEL_HELP_URL } = await import("../../src/updates.js");
const { LOCAL_SERVERS, ONLINE, keyAccount, setupOf } = await import("../../src/setup.js");
const { normalizeSettings } = await import("../../src/settings.js");
const { labels } = await import("../../src/ui/labels.js");

test("which way the settings stand for is read from the address", () => {
  assert.strictEqual(setupOf({ endpoint: "" }), "");
  assert.strictEqual(setupOf({ endpoint: ONLINE.endpoint }), "online");
  assert.strictEqual(setupOf({ endpoint: "https://openrouter.ai/api/v1/" }), "online");
  assert.strictEqual(setupOf({ endpoint: "http://127.0.0.1:1234/v1" }), "own");
  assert.strictEqual(setupOf({ endpoint: "http://127.0.0.1:11434/v1" }), "own");
  assert.strictEqual(setupOf({ endpoint: "https://api.mistral.ai/v1" }), "own");
});

test("a settings file from before the ways takes the way its address names", () => {
  const old = normalizeSettings({ endpoint: ONLINE.endpoint, model: "openai/gpt-6-luna" });
  assert.strictEqual(old.way, "online");
  assert.deepStrictEqual(old.ways, { online: { endpoint: ONLINE.endpoint, model: "openai/gpt-6-luna" } });
  assert.strictEqual(normalizeSettings({}).way, "", "nothing set, no way");
  const kept = normalizeSettings({ way: "own", endpoint: ONLINE.endpoint, model: "x",
    ways: { online: { endpoint: ONLINE.endpoint, model: ONLINE.model }, nonsense: { endpoint: "y" } } });
  assert.strictEqual(kept.way, "own", "a way chosen stays chosen, whatever its address");
  assert.deepStrictEqual(Object.keys(kept.ways).sort(), ["online", "own"]);
  const local = normalizeSettings({ way: "local", endpoint: "http://127.0.0.1:1234/v1", model: "m" });
  assert.strictEqual(local.way, "own", "a way that is gone is entered by hand, its address kept");
  assert.strictEqual(local.endpoint, "http://127.0.0.1:1234/v1");
});

test("Online's address is OpenRouter's, whatever the file holds", () => {
  const chosen = normalizeSettings({ way: "online", endpoint: "https://openrouter.ai/api/v", model: "m" });
  assert.strictEqual(chosen.endpoint, ONLINE.endpoint);
  assert.strictEqual(chosen.ways.online.endpoint, ONLINE.endpoint);
  const put = normalizeSettings({ way: "own", endpoint: "https://api.mistral.ai/v1", model: "x",
    ways: { online: { endpoint: "https://example.org/v1", model: ONLINE.model } } });
  assert.strictEqual(put.ways.online.endpoint, ONLINE.endpoint, "also while another way is in use");
  assert.strictEqual(put.endpoint, "https://api.mistral.ai/v1", "the reader's own stays theirs");
});

test("a key belongs to its way", () => {
  assert.strictEqual(keyAccount({ way: "online" }), "model-online");
  assert.strictEqual(keyAccount({ way: "own" }), "model-own");
  assert.strictEqual(keyAccount({ way: "", endpoint: "https://api.mistral.ai/v1" }), "model-own");
  assert.strictEqual(keyAccount({ way: "", endpoint: "" }), "model-own");
});

test("forgetting one way's key leaves the other's, and the key from before goes to the first way that asks", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => store.set(name, String(value)),
    removeItem: (name) => store.delete(name),
  };
  try {
    const { loadApiKey, saveApiKey } = await import("../../src/platform/keychain.js");
    store.set("triglosa.model-endpoint", "sk-or-before");
    assert.strictEqual(await loadApiKey({ way: "online" }), "sk-or-before");
    assert.strictEqual(store.get("triglosa.model-endpoint"), undefined, "moved, not copied");
    await saveApiKey("sk-mistral", { way: "own" });
    await saveApiKey("", { way: "own" });
    assert.strictEqual(await loadApiKey({ way: "online" }), "sk-or-before", "the other way's key stays");
    assert.strictEqual(await loadApiKey({ way: "own" }), "");
  } finally {
    delete globalThis.localStorage;
  }
});

async function draw(code, stored, { system = "mac", hasKey = false } = {}) {
  const text = labels(code, system);
  const changes = [];
  const settings = normalizeSettings({ languages: [code, "es"], ...stored });
  const view = modelSetup({
    text, settings, hasKey, onChange: (next) => changes.push(next),
    link: (word) => Object.assign(document.createElement("a"), { className: "text-link", textContent: word }),
  });
  document.body.replaceChildren(view);
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { view, text, changes };
}

const cards = (view) => [...view.querySelectorAll(".setup-choice")];

for (const code of ["de", "en"]) {
  test(`two ways in a row; online fills in OpenRouter and the recommended model, with its steps (${code})`, async () => {
    const { view, text, changes } = await draw(code, { endpoint: "" });
    assert.deepStrictEqual(cards(view).map((node) => node.querySelector("b").textContent),
      [text.setupOnline, text.setupOwn]);
    assert.ok(!view.classList.contains("field"), "outside the boxes: it fills in every field under it");
    assert.ok(!cards(view)[0].textContent.includes(ONLINE.title), "the model is named under the row, not in it");
    assert.deepStrictEqual(cards(view).map((node) => node.textContent), [text.setupOnline, text.setupOwn], "the names alone");
    assert.strictEqual(view.querySelector(".setup-choice[aria-pressed=true]"), null, "nothing chosen before anything is set");
    assert.strictEqual(view.querySelector(".setup-steps"), null, "and no steps either");
    cards(view)[0].click();
    assert.deepStrictEqual({ endpoint: changes.at(-1).endpoint, model: changes.at(-1).model },
      { endpoint: ONLINE.endpoint, model: ONLINE.model });
    const again = await draw(code, changes.at(-1));
    assert.strictEqual(cards(again.view)[0].getAttribute("aria-pressed"), "true");
    assert.strictEqual(again.view.querySelector(".setup-line").textContent, text.setupOnlineLine);
    const steps = [...again.view.querySelectorAll(".setup-steps li")];
    assert.strictEqual(steps.length, 4);
    assert.ok(steps[3].textContent.includes("Zero Data Retention"), "the optional step last among the steps");
    const recommended = again.view.querySelector(".setup-steps ol + p");
    assert.strictEqual(recommended?.textContent, text.setupRecommended(ONLINE.title, true), "the model under the steps");
    assert.ok(!again.view.querySelector(".setup-steps").contains(again.view.querySelector(".setup-line")),
      "what the way is good and bad at stands outside the fold");
    assert.strictEqual(again.view.querySelector(".setup-steps").tagName, "DETAILS");
    assert.ok(again.view.querySelector(".setup-steps").open, "open while no key is stored");
    assert.ok(again.view.querySelector(".hint").textContent.endsWith(text.setupChatbot), "the chatbot after the README");
  });

  test(`online offers the free model to try, and the recommended one back (${code})`, async () => {
    let { view, text, changes } = await draw(code, { way: "online", endpoint: ONLINE.endpoint, model: ONLINE.model });
    const button = () => view.querySelector(".setup-free button");
    assert.ok(view.querySelector(".setup-free").textContent.includes(text.setupOnlineFree(ONLINE.free.title)));
    assert.strictEqual(button().textContent, text.setupOnlineFreeTake);
    button().click();
    assert.strictEqual(changes.at(-1).model, ONLINE.free.model);
    ({ view, text, changes } = await draw(code, changes.at(-1)));
    assert.strictEqual(button().textContent, text.setupOnlinePaidTake);
    assert.ok(view.querySelector(".setup-steps").textContent.includes(text.setupRecommended(ONLINE.title, false)),
      "not said to be filled in while another stands there");
    button().click();
    assert.strictEqual(changes.at(-1).model, ONLINE.model);
  });

  test(`the guide stands open, a key stored or not, until the reader folds it away (${code})`, async () => {
    const online = { way: "online", endpoint: ONLINE.endpoint, model: ONLINE.model };
    const { view, changes } = await draw(code, online);
    const fold = view.querySelector(".setup-steps");
    assert.ok(fold.open);
    fold.dispatchEvent(new window.Event("toggle"));
    assert.strictEqual(changes.length, 0, "the page's own opening is no choice of the reader's");
    fold.open = false;
    fold.dispatchEvent(new window.Event("toggle"));
    assert.strictEqual(changes.at(-1).guideFolded, true);
    const folded = await draw(code, { ...online, guideFolded: true });
    assert.ok(!folded.view.querySelector(".setup-steps").open, "drawn anew, it stays folded");
    const keyed = await draw(code, online, { hasKey: true });
    assert.ok(keyed.view.querySelector(".setup-steps").open, "a key stored changes nothing");
  });

  test(`entering it yourself changes nothing in the fields (${code})`, async () => {
    const { view, changes } = await draw(code, { endpoint: "https://api.mistral.ai/v1", model: "mistral-small" });
    assert.ok(cards(view)[1].getAttribute("aria-pressed") === "true");
    assert.strictEqual(view.querySelector(".setup-below").textContent, "", "nothing to say: the fields say it");
    cards(view)[1].click();
    assert.strictEqual(changes.length, 0);
  });

  test(`each way keeps its own address and model, and brings them back (${code})`, async () => {
    /* OpenRouter with a model of the reader's choosing. */
    const start = { way: "online", endpoint: ONLINE.endpoint, model: "openai/gpt-6-luna" };
    let { view, changes } = await draw(code, start);
    cards(view)[1].click();
    let next = changes.at(-1);
    assert.deepStrictEqual({ way: next.way, endpoint: next.endpoint, model: next.model },
      { way: "own", endpoint: "", model: "" }, "any provider starts from empty fields");
    assert.deepStrictEqual(next.ways.online, { endpoint: ONLINE.endpoint, model: "openai/gpt-6-luna" });

    next = normalizeSettings({ ...next, endpoint: "https://api.mistral.ai/v1", model: "mistral-small" });
    ({ view, changes } = await draw(code, next));
    cards(view)[0].click();
    assert.strictEqual(changes.at(-1).model, "openai/gpt-6-luna", "the reader's model back, not the preset");
    ({ view, changes } = await draw(code, changes.at(-1)));
    cards(view)[1].click();
    assert.strictEqual(changes.at(-1).endpoint, "https://api.mistral.ai/v1");
  });
}

/* The prompt a reader sends a chatbot of their own when stuck: copied, never
   shown, and holding only what is true for every reader of the system. */
for (const code of ["de", "en", "es", "fr", "it", "pt", "ru"]) {
  test(`the help prompt names the fields as the window does and nothing that is set (${code})`, async () => {
    const { view, text } = await draw(code, { way: "own", endpoint: "https://secret.example/v1", model: "my-model" });
    const copy = view.querySelector(".setup-prompt button");
    assert.strictEqual(copy.textContent, text.setupPromptCopy);
    assert.ok(!view.textContent.includes(MODEL_HELP_URL), "not shown");
    const prompt = await helpPrompt(text);
    for (const name of [text.groupModel, text.setupOnline, text.setupOwn, text.endpoint, text.model, text.apiKey, text.testConnection]) {
      assert.ok(prompt.includes(name), `${code}: ${name}`);
    }
    assert.ok(prompt.includes(MODEL_HELP_URL) && prompt.includes("macOS"));
    assert.ok(prompt.includes("Gemma 4 E4B") && prompt.includes("16"), "what a local model needs, for the chatbot to judge the computer");
    assert.ok(prompt.includes("Triglosa") && !/Triglosa {2}/.test(prompt), "no version outside the app, and no gap for it");
    for (const { endpoint } of LOCAL_SERVERS) assert.ok(prompt.includes(endpoint), "a computer's local servers");
    assert.ok(!prompt.includes("secret.example") && !prompt.includes("my-model"), "nothing from the settings");
    assert.doesNotMatch(prompt, /\$\{|undefined/);
    globalThis.TRIGLOSA_SYSTEM = "ios";
    try {
      const phone = await helpPrompt(labels(code, "ios"));
      assert.ok(phone.includes("iOS") && !phone.includes("127.0.0.1"), "a phone runs no server");
      assert.ok(!phone.includes("Gemma") && !phone.includes("LM Studio"), "nor is cloud against local weighed there");
      assert.match(phone, /^[^\n]+\n\n[^\n]+\n\n\S/, "no empty paragraph where it would stand");
    } finally {
      delete globalThis.TRIGLOSA_SYSTEM;
    }
  });
}

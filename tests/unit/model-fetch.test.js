import test from "node:test";
import assert from "node:assert";
import { shellFetch } from "../../src/platform/model-fetch.js";
import { createLlmBackend } from "../../src/platform/llm.js";

const answering = (answer, seen = []) => async (command, args) => {
  seen.push({ command, args });
  if (answer instanceof Error || typeof answer === "string") throw answer;
  return answer;
};

test("a question goes to the shell with its address, method, headers and body", async () => {
  const seen = [];
  const fetch = shellFetch(answering({ status: 200, statusText: "OK", retryAfter: null, body: "{}" }, seen));
  await fetch("https://api.example.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer k" },
    body: "{\"a\":1}",
  });
  assert.strictEqual(seen[0].command, "model_request");
  assert.deepStrictEqual(seen[0].args.request, {
    url: "https://api.example.com/v1/chat/completions",
    method: "POST",
    headers: [["Content-Type", "application/json"], ["Authorization", "Bearer k"]],
    body: "{\"a\":1}",
  });
});

test("the shell's answer reads like a fetch response", async () => {
  const fetch = shellFetch(answering({ status: 429, statusText: "Too Many Requests", retryAfter: "3", body: "slow down" }));
  const response = await fetch("https://api.example.com/v1/models", { method: "GET" });
  assert.strictEqual(response.ok, false);
  assert.strictEqual(response.status, 429);
  assert.strictEqual(response.statusText, "Too Many Requests");
  assert.strictEqual(response.headers.get("Retry-After"), "3");
  assert.strictEqual(response.headers.get("content-type"), null);
  assert.strictEqual(await response.text(), "slow down");
});

test("a request with no body sends none", async () => {
  const seen = [];
  await shellFetch(answering({ status: 200, statusText: "OK", body: "{}" }, seen))("http://127.0.0.1:1234/v1/models");
  assert.strictEqual(seen[0].args.request.body, null);
  assert.strictEqual(seen[0].args.request.method, "GET");
});

test("a shell timeout is a timeout, anything else is unreachable", async () => {
  const late = shellFetch(answering("timed out: operation timed out"));
  await assert.rejects(late("https://a.example/v1/models"), (error) => error.name === "TimeoutError");
  const gone = shellFetch(answering("unreachable: connection refused"));
  await assert.rejects(gone("https://a.example/v1/models"), (error) =>
    error.name !== "TimeoutError" && /connection refused/.test(error.message));
});

test("plain http outside the own network is said as unencrypted, not as absent", async () => {
  const plain = shellFetch(answering("insecure: http://example.com/v1 is plain http outside the own network"));
  await assert.rejects(plain("http://example.com/v1/models"), (error) =>
    error.name === "InsecureAddressError" && !/^insecure:/.test(error.message));
});

test("the window's own deadline still holds", async () => {
  const never = shellFetch(() => new Promise(() => {}));
  await assert.rejects(
    never("https://a.example/v1/models", { signal: AbortSignal.timeout(20) }),
    (error) => error.name === "TimeoutError",
  );
});

test("the model backend classifies the shell's answers as it does fetch's", async () => {
  const refusing = createLlmBackend(
    { endpoint: "https://a.example/v1", apiKey: "k", model: "m" },
    shellFetch(answering({ status: 401, statusText: "Unauthorized", body: "{\"error\":{\"message\":\"bad key\"}}" })),
  );
  await assert.rejects(refusing.chat({ system: "s", user: "u", maxTokens: 5 }), (error) =>
    error.status === 401 && error.fault.kind === "key");

  const unreachable = createLlmBackend(
    { endpoint: "https://a.example/v1", apiKey: "k", model: "m" },
    shellFetch(answering("unreachable: dns error")),
  );
  await assert.rejects(unreachable.chat({ system: "s", user: "u", maxTokens: 5 }), (error) =>
    error.fault.kind === "unreachable");

  const answered = createLlmBackend(
    { endpoint: "https://a.example/v1", apiKey: "k", model: "m" },
    shellFetch(answering({
      status: 200,
      statusText: "OK",
      body: JSON.stringify({ choices: [{ message: { content: "hallo" } }] }),
    })),
  );
  assert.strictEqual(await answered.chat({ system: "s", user: "u", maxTokens: 5 }), "hallo");
});

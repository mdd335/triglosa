import test from "node:test";
import assert from "node:assert";
import { faultForStatus, faultForThrow, faultOf } from "../../src/faults.js";
import { faultText, labels } from "../../src/ui/labels.js";
import { createLlmBackend } from "../../src/platform/llm.js";

/* ---- which kind of failure it was ---- */

test("the numbers that mean different things to the reader are kept apart", () => {
  /* Every one of these is a different thing to do about it, which is the only
     reason to tell two failures apart. */
  assert.strictEqual(faultForStatus(401).kind, "key");
  assert.strictEqual(faultForStatus(403).kind, "key");
  assert.strictEqual(faultForStatus(404).kind, "notFound");
  assert.strictEqual(faultForStatus(400).kind, "refused");
  assert.strictEqual(faultForStatus(429).kind, "busy");
  assert.strictEqual(faultForStatus(503).kind, "server");
  assert.strictEqual(faultForStatus(418).kind, "status");
});

test("what the service said travels with the number", () => {
  const found = faultForStatus(400, "model not found");
  assert.strictEqual(found.status, 400);
  assert.strictEqual(found.detail, "model not found");
});

test("nothing reached is not the same as nothing in time", () => {
  const timeout = new Error("The operation timed out");
  timeout.name = "TimeoutError";
  assert.strictEqual(faultForThrow(timeout).kind, "timeout");
  assert.strictEqual(faultForThrow(new TypeError("Failed to fetch")).kind, "unreachable");
});

test("an error from nowhere in particular keeps its own words", () => {
  /* A sentence nobody wrote is worse than an English one somebody did. */
  const found = faultOf(new Error("something odd"));
  assert.strictEqual(found.kind, "unknown");
  assert.strictEqual(found.detail, "something odd");
});

/* ---- and what the window says about it ---- */

test("every kind has a sentence in both languages", () => {
  for (const code of ["de", "en"]) {
    for (const kind of Object.keys(labels(code).faults)) {
      const said = faultText(code, { kind, status: 500, model: "a-model", detail: "" });
      assert.ok(said.length > 10, `${code}/${kind}: ${said}`);
      /* No error code on its own, and no English left in the German one. */
      assert.ok(!/^[0-9]+$/.test(said.trim()), `${code}/${kind}`);
    }
  }
});

test("the sentence says what to do, not only what happened", () => {
  const said = faultText("de", { kind: "key", status: 401 });
  assert.match(said, /401/);
  assert.match(said, /Schlüssel/);
  assert.match(said, /Einstellungen|Cloud|Rechner/);
});

test("the service's own words follow the sentence where they explain something", () => {
  /* For a refusal they are often the whole of it — and for "nothing answered"
     they are "Failed to fetch", which explains nothing. */
  assert.match(
    faultText("de", { kind: "refused", status: 400, detail: "model not found" }),
    /\(400: model not found\)\. Bitte/,
  );
  assert.ok(!faultText("de", { kind: "unreachable", detail: "Failed to fetch" }).includes("fetch"));
});

test("a kind nobody wrote a sentence for still says something", () => {
  assert.strictEqual(faultText("de", { kind: "not-a-kind", detail: "boom" }), "boom");
  assert.ok(faultText("de", null).length > 5);
});

/* ---- and the seam that produces them ---- */

test("an endpoint's refusal arrives as a fault, not only as a number", async () => {
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, async () =>
    new Response(JSON.stringify({ error: { message: "model not found" } }), { status: 404 }));
  await assert.rejects(
    () => llm.chat({ system: "s", user: "u", maxTokens: 10 }),
    (error) => {
      assert.strictEqual(error.fault.kind, "notFound");
      assert.strictEqual(error.fault.detail, "model not found");
      return true;
    },
  );
});

test("an address that answers nothing arrives as one too", async () => {
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "m" }, async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    () => llm.chat({ system: "s", user: "u", maxTokens: 10 }),
    (error) => {
      assert.strictEqual(error.fault.kind, "unreachable");
      return true;
    },
  );
});

test("a model that will not stop thinking says so by name", async () => {
  const llm = createLlmBackend({ endpoint: "http://x/v1", model: "glm-5" }, async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "", reasoning: "thinking about it" } }],
      }),
      { status: 200 },
    ));
  await assert.rejects(
    () => llm.chat({ system: "s", user: "u", maxTokens: 10 }),
    (error) => {
      assert.strictEqual(error.fault.kind, "thinking");
      assert.strictEqual(error.fault.model, "glm-5");
      assert.match(faultText("de", error.fault), /^glm-5/);
      return true;
    },
  );
});

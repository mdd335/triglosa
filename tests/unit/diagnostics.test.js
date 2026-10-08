import test from "node:test";
import assert from "node:assert/strict";
import { diagnosticsText, faultLine } from "../../src/diagnostics.js";

const SETTINGS = {
  languages: ["de", "en", "es"],
  levels: { en: "C1", es: "B1" },
  translator: "model",
  endpoint: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-v4.1-flash",
  directSelection: true,
  glance: true,
};

test("a problem report says what the installation is, in English, and nothing of the key or what was read", () => {
  const text = diagnosticsText({
    version: "0.4.3",
    report: { system: "macOS 26.1", arch: "aarch64", faults: ["2026-09-24T01:00:00Z busy 429"] },
    settings: SETTINGS,
    keySet: true,
    permission: true,
    system: "mac",
  });
  assert.match(text, /^Triglosa 0\.4\.3/);
  assert.match(text, /macOS 26\.1 \(aarch64\)/);
  assert.match(text, /Languages: de, en \(C1\), es \(B1\)/);
  assert.match(text, /AI model: openrouter\.ai, deepseek\/deepseek-v4\.1-flash, key set/);
  assert.match(text, /busy 429/);
  assert.doesNotMatch(text, /api\/v1/, "the address's path is not needed and not given");
});

test("an endpoint that is no address and a missing model are said as such", () => {
  const text = diagnosticsText({
    version: "0.4.3",
    report: { system: "Windows 11", arch: "x86_64", faults: [] },
    settings: { ...SETTINGS, endpoint: "", model: "" },
    keySet: false,
    permission: false,
    system: "windows",
  });
  assert.match(text, /AI model: none/);
  assert.match(text, /Recent failures: none/);
  assert.doesNotMatch(text, /Accessibility/, "Windows has no such permission");
});

test("a failure is one line: when, what kind, the number, what the service said", () => {
  const line = faultLine({ kind: "refused", status: 400, detail: "model not found" }, new Date("2026-09-24T01:00:00Z"));
  assert.equal(line, "2026-09-24T01:00:00.000Z refused 400 model not found");
});

import test from "node:test";
import assert from "node:assert/strict";
import { slug, anchorsOf, linksOf } from "../../scripts/check.mjs";

test("a heading's anchor is written the way GitHub writes it", () => {
  assert.equal(slug("Connecting an AI model"), "connecting-an-ai-model");
  assert.equal(slug('"Apple could not verify Triglosa"'), "apple-could-not-verify-triglosa");
  assert.equal(slug("Which model should I choose?"), "which-model-should-i-choose");
});

test("headings inside a code fence are not headings", () => {
  const anchors = anchorsOf("# Title\n```bash\n# a comment\n```\n## Next one\n");
  assert.deepEqual([...anchors], ["title", "next-one"]);
});

test("links are read outside code only", () => {
  const text = "See [a](a.md) and [b](guide/b.md#part).\n`[c](c.md)`\n```\n[d](d.md)\n```\n[e](https://x.org)";
  assert.deepEqual(linksOf(text), ["a.md", "guide/b.md#part", "https://x.org"]);
});

test("a file, a folder, a command or a script the developer page does not name is found", async () => {
  const { missingFromDevelopment } = await import("../../scripts/check.mjs");
  const page = "run.js ask.js languages/ npm run app llm.js lib.rs shot.mjs";
  const missing = missingFromDevelopment(page, {
    src: ["run.js", "ask.js", "detect.js"],
    dirs: ["languages", "parse"],
    platform: ["llm.js"],
    ui: [],
    shell: ["lib.rs", "update.rs"],
    npmScripts: ["app", "bundle"],
    scripts: ["shot.mjs", "updater.mjs"],
  });
  assert.deepEqual(missing, ["detect.js", "parse/", "update.rs", "npm run bundle", "updater.mjs"]);
});

test("a question to the model the page on a translation does not list is found", async () => {
  const { staleRequests } = await import("../../scripts/check.mjs");
  const page = "| Q1 | the language |\n| Q2 | the translation |\n| Q3 | gone since |\n";
  const requests = { detectPrompt: "Q1", translatePrompt: "Q2", wordsPrompt: "Q4", headwordPrompt: "" };
  const stale = staleRequests(page, ["detectPrompt", "translatePrompt", "wordsPrompt", "headwordPrompt", "newPrompt"], requests);
  assert.equal(stale.length, 3);
  assert.match(stale[0], /newPrompt/);
  assert.match(stale[1], /Q4.*wordsPrompt/);
  assert.match(stale[2], /Q3/);
  assert.deepEqual(staleRequests("| Q1 | x |\n| Q2 | y |\n", ["detectPrompt", "translatePrompt", "headwordPrompt"], requests), []);
});

test("every prompt has its place on the page on a translation", async () => {
  const { staleRequests, promptNames } = await import("../../scripts/check.mjs");
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../../docs/behind-a-translation.md", import.meta.url), "utf8");
  assert.deepEqual(staleRequests(page, promptNames()), []);
});

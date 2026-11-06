/* The first steps' example, aligned by the app's own word aligner: its
   hover is the aligner's, as in a reading, not an answer written by hand.

   For every interface language the example's original, the reader's
   translation and the other one go through the shell's aligner (its
   ignored test `the_pairs_are_aligned`, which wants the model's files in
   src-tauri/resources/aligner — any build fetches them), and the links are
   written to src/ui/example-links.js together with the texts they belong
   to. A test holds the file against the label files: change an example's
   text and this has to run again.

     node scripts/example-links.mjs */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { INTERFACE_LANGUAGES, labels } from "../src/ui/labels.js";
import { toTokens } from "../src/text.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const aligner = path.join(root, "src-tauri", "resources", "aligner");
if (!fs.existsSync(path.join(aligner, "model.onnx"))) {
  console.error("The aligner's files are missing: node scripts/aligner-fetch.mjs first.");
  process.exit(1);
}

const words = (text) => toTokens(text).filter((token) => token.isWord).map((token) => [token.start, token.end]);
const pair = (source, target) => ({ source, target, source_words: words(source), target_words: words(target) });

const kinds = ["own", "other", "between"];
const pairs = [];
for (const code of INTERFACE_LANGUAGES) {
  const example = labels(code).welcome.example;
  const [mine, other] = example.panels;
  pairs.push(pair(example.text, mine.text), pair(example.text, other.text), pair(other.text, mine.text));
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "triglosa-example-"));
const items = path.join(dir, "pairs.json");
const answers = path.join(dir, "links.json");
fs.writeFileSync(items, JSON.stringify(pairs));
execFileSync("cargo", ["test", "--release", "--lib", "--", "--ignored", "the_pairs_are_aligned"], {
  cwd: path.join(root, "src-tauri"),
  env: { ...process.env, TRIGLOSA_ALIGNER: aligner, TRIGLOSA_ITEMS: items, TRIGLOSA_ANSWERS: answers },
  stdio: ["ignore", "ignore", "inherit"],
});
const links = JSON.parse(fs.readFileSync(answers, "utf8"));
fs.rmSync(dir, { recursive: true, force: true });

const out = {};
INTERFACE_LANGUAGES.forEach((code, at) => {
  const example = labels(code).welcome.example;
  out[code] = {
    texts: [example.text, ...example.panels.map((panel) => panel.text)],
    ...Object.fromEntries(kinds.map((kind, k) => [kind, links[at * kinds.length + k]])),
  };
});
const file = path.join(root, "src", "ui", "example-links.js");
/* One pair of word numbers to a line's piece, not one number to a line. */
const body = JSON.stringify(out, null, 1).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, "[$1,$2]");
fs.writeFileSync(file, `/* The first steps' example as the word aligner links it, per interface
   language: written by scripts/example-links.mjs, never by hand. \`texts\`
   are the original, the reader's translation and the other one; \`own\` and
   \`other\` link the source text's words to each translation's, \`between\` the
   other translation's to the reader's. */

export const EXAMPLE_LINKS = ${body};
`);
console.log(`${Object.keys(out).length} examples → ${path.relative(root, file)}`);

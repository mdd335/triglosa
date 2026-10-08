/* What the tests cannot see: the Markdown files and the links into them.

   Seven checks, each for something that broke unnoticed once a file was
   renamed or a heading reworded:

   - every relative link between the Markdown files leads to a file, and to a
     heading that is there where it names one;
   - the addresses the app opens on the project page (`src/updates.js`) lead
     to a README heading and to a file that exists;
   - no file that goes public holds what the public export refuses
     (`scripts/public-export.mjs`), so a release is not stopped at the end;
   - the Rust shell stands in rustfmt's format, where cargo is installed,
     and the JavaScript passes ESLint, where it is installed;
   - docs/DEVELOPMENT.md names every file of src/, src/platform/, src/ui/
     and the shell, every folder of src/, every npm script and every script
     a developer runs — so a new file cannot leave the page behind;
   - docs/behind-a-translation.md lists every question the model is asked:
     each prompt of src/prompts/ has a numbered row in its table, and no row
     is left without one;
   - with --staged, run as the pre-commit hook: a commit that changes the app
     without touching CHANGELOG.md is reminded of it. Only reminded — a
     comment or a test changes the app's files without changing what it does.
     Likewise where the path of a reading changed and the page on it did not.

   Usage: node scripts/check.mjs [--staged]
   The hook: git config core.hooksPath scripts/hooks */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

/* GitHub's anchor for a heading: lower case, punctuation gone, spaces as
   hyphens. */
export function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

export function anchorsOf(markdown) {
  const anchors = new Set();
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) anchors.add(slug(heading[1]));
  }
  return anchors;
}

/* Links written [text](target), outside code. */
export function linksOf(markdown) {
  const links = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const bare = line.replace(/`[^`]*`/g, "");
    for (const match of bare.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) links.push(match[1]);
  }
  return links;
}

/* What the developer page does not name, out of the tree it describes. The
   names are looked for as written on the page: a file by its name, a folder
   with its slash, a script as `npm run <name>`. */
export function missingFromDevelopment(page, { src, dirs, platform, ui, shell, npmScripts, scripts }) {
  const wanted = [
    ...src,
    ...dirs.map((dir) => `${dir}/`),
    ...platform,
    ...ui,
    ...shell,
    ...npmScripts.map((name) => `npm run ${name}`),
    ...scripts,
  ];
  return wanted.filter((name) => !page.includes(name));
}

/* Which row of the table in docs/behind-a-translation.md a prompt is: the
   number its question carries there and in the diagrams. Two prompts for
   one question — with one translation and with two — share a number. An
   empty one is a question the page leaves out: the flashcards'. */
export const REQUESTS = {
  detectPrompt: "Q1",
  translatePrompt: "Q2",
  wordsPrompt: "Q3",
  abbreviationPrompt: "Q4",
  wordClassPrompt: "Q5",
  findVerbsPrompt: "Q6",
  annotateVerbsPrompt: "Q7",
  alignWordsPrompt: "Q8",
  alignWordsSinglePrompt: "Q8",
  alignVerbsPrompt: "Q9",
  alignVerbsSinglePrompt: "Q9",
  glancePrompt: "Q10",
  glanceWidePrompt: "Q10",
  alternativesPrompt: "Q11",
  verbFormPrompt: "Q12",
  meaningPrompt: "Q13",
  spotPrompt: "Q14",
  passagePrompt: "Q15",
  synonymPrompt: "Q16",
  passageSpotPrompt: "Q17",
  explainMorePrompt: "Q18",
  exampleSentencePrompt: "Q19",
  improveCardPrompt: "",
  headwordPrompt: "",
};

export const READING_PAGE = "docs/behind-a-translation.md";

/* Where that page and the prompts no longer agree: a prompt without a
   number, a number without a row, a row without a prompt. */
export function staleRequests(page, prompts, requests = REQUESTS) {
  const rows = new Set([...page.matchAll(/^\| (Q\d+) \|/gm)].map((match) => match[1]));
  const live = prompts.filter((name) => name in requests);
  const numbered = new Set(live.map((name) => requests[name]).filter(Boolean));
  return [
    ...prompts.filter((name) => !(name in requests))
      .map((name) => `${READING_PAGE}: ${name} is a question the page does not know — give it a row and a box there, and its number in scripts/check.mjs`),
    ...live.filter((name) => requests[name] && !rows.has(requests[name]))
      .map((name) => `${READING_PAGE}: no row ${requests[name]} for ${name}`),
    ...[...rows].filter((row) => !numbered.has(row))
      .map((row) => `${READING_PAGE}: row ${row} has no prompt behind it any more`),
  ];
}

/* Every prompt the app can send: what src/prompts/ exports under a name
   ending in Prompt. */
export function promptNames() {
  const dir = join(ROOT, "src/prompts");
  return readdirSync(dir).filter((name) => name.endsWith(".js")).flatMap((name) =>
    [...readFileSync(join(dir, name), "utf8").matchAll(/^export (?:function|const) (\w+Prompt)\b/gm)].map((match) => match[1]));
}

/* The tree as it stands, for the check above. The plumbing npm scripts
   (Vite's build and preview, Tauri's own CLI) and the private export are no
   developer's business. */
function developmentTree() {
  const list = (dir, test) => (existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { withFileTypes: true }).filter(test).map((entry) => entry.name)
    : []);
  const isFile = (pattern) => (entry) => entry.isFile() && pattern.test(entry.name);
  return {
    src: list("src", isFile(/\.js$/)),
    dirs: list("src", (entry) => entry.isDirectory()),
    platform: list("src/platform", isFile(/\.js$/)),
    ui: list("src/ui", isFile(/\.(js|css)$/)),
    shell: list("src-tauri/src", isFile(/\.rs$/)),
    npmScripts: Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts || {})
      .filter((name) => !["build", "preview", "tauri", "test"].includes(name)),
    scripts: list("scripts", isFile(/\.mjs$/)).filter((name) => name !== "public-export.mjs"),
  };
}

/* Run only as a script: the tests import the functions above. */
if (import.meta.main) {
  const problems = [];
  const files = git(["ls-files", "*.md"]).split("\n").filter(Boolean);
  const anchors = new Map();
  const anchorsFor = (file) => {
    if (!anchors.has(file)) anchors.set(file, anchorsOf(readFileSync(join(ROOT, file), "utf8")));
    return anchors.get(file);
  };

  for (const file of files) {
    for (const link of linksOf(readFileSync(join(ROOT, file), "utf8"))) {
      if (/^[a-z]+:/i.test(link)) continue;
      const [path, anchor] = link.split("#");
      const target = path ? normalize(join(dirname(file), decodeURI(path))) : file;
      if (!existsSync(join(ROOT, target))) {
        problems.push(`${file}: the link to ${link} leads nowhere`);
      } else if (anchor && target.endsWith(".md") && !anchorsFor(target).has(anchor)) {
        problems.push(`${file}: ${target} has no heading #${anchor}`);
      }
    }
  }

  const development = join(ROOT, "docs/DEVELOPMENT.md");
  if (existsSync(development)) {
    for (const name of missingFromDevelopment(readFileSync(development, "utf8"), developmentTree())) {
      problems.push(`docs/DEVELOPMENT.md does not name ${name}`);
    }
  }

  const reading = join(ROOT, READING_PAGE);
  if (existsSync(reading)) problems.push(...staleRequests(readFileSync(reading, "utf8"), promptNames()));

  const updates = readFileSync(join(ROOT, "src/updates.js"), "utf8");
  for (const [, anchor] of updates.matchAll(/\$\{PROJECT_URL\}#([\w-]+)/g)) {
    if (anchor !== "readme" && !anchorsFor("README.md").has(anchor)) {
      problems.push(`src/updates.js: README.md has no heading #${anchor}`);
    }
  }
  for (const [, path] of updates.matchAll(/\$\{PROJECT_URL\}\/blob\/main\/([^`"]+)/g)) {
    if (!existsSync(join(ROOT, path))) problems.push(`src/updates.js: ${path} does not exist`);
  }

  /* What the public export would refuse, found now rather than at a
     release. The export script and its list stay out of the public copy, so
     there this check has nothing to read and is skipped. */
  const exporter = join(ROOT, "scripts/public-export.mjs");
  if (existsSync(exporter)) {
    const { FORBIDDEN, goesPublicWhole } = await import(pathToFileURL(exporter).href);
    for (const file of git(["ls-files"]).split("\n").filter(Boolean).filter(goesPublicWhole)) {
      const path = join(ROOT, file);
      if (!existsSync(path) || /\.(png|gif|ico|icns|jpg)$/.test(file)) continue;
      const text = readFileSync(path, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) problems.push(`${file}: would not go public, it holds ${pattern}`);
      }
    }
  }

  /* One format for the shell, so that a diff shows what changed and not how
     somebody's editor wraps lines. Skipped where there is no cargo. */
  try {
    execFileSync("cargo", ["fmt", "--check", "--manifest-path", join(ROOT, "src-tauri/Cargo.toml")],
      { cwd: ROOT, stdio: ["ignore", "ignore", "ignore"] });
  } catch (error) {
    if (error.code !== "ENOENT") problems.push("src-tauri: not in rustfmt's format — run cargo fmt in src-tauri");
  }

  /* The linter's recommended rules: mistakes, not taste (eslint.config.js). */
  const eslint = join(ROOT, "node_modules/.bin/eslint");
  if (existsSync(eslint)) {
    try {
      execFileSync(eslint, ["."], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      problems.push(`ESLint:\n${String(error.stdout || error.message).trim()}`);
    }
  }

  if (process.argv.includes("--staged")) {
    const staged = git(["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
    const app = staged.filter((f) => /^(src\/|src-tauri\/(src|sidecar)\/|index\.html|settings\.html|card\.html)/.test(f));
    if (app.length && !staged.includes("CHANGELOG.md")) {
      console.warn(`Reminder: the app changed (${app.length} file${app.length > 1 ? "s" : ""}) and CHANGELOG.md did not.` +
        " Add a line under Unreleased if a reader would notice.");
    }
    /* Who is asked what, and who steps in: no list can tell whether the
       page still says it, so it is read again whenever these change. */
    const path = staged.filter((f) => /^src\/(run|ask|detect)\.js$|^src\/prompts\//.test(f));
    if (path.length && !staged.includes(READING_PAGE)) {
      console.warn(`Reminder: the path of a reading changed (${path.join(", ")}) and ${READING_PAGE} did not.` +
        " Read its diagrams against the change.");
    }
  }

  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}

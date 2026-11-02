/* The anonymous count: what an installation sends and when (src/stats.js),
   and what the counter makes of it (counter/worker.js), against a real
   SQLite table shaped as Cloudflare's D1 hands it to the worker. */

import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const { counting, dayOf, dueFault, dueReport, modelKind, normalizeCounted } = await import("../../src/stats.js");
const { normalizeSettings } = await import("../../src/settings.js");
const worker = await import("../../counter/worker.js");

const SETTINGS = normalizeSettings({ languages: ["de", "es", "en"], stats: true, endpoint: "https://openrouter.ai/api/v1", way: "online" });
const CONTEXT = (day) => ({ day, settings: SETTINGS, system: "mac", version: "0.7.0" });

test("nothing is counted before a yes, on a phone, or outside a built app", () => {
  assert.strictEqual(normalizeSettings({}).stats, null, "unanswered by default");
  assert.strictEqual(counting(normalizeSettings({}), { system: "mac", version: "0.7.0" }), false);
  assert.strictEqual(counting(normalizeSettings({ stats: false }), { system: "mac", version: "0.7.0" }), false);
  assert.strictEqual(counting(SETTINGS, { system: "ios", version: "0.7.0" }), false);
  assert.strictEqual(counting(SETTINGS, { system: "windows", version: "" }), false);
  assert.strictEqual(counting(SETTINGS, { system: "windows", version: "0.7.0" }), true);
});

test("a report says only what is listed: no text, no address, no model's name", () => {
  const { report } = dueReport(null, "seen", CONTEXT("2026-11-03"));
  assert.deepStrictEqual(Object.keys(report).sort(),
    ["event", "first", "model", "since", "system", "version", "week"]);
  assert.deepStrictEqual(report, {
    event: "seen", since: "2026-11-03", week: 0, first: true, version: "0.7.0", system: "mac", model: "online",
  });
  assert.doesNotMatch(JSON.stringify(report), /openrouter|deepseek|http/i);
});

test("the kind of model is all that is said of it", () => {
  assert.strictEqual(modelKind(normalizeSettings({})), "none");
  assert.strictEqual(modelKind(normalizeSettings({ endpoint: "http://127.0.0.1:1234/v1" })), "local");
  assert.strictEqual(modelKind(normalizeSettings({ endpoint: "https://api.example.com/v1", way: "own" })), "own");
});

test("once a day per event, and the first report of each week since the first day is marked", () => {
  let counted = null;
  const sent = [];
  const day = (date, event = "seen") => {
    const { report, state } = dueReport(counted, event, CONTEXT(date));
    if (report) sent.push(`${date} ${event} w${report.week}${report.first ? " first" : ""}`);
    counted = state;
  };
  day("2026-11-03");
  day("2026-11-03");
  day("2026-11-03", "read");
  day("2026-11-05");
  day("2026-11-10");
  day("2026-11-12");
  day("2026-12-01");
  assert.deepStrictEqual(sent, [
    "2026-11-03 seen w0 first",
    "2026-11-03 read w0 first",
    "2026-11-05 seen w0",
    "2026-11-10 seen w1 first",
    "2026-11-12 seen w1",
    "2026-12-01 seen w4 first",
  ]);
  assert.strictEqual(counted.since, "2026-11-03");
});

test("a failure is reported by its kind, once a day, and nothing unknown", () => {
  const first = dueFault(null, "key", CONTEXT("2026-11-03"));
  assert.deepStrictEqual(first.report, { event: "fault", kind: "key", version: "0.7.0", system: "mac" });
  assert.strictEqual(dueFault(first.state, "key", CONTEXT("2026-11-03")).report, null);
  assert.ok(dueFault(first.state, "key", CONTEXT("2026-11-04")).report);
  assert.strictEqual(dueFault(null, "something else", CONTEXT("2026-11-03")).report, null);
});

test("a file that holds nonsense is read as a first day", () => {
  assert.deepStrictEqual(normalizeCounted({ since: "yesterday", days: { seen: 3 }, weeks: { seen: -1 }, faults: { x: "2026-11-01" } }),
    { since: "", days: {}, weeks: {}, faults: {} });
  assert.match(dayOf(new Date("2026-11-03T23:59:00Z")), /^2026-11-03$/);
});

/* D1 as the worker sees it: prepare, bind, run or all. */
function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../../counter/schema.sql", import.meta.url), "utf8"));
  return {
    db,
    prepare(sql) {
      const statement = db.prepare(sql);
      let args = [];
      const bound = {
        bind: (...values) => { args = values; return bound; },
        run: async () => { statement.run(...args); return { success: true }; },
        all: async () => ({ results: statement.all(...args).map((row) => ({ ...row })) }),
      };
      return bound;
    },
  };
}

const post = (body) => new Request("https://counter.example/v1/count", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

test("the counter keeps a sum per day and values, and nothing that tells installations apart", async () => {
  const DB = d1();
  const report = dueReport(null, "seen", CONTEXT(dayOf())).report;
  for (let i = 0; i < 3; i++) assert.strictEqual((await worker.default.fetch(post(report), { DB })).status, 204);
  const rows = DB.db.prepare("SELECT * FROM counts").all();
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].n, 3);
  assert.deepStrictEqual(Object.keys(rows[0]).sort(),
    ["day", "event", "first", "kind", "model", "n", "since", "system", "version", "week"]);
});

test("the counter refuses anything but a report", async () => {
  const DB = d1();
  const good = dueReport(null, "seen", CONTEXT(dayOf())).report;
  for (const bad of [
    "not json",
    { ...good, event: "opened" },
    { ...good, version: "latest" },
    { ...good, system: "linux" },
    { ...good, model: "deepseek" },
    { ...good, since: "2001-01-01" },
    { ...good, week: -1 },
    { event: "fault", kind: "everything", version: "0.7.0", system: "mac" },
    "x".repeat(3000),
  ]) {
    assert.ok((await worker.default.fetch(post(bad), { DB })).status >= 400, JSON.stringify(bad).slice(0, 60));
  }
  assert.strictEqual(DB.db.prepare("SELECT COUNT(*) AS n FROM counts").get().n, 0);
  assert.strictEqual((await worker.default.fetch(new Request("https://counter.example/v1/report"), { DB, REPORT_KEY: "k" })).status, 404,
    "the report only with its key");
});

test("the report works out who came back after one and after four weeks", async () => {
  const DB = d1();
  const today = "2026-12-20";
  const add = (row) => DB.db.prepare(`INSERT INTO counts (day, event, since, week, first, version, system, model, kind, n)
    VALUES (?, ?, ?, ?, ?, '0.7.0', 'mac', 'online', '', ?)`).run(row.day, row.event, row.since, row.week, row.first, row.n);
  /* Ten first counted on 1 November: six back in week 1, three in week 4. */
  add({ day: "2026-11-01", event: "seen", since: "2026-11-01", week: 0, first: 1, n: 10 });
  add({ day: "2026-11-02", event: "seen", since: "2026-11-01", week: 0, first: 0, n: 7 });
  add({ day: "2026-11-09", event: "seen", since: "2026-11-01", week: 1, first: 1, n: 6 });
  add({ day: "2026-11-30", event: "seen", since: "2026-11-01", week: 4, first: 1, n: 3 });
  /* Four first counted a week ago: too early for either. */
  add({ day: "2026-12-13", event: "seen", since: "2026-12-13", week: 0, first: 1, n: 4 });
  const numbers = await worker.summary(DB, today);
  assert.deepStrictEqual(numbers.retention.week1, { size: 10, back: 6, share: 0.6 });
  assert.deepStrictEqual(numbers.retention.week4, { size: 10, back: 3, share: 0.3 });
  assert.strictEqual(numbers.days.find((day) => day.day === "2026-12-13").new, 4);
  const page = worker.reportPage(numbers);
  assert.match(page, /60 % \(6 of 10\)/);
  assert.match(page, /30 % \(3 of 10\)/);
  const json = await worker.default.fetch(new Request("https://counter.example/v1/report?key=k&format=json"), { DB, REPORT_KEY: "k" });
  assert.strictEqual(json.status, 200);
  assert.ok((await json.json()).retention);
});

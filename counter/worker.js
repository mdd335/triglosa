/* Triglosa's anonymous counter, on Cloudflare's workers.

   An installation whose reader said yes reports at most once a day that it
   was used and that a text was read, and a failure by its kind (src/stats.js
   says what and when). Here every report only adds one to the row for its
   day and its values — there is no row per installation, no number that
   tells one from another, and neither the address a report came from nor
   the time of day is read or kept. Cloudflare's own request log is switched
   off (wrangler.toml).

   Who comes back is worked out from two values every report carries: the
   day the installation was first counted (`since`) and whether this is its
   first report in that week of its count (`first`, with the week's number).
   An installation first counted on a day is one of that day's cohort; the
   cohort's reports that are the first of week 1 are the ones still there a
   week later.

   POST /v1/count   one report, as JSON
   GET  /v1/report  what has been counted, for whoever holds REPORT_KEY
                    (?key=…, &format=json for the numbers alone) */

import { FAULTS } from "../src/faults.js";
import { COUNTED_EVENTS, COUNTED_SYSTEMS, EARLIER_MODEL_KINDS, MODEL_KINDS, dayOf, daysBetween } from "../src/stats.js";

const MOST_BYTES = 2000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const VERSION = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/* A report as the table takes it, or null for anything else. */
export function readReport(body, today) {
  if (!body || typeof body !== "object") return null;
  const { event, version, system } = body;
  if (!VERSION.test(String(version)) || !COUNTED_SYSTEMS.includes(system)) return null;
  if (event === "fault") {
    if (!FAULTS.includes(body.kind)) return null;
    return { day: today, event, since: "", week: 0, first: 0, version, system, model: "", kind: body.kind };
  }
  if (!COUNTED_EVENTS.includes(event)) return null;
  const { since, week, first, model } = body;
  if (!DAY.test(String(since)) || Number.isNaN(Date.parse(`${since}T00:00:00Z`))) return null;
  /* A clock a day ahead of the counter's is let through; a year ahead, or a
     first day longer ago than the app exists, is not a report. */
  const age = daysBetween(since, today);
  if (age < -1 || age > 3650) return null;
  if (!Number.isInteger(week) || week < 0 || week > 600 || typeof first !== "boolean") return null;
  if (!MODEL_KINDS.includes(model) && !EARLIER_MODEL_KINDS.includes(model)) return null;
  return { day: today, event, since, week, first: first ? 1 : 0, version, system, model, kind: "" };
}

const COLUMNS = ["day", "event", "since", "week", "first", "version", "system", "model", "kind"];

async function add(db, row) {
  await db.prepare(
    `INSERT INTO counts (${COLUMNS.join(", ")}, n) VALUES (${COLUMNS.map(() => "?").join(", ")}, 1)
     ON CONFLICT (${COLUMNS.join(", ")}) DO UPDATE SET n = n + 1`,
  ).bind(...COLUMNS.map((column) => row[column])).run();
}

async function count(request, env) {
  const raw = await request.text();
  if (raw.length > MOST_BYTES) return new Response("Too large", { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Not a report", { status: 400 });
  }
  const row = readReport(body, dayOf());
  if (!row) return new Response("Not a report", { status: 400 });
  await add(env.DB, row);
  return new Response(null, { status: 204 });
}

const shifted = (day, by) => dayOf(new Date(Date.parse(`${day}T00:00:00Z`) + by * 86400000));

/* What has been counted, as numbers: the days, the cohorts and what became
   of them, the last week by each value, and the failures. */
export async function summary(db, today) {
  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results || [];
  const from30 = shifted(today, -29);
  const from7 = shifted(today, -6);

  const days = {};
  for (const row of await all(
    "SELECT day, event, SUM(n) AS n FROM counts WHERE event IN ('seen', 'read') AND day >= ? GROUP BY day, event", from30)) {
    days[row.day] = { ...days[row.day], [row.event]: row.n };
  }
  for (const row of await all(
    "SELECT since AS day, SUM(n) AS n FROM counts WHERE event = 'seen' AND week = 0 AND first = 1 AND since >= ? GROUP BY since", from30)) {
    days[row.day] = { ...days[row.day], new: row.n };
  }

  /* Each cohort: its size, and how many of it reported in each week after. */
  const cohorts = {};
  for (const row of await all(
    "SELECT since, week, event, SUM(n) AS n FROM counts WHERE first = 1 AND event IN ('seen', 'read') GROUP BY since, week, event")) {
    const cohort = cohorts[row.since] || (cohorts[row.since] = { since: row.since, seen: {}, read: {} });
    cohort[row.event][row.week] = row.n;
  }
  const kept = (week, event) => {
    /* Only cohorts whose week has passed in full. */
    const done = Object.values(cohorts).filter((cohort) => daysBetween(cohort.since, today) >= (week + 1) * 7);
    const size = done.reduce((sum, cohort) => sum + (cohort.seen[0] || 0), 0);
    const back = done.reduce((sum, cohort) => sum + (cohort[event][week] || 0), 0);
    return { size, back, share: size ? back / size : null };
  };

  const lastWeek = {};
  for (const column of ["system", "version", "model"]) {
    lastWeek[column] = await all(
      `SELECT ${column} AS value, SUM(n) AS n FROM counts WHERE event = 'seen' AND day >= ? GROUP BY ${column} ORDER BY n DESC`, from7);
  }
  const faults = await all(
    "SELECT kind, version, system, SUM(n) AS n FROM counts WHERE event = 'fault' AND day >= ? GROUP BY kind, version, system ORDER BY n DESC", from30);

  return {
    today,
    retention: {
      week1: kept(1, "seen"), week4: kept(4, "seen"),
      readWeek1: kept(1, "read"), readWeek4: kept(4, "read"),
    },
    days: Object.entries(days).sort(([a], [b]) => (a < b ? 1 : -1)).map(([day, values]) => ({ day, new: 0, seen: 0, read: 0, ...values })),
    cohorts: Object.values(cohorts).sort((a, b) => (a.since < b.since ? 1 : -1)),
    lastWeek,
    faults,
  };
}

const escape = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const percent = (part) => (part.share === null ? "–" : `${Math.round(part.share * 100)} % (${part.back} of ${part.size})`);
const table = (head, rows) => `<table><tr>${head.map((cell) => `<th>${escape(cell)}</th>`).join("")}</tr>${
  rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</table>`;

export function reportPage(numbers) {
  const { retention } = numbers;
  const weeks = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Triglosa · counted</title>
<style>body{font:14px/1.45 system-ui,sans-serif;margin:24px;max-width:900px;color:#1b1b1f}table{border-collapse:collapse;margin:8px 0 24px}th,td{padding:3px 10px;border-bottom:1px solid #ddd;text-align:left}th{color:#5f5f68;font-weight:600}h2{font-size:16px;margin:24px 0 4px}p{color:#5f5f68}</style>
<h1>Triglosa · counted</h1>
<p>As of ${escape(numbers.today)} (UTC). Only installations whose reader allowed it; a week counts once it has passed for a cohort.</p>
<h2>Still there</h2>
${table(["", "started or shown", "read a text"], [
    ["after a week (days 7–13)", percent(retention.week1), percent(retention.readWeek1)],
    ["after four weeks (days 28–34)", percent(retention.week4), percent(retention.readWeek4)],
  ])}
<h2>Days</h2>
${table(["day", "new", "used", "read a text"], numbers.days.map((day) => [day.day, day.new, day.seen, day.read]))}
<h2>Cohorts: how many came back, by week</h2>
${table(["first counted", ...weeks.map((week) => `week ${week}`)],
    numbers.cohorts.map((cohort) => [cohort.since, ...weeks.map((week) => cohort.seen[week] ?? "")]))}
<h2>The last seven days, in days used</h2>
${Object.entries(numbers.lastWeek).map(([column, rows]) => table([column, "days"], rows.map((row) => [row.value, row.n]))).join("")}
<h2>Failures, last 30 days</h2>
${table(["kind", "version", "system", "count"], numbers.faults.map((row) => [row.kind, row.version, row.system, row.n]))}`;
}

async function report(url, env) {
  if (!env.REPORT_KEY || url.searchParams.get("key") !== env.REPORT_KEY) return new Response("Not found", { status: 404 });
  const numbers = await summary(env.DB, dayOf());
  if (url.searchParams.get("format") === "json") {
    return new Response(JSON.stringify(numbers, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
  }
  return new Response(reportPage(numbers), { headers: { "content-type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/v1/count") return count(request, env);
    if (request.method === "GET" && url.pathname === "/v1/report") return report(url, env);
    return new Response("Not found", { status: 404 });
  },
};

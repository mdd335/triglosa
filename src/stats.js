/* The anonymous count, worked out before anything is sent.

   Only where the reader said yes (`settings.stats`), only from a computer,
   and with no number that tells one installation from another. At most once
   a day an installation says that it was used ("seen": started, or its
   window shown) and that a text was read ("read"); each time with its
   version, its system and the kind of AI model (local, a preset online,
   online, none), and
   with two things that let the counter work out who comes back without
   knowing who anyone is: the day it was first counted (`since`) and whether
   this is its first report in the current week since then (`first`). The
   counter adds them up and keeps nothing else (counter/worker.js).

   A failure is reported the same way, by its kind alone (faults.js), once
   per kind and day.

   Never a text, a word of one, the reader's languages, the key, the model's address or name, a
   time of day, or anything the system knows about the machine. What is
   kept on the computer for this — the first day, the last day each event
   was sent and the week it fell in — is `counted` here, a file of its own
   beside the settings. */

import { FAULTS } from "./faults.js";
import { ONLINE } from "./setup.js";

export const COUNTED_EVENTS = ["seen", "read"];
export const COUNTED_SYSTEMS = ["mac", "windows"];
/* Where the AI model runs and whether it is one the settings fill in:
   on this computer or the reader's own network, online as one of the
   settings' presets, online otherwise, or none. Version 0.7.0 sent the way
   the reader took instead (`online`, `own`, and LM Studio's address as
   `local`); the counter still takes those. */
export const MODEL_KINDS = ["local", "preset", "online", "none"];
export const EARLIER_MODEL_KINDS = ["online", "local", "own", "none"];

/* The day, as the counter counts it: in UTC, so an installation crossing
   time zones does not count one day twice. */
export function dayOf(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

/* This machine, or a network the reader's router or VPN hands out — the
   same test the shell makes before it lets plain http through (model.rs). */
export function inOwnNetwork(host) {
  const name = String(host || "").replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!name) return false;
  const v4 = name.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 127 || a === 10 || (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168)
      || (a === 169 && b === 254) || (a === 100 && b >= 64 && b < 128);
  }
  if (name.includes(":")) return name === "::1" || /^f[cd]/.test(name) || /^fe[89ab]/.test(name);
  return !name.includes(".") || [".local", ".lan", ".home.arpa", ".internal", ".localhost"].some((end) => name.endsWith(end));
}

/* Which kind of AI model, and nothing about which one: where it runs, and
   online whether it is one of the two the settings fill in. */
export function modelKind(settings) {
  const endpoint = String(settings?.endpoint || "").trim();
  if (!endpoint) return "none";
  let host;
  try {
    host = new URL(endpoint).hostname;
  } catch {
    return "online";
  }
  if (inOwnNetwork(host)) return "local";
  const presets = [ONLINE.model, ONLINE.free.model];
  const atPreset = endpoint.replace(/\/+$/, "") === ONLINE.endpoint;
  return atPreset && presets.includes(String(settings.model || "").trim()) ? "preset" : "online";
}

export function normalizeCounted(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const days = {};
  const weeks = {};
  for (const event of COUNTED_EVENTS) {
    if (DAY.test(value.days?.[event] || "")) days[event] = value.days[event];
    if (Number.isInteger(value.weeks?.[event]) && value.weeks[event] >= 0) weeks[event] = value.weeks[event];
  }
  const faults = {};
  for (const [kind, day] of Object.entries(value.faults || {})) {
    if (FAULTS.includes(kind) && DAY.test(day)) faults[kind] = day;
  }
  return { since: DAY.test(value.since || "") ? value.since : "", days, weeks, faults };
}

/* Whether this installation may count at all: the reader's yes, on a
   computer, in a version that knows its number. */
export function counting(settings, { system, version }) {
  return settings?.stats === true && COUNTED_SYSTEMS.includes(system) && !!version;
}

/* The report an event is due to send today, and the file as it stands once
   it has been sent — or no report, where one went out today already. */
export function dueReport(counted, event, { day, settings, system, version }) {
  const state = normalizeCounted(counted);
  if (!COUNTED_EVENTS.includes(event) || state.days[event] === day) return { report: null, state };
  const since = state.since && daysBetween(state.since, day) >= 0 ? state.since : day;
  const week = Math.floor(daysBetween(since, day) / 7);
  const report = {
    event,
    since,
    week,
    first: state.weeks[event] !== week,
    version,
    system,
    model: modelKind(settings),
  };
  return {
    report,
    state: { ...state, since, days: { ...state.days, [event]: day }, weeks: { ...state.weeks, [event]: week } },
  };
}

/* A failure's kind, once a day. */
export function dueFault(counted, kind, { day, system, version }) {
  const state = normalizeCounted(counted);
  if (!FAULTS.includes(kind) || state.faults[kind] === day) return { report: null, state };
  return {
    report: { event: "fault", kind, version, system },
    state: { ...state, faults: { ...state.faults, [kind]: day } },
  };
}

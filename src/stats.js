/* The anonymous count, worked out before anything is sent.

   Only where the reader said yes (`settings.stats`), only from a computer,
   and with no number that tells one installation from another. At most once
   a day an installation says that it was used ("seen": started, or its
   window shown) and that a text was read ("read"); each time with its
   version, its system and the kind of AI model, and
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
import { WAYS } from "./setup.js";

export const COUNTED_EVENTS = ["seen", "read"];
export const COUNTED_SYSTEMS = ["mac", "windows"];
export const MODEL_KINDS = ["online", "local", "own", "none"];

/* The day, as the counter counts it: in UTC, so an installation crossing
   time zones does not count one day twice. */
export function dayOf(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

/* Which kind of AI model, and nothing about which one: LM Studio by its
   address, otherwise the way the reader set it up, or none. */
const LM_STUDIO = /^http:\/\/(127\.0\.0\.1|localhost):1234(\/|$)/;

export function modelKind(settings) {
  if (!settings?.endpoint) return "none";
  if (LM_STUDIO.test(settings.endpoint)) return "local";
  return WAYS.includes(settings.way) ? settings.way : "own";
}

/* What the file held, in a shape that can be relied on. */
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

/* The anonymous count's way out: the file it keeps beside the settings, and
   the one address it reports to. What is reported, and when, is decided in
   ../stats.js; nothing here looks at a text.

   Sent through the shell's HTTP client like the update check, without
   waiting for it and without a word to the reader: a report that does not
   arrive — no connection, the counter down — is sent again at the next
   chance the same day, and is otherwise lost. Only the reading window counts,
   so one writer keeps the file, and reports go out one after the other. */

import { COUNTER_URL } from "../updates.js";
import { appFetch, appVersion, insideApp, shell } from "./env.js";
import { currentSystem } from "../system.js";
import { counting, dayOf, dueFault, dueReport } from "../stats.js";

const FILE = "counted";
const WAIT_MS = 8000;

async function readCounted() {
  if (!insideApp()) return null;
  try {
    return JSON.parse((await shell("read_state", { name: FILE })) || "null");
  } catch {
    return null;
  }
}

async function writeCounted(state) {
  await shell("write_state", { name: FILE, contents: JSON.stringify(state) });
}

async function send(report) {
  const fetch = await appFetch();
  const response = await fetch(`${COUNTER_URL}/count`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(report),
    signal: AbortSignal.timeout(WAIT_MS),
  });
  if (!response.ok) throw new Error(`counter ${response.status}`);
}

let queue = Promise.resolve();

/* One event or one failure, where the reader allowed it. Never throws. */
function count(settings, work) {
  queue = queue.then(async () => {
    if (!insideApp()) return;
    const context = { day: dayOf(), settings, system: currentSystem(), version: await appVersion() };
    if (!counting(settings, context)) return;
    const { report, state } = work(await readCounted(), context);
    if (!report) return;
    await send(report);
    await writeCounted(state);
  }).catch(() => {});
  return queue;
}

/* The app was started or its window shown. */
export const countSeen = (settings) => count(settings, (counted, context) => dueReport(counted, "seen", context));

/* A text was read. */
export const countRead = (settings) => count(settings, (counted, context) => dueReport(counted, "read", context));

/* A reading failed, of this kind (faults.js). */
export const countFault = (settings, kind) => count(settings, (counted, context) => dueFault(counted, kind, context));

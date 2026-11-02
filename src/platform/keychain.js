/* The model key, and the one thing the rest of the app may know about it.

   It is deliberately not part of the settings object. Everything else the
   user decides is written to a JSON file that gets copied, synced and pasted
   into bug reports; a key must not travel with it. So it lives in the
   system's own store and is fetched on its own, right where a request is
   built.

   Outside the app — in a plain browser, which is how the display gets
   checked — there is no such store and the browser's own storage stands in.
   That is fine for checking a window and would not be fine for shipping,
   which is why the two paths are named apart here rather than hidden in one
   helper. */

import { insideApp, shell } from "./env.js";
import { keyAccount } from "../setup.js";

/* The one entry from before each way had a key of its own. */
const EARLIER = "model-endpoint";

async function read(account) {
  if (!insideApp()) return localStorage.getItem(`triglosa.${account}`) || "";
  return String((await shell("read_api_key", { account })) || "");
}

async function write(account, key) {
  if (!insideApp()) {
    if (key) localStorage.setItem(`triglosa.${account}`, key);
    else localStorage.removeItem(`triglosa.${account}`);
    return;
  }
  await shell("write_api_key", { account, key });
}

/* The key of the way the settings use. A key
   stored before the ways had keys of their own goes to the first way that
   asks for one and has none — the way in use when the app first starts
   after the change, which is the provider it was typed in for. */
export async function loadApiKey(settings) {
  try {
    const account = keyAccount(settings);
    if (!account) return "";
    const key = await read(account);
    if (key) return key;
    const earlier = await read(EARLIER);
    if (!earlier) return "";
    await write(account, earlier);
    await write(EARLIER, "");
    return earlier;
  } catch {
    /* A store that will not answer means no key, which the app handles. It
       must not mean a window that will not open. */
    return "";
  }
}

/* Saved for the way the settings use, and only for it: forgetting the key
   of one provider leaves the other's. */
export async function saveApiKey(key, settings) {
  const clean = String(key || "").trim();
  const account = keyAccount(settings);
  if (!account) return "";
  await write(account, clean);
  return clean;
}

/* What the settings window shows instead of the key itself. A key is long,
   pasted, and never read back by a person — showing it in full only invites
   someone to look over a shoulder, and showing nothing at all leaves the
   reader wondering whether it was saved. The last four characters answer
   that question and nothing else. */
export function keyHint(key) {
  const clean = String(key || "").trim();
  if (!clean) return "";
  return clean.length <= 4 ? "•".repeat(clean.length) : `••••${clean.slice(-4)}`;
}

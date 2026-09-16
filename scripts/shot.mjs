/* A photograph of the window's own page, and nothing else.

   The window is a web page inside a frame the system draws. Opening just that
   page in a browser with no window of its own shows what the app shows, with
   no access to anything else on the screen and no system permission at all.
   Screen recording would be the alternative, and macOS cannot limit that to
   one app.

   Web security is switched off for this browser alone: the page is talking to
   servers on this machine — the translation helper, a model endpoint, Anki —
   which a normal page may not do and the real app is allowed to do. Nothing
   but this throwaway browser is affected.

     node scripts/shot.mjs out.png                     just look
     node scripts/shot.mjs out.png "text to read"      type it and translate
     node scripts/shot.mjs out.png "" "<js>"           then run something

   TRIGLOSA_SETTINGS seeds the settings, TRIGLOSA_KEY a model key, TRIGLOSA_WAIT
   the pause after Translate — a model endpoint needs much longer than the
   device. TRIGLOSA_SCHEME is "light" or "dark", for the scheme the checker is
   not in. TRIGLOSA_PAGE is "settings" or "card" — each is a window of its own
   in the app and a page of its own here. A card page outside the app finds no
   card to draw, so pass one in the third argument with renderCard.

   TRIGLOSA_HOVER puts the pointer on the first element matching a CSS selector
   before the photograph is taken. It has to come from out here: a script in
   the page can dispatch a mouseover event but cannot make `:hover` true, and
   a good deal of this window only exists under the pointer — a row's buttons,
   the word a symbol stands for, the ground under the row itself. Those were
   reasoned about from the stylesheet until this existed, and CSS is exactly
   the wrong thing to reason about: two rules of equal weight are decided by
   the order they happen to stand in.

   Needs the dev server running (npm run dev). */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [out = "shot.png", text = "", script = ""] = process.argv.slice(2);
const profile = mkdtempSync(join(tmpdir(), "triglosa-shot-"));

const browser = spawn(CHROME, [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--disable-web-security",
  `--user-data-dir=${profile}`,
  "--remote-debugging-port=9222",
  "--window-size=748,770",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function target() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("the browser did not come up");
}

const socket = new WebSocket(await target());
await new Promise((open) => socket.addEventListener("open", open, { once: true }));

let counter = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const waiting = pending.get(message.id);
  if (waiting) { pending.delete(message.id); waiting(message.result); }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++counter;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });

const run = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true });

/* Whatever the page logs or throws goes to stderr, so a run that comes back
   looking empty says why. */
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled") {
    const line = (message.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    console.error(`[page ${message.params.type}] ${line}`);
  }
  if (message.method === "Runtime.exceptionThrown") {
    console.error("[page error]", message.params.exceptionDetails.text,
      message.params.exceptionDetails.exception?.description || "");
  }
});

await send("Runtime.enable");
await send("Page.enable");
/* The window follows the system's light or dark setting, and only one of
   the two is ever in front of the person checking it. TRIGLOSA_SCHEME picks
   the other one. */
if (process.env.TRIGLOSA_SCHEME) {
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: process.env.TRIGLOSA_SCHEME }],
  });
}
/* Settings live in the browser's storage outside the app, and this browser
   is thrown away after every run — so they are seeded before the page loads.
   The key is seeded the same way and for the same reason: outside the app
   there is no system key store, and the settings window looks different with
   one stored than without. */
const seeds = [
  ["triglosa.settings", process.env.TRIGLOSA_SETTINGS],
  ["triglosa.apiKey", process.env.TRIGLOSA_KEY],
].filter(([, value]) => value);
if (seeds.length) {
  await send("Page.addScriptToEvaluateOnNewDocument", {
    /* Runs on every document, about:blank included, where storage is denied. */
    source: seeds
      .map(([key, value]) => `try { localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)}) } catch {}`)
      .join("\n"),
  });
}

const PAGES = { settings: "settings.html", card: "card.html" };
const page = PAGES[process.env.TRIGLOSA_PAGE] || "";
await send("Page.navigate", { url: `http://localhost:1420/${page}` });
await sleep(1200);

if (text) {
  /* The original field is the entry field: there is only one box, and the
     button beside it says Translate while there is a caret in it. Typing into
     it by hand means telling the page about it, because the value the window
     keeps comes from the input event and not from the field. */
  await run(`(() => {
    const field = document.querySelector("#draft");
    field.value = ${JSON.stringify(text)};
    field.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("#translate").click();
  })()`);
  /* Long enough for the device to answer; a model endpoint needs much more,
     so TRIGLOSA_WAIT overrides it. */
  await sleep(Number(process.env.TRIGLOSA_WAIT || 9000));
}

if (script) {
  await run(script);
  await sleep(600);
}

/* The pointer, put where a person would put it. The delay afterwards is
   longer than the label's own — it waits 260 ms before it appears, which is
   what keeps a pointer travelling down the window from trailing labels
   behind it. */
if (process.env.TRIGLOSA_HOVER) {
  const selector = process.env.TRIGLOSA_HOVER;
  const found = await run(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return "";
    const box = node.getBoundingClientRect();
    if (!box.width || !box.height) return "";
    return JSON.stringify({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  })()`);
  const at = found?.result?.value ? JSON.parse(found.result.value) : null;
  if (!at) {
    console.error(`[hover] nothing to point at: ${selector}`);
  } else {
    /* Two moves, because one is not a move: the page may already believe the
       pointer is where it is being put, and then nothing changes at all. */
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0, buttons: 0 });
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at.x, y: at.y, buttons: 0 });
    await sleep(700);
  }
}

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
await writeFile(out, Buffer.from(shot.data, "base64"));
console.log(`wrote ${out}`);

socket.close();
browser.kill();
/* The browser is still writing to its profile as it dies; the directory is a
   throwaway under the system's temporary files either way. */
await sleep(300);
try { rmSync(profile, { recursive: true, force: true }); } catch {}

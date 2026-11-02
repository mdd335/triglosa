/* The frame drawn over a screen, for text read off it (screen.rs).

   The window covers one screen and shows that screen's photograph, taken
   before the window appeared, under a veil. The reader drags a frame around
   the text; the frame is sent back in the photograph's own pixels, so how
   the window was scaled or placed does not matter. Escape, or a right
   click, gives up — every frame window at once, since the shell closes them
   all. */

import { invoke } from "@tauri-apps/api/core";
import { loadSettings } from "../platform/store.js";
import { labels } from "./labels.js";

const photo = document.getElementById("photo");
const frame = document.getElementById("frame");
const hint = document.getElementById("hint");

/* Fewer points than this either way is a click, not a frame. */
const SMALLEST = 6;

loadSettings()
  .then((settings) => { hint.textContent = labels(settings.languages[0]).screenHint; })
  .catch(() => {});

const bytes = await invoke("screen_picture").catch(() => null);
if (!bytes) {
  invoke("screen_cancel");
} else {
  photo.src = URL.createObjectURL(new Blob([bytes]));
  await photo.decode().catch(() => {});
  invoke("screen_ready");
}

let start = null;

function rectangle(event) {
  const left = Math.min(start.x, event.clientX);
  const top = Math.min(start.y, event.clientY);
  return { left, top, width: Math.abs(event.clientX - start.x), height: Math.abs(event.clientY - start.y) };
}

window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  start = { x: event.clientX, y: event.clientY };
  document.body.setPointerCapture?.(event.pointerId);
});

window.addEventListener("pointermove", (event) => {
  if (!start) return;
  const r = rectangle(event);
  document.body.classList.add("drawing");
  Object.assign(frame.style, { display: "block", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
});

window.addEventListener("pointerup", (event) => {
  if (!start || event.button !== 0) return;
  const r = rectangle(event);
  start = null;
  if (r.width < SMALLEST || r.height < SMALLEST) {
    document.body.classList.remove("drawing");
    frame.style.display = "none";
    return;
  }
  /* From the window's points to the photograph's pixels. */
  const sx = photo.naturalWidth / window.innerWidth;
  const sy = photo.naturalHeight / window.innerHeight;
  invoke("screen_chosen", { rect: [r.left * sx, r.top * sy, r.width * sx, r.height * sy] });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") invoke("screen_cancel");
});

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  invoke("screen_cancel");
});

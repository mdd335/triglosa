/* Taking hold of a key combination for the whole system, and letting go.

   The combination itself is decided in hotkey.js; this only hands the
   accelerator to the shell and reports back what came of it. Registering
   needs no permission of its own — macOS grants a global shortcut without
   asking anybody. The permission comes one step later, when the selection is
   read.

   Outside the app nothing is registered and nothing pretends to be: the
   display can be checked in a browser, and a browser has no system-wide
   anything. */

import { insideApp } from "./env.js";

/* Register, or give up the one held before. Passing nothing is how a reader
   who cleared the field is honoured.

   Answers "" when it worked and the reason when it did not, so the window has
   something to say rather than a shortcut that silently is not there.

   One thing macOS will not tell us: whether the combination already belongs
   to something else. Registering one another program holds usually succeeds,
   and both then receive it or one of them quietly wins. So a combination that
   does nothing is not necessarily one that failed to register — which is why
   the field stays easy to change. */
export async function registerShortcut(hotkey) {
  if (!insideApp()) return "";
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    await invoke("set_shortcut", { accelerator: hotkey ? hotkey.accelerator : null });
    return "";
  } catch (error) {
    return (error && error.message) || String(error);
  }
}

/* What the shell sends when the combination was pressed: either the selection
   it managed to read, or the word for why it could not. Both arrive with the
   window already in front, so the reader sees an answer either way. */
export async function onCapture(handlers) {
  if (!insideApp()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  const stops = [
    await listen("capture", (event) => handlers.onText(event.payload)),
    await listen("capture-failed", (event) => handlers.onFailed(String(event.payload || ""))),
  ];
  return () => stops.forEach((stop) => stop());
}

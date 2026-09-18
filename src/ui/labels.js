import { currentSystem } from "../system.js";
import de, { windows as deWindows } from "./labels/de.js";
import en, { windows as enWindows } from "./labels/en.js";
import es, { windows as esWindows } from "./labels/es.js";
import fr, { windows as frWindows } from "./labels/fr.js";
import it, { windows as itWindows } from "./labels/it.js";
import pt, { windows as ptWindows } from "./labels/pt.js";
import ru, { windows as ruWindows } from "./labels/ru.js";

/* The interface in every language it is written in, one file each under
   labels/. A language without a file here is not one the interface can be
   read in, and the app falls back to English for it. */
const TABLE = { de, en, es, fr, it, pt, ru };

export const INTERFACE_LANGUAGES = Object.keys(TABLE);

/* What stands in a window's title bar. The app's name is not translated and
   the rest is, so the two are joined in one place rather than in each
   window. */
export const windowTitle = (name) => `Triglosa · ${name}`;

/* What is worded differently on Windows: no translation on the device, so
   the model is what everything waits for; no permission to explain; the
   keyboard's Ctrl rather than ⌘; and the system's own name. Each sentence is
   written for somebody who only ever sees this system: nothing is worded as a
   difference from the other one. Laid over the
   table rather than beside it, so the Mac's wording has one place. */
const WINDOWS = {
  de: deWindows,
  en: enWindows,
  es: esWindows,
  fr: frWindows,
  it: itWindows,
  pt: ptWindows,
  ru: ruWindows,
};

const OVERLAID = {};

export function labels(code, system = currentSystem()) {
  const language = TABLE[String(code || "").toLowerCase()] ? String(code).toLowerCase() : "en";
  if (system !== "windows") return TABLE[language];
  OVERLAID[language] = OVERLAID[language] || { ...TABLE[language], ...WINDOWS[language] };
  return OVERLAID[language];
}

/* The failures whose bracket carries the service's own words besides the
   HTTP number — see labels/detail.js. */
const WITH_DETAIL = new Set(["refused", "notFound", "status", "server"]);

/* One failure, in words: what happened, then what to do. Everything that
   goes wrong outside the process arrives here as a fault — see faults.js —
   and leaves as one sentence in the language the interface is in. */
export function faultText(code, fault) {
  const text = labels(code);
  const kind = (fault && fault.kind) || "unknown";
  const entry = text.faults[kind] || text.faults.unknown;
  const detail = WITH_DETAIL.has(kind) ? String((fault && fault.detail) || "").trim() : "";
  return typeof entry === "function" ? entry({ ...fault, shown: detail }) : entry;
}

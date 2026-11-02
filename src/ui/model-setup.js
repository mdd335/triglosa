/* The head of the settings' model group: two ways to an AI model in a row of
   buttons, as the Anki decks have their languages, and what to do for the one
   chosen. It stands outside the settings' boxes, since it fills in every field
   under it.

   Online fills in OpenRouter and the recommended model and says how to get a
   key; any provider starts from empty fields. Each way keeps what was set in
   it (settings.ways) and its own key, so choosing one brings back what it
   held, or its preset the first time; the chosen one is settings.way.

   No card, no "recommended", no plus and minus: nothing here may look like
   something Triglosa sells. */

import { ONLINE, presetOf } from "../setup.js";
import { MODEL_HELP_URL } from "../updates.js";
import { element } from "./elements.js";

const OPENROUTER = "https://openrouter.ai";
const OPENROUTER_KEYS = "https://openrouter.ai/settings/keys";
const OPENROUTER_PRIVACY = "https://openrouter.ai/settings/privacy";

/* A way: its name and who provides it. */
function way(key, chosen, { title, via }, onPick) {
  const node = element("button", "setup-choice");
  node.type = "button";
  node.dataset.way = key;
  node.setAttribute("aria-pressed", String(chosen === key));
  node.append(element("b", null, title), element("span", "via", via));
  node.addEventListener("click", () => onPick(key));
  return node;
}

/* What a way is good and bad at, always in view. */
const lineOf = (text) => element("p", "setup-line", text);

/* How a way is set up: the model it filled in and its steps, in a fold of
   its own, open until the reader folds it away, which is kept. */
function guide(text, { title, model }, current, parts, folded, onFold) {
  const box = element("details", "setup-steps");
  box.open = !folded;
  /* The page's own opening announces itself too, and is no choice of the
     reader's. */
  box.addEventListener("toggle", () => {
    if (box.open === folded) onFold(!box.open);
  });
  box.append(element("summary", null, text.setupGuide));
  const list = element("ol");
  for (const step of parts) {
    const li = element("li");
    li.append(...step);
    list.append(li);
  }
  box.append(element("p", null, text.setupRecommended(title, current === model)), list);
  return box;
}

export function modelSetup({ text, settings, onChange, link }) {
  const root = element("div", "model-setup");
  const chosen = settings.way;
  const foldGuide = (guideFolded) => onChange({ ...settings, guideFolded });
  const choices = element("div", "setup-choices");
  choices.setAttribute("role", "group");
  const below = element("div", "setup-below");
  const more = element("p", "hint");
  more.append(...text.setupMore((word) => link(word, MODEL_HELP_URL)), " ", text.setupChatbot);
  root.append(choices, below, more);

  /* What the way in use holds is put by, and the chosen one's brought
     back: what it held, or its preset where it never held an address. */
  const pick = (key) => {
    if (key === chosen) return;
    const ways = { ...settings.ways };
    if (chosen) ways[chosen] = { endpoint: settings.endpoint, model: settings.model };
    const held = ways[key]?.endpoint ? ways[key] : presetOf(key);
    onChange({ ...settings, way: key, ways, endpoint: held.endpoint, model: held.model });
  };

  choices.append(
    way("online", chosen, { title: text.setupOnline, via: text.setupOnlineVia }, pick),
    way("own", chosen, { title: text.setupOwn, via: text.setupOwnVia }, pick),
  );

  if (chosen === "online") {
    const box = guide(text, ONLINE, settings.model, text.setupOnlineSteps(
      (word) => link(word, OPENROUTER),
      (word) => link(word, OPENROUTER_KEYS),
      (word) => link(word, OPENROUTER_PRIVACY),
    ), settings.guideFolded, foldGuide);
    /* The free model, for a try before any credit, and the way back to
       the recommended one once it stands in the field. */
    const free = element("div", "setup-free");
    const tried = settings.model === ONLINE.free.model;
    const take = element("button", null, tried ? text.setupOnlinePaidTake : text.setupOnlineFreeTake);
    take.type = "button";
    take.addEventListener("click", () => onChange({ ...settings, model: tried ? ONLINE.model : ONLINE.free.model }));
    free.append(element("p", null, text.setupOnlineFree(ONLINE.free.title)), take);
    box.append(free);
    below.append(lineOf(text.setupOnlineLine), box);
  }

  return root;
}

/* The language of the original, where the reader can say it is another one,
   and of a translation, where they want it in another for this reading.

   Detection is right about sentences and wrong now and then about a single
   word written the same way in two languages, or a language the recognizer
   does not know and reads as its nearest neighbour. The heading that names the
   language is where the reader sees it is wrong, so that is where it is put
   right: the name looks like the rest of the heading until the pointer rests
   on it, and then like the system's own pop-up button — a ground and the two
   chevrons — because a pop-up is what it opens.

   The list over the original, from the likeliest down:
     the languages the reader chose by hand before, while the app runs — a
     reader of Hungarian texts picks Hungarian once, not every time
     the recognizer's own guesses, where it made any (the language it missed
     is usually its second or third)
     the reader's languages
     the other languages the app has a pack for
     under a heading of its own, the ones without a pack the settings offer
     as not optimised — the languages a reader can learn here are the ones
     worth naming a text in.
   A translation's list is the same without the guesses, less the languages
   already standing in a panel. */

import { element } from "./elements.js";
import { icon } from "./icons.js";
import { SUPPORTED, WITHOUT_PACK, languageLabel } from "../languages/index.js";

/* A name only where the platform has one: a code it cannot name is no
   choice anyone could recognise. */
const nameOf = (code, reader) => {
  const label = languageLabel(code, reader);
  return label && label.toLowerCase() !== code ? label : "";
};

/* Each name looked up once, not at every comparison. */
const alphabetical = (codes, reader) => {
  const compare = new Intl.Collator(reader).compare;
  return codes.map((code) => [code, nameOf(code, reader)])
    .sort(([, a], [, b]) => compare(a, b))
    .map(([code]) => code);
};

/* The groups of the list, as codes; the last one is the languages without a
   pack. `current` is the code standing in the heading ("" where detection
   only found a name); it goes in front where no group holds it, so the list
   always shows what is chosen. `taken` are left out. */
export function languageGroups({ current = "", recent = [], guesses = [], languages = [], reader, taken = [] }) {
  const seen = new Set(taken);
  const take = (codes) => codes.filter((code) => {
    if (!code || seen.has(code) || !nameOf(code, reader)) return false;
    seen.add(code);
    return true;
  });
  const chosen = take(recent);
  const guessed = take(guesses);
  const own = take(languages);
  const rest = take(alphabetical(SUPPORTED, reader));
  const other = take(alphabetical(WITHOUT_PACK, reader));
  if (current && !seen.has(current)) (chosen.length ? chosen : guessed).unshift(current);
  return [chosen, guessed, own, rest, other];
}

/* The list as a select: the groups apart, the last under a line of its
   own that names it — greyed, not a choice, and the languages under it not
   set in as an optgroup would set them. */
export function languageList(groups, { current, name, reader, text }) {
  const list = element("select");
  const last = groups.length - 1;
  let drawn = 0;
  groups.forEach((group, index) => {
    if (!group.length) return;
    const option = (code) => {
      const item = element("option", null, code === current && !nameOf(code, reader) ? name : nameOf(code, reader));
      item.value = code;
      return item;
    };
    if (drawn) list.append(element("hr"));
    if (index === last) {
      const heading = element("option", null, text.languagesOther);
      heading.disabled = true;
      heading.value = "";
      list.append(heading);
    }
    list.append(...group.map(option));
    drawn++;
  });
  return list;
}

/* A heading's language as the system's pop-up button: the name as the
   heading writes it, two chevrons and a ground only under the pointer, and a
   select lying over it that opens the system's own list. The reading's
   heading and the card's word side use this one, so the two look and behave
   alike. The holder is handed in; `label` is the word shown on hover. */
export function popupChoice(holder, { name, list, label }) {
  const shown = element("span", "language-name", name);
  const chevrons = icon("choose");
  chevrons.classList.add("chevrons");
  list.setAttribute("aria-label", label);
  /* Opened with the pointer, the list keeps the focus after its menu
     closes, and WebKit counts that as focus to be shown: the ground stayed
     on until the reader clicked elsewhere. Only a key shows it. */
  list.addEventListener("mousedown", () => holder.classList.add("by-pointer"));
  list.addEventListener("keydown", () => holder.classList.remove("by-pointer"));
  list.addEventListener("change", () => list.blur());
  holder.classList.add("language-choice");
  holder.replaceChildren(shown, chevrons, list, element("span", "pill-label", label));
  return shown;
}

/* The heading's language, as a node. `name` is what stands there; `current`
   its code. onChoose gets the code the reader picked, never the one already
   standing there. */
export function languageChoice({ name, current = "", recent, guesses, languages, reader, text, onChoose }) {
  const holder = element("span");
  holder.dir = "auto";
  const list = languageList(languageGroups({ current, recent, guesses, languages, reader }), { current, name, reader, text });
  if (!current) {
    /* Detection found a name and no code: it stands first, as itself. */
    const found = element("option", null, name);
    found.value = "";
    list.prepend(found);
  }
  list.value = current;
  list.addEventListener("change", () => {
    const picked = list.value;
    list.value = current;
    if (picked && picked !== current) onChoose(picked);
  });
  popupChoice(holder, { name, list, label: text.sourceLanguage });
  return holder;
}

/* A translation's language, as a node, in the same look; `taken` are the
   languages of every panel, its own among them. */
export function targetChoice({ name, current, recent = [], languages = [], taken = [], reader, text, label, onChoose }) {
  const holder = element("span");
  holder.dir = "auto";
  const list = languageList(languageGroups({ recent, languages, reader, taken }), { current, name, reader, text });
  /* What stands there first, as in the list over the original. */
  const standing = element("option", null, name);
  standing.value = current;
  list.prepend(standing, element("hr"));
  list.value = current;
  list.addEventListener("change", () => {
    const picked = list.value;
    list.value = current;
    if (picked && picked !== current) onChoose(picked);
  });
  popupChoice(holder, { name, list, label });
  return holder;
}

/* The symbol in the heading of the one translation that adds a second:
   a list of the same languages lying over it, and its word on hover, the
   way every symbol on the sheet has. */
export function addChoice({ recent = [], languages = [], taken = [], reader, text, onChoose }) {
  const holder = element("span", "language-choice add-language");
  const list = languageList(languageGroups({ recent, languages, reader, taken }), { current: "", name: "", reader, text });
  /* Nothing chosen: an entry for that would stand in the system's menu,
     which shows hidden ones too, so any pick is a change. */
  list.selectedIndex = -1;
  list.setAttribute("aria-label", text.addLanguage);
  list.addEventListener("mousedown", () => holder.classList.add("by-pointer"));
  list.addEventListener("keydown", () => holder.classList.remove("by-pointer"));
  list.addEventListener("change", () => {
    const picked = list.value;
    list.selectedIndex = -1;
    list.blur();
    if (picked) onChoose(picked);
  });
  holder.append(icon("addPanel"), list, element("span", "pill-label", text.addLanguage));
  return holder;
}

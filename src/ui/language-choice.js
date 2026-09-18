/* The language of the original, where the reader can say it is another one.

   Detection is right about sentences and wrong now and then about a single
   word written the same way in two languages, or a language the recognizer
   does not know and reads as its nearest neighbour. The heading that names the
   language is where the reader sees it is wrong, so that is where it is put
   right: the name looks like the rest of the heading until the pointer rests
   on it, and then like the system's own pop-up button — a ground and the two
   chevrons — because a pop-up is what it opens.

   The list, from the likeliest down:
     the languages the reader chose by hand before, while the app runs — a
     reader of Hungarian texts picks Hungarian once, not every time
     the recognizer's own guesses, where it made any (the language it missed
     is usually its second or third)
     the reader's languages
     the other languages the app has a pack for
     "Other language…", which turns the name into a field with every language
     that has a two-letter code, named by the platform in the reader's
     language — a text in Persian read as Arabic has nowhere else to go. */

import { element } from "./elements.js";
import { icon } from "./icons.js";
import { SUPPORTED, languageLabel } from "../languages/index.js";
import { ISO_639_1 } from "../languages/iso639.js";

export const OTHER = "other";

/* A name only where the platform has one: a code it cannot name is no
   choice anyone could recognise. */
const nameOf = (code, reader) => {
  const label = languageLabel(code, reader);
  return label && label.toLowerCase() !== code ? label : "";
};

/* The groups of the list, as codes. `current` is the code standing in the
   heading ("" where detection only found a name); it goes in front where no
   group holds it, so the list always shows what is chosen. */
export function languageGroups({ current = "", recent = [], guesses = [], languages = [], reader }) {
  const seen = new Set();
  const take = (codes) => codes.filter((code) => {
    if (!code || seen.has(code) || !nameOf(code, reader)) return false;
    seen.add(code);
    return true;
  });
  const chosen = take(recent);
  const guessed = take(guesses);
  const own = take(languages);
  const rest = take(SUPPORTED.slice()
    .sort((a, b) => nameOf(a, reader).localeCompare(nameOf(b, reader), reader)));
  if (current && !seen.has(current)) (chosen.length ? chosen : guessed).unshift(current);
  return [chosen, guessed, own, rest].filter((group) => group.length);
}

/* Every language that has a two-letter code and a name, alphabetical in the
   reader's language, for the field "Other language…" turns into. */
export function everyLanguage(reader) {
  return ISO_639_1
    .map((code) => ({ code, name: nameOf(code, reader) }))
    .filter((entry) => entry.name)
    .sort((a, b) => a.name.localeCompare(b.name, reader));
}

/* What was typed into that field, as a code: a name as the list writes it,
   in any case, or a code itself. Nothing recognisable is "". */
export function languageFromName(typed, reader) {
  const wanted = String(typed || "").trim().toLowerCase();
  if (!wanted) return "";
  const found = everyLanguage(reader).find((entry) =>
    entry.name.toLowerCase() === wanted || entry.code === wanted);
  return found ? found.code : "";
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

  const showList = () => {
    const list = element("select");
    languageGroups({ current, recent, guesses, languages, reader }).forEach((group, index) => {
      if (index) list.append(element("hr"));
      for (const code of group) {
        const option = element("option", null, code === current && !nameOf(code, reader) ? name : nameOf(code, reader));
        option.value = code;
        list.append(option);
      }
    });
    if (!current) {
      /* Detection found a name and no code: it stands first, as itself. */
      const found = element("option", null, name);
      found.value = "";
      list.prepend(found);
    }
    list.append(element("hr"));
    const other = element("option", null, text.otherLanguage);
    other.value = OTHER;
    list.append(other);
    list.value = current;

    list.addEventListener("change", () => {
      const picked = list.value;
      list.value = current;
      if (picked === OTHER) showField();
      else if (picked && picked !== current) onChoose(picked);
    });
    holder.classList.remove("searching");
    popupChoice(holder, { name, list, label: text.sourceLanguage });
  };

  const showField = () => {
    const field = element("input", "language-search");
    field.type = "text";
    field.spellcheck = false;
    field.placeholder = text.findLanguage;
    field.setAttribute("aria-label", text.findLanguage);
    const listId = "every-language";
    field.setAttribute("list", listId);
    const names = element("datalist");
    names.id = listId;
    for (const entry of everyLanguage(reader)) {
      const option = element("option");
      option.value = entry.name;
      names.append(option);
    }
    let done = false;
    const finish = (code) => {
      if (done) return;
      done = true;
      if (code && code !== current) onChoose(code);
      else showList();
    };
    /* A name picked from the suggestions arrives as a change of the value;
       one typed out is taken on Enter. */
    field.addEventListener("input", () => {
      const code = languageFromName(field.value, reader);
      if (code && everyLanguage(reader).some((entry) => entry.name === field.value)) finish(code);
    });
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const code = languageFromName(field.value, reader);
        if (code) finish(code);
      } else if (event.key === "Escape") {
        /* The field's own way out, not the window's. */
        event.preventDefault();
        event.stopPropagation();
        finish("");
      }
    });
    field.addEventListener("blur", () => finish(""));
    holder.classList.add("searching");
    holder.replaceChildren(field, names);
    queueMicrotask(() => field.focus());
  };

  showList();
  return holder;
}

/* The few shapes the window is built from. Nothing here knows what the app
   does; it only knows what a section and a labelled field look like. */

import { icon } from "./icons.js";

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* A section: its heading outside, the box under it.

   The heading stands above the box rather than inside it. Six sections nest
   otherwise — a frame inside a frame — and the eye has to work out which
   heading belongs to which content instead of reading down the column.

   status is the quiet word at the right end of the heading line, saying what
   this section is doing right now.

   plain is for the sections below the translations. Those hold a list and no
   box, so what they say while they work, and what they say when they found
   nothing, is a sentence and not a box either — a frame that appears only
   while a section is empty frames the one moment there is nothing to frame.

   name is how the window finds a section again once it is drawn. Only the one
   that has to be found carries it.

   bare is for the one section whose heading is not in the sheet at all: the
   original's heading line stands above the sheet, because it carries the
   window's own buttons and they may not scroll away with the text. */
export function pane({ title, status, body, rows, muted, plain, bare, name }) {
  const section = element("section", "pane");
  if (name) section.dataset.section = name;

  if (!bare) {
    const label = element("div", "label");
    label.append(element("span", "name", title));
    label.append(element("span", "status", status || ""));
    section.append(label);
  }

  const frame = element("div", "frame");
  const classes = ["box"];
  if (rows) classes.push("rows");
  if (plain) classes.push("plain");
  if (muted) classes.push("muted");
  const box = element("div", classes.join(" "));
  if (body !== undefined) box.textContent = body;
  frame.append(box);
  section.append(frame);
  return section;
}

/* The one line under the panels where there is no model, saying what one
   would add. The sections a model fills are not drawn at all then: a row of
   empty areas says three times over what one sentence says once. */
export function lockedNote(text) {
  return element("p", "hint locked-note", text.lockedHow);
}

/* A heading inside the settings, above the rows it belongs to. Nine rows in
   one column is a list, not a form; four short groups can be skimmed. */
export function group(title) {
  return element("h2", "group", title);
}

/* A settings row: label, control, and one line saying what the setting is
   for. Every setting is a decision pushed onto someone, so each one says why
   it is worth their attention. */
export function field({ label, lead, hint, control }) {
  const row = element("div", "field");
  row.append(element("label", null, label));
  /* What the setting does, where it has to be read before the control is
     touched rather than after. */
  if (lead) row.append(element("p", "hint", lead));
  row.append(control);
  if (hint) row.append(element("p", "hint", hint));
  return row;
}

export function select(options, value) {
  const node = element("select");
  for (const option of options) {
    const item = element("option", null, option.label);
    item.value = option.value;
    if (option.value === value) item.selected = true;
    node.append(item);
  }
  return node;
}

export function textInput(value, placeholder) {
  const node = element("input");
  node.type = "text";
  node.value = value || "";
  node.spellcheck = false;
  if (placeholder) node.placeholder = placeholder;
  return node;
}

/* A field for something that must not be read over a shoulder. It shows a
   placeholder rather than a value: what is stored is never put back into the
   window, so there is nothing here to read out. */
export function secretInput(placeholder) {
  const node = element("input");
  node.type = "password";
  node.value = "";
  node.spellcheck = false;
  node.autocomplete = "off";
  if (placeholder) node.placeholder = placeholder;
  return node;
}

/* The buttons that sit in a box's top right corner. They act on what the box
   holds, so they belong to it and not to the heading line. */
export function actions(buttons) {
  const box = element("div", "actions");
  for (const button of buttons) box.append(button);
  return box;
}

/* A button in a reading: a square with a symbol in it, and the word it stands
   for one hover away.

   The word is not dropped, it moves. It is the button's accessible name, and
   the page shows it under the button while the pointer rests there — so a
   symbol that says nothing to somebody is a question with an answer, not a
   guess. No `title` beside it: macOS draws one of its own, a second later and
   somewhere else, and one button may only give one answer. What that buys is room: a column of two written
   buttons set the height of every verb and term row and took up to 160 px of
   width away from the text beside it. Squares of one size always fit side by
   side, so neither is true any more.

   Called without a symbol it is an ordinary written button — which is what
   `reportOn` below still has to answer for: the settings window builds its
   buttons by hand and hands them to it. */
export function button(label, onClick, name) {
  const node = element("button", "pill");
  if (name) {
    node.classList.add("icon");
    node.dataset.icon = name;
    /* The word is the label under the button and the name for anything
       reading the window rather than looking at it. */
    node.setAttribute("aria-label", label);
    node.append(icon(name));
    node.append(element("span", "pill-label", label));
  } else {
    node.textContent = label;
  }
  node.addEventListener("click", () => onClick(node));
  return node;
}

/* Every symbol button in `root` shows its label above itself where the label
   would run past the bottom of what clips it — the sheet that scrolls, or the
   window. Asked as the pointer arrives or the focus does, because where a
   button stands changes with every scroll and every resize. */
export function labelsInside(root) {
  const place = (event) => {
    const node = event.target.closest?.(".icon");
    const label = node?.querySelector(".pill-label");
    if (!label) return;
    const clip = node.closest(".sheet")?.getBoundingClientRect().bottom ?? window.innerHeight;
    const bottom = Math.min(clip, window.innerHeight);
    const below = node.getBoundingClientRect().bottom + 5 + label.offsetHeight;
    node.classList.toggle("label-above", below > bottom - 2);
  };
  root.addEventListener("mouseover", place);
  root.addEventListener("focusin", place);
}

/* A button that says what happened and then goes back to its label.

   Two kinds of button end up here. A written one — the settings are full of
   them — swaps its word, and wider words would make the row jump, so the
   width is pinned before it changes. A symbol one has no room for a word at
   all: it shows a tick instead, and the word it would have shown goes into
   the label that appears on hover, where a reader who wants to know what just
   happened will look. */
export async function reportOn(node, work, done) {
  const told = (word, symbol) => {
    const tag = node.querySelector(".pill-label");
    if (!tag) {
      node.textContent = word;
      return;
    }
    tag.textContent = word;
    node.setAttribute("aria-label", word);
    node.querySelector("svg")?.replaceWith(icon(symbol));
  };

  const label = node.querySelector(".pill-label")?.textContent ?? node.textContent;
  const symbol = node.dataset.icon;
  if (!node.classList.contains("icon")) node.style.minWidth = `${node.offsetWidth}px`;
  /* Not pressable while it is answering, but not faded either: what it is
     showing for this moment and a half is the answer, and the rule that
     dims a button with nothing to do would dim exactly that. */
  node.classList.add("reporting");
  node.disabled = true;
  try {
    await work();
    told(done, "done");
  } catch (error) {
    /* A failure keeps the button's own symbol — a tick would say the opposite
       of what happened. What it gets instead is the reason, shown the way the
       label is shown, and a colour that does not need reading. */
    told((error && error.message) || String(error), symbol);
    node.classList.add("failed");
  }
  setTimeout(() => {
    told(label, symbol);
    node.classList.remove("failed", "reporting");
    node.disabled = false;
  }, 1400);
}

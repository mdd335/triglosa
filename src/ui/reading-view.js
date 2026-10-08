/* Drawing one reading: the panels, the verbs, the terms, the picked word.

   Called again for every piece that arrives, so it has to be cheap to run and
   must not lose a selection the reader made.

   Every section is a heading line with a box under it, and the order follows
   the original: the original text, the translations, then the picked word,
   verbs and terms. */

import { differsFromLookup, fragmentsForPanel, fragmentsForSentence, selectionForPanel } from "../highlights.js";
import { explanationsAvailable, showsSection } from "../settings.js";
import { entryCard, markedCard, readingCard, termCard, verbCard } from "../card.js";
import { bareInfinitive, citationForm, languageLabel, languagePack, writingDirection } from "../languages/index.js";
import { languageChoice } from "./language-choice.js";
import { creditLine, faultText, labels } from "./labels.js";
import { actions, button, element, lockedNote, pane, reportOn } from "./elements.js";
import { markLine, markPanel, markGroups } from "./marking.js";
import { watchSelection } from "./selection.js";
import { roomForExample } from "../examples.js";

/* An abbreviation is drawn like a verb form: word, arrow, then the expansion,
   with the caveat greyed out in between and the translation behind it.
   Without an expansion there is nothing to draw, and the ordinary equivalent
   stands instead. */
function showAbbreviation(main, abbreviation) {
  if (!abbreviation || !abbreviation.expansion) return false;
  main.append(element("span", "arrow", "→"));
  if (abbreviation.caveat) main.append(element("span", "arrow", abbreviation.caveat));
  main.append(element("span", "base", abbreviation.expansion));
  if (abbreviation.translation) {
    main.append(element("span", "equivalent", abbreviation.translation));
  }
  return true;
}

/* The italic equivalent beside a term, where it says something the term does
   not. A proper name, a product, a number are their own translation — "1978",
   "Terminal-Bench v2" — and repeating them in italics beside themselves reads
   as if the two were different words. */
function showEquivalent(head, terms, meaning) {
  const bare = (value) => String(value || "").replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
  if (!meaning) return;
  if ([].concat(terms).some((term) => term && bare(term) === bare(meaning))) return;
  head.append(element("span", "equivalent", meaning));
}

/* A row has two parts, and they answer to different widths. `head` is the
   first line — the form, its base, the equivalent, the grammar — and it is
   the only part that keeps clear of the buttons. Everything under it, the
   explanations and the examples, goes into `main` and runs the full width of
   the panel: the buttons are one line tall, and a column of white kept free
   beside eight lines of explanation costs a fifth of the sheet. */
function newRow(shade) {
  const line = element("div", "row");
  /* What the hover in the text hangs on. */
  if (shade) line.dataset.hl = shade;
  const main = element("div", "row-main");
  const head = element("div", "row-head");
  main.append(head);
  line.append(main);
  return { line, main, head };
}

/* The buttons of one row. They are squares of one size, so they sit side by
   side whatever the row holds — a verb with an explanation under it and a
   one-line dictionary entry take the same rail.

   They lie over the row rather than in it, so only the first line has to
   make room. How much room is arithmetic rather than a measurement: as many
   squares as there are buttons, with the gap between them. */
const BUTTON = 24;
const BUTTON_GAP = 4;
function rowActions(line, buttons) {
  const box = element("div", "row-actions");
  for (const entry of buttons.filter(Boolean)) box.append(entry);
  if (!box.children.length) return;
  const count = box.children.length;
  line.style.setProperty("--actions", `${count * BUTTON + (count - 1) * BUTTON_GAP}px`);
  line.append(box);
}

/* Putting a translation into whichever program is in front once the window
   is out of the way — where there is a selection there, it is replaced. Not
   offered outside the app, where there is no other program to reach. The
   window hides itself on the way — see app.js. */
function insertButton(tools, text, value) {
  if (!tools.insert || !value) return null;
  return button(text.insert, (node) =>
    reportOn(node, () => tools.insert(value), text.inserted), "insert");
}

/* The way from a row to a flashcard. It opens the card rather than filing it
   anywhere: what the three fields say is worth seeing and correcting before
   it becomes a card, and it is worth having whether or not anything is
   installed to receive it.

   Not offered where the word is already in the reader's own language —
   nobody learns vocabulary they are reading the explanation in. Which
   language decides is the word's, not the text's. */
function cardButton(tools, text, wordLanguage, build) {
  if (!tools.card || !tools.cardFor(wordLanguage)) return null;
  return button(text.card, () => tools.card(build()), "card");
}

/* The looked-up words as a verb, where the term below them is that verb
   and nothing more: the entry's card is then a verb's. */
function lookedUpVerb(state) {
  const word = state.words?.[0];
  if (!word?.verb || differsFromLookup(state, word)) return null;
  return { ...word.verb, meaning: word.meaning, note: word.note };
}

/* A lookup's one term in the app's accent; a longer text's three apart. */
const termShade = (state) => (state.short ? "tmark" : "wmark");

/* One panel's text with the difficult words marked in it. The same for the
   original and for a translation — which fragments land where is the only
   difference, and highlights.js has already worked that out. */
function markSource(body, state, index, settings, codes) {
  const parts = fragmentsForPanel(state, index);
  /* A section folded away takes its markings with it: a line under a word
     points at a row, and a row that cannot be seen points nowhere. Left out
     rather than hidden, so a spot the other section gave way for is its own
     again. */
  const away = (key) => !!state.folded?.has(key);
  markPanel(
    body,
    state.panels[index].text,
    markGroups(away("terms") ? [] : parts.words, termShade(state), parts.near?.words)
      .concat(markGroups(away("verbs") ? [] : parts.verbs, "vmark", parts.near?.verbs)),
    /* The picked word's frame is the reader's own act and stays; its spots
       in the other panels point at the area, and go with it. */
    away(MARKED) && state.selection?.panel !== index
      ? null
      : selectionForPanel(state, index, settings.languages),
    codes,
    state.selection?.panel === index && !state.selection.inSentence,
  );
  /* A panel holds one language, so the direction is a property of the panel
     and not of anything inside it. Arabic marked up this way keeps its
     punctuation, its digits and a Latin word quoted in it in the right place
     - the browser's bidi algorithm does that once it is told which way round
     the paragraph runs, and left to guess it gets a sentence starting with a
     quotation mark wrong. The interface around the panel is never
     right-to-left: the first language is German or English. */
  body.dir = writingDirection(state.panels[index].code || state.panels[index].iso);
  /* Which panel this is, for the hover: the panels are rebuilt at any time,
     and what lies under the pointer is found again by it. */
  body.dataset.panel = String(index);
  /* The line off and nothing else: the spans stay, so a row under the
     pointer still lights its words up. */
  body.classList.toggle("unlined", settings.underline === false);
}

/* The original text, in the one place it ever stands.

   Reading and writing it are two states of the same box, never two boxes
   under one another: what the reader corrects has to be what gets translated,
   and a field above a panel showing something else invites exactly that
   mistake. Reading, the difficult words are marked in it and a word can be
   picked out of it. Writing, there is a caret in it and nothing else.

   The one button beside it names the way out of the state it is in —
   "Translate" while it is being written, "Edit" once it has been read — so it
   keeps its place and only changes its word. */
/* What the line above the sheet says. The language is a finding about what
   stands there, so it goes as soon as the text is being changed: what the
   heading said a moment ago is not necessarily true of what is being typed
   now. */
/* A panel's language as its heading names it: by its code where the app
   knows one — a language the reader chose has one even without a pack —
   and otherwise by the name the run found. */
/* A model as a person would name it: without the provider in front
   ("deepseek/deepseek-v4.1-flash" is "deepseek-v4.1-flash"). */
const modelName = (model) => String(model || "").split("/").pop();

/* The ones a hint names (labels.js, `creditLine`). */
const TRIGLOSA = { kind: "triglosa" };
const theModel = (model) => ({ kind: "model", name: modelName(model) });
/* Who placed a section's rows in the translations, from what the run noted. */
const placedBy = (by, model) => ({ aligner: [TRIGLOSA], model: [theModel(model)], both: [TRIGLOSA, theModel(model)] })[by] || [];
/* A section's hint: who explained its rows and who placed them. */
const sectionCredit = (text, model, by) => creditLine(text, [["explained", [theModel(model)]], ["assigned", placedBy(by, model)]]);

function panelName(entry, reader) {
  return (entry.code && languageLabel(entry.code, reader))
    || (entry.iso && languageLabel(entry.iso, reader))
    || entry.name || entry.code;
}

/* The line above the sheet, with the language as something to choose where
   the window can act on a choice. Rebuilt only when what it says changes: it
   is drawn again with every answer that arrives, and a list the reader has
   open, or a name they are typing, would go with it. */
export function renderHeading(node, state, { text, settings, editing, onLanguage, recent = [] }) {
  const reader = settings.languages[0];
  const first = state?.panels?.[0];
  const name = !editing && first ? panelName(first, reader) || text.unknownLanguage : "";
  const current = first ? (first.code || first.iso || "") : "";
  const guesses = state?.source?.guesses || [];
  /* Who named the language, for a pointer resting on the heading, the way
     a translation's heading says who wrote it. */
  const namedBy = { text: [TRIGLOSA], device: [{ kind: "device" }], model: [theModel(state?.source?.model)], reader: [{ kind: "reader" }] }[state?.source?.by];
  /* And who said which word became which, for the hover. */
  const matchedBy = state?.glance?.sentences ? placedBy(state.glance.by, state.model) : [];
  const source = name && current ? creditLine(text, [["detected", namedBy], ["words", matchedBy]]) : "";
  const key = JSON.stringify([text.original, text.sourceLanguage, name, current, recent, guesses, settings.languages, !!onLanguage, source]);
  if (node.dataset.key === key) return;
  node.dataset.key = key;
  if (!name) {
    node.replaceChildren(element("span", "name", text.original));
    return;
  }
  const original = element("span", "name", `${text.original} ·`);
  const language = onLanguage
    ? languageChoice({ name, current, recent, guesses, languages: settings.languages, reader, text, onChoose: onLanguage })
    : element("span", "name", name);
  node.replaceChildren(original, language);
  if (!source) return;
  /* Under the word "Original", where a button's label hangs: over the
     title line's own row it had no room it could count on. */
  node.append(element("span", "pill-label heading-note", source));
}

function originalHeading(text, language, editing) {
  const name = editing ? "" : language;
  return name ? `${text.original} · ${name}` : text.original;
}

function originalPane({ text, tools, edit, entry, marked, onPick, card, aloud, lookedUpIn, sentences, onSentence }) {
  /* Headless: this section's heading is the line above the sheet, which holds
     the window's buttons and therefore cannot scroll away with the text. */
  const section = pane({ bare: true });
  const frame = section.querySelector(".frame");
  const box = section.querySelector(".box");

  if (edit.editing) {
    box.classList.add("writing");
    box.append(draftField(text, edit));
    /* Named, like the field, so scripts/shot.mjs can press it. */
    const go = button(text.translateKeys, () => edit.onTranslate(), "translate");
    go.id = "translate";
    frame.append(actions([go]));
    return section;
  }

  marked(box);
  if (onPick) watchSelection(box, 0, onPick);
  if (lookedUpIn) box.after(sentenceLine(lookedUpIn, onPick));
  if (sentences?.back) section.prepend(neighbourLine(text.previousSentence, "↑", sentences.back, entry, () => onSentence(-1)));
  if (sentences?.next) section.append(neighbourLine(text.nextSentenceLine, "↓", sentences.next, entry, () => onSentence(1)));
  frame.append(actions([
    button(text.edit, () => edit.onEdit(), "edit"),
    /* A looked-up word is said aloud like a row's; a longer text is read,
       not listened to. */
    aloud ? speakButton(tools, text, entry?.code, entry?.text) : null,
    button(text.copy, (node) =>
      reportOn(node, () => tools.copy(entry ? entry.text : edit.draft), text.copied), "copy"),
    /* In short mode the reading is a word, and a word in a language being
       learned is exactly the card worth keeping. Only there: a paragraph is
       not a vocabulary item, and the rows underneath are where its words
       are. */
    card ? cardButton(tools, text, entry?.code, card) : null,
  ].filter(Boolean)));
  return section;
}

/* The sentence a short text was looked up in, under it, quieter than
   anything else on the sheet, the text itself lifted out: what the first
   line of the entry is the meaning in. */
/* Its words can be picked like a panel's, and a word picked there is asked
   about in the sentence; the pick says where it came from, or its place
   would be read in the original. */
function sentenceLine({ text: sentence, start, end, selection, terms, codes }, onPick) {
  const line = element("p", "looked-up-in");
  line.dir = "auto";
  markLine(line, sentence, { start, end }, selection ? [selection] : null, terms, codes);
  if (onPick) watchSelection(line, 0, (choice) => onPick({ ...choice, inSentence: true }));
  return line;
}

/* The sentence before or after the one read, in the text it was read out
   of: outside the field, since it is not about the text in it, as small as
   the sentence a word was looked up in, and one line whatever its length.
   Pressed, it is read in the place of the one on screen. */
function neighbourLine(label, arrow, sentence, entry, onStep) {
  const line = element("button", "neighbour");
  line.type = "button";
  line.setAttribute("aria-label", label);
  const words = element("span", "", sentence.replace(/\s+/g, " "));
  words.dir = entry?.code ? writingDirection(entry.code) : "auto";
  line.append(element("span", "", arrow), words);
  line.addEventListener("click", onStep);
  return line;
}

/* The field itself. It grows with what is typed into it rather than scrolling
   inside a fixed height — the window scrolls as a whole, and a box that keeps
   its own scrollbar hides the end of a text the reader is about to send off.

   Its id is how the window finds it again to put the caret in it, and it is
   what scripts/shot.mjs types into. */
function draftField(text, edit) {
  const field = element("textarea");
  field.id = "draft";
  field.spellcheck = false;
  /* Typed text has no language yet - the language is a finding, and the
     finding comes after the translation. `auto` lets the first strong
     character decide, which is the same rule a reader applies. */
  field.dir = "auto";
  field.placeholder = text.placeholder;
  field.value = edit.draft;
  /* Zero first, not `auto`: a textarea's automatic height is two rows,
     whatever is in it, so the measurement came back 58 px for a one-line text
     and the box grew by a fifth of itself the moment Edit was pressed. Flat
     on the floor it can only report what its content needs, and the floor
     itself is the height the same line stands at while it is being read. */
  const grow = () => {
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  };
  field.addEventListener("input", () => {
    edit.onDraft(field.value);
    grow();
  });
  /* The same combination the whole system uses to send a form off. */
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    edit.onTranslate();
  });
  /* Once, after it is in the document: a height read before that is zero. */
  queueMicrotask(grow);
  return field;
}

/* The word said aloud, as it stands in the text and in its own language —
   the form the reader met, which is the one they want to hear. Only where
   the system has a voice for that language (platform/speech.js), and never
   in the reader's own language, which nobody needs read out to them. */
function speakButton(tools, text, language, words) {
  if (!tools.speak || !words || language === tools.reader || !tools.canSpeak?.(language)) return null;
  return button(text.speak, () => tools.speak(words, language), "speak");
}

function searchButton(tools, text, term) {
  return button(text.search, (node) =>
    reportOn(node, () => tools.search(term), text.opened), "search");
}

/* One button to look a row's word up: a verb's conjugation table, anything
   else on the web — never both. Which language decides is the one the word
   is in, not the one the text is in: a verb clicked in a translation panel
   conjugates in that panel's language. A verb whose language names no
   conjugation site is searched for in its base form, the word a dictionary
   or a forum is written about. */
function lookUpButton(tools, text, language, infinitive, term) {
  if (!infinitive) return searchButton(tools, text, term);
  const bare = bareInfinitive(language, infinitive);
  const address = languagePack(language).conjugationUrl;
  if (!address) return searchButton(tools, text, bare || term);
  return button(text.conjugation, (node) =>
    reportOn(node, () => tools.open(address(bare)), text.opened), "conjugation");
}

function verbRow(verb, index, { text, tools, sourceLanguage, sentence, translation, spotOf, moreOf, onMore, onExample, reader }) {
  const { line, main, head } = newRow("vmark" + (index % 3));
  head.append(element("span", "term mark vmark" + (index % 3), verb.form));
  head.append(element("span", "arrow", "→"));
  head.append(element("span", "base", citationForm(sourceLanguage, verb.infinitive)));
  showEquivalent(head, [verb.form, verb.infinitive], verb.meaning);
  const grammar = [verb.person, verb.tense].filter(Boolean).join(" · ");
  if (grammar) head.append(element("span", "grammar", grammar));
  const more = moreOf("verbs", index);
  moreText(main, more, { text, reader });

  rowActions(line, [
    speakButton(tools, text, sourceLanguage, verb.form),
    moreButton(text, more, onMore && (() => onMore({ kind: "verbs", index, item: verb }))),
    exampleButton(text, more, onExample && (() => onExample({ kind: "verbs", index, item: verb }))),
    lookUpButton(tools, text, sourceLanguage, verb.infinitive, verb.form),
    cardButton(tools, text, sourceLanguage, () =>
      verbCard(verb, { text, sourceLanguage, reader: tools.reader, sentence, translation,
                       spot: spotOf("verbs", index) })),
  ]);
  return line;
}

/* The equivalent falls away where the word is already in the reader's own
   language: a translation would say nothing, and the explanation says it all.
   What decides is the language of the word, not of the source text. The
   exception is an abbreviation — there stands the expansion, and a reader
   needs that in their own language too. */
/* `entryAbove`: a lookup's term that is the looked-up words themselves,
   unmarked above and so unmarked here; its buttons stay. */
function termRow(word, index, { text, tools, sourceLanguage, sentence, translation, spotOf, moreOf, onMore, onExample, reader },
                 { shade = "wmark" + (index % 3), entryAbove = false } = {}) {
  const { line, main, head } = newRow(shade);
  /* A lookup's term that is the looked-up words is marked nowhere above, so
     neither here: no line, and nothing for the pointer to light up. */
  head.append(element("span", entryAbove ? "term" : "term mark " + shade, word.text));
  /* A looked-up verb form (ask.js, lookupVerb): drawn the way a verb row
     is, its base form after an arrow and person and tense for a class. */
  const verb = word.verb;
  if (verb) {
    head.append(element("span", "arrow", "→"));
    head.append(element("span", "base", citationForm(sourceLanguage, verb.infinitive)));
  }
  if (!showAbbreviation(head, word.abbreviation) && sourceLanguage !== tools.reader) {
    showEquivalent(head, [word.text, verb?.infinitive].filter(Boolean), word.meaning);
  }
  const kind = verb ? [verb.person, verb.tense].filter(Boolean).join(" · ") : classLine(text, word.wordClass);
  if (kind) head.append(element("span", "grammar", kind));
  if (word.note) main.append(element("div", "explanation", word.note));
  const more = moreOf("words", index);
  moreText(main, more, { text, reader });

  rowActions(line, [
    speakButton(tools, text, sourceLanguage, word.text),
    moreButton(text, more, onMore && (() => onMore({ kind: "words", index, item: word }))),
    exampleButton(text, more, onExample && (() => onExample({ kind: "words", index, item: word }))),
    lookUpButton(tools, text, sourceLanguage, verb?.infinitive, word.text),
    cardButton(tools, text, sourceLanguage, () => (verb
      ? verbCard({ ...verb, form: word.text, meaning: word.meaning }, { text, sourceLanguage, reader: tools.reader,
                                                                     sentence, translation, spot: spotOf("words", index) })
      : termCard(word, { text, sourceLanguage, reader: tools.reader, sentence, translation,
                         spot: spotOf("words", index) }))),
  ]);
  return line;
}

/* What kind of word it is, in the face person and tense have on a verb:
   "Substantiv · Singular · Femininum". Nothing where nothing was said. */
function classLine(text, wordClass) {
  if (!wordClass?.kind) return "";
  return [wordClass.kind, wordClass.number, wordClass.gender]
    .filter(Boolean)
    .map((name) => text.wordClasses[name] || "")
    .filter(Boolean)
    .join(" · ");
}

/* The picked word. It carries no hue in the text but the colourless frame, so
   the hover points at that instead. */
function markedRow(marked, { text, tools, wordLanguage, sentence, translation, onLookUp, onMore, onExample, reader }) {
  if (marked.passage) return passageRow(marked, { text, tools, wordLanguage, sentence, translation });
  const { line, main, head } = newRow("sel");
  head.append(element("span", "term", marked.text));
  if (marked.infinitive) {
    head.append(element("span", "arrow", "→"));
    head.append(element("span", "base", citationForm(wordLanguage, marked.infinitive)));
  }
  if (!showAbbreviation(head, marked.abbreviation) && wordLanguage !== tools.reader) {
    showEquivalent(head, [marked.text, marked.infinitive], marked.meaning);
  }
  const grammar = [marked.person, marked.tense].filter(Boolean).join(" · ") || classLine(text, marked.wordClass);
  if (grammar) head.append(element("span", "grammar", grammar));
  if (marked.note) main.append(element("div", "explanation", marked.note));
  moreText(main, marked, { text, reader });

  if (marked.synonyms?.length) {
    const box = element("div", "synonyms");
    box.append(element("span", "label", text.synonyms));
    for (const synonym of marked.synonyms) {
      const entry = element("button", "synonym", synonym);
      entry.addEventListener("click", () => onLookUp(synonym, marked));
      box.append(entry);
    }
    main.append(box);
  }

  rowActions(line, [
    speakButton(tools, text, wordLanguage, marked.text),
    moreButton(text, marked, onMore && (() => onMore({ kind: "marked", item: marked }))),
    exampleButton(text, marked, onExample && (() => onExample({ kind: "marked", item: marked }))),
    /* A marked word that is a verb is a verb: the row already says form,
       base, meaning, person and tense the way the verb table does, and it
       gets the same button. */
    lookUpButton(tools, text, wordLanguage, marked.infinitive, marked.text),
    cardButton(tools, text, wordLanguage, () =>
      markedCard(marked, { text, wordLanguage, reader: tools.reader, sentence, translation })),
  ]);
  return line;
}

/* A marked passage: the passage and its translation, drawn the way every
   row's first line is, and nothing else the reader did not mark. Saying it
   aloud, web search and card stay; conjugation, synonyms and the two explanation buttons are
   about a word. */
function passageRow(marked, { text, tools, wordLanguage, sentence, translation }) {
  const { line, head } = newRow("sel");
  head.append(element("span", "term", marked.text));
  showEquivalent(head, [marked.text], marked.meaning);
  rowActions(line, [
    speakButton(tools, text, wordLanguage, marked.text),
    searchButton(tools, text, marked.text),
    cardButton(tools, text, wordLanguage, () =>
      markedCard(marked, { text, wordLanguage, reader: tools.reader, sentence, translation })),
  ]);
  return line;
}

/* The longer explanation of a row, asked for by the reader and never by
   itself: the short note is what most readers want, and the longer one is a
   call of its own. A button in the row's corner until it is asked for; the
   paragraph then reads on under the note. `holder` carries `more` and
   `moreStatus` — the picked word on itself, a verb or a term in the reading. */
function moreText(main, holder, { text, reader }) {
  if (!holder) return;
  if (holder.more) {
    main.append(element("div", "explanation more", holder.more));
  } else if (holder.moreStatus === "working") {
    main.append(element("div", "explanation more muted", text.moreWorking));
  } else if (holder.moreStatus && typeof holder.moreStatus !== "string") {
    main.append(element("div", "explanation more more-fault", faultText(reader, holder.moreStatus)));
  }
  exampleLines(main, holder, { text, reader });
}

/* The examples under a longer explanation, one to a line: they are read one
   against the other — this register against that one — and a paragraph of
   them reads as a single sentence. Each is what kind of use it shows, the
   sentence itself, and its translation behind it. */
function exampleLines(main, holder, { text, reader }) {
  const examples = holder.examples || [];
  const working = holder.exampleStatus === "working";
  const fault = holder.exampleStatus && typeof holder.exampleStatus !== "string"
    ? holder.exampleStatus
    : null;
  if (!examples.length && !working && !fault) return;
  const box = element("div", "examples");
  for (const one of examples) {
    const line = element("div", "example");
    if (one.kind) line.append(element("span", "kind", one.kind));
    line.append(element("span", "sentence", one.sentence));
    if (one.translation) line.append(element("span", "rendering", one.translation));
    box.append(line);
  }
  if (working) box.append(element("div", "example muted", text.exampleWorking));
  if (fault) box.append(element("div", "example example-fault", faultText(reader, fault)));
  main.append(box);
}

function moreButton(text, holder, ask) {
  if (!ask || holder?.more || holder?.moreStatus === "working") return null;
  return button(text.more, () => ask(), "more");
}

/* One more example, asked for and never written by itself. Offered whether or
   not the longer explanation stands there: a reader who wants to see the word
   in a sentence does not want a paragraph first.

   Four is the ceiling, and then the button goes: a reader who wants more
   than four sentences about one word wants a dictionary.

   While one is being written the button stays where it is and does nothing:
   a button that vanishes under the pointer on every press and comes back a
   second later looks like something broke. */
function exampleButton(text, holder, ask) {
  if (!ask || !roomForExample(holder?.examples)) return null;
  const working = holder?.exampleStatus === "working";
  const node = button(text.addExample, () => { if (!working) ask(); }, "example");
  if (working) node.setAttribute("aria-busy", "true");
  return node;
}

/* Short mode: the panels hold a dictionary entry instead of a sentence. Each
   line is one translation with a note on register or region, and it can be
   copied straight out — which of three words to use is the question, and the
   line the reader picks is the answer.

   Its words can be picked like those of a sentence: a translation of one
   word is as likely to be the word worth asking about as the word itself. */
function alternativeRow(item, { text, tools, panelLanguage, sentence, sourceLanguage, readerAlternatives, selection, onPick, here }) {
  const { line, head } = newRow("");
  const term = element("span", "term");
  markPanel(term, item.text, [], selection, [panelLanguage].filter(Boolean));
  term.dir = writingDirection(panelLanguage);
  watchSelection(term, 0, onPick);
  head.append(term);
  /* The meaning there says what it is instead of its note, which beside
     the sentence says little more than "usual". */
  if (here) head.append(element("span", "grammar here", text.inSentence));
  else if (item.note) head.append(element("span", item.gloss ? "grammar gloss" : "grammar", item.note));
  rowActions(line, [
    speakButton(tools, text, panelLanguage, item.text),
    insertButton(tools, text, item.text),
    button(text.copy, (node) =>
      reportOn(node, () => tools.copy(item.text), text.copied), "copy"),
    /* Which language the card is worth making in is the panel's, not the
       text's: a reader who types a word of their own language to find out how
       to say it in Spanish is looking at exactly the card worth keeping, and
       judged by the text it would be refused as their own language. */
    cardButton(tools, text, panelLanguage, () =>
      entryCard(item, { panelLanguage, reader: tools.reader, sentence, sourceLanguage, readerAlternatives })),
  ]);
  return line;
}

/* Stepping through the words one synonym led to another, the way the title
   bar steps through the kept readings — the same two chevrons, at the right
   end of the area's heading line. Not there until a synonym has been
   clicked: before that there is nowhere to step to. Going back costs no call,
   the entries are all still here. */
function trailButtons(area, state, text, onStep) {
  const trail = state.markedTrail;
  if (!trail || !onStep) return;
  const at = state.markedPlace;
  const back = button(text.synonymBack, () => onStep(-1), "previous");
  const forward = button(text.synonymForward, () => onStep(1), "next");
  back.disabled = at <= 0;
  forward.disabled = at >= trail.length - 1;
  const steps = element("div", "trail");
  steps.append(back, forward);
  area.querySelector(".label").append(steps);
}

/* The one section the window has to be able to find again after it is drawn:
   the answer to a clicked word, which the reader has to be shown. */
export const MARKED = "marked";

/* A translation, the verbs, the terms or the picked word folded away. A long
   text makes a long sheet, and a reader comparing it with one translation can
   put the rest out of the way. Kept with the reading (`state.folded`), so one
   stepped back to is as it was left; a new reading starts from the last fold
   and a new pick opens the picked word's area again (app.js). The
   window redraws on a fold, because the sections take their markings in the
   panels with them. */
function foldButton(box, key, { state, text, onFold }) {
  const heading = box.querySelector(".label .name");
  if (!heading || !onFold || box.classList.contains("empty")) return;
  const away = !!state.folded?.has(key);
  box.classList.toggle("folded", away);
  const fold = button(away ? text.unfoldPanel : text.foldPanel, () => onFold(key),
    away ? "next" : "open");
  fold.classList.add("fold");
  heading.after(fold);
}

/* One of the sections below the panels. It is visible in every state, because
   an area that disappears while it works reads as one that will never fill.

   The one state it is not visible in is the one where it was never asked
   for. Answers nothing then, and the caller draws no section at all — a
   reading made while the section was switched off has no answer in it and
   never will, so an area standing at "…" would be waiting for something
   nobody is working on. That happens the moment the reader switches a
   section on: the reading on screen was made without it. */
function section({ title, status, rows, empty, text, name, busy, reader, runFault, credit = "" }) {
  const working = status === "working" || status === "linking";
  /* What the run put there is either one of its own words for a state or a
     fault — an object with no words in it at all.

     A fault says only that nothing came. The reason belongs to the run and
     not to this section: with a dead endpoint the panels, the verbs and the
     terms all fail on the same address, and the window says why once, under
     the sheet. The one exception is the picked word. That is the
     answer to something the reader has just this moment done, its area is the
     only place on the sheet that can say anything about it, and it belongs to
     no run — so it carries the whole sentence itself, unless the line under
     the sheet already says the same thing. */
  const sayWhy = name === MARKED && status?.kind !== runFault?.kind;
  const note = working
    ? (status === "linking" ? text.linking : text.searching)
    : status && typeof status !== "string"
    ? (sayWhy ? faultText(reader, status) : text.noAnswer)
    : status;

  /* Rows already found stay on screen while the assignment runs: the meanings
     are readable long before the colours arrive. */
  if (rows && rows.length) {
    /* Once the rows stand, who made them: for a pointer resting on the
       section's name, as a panel says who translated it. */
    const box = pane({ title, status: working ? note : credit, rows: true, name });
    if (!working && credit) box.querySelector(".label .status").classList.add("on-hover");
    const body = box.querySelector(".box");
    for (const line of rows) body.append(line);
    return box;
  }

  /* Searching is one line too, the way nothing found is: the area has nothing
     in it yet either, and a box holding "…" under a heading that says it is
     searching said the same thing twice. The picked word keeps its box — it
     is the answer to a click and holds its place for it. */
  const waiting = name !== MARKED;
  if (working) {
    if (waiting) return oneLine(title, name, note);
    return pane({ title, status: note, body: "…", muted: true, plain: true, name });
  }
  if (status) return pane({ title, body: note, muted: true, plain: true, name });
  if (!rows) {
    if (!busy) return null;
    if (waiting) return oneLine(title, name, "…");
    return pane({ title, body: "…", muted: true, plain: true, name });
  }
  /* Nothing found is one line, the sentence beside the heading, and nothing
     to fold: a section with nothing in it has nothing to put away. */
  return oneLine(title, name, empty);
}

function oneLine(title, name, words) {
  const line = pane({ title, name });
  line.classList.add("empty");
  line.querySelector(".frame").remove();
  line.querySelector(".label .name").after(element("span", "empty-note", words));
  return line;
}

/* Answers with what the line above the sheet has to say — the heading of the
   original, which is drawn there rather than here. */
export function renderReading(sheet, state, handlers) {
  return draw(sheet, state, handlers);
}

function draw(sheet, state, { settings, tools, edit, onPick, onLookUp, onStep, onFold, onMore, onExample, sentences, onSentence }) {
  const text = labels(settings.languages[0]);
  sheet.textContent = "";

  /* Nothing read yet: a first start, a text still being typed, or a run that
     came to nothing. The original field stands either way — it is the field
     the reader writes in — and under it the areas a model would fill, so that
     what is missing can be missed. */
  if (!state || !state.panels.length) {
    /* The sentences around it stand from the first moment of a step: gone
       while the language is being found, they came back a second later
       under a pointer that had meant to press again. */
    sheet.append(originalPane({ text, tools, edit, sentences, onSentence, marked: (box) => {
      box.textContent = edit.draft;
      if (!edit.draft) box.classList.add("muted");
    } }));
    if (!explanationsAvailable(settings)) sheet.append(lockedNote(text));
    return originalHeading(text, "", edit.editing);
  }

  /* Named here rather than taken from the run. The run wrote the names down
     when it happened, in the interface language of that moment — and a reader
     who changes their first language afterwards gets the new labels around
     panels still headed in the old one. The name a run does carry is worth
     keeping for exactly one case: a language the app does not support, where
     the model supplied the name and there is no code to ask about. */
  const named = (entry) => panelName(entry, settings.languages[0]);

  const heading = originalHeading(text, named(state.panels[0]), edit.editing);
  const codes = state.panels.map((entry) => entry.code).filter(Boolean);
  const sourceLanguage = state.panels[0]?.code;
  const sentence = state.panels[0]?.text || "";
  /* The reader's own translation, for the back of a card. */
  const readerIndex = state.panels.findIndex((entry) => entry.code === settings.languages[0]);
  const readerPanel = state.panels[readerIndex];
  const translation = readerPanel?.text || "";

  /* Where a row's word went in the reader's own panel. The run worked this
     out to colour the passage, and a card wants the same answer for another
     reason: it is how the sentence on the back is found. Nothing known means
     no spot — which the card reads as "this translation cannot be cut", and
     a translation of one or two sentences then goes on whole. */
  const column = readerIndex === 1 ? "a" : readerIndex === 2 ? "b" : null;
  const spotOf = (kind, index) => {
    const align = kind === "verbs" ? state.verbAlign : state.wordAlign;
    if (!column || !align) return "";
    const fragments = (align[column] || [])[index];
    if (Array.isArray(fragments)) return fragments.find(Boolean) || "";
    return fragments || "";
  };

  state.panels.forEach((entry, index) => {
    /* The first panel says both what it is and which language it turned out
       to be — the language is a finding, not a setting — and it is the one
       the reader may write in. */
    if (index === 0) {
      sheet.append(originalPane({
        text, tools, edit, entry,
        marked: (body) => markSource(body, state, 0, settings, codes),
        onPick,
        aloud: state.short,
        sentences,
        onSentence,
        lookedUpIn: state.short && state.sentence
          ? {
              ...state.sentence,
              selection: state.selection?.inSentence ? state.selection : null,
              /* Folded away, the term takes its colour with it, as in a panel. */
              terms: state.folded?.has("terms") ? [] : markGroups(fragmentsForSentence(state), "tmark"),
              codes,
            }
          : null,
        card: state.short
          ? () => readingCard({
              text: entry.text,
              sourceLanguage: entry.code,
              reader: tools.reader,
              alternatives: readerPanel?.alternatives,
              verb: lookedUpVerb(state),
              sentence: state.sentence?.text || "",
            })
          : null,
      }));
      return;
    }

    /* Who translated it. Said outright where it was not the one the reader
       chose — they chose for a reason, and a panel that came from the other
       one would otherwise be read as theirs — and otherwise only for a
       pointer resting on the panel's name: a reader comparing two panels
       may want to know. One place for both, quiet, at the far end of the
       heading, where a section says what it is doing. */
    const written = entry.engine && (entry.text || entry.alternatives?.length);
    const box = pane({
      title: named(entry),
      status: written ? creditLine(text, [["translated", [entry.engine === "device" ? { kind: "device" } : theModel(entry.model)]]]) : "",
    });
    if (written && !entry.fallback) box.querySelector(".label .status").classList.add("on-hover");
    foldButton(box, `panel:${entry.code || entry.name || index}`, { state, text, onFold });
    const body = box.querySelector(".box");

    if (entry.status === "waiting") {
      body.textContent = "…";
      body.classList.add("muted");
    } else if (entry.status === "missing") {
      /* Only where the device was the only engine there was. With an endpoint
         configured the model has tried and failed too, and then the language
         downloads are not the thing to point at — see "no-answer". */
      body.textContent = text.pairMissing(named(state.panels[0]), named(entry));
      body.classList.add("muted");
    } else if (entry.status === "no-answer") {
      /* Only THAT nothing came. Why is a state of the run rather than of this
         panel — one endpoint, one model — and it stands once in the line
         under the sheet. Said here it would stand two or three times over,
         and once more under every section that failed with it. */
      body.textContent = text.noAnswer;
      body.classList.add("muted");
    } else if (entry.status === "no-device") {
      body.textContent = text.noDevice;
      body.classList.add("muted");
    } else if (entry.status === "unknown-source") {
      body.textContent = text.onlyKnownLanguages;
      body.classList.add("muted");
    } else if (entry.status === "alternatives") {
      /* A dictionary entry is still a translation, so it stays in the sheet a
         sentence would have been in — `entries` keeps the field the list of
         rows would otherwise have given up. */
      body.classList.add("rows", "entries");
      body.classList.remove("muted");
      entry.alternatives.forEach((item, line) => {
        const chosen = state.selection?.panel === index && state.selection.entry === line;
        body.append(alternativeRow(item, {
          text, tools, panelLanguage: entry.code, sentence: state.panels[0].text,
          /* Looked up in its sentence, the first line is the meaning there. */
          here: line === 0 && !!state.sentence,
          sourceLanguage: state.panels[0].code,
          readerAlternatives: readerPanel?.alternatives,
          selection: chosen ? [{ start: state.selection.start, end: state.selection.end }] : null,
          onPick: (choice) => onPick({ ...choice, panel: index, entry: line }),
        }));
      });
    } else {
      markSource(body, state, index, settings, codes);
      watchSelection(body, index, onPick);
      /* Replacing is offered on a translation and not on the original: the
         original is what stands there already. */
      box.querySelector(".frame").append(actions([
        insertButton(tools, text, entry.text),
        button(text.copy, (node) =>
          reportOn(node, () => tools.copy(entry.text), text.copied), "copy"),
      ].filter(Boolean)));
    }
    sheet.append(box);
  });

  const locked = !explanationsAvailable(settings);
  /* The longer explanations of verbs and terms, kept with the reading by
     section and place. */
  const moreOf = (kind, index) => state.more?.[`${kind}:${index}`] || null;
  const context = { text, tools, sourceLanguage, sentence, translation, spotOf, moreOf, onMore,
                    onExample, reader: settings.languages[0] };

  /* A section the reader switched off is not there at all — not empty, not
     locked. The middle setting, and the default, leaves it out for a text in
     their own language: somebody reading German as a German wants the
     translation, not a verb table of words they have known since they were
     four.

     And nothing at all without a language: a verb table and a list of
     difficult words are about one, so the run does not ask for either. Drawn
     all the same they would stand at "…" for as long as the reading does. */
  const about = (section) => showsSection(settings, section, sourceLanguage);
  const appendSection = (options) => {
    const drawn = section(options);
    if (drawn) sheet.append(drawn);
    return drawn;
  };

  /* The word the reader picked, wherever they picked it. The heading says
     which panel that was, the way the first one says what language the
     reading turned out to be: the same word is asked about differently in
     each of them, and nothing else on the sheet says which one was clicked. */
  const appendMarked = () => {
    const marked = state.marked;
    const panel = state.panels[state.selection.panel];
    const wordLanguage = panel?.code;
    /* A word picked out of a dictionary line stands in that line, not in a
       sentence of the panel's. */
    const picked = state.selection.entry;
    const pickedFrom = state.selection.inSentence
      ? state.sentence?.text
      : picked == null ? panel?.text : panel?.alternatives?.[picked]?.text;
    const named_ = panel ? named(panel) : "";
    const area = appendSection({
      name: MARKED,
      title: named_ ? `${text.marked} · ${named_}` : text.marked,
      status: state.markedStatus,
      credit: marked ? sectionCredit(text, marked.model || state.model, marked.assignedBy) : "",
      runFault: state.fault,
      rows: marked
        ? [markedRow(marked, {
            text, tools, wordLanguage,
            sentence: pickedFrom || "",
            translation: state.selection.inSentence ? "" : translation, onLookUp, onMore, onExample, reader: settings.languages[0],
          })]
        : [],
      empty: text.nothingOn(state.selection.term || ""),
      text,
      reader: settings.languages[0],
      busy: state.busy,
    });
    if (area) {
      trailButtons(area, state, text, onStep);
      foldButton(area, MARKED, { state, text, onFold });
    }
  };

  const fold = (drawn, key) => {
    if (drawn) foldButton(drawn, key, { state, text, onFold });
  };

  /* Short mode: no verb table, and one term at most — the looked-up words,
     or the fixed expression in their sentence they belong to, explained
     where they are hard enough for this reader. A word picked out of the
     reading or out of the entry's lines is still worth asking about, and
     that area is drawn here like anywhere else. Locked, the panels hold the
     device's plain translation, and the one line says what a model adds. */
  if (state.short) {
    if (locked) {
      sheet.append(lockedNote(text));
      return heading;
    }
    if (about("terms")) {
      /* The panels hold the word's translation, not the sentence's: the
         sentence goes on a card as it stands. */
      const inSentence = state.sentence ? { ...context, sentence: state.sentence.text, translation: "" } : context;
      fold(appendSection({
        title: text.term,
        status: state.status.words,
        credit: sectionCredit(text, state.model, ""),
        rows: state.words && state.words.map((word, index) =>
          termRow(word, index, inSentence, { shade: "tmark0", entryAbove: !differsFromLookup(state, word) })),
        empty: text.noTerm,
        text,
        reader: settings.languages[0],
        busy: state.busy,
      }), "terms");
    }
    if (state.selection) appendMarked();
    return heading;
  }

  /* Without a model there is nothing to draw below the panels: the picked
     word, the verbs and the terms all come from one. One line under the
     panels says how to have them. */
  if (locked) {
    sheet.append(lockedNote(text));
    return heading;
  }
  /* First of the three, because it answers what the reader has just done. */
  if (state.selection) appendMarked();

  if (about("terms")) {
    fold(appendSection({
      title: text.terms,
      status: state.status.words,
      credit: sectionCredit(text, state.model, state.wordAlign?.by),
      rows: state.words && state.words.map((word, index) => termRow(word, index, context)),
      empty: text.noTerms,
      text,
      reader: settings.languages[0],
      busy: state.busy,
    }), "terms");
  }

  if (about("verbs")) {
    fold(appendSection({
      title: text.verbs,
      status: state.status.verbs,
      credit: sectionCredit(text, state.model, state.verbAlign?.by),
      rows: state.verbs && state.verbs.map((verb, index) => verbRow(verb, index, context)),
      empty: text.noVerbs,
      text,
      reader: settings.languages[0],
      busy: state.busy,
    }), "verbs");
  }

  return heading;
}

/* One reading, from the text to everything that can be said about it.

   Nothing here draws. It keeps one state object and says so whenever a piece
   of it arrives, so the display can show what is already there instead of
   waiting for the slowest answer.

   The order is not arbitrary. Two strands run side by side, each waiting only
   on its own ingredients: the word assignment needs the translations, the word
   list and the verb *forms* — not the verb *annotation*, which takes about two
   and a half times as long. */

import { detectLanguage, chosenLanguage } from "./detect.js";
import { faultOf } from "./faults.js";
import { showsSection } from "./settings.js";
import { panelLanguages } from "./panels.js";
import { displayName } from "./languages/index.js";
import { withoutVerbs, VERB_CANDIDATES, selectVerbForms } from "./parse/verbs.js";
import { containsWord } from "./text.js";
import { fixSwappedColumns } from "./match/columns.js";
import {
  findVerbForms,
  annotateVerbs,
  wordsFor,
  alignWords,
  alignVerbs,
  translateText,
  alternativesFor,
  glanceSentence,
} from "./ask.js";
import { glancePairs, placeUnits } from "./glance.js";
import { unitsFromLinks } from "./parse/glance.js";
import { fragmentsAcross, rangesAcross } from "./match/links.js";
import { spotsFor } from "./match/positions.js";
import { wordCount } from "./text.js";
import { sentenceAround } from "./sentence.js";

/* Up to this many words the run takes the short path: a dictionary entry
   instead of a translation. Above it a text has a context of its own, and one
   rendering of it is the answer. */
export const SHORT_MAX_WORDS = 3;

/* How many sentences of the hover's alignment are asked about at once. Every
   other question of a reading has come back by then, but a long text has
   dozens of sentences, and dozens of questions at once is what a cloud
   endpoint answers with a rate limit and a local one with every answer
   slowing down — including the one to a word the reader clicks meanwhile. */
export const GLANCE_WIDTH = 3;

/* The sentence a looked-up word stands in (sentence.js), and the language
   it is in — named from the sentence, which is more than the word and so
   named more often without asking the model, and all that leaves the
   machine. Null where the word goes alone: nothing around it came along, or
   its sentence holds no other word. */
export async function sentenceFor(word, around, { settings, translation, llm, identifier }) {
  if (!around?.text) return null;
  const sentence = sentenceAround(around.text, word, around.at);
  if (!sentence) return null;
  const detected = await detectLanguage(sentence.text, {
    languages: settings.languages,
    reader: settings.languages[0],
    translation,
    llm,
    identifier,
  }).catch(() => ({ code: "", name: "", guesses: [] }));
  return { ...sentence, detected };
}

export function emptyState() {
  return {
    text: "",
    short: false,
    sentence: null,
    source: null,
    panels: [],
    words: null,
    verbs: null,
    forms: [],
    wordAlign: null,
    verbAlign: null,
    /* What each word of the original became in the reader's own panel, for
       the hover — see glance.js. `{ pending: true }` from the moment it is
       known to be coming, then the sentences, each "waiting" until its
       answer is in. */
    glance: null,
    /* What the word aligner said, where there is one: see match/links.js. */
    links: null,
    /* Each section says for itself whether it is still working, empty, or
       broken. A silent failure here reaches the reader as "no verbs found",
       which is worse than a message.

       Two kinds of value, and the window can tell them apart: one of the
       words this file uses for a state — "working", "linking" — or a fault,
       which is an object and gets put into words by the window, in the
       reader's own language. Nothing here writes a sentence: this file has no
       language. */
    status: { words: "", verbs: "", panels: "" },
    /* Why nothing came of it, once. Every one of these faults is about the
       endpoint or about the helper — one address, one model — so it is a
       state of the run and not of a panel: said once, in the line the window
       says everything else in, while the areas themselves only say THAT they
       are empty. Four copies of "nothing answers at this address" is the
       same sentence shouting. The first one wins; a second fault of the same
       run is about the same endpoint anyway. */
    fault: null,
    busy: false,
  };
}

/* Verbs belong in the verb table, not among the words — checked against every
   form found, not only the three annotated ones. And the other way round: a
   verb form sitting inside a multi-word term of the word list makes the verb
   row not merely double but misleading, so it drops out entirely. Both point
   at the same spot in the text, and a spot carries one colour. */
function untangle(state) {
  if (state.words?.length && state.forms.length) {
    state.words = withoutVerbs(state.words, state.forms);
  }
  if (state.verbs?.length && state.words?.length) {
    state.verbs = state.verbs.filter((verb) =>
      !state.words.some((word) => {
        const term = String(word.text || "").trim();
        return term.split(/\s+/).length > 1 && containsWord(term, verb.form);
      }));
  }
}

export async function runText(text, { settings, translation, llm, aligner = null, identifier = null, onChange, waitTurn, language = "", languageBy = "", guesses = [], sentence = null }) {
  const state = emptyState();
  const blame = (error) => {
    const found = faultOf(error);
    state.fault = state.fault || found;
    return found;
  };
  state.text = text;
  /* Who explains and, where the aligner cannot, places: for the headings'
     hints. */
  state.model = settings.model || "";
  state.short = wordCount(text) <= SHORT_MAX_WORDS;
  /* The sentence a short text was looked up in, drawn above the entry. */
  state.sentence = state.short ? sentence : null;
  state.busy = true;
  const tell = () => onChange({ ...state });

  const reader = settings.languages[0];
  tell();

  /* A language the reader named is not detected again: they corrected what
     detection found, and asking it once more would find the same.

     A model that cannot be reached must not take the device's panels down
     with it: the language stays unnamed and the reason is recorded. */
  const found = language
    ? { ...chosenLanguage(language, reader), guesses, by: languageBy || "reader" }
    : await detectLanguage(text, {
      languages: settings.languages,
      reader,
      translation,
      llm,
      identifier,
    }).catch((error) => {
      blame(error);
      return { code: "", name: "" };
    });
  /* Who named it, for the heading's hover — a model by the name it has now. */
  const detected = found.by === "model" ? { ...found, model: settings.model || "" } : found;
  state.source = detected;
  /* The language the questions name. For a language without a pack that is
     its code where the reader chose it, so the model is told it is Persian;
     where detection only found a name, the name is handed on instead. */
  const asked = detected.iso || detected.code || "";
  const askedName = asked ? "" : detected.name;

  /* Through the same function either way. Built by hand out of every
     configured language, the panels of a text in a language nobody could name
     would be one more than the window has room for whenever three are
     configured. */
  const codes = panelLanguages(detected.code, settings.languages);
  state.panels = codes.map((code, index) => ({
    code,
    ...(index === 0 && detected.iso && !code ? { iso: detected.iso } : {}),
    name: index === 0
      ? (detected.name || displayName(code, reader) || code)
      : displayName(code, reader) || code,
    text: index === 0 ? text : "",
    status: index === 0 ? "ready" : "waiting",
  }));
  tell();

  /* The device will not translate without a code: it needs a language it
     recognises. The model does not — it is told what to translate *into* and
     works out the rest — so a text in a language nobody could name is
     translated all the same wherever there is an endpoint, and the panels
     say what is missing only where there is none.

     What is skipped below the panels is what only a language pack can
     answer: the verb table and the hover. The terms are still asked. */
  const named = !!detected.code;
  if (!named && !llm) {
    for (const panel of state.panels.slice(1)) panel.status = "unknown-source";
    state.busy = false;
    tell();
    return state;
  }

  const targets = codes.slice(1);

  /* The word aligner on this machine, where its model is there: it says
     which word became which as soon as the translations stand, and asks no
     model. The hover reads its answer, and so do the marks of every term,
     verb form and picked word that is a single word. */
  const aligning = !!aligner && !state.short && named && targets.length > 0 && await aligner.ready();

  /* The hover says, over a word of a language the reader is learning, what it
     is in their own — so it wants a translated panel and someone to say which
     word became which: the aligner, the AI model otherwise. A text in the
     reader's own language is one of the cases it works in: their language is
     the original, and the sign over a translation is the source text's own
     words. Said as coming from the first moment, so that a word hovered while
     the panels are still filling shows it will answer. */
  const glanceWanted = (!!llm || aligning) && settings.glance !== false && !state.short && named && targets.length > 0;
  if (glanceWanted) {
    state.glance = { pending: true };
    tell();
  }

  /* Short mode: a dictionary entry instead of a translation, and below it at
     most one term. There is no verb table worth the name, and nothing in the
     other panels to highlight — they hold lists, not sentences.

     The model is asked first whatever the translator setting says. The
     device guesses rare words from their spelling: procaz became "Prokaz",
     quebranto "Brechbruch", meter la pata "Die Pfote in die Sache stecken".
     But a guess is still more than nothing, so where there is no model, or
     it did not answer, the device translates the word plainly and the panel
     says who did.

     One question per panel, nothing in front of it: a definition of the word
     in its own language, asked first, paid for itself only with false
     friends read without their sentence, and cost every entry a question
     (runs twenty-four, twenty-eight).

     Below the entry, one term: the looked-up words, or the fixed expression
     in their sentence they belong to, where it is hard enough for this
     reader to explain — the terms' own question, held to one. */
  if (state.short) {
    const fillPanel = async (offset, code) => {
      const panel = state.panels[offset + 1];
      if (llm) {
        try {
          panel.alternatives = await alternativesFor(llm, {
            text,
            source: asked,
            target: code,
            reader,
            sentence: state.sentence?.text || "",
          });
        } catch (error) {
          panel.fault = blame(error);
        }
      }
      if (panel.alternatives?.length) {
        panel.status = "alternatives";
        panel.engine = "model";
        panel.model = settings.model || "";
      } else {
        panel.alternatives = undefined;
        const translated = named ? await translation?.translate(detected.code, code, text) : "";
        panel.text = translated || "";
        panel.engine = translated ? "device" : undefined;
        panel.fallback = !!translated && !!llm;
        panel.status = translated
          ? "ready"
          : llm
          ? "no-answer"
          : (await translation?.running?.()) ? "missing" : "no-device";
      }
      tell();
    };

    const wantTerm = !!llm && showsSection(settings, "terms", detected.code);
    state.status.words = wantTerm ? "working" : "";
    const sentence = state.sentence;
    const askTerm = () => wordsFor(llm, {
      text: sentence?.text || text,
      source: asked,
      sourceName: askedName,
      languages: settings.languages,
      levels: settings.levels,
      lookup: sentence
        ? { words: text, start: sentence.start, end: sentence.end }
        : { words: text, start: 0, end: text.length },
    })
      .then((list) => {
        state.words = list;
        state.status.words = "";
        tell();
      })
      .catch((error) => {
        state.words = null;
        state.status.words = blame(error);
        tell();
      });

    /* The upper panel first and alone, so it is reliably filled first; then
       the second panel and the term side by side, the panel's question sent
       first so that a model answering one at a time answers it first. */
    if (targets.length) await fillPanel(0, targets[0]);
    const second = targets.length > 1 ? fillPanel(1, targets[1]) : null;
    await Promise.all([second, wantTerm ? askTerm() : null]);
    state.busy = false;
    tell();
    return state;
  }

  /* The two engines, each answering "" where it cannot. The device refuses
     whole language pairs — one it has not downloaded, a language it cannot
     name — and fails outright now and then; the model needs an endpoint. */
  const engines = {
    device: async (code) => (named ? translation.translate(detected.code, code, text) : ""),
    model: async (code, panel) => {
      if (!llm) return "";
      try {
        return await translateText(llm, { text, target: code });
      } catch (error) {
        /* Which panel it was is not interesting — the reason is, and it is
           recorded once for the whole run. */
        panel.fault = blame(error);
        return "";
      }
    },
  };

  /* The reader chooses who goes first, and the other one steps in wherever
     the first cannot. Without a model the device is the only engine there
     is, so it goes first whatever the choice, in single file, and a panel it
     translated is not marked as a stand-in. Where the other one did step in,
     the panel carries it: the reader chose one of them for a reason —
     measured, the device is quick and wrong in sense about one translation
     in four — and a panel that quietly came from the other one would be read
     as the one they chose. */
  const first = settings.translator !== "device" && llm ? "model" : "device";
  const order = first === "model" ? ["model", "device"] : ["device", "model"];

  const translatePanel = async (offset, code) => {
    const panel = state.panels[offset + 1];
    let translated = "";
    for (const engine of order) {
      translated = await engines[engine](code, panel);
      if (translated) {
        panel.engine = engine;
        /* Which model, by name, as it was when the panel was written: the
           heading's hover names it, and the settings may change afterwards. */
        if (engine === "model") panel.model = settings.model || "";
        panel.fallback = engine !== first;
        break;
      }
    }
    panel.text = translated;
    /* Which of them failed decides what the panel may say, and there are
       three answers, not one. With an endpoint the model has just tried and
       failed too, so the device's language downloads are not the cause.
       Without one the device was the only engine there was — and then it
       matters whether it refused this pair, which the reader can fix by
       downloading it, or whether it was not answering at all, which no
       download helps. Naming the wrong one of those sends somebody into
       System Settings after a language that is already there. */
    panel.status = translated
      ? "ready"
      : llm
      ? "no-answer"
      : (await translation?.running?.()) ? "missing" : "no-device";
    tell();
  };

  /* The device works through requests singly, so sending them together only
     lets chance decide which comes first — measured, the reader's own
     language was regularly the slower of the two. One after another, upper
     panel first, settles that for nothing. A model answers them side by
     side, and there waiting would cost a whole translation. */
  const translations = first === "model"
    ? Promise.all(targets.map((code, offset) => translatePanel(offset, code)))
    : (async () => {
        for (const [offset, code] of targets.entries()) await translatePanel(offset, code);
      })();

  /* The aligner waits on the translations and on nothing else: it asks no
     model, so it has no reason to stand behind the rest of the reading. */
  const aligned = aligning
    ? translations.then(() => alignReading(state, { text, reader, source: detected.code, aligner, tell, glance: glanceWanted }))
    : Promise.resolve(false);

  if (!llm) {
    await translations;
    if (glanceWanted && !(await aligned)) state.glance = null;
    state.busy = false;
    tell();
    return state;
  }

  /* A section the reader switched off is not asked for. That is two fewer
     calls per reading, and the window does not draw it either. */
  const wantVerbs = named && showsSection(settings, "verbs", detected.code);
  /* The terms are asked about a language the app cannot name as well: see
     showsSection. */
  const wantWords = showsSection(settings, "terms", detected.code);

  /* The two verb stages separately rather than through one wrapper: only that
     way can the forms be taken off in between, and the word assignment needs
     nothing more than those. */
  state.status.verbs = wantVerbs ? "working" : "";
  const formsDone = !wantVerbs
    ? Promise.resolve([])
    : findVerbForms(llm, { text, source: detected.code })
    .then((forms) => {
      state.forms = forms.map((form) => ({ form }));
      return forms;
    })
    /* Nothing rather than no forms. The two are not the same thing and the
       reader can tell them apart: "no verbs found" about a sentence full of
       them is a lie, and the cause was this step failing — a dead endpoint
       answered with an empty verb section that claimed the text had none.
       The stage after this one keeps the difference; the alignment does not
       care either way and reads state.forms, which stayed empty. */
    .catch((error) => {
      state.status.verbs = blame(error);
      return null;
    });

  const verbsDone = !wantVerbs
    ? Promise.resolve()
    : formsDone
    .then(async (forms) => {
      /* The question itself came to nothing, and the section already says
         so. Null, not an empty list: there is no answer here, and an empty
         list is one. */
      if (!forms) {
        state.verbs = null;
        tell();
        return;
      }
      if (!forms.length) {
        state.verbs = [];
        state.status.verbs = "";
        tell();
        return;
      }
      state.verbs = await annotateVerbs(llm, {
        text,
        source: detected.code,
        reader,
        /* What counts as worth a second meaning depends on how far along the
           reader is, the same way it does for the words. */
        level: (settings.levels || {})[detected.code],
        forms: selectVerbForms(forms, VERB_CANDIDATES, detected.code),
      });
      state.status.verbs = "";
      tell();
    })
    .catch((error) => {
      state.verbs = null;
      state.status.verbs = blame(error);
      tell();
    });

  state.status.words = wantWords ? "working" : "";
  const wordsDone = !wantWords
    ? Promise.resolve()
    : wordsFor(llm, {
    text,
    source: asked,
    sourceName: askedName,
    languages: settings.languages,
    levels: settings.levels,
  })
    .then((list) => {
      state.words = list;
      state.status.words = "";
      tell();
    })
    .catch((error) => {
      state.words = null;
      state.status.words = blame(error);
      tell();
    });

  const aText = () => state.panels[1]?.text || "";
  const bText = () => state.panels[2]?.text || "";
  const twoTranslations = targets.length > 1;

  /* Where a word went, by the aligner: only a single word, and only where
     it found a place in every translation. Anything of several words — an
     idiom, a compound term, a form with its auxiliary — is the model's: an
     aligner links word to word and marks half of what an expression became
     (run forty). Null leaves the entry to the model. */
  const twoPanels = () => state.panels.length > 2;
  const texts = () => state.panels.map((panel) => panel.text);
  const byAligner = (fragment) => {
    if (!state.links || wordCount(fragment) !== 1) return null;
    const [spot] = spotsFor(text, fragment);
    if (!spot) return null;
    const a = fragmentsAcross(state.links, texts(), 0, spot, 1);
    const b = twoPanels() ? fragmentsAcross(state.links, texts(), 0, spot, 2) : [];
    return a.length && (!twoPanels() || b.length) ? { a, b } : null;
  };
  /* Whereabouts in a translation an entry of any length went, as far as the
     aligner knows. The model says which words; where one of them stands more
     than once in the panel, this says which occurrence (ui/marking.js). */
  const whereabouts = (fragment, panel) => {
    const [spot] = state.links ? spotsFor(text, fragment) : [];
    const [first] = spot ? rangesAcross(state.links, texts(), 0, spot, panel) : [];
    return first ? first.start : null;
  };
  /* An assignment out of the aligner's entries and the model's. The model is
     asked about the whole list as it always was, or not at all where nothing
     is left for it: asked about the terms of several words alone it answers
     them differently — longer stretches, seven of 234 left empty (run forty). */
  const assign = async (fragments, ask) => {
    await aligned;
    const known = fragments.map(byAligner);
    let answered = null;
    if (known.some((entry) => !entry)) {
      try {
        answered = fixSwappedColumns(await ask(), aText(), bText());
      } catch {
        if (known.every((entry) => !entry)) return null;
      }
    }
    const column = (name) => fragments.map((_, index) => (known[index] ? known[index][name] : answered?.[name]?.[index] || []));
    const placed = [known.some(Boolean) && "aligner", answered && "model"].filter(Boolean);
    return {
      a: column("a"),
      b: column("b"),
      /* Who placed them, for the section's hint: "aligner", "model", "both". */
      by: placed.length > 1 ? "both" : placed[0] || "",
      near: { a: fragments.map((fragment) => whereabouts(fragment, 1)), b: fragments.map((fragment) => whereabouts(fragment, 2)) },
    };
  };

  const wordAssignment = Promise.all([translations, wordsDone, formsDone]).then(async () => {
    untangle(state);
    tell();
    if (!state.words?.length || !aText() || (twoTranslations && !bText())) return;
    state.status.words = "linking";
    tell();
    const list = state.words;
    state.wordAlign = await assign(list.map((word) => word.spot || word.text), () => alignWords(llm, {
      text,
      list,
      source: asked,
      sourceName: askedName,
      a: targets[0],
      b: targets[1] || "",
      aText: aText(),
      bText: bText(),
    }));
    state.status.words = "";
    tell();
  });

  /* The verb assignment does need the annotation: its anchor is the meaning
     in the reader's language. */
  const verbAssignment = Promise.all([translations, verbsDone, wordsDone]).then(async () => {
    untangle(state);
    tell();
    if (!state.verbs?.length || !aText() || (twoTranslations && !bText())) return;
    state.status.verbs = "linking";
    tell();
    const verbs = state.verbs;
    state.verbAlign = await assign(verbs.map((verb) => verb.form), () => alignVerbs(llm, {
      text,
      verbs,
      source: detected.code,
      a: targets[0],
      b: targets[1] || "",
      aText: aText(),
      bText: bText(),
    }));
    state.status.verbs = "";
    tell();
  });

  await Promise.all([wordAssignment, verbAssignment]);
  state.busy = false;
  tell();

  if (glanceWanted && !(await aligned)) await glanceAll(state, { text, reader, source: detected.code, llm, tell, waitTurn });
  return state;
}

/* The hover's alignment, after everything else: the sheet is complete by
   then, and this is the one part of a reading nobody is waiting on. A
   sentence at a time, a few at once, each drawn as soon as it is in — and
   standing aside while the reader is waiting on a clicked word (`waitTurn`).

   A failure is not the run's fault to report. Everything the reader asked
   for has arrived, and a line under the sheet about a rate limit on
   something they cannot see would be about nothing. The sentence simply
   has no answer. */
/* Which sentences the hover is worked out for, and against which panels:
   null where no panel can be paired with the original. */
function glanceSentences(state, text, reader) {
  /* Which panel holds the reader's own language — the original itself where
     the text is in it. The sign is always written from that one, and the
     panel it is written from never gets a sign of its own. */
  const readerPanel = state.panels.findIndex((entry) => entry.code === reader);
  const translated = state.panels
    .map((entry, index) => index)
    .filter((index) => index > 0 && state.panels[index].text);
  /* The reader's own panel is the first column: the grouping is worked out on
     it, and it is the column that decides whether a sentence has an answer at
     all. */
  const columns = readerPanel > 0
    ? [readerPanel, ...translated.filter((index) => index !== readerPanel)]
    : translated;

  /* Each panel is paired with the original sentence by sentence, and a panel
     that does not come apart into as many sentences is left out rather than
     paired by guesswork. */
  const pairsOf = (index) => {
    const pairs = glancePairs(text, state.panels[index].text);
    return pairs.length ? pairs : null;
  };
  const first = columns[0] === undefined ? null : pairsOf(columns[0]);
  if (!first) return null;
  const secondPairs = columns[1] === undefined ? null : pairsOf(columns[1]);
  const second = secondPairs && secondPairs.length === first.length ? columns[1] : -1;

  const sentences = first.map((pair, index) => ({
    ...pair,
    second: second === -1 ? null : secondPairs[index].to,
    status: "waiting",
    units: null,
  }));
  return { columns, second, readerPanel, sentences };
}

/* The word aligner's answer for a reading: every sentence in one go, as soon
   as the translations stand. Kept as links for the marks, and laid out as
   units for the hover where the reader wants one. True where it answered;
   false where it could not, and everything is asked of the AI model as
   though there were no aligner. */
async function alignReading(state, { text, reader, source, aligner, tell, glance }) {
  const laid = glanceSentences(state, text, reader);
  if (!laid) return false;
  const { columns, second, readerPanel, sentences } = laid;
  const own = state.panels[columns[0]];
  const other = second === -1 ? null : state.panels[second];
  const cut = (panel, range) => panel.text.slice(range.start, range.end);
  const each = other ? 2 : 1;
  let links;
  try {
    links = await aligner.align(sentences.flatMap((sentence) => {
      const original = text.slice(sentence.start, sentence.end);
      return [
        { source: original, target: cut(own, sentence.to) },
        ...(other ? [{ source: original, target: cut(other, sentence.second) }] : []),
      ];
    }));
    if (!Array.isArray(links) || links.length !== sentences.length * each) return false;
  } catch {
    return false;
  }
  const panels = second === -1 ? [columns[0]] : [columns[0], second];
  state.links = {
    panels,
    sentences: sentences.map((sentence, index) => ({
      start: sentence.start,
      end: sentence.end,
      to: sentence.to,
      second: sentence.second,
      links: links.slice(index * each, index * each + each),
    })),
  };
  if (glance) {
    sentences.forEach((sentence, index) => {
      const units = unitsFromLinks(
        text.slice(sentence.start, sentence.end),
        cut(own, sentence.to),
        links[index * each],
        [source, own.code],
        other ? { text: cut(other, sentence.second), links: links[index * each + 1], codes: [source, other.code] } : null,
      );
      sentence.units = units ? placeUnits(sentence, units, sentence.second && { to: sentence.second }) : null;
      sentence.status = "done";
    });
    state.glance = { panels, reader: readerPanel, sentences, by: "aligner" };
  }
  tell();
  return true;
}

async function glanceAll(state, { text, reader, source, llm, tell, waitTurn }) {
  const laid = glanceSentences(state, text, reader);
  if (!laid) {
    state.glance = null;
    tell();
    return;
  }
  const { columns, second, readerPanel, sentences } = laid;
  state.glance = {
    panels: second === -1 ? [columns[0]] : [columns[0], second],
    reader: readerPanel,
    sentences,
    by: "model",
  };
  tell();

  let next = 0;
  const work = async () => {
    while (next < sentences.length) {
      const sentence = sentences[next++];
      if (waitTurn) await waitTurn();
      try {
        const units = await glanceSentence(llm, {
          sentence: text.slice(sentence.start, sentence.end),
          translation: state.panels[columns[0]].text.slice(sentence.to.start, sentence.to.end),
          second: sentence.second
            ? state.panels[second].text.slice(sentence.second.start, sentence.second.end)
            : "",
          source,
          target: state.panels[columns[0]].code,
          secondTarget: second === -1 ? "" : state.panels[second].code,
        });
        sentence.units = units ? placeUnits(sentence, units, sentence.second && { to: sentence.second }) : null;
      } catch {
        sentence.units = null;
      }
      sentence.status = "done";
      tell();
    }
  };
  await Promise.all(Array.from({ length: Math.min(GLANCE_WIDTH, sentences.length) }, work));
}

/* One reading, from the text to everything that can be said about it.

   Nothing here draws. It keeps one state object and says so whenever a piece
   of it arrives, so the display can show what is already there instead of
   waiting for the slowest answer.

   The order is not arbitrary. Two strands run side by side, each waiting only
   on its own ingredients: the word assignment needs the translations, the word
   list and the verb *forms* — not the verb *annotation*, which takes about two
   and a half times as long. */

import { detectLanguage } from "./detect.js";
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
  defineWord,
  alternativesFor,
  glanceSentence,
} from "./ask.js";
import { glancePairs, placeUnits } from "./glance.js";
import { wordCount } from "./text.js";

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

export function emptyState() {
  return {
    text: "",
    short: false,
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

export async function runText(text, { settings, translation, llm, onChange, waitTurn }) {
  const state = emptyState();
  const blame = (error) => {
    const found = faultOf(error);
    state.fault = state.fault || found;
    return found;
  };
  state.text = text;
  state.short = wordCount(text) <= SHORT_MAX_WORDS;
  state.busy = true;
  const tell = () => onChange({ ...state });

  const reader = settings.languages[0];
  tell();

  /* A model that cannot be reached must not take the device's panels down
     with it: the language stays unnamed and the reason is recorded. */
  const detected = await detectLanguage(text, {
    languages: settings.languages,
    reader,
    translation,
    llm,
  }).catch((error) => {
    blame(error);
    return { code: "", name: "" };
  });
  state.source = detected;

  /* Through the same function either way. A text in a language nobody could
     name used to build its panels by hand out of every configured language,
     which is one panel more than the window has room for whenever three are
     configured. */
  const codes = panelLanguages(detected.code, settings.languages);
  state.panels = codes.map((code, index) => ({
    code,
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

  /* The hover says, over a word of a language the reader is learning, what it
     is in their own — so it wants a translated panel and a model, and nothing
     else. A text in the reader's own language is one of the cases it works
     in: their language is the original, and the sign over a translation is
     the source text's own words. Said as coming from the first moment, so that a
     word hovered while the panels are still filling shows it will answer. */
  const glanceWanted = !!llm && settings.glance !== false && !state.short && named && targets.length > 0;
  if (glanceWanted) {
    state.glance = { pending: true };
    tell();
  }

  /* Short mode: a dictionary entry instead of a translation, and nothing
     below it. There is no context to find difficult words in, no verb table
     worth the name, and nothing in the other panels to highlight — they hold
     lists, not sentences.

     The model is asked first whatever the translator setting says. The
     device guesses rare words from their spelling: procaz became "Prokaz",
     quebranto "Brechbruch", meter la pata "Die Pfote in die Sache stecken" —
     exactly the kind of error the definition step was built against. But a
     guess is still more than nothing, so where there is no model, or it did
     not answer, the device translates the word plainly and the panel says
     who did. */
  if (state.short) {
    const meaning = llm ? await defineWord(llm, { text, source: detected.code, reader }) : "";
    /* One after another, the upper panel first: it is two calls, not four,
       and this way the upper one is reliably filled first. */
    for (const [offset, code] of targets.entries()) {
      const panel = state.panels[offset + 1];
      if (llm) {
        try {
          panel.alternatives = await alternativesFor(llm, {
            text,
            source: detected.code,
            target: code,
            reader,
            meaning,
          });
        } catch (error) {
          panel.fault = blame(error);
        }
      }
      if (panel.alternatives?.length) {
        panel.status = "alternatives";
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
    }
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
     translated is not marked as a stand-in. Where that happened the panel carries it: the reader
     chose one of them for a reason — measured, the device is quick and wrong
     in sense about one translation in four — and a panel that quietly came
     from the other one would be read as the one they chose. */
  const first = settings.translator !== "device" && llm ? "model" : "device";
  const order = first === "model" ? ["model", "device"] : ["device", "model"];

  const translatePanel = async (offset, code) => {
    const panel = state.panels[offset + 1];
    let translated = "";
    for (const engine of order) {
      translated = await engines[engine](code, panel);
      if (translated) {
        panel.engine = engine;
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

  if (!llm) {
    await translations;
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
    source: detected.code,
    sourceName: named ? "" : detected.name,
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

  const wordAssignment = Promise.all([translations, wordsDone, formsDone]).then(async () => {
    untangle(state);
    tell();
    if (!state.words?.length || !aText() || (twoTranslations && !bText())) return;
    state.status.words = "linking";
    tell();
    try {
      const assignment = await alignWords(llm, {
        text,
        list: state.words,
        source: detected.code,
        sourceName: named ? "" : detected.name,
        a: targets[0],
        b: targets[1] || "",
        aText: aText(),
        bText: bText(),
      });
      state.wordAlign = fixSwappedColumns(assignment, aText(), bText());
    } catch {
      state.wordAlign = null;
    }
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
    try {
      const assignment = await alignVerbs(llm, {
        text,
        verbs: state.verbs,
        source: detected.code,
        a: targets[0],
        b: targets[1] || "",
        aText: aText(),
        bText: bText(),
      });
      state.verbAlign = fixSwappedColumns(assignment, aText(), bText());
    } catch {
      state.verbAlign = null;
    }
    state.status.verbs = "";
    tell();
  });

  await Promise.all([wordAssignment, verbAssignment]);
  state.busy = false;
  tell();

  if (glanceWanted) await glanceAll(state, { text, reader, source: detected.code, llm, tell, waitTurn });
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
async function glanceAll(state, { text, reader, source, llm, tell, waitTurn }) {
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
  if (!first) {
    state.glance = null;
    tell();
    return;
  }
  const secondPairs = columns[1] === undefined ? null : pairsOf(columns[1]);
  const second = secondPairs && secondPairs.length === first.length ? columns[1] : -1;

  const sentences = first.map((pair, index) => ({
    ...pair,
    second: second === -1 ? null : secondPairs[index].to,
    status: "waiting",
    units: null,
  }));
  state.glance = {
    panels: second === -1 ? [columns[0]] : [columns[0], second],
    reader: readerPanel,
    sentences,
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

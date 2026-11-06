/* One reading, from the text to everything that can be said about it.

   Nothing here draws. It keeps one state object and says so whenever a piece
   of it arrives, so the display can show what is already there instead of
   waiting for the slowest answer.

   The order is not arbitrary. Two strands run side by side, each waiting only
   on its own ingredients: the word assignment needs the translations, the word
   list and the verb *forms* — not the verb *annotation*, which takes about two
   and a half times as long. */

import { asConfigured, detectLanguage, chosenLanguage } from "./detect.js";
import { faultOf } from "./faults.js";
import { showsSection } from "./settings.js";
import { panelLanguages } from "./panels.js";
import { displayName, isSupported } from "./languages/index.js";
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
  spellingFor,
  wordLanguageFor,
} from "./ask.js";
import { checkerOffer, inAnotherLanguage, languageByDictionaries, mayBeMisspelled, spellingLanguages, spellingWords, translationWords, wordLanguage } from "./spelling.js";
import { glancePairs, glossOf, placeThird, placeUnits } from "./glance.js";
import { asHeadword, casedLike } from "./parse/alternatives.js";
import { unitsFromLinks, unitsOfThird } from "./parse/glance.js";
import { fragmentsAcross, rangesAcross } from "./match/links.js";
import { spotsFor } from "./match/positions.js";
import { wordCount } from "./text.js";
import { sentenceAround } from "./sentence.js";

/* Up to this many words the run takes the short path: a dictionary entry
   instead of a translation. Above it a text has a context of its own, and one
   rendering of it is the answer. */
export const SHORT_MAX_WORDS = 3;


/* A looked-up word's spelling (see spelling.js). The checker answers in a
   few milliseconds once its dictionaries are loaded, and is waited for this
   long before the entry is asked for. A word it finds suspect is asked about
   first and every panel and the term about the word meant: asked as typed,
   the entry called "garanteirt" old and southern German (author 2026-10-16).
   That costs a misspelled word the spelling question, 0.4 s on the cloud
   model and 0.7 s on the local one, waited for at most SPELLING_FIRST_MS;
   a word spelled right costs the check alone. Where the checker was slower
   — its dictionaries load the first time, 0.4 to 1.7 s — the upper panel
   goes ahead as typed, and the lower panel and the term wait for the word
   meant as long: not waited for, the term was asked about the typo and
   explained it as one — a wait is the lesser evil (2026-10-16). */
export const CHECK_WAIT_MS = 300;
export const SPELLING_FIRST_MS = 3000;

/* A promise's value where it comes within `ms`; undefined where it does
   not, null where it fails. */
function within(promise, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(null); });
  });
}

/* The sentence a looked-up word stands in (sentence.js), its language
   (`code`), and the language the word is in (`detected`) — named from the
   sentence, which is more than the word and so named more often without
   asking the model, and all that leaves the machine. Unless the word is a
   word of another of the reader's languages, as the spelling checker sees
   it (wordLanguage): "encender" in an English sentence is Spanish. The
   checker is asked while the sentence is named, and waited for no longer
   than for a typo; where its dictionaries cannot tell — Windows has one
   only for a language added to the system — the model is asked instead.
   The language identifier is no help here: of a single word it named
   "encender" Italian and "actual" Spanish (run fifty-three). Null where the
   word goes alone: nothing around it came along, or its sentence holds no
   other word. */
export async function sentenceFor(word, around, { settings, translation, llm, identifier, speller = null }) {
  if (!around?.text) return null;
  const sentence = sentenceAround(around.text, word, around.at);
  if (!sentence) return null;
  const reader = settings.languages[0];
  const own = settings.languages.filter(isSupported);
  const words = spellingWords(word);
  const checking = speller && words.length ? speller.check(words, own).catch(() => ({})) : null;
  const named = await detectLanguage(sentence.text, {
    languages: settings.languages,
    reader,
    translation,
    llm,
    identifier,
  }).catch(() => ({ code: "", name: "", guesses: [] }));
  let detected = named;
  if (checking && isSupported(named.code)) {
    const source = named.code;
    const asked = [checking, own.includes(source) ? null : speller.check(words, [source]).catch(() => ({}))];
    const answers = await Promise.all(asked.map((promise) => promise && within(promise, CHECK_WAIT_MS)));
    const verdicts = {};
    for (const answer of answers.filter(Boolean)) {
      for (const [key, value] of Object.entries(answer)) verdicts[key] = { ...verdicts[key], ...value };
    }
    let code = wordLanguage(word, verdicts, { source, languages: own });
    if (code === null && llm && own.some((other) => other !== source)) {
      code = await wordLanguageFor(llm, { words: word, sentence: sentence.text, source, languages: own }).catch(() => "");
      if (code === source) code = "";
    }
    if (code) detected = { code, name: displayName(code, reader), guesses: named.guesses || [], by: "text" };
  }
  return { ...sentence, code: named.code || "", detected };
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
    /* A looked-up text found misspelled: `typed` as it was, and either the
       word `meant`, which the reading has gone on with, or a word only
       `offer`ed, where no model could say. */
    spelling: null,
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
/* `only` holds a list already on the sheet with its places worked out —
   one that came first while the other waited on its fold: "words" touches
   the terms alone, "verbs" the verbs alone, and "verbs-all" lets a verb go
   wherever a term stands on it, since the term is already drawn. */
function untangle(state, only = "") {
  if ((!only || only === "words") && state.words?.length && state.forms.length) {
    state.words = withoutVerbs(state.words, state.forms);
  }
  if (only === "words") return;
  if (state.verbs?.length && state.words?.length) {
    state.verbs = state.verbs.filter((verb) =>
      !state.words.some((word) => {
        const term = String(word.text || "").trim();
        return (only === "verbs-all" || term.split(/\s+/).length > 1) && containsWord(term, verb.form);
      }));
  }
}

/* `later`, where the window offers it, holds the verbs and the terms back
   while their section is folded away: `folded(key)` says whether it is as
   the reading starts, and `unfolded(key)` settles once it is opened. */
export async function runText(text, { settings, translation, llm, aligner = null, identifier = null, speller = null, onChange, language = "", languageBy = "", guesses = [], sentence = null, asTyped = false, choice = null, kept = null, later = null }) {
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

  /* Another translation chosen for a reading already made (`choice`,
     panels.js): the original, its language, the terms and the verbs are
     about the original alone and stay as they were (`kept`); only a panel
     in a language it did not have is asked, and where the words went is
     worked out again. A section the kept reading failed on is asked anew. */
  const keptWords = Array.isArray(kept?.words) ? kept.words : null;
  const keptVerbs = Array.isArray(kept?.verbs) ? kept.verbs : null;
  const keptPanel = (code, index) => {
    const panel = kept?.panels?.find((entry, at) => at > 0 && entry.code === code);
    return index > 0 && panel && (panel.status === "ready" || panel.status === "alternatives") ? { ...panel, kept: true } : null;
  };

  /* A language the reader named is not detected again: they corrected what
     detection found, and asking it once more would find the same.

     A model that cannot be reached must not take the device's panels down
     with it: the language stays unnamed and the reason is recorded. */
  let found = kept?.source
    ? kept.source
    : language
    ? asConfigured({ ...chosenLanguage(language, reader), guesses, by: languageBy || "reader" }, settings.languages)
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
  /* A short text named as a language the app does not offer, by the
     reader's dictionaries instead where they say one of the reader's
     languages (see spelling.js). Not where the reader named it. */
  if (!kept && !language && speller && state.short && !found.code && !found.iso) {
    const own = settings.languages.filter(isSupported);
    const verdicts = await speller.check(spellingWords(text), own, { full: true }).catch(() => ({}));
    const code = languageByDictionaries(text, verdicts, own);
    if (code) found = { code, name: displayName(code, reader), guesses: found.guesses || [], by: "text" };
  }
  /* Who named it, for the heading's hover — a model by the name it has now. */
  const detected = found.by === "model" ? { ...found, model: settings.model || "" } : found;
  state.source = detected;
  /* A word of another language than its sentence's ("encender" in an
     English sentence): the term's question would call the sentence a text
     in the word's language, so it is asked about the word alone, as
     without a sentence; a word picked in the sentence is in the sentence's
     language, and a card does not take the sentence along. */
  if (state.sentence?.code && state.sentence.code !== detected.code) state.sentence = { ...state.sentence, apart: true };
  /* The language the questions name. For a language without a pack that is
     its code where the reader chose it, so the model is told it is Persian;
     where detection only found a name, the name is handed on instead. */
  const asked = detected.iso || detected.code || "";
  const askedName = asked ? "" : detected.name;

  /* Through the same function either way. Built by hand out of every
     configured language, the panels of a text in a language nobody could name
     would be one more than the window has room for whenever three are
     configured. */
  const codes = panelLanguages(detected.code, settings.languages, choice);
  state.panels = codes.map((code, index) => keptPanel(code, index) || ({
    code,
    ...(index === 0 && detected.iso && !code ? { iso: detected.iso } : {}),
    name: index === 0
      ? (detected.name || displayName(code, reader) || code)
      : displayName(code, reader) || code,
    text: index === 0 ? text : "",
    status: index === 0 ? "ready" : "waiting",
  }));
  /* The word meant, where the kept reading went on with one. */
  if (kept?.spelling) {
    state.spelling = kept.spelling;
    state.text = kept.text;
    state.panels[0].text = kept.panels[0].text;
  }
  tell();

  /* The device will not translate without a code: it needs a language it
     recognises. The model does not — it is told what to translate *into* and
     works out the rest — so a text in a language nobody could name is
     translated all the same wherever there is an endpoint, and the panels
     say what is missing only where there is none.

     What is skipped below the panels is what only a language pack can
     answer: the verb table and the hover. The terms are still asked. */
  const named = !!detected.code;
  /* What the device is asked to translate from: it knows more languages
     than the app has packs for, so a language known by its code alone —
     chosen by the reader, or named by the model in words the platform
     knows — is still its to try. */
  const from = detected.code || detected.iso || detected.tag || "";
  if (!from && !llm) {
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
     is in their own — so it wants a translated panel and the aligner to say
     which word became which, and nothing else: no AI model is asked about it
     (author 2026-11-05). A text in the reader's own language is one of the
     cases it works in: their language is the original, and the sign over a
     translation is the source text's own words. Said as coming from the
     first moment, so that a word hovered while the panels are still filling
     shows it will answer. */
  const glanceWanted = aligning && settings.glance !== false;
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
  /* What a panel nobody filled says. With an endpoint the model has just
     tried and failed too, so the device's language downloads are not the
     cause. Without one the device was the only engine there was — and then
     it matters whether it refused this pair, which the reader can fix by
     downloading it, or whether it was not answering at all, which no
     download helps. Naming the wrong one of those sends somebody into
     System Settings after a language that is already there; and for a
     language the app has no pack for there is no download to name. */
  const emptyStatus = async (to) => {
    if (llm) return "no-answer";
    if (!named) return "unknown-source";
    if (!(await translation?.running?.())) return "no-device";
    /* A pair Apple cannot translate at all is no download away: telling
       the reader to load its pack sent them after one that does not exist. */
    const pair = await Promise.resolve(translation.pairStatus?.(from, to)).catch(() => "");
    return pair === "unsupported" ? "unsupported" : "missing";
  };

  if (state.short) {
    /* A typo (see CHECK_WAIT_MS): the spelling checker first, and only
       where it knows the word in none of the languages concerned the model,
       in a question of its own; the reading goes on with the word meant.
       Without a model the checker's word is only offered. Not where the
       reader asked for the word as typed. */
    const about = { source: detected.code, languages: settings.languages };
    const checking = speller && named && !asTyped && !kept;
    const suspicion = checking
      ? speller.check(spellingWords(text), spellingLanguages(detected.code, settings.languages), { full: !llm })
        .then((verdicts) => (mayBeMisspelled(text, verdicts, about) ? verdicts : null), () => null)
      : null;
    const spelled = suspicion && suspicion.then(async (verdicts) => {
      if (!verdicts) return;
      if (!llm) {
        const offer = checkerOffer(text, verdicts, about);
        if (offer) state.spelling = { typed: text, offer };
        tell();
        return;
      }
      /* A question that fails says nothing: the entry's own question, to
         the same model, says it once for the whole reading. */
      const meant = await spellingFor(llm, { text, source: detected.code }).catch(() => "");
      if (!meant) return;
      state.spelling = { typed: text, meant };
      state.text = meant;
      state.panels[0].text = meant;
      tell();
    }).catch(() => {});
    if (suspicion && llm && await within(suspicion, CHECK_WAIT_MS)) await within(spelled, SPELLING_FIRST_MS);
    /* The word meant, where a suspect word's answer is not in yet. Without
       a model nothing is meant, only offered. */
    const spellingSettled = async () => {
      if (spelled && llm) await within(spelled, SPELLING_FIRST_MS);
    };
    const looked = () => state.spelling?.meant || text;

    /* A line in another language than the panel's is left out (run
       sixty-five), where the dictionaries the typo check asks can tell
       within its wait; where they cannot, every line stays. The looked-up
       word itself, a first line the panel's language shares, is no
       stranger. The panel's own dictionaries first, and the others only
       about what those do not know: a word unknown in English is asked of
       every English dictionary there is, which cost the Mac half a second
       for one entry asked about everything at once. */
    const inPanelLanguage = async (entries, code, words) => {
      if (!speller || !entries?.length) return entries;
      const until = Date.now() + CHECK_WAIT_MS;
      const ask = (checked, languages) => within(speller.check(checked, languages), Math.max(0, until - Date.now()));
      const itself = (entry) => entry.text.trim().toLowerCase() === words.trim().toLowerCase();
      const lines = entries.filter((entry) => !itself(entry));
      const checked = [...new Set(lines.flatMap((entry) => spellingWords(entry.text)))];
      if (!checked.length) return entries;
      const own = await ask(checked, [code]);
      if (!own) return entries;
      const strangers = checked.filter((word) => own[word]?.[code]?.there && !own[word][code].known);
      if (!strangers.length) return entries;
      const languages = [...new Set([code, ...spellingLanguages(asked, settings.languages)])];
      const others = await ask([...new Set(strangers.flatMap((word) => translationWords(word, code)))], languages);
      if (!others) return entries;
      const verdicts = { ...others, ...Object.fromEntries(checked.filter((word) => !others[word]).map((word) => [word, own[word]])) };
      return entries.filter((entry) => itself(entry) || !inAnotherLanguage(entry.text, verdicts, { target: code, languages }));
    };

    /* The looked-up word in Apple's translation of its sentence, where the
       aligner is on this machine: "" where anything is missing. */
    const wordInSentence = async (from, code, words) => {
      const came = askedSentence();
      if (!came || state.sentence?.apart || !aligner || !translation) return "";
      try {
        if (!(await aligner.ready())) return "";
        const translated = String(await translation.translate(from, code, came.text) || "");
        if (!translated) return "";
        const [links] = await aligner.align([{ source: came.text, target: translated }]);
        const reading = { panels: [1], codes: [from, code], sentences: [{ start: 0, end: came.text.length, to: { start: 0, end: translated.length }, links: [links || []] }] };
        const found = rangesAcross(reading, [came.text, translated], 0, { start: came.start, end: came.end }, 1);
        return found.length ? asHeadword(glossOf(translated, found).replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, ""), words, code) : "";
      } catch {
        return "";
      }
    };

    const fillPanel = async (offset, code, words) => {
      const panel = state.panels[offset + 1];
      if (panel.kept) return;
      if (llm) {
        try {
          panel.alternatives = await inPanelLanguage(await alternativesFor(llm, {
            text: words,
            source: asked,
            target: code,
            reader,
            sentence: askedSentence()?.text || "",
          }), code, words);
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
        /* Apple writes a word alone as though it began a sentence:
           "Gelangweilt" is German's to keep, "Rug" for "tapis" is not. */
        const translated = from ? asHeadword(await translation?.translate(from, code, words) || "", words, code) : "";
        /* Looked up in its sentence: what the word became where Apple
           translated the sentence, found by the aligner, stands first, as a
           model's meaning there does, and the word alone under it — two
           lines of which one may be wrong say more than one that may be
           (author 2026-11-05). One line where they agree. */
        const there = translated && from ? await wordInSentence(from, code, words) : "";
        const fold = (value) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        if (there && fold(there) !== fold(translated)) {
          panel.alternatives = [{ text: there }, { text: casedLike(translated, there, code) }];
          panel.text = "";
          panel.status = "alternatives";
        } else {
          /* The same word: written as the sentence has it ("sparen", not
             Apple's "Sparen"). */
          panel.text = (there || translated) || "";
          panel.status = translated ? "ready" : await emptyStatus(code);
        }
        panel.engine = translated ? "device" : undefined;
        panel.fallback = !!translated && !!llm;
      }
      tell();
    };

    const wantTerm = !!llm && showsSection(settings, "terms", detected.code) && !keptWords;
    if (keptWords) state.words = keptWords;
    state.status.words = wantTerm ? "working" : "";
    /* The sentence as the questions get it: with the word meant where the
       typo stood, so that nothing is asked about the typo — asked in the
       sentence as it came, the term explained "uncertian" as a misspelling
       (author 2026-10-16). The window keeps the sentence as it came. */
    const askedSentence = () => {
      const came = state.sentence;
      const meant = state.spelling?.meant;
      if (!came || !meant) return came;
      return { text: came.text.slice(0, came.start) + meant + came.text.slice(came.end), start: came.start, end: came.start + meant.length };
    };
    const askTerm = (words) => {
      const sentence = state.sentence?.apart ? null : askedSentence();
      return wordsFor(llm, {
        text: sentence?.text || words,
        source: asked,
        sourceName: askedName,
        languages: settings.languages,
        levels: settings.levels,
        identifier,
        /* The entry in the reader's language, where it stands: the term is
           held to one of its senses (run 76). */
        lookup: {
          ...(sentence ? { words, start: sentence.start, end: sentence.end } : { words, start: 0, end: words.length }),
          shown: state.panels.find((panel, index) => index && panel.code === reader)?.alternatives || [],
        },
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
    };

    /* The upper panel first and alone, so it is reliably filled first; then
       the second panel and the term side by side, the panel's question sent
       first so that a model answering one at a time answers it first. */
    if (targets.length) await fillPanel(0, targets[0], looked());
    await spellingSettled();
    const second = targets.length > 1 ? fillPanel(1, targets[1], looked()) : null;
    await Promise.all([second, wantTerm ? askTerm(looked()) : null, spelled]);
    state.busy = false;
    tell();
    return state;
  }

  /* The two engines, each answering "" where it cannot. The device refuses
     whole language pairs — one it has not downloaded, a language it cannot
     name — and fails outright now and then; the model needs an endpoint. */
  const engines = {
    device: async (code) => (from ? translation.translate(from, code, text) : ""),
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
    if (panel.kept) return;
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
    panel.status = translated ? "ready" : await emptyStatus(code);
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
  /* A section folded away is asked for once it is opened (author
     2026-11-05: "Zugeklappte Bereiche erst laden, wenn sie aufgeklappt
     werden — nur da, wo nichts anderes davon abhängt"). The verbs and the
     terms of a longer reading: nothing else waits on either. Not a
     translation, which everything below stands on, nor a lookup's term,
     which decides its card. Until then its section says nothing and the
     rest of the reading goes on without it. */
  const heldBack = (key) => !state.short && !!later?.folded?.(key);
  const gate = (held, key, status) => (held
    ? later.unfolded(key).then(() => {
      state.status[status] = "working";
      tell();
    })
    : Promise.resolve());

  if (wantVerbs && keptVerbs) {
    state.verbs = keptVerbs;
    state.forms = kept.forms || [];
  }
  const lateVerbs = wantVerbs && !keptVerbs && heldBack("verbs");
  state.status.verbs = wantVerbs && !keptVerbs ? (lateVerbs ? "later" : "working") : "";
  const formsDone = !wantVerbs || keptVerbs
    ? Promise.resolve([])
    : gate(lateVerbs, "verbs", "verbs")
    .then(() => findVerbForms(llm, { text, source: detected.code }))
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

  const verbsDone = !wantVerbs || keptVerbs
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

  if (wantWords && keptWords) state.words = keptWords;
  const lateWords = wantWords && !keptWords && heldBack("terms");
  state.status.words = wantWords && !keptWords ? (lateWords ? "later" : "working") : "";
  const wordsDone = !wantWords || keptWords
    ? Promise.resolve()
    : gate(lateWords, "terms", "words")
    .then(() => wordsFor(llm, {
    text,
    source: asked,
    sourceName: askedName,
    languages: settings.languages,
    levels: settings.levels,
    identifier,
  }))
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

  /* Held back, a section neither waits for the other nor is waited for:
     the one that comes first is drawn and placed, and the late one gives way
     to it where both stand on one word. */
  const wordAssignment = Promise.all([translations, wordsDone, lateVerbs ? null : formsDone]).then(async () => {
    untangle(state, lateWords || lateVerbs ? "words" : "");
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
  const verbAssignment = Promise.all([translations, verbsDone, lateWords ? null : wordsDone]).then(async () => {
    untangle(state, lateVerbs ? "verbs-all" : lateWords ? "verbs" : "");
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

  await Promise.all([lateWords ? null : wordAssignment, lateVerbs ? null : verbAssignment]);
  state.busy = false;
  tell();

  if (glanceWanted && !(await aligned)) {
    state.glance = null;
    tell();
  }
  return state;
}

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
  /* Where the reader's own language is a translation beside another, that
     other one is also laid over it straight: its hover is the reader's
     words for its own, not by way of the original (run sixty-eight). */
  const third = !!other && readerPanel > 0 && glance;
  const each = other ? (third ? 3 : 2) : 1;
  let links;
  try {
    links = await aligner.align(sentences.flatMap((sentence) => {
      const original = text.slice(sentence.start, sentence.end);
      return [
        { source: original, target: cut(own, sentence.to) },
        ...(other ? [{ source: original, target: cut(other, sentence.second) }] : []),
        ...(third ? [{ source: cut(other, sentence.second), target: cut(own, sentence.to) }] : []),
      ];
    }));
    if (!Array.isArray(links) || links.length !== sentences.length * each) return false;
  } catch {
    return false;
  }
  const panels = second === -1 ? [columns[0]] : [columns[0], second];
  const linksOf = (index) => links.slice(index * each, index * each + each);
  state.links = {
    panels,
    /* Each panel's language, for the small words a place may bridge. */
    codes: [source, ...state.panels.slice(1).map((panel) => panel.code)],
    sentences: sentences.map((sentence, index) => ({
      start: sentence.start,
      end: sentence.end,
      to: sentence.to,
      second: sentence.second,
      links: linksOf(index).slice(0, other ? 2 : 1),
    })),
  };
  if (glance) {
    sentences.forEach((sentence, index) => {
      const [ownLinks, otherLinks, between] = linksOf(index);
      const original = text.slice(sentence.start, sentence.end);
      const units = unitsFromLinks(
        original,
        cut(own, sentence.to),
        ownLinks,
        [source, own.code],
        other ? { text: cut(other, sentence.second), links: otherLinks, codes: [source, other.code] } : null,
        { fill: true },
      );
      sentence.units = units ? placeUnits(sentence, units, sentence.second && { to: sentence.second }) : null;
      if (third && sentence.second) {
        const theirs = unitsOfThird({
          original, own: cut(own, sentence.to), other: cut(other, sentence.second),
          links: { own: ownLinks, other: otherLinks, between },
          codes: [source, own.code, other.code],
        });
        if (theirs) sentence.third = placeThird(sentence, theirs);
      }
      sentence.status = "done";
    });
    state.glance = { panels, reader: readerPanel, sentences, by: "aligner" };
  }
  tell();
  return true;
}


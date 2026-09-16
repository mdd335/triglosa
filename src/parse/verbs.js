/* Verb forms: reading them out of the model's answers, and choosing which
   ones to show.

   Two model calls sit around this. The first only finds forms, the second
   annotates them. The choice in between happens here, without a further
   call: it is on the critical path of the whole run, and a language pack
   answers it for free. Where a pack has no verb model — every language but
   Spanish today — the model's own order decides, which shows fewer
   interesting rows but no wrong ones. */

import { cleanLine, containsWord, orderByTextPosition, stripDiacritics, stripQuotes, wordIndexOf } from "../text.js";
import { formInText } from "../match/positions.js";
import { bareInfinitive, languagePack, wordSet } from "../languages/index.js";
import { isFunctionWord } from "../vocabulary.js";

export const MAX_VERBS = 3;
/* How many forms the annotation is shown to choose its three from. A long
   text holds more; where a pack can rank them, the hardest go in. */
export const VERB_CANDIDATES = 10;

/* Step one: the bare list of forms the model found. */
export function parseVerbForms(raw, text, code) {
  const verbs = languagePack(code).verbs;
  const found = String(raw || "")
    .split(/\r?\n/)
    .map((line) => stripQuotes(cleanLine(line)))
    /* A line with a pipe or over 40 characters is the model explaining
       itself, not a verb form. */
    .filter((s) => s && !s.includes("|") && s.length < 40)
    /* Only forms the text really carries. The model otherwise hands back the
       infinitive instead of the conjugated form (respondió -> responder),
       and what is not in the text cannot be highlighted later.

       Not in one piece, though: a German separable verb and an auxiliary
       standing far from its participle are named correctly and stand apart.
       `formInText` writes those with a plus, which the highlighting already
       reads, and still refuses a form the text does not carry. */
    .map((s) => formInText(text, s))
    /* The m of "I'm" and the s of "Tom's": a clitic, and joined to the next
       form it became a row called "m swamped". */
    .filter((s) => s && !isClitic(text, s));

  /* Both classes, because neither is ever a verb and a pack keeps its
     conjunctions in a list of their own: French "comme" stands there and not
     among the function words. */
  const structural = wordSet(code, "functionWords", "conjunctions");
  const joined = joinAdjacent(found, text, code)
    /* A word standing in a text as a preposition, a conjunction or a pronoun
       is that word, whatever else it could be: "como general de división" is
       "as a major general", and the row said "como | comer | essen | yo |
       presente". Where such a word really is a verb it is a verb of the first
       weeks — comer, ser, ir — whose row is left out from B1 up anyway, so
       the rule costs almost nothing and takes the whole class of them out. */
    .filter((form) => !structural.has(stripDiacritics(form).toLowerCase()));

  /* Forms of "to be" carry no information worth a row. Only dropped where a
     pack knows which ones they are, and only while something else remains —
     a sentence made of nothing but copulas still gets its table. */
  const withoutCopula = verbs?.isCopula ? joined.filter((f) => !verbs.isCopula(f)) : joined;
  /* The same for an auxiliary standing alone, where the pack lists it: "hat |
     haben | have" took a row of three while "erhoben werden" was there. */
  const auxiliaries = wordSet(code, "auxiliaries");
  const meaningful = withoutCopula.filter((f) => !auxiliaries.has(stripDiacritics(f).toLowerCase()));
  const kept = meaningful.length ? meaningful : withoutCopula.length ? withoutCopula : joined;
  return orderByTextPosition(kept, text, "");
}

function isClitic(text, form) {
  if (form.replace(/[^\p{L}]/gu, "").length > 1) return false;
  const at = wordIndexOf(text, form);
  return at > 0 && /['’]/.test(text.charAt(at - 1));
}

/* Forms that stand side by side in the text are one form — where one of them
   is an auxiliary.

   The prompt asks for a compound tense on one line and the cloud model hands
   back "ha" and "aprobado" as two — after which the table explained "ha |
   haber | haben" and the participle carrying the meaning was never chosen.
   Nothing but whitespace between two found forms makes them one: an
   auxiliary with its participle, a modal with its infinitive. A comma or a
   word between them is a boundary, and three words are as far as it goes.

   The auxiliary is what makes the two one, and without that condition any two
   verbs standing next to each other were welded together: "Retry hover" out
   of an English heading arrived as one form and was annotated "to retry
   hover", a verb of no language. Two full verbs side by side are two verbs,
   and the pack knows which words are auxiliaries. */
const MAX_JOINED_WORDS = 3;

function joinAdjacent(forms, text, code) {
  const auxiliaries = wordSet(code, "auxiliaries");
  const isAuxiliary = (form) => String(form || "")
    .split(/\s+/)
    .some((word) => auxiliaries.has(stripDiacritics(word).toLowerCase()));
  const out = [];
  let from = 0;
  let last = null;
  for (const form of forms) {
    const at = form.includes("+") ? -1 : wordIndexOf(text.slice(from), form);
    if (at === -1) {
      out.push(form);
      last = null;
      continue;
    }
    const start = from + at;
    const words = (s) => s.split(/\s+/).length;
    if (last && !/\S/.test(text.slice(last.end, start))
        && words(last.form) + words(form) <= MAX_JOINED_WORDS
        && (isAuxiliary(last.form) || isAuxiliary(form))) {
      last.form = text.slice(last.start, start + form.length);
      last.end = start + form.length;
      out[out.length - 1] = last.form;
    } else {
      last = { form, start, end: start + form.length };
      out.push(form);
    }
    from = start + form.length;
  }
  return out;
}

/* Step two: the annotated table. form | infinitive | meaning | person |
   tense. A line whose second field is not a base form is dropped: the
   conjugation link and the Anki entry are built from it, and the model
   writes things like "ser (implícito)" or a bare dash when it falls out of
   role.

   Three packs name their own infinitives; the other five have no such rule,
   and for Arabic there is nothing to write - its dictionaries list the third
   person of the perfect, not an infinitive. What all eight do carry is their
   function words, and a preposition is never a verb in any of them. Measured
   on the eight-language corpus that is exactly one row: "على" arrived as the
   base form of an Arabic verb and was drawn. */
export function parseVerbTable(raw, code) {
  const verbs = languagePack(code).verbs;
  const out = [];
  for (const line of String(raw || "").split(/\r?\n/)) {
    const L = cleanLine(line);
    if (!L) continue;
    const parts = L.split("|");
    if (parts.length < 2) continue;
    const form = parts[0].trim();
    const infinitive = parts[1].trim();
    if (!form || !infinitive) continue;
    /* "m | m" for the m of "I'm": a clitic with nothing to say about it. */
    if (!(parts[2] || "").trim() || form.replace(/[^\p{L}]/gu, "").length < 2) continue;
    if (isFunctionWord(infinitive, [code])) continue;
    if (verbs?.isInfinitive && !verbs.isInfinitive(infinitive)) continue;
    out.push({
      form,
      infinitive,
      meaning: (parts[2] || "").trim(),
      ...grammarOf(parts[3], parts[4], code),
    });
    if (out.length >= MAX_VERBS) break;
  }
  return out;
}

/* The person as the pack names it, or nothing. The local model writes the
   subject into the field — "El Gobierno", "los requisitos de acceso" — and a
   noun where a person belongs is worse than a gap. One of a label's slashed
   parts stands for the whole label: "elle" is "il/elle/on". Where a pack
   names no persons, whatever came back stays. */
const FORM_PERSONS = ["infinitive", "gerund", "participle", "impersonal"];

export function knownPerson(field, code) {
  const person = String(field || "").trim();
  const labels = languagePack(code).grammar?.persons;
  if (!person || !labels) return person;
  const fold = (s) => stripDiacritics(s).toLowerCase();
  const exact = labels.concat(FORM_PERSONS).find((label) => fold(label) === fold(person));
  if (exact) return exact;
  return labels.find((label) => fold(label).split("/").includes(fold(person))) || "";
}

/* The two grammar fields as they are shown, side by side.

   A form with no person says so twice over: asked for the person of an
   infinitive, both models answer "infinitive", and the row then read
   "infinitive · infinitive" — or, where the tense came back in the language of
   the text as it should, "infinitive · infinitivo", which reads like two
   different findings. The four form names are not persons at all; they stand
   in that field only because the question offers them for a form that has no
   person. So where the tense says what the form is, the person field goes. */
export function grammarOf(personField, tenseField, code) {
  const person = knownPerson(personField, code);
  const tense = String(tenseField || "").trim();
  const fold = (s) => stripDiacritics(s).toLowerCase();
  const noPerson = FORM_PERSONS.some((label) => fold(label) === fold(person));
  return { person: tense && (noPerson || fold(person) === fold(tense)) ? "" : person, tense };
}

/* One verb, one row. A form the text splits — "hat sich … geeinigt" — can
   come back as two rows with the same base form, and the reader then read the
   same verb twice. Where both halves stand in one sentence in that order they
   become one form written with a plus, the notation the marking reads;
   otherwise the second is the same verb somewhere else and goes. */
export function mergeSameVerb(rows, text) {
  const out = [];
  for (const row of rows || []) {
    const same = out.find((kept) => kept.infinitive === row.infinitive);
    if (!same) {
      out.push({ ...row });
      continue;
    }
    const joined = formInText(text, `${same.form.replace(/\s*\+\s*/g, " ")} ${row.form.replace(/\s*\+\s*/g, " ")}`);
    if (joined.includes("+")) {
      same.form = joined;
      same.person = same.person || row.person;
    }
  }
  return out;
}

/* Pick the hardest forms and put them back into the order of the text. A tie
   is decided by position, so the earlier one comes first. */
export function selectVerbForms(forms, count, code) {
  const difficulty = languagePack(code).verbs?.difficulty;
  const list = forms || [];
  if (!difficulty) return list.slice(0, count);
  return list
    .map((form, i) => ({ form, i, score: difficulty(form) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.form);
}

/* Drop words that coincide with, or sit inside, a verb form already found.
   The prompt forbids verbs already, but verb detection occasionally takes an
   adjective for a verb — then the same spot in the text would stand in both
   lists, and the verb colour would win the highlighting. */
export function withoutVerbs(words, verbs) {
  const forms = (verbs || [])
    .map((v) => stripDiacritics(String(v.form || "")).toLowerCase().trim())
    .filter(Boolean);
  if (!forms.length) return words || [];
  return (words || []).filter((w) => {
    /* The spot, where there is one: the model shortens "subsanar" to
       "subsana", which the text does not hold, and the spot found for it is
       the verb itself. */
    const t = stripDiacritics(String(w.spot || w.text || "")).toLowerCase().trim();
    if (!t) return false;
    const single = !t.includes(" ");
    return !forms.some((f) => {
      if (f === t) return true;
      /* A single word sitting inside a multipart verb form: "exigido"
         against "habia exigido" — same word, so it goes.
         A multipart expression STAYS, even when a verb form occurs in it:
         "tiramos la toalla" is a different entry from the verb "tiramos".
         It used to fall out here, and with it exactly the kind of entry that
         is worth the most. The verb colour then wins the highlighting, but
         the row in the table stays. */
      return single && containsWord(f, t);
    });
  });
}

/* The verbs of the first weeks — be, have, go — are left out of the table for
   a reader from B1 up and in the reader's own language, whatever the model
   chose. Decided here rather than asked for: it is a list, and a list does
   not have to be trusted to follow an instruction. Below B1 they stay, because
   there they are still what is being learned. */
export function withoutBasicVerbs(verbs, code, { level, own } = {}) {
  if (!own && /^A/i.test(level || "B1")) return verbs;
  const basic = wordSet(code, "basicVerbs");
  if (!basic.size) return verbs;
  return verbs.filter((verb) =>
    !basic.has(stripDiacritics(bareInfinitive(code, verb.infinitive)).toLowerCase()));
}

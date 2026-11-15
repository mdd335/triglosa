/* A verb's base form where no AI model can say it (author 2026-11-12): from
   Apple's own tagger, on the Mac and the iPhone, through the translation
   helper (platform/translation.js, `words`). Windows has none, and there
   nothing changes.

   Measured (run eighty): the tagger's base forms are right in German,
   English, Spanish, French, Italian, Portuguese and Russian, also for a word
   alone ("abgetan" abtun, "шла" идти); it knows nothing of Arabic. Its word
   classes are wrong often enough ("yeux" an adjective, "uova" a verb, a
   Russian verb a noun in its sentence) that a class is never shown, and is
   believed only as far as this:

   - the picked text is one word, and the tagger calls it a verb both in its
     sentence and alone, with the same base form — in its sentence "домой"
     came back a verb "домыть", alone an adverb; or, where it names the class
     wrongly, it gives the same base form in both, other than the word, and
     calls that base form alone a verb ("obtienes" obtener);
   - no particle stands after it in its clause — up to a comma, a colon or a
     conjunction — except one before another verb: a separable verb ("fängt
     … an") is named without its particle ("fangen"), while "to" in "want to
     go" belongs to "go", and "vorbei" in "…hätte, käme ich gern öfter
     vorbei" to "käme";
   - the base form has the shape of an infinitive, where the language's pack
     says what that is: the Russian tagger calls nouns verbs with a noun's
     base form ("замедления" замедление), the Portuguese one gave
     "deslocado" (run eighty-five);
   - a word the tagger calls an adjective, an adverb or a conjunction in its
     sentence and alone gets none ("aufschiebende", "arriba" arribar);
   - the spelling checker of the language knows the base form ("muss" came
     back "muessen").

   Measured over 1,287 picks in seven languages (run 85): about one base
   form in sixty shown in natural texts is wrong, four verbs in five get
   theirs. What stays wrong is the tagger's own slip that is itself a word
   ("pueda" podar), and "fue"/"foi", always "ir".

   Anything else gives no base form: a row without its arrow rather than one
   with a wrong one. */

import { bareInfinitive, citationForm, languagePack, wordSet } from "./languages/index.js";
import { stripDiacritics } from "./text.js";
import { asHeadword } from "./parse/alternatives.js";

export const VERB = "Verb";
const PARTICLE = "Particle";
const CONJUNCTION = "Conjunction";
/* Classes the tagger never gives a verb it names rightly. */
const NEVER_VERBS = new Set(["Adjective", "Adverb", CONJUNCTION]);
/* Where a sentence ends, for how far a particle is looked for. */
const ENDS_SENTENCE = /[.!?;。！？…]/;
/* Where a clause ends, past which a particle is another verb's. */
const ENDS_CLAUSE = /[,:،、，：]/;
/* How long the spelling checker is waited for: it is warm with the window,
   and a pick is drawn once the base form is known. */
export const BASE_FORM_WAIT_MS = 600;

const fold = (value) => String(value || "").trim().toLocaleLowerCase();

function within(promise, ms) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).catch(() => null),
    new Promise((done) => { timer = setTimeout(() => done(null), ms); }),
  ]).finally(() => clearTimeout(timer));
}

/* The verb's base form the tagger gave in its sentence, where what it said
   holds up there (see above); "" otherwise. `words` is the tagger's answer
   for `text`, `start` and `end` the picked word's place in it. */
export function verbInSentence(words, { text, start, end }, { anyClass = false } = {}) {
  const touching = (words || []).filter((word) => word.start < end && word.end > start);
  if (touching.length !== 1) return "";
  const [verb] = touching;
  if ((!anyClass && verb.kind !== VERB) || !verb.base) return "";
  const after = words.filter((word) => word.start >= verb.end).sort((a, b) => a.start - b.start);
  let previous = verb;
  for (const [index, word] of after.entries()) {
    const between = String(text || "").slice(previous.end, word.start);
    if (ENDS_SENTENCE.test(between) || ENDS_CLAUSE.test(between) || word.kind === CONJUNCTION) break;
    if (word.kind === PARTICLE && after[index + 1]?.kind !== VERB) return "";
    previous = word;
  }
  return verb.base;
}

/* The base form the tagger gives a word alone, where it takes it for one
   word of the class asked; "" otherwise. */
export function baseOfAlone(words, kind = VERB) {
  if (!words || words.length !== 1) return "";
  const [word] = words;
  return word.kind === kind && word.base ? word.base : "";
}

/* Whether the language's spelling checker knows a word. Nothing known —
   no checker, no dictionary of the language, no answer in time — is no. */
async function spelled(speller, word, code, wait) {
  if (!speller) return false;
  const verdicts = await within(speller.check([word], [code]), wait);
  const verdict = verdicts?.[word]?.[code];
  return !!verdict?.there && !!verdict.known;
}

/* A picked word's base form as a verb, by the tagger, or "". `text` is what
   it was picked in, `start` and `end` its place there. */
export async function deviceBaseForm({ text, start, end, code, translation, speller, wait = BASE_FORM_WAIT_MS }) {
  if (!code || !translation?.words || !(end > start)) return "";
  const word = String(text || "").slice(start, end).trim();
  if (!word || /\s/.test(word)) return "";
  const [inSentence, alone] = await Promise.all([translation.words(code, text), translation.words(code, word)]);
  const at = { text, start, end };
  const shape = languagePack(code).verbs?.isInfinitive;
  const here = (inSentence || []).filter((one) => one.start < end && one.end > start);
  /* Both votes on one class that is never a verb: the tagger is sure, and
     only its base form looks like a verb's ("arriba" arribar, "adelante"
     adelantar, "aufschiebende" aufschieben, "puis" pouvoir). */
  if (here.length === 1 && alone?.length === 1 && here[0].kind === alone[0].kind && NEVER_VERBS.has(here[0].kind)) return "";
  let base = verbInSentence(inSentence, at);
  if (base && shape && !shape(base)) return "";
  if (!base || fold(baseOfAlone(alone)) !== fold(base)) {
    /* Or the class wrong and the base form right (run 82's "отказал", the
       phone's "obtienes" a preposition in its sentence and a noun alone,
       both times "obtener"): the same base form in the sentence and alone,
       other than the word, which the tagger takes for a verb itself. A noun
       keeps its own base form or gets another one alone ("compra" compra,
       alone comprar), and is not taken. Only where the language's pack says
       what an infinitive looks like, and the base form looks like one: in
       Russian the tagger gave "собрания" the base form "собрание" and called
       that a verb. */
    const loose = verbInSentence(inSentence, at, { anyClass: true });
    const lone = alone?.length === 1 ? alone[0].base : "";
    if (!shape || !loose || !shape(loose) || fold(lone) !== fold(loose) || fold(loose) === fold(word)) return "";
    if (fold(baseOfAlone(await translation.words(code, loose))) !== fold(loose)) return "";
    base = loose;
  }
  return (await spelled(speller, base, code, wait)) ? base : "";
}

/* A single word's base form as a verb, asked alone — for the meaning of a
   verb in the reader's own language, which stands as a base form too. One
   vote only, and only for the meaning beside a row. */
export async function deviceBaseOfWord({ word, code, translation, speller, wait = BASE_FORM_WAIT_MS }) {
  const bare = String(word || "").trim();
  if (!code || !bare || /\s/.test(bare) || !translation?.words) return "";
  const base = baseOfAlone(await translation.words(code, bare));
  if (!base) return "";
  return (await spelled(speller, base, code, wait)) ? base : "";
}

/* A verb's meaning where the tagger gave its base form, as a model writes a
   verb's meaning: the base form's translation, not the form's (author
   2026-11-12: "usarlo → usar" stood beside "es … verwenden", the aligner's
   piece of a separable verb, and "belittling" beside a noun). Apple's
   translation of the base form alone, in the base form of the reader's
   language and with its citation form; Apple writes a word alone with a
   capital, kept by a language that capitalises its nouns — here the word is
   a verb, so a capital goes where the tagger takes the small-lettered word
   for a verb its spelling checker knows ("Ansammeln" ansammeln). "" where
   Apple gives nothing. */
export async function verbMeaning({ base, from, reader, translation, speller, wait = BASE_FORM_WAIT_MS }) {
  if (!base || !from || !reader || from === reader || !translation?.translate) return "";
  const asked = citationForm(from, base);
  let said;
  try {
    said = await deviceHeadword(String(await translation.translate(from, reader, asked) || "").trim(), asked, reader, translation);
  } catch {
    return "";
  }
  said = said.replace(/[.。!]+$/u, "");
  /* What Apple puts in front of an infinitive it was given with its
     particle ("to found" became "para fundar") goes: the reader's pack's
     function words before the first other word, but its own particle
     ("to order"). */
  const small = wordSet(reader, "functionWords");
  const marker = String(languagePack(reader).infinitiveMarker || "").toLowerCase();
  const parts = said.split(/\s+/);
  while (parts.length > 1 && parts[0].toLowerCase() !== marker && small.has(stripDiacritics(parts[0]).toLowerCase())) parts.shift();
  said = parts.join(" ");
  if (!said || parts.length > 4) return said;
  /* A verb the tagger knows in the reader's language: its base form, with
     the reader's particle — a capital Apple gave it gone ("Kämpfen"). */
  const lower = said.charAt(0).toLocaleLowerCase() + said.slice(1);
  const ask = (word) => deviceBaseOfWord({ word, code: reader, translation, speller, wait });
  const found = (lower !== said ? await ask(lower) : "") || await ask(bareInfinitive(reader, said));
  if (found) return citationForm(reader, found);
  /* An infinitive Apple took for a noun ("shelve" las estantes) is no
     meaning of the verb: where the reader's tagger calls the one word a
     noun, none is given rather than a wrong one. In a language that
     capitalises its nouns only a base form with a capital is one. Nor a
     word the tagger knows no base form of: "resultar" came back
     "Resulten", which is no German word (author 2026-11-13). */
  if (parts.length === 1) {
    let one = null;
    try {
      [one] = (await translation.words?.(reader, said)) || [];
    } catch {
      /* Nothing known: the meaning stays. */
    }
    const capital = String(one?.base || "").charAt(0);
    const noun = one?.kind === "Noun"
      && (!languagePack(reader).capitalisesNouns || (capital && capital !== capital.toLowerCase()));
    if (noun || !one?.base) return "";
  }
  return said;
}

/* Apple writes a word translated alone with a capital, as though it began a
   sentence; `asHeadword` takes it off, but not in a language that
   capitalises its nouns, where the capital may be right ("Großartig" for
   "genial" is not). There Apple's tagger tells (author 2026-11-13): it gives
   a noun its base form with the capital ("Haus", "Morgen", "Leben") and
   anything else with a small letter ("großartig", "gestern", "verwenden").
   So the first letter goes small where the first word's base form begins
   small — and only where the looked-up text itself began small, as
   `asHeadword` asks. A word the tagger keeps capitalised although it is
   none ("Schön") stays as Apple wrote it. On Windows, without a tagger,
   nothing changes. */
export async function deviceHeadword(text, input, code, translation) {
  const written = asHeadword(String(text || ""), input, code);
  const lead = written.charAt(0);
  const asked = String(input || "").trim().charAt(0);
  if (!languagePack(code).capitalisesNouns || !lead || lead === lead.toLowerCase()) return written;
  if (!asked || asked !== asked.toLowerCase() || asked === asked.toUpperCase()) return written;
  const next = written.charAt(1);
  if (next && next === next.toUpperCase() && next !== next.toLowerCase()) return written;
  let words;
  try {
    words = (await translation?.words?.(code, written)) || [];
  } catch {
    return written;
  }
  const base = String(words[0]?.start === 0 ? words[0].base : "");
  const first = base.charAt(0);
  return first && first !== first.toUpperCase() ? lead.toLowerCase() + written.slice(1) : written;
}

/* The base form of the verb a picked verb became in the reader's
   translation (author 2026-11-13, run 86): of the words the aligner placed
   it on (`pieces`, places in `text`), word by word ("sich bücken" bücken),
   past the reader's auxiliaries and small words ("wird vergessen"
   vergessen), the first the tagger calls a verb there — one vote, since the
   aligner already says it renders the verb — with the pack's shape and the
   spelling checker's yes. "" where none holds up: a separable "baut … auf"
   is no verb alone, a noun none. */
export async function verbInTranslation({ text, pieces = [], code, translation, speller, wait = BASE_FORM_WAIT_MS }) {
  if (!pieces.length || !code || !translation?.words) return "";
  const tagged = await translation.words(code, text);
  const small = wordSet(code, "functionWords", "auxiliaries");
  const shape = languagePack(code).verbs?.isInfinitive;
  for (const word of tagged.filter((one) => pieces.some((piece) => one.start < piece.end && one.end > piece.start))) {
    if (small.has(stripDiacritics(String(text).slice(word.start, word.end)).toLowerCase())) continue;
    const found = verbInSentence(tagged, { text, start: word.start, end: word.end });
    if (found && (!shape || shape(found)) && (await spelled(speller, found, code, wait))) return found;
  }
  return "";
}

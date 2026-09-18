import test from "node:test";
import assert from "node:assert";
import { MAX_WORDS, parseMarkedWord, parseVerbGrammar, parseWordClass, parseWords, usableSpot, withoutNestedTerms } from "../../src/parse/words.js";
import {
  MAX_SYNONYMS,
  MAX_SYNONYM_WORDS,
  asksForSynonyms,
  parseSynonyms,
} from "../../src/parse/synonyms.js";
import { isBaseForm, isPartOfTerm, trimToBaseForm } from "../../src/parse/terms.js";
import { explainMarked, wordsFor } from "../../src/ask.js";

const RUN = ["de", "en", "es"];
const syn = (raw, term) => parseSynonyms(raw, term, RUN);
/* A German reader with a Spanish text. */
const marked = (meaningRaw, spotRaw, term, code, thirdRaw, grammarRaw) =>
  parseMarkedWord({ meaningRaw, spotRaw, term, code, thirdRaw, grammarRaw, lang: "de", codes: RUN });

test("three slots, and the parser reads in with reserve", () => {
  assert.strictEqual(MAX_WORDS, 3);
  /* Read in more generously, because the filters trim afterwards. The
     reserve must not lead to more than three being shown — the caller's
     slice does that. */
  const raw = Array.from({ length: 9 }, (_, i) => `w${i} | d${i} | e${i}`).join("\n");
  assert.strictEqual(parseWords(raw).length, MAX_WORDS + 3);
});

test("further pipes belong to the explanation, not to a fourth column", () => {
  const rows = parseWords("fianza | Kaution | Sicherheit beim Einzug | im Mietrecht");
  assert.strictEqual(rows[0].meaning, "Kaution");
  assert.strictEqual(rows[0].note, "Sicherheit beim Einzug | im Mietrecht");
});

test("a note written behind a semicolon instead of a pipe is still the note", () => {
  const rows = parseWords("Trial Day | Probetag; Sportveranstaltung");
  assert.strictEqual(rows[0].meaning, "Probetag");
  assert.strictEqual(rows[0].note, "Sportveranstaltung");
  /* With three fields a semicolon belongs to the note, as asked. */
  assert.strictEqual(parseWords("fianza | Kaution | Sicherheit; Mietrecht")[0].note, "Sicherheit; Mietrecht");
});

/* ---- the synonym line ---- */

test("the synonym line is split and capped at three", () => {
  assert.deepStrictEqual(syn("depósito | garantía | aval", "fianza"), ["depósito", "garantía", "aval"]);
  assert.deepStrictEqual(syn("uno | dos | tres | cuatro | cinco", "fianza"), ["uno", "dos", "tres"]);
  assert.strictEqual(MAX_SYNONYMS, 3);
});

test("a single synonym has no pipe and still counts", () => {
  /* The difference from a field line: there a line without a pipe says
     nothing about the field boundaries and is discarded. Here it is the
     answer. */
  assert.deepStrictEqual(syn("Sicherheitsleistung", "Kaution"), ["Sicherheitsleistung"]);
  assert.deepStrictEqual(syn("- rendirse", "tirar la toalla"), ["rendirse"]);
});

test("the dash means 'there is none' and yields an empty line", () => {
  assert.deepStrictEqual(syn("-", "DeepSeek-R1"), []);
  assert.deepStrictEqual(syn("- | - | -", "DeepSeek-R1"), []);
  assert.deepStrictEqual(syn("", "DeepSeek-R1"), []);
  assert.deepStrictEqual(syn(null, "DeepSeek-R1"), []);
  /* Alone it stands for nothing — inside a word it is a hyphen like any
     other and must not cost the synonym. */
  assert.deepStrictEqual(syn("ad-hoc | spontan", "improvisiert"), ["ad-hoc", "spontan"]);
});

test("a word is no synonym of itself", () => {
  assert.deepStrictEqual(syn("fianza | depósito", "Fianza"), ["depósito"]);
  assert.deepStrictEqual(syn("credito | préstamo", "crédito"), ["préstamo"]);
  /* A part of a phrase falls for the same reason: "crédito" is no synonym of
     "línea de crédito", it is a piece of it. */
  assert.deepStrictEqual(syn("crédito | financiación", "línea de crédito"), ["financiación"]);
});

test("duplicates stand only once", () => {
  assert.deepStrictEqual(syn("garantía | Garantia | aval", "fianza"), ["garantía", "aval"]);
});

test("a paraphrase is no synonym", () => {
  assert.deepStrictEqual(
    syn("dejar de intentarlo porque ya no se puede | rendirse", "tirar la toalla"),
    ["rendirse"],
  );
  /* Two content words for a one-word term: allowed. */
  assert.deepStrictEqual(syn("entidad bancaria", "banco"), ["entidad bancaria"]);
  /* Three are not. */
  assert.deepStrictEqual(syn("gran entidad bancaria", "banco"), []);
  /* A phrase may carry correspondingly longer synonyms. */
  assert.deepStrictEqual(syn("darse por vencido | arrojar la esponja", "tiramos la toalla"), [
    "darse por vencido",
    "arrojar la esponja",
  ]);
});

test("synonyms are only asked for up to two words", () => {
  /* Above that the term is an expression or a term of art, and what the
     model delivers is a paraphrase rather than a replacement. The call is
     then dropped entirely — not asked is not paid for. */
  assert.strictEqual(MAX_SYNONYM_WORDS, 2);
  assert.strictEqual(asksForSynonyms("fianza"), true);
  assert.strictEqual(asksForSynonyms("ensayo clínico"), true);
  assert.strictEqual(asksForSynonyms("tirar la toalla"), false);
  assert.strictEqual(asksForSynonyms("  se negó  "), true, "edge whitespace does not count");
});

/* ---- the clicked word ---- */

test("what is shown is the clicked word, not the model's inflected one", () => {
  const m = marked("fianzas | Kaution | Erklärung dazu.", "Kaution | deposit", "fianza", "es");
  assert.strictEqual(m.text, "fianza");
});

test("an unknown word yields no entry rather than an invented one", () => {
  assert.strictEqual(marked("procaz | - | UNBEKANNT", "- | -", "procaz", "es"), null);
  assert.strictEqual(marked("procaz | - | UNKNOWN", "- | -", "procaz", "es"), null);
  assert.strictEqual(marked("", "- | -", "procaz", "es"), null);
  assert.strictEqual(marked("no separator anywhere", "- | -", "procaz", "es"), null);
});

test("an unusable spot line does not cost the explanation", () => {
  /* The two calls can fail separately. If the spot call fails, the entry
     stands — just without a highlight. */
  const m = marked("fianza | Kaution | Im Mietrecht die Sicherheitsleistung.", "Kaution", "fianza", "es");
  assert.strictEqual(m.meaning, "Kaution");
  assert.strictEqual(m.a, "");
  assert.strictEqual(m.b, "");
  assert.strictEqual(m.note, "Im Mietrecht die Sicherheitsleistung.");
});

test("the synonyms hang off the entry and are missing when the call fails", () => {
  const m = marked(
    "fianza | Kaution | Im Mietrecht die Sicherheitsleistung.",
    "Kaution | deposit",
    "fianza",
    "es",
    "depósito | garantía",
  );
  assert.deepStrictEqual(m.synonyms, ["depósito", "garantía"]);
  const o = marked("fianza | Kaution | Im Mietrecht die Sicherheitsleistung.", "Kaution | deposit", "fianza", "es", "");
  assert.deepStrictEqual(o.synonyms, []);
  assert.strictEqual(o.note, "Im Mietrecht die Sicherheitsleistung.");
  assert.strictEqual(o.a, "Kaution");
});

test("a missing equivalent leaves the explanation — it stands at the back", () => {
  const m = marked("fianza | Im Mietrecht die Sicherheitsleistung.", "Kaution | deposit", "fianza", "es");
  assert.strictEqual(m.meaning, "");
  assert.strictEqual(m.note, "Im Mietrecht die Sicherheitsleistung.");
  assert.strictEqual(m.a, "Kaution");
});

test("for an expression field 2 carries the base form, not the spot", () => {
  const m = marked(
    "tirar la toalla | das Handtuch werfen | Redewendung für aufgeben.",
    "warfen ... das Handtuch | threw in the towel",
    "tiramos la toalla",
    "es",
  );
  assert.strictEqual(m.meaning, "das Handtuch werfen");
  assert.strictEqual(m.a, "warfen ... das Handtuch");
  assert.strictEqual(m.b, "threw in the towel");
  assert.strictEqual(m.note, "Redewendung für aufgeben.");
});

test("the explanation never lands in a spot field", () => {
  const m = marked("x | Entsprechung | Eine Erklärung mit | einem Strich darin.", "A-Stelle | B-Stelle", "x", "es");
  assert.strictEqual(m.meaning, "Entsprechung");
  assert.strictEqual(m.a, "A-Stelle");
  assert.strictEqual(m.b, "B-Stelle");
  assert.strictEqual(m.note, "Eine Erklärung mit | einem Strich darin.");
});

test("for an abbreviation the expansion replaces the equivalent", () => {
  const m = marked(
    "IVA | Mehrwertsteuer | Die Steuer auf Waren und Dienstleistungen; Steuerrecht",
    "",
    "IVA",
    "es",
    "Impuesto sobre el Valor Añadido | Mehrwertsteuer",
  );
  assert.strictEqual(m.meaning, "Impuesto sobre el Valor Añadido – Mehrwertsteuer");
  /* And the synonym line stays empty: the third question was the expansion. */
  assert.deepStrictEqual(m.synonyms, []);
  /* If that call delivers nothing, the equivalent stands. */
  const n = marked("IVA | Mehrwertsteuer | Die Steuer auf Waren; Steuerrecht", "", "IVA", "es", "-");
  assert.strictEqual(n.meaning, "Mehrwertsteuer");
});

test("for an ordinary word the third question stays the one about synonyms", () => {
  const m = marked(
    "fianza | Kaution | Die Sicherheitsleistung beim Einzug; Mietrecht",
    "",
    "fianza",
    "es",
    "depósito | garantía | aval",
  );
  assert.strictEqual(m.meaning, "Kaution");
  assert.deepStrictEqual(m.synonyms, ["depósito", "garantía", "aval"]);
});

/* ---- the infinitive in field 1 ---- */

test("a word out of the selection itself is no infinitive", () => {
  /* Dragging over "The defendant objected", the model answered "defendant" —
     in English no ending separates a noun from an infinitive, so the
     comparison has to. */
  assert.ok(isPartOfTerm("defendant", "The defendant objected"));
  assert.ok(isPartOfTerm("fianza", "fianza"));
  assert.ok(isPartOfTerm("", "fianza"));
  /* A real infinitive brings at least one word of its own. */
  assert.ok(!isPartOfTerm("object", "The defendant objected"));
  assert.ok(!isPartOfTerm("tirar la toalla", "tiramos la toalla"));
  assert.ok(!isPartOfTerm("negarse", "se negó"));
});

test("a subject named alongside is cut off in front", () => {
  assert.strictEqual(trimToBaseForm("demandado impugnar", "El demandado impugnó"), "impugnar");
  assert.strictEqual(trimToBaseForm("defendant object", "The defendant objected"), "object");
  /* An expression loses nothing — "tirar" does not stand in the term. */
  assert.strictEqual(trimToBaseForm("tirar la toalla", "tiramos la toalla"), "tirar la toalla");
  /* The last word always stays, even when it occurs in the term — otherwise
     nothing would be left, and isPartOfTerm decides then. */
  assert.strictEqual(trimToBaseForm("rasten", "wir rasten"), "rasten");
  assert.strictEqual(trimToBaseForm("negarse", "se negó"), "negarse");
});

test("field 1 carries the infinitive, but only for a verb form", () => {
  const line = (f1) => `${f1} | weigerte sich | Erklärung dazu.`;
  const spot = "weigerte | refused";
  assert.strictEqual(marked(line("negarse"), spot, "negó", "es").infinitive, "negarse");
  /* Not a verb: the model repeats the word instead of the required dash —
     then field 1 is empty, not "fianza → fianza". */
  assert.strictEqual(marked(line("fianza"), spot, "fianza", "es").infinitive, "");
  assert.strictEqual(marked(line("-"), spot, "fianza", "es").infinitive, "");
  assert.strictEqual(marked(line("Fianza"), spot, "fianzá", "es").infinitive, "");
});

test("two words are a verb form only when both questions say so", () => {
  /* A verb form is at most two words, counted off the selection, and two
     words need TWO votes. The meaning question answers a phrase built around
     a verb with that verb's infinitive — which is right for what it is for
     and useless as a test — so the verb-form question, asked in parallel
     anyway, has to agree. Its rules make it answer a hyphen for anything
     that is not one form.

     None of this knows a language: the count is a fact about the selection,
     and the second vote comes from the one prompt all eight share. */
  const line = (f1) => `${f1} | weigerte sich | Erklärung dazu.`;
  const spot = "weigerte | refused";
  const person = "él/ella/usted | indefinido";

  /* A form its language writes in two words, and both questions agree. */
  const two = marked(line("negarse"), spot, "se negó", "es", "", person);
  assert.strictEqual(two.infinitive, "negarse");
  assert.strictEqual(two.person, "él/ella/usted");

  /* A verb standing next to a word that is not part of the form. The meaning
     question still names the verb; the verb-form question writes the hyphen
     its rule 6 asks for, and that settles it. */
  const apart = marked(line("negarse"), spot, "la negó", "es", "", "-");
  assert.strictEqual(apart.infinitive, "");
  assert.strictEqual(apart.person, "");

  /* Nothing came back from the second question at all — a language with no
     grammar table, or a call that failed. One row too few, never a wrong one. */
  assert.strictEqual(marked(line("negarse"), spot, "se negó", "es").infinitive, "");

  /* Three words are not a form anybody picks whole, whatever comes back. */
  assert.strictEqual(
    marked(line("negarse"), spot, "se negó a", "es", "", person).infinitive, "");
});

test("one word keeps the single vote it was measured with", () => {
  /* The second question is not asked of a single word: field 1 alone was
     measured, and a verb-form call that fails must not cost a row that the
     meaning question answered correctly. */
  const line = (f1) => `${f1} | weigerte sich | Erklärung dazu.`;
  assert.strictEqual(
    marked(line("negarse"), "weigerte | refused", "negó", "es").infinitive, "negarse");
});

test("the base form has to fit the source language", () => {
  /* Spanish: -ar/-er/-ir, an attached pronoun allowed. */
  assert.ok(isBaseForm("devolver", "es"));
  assert.ok(isBaseForm("negarse", "es"));
  assert.ok(!isBaseForm("fianzas", "es"));
  /* German: -en/-eln/-ern. */
  assert.ok(isBaseForm("nachlassen", "de"));
  assert.ok(isBaseForm("sammeln", "de"));
  assert.ok(!isBaseForm("Sperrklinke", "de"));
  /* English is formally unremarkable — there the prompt carries the load,
     and the comparison with the clicked word catches the repetition. */
  assert.ok(isBaseForm("adjourn", "en"));
  assert.ok(isBaseForm("to adjourn", "en"));
});

test("a language without an infinitive rule lets anything short through", () => {
  assert.ok(isBaseForm("отказаться", "ru"));
  assert.ok(!isBaseForm("это целое предложение вот здесь", "ru"), "a sentence is never a base form");
});

test("fields that fell out of role do not count as a base form", () => {
  assert.ok(!isBaseForm("ser (implícito)", "es"));
  assert.ok(!isBaseForm("-", "es"));
  assert.ok(!isBaseForm("", "es"));
  assert.ok(!isBaseForm("das ist ein ganzer Satz", "de"));
});

test("person and tense are read like in the verb table", () => {
  assert.deepStrictEqual(parseVerbGrammar("ellos/ustedes | pretérito pluscuamperfecto"), {
    person: "ellos/ustedes",
    tense: "pretérito pluscuamperfecto",
  });
  assert.deepStrictEqual(parseVerbGrammar("infinitivo | infinitivo"), {
    person: "infinitivo",
    tense: "infinitivo",
  });
});

test("half an answer is discarded, a dash means: not a verb", () => {
  assert.strictEqual(parseVerbGrammar("-"), null);
  assert.strictEqual(parseVerbGrammar(""), null);
  assert.strictEqual(parseVerbGrammar(null), null);
  /* A person without a tense would be half a statement in the row. */
  assert.strictEqual(parseVerbGrammar("yo"), null);
  assert.strictEqual(parseVerbGrammar("yo | -"), null);
  assert.strictEqual(parseVerbGrammar("- | presente"), null);
});

test("grammar reaches the row only where field 1 carries an infinitive", () => {
  /* If the meaning call says "not a verb" and the annotation says "1st
     person, present", the row would stand against itself. */
  const line = (f1) => `${f1} | weigerte sich | Erklärung dazu.`;
  const verb = marked(line("negarse"), "weigerte | refused", "negó", "es", "", "él/ella/usted | indefinido");
  assert.strictEqual(verb.person, "él/ella/usted");
  assert.strictEqual(verb.tense, "indefinido");
  const noun = marked(line("fianza"), "Kaution | deposit", "fianza", "es", "", "él/ella/usted | presente");
  assert.strictEqual(noun.person, "");
  assert.strictEqual(noun.tense, "");
});

test("the two answer lines are merged into one entry", () => {
  const m = marked(
    "fianza | Kaution | Im Mietrecht die Sicherheitsleistung beim Einzug.",
    "Kaution | deposit",
    "fianza",
    "es",
  );
  assert.strictEqual(m.meaning, "Kaution");
  assert.strictEqual(m.a, "Kaution");
  assert.strictEqual(m.b, "deposit");
  assert.match(m.note, /^Im Mietrecht/);
});

test("two meanings stay for a single word, as in the verb table", () => {
  const m = marked(
    "spring | Feder, Frühling | Das gewundene Bauteil, das unter Last nachgibt.",
    "Feder | muelle",
    "spring",
    "en",
  );
  assert.strictEqual(m.meaning, "Feder, Frühling");
  const e = marked("planta | Etage, Pflanze | Das Stockwerk eines Gebäudes.", "Etage | floor", "planta", "es");
  assert.strictEqual(e.meaning, "Etage, Pflanze");
});

test("a phrase has its appended synonym struck", () => {
  /* The prompt rule does not hold throughout, one run in three appended one.
     A phrase is a term of art or an expression — it practically never has a
     second meaning. */
  const m = marked(
    "ferrocarril subterráneo | U-Bahn, unterirdische Eisenbahn | Das geheime Netzwerk zur Flucht.",
    "Untergrundbahn | underground railroad",
    "ferrocarril subterráneo",
    "es",
  );
  assert.strictEqual(m.meaning, "U-Bahn");
});

/* ---- a word that came through a synonym ---- */

test("a synonym is asked about without the text it never stood in", async () => {
  /* The one case where a reference to the text is always wrong: the word came
     out of another word's synonyms. So it is not sent — measured, sending it
     produced notes like "bezeichnet hier den Vermieter im Kontext eines
     Mietverhältnisses" for a word that was never there, and one that told the
     reader outright that the word was "hier nicht im Text". */
  const asked = [];
  const llm = {
    async chat({ system, user }) {
      asked.push({ system, user });
      return "flojera | Unlust | Umgangssprachliches Substantiv für Antriebslosigkeit";
    },
  };
  await explainMarked(llm, {
    term: "flojera",
    text: "Hoy me da pereza salir de casa.",
    source: "es",
    reader: "de",
    others: [{ code: "de", text: "Heute habe ich keine Lust rauszugehen." }],
    inText: false,
  });

  for (const call of asked) {
    assert.ok(!call.user.includes("pereza"), "the text is not sent at all");
    assert.ok(!call.user.startsWith("Text ("), "and it is not announced either");
  }
  /* And nothing is asked about where it stands, because it stands nowhere. */
  assert.ok(asked.every((call) => !call.system.includes("Locate it in both translations")));
});

test("a clicked word is still asked with its text", async () => {
  const asked = [];
  const llm = {
    async chat({ user }) {
      asked.push(user);
      return "pereza | Unlust | Umgangssprachlich für Antriebslosigkeit";
    },
  };
  await explainMarked(llm, {
    term: "pereza",
    text: "Hoy me da pereza salir de casa.",
    source: "es",
    reader: "de",
    others: [{ code: "de", text: "Heute habe ich keine Lust rauszugehen." }],
  });
  assert.ok(asked.some((user) => user.includes("Hoy me da pereza")));
});

test("a clicked infinitive is a verb when the verb-form question calls it one", () => {
  /* The meaning question rightly repeats an infinitive as its own base form,
     which the repeat test used to take for "not a verb": tumbar, bosser,
     restituer, rachar and indemnify all lost their conjugation table. The
     verb-form question tells the two apart. */
  const line = (f1) => `${f1} | kippen | Erklärung dazu.`;
  const spot = "kippen | overturn";
  const clicked = marked(line("tumbar"), spot, "tumbar", "es", "", "infinitive | infinitivo");
  assert.strictEqual(clicked.infinitive, "tumbar");
  assert.strictEqual(marked(line("fianza"), spot, "fianza", "es", "", "-").infinitive, "");
  /* A conjugated form the model merely repeated is not its own base form. */
  const ru = parseMarkedWord({
    meaningRaw: "забрёл | wandered into | note", spotRaw: "", term: "забрёл", code: "ru",
    thirdRaw: "", grammarRaw: "он/она/оно | прошедшее время", lang: "en", codes: ["en", "de", "ru"],
  });
  assert.strictEqual(ru.infinitive, "");
});

test("a spot field with the label written into it still finds its words", () => {
  assert.strictEqual(usableSpot("<A> Arbeit", "curro"), "Arbeit");
  assert.strictEqual(usableSpot("an</A>", "approdato"), "an");
  assert.strictEqual(usableSpot("<A>", "corredato"), "");
  assert.strictEqual(usableSpot("B: work", "curro"), "work");
});

test("a suffix is no synonym", () => {
  assert.deepStrictEqual(syn("-tional", "Constitutional"), []);
});

test("brackets opened in one spot field and closed in the other are dropped", () => {
  assert.strictEqual(usableSpot("<gekürzt", "decurtato"), "gekürzt");
  assert.strictEqual(usableSpot("reduced>", "decurtato"), "reduced");
});

test("an infinitive named in one field, or in the tense field, still counts", () => {
  const line = (f1) => `${f1} | beheben | Erklärung dazu.`;
  assert.strictEqual(marked(line("subsanar"), "", "subsanar", "es", "", "infinitivo").infinitive, "subsanar");
  const it = parseMarkedWord({ meaningRaw: "sgranare | enthülsen | note", spotRaw: "", term: "sgranare", code: "it", thirdRaw: "", grammarRaw: "infinito", lang: "de", codes: ["de", "en", "it"] });
  assert.strictEqual(it.infinitive, "sgranare");
  const en = parseMarkedWord({ meaningRaw: "rejig | umstellen | note", spotRaw: "", term: "rejig", code: "en", thirdRaw: "", grammarRaw: "they | infinitive", lang: "de", codes: ["de", "en", "es"] });
  assert.strictEqual(en.infinitive, "rejig");
});

test("half a sentence handed back as a term is no term", async () => {
  const { wordsFor } = await import("../../src/ask.js");
  const text = "Prima del reso, il prodotto sia integro; in caso contrario il rimborso potrebbe essere decurtato.";
  const llm = { chat: async () => "integro | unversehrt | Handel\nrimborso potrebbe essere decurtato | Rückerstattung könnte gekürzt werden | Finanzen\nin caso contrario | andernfalls | formell" };
  const list = await wordsFor(llm, { text, source: "it", languages: ["de", "en", "it"], levels: {} });
  assert.deepStrictEqual(list.map((w) => w.text), ["integro", "in caso contrario"]);
});

test("a line written as a table row or wrapped whole in brackets keeps its fields", () => {
  const row = marked("|rügen|anfechten|Juristendeutsch, formell|", "", "rügte", "de");
  assert.strictEqual(row.meaning, "anfechten");
  assert.strictEqual(row.note, "Juristendeutsch, formell");
  const wrapped = marked("<Zuständigkeit | Kompetenz | juristisch>", "", "Zuständigkeit", "de");
  assert.strictEqual(wrapped.meaning, "Kompetenz");
  assert.strictEqual(wrapped.note, "juristisch");
});

/* ---- the paragraph before the markings ---- */

test("a clicked word's paragraph arrives before the markings, whole", async () => {
  let releaseSpot;
  const spotHeld = new Promise((resolve) => { releaseSpot = resolve; });
  const llm = {
    async chat({ system }) {
      if (system.includes("Locate it in both translations")) {
        await spotHeld;
        return "Unlust | reluctance";
      }
      if (system.includes("Name synonyms")) return "flojera, desgana";
      if (system.includes("person and tense")) return "-";
      return "pereza | Unlust | Umgangssprachlich für Antriebslosigkeit";
    },
  };
  let paragraph = null;
  const done = explainMarked(llm, {
    term: "pereza",
    text: "Hoy me da pereza salir de casa.",
    source: "es",
    reader: "de",
    others: [{ code: "de", text: "Heute habe ich keine Lust rauszugehen." }, { code: "en", text: "Today I can't be bothered to go out." }],
    onParagraph: (answer) => { paragraph = answer; },
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(paragraph, "the paragraph did not wait for the spot question");
  assert.strictEqual(paragraph.meaning, "Unlust");
  assert.ok(paragraph.synonyms.length, "and it came with its synonyms");
  assert.strictEqual(paragraph.a, "");

  releaseSpot();
  const whole = await done;
  assert.strictEqual(whole.a, "Unlust");
  assert.strictEqual(whole.note, paragraph.note);
});

/* ---- a marked passage ---- */

import { isPassage, parsePassage, MAX_PHRASE_WORDS } from "../../src/parse/words.js";

test("a passage is counted off the selection: more than six words, and punctuation plays no part", () => {
  assert.strictEqual(MAX_PHRASE_WORDS, 6);
  /* Idioms of five and six words are expressions and keep their explanation. */
  assert.strictEqual(isPassage("kicked the can down the road"), false);
  assert.strictEqual(isPassage("deu com a língua nos dentes"), false);
  assert.strictEqual(isPassage("avant que la mairie ne se décide enfin"), true);
  assert.strictEqual(isPassage("قرر المنظمون إقامة الحفل في موعده المحدد"), true);
  /* A comma or a stop is as often a number, a title or an abbreviation. */
  for (const short of ["0.5 m", "Dr. Müller", "I, Robot", "z. B.", "usw. und so", "Obwohl sie kam, ging er"]) {
    assert.strictEqual(isPassage(short), false, short);
  }
});

test("a passage's answer is its translation and its two spots, nothing else", () => {
  const row = parsePassage({
    translationRaw: "\"tat nichts, bis die Presse die Fotos veröffentlichte\"\n",
    spotRaw: "did nothing until the press published the photos. | -",
    term: "no hizo nada hasta que la prensa publicó las fotos",
    target: "de",
  });
  assert.strictEqual(row.passage, true);
  assert.strictEqual(row.meaning, "tat nichts, bis die Presse die Fotos veröffentlichte");
  assert.strictEqual(row.a, "did nothing until the press published the photos", "a closing stop is not part of the spot");
  assert.strictEqual(row.b, "");
  assert.deepStrictEqual([row.infinitive, row.note, row.synonyms.length], ["", "", 0]);
  assert.strictEqual(parsePassage({ translationRaw: "  ", spotRaw: "a | b", term: "x", target: "de" }), null);
});

test("a marked passage is asked two questions with its text, not the four about a word", async () => {
  const asked = [];
  const llm = {
    async chat({ system, user }) {
      asked.push({ system, user });
      return system.includes("Find the words")
        ? "Gestern focht die Regierung das Abkommen an | Yesterday the government challenged the agreement"
        : "Gestern focht die Regierung das Abkommen an";
    },
  };
  const term = "Ayer el gobierno impugnó el acuerdo sin dudar";
  const paragraphs = [];
  const row = await explainMarked(llm, {
    term,
    text: term + ".",
    source: "es",
    reader: "de",
    others: [{ code: "de", text: "Gestern focht die Regierung das Abkommen an." }, { code: "en", text: "Yesterday the government challenged the agreement." }],
    onParagraph: (p) => paragraphs.push(p),
  });
  assert.strictEqual(asked.length, 2);
  assert.ok(asked.every((call) => call.user.startsWith("Text (Spanish): ")), "the text goes with both");
  assert.ok(asked.some((call) => call.system.includes("German translation of the Passage")));
  assert.strictEqual(row.passage, true);
  assert.strictEqual(row.meaning, "Gestern focht die Regierung das Abkommen an");
  assert.strictEqual(row.b, "Yesterday the government challenged the agreement");
  assert.strictEqual(paragraphs.length, 1, "the translation before the markings");
});

test("a passage in the reader's own language is translated into the other panel's", async () => {
  const systems = [];
  const llm = { async chat({ system }) { systems.push(system); return "x | y"; } };
  await explainMarked(llm, {
    term: "Gestern focht die Regierung das Abkommen ohne Zögern an",
    text: "Gestern focht die Regierung das Abkommen ohne Zögern an.",
    source: "de",
    reader: "de",
    others: [{ code: "es", text: "Ayer el gobierno impugnó el acuerdo." }, { code: "en", text: "Yesterday." }],
  });
  assert.ok(systems.some((s) => s.includes("Spanish translation of the Passage")));
});

test("a pick of several words is shown translated whole, a verb form keeps its infinitive", () => {
  const whole = parseMarkedWord({
    meaningRaw: "write | schreiben | bezieht sich auf das Aufzeichnen von Text",
    spotRaw: "", term: "The label itself is not written", code: "en", thirdRaw: "", grammarRaw: "-",
    wholeRaw: "Die Beschriftung selbst wird nicht geschrieben", lang: "de", codes: ["en", "de", "es"],
  });
  assert.strictEqual(whole.meaning, "Die Beschriftung selbst wird nicht geschrieben");

  const form = parseMarkedWord({
    meaningRaw: "backen | backen | Zubereiten im Ofen",
    spotRaw: "", term: "hat gebacken", code: "de", thirdRaw: "", grammarRaw: "3. Person Singular | Perfekt",
    wholeRaw: "has baked", lang: "en", codes: ["de", "en", "es"],
  });
  assert.ok(form.infinitive, "still a verb");
  assert.strictEqual(form.meaning, "backen");
});

test("several words are also asked for a whole translation, one word is not", async () => {
  const systems = (term) => {
    const asked = [];
    const llm = { async chat({ system }) { asked.push(system); return "x | y | z"; } };
    return explainMarked(llm, { term, text: "The label itself is not written here.", source: "en", reader: "de", others: [] })
      .then(() => asked.filter((s) => s.includes("translation of the Passage")).length);
  };
  assert.strictEqual(await systems("The label itself is not written"), 1);
  assert.strictEqual(await systems("label"), 0);
});

test("one more example is asked with more room to vary than the rest", async () => {
  const { addExample } = await import("../../src/ask.js");
  let temperature;
  await addExample({ async chat(call) { temperature = call.temperature; return "EXAMPLE: | Hola. | Hallo."; } },
    { term: "hola", source: "es", reader: "de", level: "B1", examples: [] });
  assert.ok(temperature > 0.5);
});

test("a phrasal verb picked whole keeps its own base form", () => {
  /* English writes a phrasal verb's citation form exactly as the text has it,
     so field 1 repeating "hold off" is the right answer — and the trimming,
     which exists to cut a subject named along with the verb, left "off". */
  const marked = parseMarkedWord({
    meaningRaw: "hold off | abwarten, aufschieben | bedeutet, etwas bewusst hinauszuzögern",
    grammarRaw: "infinitive | infinitive",
    spotRaw: "zurückhalten | esperaría",
    term: "hold off", code: "en", lang: "de", codes: ["en", "de"],
  });
  assert.strictEqual(marked.infinitive, "hold off");
  assert.strictEqual(marked.person, "");
  assert.strictEqual(marked.tense, "infinitive");
});

test("a word class stands only as far as it is on the list and fits the word", () => {
  assert.deepStrictEqual(parseWordClass("noun | plural | feminine", { term: "las casas", code: "es" }),
    { kind: "noun", number: "plural", gender: "feminine" });
  assert.strictEqual(parseWordClass("noun | plural | masculine", { term: "días hábiles", code: "es" }), null,
    "two words with no function word among them are a phrase");
  assert.deepStrictEqual(parseWordClass("adjective | plural | masculine", { term: "minoritarios", code: "es" }),
    { kind: "adjective", number: "", gender: "" }, "number is shown on a noun and a pronoun");
  assert.strictEqual(parseWordClass("-", { term: "casa", code: "es" }), null, "a hyphen is no class");
  assert.strictEqual(parseWordClass("Substantiv | Singular | -", { term: "casa", code: "es" }), null, "only the English names");
  assert.strictEqual(parseWordClass("verb | - | -", { term: "come", code: "es" }), null, "a verb is the verb line's");
  assert.strictEqual(parseWordClass("noun | singular | -", { term: "tirar la toalla", code: "es" }), null, "not above two words");
  assert.deepStrictEqual(parseWordClass("noun | singular | neuter", { term: "house", code: "en" }),
    { kind: "noun", number: "singular", gender: "" }, "a gender the language does not have");
  assert.deepStrictEqual(parseWordClass("adverb | plural | feminine", { term: "rápidamente", code: "es" }),
    { kind: "adverb", number: "", gender: "" }, "number and gender only where the class has them");
});

test("a clicked word keeps its class unless it turned out to be a verb", () => {
  const noun = parseMarkedWord({
    meaningRaw: "hogar | Haushalt, Zuhause | Wohneinheit",
    spotRaw: "", term: "hogar", code: "es", thirdRaw: "", grammarRaw: "-",
    kindRaw: "noun | singular | masculine", lang: "de", codes: ["es", "de"],
  });
  assert.deepStrictEqual(noun.wordClass, { kind: "noun", number: "singular", gender: "masculine" });
  assert.strictEqual(noun.meaning, "Haushalt, Zuhause");
  const verb = parseMarkedWord({
    meaningRaw: "impugnar | anfechten | Rechtssprache",
    spotRaw: "", term: "impugnó", code: "es", thirdRaw: "", grammarRaw: "él/ella/usted | pretérito indefinido",
    kindRaw: "noun | singular | masculine", lang: "de", codes: ["es", "de"],
  });
  assert.strictEqual(verb.wordClass, null);
});

test("the reader's language is said once more only when a note is asked again", async () => {
  /* On the first question the line cost the local model its base forms; it
     goes only into the second, asked because the note came back in the
     text's language — and never into the synonym question, which answers in
     the text's language. */
  const asked = [];
  const italian = "sgranare | desgranar | Verbo della vita contadina: separare i chicchi dal baccello.";
  const llm = {
    async chat({ system, user }) {
      asked.push({ system, user });
      return system.includes("<note>") ? italian : "";
    },
  };
  await explainMarked(llm, {
    term: "sgranare", text: "La nonna stava a sgranare i piselli.", source: "it", reader: "es", others: [], withoutSpot: true,
  });
  const meanings = asked.filter((call) => call.system.includes("<note>"));
  assert.strictEqual(meanings.length, 2);
  assert.ok(!meanings[0].user.includes("Write "), "not on the first question");
  assert.ok(meanings[1].user.endsWith("Write <meaning> and <note> in Spanish."));
  assert.ok(asked.filter((call) => !call.system.includes("<note>")).every((call) => !call.user.includes("Write ")));
});

test("a note in the text's language is asked again once, and the better answer kept", async () => {
  const italian = "sgranare | desgranar | Verbo della vita contadina: separare i chicchi dal baccello.";
  const spanish = "sgranare | desgranar | Verbo del campo: separar los granos de la vaina o de la mazorca.";
  const run = async (answers) => {
    let asked = 0;
    const temperatures = [];
    const llm = {
      async chat({ system, temperature }) {
        if (!system.includes("<note>")) return "";
        temperatures.push(temperature);
        return answers[Math.min(asked++, answers.length - 1)];
      },
    };
    const marked = await explainMarked(llm, {
      term: "sgranare",
      text: "La nonna stava a sgranare i piselli sull'uscio.",
      source: "it",
      reader: "es",
      others: [],
      withoutSpot: true,
    });
    return { asked, temperatures, note: marked?.note || "" };
  };
  const fixed = await run([italian, spanish]);
  assert.strictEqual(fixed.asked, 2);
  assert.ok(fixed.temperatures[1] > 0.5, "asked warmer the second time, or the same answer comes back");
  assert.ok(fixed.note.startsWith("Verbo del campo"));

  const right = await run([spanish]);
  assert.strictEqual(right.asked, 1, "a note in the reader's language is not asked again");

  const stubborn = await run([italian, italian]);
  assert.strictEqual(stubborn.asked, 2, "asked again once, not more");
  assert.ok(stubborn.note.startsWith("Verbo della"), "and the first answer stands");
});

test("a term list with notes in the text's language is asked again once", async () => {
  /* A note the cloud model really wrote for a Spanish reader. */
  const text = "Raga stasera non ce la faccio, sono distrutto. Che sfiga.";
  const italian = 'Raga | chicos | Vocativo colloquiale tra amici, forma abbreviata di "ragazzi"; registro giovanile.';
  const spanish = 'Raga | chicos | Vocativo coloquial entre amigos, forma abreviada de "ragazzi"; registro juvenil.';
  let asked = 0;
  const llm = {
    async chat({ system }) {
      if (!system.includes("<note>")) return "";
      return asked++ === 0 ? italian : spanish;
    },
  };
  const list = await wordsFor(llm, { text, source: "it", languages: ["es", "it"], levels: {} });
  assert.strictEqual(asked, 2);
  assert.ok(list[0].note.startsWith("Vocativo coloquial"));
});

test("a term standing inside another one is dropped, the longer one stays", () => {
  const list = [
    { text: "URL", spot: "URL" },
    { text: "query", spot: "query" },
    { text: "start a query", spot: "start a query" },
  ];
  assert.deepStrictEqual(withoutNestedTerms(list).map((w) => w.text), ["URL", "start a query"]);
});

test("a nested term is found by its spot, and only as a word of its own", () => {
  const list = [
    { text: "tirar la toalla", spot: "tiramos la toalla" },
    { text: "toalla", spot: "toalla" },
    { text: "ensayo", spot: "ensayo" },
    { text: "en", spot: "en" },
    { text: "Ensayo", spot: "ensayo" },
  ];
  assert.deepStrictEqual(withoutNestedTerms(list).map((w) => w.text), ["tirar la toalla", "ensayo", "en"]);
});

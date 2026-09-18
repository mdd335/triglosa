import test from "node:test";
import assert from "node:assert";
import {
  abbreviationParts,
  asGuess,
  expansionPart,
  initialsMatch,
  looksLikeAbbreviation,
  normalizeAbbreviation,
  parseAbbreviation,
  withoutSecondMeaning,
} from "../../src/parse/abbreviations.js";

/* A reader who gets explanations in German. */
const guess = (meaning, text, abbr) => asGuess(meaning, text, abbr, "de");

test("an expansion standing in the text carries no caveat", () => {
  const t = "The Large Language Model was distilled into a student.";
  assert.strictEqual(
    guess("Large Language Model – großes Sprachmodell", t, "LLM"),
    "Large Language Model – großes Sprachmodell",
  );
});

test("matching initials shorten the caveat to one word", () => {
  assert.strictEqual(
    guess("Large Language Model – großes Sprachmodell", "They ran the LLM.", "LLM"),
    "vermutlich: Large Language Model – großes Sprachmodell",
  );
  /* Filler words may be skipped. */
  assert.ok(initialsMatch("GPQA", "Graduate-Level Google-Proof Q&A"));
  assert.ok(initialsMatch("IVA", "Impuesto sobre el Valor Añadido"));
  /* The plural of the abbreviation. */
  assert.ok(initialsMatch("LLMs", "Large Language Model"));
});

test("where the letters do not fit, the full warning stands", () => {
  assert.strictEqual(
    guess("Mehrwertsteuer", "El precio incluye IVA.", "IVA"),
    "könnte stehen für: Mehrwertsteuer",
  );
  assert.ok(!initialsMatch("RLVR", "Reinforcement Learning from Human Feedback"));
});

test("the letter test is no proof — RLVR fits and is still wrong", () => {
  assert.ok(initialsMatch("RLVR", "Reinforcement Learning from Visual Rewards"));
  assert.strictEqual(
    guess("Reinforcement Learning from Visual Rewards", "RLVR runs.", "RLVR"),
    "vermutlich: Reinforcement Learning from Visual Rewards",
  );
});

test("only the expansion is checked, not the translated half", () => {
  assert.strictEqual(
    expansionPart("Large Language Model – großes Sprachmodell"),
    "Large Language Model",
  );
  assert.strictEqual(expansionPart("Graduate-Level Google-Proof Q&A"), "Graduate-Level Google-Proof Q&A");
  /* Without that split "großes Sprachmodell" could never be found in an
     English text — every expansion would look guessed. */
  assert.strictEqual(
    guess("Large Language Model – großes Sprachmodell", "The Large Language Model ran.", "LLM"),
    "Large Language Model – großes Sprachmodell",
  );
});

test("the model's own caveat is stripped and decided again", () => {
  /* Not doubled: one warning, not two. */
  assert.strictEqual(guess("könnte stehen für: X", "x", "XYZ"), "könnte stehen für: X");
  /* And decided again: the letters carry, so the short version — the model
     had put the long one here. */
  assert.strictEqual(
    guess("könnte stehen für: Expediente de Regulación de Empleo", "Firmó un ERE.", "ERE"),
    "vermutlich: Expediente de Regulación de Empleo",
  );
  /* The long warning stays where the letters do not carry: the X of IBEX
     stands nowhere in "Índice Bursátil Español". */
  assert.ok(!initialsMatch("IBEX", "Índice Bursátil Español"));
  /* Where the expansion stands in the text, the model's warning goes too. */
  assert.strictEqual(
    guess("könnte stehen für: Large Language Model", "The Large Language Model ran.", "LLM"),
    "Large Language Model",
  );
});

test("without an abbreviation the full warning stands", () => {
  assert.strictEqual(guess("Irgendwas", "x"), "könnte stehen für: Irgendwas");
  assert.ok(looksLikeAbbreviation("LLM"));
  assert.ok(looksLikeAbbreviation("RLVR runs"));
  assert.ok(!looksLikeAbbreviation("fianza"));
});

test("German abbreviates from the inside — DSGVO is no shot in the dark", () => {
  assert.ok(initialsMatch("DSGVO", "Datenschutz-Grundverordnung"));
  assert.ok(initialsMatch("TÜV", "Technischer Überwachungsverein"));
  /* The first letter MUST sit at the start of a word. That is exactly where
     a plain translation in place of an expansion fails. */
  assert.ok(!initialsMatch("IVA", "Mehrwertsteuer"));
  assert.ok(!initialsMatch("DNI", "Personalausweis"));
  assert.strictEqual(
    guess("Datenschutz-Grundverordnung", "Der DSGVO-Verstoß wurde gemeldet.", "DSGVO"),
    "vermutlich: Datenschutz-Grundverordnung",
  );
});

test("a repetition is not an expansion", () => {
  assert.strictEqual(normalizeAbbreviation("GPQA", "GPQA"), "");
  assert.strictEqual(guess("GPQA", "results on GPQA", "GPQA"), "Abkürzung");
  /* The translated half that merely repeats what stands in front of it. */
  assert.strictEqual(
    normalizeAbbreviation("Datenschutz-Grundverordnung – DSGVO", "DSGVO"),
    "Datenschutz-Grundverordnung",
  );
  assert.strictEqual(
    normalizeAbbreviation("Large Language Model – Large Language Model", "LLM"),
    "Large Language Model",
  );
  assert.strictEqual(
    normalizeAbbreviation("Large Language Model – großes Sprachmodell", "LLM"),
    "Large Language Model – großes Sprachmodell",
  );
});

test("where the text is already in the reader's language, the doubled half goes", () => {
  assert.strictEqual(
    normalizeAbbreviation("Elektronisches Steuerhilfsprogramm – elektronisches Steuerhilfeprogramm", "ELSTER"),
    "Elektronisches Steuerhilfsprogramm",
  );
  /* Two genuinely different statements both stay. */
  assert.strictEqual(
    normalizeAbbreviation("Impuesto sobre el Valor Añadido – Mehrwertsteuer", "IVA"),
    "Impuesto sobre el Valor Añadido – Mehrwertsteuer",
  );
});

test("an answer that fell apart is not a field", () => {
  assert.strictEqual(normalizeAbbreviation("Er、“Entlassung” – Entlassungsrunde", "ERE"), "");
  /* Q&A and hyphens belong to an expansion. */
  assert.strictEqual(
    normalizeAbbreviation("Graduate-Level Google-Proof Q&A", "GPQA"),
    "Graduate-Level Google-Proof Q&A",
  );
});

test("expansion and translated half become one field", () => {
  assert.strictEqual(
    parseAbbreviation("Large Language Model | großes Sprachmodell", "LLM"),
    "Large Language Model – großes Sprachmodell",
  );
  /* A dash in field 2 means: not translated. */
  assert.strictEqual(
    parseAbbreviation("Massive Multitask Language Understanding | -", "MMLU"),
    "Massive Multitask Language Understanding",
  );
  assert.strictEqual(parseAbbreviation("Datenschutz-Grundverordnung", "DSGVO"), "Datenschutz-Grundverordnung");
});

test("a bare dash means: cannot be placed, and that is an answer", () => {
  assert.strictEqual(parseAbbreviation("-", "RLVR"), "");
  assert.strictEqual(parseAbbreviation("- | -", "RLVR"), "");
  assert.strictEqual(parseAbbreviation("", "RLVR"), "");
  assert.strictEqual(parseAbbreviation(null, "RLVR"), "");
  /* A plain repetition is no expansion either. */
  assert.strictEqual(parseAbbreviation("GPQA | -", "GPQA"), "");
});

test("caveat, expansion and translation stand available separately", () => {
  /* The line is drawn in three colours: the caveat greyed out, the expansion
     white, the translation muted. */
  const t = abbreviationParts("Large Language Model – großes Sprachmodell", "They ran the LLM.", "LLM", "de");
  assert.strictEqual(t.caveat, "vermutlich");
  assert.strictEqual(t.expansion, "Large Language Model");
  assert.strictEqual(t.translation, "großes Sprachmodell");
  assert.strictEqual(t.text, "vermutlich: Large Language Model – großes Sprachmodell");
});

test("without an expansion there is nothing to draw", () => {
  const t = abbreviationParts("GPQA", "GPQA runs.", "GPQA", "de");
  assert.strictEqual(t.expansion, "");
  assert.strictEqual(t.caveat, "");
  assert.strictEqual(t.text, "Abkürzung", "the reader still learns it was one");
  assert.strictEqual(abbreviationParts("", "x", "LLM", "de").text, "");
});

test("an evidenced expansion carries no caveat and no empty translation", () => {
  const t = abbreviationParts("Large Language Model", "The Large Language Model ran.", "LLM", "de");
  assert.strictEqual(t.caveat, "");
  assert.strictEqual(t.translation, "");
  assert.strictEqual(t.text, "Large Language Model");
});

test("an English reader gets the same decision in their own words", () => {
  assert.strictEqual(
    asGuess("Impuesto sobre el Valor Añadido", "El precio incluye IVA.", "IVA", "en"),
    "probably: Impuesto sobre el Valor Añadido",
  );
  assert.strictEqual(
    asGuess("value added tax", "El precio incluye IVA.", "IVA", "en"),
    "could stand for: value added tax",
  );
  /* And the model's English hedge is stripped just like the German one. */
  assert.strictEqual(
    asGuess("could stand for: Impuesto sobre el Valor Añadido", "Firmó el IVA.", "IVA", "en"),
    "probably: Impuesto sobre el Valor Añadido",
  );
});

test("every first language strips its own hedges, Cyrillic too", () => {
  assert.strictEqual(
    asGuess("вероятно: Impuesto sobre el Valor Añadido", "Firmó el IVA.", "IVA", "ru"),
    "вероятно: Impuesto sobre el Valor Añadido",
  );
  assert.strictEqual(
    asGuess("Может означать: value added tax", "El precio incluye IVA.", "IVA", "ru"),
    "может означать: value added tax",
  );
  assert.strictEqual(
    asGuess("peut-être : taxe sur la valeur ajoutée", "El precio incluye IVA.", "IVA", "fr"),
    "pourrait signifier: taxe sur la valeur ajoutée",
  );
  /* A hedge is a word of its own, not the start of one. */
  assert.strictEqual(
    asGuess("Probablementeism Valor", "El precio incluye IVA.", "IVA", "es").endsWith("Probablementeism Valor"),
    true,
  );
});

test("a phrase keeps only its first equivalent", () => {
  /* "ferrocarril subterráneo" turned into "U-Bahn, unterirdische Eisenbahn"
     in one run of three. Mechanical, without semantics. */
  assert.strictEqual(
    withoutSecondMeaning("U-Bahn, unterirdische Eisenbahn", "ferrocarril subterráneo"),
    "U-Bahn",
  );
  /* A single word may genuinely have two. */
  assert.strictEqual(withoutSecondMeaning("Kaution, Pfand", "fianza"), "Kaution, Pfand");
});

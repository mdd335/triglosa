import { test } from "node:test";
import assert from "node:assert";
import { parseExample, parseMore } from "../../src/parse/more.js";
import { exampleSentenceInput, exampleSentencePrompt, explainMorePrompt } from "../../src/prompts/marked.js";

test("a longer explanation comes back as a paragraph and its examples", () => {
  assert.deepStrictEqual(parseMore("**Anfechten** heißt,\n\netwas *förmlich* zu bestreiten."),
    { text: "Anfechten heißt, etwas förmlich zu bestreiten.", examples: [] });
  assert.deepStrictEqual(parseMore("## Erklärung\n- Ein Satz."), { text: "Erklärung Ein Satz.", examples: [] });
  assert.deepStrictEqual(parseMore("„Ein Absatz.“"), { text: "Ein Absatz.", examples: [] });
  assert.strictEqual(parseMore("  \n "), null);
});

test("an example line is a kind, a sentence and a translation", () => {
  const answer = parseMore([
    "Ein Absatz über das Wort.",
    "EXAMPLE: Rechtssprache | Impugnó la sentencia. | Er focht das Urteil an.",
    "- **EXAMPLE:**  | Voy a impugnar. | Ich werde Einspruch einlegen.",
  ].join("\n"));
  assert.strictEqual(answer.text, "Ein Absatz über das Wort.");
  assert.deepStrictEqual(answer.examples, [
    { kind: "Rechtssprache", sentence: "Impugnó la sentencia.", translation: "Er focht das Urteil an." },
    { kind: "", sentence: "Voy a impugnar.", translation: "Ich werde Einspruch einlegen." },
  ]);
});

test("a word in the reader's own language has nothing to translate into", () => {
  assert.deepStrictEqual(parseExample("EXAMPLE: im Alltag | Nach Feierabend lese ich. |"),
    { kind: "im Alltag", sentence: "Nach Feierabend lese ich.", translation: "" });
  assert.strictEqual(parseExample("EXAMPLE: | | "), null);
  /* Asked for one line and nothing else, a model leaves the marker off. */
  assert.deepStrictEqual(parseExample("Literarisch | Sa flânerie durait. | Sein Schlendern dauerte."),
    { kind: "Literarisch", sentence: "Sa flânerie durait.", translation: "Sein Schlendern dauerte." });
  assert.strictEqual(parseExample("Ein Absatz ohne Beispiel."), null);
  /* The translation written where the kind belongs, the sentence after it:
     a kind is a word or two, and a sentence is not. */
  assert.deepStrictEqual(
    parseExample("EXAMPLE: Die Tauben gelten als Wahrzeichen der Stadt. | The pigeons are symbols of the city. |"),
    { kind: "", sentence: "The pigeons are symbols of the city.",
      translation: "Die Tauben gelten als Wahrzeichen der Stadt." });
  /* The separator written in front of an empty first field. */
  assert.deepStrictEqual(parseExample("| | سأفعل ذلك إن شاء الله | Ich werde das tun."),
    { kind: "", sentence: "سأفعل ذلك إن شاء الله", translation: "Ich werde das tun." });
  assert.deepStrictEqual(parseExample("| Alltag | He tried to gaslight her. | Er manipulierte sie."),
    { kind: "Alltag", sentence: "He tried to gaslight her.", translation: "Er manipulierte sie." });
  /* The fields shifted by one: one word is no sentence. */
  assert.deepStrictEqual(parseExample("EXAMPLE: | Formal | Ella reclamó su derecho."),
    { kind: "Formal", sentence: "Ella reclamó su derecho.", translation: "" });
});

test("the prompt names the level only for a language being learned", () => {
  assert.match(explainMorePrompt({ source: "Spanish", reader: "German", level: "A2" }), /level A2/);
  assert.doesNotMatch(explainMorePrompt({ source: "German", reader: "German", level: "B1" }), /level/);
  assert.match(explainMorePrompt({ source: "Spanish", reader: "German", level: "C1", inText: false }), /There is no text/);
});

test("both prompts ask for the example in the one shape, and for no language by name", () => {
  const more = explainMorePrompt({ source: "Spanish", reader: "German", level: "B1" });
  assert.match(more, /EXAMPLE: <kind> \| <a short natural Spanish sentence> \| <its German translation>/);
  const one = exampleSentencePrompt({ source: "Spanish", reader: "German", level: "B1" });
  assert.match(one, /EXAMPLE: <kind> \| <the Spanish sentence> \| <its German translation>/);
  assert.match(one, /At most 9 words/);
  /* A word in the reader's own language is not translated back into it. */
  assert.doesNotMatch(exampleSentencePrompt({ source: "German", reader: "German", level: "B1" }), /translation/);
});

test("the examples already shown go with the question for another one", () => {
  const input = exampleSentenceInput({
    source: "Spanish", term: "impugnar", meaning: "anfechten", note: "Rechtssprache.",
    examples: [{ sentence: "Impugnó la sentencia." }],
  });
  assert.match(input, /Examples already shown:\n- Impugnó la sentencia\./);
  assert.match(exampleSentenceInput({ source: "Spanish", term: "impugnar" }), /No example has been shown yet/);
});

test("a kind written in brackets in front of the sentence is still the kind", () => {
  assert.deepStrictEqual(
    parseExample("[Besitz] У меня есть своя дача. | Ich habe mein eigenes Sommerhaus."),
    { kind: "Besitz", sentence: "У меня есть своя дача.", translation: "Ich habe mein eigenes Sommerhaus." },
  );
  assert.deepStrictEqual(
    parseExample("EXAMPLE: [Alltag] Wir fahren. | We drive."),
    { kind: "Alltag", sentence: "Wir fahren.", translation: "We drive." },
  );
});

test("one more example is told the kinds already shown, on a line of their own", () => {
  const input = exampleSentenceInput({
    source: "Spanish", term: "impugnar", meaning: "anfechten", note: "",
    examples: [{ kind: "formell", sentence: "La empresa impugnó la multa." }, { kind: "", sentence: "Impugnó el testamento." }],
  });
  assert.ok(input.includes("- La empresa impugnó la multa."), "the sentence without its kind in front of it");
  assert.ok(input.includes("Kinds already shown: formell"));
  assert.ok(!exampleSentenceInput({ source: "Spanish", term: "x", examples: [] }).includes("Kinds"));
  const system = exampleSentencePrompt({ source: "Spanish", reader: "German", level: "B1" });
  assert.ok(system.includes("same sentence frame"), "unlike in how it is built, not only in what it shows");
});

test("a translation that is the sentence over again is not a translation", () => {
  const one = parseExample("EXAMPLE: Bewertung | Terminal-Bench v2 misst Agenten. | Terminal-Bench v2 misst Agenten.");
  assert.strictEqual(one.sentence, "Terminal-Bench v2 misst Agenten.");
  assert.strictEqual(one.translation, "");
});

test("an example written in the reader's language is turned round or dropped", () => {
  /* Both models write the reader's own language under a term that is a name:
     "Terminal-Bench v2 ist viel zu schwer" under an English word. */
  assert.strictEqual(
    parseExample("EXAMPLE:  | Terminal-Bench v2 ist viel zu schwer für uns. | ", { source: "en", reader: "de" }),
    null,
  );
  /* The local model fills the two fields the other way round, which is the
     same answer with its labels crossed. */
  const swapped = parseExample(
    "EXAMPLE:  | Dein Fehlen bereitet mir eine große Sehnsucht. | A tua falta causa-me uma grande saudade.",
    { source: "pt", reader: "de" },
  );
  assert.strictEqual(swapped.sentence, "A tua falta causa-me uma grande saudade.");
  assert.strictEqual(swapped.translation, "Dein Fehlen bereitet mir eine große Sehnsucht.");
  /* And a sentence really in the word's language is left alone. */
  const kept = parseExample(
    "EXAMPLE: formell | El abogado impugnó la decisión. | Der Anwalt focht die Entscheidung an.",
    { source: "es", reader: "de" },
  );
  assert.strictEqual(kept.sentence, "El abogado impugnó la decisión.");
});

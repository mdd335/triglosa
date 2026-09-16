/* The flashcard: what goes in the three fields, and which field of a note
   type each of them belongs in. Nothing here touches a window or Anki. */

import test from "node:test";
import assert from "node:assert";
import {
  CARD_FIELDS,
  cardLine,
  entryCard,
  guessFieldMap,
  hasCard,
  markedCard,
  noteFields,
  readingCard,
  termCard,
  verbCard,
} from "../../src/card.js";
import { labels } from "../../src/ui/labels.js";

const de = labels("de");

/* Four sentences, so a card that took the lot would take a paragraph. */
const SOURCE = "Ayer llovió. Anduvo por el parque toda la tarde. Nadie lo vio. Volvió tarde.";
const TARGET = "Gestern regnete es. Er ging den ganzen Nachmittag durch den Park. Niemand sah ihn. Er kam spät zurück.";
/* `spot` is where the run's alignment says the word went in the reader's own
   panel — how the sentence on the back is found. */
const READING = { text: de, sourceLanguage: "es", reader: "de", sentence: SOURCE,
                  translation: TARGET, spot: "ging" };

test("a verb goes into the deck in its base form", () => {
  const card = verbCard(
    { form: "anduvo", infinitive: "andar", meaning: "gehen, laufen", person: "3. Person Sg.", tense: "Indefinido" },
    READING,
  );
  /* "andar" is vocabulary, "anduvo" is a spot in one text — the same reason
     the row's two buttons look up the base form. */
  assert.strictEqual(card.term, "andar");
  assert.strictEqual(card.termLanguage, "es");
  assert.strictEqual(card.meaning, "gehen, laufen");
  assert.strictEqual(card.meaningLanguage, "de");
  /* The form is not lost: it stands in the explanation with its person and
     tense, which is what makes the card about this reading. */
  assert.ok(card.note.startsWith("anduvo — 3. Person Sg. · Indefinido"));
  /* One sentence, not the reading. A paragraph on the back of a card is not
     an example, it is the text the reader already had. Its translation
     follows in brackets, the way every example on an improved card is
     written. */
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde. (Er ging den ganzen Nachmittag durch den Park.)"));
  assert.deepStrictEqual(card.context, {
    sentence: "Anduvo por el parque toda la tarde.",
    translation: "Er ging den ganzen Nachmittag durch den Park.",
  });
  assert.ok(!card.note.includes("Ayer llovió"), "and nothing else from the reading");
  assert.ok(!card.note.includes("Niemand sah ihn"));
});

/* The form as it stands in the text, not the base form: the base form is what
   a dictionary is written about and is usually nowhere in the sentence. */
test("the example is found by the form in the text", () => {
  const card = verbCard({ form: "anduvo", infinitive: "andar", meaning: "gehen" }, READING);
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde."));
});

/* The run works the spot out to colour the passage and the card cuts the
   sentence with it. Where it is not found — the equivalent one question
   answered need not be the word the translator chose — the sentence in the
   same *place* is taken, because a translation keeps a text sentence for
   sentence far more reliably than it keeps any one word.

   This was found on a real reading: the meaning question said "Raumproblem"
   where the panel said "Platzproblem", nothing was found, and the whole
   two-sentence translation went onto the card. */
test("an unfound spot falls back to the sentence in the same place", () => {
  const card = verbCard(
    { form: "anduvo", infinitive: "andar", meaning: "gehen" },
    { ...READING, spot: "einWortDasNichtVorkommt" },
  );
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde. (Er ging den ganzen Nachmittag durch den Park.)"));
});

/* Only where the two texts have the same number of sentences. That condition
   is what makes it safe rather than clever — without it the second sentence
   of one text would be handed back as the second of another that has three. */
test("a translation of another shape is left out rather than guessed", () => {
  const card = verbCard(
    { form: "anduvo", infinitive: "andar", meaning: "gehen" },
    { ...READING, translation: "Er ging. Lange. Durch den Park. Es regnete. Dann kam er.", spot: "" },
  );
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde."));
  assert.ok(!card.note.includes("("), "a wrong sentence is worse than none");
});

test("a translation of a single sentence goes on whole", () => {
  const card = verbCard(
    { form: "anduvo", infinitive: "andar", meaning: "gehen" },
    { ...READING, sentence: "Anduvo por el parque.", translation: "Er ging durch den Park.", spot: "" },
  );
  assert.ok(card.note.includes("Anduvo por el parque. (Er ging durch den Park.)"));
});

test("a verb with no base form still makes a card of the form that is there", () => {
  const card = verbCard({ form: "anduvo", meaning: "ging" }, READING);
  assert.strictEqual(card.term, "anduvo");
});

test("a difficult word goes in as it stands", () => {
  const card = termCard({ text: "parque", meaning: "Park", note: "Eine Grünfläche." }, READING);
  assert.strictEqual(card.term, "parque");
  assert.strictEqual(card.meaning, "Park");
  assert.ok(card.note.startsWith("Eine Grünfläche."));
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde. (Er ging den ganzen Nachmittag durch den Park.)"));
});

/* Without an equivalent the explanation is the meaning, and repeating it
   underneath would be the same sentence twice on one card. */
test("a word with no equivalent puts its explanation on the back once", () => {
  const card = termCard({ text: "parque", note: "Eine Grünfläche." }, READING);
  assert.strictEqual(card.meaning, "Eine Grünfläche.");
  assert.ok(!card.note.includes("Eine Grünfläche."));
  assert.ok(card.note.includes("Anduvo por el parque toda la tarde. (Er ging den ganzen Nachmittag durch den Park.)"));
});

test("a word reached through a synonym gets no example sentence", () => {
  const context = { text: de, wordLanguage: "es", reader: "de", sentence: SOURCE, translation: TARGET };
  /* The marked word finds the other sentence by its equivalent, which is the
     answer to the meaning question and written in exactly that language. */
  const inText = markedCard({ text: "parque", meaning: "Park", note: "Sicherheit." }, context);
  assert.ok(inText.note.includes("Anduvo por el parque toda la tarde. (Er ging den ganzen Nachmittag durch den Park.)"));

  /* It does not stand in the text, so the sentences around it would be an
     example without the vocabulary in it — worse on a card than none. */
  const viaSynonym = markedCard(
    { text: "jardín", meaning: "Garten", note: "Sicherheit.", back: { text: "parque" } },
    context,
  );
  assert.strictEqual(viaSynonym.note, "Sicherheit.");
});

test("a picked word that is a verb goes in as a verb", () => {
  const card = markedCard(
    { text: "anduvo", infinitive: "andar", meaning: "gehen" },
    { text: de, wordLanguage: "es", reader: "de", sentence: "", translation: "" },
  );
  assert.strictEqual(card.term, "andar");
});

/* Short mode. The reader typed a word of their own to find out how it is
   said, so the panel's word is the one being learned and the reading is the
   other side — read off the position it would be the wrong way round. */
test("a dictionary line puts the panel's word on the front", () => {
  const card = entryCard(
    { text: "aparcar", note: "Spanien" },
    { panelLanguage: "es", reader: "de", sentence: "parken" },
  );
  assert.strictEqual(card.term, "aparcar");
  assert.strictEqual(card.termLanguage, "es");
  assert.strictEqual(card.meaning, "parken");
  assert.strictEqual(card.note, "Spanien");
});

test("a dictionary line of a word in a third language puts the reader's own words on the back", () => {
  /* A German reader looks up the English "checkout" and makes a card of the
     Spanish line: the back is German, never the English reading. */
  const card = entryCard(
    { text: "caja", note: "regional" },
    {
      panelLanguage: "es", reader: "de", sentence: "checkout", sourceLanguage: "en",
      readerAlternatives: [{ text: "Kasse" }, { text: "bezahlen" }],
    },
  );
  assert.strictEqual(card.meaning, "Kasse, bezahlen");
  assert.strictEqual(card.meaningLanguage, "de");
  assert.strictEqual(card.note, "regional\ncheckout");
});

test("the copied line is one line, whatever the fields hold", () => {
  const line = cardLine({ term: "andar", meaning: "gehen", note: "eins\nzwei\n\ndrei" });
  assert.strictEqual(line.split("\n").length, 1, "three fields, one line");
  assert.deepStrictEqual(line.split("\t"), ["andar", "gehen", "eins<br>zwei<br>drei"]);
  /* The word being learned first: that is the front of a card in every deck
     anybody has. */
  assert.deepStrictEqual(CARD_FIELDS, ["term", "meaning", "note"]);
});

test("an empty word is not a card", () => {
  assert.strictEqual(hasCard({ term: "andar" }), true);
  assert.strictEqual(hasCard({ term: "  ", meaning: "gehen" }), false);
  assert.strictEqual(hasCard(null), false);
});

/* ---- which field of a note type takes which line ---- */

test("Anki's own note type is guessed right", () => {
  assert.deepStrictEqual(guessFieldMap(["Front", "Back"], ["de", "es"]), {
    term: "Front", meaning: "Back", note: "",
  });
});

test("a field named after a language takes that language", () => {
  /* Which is what every vocabulary note type anybody builds looks like, and
     the reason there is no list of words like "front" and "back" anywhere:
     such a list would be a language named outside a pack. */
  assert.deepStrictEqual(guessFieldMap(["Spanisch", "Deutsch", "Beispiel"], ["de", "es"]), {
    term: "Spanisch", meaning: "Deutsch", note: "Beispiel",
  });
});

/* A note type of thirteen fields, and the reason the leftovers are counted from
   after the last language field rather than from the front: counted from the
   front, the explanation went into `ID` and `Beispiel` stayed empty. */
test("a note type with thirteen fields still lands on the right three", () => {
  const real = ["ID", "Deutsch", "Spanisch", "Beispiel", "Audio", "Lektion",
    "Thema", "Bild1", "Bild2", "Bild3", "Bild4", "Rang", "Nummer"];
  assert.deepStrictEqual(guessFieldMap(real, ["de", "en", "es"]), {
    term: "Spanisch", meaning: "Deutsch", note: "Beispiel",
  });
});

/* Anki judges emptiness and duplicates by the note type's first field, and it
   refuses a note whose first field is blank. On that same note type the field
   is called `ID` and means nothing to a reader, so nobody would map it — and
   every single card was refused. Writing the word into it as well is what
   makes the note go in at all, and it makes the duplicate check the wanted
   one: the same word twice. */
test("the note type's first field gets the word where nothing else claims it", () => {
  const real = ["ID", "Deutsch", "Spanisch", "Beispiel"];
  const written = noteFields(
    { term: "impugnar", meaning: "anfechten", note: "ein Satz" },
    { term: "Spanisch", meaning: "Deutsch", note: "Beispiel" },
    real,
  );
  assert.strictEqual(written.ID, "impugnar", "or Anki refuses the note as empty");
  assert.strictEqual(written.Spanisch, "impugnar");
  assert.strictEqual(written.Beispiel, "ein Satz");
});

test("a first field the reader did claim is left alone", () => {
  const written = noteFields(
    { term: "impugnar", meaning: "anfechten", note: "" },
    { term: "Front", meaning: "Back", note: "" },
    ["Front", "Back"],
  );
  assert.deepStrictEqual(written, { Front: "impugnar", Back: "anfechten" });
});

/* Without the order there is no first field to know about, and inventing one
   would write a field the note type may not have. */
test("with no field order nothing is added", () => {
  assert.deepStrictEqual(
    noteFields({ term: "x", meaning: "y", note: "" }, { term: "A", meaning: "B", note: "" }),
    { A: "x", B: "y" },
  );
});

test("the same field is found however the deck spells the language", () => {
  const wanted = { term: "Español", meaning: "Alemán", note: "Nota" };
  /* The reader's language, English, and the language's own name are all
     asked — so a deck built by a Spanish speaker is read by a German one. */
  assert.deepStrictEqual(guessFieldMap(["Español", "Alemán", "Nota"], ["de", "es"]), wanted);
  assert.deepStrictEqual(guessFieldMap(["Spanish", "German", "Example"], ["de", "es"]), {
    term: "Spanish", meaning: "German", note: "Example",
  });
});

test("a note type named after nothing in particular goes by position", () => {
  assert.deepStrictEqual(guessFieldMap(["Eins", "Zwei", "Drei", "Vier"], ["de", "es"]), {
    term: "Eins", meaning: "Zwei", note: "Drei",
  });
});

test("a note type with one field gets the word and nothing else", () => {
  assert.deepStrictEqual(guessFieldMap(["Text"], ["de", "es"]), {
    term: "Text", meaning: "", note: "",
  });
  assert.deepStrictEqual(guessFieldMap([], ["de", "es"]), { term: "", meaning: "", note: "" });
});

test("a third language is a candidate for the word's field too", () => {
  assert.deepStrictEqual(guessFieldMap(["Deutsch", "Russisch", "Notiz"], ["de", "es", "ru"]), {
    term: "Russisch", meaning: "Deutsch", note: "Notiz",
  });
});

test("only the fields the reader mapped are written", () => {
  const card = { term: "fianza", meaning: "Kaution", note: "El casero\nse negó." };
  assert.deepStrictEqual(noteFields(card, { term: "Front", meaning: "Back", note: "" }), {
    Front: "fianza", Back: "Kaution",
  });
  assert.deepStrictEqual(noteFields(card, { term: "Front", meaning: "", note: "Extra" }), {
    Front: "fianza", Extra: "El casero<br>se negó.",
  });
});

/* Short mode, from the original field. Up to three words in a language being
   learned is a vocabulary item and nothing else. */
test("the reading itself makes a card, with the entry on its back", () => {
  const card = readingCard({
    text: "aparcar",
    sourceLanguage: "es",
    reader: "de",
    alternatives: [
      { text: "parken" },
      { text: "abstellen", note: "eher schriftlich" },
      { text: "einparken", note: "in eine Lücke" },
    ],
  });
  assert.strictEqual(card.term, "aparcar");
  assert.strictEqual(card.termLanguage, "es");
  /* The translations are the back, and the ones carrying a note are named
     again underneath — which of three words to use is the question the entry
     answers. */
  assert.strictEqual(card.meaning, "parken, abstellen, einparken");
  assert.strictEqual(card.note, "abstellen — eher schriftlich\neinparken — in eine Lücke");
});

test("an entry with nothing but plain translations has an empty explanation", () => {
  const card = readingCard({
    text: "aparcar", sourceLanguage: "es", reader: "de",
    alternatives: [{ text: "parken" }],
  });
  assert.strictEqual(card.meaning, "parken");
  assert.strictEqual(card.note, "", "and nothing invented to fill it");
});

test("a reading whose panels have not answered yet still makes a card", () => {
  const card = readingCard({ text: "aparcar", sourceLanguage: "es", reader: "de" });
  assert.strictEqual(card.term, "aparcar");
  assert.strictEqual(card.meaning, "");
});

test("a passage that is its whole sentence is not written on the card twice", () => {
  const context = { text: de, wordLanguage: "es", reader: "de", sentence: SOURCE, translation: TARGET };
  const whole = markedCard({ text: "Anduvo por el parque toda la tarde", passage: true, meaning: "Er ging den ganzen Nachmittag durch den Park" }, context);
  assert.strictEqual(whole.term, "Anduvo por el parque toda la tarde");
  assert.strictEqual(whole.meaning, "Er ging den ganzen Nachmittag durch den Park");
  assert.strictEqual(whole.note, "");
  assert.ok(whole.context.sentence, "the sentence still travels with the card");
});

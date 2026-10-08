import test from "node:test";
import assert from "node:assert/strict";
import { startsUnknown, saysNothing } from "../../src/strings.js";

/* The answers are the ones run twenty-six collected: every marker came back
   in capitals, and every real definition that opened with the same word was
   written in ordinary case and went on. */
test("the marker for an unknown word is taken as the model writes it when it does not know", () => {
  for (const answer of ["UNBEKANNT", "UNKNOWN", "INCONNU", "НЕИЗВЕСТНО", "UNKNOWN.", "unknown", "Unbekannt.", "UNKNOWN - no such word"]) {
    assert.equal(startsUnknown(answer), true, answer);
  }
});

test("a real definition that opens with the word for unknown is kept", () => {
  for (const answer of [
    "Desconhecido, que não se conhece.",
    "Desconocido o incierto.",
    "Unbekannt oder namentlos.",
    "Unknown is not known or familiar.",
    "Desconhecido ou secreto.",
    "Неизвестно откуда появившийся человек.",
  ]) {
    assert.equal(startsUnknown(answer), false, answer);
  }
});

test("a word that merely begins like the marker is no marker", () => {
  assert.equal(startsUnknown("UNKNOWNS are many"), false);
  assert.equal(startsUnknown("Unbekannterweise"), false);
});

test("an entry that says there is nothing is recognised in any language", () => {
  for (const answer of ["none", "keine", "UNKNOWN", "n/a", "--"]) assert.equal(saysNothing(answer), true, answer);
  assert.equal(saysNothing("casa"), false);
});

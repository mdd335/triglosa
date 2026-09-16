import test from "node:test";
import assert from "node:assert";
import { alignFragments, parseAlign } from "../../src/parse/align.js";

const RUN = ["de", "en", "es"];

test("an assignment in the expected order stays as it is", () => {
  const raw = [
    "vuelvas | zurückkommst | come back",
    "cuéntame | erzähl | tell",
    "ha pasado | passiert + ist | happened",
  ].join("\n");
  const r = parseAlign(raw, ["vuelvas", "cuéntame", "ha pasado"], "Verb", RUN);
  assert.deepStrictEqual(r.a, [["zurückkommst"], ["erzähl"], ["passiert", "ist"]]);
  assert.deepStrictEqual(r.b, [["come back"], ["tell"], ["happened"]]);
  assert.deepStrictEqual(r.notes, []);
});

test("a missing row leaves its slot empty instead of shifting everything", () => {
  const raw = ["vuelvas | zurückkommst | come back", "ha pasado | passiert | happened"].join("\n");
  const r = parseAlign(raw, ["vuelvas", "cuéntame", "ha pasado"], "Verb", RUN);
  assert.strictEqual(r.a.length, 3, "one group per entry");
  assert.deepStrictEqual(r.a[0], ["zurückkommst"]);
  assert.deepStrictEqual(r.a[1], [], "cuéntame stays empty");
  assert.deepStrictEqual(r.a[2], ["passiert"], "ha pasado stays in slot 3");
  assert.ok(
    r.notes.some((s) => s.includes("cuéntame") && s.includes("without a row")),
    JSON.stringify(r.notes),
  );
});

test("reordered rows land on their own entry", () => {
  const raw = [
    "ha pasado | passiert | happened",
    "vuelvas | zurückkommst | come back",
    "cuéntame | erzähl | tell",
  ].join("\n");
  const r = parseAlign(raw, ["vuelvas", "cuéntame", "ha pasado"], "Verb", RUN);
  assert.deepStrictEqual(r.a, [["zurückkommst"], ["erzähl"], ["passiert"]]);
  assert.ok(r.notes.length > 0, "the reordering is recorded");
});

test("capitalisation and accents do not separate", () => {
  const raw = ["SE TRATA | handelt | is about", "cuentame | erzähl | tell"].join("\n");
  const r = parseAlign(raw, ["Se trata", "cuéntame"], "Verb", RUN);
  assert.deepStrictEqual(r.a, [["handelt"], ["erzähl"]]);
  assert.deepStrictEqual(r.notes, []);
});

/* Both cases come from real runs, not from imagination: one delivered "con"
   for "con evasivas", another "se sustituyen" for "sustituyen". */
test("a shortened field 1 is matched by name", () => {
  const r = parseAlign("con | ausweichend | evasively", ["con evasivas"], "Word", RUN);
  assert.deepStrictEqual(r.a, [["ausweichend"]]);
  assert.ok(r.notes.some((s) => s.includes("by name")));
});

test("an attached pronoun in field 1 is matched by name", () => {
  const raw = [
    "se sustituyen | werden + ersetzt | are + replaced",
    "lleva | ist | has + been",
    "siendo | - | -",
  ].join("\n");
  const r = parseAlign(raw, ["sustituyen", "lleva", "siendo"], "Verb", RUN);
  assert.deepStrictEqual(r.a[0], ["werden", "ersetzt"]);
  assert.deepStrictEqual(r.a[1], ["ist"]);
  assert.deepStrictEqual(r.a[2], [], "the periphrasis keeps its dash");
});

test("an ambiguous name match does not go by name", () => {
  /* "lleva" sits in both entries — then nothing is unambiguous, and the row
     falls back to position rather than guessing. */
  const r = parseAlign("lleva | ist | has been", ["lleva décadas", "lleva años"], "Verb", RUN);
  assert.ok(r.notes.some((s) => s.includes("fits no entry")), JSON.stringify(r.notes));
});

test("a row fitting nothing falls back to position", () => {
  /* If the model renames field 1, exactly the old position-based assignment
     comes out — never worse than before. */
  const raw = ["volver | zurückkommst | come back", "contar | erzähl | tell"].join("\n");
  const r = parseAlign(raw, ["vuelvas", "cuéntame"], "Verb", RUN);
  assert.deepStrictEqual(r.a, [["zurückkommst"], ["erzähl"]]);
  assert.ok(r.notes.every((s) => s.includes("fits no entry")), JSON.stringify(r.notes));
});

test("more rows than entries do not overflow", () => {
  const raw = [
    "vuelvas | zurückkommst | come back",
    "cuéntame | erzähl | tell",
    "ha pasado | passiert | happened",
  ].join("\n");
  const r = parseAlign(raw, ["vuelvas"], "Verb", RUN);
  assert.strictEqual(r.a.length, 1);
  assert.deepStrictEqual(r.a[0], ["zurückkommst"]);
  assert.ok(r.notes.some((s) => s.includes("left lying")));
});

test("a dash and a lone function word stay out of the spots", () => {
  const raw = ["siendo | - | -", "lleva | ist | has + been", "es | der + ist | the + is"].join("\n");
  const r = parseAlign(raw, ["siendo", "lleva", "es"], "Verb", RUN);
  assert.deepStrictEqual(r.a[0], [], "the dash is an answer, not a spot");
  /* Auxiliaries are deliberately NOT function words: in a copula sentence
     "ist" is the only right spot. */
  assert.deepStrictEqual(r.b[1], ["has", "been"]);
  assert.deepStrictEqual(r.a[2], ["ist"], "the article goes, the verb stays");
  assert.deepStrictEqual(r.b[2], ["is"]);
});

test("the word assignment behaves the same, multipart included", () => {
  const raw = [
    "fármaco | Arzneimittel | drug",
    "ensayo clínico | klinischen + Studie | clinical + trial",
  ].join("\n");
  const r = parseAlign(raw, ["fármaco", "ensayo clínico"], "Word", RUN);
  assert.deepStrictEqual(r.a, [["Arzneimittel"], ["klinischen", "Studie"]]);
  assert.deepStrictEqual(r.b, [["drug"], ["clinical", "trial"]]);
});

test("without an expectation list the old position-based way remains", () => {
  const r = parseAlign(["a | x | y", "b | p | q"].join("\n"));
  assert.deepStrictEqual(r.a, [["x"], ["p"]]);
});

test("an empty answer yields empty groups, not fewer", () => {
  const r = parseAlign("", ["vuelvas", "cuéntame"], "Verb", RUN);
  assert.deepStrictEqual(r.a, [[], []]);
  assert.deepStrictEqual(r.b, [[], []]);
  assert.strictEqual(r.notes.length, 2, "both entries without a row");
});

test("for a verb the article goes, for a term it stays", () => {
  assert.deepStrictEqual(alignFragments("der + ist", true, RUN), ["ist"]);
  assert.deepStrictEqual(alignFragments("Las + Canteras", false, RUN), ["Las", "Canteras"]);
  assert.deepStrictEqual(alignFragments("de + nuevo", false, RUN), ["de", "nuevo"]);
});

test("a lone function word stays bycatch even for a term", () => {
  assert.deepStrictEqual(alignFragments("der", false, RUN), []);
});

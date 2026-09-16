import test from "node:test";
import assert from "node:assert";
import { SUPPORTED, languagePack } from "../../src/languages/index.js";

/* The address each pack names, measured against the site once: every one of
   these answered with the finished table. Pinned here so a change to one of
   them is a decision rather than a typo. */
const EXPECTED = {
  es: "https://conjugator.reverso.net/conjugation-spanish-verb-hablar.html",
  en: "https://conjugator.reverso.net/conjugation-english-verb-go.html",
  de: "https://conjugator.reverso.net/conjugation-german-verb-gehen.html",
  fr: "https://conjugator.reverso.net/conjugation-french-verb-aller.html",
  it: "https://conjugator.reverso.net/conjugation-italian-verb-andare.html",
  pt: "https://conjugator.reverso.net/conjugation-portuguese-verb-ir.html",
  ru: "https://conjugator.reverso.net/conjugation-russian-verb-delat.html",
  ar: "https://conjugator.reverso.net/conjugation-arabic-verb-katab.html",
};

const VERBS = {
  es: "hablar", en: "go", de: "gehen", fr: "aller",
  it: "andare", pt: "ir", ru: "delat", ar: "katab",
};

test("every language the app supports has a conjugation table", () => {
  for (const code of SUPPORTED) {
    const pack = languagePack(code);
    assert.strictEqual(typeof pack.conjugationUrl, "function", code);
    assert.strictEqual(pack.conjugationUrl(VERBS[code]), EXPECTED[code], code);
  }
});

test("a verb that is not spelled in ASCII still gets a usable address", () => {
  /* Percent-encoded, or the address breaks where it matters most: the two
     languages written in another script. */
  assert.strictEqual(
    languagePack("ru").conjugationUrl("делать"),
    "https://conjugator.reverso.net/conjugation-russian-verb-"
      + "%D0%B4%D0%B5%D0%BB%D0%B0%D1%82%D1%8C.html",
  );
  assert.strictEqual(
    languagePack("ar").conjugationUrl("كتب"),
    "https://conjugator.reverso.net/conjugation-arabic-verb-"
      + "%D9%83%D8%AA%D8%A8.html",
  );
});

test("a base form of more than one word keeps its space", () => {
  /* An English phrasal verb and a German reflexive — both answered. */
  assert.strictEqual(
    languagePack("en").conjugationUrl("swing by"),
    "https://conjugator.reverso.net/conjugation-english-verb-swing%20by.html",
  );
  assert.strictEqual(
    languagePack("de").conjugationUrl("sich freuen"),
    "https://conjugator.reverso.net/conjugation-german-verb-sich%20freuen.html",
  );
});

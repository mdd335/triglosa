import test from "node:test";
import assert from "node:assert";
import { parseVerbForms, parseVerbTable, knownPerson, selectVerbForms, withoutVerbs } from "../../src/parse/verbs.js";
import { annotateVerbs } from "../../src/ask.js";
import { languagePack } from "../../src/languages/index.js";

const es = languagePack("es").verbs;
const hard = (form) => es.difficulty(form);

/* Absolute scores are deliberately absent: the weights are adjusting screws.
   What is tested is what should hold — which form outweighs which. */

test("a periphrastic form outweighs a plain present tense", () => {
  assert.ok(hard("puede extrapolar") > hard("experimentan"));
});

test("a diphthongized stem counts, a regular one does not", () => {
  /* The same verb would be ideal but does not exist — so two equally rare
     ones: adquirir and experimentar are both off the frequency list. */
  assert.ok(hard("adquiere") > hard("experimentan"));
});

test("the accent tells present and indefinido apart", () => {
  assert.ok(hard("habló") > hard("hablo"));
});

test("the ie in escribiendo is not a stem change", () => {
  /* The ending is cut before the stem check, otherwise every gerund of an
     -ir verb would count as irregular. */
  assert.ok(hard("escribiendo") < hard("escribió"));
});

test("a present tense in -ara does not pass as subjuntivo", () => {
  assert.ok(hard("declara") < hard("declaró"));
  assert.strictEqual(hard("separan"), hard("separa"));
  /* The i-forms stay recognizable as subjuntivo, those are unambiguous. */
  assert.ok(hard("escribiera") > hard("escribe"));
});

test("an attached pronoun counts, an accidental word ending does not", () => {
  assert.ok(hard("transformarlos") > hard("transformar"));
  assert.ok(hard("cuéntame") > hard("cuenta"));
  assert.strictEqual(hard("sale"), hard("salen"));
});

test("a strong preterite weighs heavily despite its missing ending", () => {
  assert.ok(hard("puso") > hard("pone"));
  assert.ok(hard("dijo") > hard("dice"));
});

test("the silent u in quedado is not a stem change", () => {
  assert.ok(hard("quedan") < hard("quieren"));
  assert.strictEqual(hard("llegue"), hard("llega"));
});

test("a rare verb outweighs a common one in the same form", () => {
  assert.ok(hard("extrapolan") > hard("hablan"));
  assert.ok(hard("adquiere") > hard("vuelve"));
});

test("frequency recognizes the irregular stems too", () => {
  /* pued/pud belong to poder just as pod does — without them the hard form
     of all things would slip past the list. */
  assert.ok(es.isCommon("pod"));
  for (const f of ["puede", "pudo", "podrá", "dijo", "hizo", "tuvieron", "vuelve", "cuéntame"]) {
    assert.ok(es.isCommon(f), f);
  }
  for (const f of ["extrapolar", "adquiere", "experimentan", "sustituyen"]) {
    assert.ok(!es.isCommon(f), f);
  }
});

test("in a multipart form the last word decides", () => {
  /* puede is common, extrapolar is not — the verb carrying the meaning is
     the one that is weighed. */
  assert.ok(hard("puede extrapolar") > hard("puede hablar"));
});

test("the selection takes the hardest and returns them in text order", () => {
  const forms = ["habla", "puede extrapolar", "adquiere", "escribió", "sustituyeron"];
  assert.deepStrictEqual(selectVerbForms(forms, 3, "es"), [
    "puede extrapolar",
    "adquiere",
    "sustituyeron",
  ]);
});

test("a tie leaves the earlier form in front", () => {
  assert.deepStrictEqual(selectVerbForms(["hablan", "llevan", "toman"], 2, "es"), [
    "hablan",
    "llevan",
  ]);
});

test("a language without a verb model keeps the order it was given", () => {
  /* Eight packs have none. Taking the first rows shows fewer interesting
     verbs, but never a wrong one. */
  const forms = ["parle", "aurait pu discuter", "vient"];
  assert.deepStrictEqual(selectVerbForms(forms, 2, "fr"), ["parle", "aurait pu discuter"]);
});

test("only forms standing in the text survive", () => {
  /* The model hands back the infinitive instead of the conjugated form —
     and what is not in the text cannot be highlighted later. */
  const text = "El modelo adquiere el rendimiento que experimentan los grandes.";
  const raw = "adquiere\nexperimentan\nresponder\nHere are the verbs I found in your text, listed";
  assert.deepStrictEqual(parseVerbForms(raw, text, "es"), ["adquiere", "experimentan"]);
});

test("forms of to be are dropped where a language knows them", () => {
  const text = "El asunto es complejo y se trata de una época para disfrutar.";
  assert.deepStrictEqual(parseVerbForms("es\nse trata\ndisfrutar", text, "es"), [
    "se trata",
    "disfrutar",
  ]);
});

test("a sentence of nothing but copulas still gets its rows", () => {
  const text = "El asunto es complejo y hay tiempo.";
  assert.deepStrictEqual(parseVerbForms("es\nhay", text, "es"), ["es", "hay"]);
});

test("a language without a verb model keeps its copulas", () => {
  const text = "Le sujet est complexe et il y a du temps.";
  assert.deepStrictEqual(parseVerbForms("est", text, "fr"), ["est"]);
});

test("the annotated table needs a base form in field two", () => {
  /* The conjugation link and the Anki entry are built from it, so "ser
     (implícito)" or a bare dash is unusable. */
  const raw = [
    "adquiere | adquirir | erwirbt | 3. Sg. | Presente",
    "es | ser (implícito) | ist | 3. Sg. | Presente",
    "dijo | decir | sagte | 3. Sg. | Indefinido",
  ].join("\n");
  const rows = parseVerbTable(raw, "es");
  assert.deepStrictEqual(rows.map((r) => r.form), ["adquiere", "dijo"]);
  assert.strictEqual(rows[0].infinitive, "adquirir");
  assert.strictEqual(rows[0].meaning, "erwirbt");
  assert.strictEqual(rows[0].tense, "Presente");
});

test("without a pack to ask, any non-empty second field passes", () => {
  const rows = parseVerbTable("idzie | iść | geht | 3. Sg. | Presens", "pl");
  assert.deepStrictEqual(rows.map((r) => r.infinitive), ["iść"]);
});

test("a word coinciding with a verb form is dropped, an expression stays", () => {
  const verbs = [{ form: "tiramos" }, { form: "habia exigido" }];
  const words = [
    { text: "exigido" },
    { text: "tiramos la toalla" },
    { text: "rendimiento" },
  ];
  assert.deepStrictEqual(withoutVerbs(words, verbs).map((w) => w.text), [
    "tiramos la toalla",
    "rendimiento",
  ]);
});

/* Three packs name their own infinitives; Arabic can name none, because its
   dictionaries list the third person of the perfect rather than an
   infinitive. What all eight carry is their function words, and a preposition
   is a verb in none of them — measured, exactly one row on the eight-language
   corpus, where "على" arrived as an Arabic base form and was drawn. */
test("a function word is not a base form in any language", () => {
  const table = parseVerbTable("غضّ | على | absehen | هو | ماضٍ\nرفع | رفع | einlegen | هو | ماضٍ", "ar");
  assert.deepStrictEqual(table.map((v) => v.infinitive), ["رفع"]);
  /* And nothing that is a verb falls with it. */
  assert.deepStrictEqual(
    parseVerbTable("a fait | faire | machen | il | passé composé", "fr").map((v) => v.infinitive),
    ["faire"],
  );
});

test("an auxiliary handed back apart from its participle is joined to it again", () => {
  /* Measured on the cloud model: "ha" and "aprobado" as two lines, and the
     table then explained "ha | haber | haben". */
  const es = "El Gobierno ha aprobado una prórroga, aunque amenazan con tumbarla.";
  assert.deepStrictEqual(parseVerbForms("ha\naprobado\namenazan", es, "es"), ["ha aprobado", "amenazan"]);
  const fr = "Le gouvernement a dégainé le budget, puis il est parti.";
  assert.deepStrictEqual(parseVerbForms("a\ndégainé\nest\nparti", fr, "fr"), ["a dégainé", "est parti"]);
  /* A comma between them is a boundary between two verbs. */
  const de = "Er kam, sah und siegte.";
  assert.deepStrictEqual(parseVerbForms("kam\nsah\nsiegte", de, "de"), ["kam", "sah", "siegte"]);
});

test("a row with no letters to it or no meaning is no verb", () => {
  const raw = "m | m |  |  | \nCan't | can | können | I | present simple";
  assert.deepStrictEqual(parseVerbTable(raw, "en").map((v) => v.form), ["Can't"]);
});

test("a person is one the pack names, never the subject of the sentence", () => {
  assert.strictEqual(knownPerson("El Gobierno", "es"), "");
  assert.strictEqual(knownPerson("ellos/ustedes", "es"), "ellos/ustedes");
  assert.strictEqual(knownPerson("elle", "fr"), "il/elle/on");
  assert.strictEqual(knownPerson("Infinitive", "de"), "infinitive");
  const raw = "ha aprobado | aprobar | genehmigen | El Gobierno | pretérito perfecto";
  assert.strictEqual(parseVerbTable(raw, "es")[0].person, "");
});

test("a term shortened by the model is still recognised as the verb its spot is", () => {
  const words = [{ text: "subsana", spot: "subsanar" }, { text: "días hábiles", spot: "días hábiles" }];
  assert.deepStrictEqual(withoutVerbs(words, [{ form: "subsanar" }]).map((w) => w.text), ["días hábiles"]);
});

test("a Russian noun is not taken for a verb's base form", () => {
  const raw = "ожидали | ожидать | expect | они | прошедшее время\nснижения | снижение | decline | он/она/оно | прошедшее время\nобязуется | обязываться | undertake | он/она/оно | настоящее время\nзабрёл | забрести | stray | он/она/оно | прошедшее время";
  assert.deepStrictEqual(parseVerbTable(raw, "ru").map((v) => v.form), ["ожидали", "обязуется", "забрёл"]);
});

test("a clitic is no form, and an auxiliary alone gives way to anything else", () => {
  const en = "I'm swamped at work and Tom's bailing on the trip.";
  assert.deepStrictEqual(parseVerbForms("m\nswamped\ns\nbailing", en, "en"), ["swamped", "bailing"]);
  /* The modal goes the same way as the auxiliary: what carries the meaning
     here is "erhoben werden", and a row for "kann" explains nothing. */
  const de = "Gegen den Bescheid kann Widerspruch erhoben werden. Er hat keine Wirkung.";
  assert.deepStrictEqual(parseVerbForms("kann\nerhoben werden\nhat", de, "de"), ["erhoben werden"]);
});

test("two rows of one verb in one sentence become one row", async () => {
  const text = "Die Koalition hat sich nach zähen Verhandlungen geeinigt; die Union kündigte an.";
  const llm = { chat: async () => [
    "hat sich | sich einigen | agree | er/sie/es | Perfekt",
    "geeinigt | sich einigen | agree |  | Partizip II",
    "kündigte | ankündigen | announce | er/sie/es | Präteritum",
  ].join("\n") };
  const rows = await annotateVerbs(llm, { text, source: "de", reader: "en", forms: ["hat sich", "geeinigt", "kündigte"] });
  assert.deepStrictEqual(rows.map((r) => r.form), ["hat + sich + geeinigt", "kündigte"]);
});

/* ---- the verbs of the first weeks ---- */

import { withoutBasicVerbs } from "../../src/parse/verbs.js";
import { SUPPORTED, bareInfinitive, citationForm, wordSet } from "../../src/languages/index.js";

const row = (form, infinitive) => ({ form, infinitive, meaning: "x", person: "", tense: "" });

test("every language names the verbs of its first weeks", () => {
  for (const code of SUPPORTED) {
    assert.ok(wordSet(code, "basicVerbs").size >= 10, code);
  }
});

test("a basic verb is left out from B1 up and kept below it", () => {
  const rows = [row("was", "be"), row("had", "have"), row("pondered", "ponder")];
  assert.deepStrictEqual(withoutBasicVerbs(rows, "en", { level: "B1" }).map((r) => r.infinitive), ["ponder"]);
  assert.deepStrictEqual(withoutBasicVerbs(rows, "en", { level: "C2" }).map((r) => r.infinitive), ["ponder"]);
  assert.deepStrictEqual(withoutBasicVerbs(rows, "en", { level: "A2" }).length, 3);
  /* No level set means the default, which is B1. */
  assert.deepStrictEqual(withoutBasicVerbs(rows, "en", {}).map((r) => r.infinitive), ["ponder"]);
});

test("in the reader's own language a basic verb is always left out", () => {
  const rows = [row("hatte", "haben"), row("erwog", "erwägen")];
  assert.deepStrictEqual(withoutBasicVerbs(rows, "de", { level: "A1", own: true }).map((r) => r.infinitive), ["erwägen"]);
});

test("a basic verb is found however its base form is written", () => {
  assert.strictEqual(withoutBasicVerbs([row("was", "to be")], "en", { level: "B2" }).length, 0);
  assert.strictEqual(withoutBasicVerbs([row("était", "etre")], "fr", { level: "B2" }).length, 0);
  assert.strictEqual(withoutBasicVerbs([row("قالت", "قال")], "ar", { level: "B2" }).length, 0);
  assert.strictEqual(withoutBasicVerbs([row("fue", "ir")], "es", { level: "B2" }).length, 0);
});

test("the annotation leaves the basic verbs out for a B1 reader", async () => {
  const llm = { chat: async () => "was | be | war | he/she/it | past simple\npondered | ponder | grübelte | he/she/it | past simple" };
  const text = "He was tired and pondered the offer.";
  const rows = await annotateVerbs(llm, { text, source: "en", reader: "de", level: "B1", forms: ["was", "pondered"] });
  assert.deepStrictEqual(rows.map((r) => r.infinitive), ["ponder"]);
});

test("an English base form is shown with to, and looked up without it", () => {
  assert.strictEqual(citationForm("en", "ponder"), "to ponder");
  assert.strictEqual(citationForm("en", "to ponder"), "to ponder");
  assert.strictEqual(bareInfinitive("en", "to ponder"), "ponder");
  /* No other language of the eight writes a particle in front of it. */
  for (const code of SUPPORTED.filter((c) => c !== "en")) {
    assert.strictEqual(citationForm(code, "x"), "x", code);
  }
});

test("two verbs side by side are two verbs, not one welded form", () => {
  /* Joining what stands next to each other is for a compound form — an
     auxiliary with its participle. Without that condition an English heading
     came back as one form, "Retry hover", which the annotation then made a
     base form out of: "to retry hover". */
  const en = "Retry hover photo with folded last section";
  assert.deepStrictEqual(parseVerbForms("Retry\nhover\nfolded", en, "en"),
    ["Retry", "hover", "folded"]);

  const es = "El Gobierno ha aprobado una prórroga de las ayudas.";
  assert.deepStrictEqual(parseVerbForms("ha\naprobado", es, "es"), ["ha aprobado"]);

  const de = "Die Koalition hat sich geeinigt und wird morgen abstimmen.";
  assert.deepStrictEqual(parseVerbForms("hat\ngeeinigt\nwird abstimmen", de, "de"), ["geeinigt", "wird + abstimmen"]);
});

test("a word used as a preposition is not a verb, in any of the eight", () => {
  /* Measured on a cloud model: "como general de división comandante militar
     de las Islas Canarias" holds no verb, and the table said
     "como | comer | essen | yo | presente". */
  const es = "como general de división comandante militar de las Islas Canarias";
  assert.deepStrictEqual(parseVerbForms("como", es, "es"), []);
  const fr = "Il travaille comme ingénieur depuis 2019.";
  assert.deepStrictEqual(parseVerbForms("comme\ntravaille", fr, "fr"), ["travaille"]);
});

test("a form and a tense saying the same word say it once", () => {
  const rows = parseVerbTable("hover | hover | schweben | infinitive | infinitive", "en");
  assert.deepStrictEqual(rows.map((v) => [v.person, v.tense]), [["", "infinitive"]]);
  /* And the same where the tense came back in the language of the text, so
     that the two fields are not even the same word: "infinitive · infinitivo". */
  const italian = parseVerbTable("decurtato | decurtare | kürzen | participle | participio", "it");
  assert.deepStrictEqual(italian.map((v) => [v.person, v.tense]), [["", "participio"]]);
  const kept = parseVerbTable("measures | measure | messen | he/she/it | present simple", "en");
  assert.deepStrictEqual(kept.map((v) => [v.person, v.tense]), [["he/she/it", "present simple"]]);
});

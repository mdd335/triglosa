import test from "node:test";
import assert from "node:assert/strict";
import { RETURN, addNoteUrl, createAnkiMobile, infoUrl, readAnkiInfo } from "../../src/platform/anki-mobile.js";

const INFO = JSON.stringify({
  profiles: [{ name: "User 1" }],
  decks: [{ name: "Default" }, { name: "Español::Verbos" }],
  notetypes: [
    { name: "Basic", fields: [{ name: "Front" }, { name: "Back" }] },
    { name: "Vokabel", fields: [{ name: "ID" }, { name: "Spanisch" }, { name: "Deutsch" }] },
  ],
});

const CONFIG = { deck: "Español::Verbos", noteType: "Basic", fields: { term: "Front", meaning: "Back", note: "" } };

/* A shell that goes to Anki and comes back as told. */
function shell({ installed = true, back = "added", left = INFO } = {}) {
  const opened = [];
  return {
    opened,
    seams: {
      open: async (url) => { opened.push(url); return installed; },
      left: async () => left,
      onReturn: async (toldAddress, shown) => {
        setTimeout(() => {
          shown();
          if (back) toldAddress(RETURN + back);
        }, 0);
        return () => {};
      },
    },
  };
}

const memory = (value = "") => ({ read: () => value, write(next) { value = next; }, get value() { return value; } });
const noWait = () => Promise.resolve();

test("what AnkiMobile says about itself is read down to names", () => {
  assert.deepStrictEqual(readAnkiInfo(INFO), {
    decks: ["Default", "Español::Verbos"],
    noteTypes: [
      { name: "Basic", fields: ["Front", "Back"] },
      { name: "Vokabel", fields: ["ID", "Spanisch", "Deutsch"] },
    ],
  });
  assert.strictEqual(readAnkiInfo("not json"), null);
  assert.strictEqual(readAnkiInfo("{}"), null);
  assert.deepStrictEqual(readAnkiInfo({ decks: ["A"], notetypes: [] }), { decks: ["A"], noteTypes: [] });
});

test("a note is an address: type, deck, each field, the tag and the way back", () => {
  const url = new URL(addNoteUrl({ term: "andar", meaning: "gehen", note: "x\ny" }, CONFIG, ["Front", "Back"]));
  assert.strictEqual(url.protocol, "anki:");
  assert.strictEqual(url.pathname, "/addnote");
  assert.strictEqual(url.searchParams.get("type"), "Basic");
  assert.strictEqual(url.searchParams.get("deck"), "Español::Verbos");
  assert.strictEqual(url.searchParams.get("fldFront"), "andar");
  assert.strictEqual(url.searchParams.get("fldBack"), "gehen");
  assert.strictEqual(url.searchParams.get("tags"), "Triglosa");
  assert.strictEqual(url.searchParams.get("x-success"), `${RETURN}added`);
  assert.ok(!url.search.includes("+"), "a space is written as %20");
  assert.ok(!url.searchParams.has("profile") && !url.searchParams.has("dupes"));
});

test("the note type's first field gets the word where nothing claims it", () => {
  const config = { deck: "D", noteType: "Vokabel", fields: { term: "Spanisch", meaning: "Deutsch", note: "" } };
  const url = new URL(addNoteUrl({ term: "andar", meaning: "gehen", note: "" }, config, ["ID", "Spanisch", "Deutsch"]));
  assert.strictEqual(url.searchParams.get("fldID"), "andar");
});

test("the lists are fetched on a trip to Anki and kept", async () => {
  const { seams, opened } = shell({ back: "info" });
  const store = memory();
  const anki = createAnkiMobile(seams, store, noWait);
  assert.strictEqual(await anki.answering(), false);
  assert.strictEqual(await anki.start(), true);
  assert.deepStrictEqual(opened, [infoUrl()]);
  assert.strictEqual(await anki.answering(), true);
  assert.deepStrictEqual(await anki.decks(), ["Default", "Español::Verbos"]);
  assert.deepStrictEqual(await anki.noteTypes(), ["Basic", "Vokabel"]);
  assert.deepStrictEqual(await anki.fieldsOf("Vokabel"), ["ID", "Spanisch", "Deutsch"]);
  assert.deepStrictEqual(await anki.noteTypesIn("Default"), []);
  /* And still there for the next one that asks. */
  assert.strictEqual(await createAnkiMobile(seams, store, noWait).answering(), true);
});

test("no Anki installed, and a reader back without the lists, are told apart", async () => {
  assert.strictEqual(await createAnkiMobile(shell({ installed: false }).seams, memory(), noWait).start(), "absent");
  assert.strictEqual(await createAnkiMobile(shell({ back: "", left: "" }).seams, memory(), noWait).start(), "left");
});

test("a card is saved where Anki sends the reader back, and nothing is claimed otherwise", async () => {
  const card = { term: "andar", meaning: "gehen", note: "" };
  const sent = shell({ back: "added" });
  assert.deepStrictEqual(await createAnkiMobile(sent.seams, memory(INFO), noWait).add(card, CONFIG),
    { kind: "saved", detail: "" });
  assert.ok(sent.opened[0].startsWith("anki://x-callback-url/addnote?"));

  const alone = shell({ back: "" });
  assert.deepStrictEqual(await createAnkiMobile(alone.seams, memory(INFO), noWait).add(card, CONFIG),
    { kind: "left", detail: "" });
  const none = shell({ installed: false });
  assert.deepStrictEqual(await createAnkiMobile(none.seams, memory(INFO), noWait).add(card, CONFIG),
    { kind: "absent", detail: "" });
  assert.deepStrictEqual(await createAnkiMobile(sent.seams, memory(INFO), noWait).add(card, { ...CONFIG, deck: "" }),
    { kind: "unconfigured", detail: "" });
});

test("lists lost with a new install are fetched before a card goes out, so its first field is filled", async () => {
  const card = { term: "andar", meaning: "gehen", note: "" };
  const unmapped = { deck: "Default", noteType: "Basic", fields: { term: "", meaning: "", note: "" } };
  const sent = shell({ back: "added" });
  const result = await createAnkiMobile(sent.seams, memory(), noWait).add(card, unmapped);
  assert.deepStrictEqual(result, { kind: "saved", detail: "" });
  assert.strictEqual(sent.opened[0], infoUrl());
  assert.strictEqual(new URL(sent.opened[1]).searchParams.get("fldFront"), "andar");

  const gone = shell({ back: "added" });
  assert.deepStrictEqual(await createAnkiMobile(gone.seams, memory(), noWait).add(card, { ...unmapped, noteType: "Gone" }),
    { kind: "unconfigured", detail: "" });
  assert.strictEqual(gone.opened.length, 1, "no note without its first field");
  assert.deepStrictEqual(await createAnkiMobile(shell({ installed: false }).seams, memory(), noWait).add(card, unmapped),
    { kind: "absent", detail: "" });
});

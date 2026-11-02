import test from "node:test";
import assert from "node:assert";
import { rightToLeft, screenText } from "../../src/screen-text.js";
import { scriptsFor } from "../../src/platform/screen.js";

/* A line of text at a row (top in units of 30 pixels) between two x's. */
const at = (t, row, left, right, top = row * 30) => ({ t, b: [left, top, right, top + 20] });

test("a paragraph's lines carry on, a short one ends the paragraph", () => {
  const lines = [
    at("Als wir ankamen, regnete es, und wir hatten", 0, 0, 600),
    at("noch keinen Schlüssel. Mein Vater rief an.", 1, 0, 590),
    at("Dann kam der Wind.", 2, 0, 250),
    at("Am nächsten Morgen war alles anders.", 3.5, 0, 500),
  ];
  assert.strictEqual(screenText(lines),
    "Als wir ankamen, regnete es, und wir hatten noch keinen Schlüssel. Mein Vater rief an. Dann kam der Wind.\nAm nächsten Morgen war alles anders.");
});

test("two columns are read one after the other, not across", () => {
  const lines = [
    at("Die erste Spalte beginnt", 0, 0, 300), at("die zweite Spalte beginnt", 0, 360, 660),
    at("und geht hier weiter.", 1, 0, 290), at("und endet hier.", 1, 360, 600),
  ];
  assert.strictEqual(screenText(lines), "Die erste Spalte beginnt und geht hier weiter. die zweite Spalte beginnt und endet hier.");
});

test("a heading stands apart, however wide", () => {
  const lines = [{ t: "Ein Umzug im Regen", b: [0, 0, 600, 34] }, at("Als wir ankamen, regnete es, und wir hatten", 1.5, 0, 600), at("keinen Schlüssel.", 2.5, 0, 200)];
  assert.strictEqual(screenText(lines), "Ein Umzug im Regen\nAls wir ankamen, regnete es, und wir hatten keinen Schlüssel.");
});

test("the order the recogniser answered in does not matter", () => {
  const lines = [at("zweite Zeile.", 1, 0, 300), at("Erste Zeile und", 0, 0, 310)];
  assert.strictEqual(screenText(lines), "Erste Zeile und zweite Zeile.");
});

test("Arabic word boxes are read right to left", () => {
  const lines = [at("الطابور", 0, 0, 80), at("تجاوز", 0, 90, 150), at("رجل", 0, 160, 200), at("مع", 0, 210, 240)];
  assert.strictEqual(screenText(lines, { rtl: true }), "مع رجل تجاوز الطابور");
});

test("a word broken with a hyphen is joined with it", () => {
  const lines = [at("Das ist ein Fahr-", 0, 0, 400), at("rad mit drei Gängen.", 1, 0, 390)];
  assert.strictEqual(screenText(lines), "Das ist ein Fahr-rad mit drei Gängen.");
});

test("lines of a script without spaces are joined without one", () => {
  const lines = [at("请您在十个工作日内提交", 0, 0, 440), at("所需的证明材料逾期未提", 1, 0, 440), at("交的视为撤回。", 2, 0, 280)];
  assert.strictEqual(screenText(lines), "请您在十个工作日内提交所需的证明材料逾期未提交的视为撤回。");
});

test("labels in a list stay apart, the text beside them stays whole", () => {
  const lines = [
    at("das Werkzeug", 0, 0, 90), at("mit dem sich", 1, 0, 85), at("die Regale hätten montieren", 2, 0, 160),
    at("Rohre gluckerten und dass sich der Nachbar schon", 0, 220, 700),
    at("beschwert hatte.", 1, 220, 340),
  ];
  assert.strictEqual(screenText(lines),
    "das Werkzeug\nmit dem sich\ndie Regale hätten montieren\nRohre gluckerten und dass sich der Nachbar schon beschwert hatte.");
});

test("nothing read is no text", () => {
  assert.strictEqual(screenText([]), "");
  assert.strictEqual(screenText([{ t: "  ", b: [0, 0, 10, 10] }]), "");
  assert.strictEqual(screenText(null), "");
});

test("Windows reads with the recognisers of the reader's scripts, Latin where none fits", () => {
  assert.deepStrictEqual(scriptsFor(["de", "ru", "ja"]), ["latin", "cyrillic", "chinese"]);
  assert.deepStrictEqual(scriptsFor(["ar", "fa", "zh"]), ["arabic", "chinese"]);
  assert.deepStrictEqual(scriptsFor(["ko", "el"]), ["latin"]);
});

/* The boxes PaddleOCR gave two selected lines in a Windows text box: the
   line fell apart into pieces that overlap, each read with a sliver of its
   neighbour (". Los", "s y el"). */
test("pieces of a line that overlap give their doubled edge once", () => {
  const exact = [
    ["La ciudad", 14, 13, 184, 53], ["amaneció", 185, 13, 359, 53], ["cubierta", 359, 14, 506, 53],
    ["de", 500, 15, 562, 52], ["niebla.", 556, 14, 682, 52], [". Los", 667, 15, 750, 53],
    ["vecinos", 744, 16, 883, 52], ["tardaron en salir d", 881, 10, 1200, 56],
    ["tarde que de costumbre.", 510, 59, 933, 110], ["casas", 16, 68, 116, 106],
    ["s y el ", 99, 61, 192, 109], ["mercado abrió más", 178, 61, 519, 105],
  ].map(([t, ...b]) => ({ t, b }));
  assert.strictEqual(screenText(exact),
    "La ciudad amaneció cubierta de niebla. Los vecinos tardaron en salir d casas y el mercado abrió más tarde que de costumbre.");
  const shifted = [
    ["La ciudad", 19, 17, 186, 57], ["amaneció cubierta", 186, 16, 511, 58], ["de niebla. Los ", 504, 14, 763, 60],
    [": vecinos", 740, 18, 886, 57], ["tardaron en salir de", 883, 14, 1205, 59], ["casas y el", 15, 64, 193, 117],
    ["mercado abrió más t", 180, 64, 533, 109], ["tarde que de costumbre.", 512, 63, 935, 114],
  ].map(([t, ...b]) => ({ t, b }));
  assert.strictEqual(screenText(shifted),
    "La ciudad amaneció cubierta de niebla. Los : vecinos tardaron en salir de casas y el mercado abrió más tarde que de costumbre.");
});

test("words whose boxes only touch keep every letter", () => {
  const lines = [at("Ende", 0, 0, 80), at("eines", 0, 76, 170), at("Satzes.", 0, 166, 290)];
  assert.strictEqual(screenText(lines), "Ende eines Satzes.");
});

test("the shortcut under the pointer is answered either way: a piece read, or why there is none", async () => {
  /* The shell as the page meets it: commands and events through its
     internals, here a stand-in that keeps what is listened for. */
  const listened = new Map();
  const internals = {
    transformCallback: (callback) => callback,
    invoke: async (command, args) => {
      if (command === "plugin:event|listen") {
        listened.set(args.event, args.handler);
        return listened.size;
      }
      return null;
    },
  };
  globalThis.__TAURI_INTERNALS__ = internals;
  globalThis.window = { __TAURI_INTERNALS__: internals };
  try {
    const { onPointerScreen } = await import("../../src/platform/screen.js");
    const read = [];
    const failed = [];
    await onPointerScreen({ onRead: (piece) => read.push(piece), onFailed: (reason) => failed.push(reason) });
    listened.get("pointer-screen")({ payload: { sentence: true, at: [3, 4], size: [10, 10] } });
    listened.get("pointer-failed")({ payload: "permission" });
    listened.get("pointer-failed")({ payload: null });
    assert.deepStrictEqual(read, [{ sentence: true, at: [3, 4], size: [10, 10] }]);
    assert.deepStrictEqual(failed, ["permission", ""]);
  } finally {
    delete globalThis.__TAURI_INTERNALS__;
    delete globalThis.window;
  }
});

test("a piece reads right to left where most of its lines are in such a script", () => {
  const line = (t) => ({ t, b: [0, 0, 10, 10] });
  assert.strictEqual(rightToLeft([line("مرحبا بالعالم"), line("שלום"), line("Hello")]), true);
  assert.strictEqual(rightToLeft([line("مرحبا"), line("Hello")]), false);
  assert.strictEqual(rightToLeft([line("Hola"), line("mundo")]), false);
});

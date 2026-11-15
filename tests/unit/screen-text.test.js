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

test("a photographed paragraph's tilted lines are laid level before they are put in order", () => {
  /* Lines of a photographed packet (Dutch), as Apple's recognition gave
     them: rising about 1 in 60, each upright box half as high again as its
     line, so that two neighbours' overlap by more than half — the second
     and third, the fourth and fifth came out swapped. */
  const lines = [
    { t: "HOOG CAFEINEGEHALTE (200 MG IN VIER KAUWGOM) NIET AANBEVOLEN VOOR KINDEREN EN ZWANGERE EN VROUWEN DIE", b: [-1, 102, 1402, 204], s: -21 },
    { t: "BORSTVOEDING GEVEN EN MENSEN DIE GEVOELIG OP CAFEÏNE REAGEREN. INGREDIENTEN: Kaumasse; Süssungsmittel:", b: [0, 145, 1391, 243], s: -13 },
    { t: "Sorbit, Xylit, Mannit, Sucralose, Acesulfam-K, Thaumatin; Aromen; Emulgator E 473; Gom; zoetstoffen: sorbitolen, xylitol,", b: [0, 192, 1377, 291], s: -12 },
    { t: "mannitol, sucralose, acesulfaam-K, thaumatine; aroma, emulgator: E 473; antioxidant: alfa-tocoferol; natuurlijke", b: [-1, 235, 1378, 341], s: -22 },
    { t: "pepermuntolie, cafeïne, antiklontermiddel: (E 470b, E 551, talk); verdikkingsmiddel: arabische gom; glansmiddel: talk,", b: [0, 283, 1386, 381], s: -15 },
    { t: "carnaubawas; kleuren: titaniumdioxide; ginseng-extract (panax ginseng, wortel, met maltodextrine), nicotinamide", b: [-1, 324, 1389, 424], s: -22 },
    { t: "(niacine), calcium-D-pantothenaat, vitamine B6 (pyridoxinehydrochloride), vitamine B1 (thiaminehydrochloride),", b: [0, 373, 1399, 463], s: -15 },
  ];
  const read = screenText(lines);
  const order = ["HOOG", "Kaumasse", "Sorbit,", "mannitol", "pepermuntolie", "carnaubawas", "(niacine)"].map((word) => read.indexOf(word));
  assert.deepStrictEqual(order, [...order].sort((a, b) => a - b), read);
  assert.ok(!read.includes("\n"), "one paragraph");
  const unlevelled = screenText(lines.map(({ s, ...line }) => line));
  assert.ok(unlevelled.indexOf("mannitol") < unlevelled.indexOf("Sorbit,"), "without slopes they are not");
});

test("a sheet held far aslant is read in its own order", () => {
  /* A notice photographed turned by nearly forty degrees, as Apple's
     recognition gave it: each line's upright box nearly square, so that
     only its letters tell how long it is. */
  const lines = [
    { t: "Dein Hund hat keinen", b: [532, 721, 864, 1001], s: -803 },
    { t: "Dog Sticker", b: [631, 814, 827, 995], s: -875 },
    { t: "Bitte melde dich beim Crewcare", b: [605, 814, 915, 1070], s: -793 },
  ];
  assert.strictEqual(screenText(lines), "Dein Hund hat keinen Dog Sticker\nBitte melde dich beim Crewcare");
});

test("short lines turned a little are read top to bottom", () => {
  /* A strip of a poem stuck aslant on a collage: its upright boxes
     overlap more than they are apart. */
  const lines = [
    { t: "Mujer.", b: [395, 746, 473, 796], s: 334 },
    { t: "Sólo mujer.", b: [392, 768, 510, 832], s: 381 },
    { t: "¿Entiendes?", b: [376, 787, 512, 858], s: 322 },
    { t: "Ni pajarilla del necesario albergue,", b: [369, 810, 708, 946], s: 326 },
    { t: "ni alimento para deseosos animales,", b: [363, 833, 707, 969], s: 329 },
  ];
  assert.strictEqual(screenText(lines),
    "Mujer.\nSólo mujer.\n¿Entiendes?\nNi pajarilla del necesario albergue, ni alimento para deseosos animales,");
});

test("a level text is left as it is", () => {
  const lines = [{ ...at("Als wir ankamen, regnete es,", 0, 0, 600), s: 2 }, { ...at("und wir hatten keinen Schlüssel.", 1, 0, 590), s: -3 }];
  assert.strictEqual(screenText(lines), "Als wir ankamen, regnete es, und wir hatten keinen Schlüssel.");
});

test("a list's items stand on their own lines, however wide", () => {
  const lines = [
    at("Ein Handschuh pro Körperregion:", 0, 0, 600),
    at("1. Gesicht, Nacken und Brust", 1, 0, 590),
    at("2. Rechter Arm und Achselhöhle", 2, 0, 600),
    at("• Für alle Hauttypen und jede Jahreszeit", 3, 0, 600),
    at("• Nicht im Gesicht anwenden, bitte", 4, 0, 600),
  ];
  assert.strictEqual(screenText(lines),
    "Ein Handschuh pro Körperregion:\n1. Gesicht, Nacken und Brust\n2. Rechter Arm und Achselhöhle\n• Für alle Hauttypen und jede Jahreszeit\n• Nicht im Gesicht anwenden, bitte");
});

test("an empty line ends a paragraph, however wide its last row", () => {
  /* A typed notice: a heading of two full rows, an empty line, the text. */
  const lines = [
    at("Übernahme der Kontrollen und Störungserfassung des Ma-", 0, 0, 600),
    at("schinendienstes durch die Schaltwärter/Schichtelektriker", 1, 0, 610),
    at("Zum 01. April 1987 wird zu den Tätigkeiten der bisherigen", 3, 0, 620),
    at("Schaltwärter die Kontrolle und Störungserfassung genommen.", 4, 0, 620),
  ];
  assert.strictEqual(screenText(lines),
    "Übernahme der Kontrollen und Störungserfassung des Ma-schinendienstes durch die Schaltwärter/Schichtelektriker\n" +
    "Zum 01. April 1987 wird zu den Tätigkeiten der bisherigen Schaltwärter die Kontrolle und Störungserfassung genommen.");
});

test("a row opening with a number is no list where it is the only one", () => {
  const lines = [at("Die Kirche wurde im späten", 0, 0, 600), at("12. Jahrhundert gebaut und", 1, 0, 590), at("später erweitert.", 2, 0, 390)];
  assert.strictEqual(screenText(lines), "Die Kirche wurde im späten 12. Jahrhundert gebaut und später erweitert.");
});

test("a strip of the next column, cut by the frame's edge, is left out", () => {
  /* A column of a photographed magazine page framed with a little of each
     neighbour, as Apple's recognition read it: the cut ends of the left
     neighbour's lines at x 0, its right neighbour's beginnings at the
     piece's right edge (617 wide). */
  const lines = [
    { t: "randsee", b: [0, 20, 87, 38], s: 0 }, { t: "e beider", b: [0, 51, 87, 74], s: 0 },
    { t: "gen 173", b: [0, 89, 84, 113], s: 12 }, { t: "ürttem-", b: [0, 120, 84, 138], s: 0 },
    { t: "3 km in", b: [0, 151, 83, 178], s: 36 }, { t: "weIZ.", b: [0, 190, 51, 213], s: 0 },
    { t: "Obersee", b: [0, 231, 82, 255], s: 0 }, { t: "et, mit", b: [0, 267, 82, 293], s: 0 },
    { t: "e (594", b: [0, 300, 79, 326], s: 0 },
    { t: "Das Pedalieren schräg nach vorne er-", b: [148, 21, 550, 55], s: 22 },
    { t: "zeugt beim Hochrad Lenkkräfte und er-", b: [115, 54, 550, 88], s: 16 },
    { t: "schwert dadurch das Balancieren beim", b: [112, 86, 550, 123], s: 25 },
    { t: "Fahren. Weil das bei der Laufmaschine", b: [115, 120, 548, 156], s: 18 },
    { t: "nötige Ausschreiten nach vorne entfiel,", b: [112, 153, 550, 193], s: 27 },
    { t: "konnte die Sitzposition weiter nach vorn", b: [109, 187, 545, 226], s: 28 },
    { t: "(und höher) gelegt werden, womit die", b: [109, 220, 548, 262], s: 30 },
    { t: "Trittkräfte mehr von oben wirken und", b: [109, 254, 545, 292], s: 28 },
    { t: "das Vorderrad weniger eingelenkt wird.", b: [107, 286, 540, 328], s: 32 },
    { t: "Insbesondere konnten dadurch höhere", b: [104, 321, 545, 358], s: 25 },
    { t: "aus", b: [581, 71, 614, 89], s: 0 }, { t: "inn", b: [578, 100, 614, 120], s: 0 },
    { t: "Du", b: [581, 136, 614, 154], s: 0 }, { t: "per", b: [578, 172, 614, 195], s: 0 },
    { t: "ren", b: [578, 205, 614, 223], s: 0 }, { t: "kur", b: [575, 233, 614, 256], s: 0 },
    { t: "das", b: [575, 267, 614, 290], s: 0 }, { t: "inst", b: [573, 300, 614, 323], s: 0 },
  ];
  assert.strictEqual(screenText(lines, { frame: [617, 1716] }),
    "Das Pedalieren schräg nach vorne er-zeugt beim Hochrad Lenkkräfte und er-schwert dadurch das Balancieren beim Fahren. " +
    "Weil das bei der Laufmaschine nötige Ausschreiten nach vorne entfiel, konnte die Sitzposition weiter nach vorn (und höher) " +
    "gelegt werden, womit die Trittkräfte mehr von oben wirken und das Vorderrad weniger eingelenkt wird. Insbesondere konnten dadurch höhere");
  assert.match(screenText(lines), /randsee/, "without the piece's size nothing can be told");
});

test("a column of labels at the frame's edge stays", () => {
  /* A table framed tight on its left: the labels touch the edge, but what
     stands beside them is no running text. */
  const lines = [
    { t: "Energie", b: [0, 0, 120, 30] }, { t: "1649 kJ / 394 kcal", b: [300, 0, 560, 30] },
    { t: "Fett", b: [0, 40, 70, 70] }, { t: "0,4 g", b: [300, 40, 380, 70] },
    { t: "Zucker", b: [0, 80, 110, 110] }, { t: "94 g", b: [300, 80, 370, 110] },
    { t: "Salz", b: [0, 120, 70, 150] }, { t: "0,01 g", b: [300, 120, 390, 150] },
  ];
  assert.match(screenText(lines, { frame: [600, 160] }), /Energie[\s\S]*Fett[\s\S]*Zucker[\s\S]*Salz/);
});

test("a price beside a menu's dish at the frame's edge stays", () => {
  const lines = [
    { t: "Sopa de ajo con huevo escalfado y pan", b: [20, 0, 480, 30] }, { t: "4,50", b: [540, 0, 600, 30] },
    { t: "Ensalada mixta de la huerta con atún", b: [20, 40, 470, 70] }, { t: "5,00", b: [540, 40, 600, 70] },
    { t: "Calamares a la romana con limón y alioli", b: [20, 80, 490, 110] }, { t: "8,90", b: [540, 80, 600, 110] },
  ];
  assert.match(screenText(lines, { frame: [600, 120] }), /4,50[\s\S]*5,00[\s\S]*8,90/);
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

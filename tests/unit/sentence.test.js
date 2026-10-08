import test from "node:test";
import assert from "node:assert";
import { POINTER_SENTENCE_MAX, SENTENCE_MAX, selectionSpan, sentenceAfter, sentenceAround, sentenceSpan, sentenceUnder } from "../../src/sentence.js";

const cut = (text, word, at = text.indexOf(word)) => {
  const found = sentenceAround(text, word, at);
  if (found) assert.strictEqual(found.text.slice(found.start, found.end), word);
  return found?.text ?? null;
};

test("a word takes its whole sentence along, and no other", () => {
  const text = "Der Hafen lag still. Die Möwen kreisten über den leeren Kais, und niemand wusste Bescheid. Dann kam der Wind.";
  assert.strictEqual(cut(text, "Möwen"), "Die Möwen kreisten über den leeren Kais, und niemand wusste Bescheid.");
});

test("an abbreviation does not end a sentence, a line break does", () => {
  assert.strictEqual(cut("Man nehme z. B. einen Hammer und schlage zu. Dann war Ruhe.", "Hammer"),
    "Man nehme z. B. einen Hammer und schlage zu.");
  assert.strictEqual(cut("Einstellungen\nDer Hafen lag still im Nebel.", "Hafen"), "Der Hafen lag still im Nebel.");
});

test("a sentence longer than the most that goes along is cut around the word", () => {
  const words = Array.from({ length: 60 }, (_, i) => `w${i}`);
  const text = words.join(" ") + ".";
  const found = cut(text, "w40");
  const taken = found.split(" ");
  assert.strictEqual(taken.length, SENTENCE_MAX);
  assert.ok(taken.indexOf("w40") >= 8 && taken.indexOf("w40") <= 14, found);
  assert.strictEqual(cut(text, "w2").split(" ")[0], "w0", "near the start, from the start");
});

test("a word standing alone brings nothing along", () => {
  assert.strictEqual(sentenceAround("Einstellungen", "Einstellungen", 0), null);
  assert.strictEqual(sentenceAround("Speichern\nAbbrechen", "Speichern", 0), null);
});

test("a line that holds no other word than the one looked up is no sentence", () => {
  assert.strictEqual(sentenceAround("- diseminaban", "diseminaban", 2), null);
  assert.strictEqual(sentenceAround("Wörter:\n• «Fernweh» (2)\n• Heimweh", "Fernweh", 10), null);
  assert.strictEqual(sentenceAround("3. al cine …", "al cine", 3), null);
  assert.strictEqual(cut("Razona la respuesta.", "Razona"), "Razona la respuesta.");
  assert.strictEqual(cut("Nobody celebrated.", "celebrated"), "Nobody celebrated.");
  assert.strictEqual(cut("我喜欢猫。", "喜欢"), "我喜欢猫。");
});

test("the occurrence nearest to where the program said is the one meant", () => {
  const text = "La casa es grande. En la otra casa vive mucha gente.";
  const found = sentenceAround(text, "casa", text.lastIndexOf("casa"));
  assert.strictEqual(found.text, "En la otra casa vive mucha gente.");
  assert.strictEqual(found.start, found.text.indexOf("casa"));
});

test("several words are found as they were selected", () => {
  assert.strictEqual(cut("Ayer fuimos al cine y luego a cenar.", "al cine"), "Ayer fuimos al cine y luego a cenar.");
});

test("a word that is not in the text brings nothing along", () => {
  assert.strictEqual(sentenceAround("Der Hafen lag still.", "Möwe", 0), null);
});

test("Arabic and Cyrillic end their sentences by the same rule", () => {
  assert.strictEqual(cut("ذهب الولد إلى المدرسة. ثم عاد إلى البيت مع أخيه؟ نعم.", "البيت"), "ثم عاد إلى البيت مع أخيه؟");
  assert.strictEqual(cut("Он долго ждал. Поезд так и не пришёл! Ночь.", "Поезд"), "Поезд так и не пришёл!");
});

test("a sentence too long to go whole is cut at its clauses, not in one", () => {
  const clause = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}${i}`).join(" ");
  const text = `${clause(12, "a")}; ${clause(12, "b")}; ${clause(12, "c")}: ${clause(12, "d")}.`;
  const found = cut(text, "b5");
  assert.strictEqual(found, `${clause(12, "b")}; ${clause(12, "c")}:`, "the next clause first");
  assert.strictEqual(cut(text, "d5"), `${clause(12, "c")}: ${clause(12, "d")}.`);
});

test("a dash standing alone ends a clause", () => {
  const text = `${Array.from({ length: 25 }, (_, i) => `a${i}`).join(" ")} — ${Array.from({ length: 25 }, (_, i) => `b${i}`).join(" ")}.`;
  assert.strictEqual(cut(text, "b3").split(" ")[0], "b0");
});

test("the sentence under the pointer is the whole sentence, up to its own bound", () => {
  const text = "Vorher. " + Array.from({ length: 45 }, (_, i) => `W${i}`).join(" ") + ", und das war alles. Danach.";
  const at = text.indexOf("W20");
  const span = sentenceSpan(text, at, 3, POINTER_SENTENCE_MAX);
  assert.strictEqual(text.slice(span.start, span.end).split(" ").length, 49);
  assert.ok(text.slice(span.start, span.end).startsWith("W0 "));
  assert.ok(text.slice(span.start, span.end).endsWith("alles."));
});

test("the sentence under the pointer says where it stands in the text around the word", () => {
  const around = { text: "Der Hafen lag still. Die Möwen kreisten, und niemand wusste Bescheid. Dann kam Wind.", at: 25 };
  const found = sentenceUnder(around, 5);
  assert.strictEqual(found.text, "Die Möwen kreisten, und niemand wusste Bescheid.");
  assert.strictEqual(around.text.slice(found.start, found.end), found.text);
  assert.strictEqual(sentenceUnder(null, 3), null);
});

test("a line broken inside a word ends nothing, and the word is joined with its hyphen", () => {
  const text = "Wer dann mit dem Fahr-\nrad zur Arbeit fährt, muss warten. Danach.";
  const found = sentenceAround(text, "zur", text.indexOf("zur"));
  assert.strictEqual(found.text, "Wer dann mit dem Fahr-rad zur Arbeit fährt, muss warten.");
  assert.strictEqual(found.text.slice(found.start, found.end), "zur");
  const under = sentenceUnder({ text, at: text.indexOf("Arbeit") }, 6);
  assert.strictEqual(under.text, "Wer dann mit dem Fahr-rad zur Arbeit fährt, muss warten.");
  assert.strictEqual(under.start, 0);
  assert.strictEqual(under.end, text.indexOf(" Danach"), "its place is where it stands in the text read");
  assert.strictEqual(cut("Nord- und Südkorea\nDie Grenze ist dicht.", "Grenze"), "Die Grenze ist dicht.",
    "a hyphen before a space is no broken word");
});

test("a reference after the stop belongs to the sentence it ends", () => {
  const next = "Seit Jahren verspricht der Rat einen Weg.";
  assert.strictEqual(cut(`Wer radelt, muss die Brücke nehmen.[3] ${next}`, "Brücke"), "Wer radelt, muss die Brücke nehmen.[3]");
  assert.strictEqual(cut(`Wer radelt, muss die Brücke nehmen.[3][14] ${next}`, "Rat"), next);
  assert.strictEqual(cut(`Wer radelt, muss die Brücke nehmen.⁴ ${next}`, "Brücke"), "Wer radelt, muss die Brücke nehmen.⁴");
  assert.strictEqual(cut(`It would not withstand the courts.4 Critics replied at once.`, "courts"),
    "It would not withstand the courts.4", "a footnote number printed on the line");
  assert.strictEqual(cut(`Das Werk kostete 3.5 Millionen und wurde 2003. Danach kam nichts.`, "Millionen"),
    "Das Werk kostete 3.5 Millionen und wurde 2003.");
  assert.strictEqual(cut(`Eine Studie [12] zeigt das Gegenteil. Danach.`, "Studie"), "Eine Studie [12] zeigt das Gegenteil.");
});

test("a closing quotation mark of any kind is passed over", () => {
  assert.strictEqual(cut("Er rief: „Komm sofort.“ Dann ging er.", "Komm"), "Er rief: „Komm sofort.“");
  assert.strictEqual(cut("Il dit : « Viens vite. » Puis il partit.", "Viens"), "Il dit : « Viens vite. »");
});

test("a stop before a word in small letters ends nothing", () => {
  assert.strictEqual(cut("Man nimmt Mehl bzw. etwas Grieß und rührt. Dann ruht es.", "Grieß"),
    "Man nimmt Mehl bzw. etwas Grieß und rührt.");
  assert.strictEqual(cut("Some fruit, e.g. apples, keeps well. Other fruit does not.", "apples"),
    "Some fruit, e.g. apples, keeps well.");
  assert.strictEqual(cut("Und dann … kam er doch noch. Spät.", "kam"), "Und dann … kam er doch noch.");
});

test("a reference ends the sentence even where the page gives no space after it", () => {
  const text = "Vorher. Die Wiesen werden zu einem See verwandelt.[12]Danach folgt ein anderer Satz.";
  assert.strictEqual(cut(text, "Wiesen"), "Die Wiesen werden zu einem See verwandelt.[12]");
  assert.strictEqual(cut(text, "folgt"), "Danach folgt ein anderer Satz.");
  assert.strictEqual(cut(text, "Danach"), "Danach folgt ein anderer Satz.");
});

test("a Chinese sentence ends at its full stop with no space after it", () => {
  const text = "尽管经济形势严峻，政府仍然决定提高最低工资。这项政策引起了广泛的讨论。";
  const span = sentenceAround(text, "政策", text.indexOf("政策"));
  assert.strictEqual(span.text, "这项政策引起了广泛的讨论。");
  assert.strictEqual(span.text.slice(span.start, span.end), "政策");
});

test("a long Chinese sentence is cut to a window of words, not left whole", () => {
  const text = "研究人员发现长期睡眠不足不仅会削弱免疫系统还可能增加患心血管疾病的风险而且会影响记忆力和注意力并导致情绪波动以及工作效率下降甚至引发其他慢性疾病";
  const span = sentenceSpan(text, text.indexOf("免疫"), 2, 10);
  const cut = text.slice(span.start, span.end);
  assert.ok(cut.includes("免疫系统"));
  assert.ok(cut.length < text.length / 2, cut);
});

test("a unit the shell took out of the text keeps its place and is dropped from the sentence", () => {
  const text = "Antes. Hay un parámetro nuevo, rho (⁠ρ⁠⁠). La de la izquierda tiene el mínimo en ⁠x=1⁠⁠ y la otra no.";
  assert.strictEqual(cut(text, "parámetro"), "Hay un parámetro nuevo, rho (ρ).");
  assert.strictEqual(cut(text, "otra"), "La de la izquierda tiene el mínimo en x=1 y la otra no.");
  const at = text.indexOf("otra");
  const under = sentenceUnder({ text, at }, 4);
  assert.strictEqual(under.text, "La de la izquierda tiene el mínimo en x=1 y la otra no.");
  assert.strictEqual(text.slice(under.start, under.end).replaceAll("⁠", ""), under.text);
});

test("the sentence after one is the next whole one, one at a time", () => {
  const text = "Der Hafen lag still. Die Möwen kreisten über den Kais.[3] Dann kam der Wind.";
  const around = { text, at: 4, cut: false };
  const first = sentenceUnder(around, 5);
  const second = sentenceAfter(around, first.end);
  assert.strictEqual(second.text, "Die Möwen kreisten über den Kais.[3]");
  assert.strictEqual(text.slice(second.start, second.end), second.text);
  const third = sentenceAfter(around, second.end);
  assert.strictEqual(third.text, "Dann kam der Wind.");
  assert.strictEqual(sentenceAfter(around, third.end), null);
});

test("a sentence running into the end of a text cut short is none", () => {
  const text = "Der Hafen lag still. Die Möwen kreisten über den lee";
  assert.strictEqual(sentenceAfter({ text, at: 4, cut: true }, 20), null);
  assert.strictEqual(sentenceAfter({ text, at: 4 }, 20), null, "not said to be whole is cut");
  assert.strictEqual(sentenceAfter({ text, at: 4, cut: false }, 20).text, "Die Möwen kreisten über den lee");
  const more = `${text}ren Kais. Dann kam der Wi`;
  assert.strictEqual(sentenceAfter({ text: more, at: 4, cut: true }, 20).text, "Die Möwen kreisten über den leeren Kais.");
});

test("a line without a letter is passed over, and a broken word joined", () => {
  const text = "Der Hafen lag still.\n3.\n———\nDas Fahr-\nrad stand am Kai.\n";
  const next = sentenceAfter({ text, at: 0, cut: false }, 20);
  assert.strictEqual(next.text, "Das Fahr-rad stand am Kai.");
  assert.strictEqual(text.slice(next.start, next.end), "Das Fahr-\nrad stand am Kai.");
  assert.strictEqual(sentenceAfter({ text: "Eins. 2. 3.", at: 0, cut: false }, 5), null);
});

test("a selection is found in the text around it, as far as its sentence ends", () => {
  const text = "Der Hafen lag still. Die Möwen kreisten über den Kais. Dann kam der Wind.";
  const whole = "Die Möwen kreisten über den Kais.";
  assert.deepStrictEqual(selectionSpan({ text, at: 21 }, whole), { text: whole, start: 21, end: 54 });
  assert.deepStrictEqual(selectionSpan({ text, at: 19 }, ` ${whole} `), { text: whole, start: 21, end: 54 }, "found near where it was said to stand");
  const part = "Die Möwen kreisten";
  assert.strictEqual(selectionSpan({ text, at: 21 }, part).end, 54, "ending inside a sentence, the next one starts after it");
  assert.strictEqual(sentenceAfter({ text, at: 21, cut: false }, 54).text, "Dann kam der Wind.");
  assert.strictEqual(selectionSpan({ text, at: 21 }, "Die Möwen flogen über"), null);
  /* A PDF's selection breaks its lines where the page's text has spaces. */
  const broken = selectionSpan({ text, at: 21 }, "Die Möwen kreisten\nüber den Kais.");
  assert.deepStrictEqual([broken.start, broken.end], [21, 54]);
  assert.strictEqual(sentenceAfter({ text, at: 21, cut: false }, broken.end).text, "Dann kam der Wind.");
  assert.strictEqual(selectionSpan(null, whole), null);
});

test("a stop that shortens a word ends no sentence, told by its shape and never by a list", () => {
  const whole = (text, word) => sentenceAround(text, word, text.indexOf(word))?.text;
  assert.strictEqual(whole("Gestern kam Dr. Meier in Berlin an. Dann ging er.", "Meier"), "Gestern kam Dr. Meier in Berlin an.");
  assert.strictEqual(whole("Yesterday Mr. Smith arrived in St. Louis. Then he left.", "Smith"), "Yesterday Mr. Smith arrived in St. Louis.");
  assert.strictEqual(whole("Am 3. Oktober feiert das Land. Danach ist Ruhe.", "Oktober"), "Am 3. Oktober feiert das Land.");
  assert.strictEqual(whole("Der 1. FC Köln gewann 3:2. Danach wurde gefeiert.", "gewann"), "Der 1. FC Köln gewann 3:2.");
  assert.strictEqual(whole("See Fig. 3 for details. The results follow.", "details"), "See Fig. 3 for details.");
  assert.strictEqual(whole("Smith et al. (2020) showed this. Others agreed.", "showed"), "Smith et al. (2020) showed this.");
  assert.strictEqual(whole("Es kostet ca. 5 Euro, d.h. nichts. Kauf es.", "Euro"), "Es kostet ca. 5 Euro, d.h. nichts.");
  /* A name said by its letters, a year and a long word end one as ever. */
  assert.strictEqual(whole("Er arbeitet bei der SPD. Danach ging er.", "arbeitet"), "Er arbeitet bei der SPD.");
  assert.strictEqual(whole("Er wurde 1990 geboren, im Jahr 1990. Dann zog er um.", "geboren"), "Er wurde 1990 geboren, im Jahr 1990.");
  assert.strictEqual(whole("Das war der Anfang. 20 Leute blieben.", "Anfang"), "Das war der Anfang.");
  assert.strictEqual(whole("Was nun? Dr. Meier wusste es! Sagte er.", "wusste"), "Dr. Meier wusste es!");
});

test("a sentence too long for one step ends its first part at a comma", () => {
  const clause = (n, word) => Array.from({ length: n }, (_, i) => `${word}${i}`).join(" ");
  const text = `Kurz davor. ${clause(25, "a")}, ${clause(25, "b")}, ${clause(30, "c")}. Danach war Ruhe.`;
  const around = { text, at: 0, cut: false };
  const first = sentenceAfter(around, 11);
  assert.ok(first.text.startsWith("a0 ") && first.text.endsWith("b24,"), first.text.slice(-20));
  const second = sentenceAfter(around, first.end);
  assert.ok(second.text.startsWith("c0 ") && second.text.endsWith("c29."), second.text);
  assert.strictEqual(sentenceAfter(around, second.end).text, "Danach war Ruhe.");
});

test("a word a PDF broke with a space after its hyphen is joined, a suspended hyphen is not", () => {
  const whole = (text, word) => sentenceAround(text, word, text.indexOf(word))?.text;
  assert.strictEqual(whole("It obtains new state-of-the-art re- sults on eleven tasks.", "eleven"), "It obtains new state-of-the-art re-sults on eleven tasks.");
  assert.strictEqual(whole("Die Vor- und Nachteile der Regel sind bekannt.", "Regel"), "Die Vor- und Nachteile der Regel sind bekannt.");
  assert.strictEqual(whole("The pre- and post-war years were hard.", "years"), "The pre- and post-war years were hard.");
  /* The word looked up keeps its place in the joined sentence. */
  const found = sentenceAround("It obtains re- sults on eleven tasks.", "eleven", 21);
  assert.strictEqual(found.text.slice(found.start, found.end), "eleven");
  assert.strictEqual(sentenceUnder({ text: "BERT is designed to pre- train deep models. Next.", at: 0 }, 4).text, "BERT is designed to pre-train deep models.");
});

test("a paragraph's end is one however the program writes it", () => {
  const text = "Einleitung\rDer Hafen lag still im Nebel. Dann kam der Wind.\r3.\rSchluss mit lustig.\vUnd weiter.";
  assert.strictEqual(sentenceAround(text, "Hafen", text.indexOf("Hafen")).text, "Der Hafen lag still im Nebel.");
  const around = { text, at: 0, cut: false };
  const steps = [];
  for (let next = sentenceAfter(around, text.indexOf("Dann") - 1); next; next = sentenceAfter(around, next.end)) steps.push(next.text);
  assert.deepStrictEqual(steps, ["Dann kam der Wind.", "Schluss mit lustig.", "Und weiter."]);
});

test("a quotation mark after a stop and a space opens the next sentence", () => {
  const text = 'Nobody had. "Are you sure?" he asked. Then he left.';
  assert.strictEqual(sentenceAround(text, "Nobody", 0).text, "Nobody had.");
  assert.strictEqual(sentenceAround(text, "sure", 16).text, '"Are you sure?" he asked.');
  assert.strictEqual(sentenceAround("Er nickte. „Ja, gern“, sagte er.", "nickte", 3).text, "Er nickte.");
});

test("a list's mark in front of a line stays behind", () => {
  const list = "Orden del día:\n• Aprobación del acta anterior\n- Ruegos y preguntas";
  assert.strictEqual(sentenceAround(list, "acta", 20).text, "Aprobación del acta anterior");
  assert.strictEqual(sentenceUnder({ text: list, at: list.indexOf("Ruegos") }, 6).text, "Ruegos y preguntas");
  assert.strictEqual(sentenceAfter({ text: list, cut: false }, list.indexOf("\n")).text, "Aprobación del acta anterior");
  /* A dash inside a sentence is the sentence's own. */
  assert.strictEqual(sentenceAround("Er kam – wie immer – zu spät.", "immer", 10).text, "Er kam – wie immer – zu spät.");
});

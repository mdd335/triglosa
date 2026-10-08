import test from "node:test";
import assert from "node:assert/strict";
import { createSpeech } from "../../src/platform/speech.js";

/* A synthesiser as a web view offers one: a voice list that may come back
   empty for a moment, an event when it changes, and utterances that end. */
function synth(voices) {
  const spoken = [];
  const fake = {
    list: voices,
    getVoices: () => fake.list,
    onvoiceschanged: null,
    speaking: false,
    cancelled: 0,
    speak(utterance) {
      spoken.push(utterance);
      fake.speaking = true;
      queueMicrotask(() => { fake.speaking = false; utterance.onend?.(); });
    },
    cancel() { fake.cancelled++; fake.speaking = false; },
  };
  return { fake, spoken };
}
class Utterance { constructor(text) { this.text = text; } }
const voice = (lang, name, extra = {}) => ({ lang, name, localService: true, default: false, ...extra });

test("a language is spoken with a voice of its own, on this device only", () => {
  const { fake } = synth([
    voice("es-ES", "Mónica"),
    voice("de-DE", "Anna", { default: true }),
    voice("fr-FR", "Online (Natural)", { localService: false }),
    voice("ru_RU", "Milena"),
  ]);
  const speech = createSpeech(fake, Utterance);
  assert.equal(speech.canSpeak("es"), true);
  assert.equal(speech.canSpeak("ru"), true, "an underscore in the tag is a tag all the same");
  assert.equal(speech.canSpeak("fr"), false, "a voice that sends the text away is not used");
  assert.equal(speech.canSpeak("it"), false);
  assert.equal(speech.canSpeak(""), false);
});

test("the system's own voice for a language comes before the others", () => {
  const { fake, spoken } = synth([voice("en-US", "Fred"), voice("en-GB", "Daniel", { default: true })]);
  createSpeech(fake, Utterance).speak("hello", "en");
  assert.equal(spoken[0].voice.name, "Daniel");
  assert.equal(spoken[0].lang, "en-GB");
});

test("a voice list that comes back empty for a moment is not taken for no voices", () => {
  const { fake } = synth([voice("es-ES", "Mónica")]);
  const speech = createSpeech(fake, Utterance);
  assert.equal(speech.canSpeak("es"), true);
  fake.list = [];
  fake.onvoiceschanged();
  assert.equal(speech.canSpeak("es"), true);
});

test("voices that arrive later are announced", () => {
  const { fake } = synth([]);
  let heard = 0;
  const speech = createSpeech(fake, Utterance, () => heard++);
  assert.equal(speech.canSpeak("es"), false);
  fake.list = [voice("es-ES", "Mónica")];
  fake.onvoiceschanged();
  assert.equal(speech.canSpeak("es"), true);
  assert.equal(heard, 1);
});

test("speaking again stops what is being said first, and a second press on the same stops it", async () => {
  const { fake, spoken } = synth([voice("es-ES", "Mónica")]);
  const speech = createSpeech(fake, Utterance);
  const first = speech.speak("uno", "es");
  assert.equal(fake.cancelled, 1);
  await first;
  speech.speak("dos", "es");
  fake.speaking = true;
  speech.speak("dos", "es");
  assert.equal(spoken.length, 2, "the same word pressed while it is spoken is stopped, not said twice");
  assert.equal(fake.cancelled, 3);
});

test("without a synthesiser nothing can be spoken and nothing breaks", () => {
  const speech = createSpeech(undefined, undefined);
  assert.equal(speech.canSpeak("es"), false);
  return speech.speak("hola", "es");
});

test("a window drawn once can wait for the voices, but not for ever", async () => {
  const { fake } = synth([]);
  const speech = createSpeech(fake, Utterance);
  const waited = speech.ready(1000);
  fake.list = [voice("es-ES", "Mónica")];
  fake.onvoiceschanged();
  await waited;
  assert.equal(speech.canSpeak("es"), true);
  const none = createSpeech(synth([]).fake, Utterance);
  const started = Date.now();
  await none.ready(30);
  assert.ok(Date.now() - started < 500);
});

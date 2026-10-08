/* Saying a word aloud, with a voice the system already has.

   The web view's own speech synthesis: on the Mac Apple's voices, on
   Windows the ones installed with a language. Nothing to download and no
   helper — and nothing leaves the machine, because only voices that run on
   it are used. Windows also lists voices that send the text to a server;
   those are left out, the way the app sends a text only where the reader
   chose to.

   Where a language has no voice, there is no button: a button that says
   nothing is worse than none. */

/* "es-ES", "es_ES" and "es" are all Spanish. */
const baseOf = (tag) => String(tag || "").toLowerCase().split(/[-_]/)[0];

export function createSpeech(synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance, onVoices = () => {}) {
  /* The last list that had voices in it. A web view hands back an empty list
     for a moment while it reloads its voices — measured in WKWebView, twice
     in a row — and taking that for the truth would take every button away
     and put it back again. */
  let voices = [];
  const load = () => {
    const found = (synth?.getVoices?.() || []).filter((voice) => voice.localService !== false);
    if (!found.length) return false;
    voices = found;
    return true;
  };
  load();
  const waiting = [];
  if (synth) {
    synth.onvoiceschanged = () => {
      if (!load()) return;
      onVoices();
      for (const done of waiting.splice(0)) done();
    };
  }

  /* The system's own voice for the language first, then any other. */
  const voiceFor = (code) => {
    const base = baseOf(code);
    if (!base) return null;
    const fitting = voices.filter((voice) => baseOf(voice.lang) === base);
    return fitting.find((voice) => voice.default) || fitting[0] || null;
  };

  let current = null;
  return {
    /* Answers once the voices are known, or after `most` ms without them — a
       window drawn once, like the card's, waits for this rather than
       drawing without the button and never again. */
    ready(most = 1000) {
      if (voices.length || !synth) return Promise.resolve();
      return new Promise((done) => {
        waiting.push(done);
        setTimeout(done, most);
      });
    },
    canSpeak: (code) => !!(Utterance && voiceFor(code)),
    /* A second press on what is being said stops it; anything else is said
       in its place. Answers once it has been said, or stopped. */
    speak(text, code) {
      const voice = voiceFor(code);
      if (!voice || !Utterance || !text) return Promise.resolve();
      const again = current && current.text === text && current.code === code && synth.speaking;
      synth.cancel();
      if (again) {
        current = null;
        return Promise.resolve();
      }
      const utterance = new Utterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      current = { text, code };
      return new Promise((done) => {
        utterance.onend = done;
        utterance.onerror = done;
        synth.speak(utterance);
      });
    },
  };
}

/* The language identifier in the shell: which languages a text is likeliest
   in, worked out on this machine (src-tauri/src/identify.rs).

   `invoke` is handed in, so that this file is the same in the app and in a
   test. */

/* A text says what it is in long before this many characters. */
const SAMPLE = 2000;

export function createIdentifier(invoke) {
  return {
    /* [code, share] pairs, likeliest first. Empty where the model's file is
       not on this machine or the text holds nothing it knows: whoever comes
       next is asked. Read line by line, a text is one line to the model. */
    identify: (text) => invoke("identify_language", { text: String(text || "").slice(0, SAMPLE).replace(/\s+/g, " ").trim() })
      .then((top) => (Array.isArray(top) ? top : []), () => []),
  };
}

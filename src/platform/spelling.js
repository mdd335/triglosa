/* The system's own spelling checker in the shell (src-tauri/src/spelling.rs):
   what each language's dictionaries say about each word.

   `invoke` is handed in, so that this file is the same in the app and in a
   test. A failure is "nothing known", which src/spelling.js reads as no
   reason to ask anything. */

export function createSpeller(invoke) {
  const check = (words, languages, { full = false } = {}) => invoke("check_spelling", { words, languages, full })
    .then((answer) => (answer && typeof answer === "object" ? answer : {}), () => ({}));
  let warmed = "";
  return {
    /* word → language → { there, known, correction, guesses }; the last two
       only with `full`, which costs the Mac about 60 ms a language. */
    check,
    /* A language's dictionaries load the first time they are asked, which
       took the Mac 0.4 to 1.7 s; asked when the window appears, the first
       word looked up does not pay for it. Once per set of languages. */
    warm(languages) {
      const key = (languages || []).join(",");
      if (!key || key === warmed) return;
      warmed = key;
      check(["a"], languages);
    },
  };
}

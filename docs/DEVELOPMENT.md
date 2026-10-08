# Developing Triglosa

What you need to know before changing the app. The files explain the details
in their own comments; this page says where things are and how they fit.

## Stack

Tauri 2 with Vite and plain JavaScript — no TypeScript, no framework. A Rust
shell holds the global shortcut, the menu bar or tray symbol, the key store,
the text capture, the connection to the AI model and the updater. On the Mac
a small Swift helper talks to Apple's on-device translation over HTTP on
`127.0.0.1:51737`. Two small models come with the app, one naming a text's
language and one matching words to their translations. Everything else the
app knows about language comes from an OpenAI-compatible model endpoint the
reader configures.

## What you need

- **Node 24.2 or newer** (`package.json` says so, and npm refuses an older one).
- **Rust** (stable) with `rustfmt`.
- **Mac:** macOS 26 or newer and Xcode's command line tools, which bring
  Swift. For the Intel build as well: `rustup target add x86_64-apple-darwin`.
- **Windows:** Visual Studio's C++ build tools. There is no Swift helper and no
  signing step.
- **Google Chrome**, only for `scripts/shot.mjs`.
- **cargo-audit** (`cargo install cargo-audit`), only for `npm run security`.

## Commands

```bash
npm install
npm run sidecar               # Mac: build the Swift helper (once, and after changing it)
npm run app                   # the window with live reload (does not rebuild the helper)
npm run dev                   # the page alone in the dev server, for shot.mjs
npm test                      # unit tests, a few seconds, no external services
npm run lint                  # ESLint's recommended rules (eslint.config.js)
npm run check                 # links, rustfmt, ESLint, this page's completeness, every model question listed
npm run security              # known vulnerabilities in the npm and Rust dependencies (needs cargo-audit)
cd src-tauri && cargo test    # the shell's own tests
npm run bundle                # Mac: the signed Triglosa.app for this Mac's processor
npm run bundle:intel          # Mac: the same for Intel, under target/x86_64-apple-darwin/
npm run release               # Mac: helpers, signed apps and a DMG each for Apple silicon and Intel
node scripts/shot.mjs out.png "some text"   # photograph the window's page (needs npm run dev)
```

`npm run check` (`scripts/check.mjs`) is meant as the pre-commit hook:
`git config core.hooksPath scripts/hooks`.

On Windows, `node scripts/aligner-fetch.mjs` and then
`npx tauri build --bundles nsis` build the installer.
`.github/workflows/windows.yml` does the same on a clean runner, runs both
test suites and keeps the installer as an artifact. `scripts/windows/` builds
and drives the app in a Windows virtual machine over SSH from a Mac.

**On the Mac, always build with `npm run bundle`, never `tauri build` alone.**
macOS binds the Accessibility permission to the app's signature, and
`scripts/sign.mjs` pins it to the identifier so it survives the next build.
The language download prompt and the helper's own window only exist in a
built app.

## How a reading goes

[behind-a-translation.md](behind-a-translation.md) draws all of it: every
question the model is asked, and who answers where it cannot. A new prompt
gets its row and its box there, and `npm run check` says so where one is
missing.

1. The global shortcut or the text field hands a text to `run.js`.
2. `detect.js` names its language — the function words first, then the
   language identifier, then Apple's recognizer on the Mac, then the model.
3. The panels are translated: by the model or by Apple's engine, whichever
   the reader put first, the other stepping in where the first cannot.
4. Beside that, `ask.js` asks the model for the difficult terms and the verb
   forms. Where each one stands in every panel is the word aligner's answer
   for a single word, and the model's for anything longer.
5. `run.js` keeps one state object and announces every change; `ui/` draws
   whatever is there. A click on a word asks about that word alone.

Three lines run through all of it:

- **`run.js` decides, `ask.js` sends, `ui/` draws.** None reaches into another.
- **Everything that leaves the process goes through `platform/`** and takes its
  own `fetch`, so the same code runs in the app, in a browser and in tests.
  `platform/env.js` is the only file that knows which.
- **A failure is classified where it happens and worded where the language
  is.** `platform/` throws a fault `{ kind, status, detail }` (`faults.js`);
  only `ui/labels.js` turns it into a sentence.

## Layout

```
index.html, settings.html, card.html   the three windows' pages
src/
  run.js          one reading, start to finish — decides, draws nothing
  ask.js          every question the model is asked — sends, decides nothing
  detect.js       which language a text is in
  panels.js       which language stands in which panel
  highlights.js   which fragments are marked in which panel
  glance.js       what a word became in the reader's translation, for the hover
  examples.js     the example sentences under a row: joined, never replaced
  vocabulary.js   which entries are worth showing at all
  card.js         a flashcard's three fields, and which goes where
  history.js      whether a text has been read already
  sentence.js     the sentence a looked-up word stands in
  settings.js     everything the reader can decide, normalised
  hotkey.js       recording a key combination
  faults.js       what went wrong, as { kind, status, detail } without words
  strings.js      the few words parsers read back, per first language
  text.js         string primitives shared by parsing, matching and drawing
  system.js       which system the page runs on
  updates.js      the project's addresses, and whether a newer version exists
  diagnostics.js  the text a reader copies into a problem report
  languages/      one pack per language, behind a registry (index.js says what a pack may carry)
  prompts/        the prompt texts
  parse/          reading the model's answers back
  match/          finding a fragment's place in a text
  platform/       everything that leaves the process:
    llm.js          the model: one endpoint, retries, the reasoning ladder
    model-fetch.js  its requests, through the shell's kept connection
    aligner.js      the word aligner in the shell, for the hover and the marks
    identifier.js   the language identifier in the shell
    translation.js  Apple's translation through the helper (absent on Windows)
    capture.js      text from other programs, and back into them
    shortcut.js     the global shortcuts
    windows.js      the app's own windows and its menu bar or tray entry
    store.js        the settings file
    keychain.js     the API key, in the keychain or Credential Manager
    anki.js         Anki, over AnkiConnect
    search.js       a word looked up on the web
    speech.js       a word said aloud with the system's voices
    update.js       installing a newer version
    env.js          the one place that knows it runs inside the app
  ui/             the three windows:
    app.js          the reading window, wired
    reading-view.js drawing one reading
    marking.js      a panel's text with its marks
    selection.js    picking a word out of a panel
    glance-view.js  the hover
    language-choice.js  correcting the source text's language
    settings-view.js, settings-window.js   the settings
    card-view.js, card-window.js           the flashcard
    elements.js, icons.js, preview.js      small shared pieces
    labels.js       the interface, one file per language under labels/
    style.css
src-tauri/
  src/            the Rust shell: lib.rs (commands, tray, windows), capture.rs,
                  overlay.rs (window placement), highlight.rs (what a
                  force click read, lit up), model.rs, align.rs (which word
                  became which, by a small model on this machine) with
                  pieces.rs (the pieces a word is cut into for it),
                  identify.rs (which language a text is in, by a small
                  model on this machine),
                  keychain.rs, keyboard.rs, update.rs, diagnostics.rs, main.rs
  sidecar/        translator.swift, the Mac's translation helper
  capabilities/   what each window may reach — every window label must be listed
  resources/      the models the app carries: identifier/ (the language
                  identifier's, made by scripts/identifier-pack.py) and
                  aligner/ (the word aligner's, not in the repository:
                  fetched for a build by scripts/aligner-fetch.mjs, made
                  by scripts/aligner-pack.py)
scripts/          build, sign, pack, check; windows/ drives the virtual machine
tests/unit/       the tests; the ui tests draw into a jsdom document
tests/fixtures/   data the tests read: untidy.json is text as programs really
                  give it (a list's line, a label), for the sentence a
                  looked-up word takes along
```

## Rules

- **English** in code, comments and commit messages. Comments say what the
  code does and why, not what it used to do.
- **Nothing language-specific outside a language pack.** No word list, no
  language name, no assumption about one language in a general path. Where a
  pack knows nothing, the generic path applies and shows one row too few
  rather than a wrong one.
- **The prompts are the product.** No prompt carries an example, and none
  names a language except out of a pack — examples leak their language into
  the answers. Changing a prompt, or how an answer is read back, is a
  behaviour change: try it on texts in several languages, for readers of
  several first languages, at a low and a high level, with a cloud and a
  small local model. `tests/unit/prompts.test.js` pins what each prompt must
  say; it cannot say whether the answers got better.
- **Every error message has one shape**, in every interface language: two
  sentences — what happened, as short as it goes, then what to do, starting
  with "Please" (the informal imperative in the Romance languages and
  Russian) and naming where to go. Technical detail in one bracket right after
  the fact: "The API key was rejected (401). Please check it in the
  settings." The same word for the same thing everywhere: *AI model*, *API
  key*, *settings*, *language pack*.
- **Two systems, one code base.** Platform code behind the seams above and
  behind `cfg` in the shell, paths out of the source. Wording that differs
  lives in each label file's `windows` table, laid over the Mac's.
- **Tests stay green**: `npm test`, and `cargo test` when the shell changes.
  A change to what a window draws belongs in `tests/unit/reading-view.test.js`
  or its neighbours. Look at it as well: `scripts/shot.mjs` photographs the
  page, and `TRIGLOSA_HOVER` puts the pointer on something.
- **No new dependency** without a good reason.

## Common changes

- **A text in the interface**: add the key to `src/ui/labels/en.js` and to
  every other file there. `tests/unit/labels.test.js` fails until all seven
  have it.
- **A setting**: its default and its reading-back in `src/settings.js`
  (`DEFAULTS`, `normalizeSettings` — an unknown or old value must come back
  as something valid), its field in `ui/settings-view.js`, a test in
  `tests/unit/settings.test.js`.
- **A language the app reads**: a pack in `src/languages/`, registered in
  `index.js`, which documents every field a pack may carry. The generic
  prompts need nothing else.
- **A first language** (an interface language): a label file in
  `src/ui/labels/`, imported in `ui/labels.js`, an entry in `src/strings.js`,
  and its code in `FIRST_LANGUAGES` in `src/settings.js`.
- **A window**: its page as a Vite entry in `vite.config.js`, its label in
  `src-tauri/capabilities/default.json`, and a command that builds it in the
  shell — `async`, or it deadlocks on Windows.
- **A route of the Swift helper that answers differently**: raise `PROTOCOL`
  in `translator.swift` and in `src/platform/translation.js` together.

## The models the app carries

Which word of a text became which word of a translation is worked out on the
reader's machine by a small model, OmniAlign, read through ONNX Runtime
(`src-tauri/src/align.rs`). Which language a text is in is first asked of
fastText's language identification model, shrunk to 12 MB and read by the
shell's own code (`src-tauri/src/identify.rs`); it is distributed under the
Creative Commons Attribution-Share-Alike License 3.0, and so is the shrunk
file, with its notice beside it; it is in the repository
(`src-tauri/resources/identifier/`). The aligner's files are too large for
that, so they are attachments of the release `aligner-1`, and `npm run app`,
`npm run bundle` and the Windows workflow fetch them first
(`scripts/aligner-fetch.mjs`, by checksum, once). That release must never be
marked as the latest: the update check reads the latest release.

## Releases

Made by the maintainer, after `npm run security` finds nothing to fix. `npm run release` builds and signs both Mac apps and
packs their DMGs (`scripts/dmg.mjs`, after signing — Tauri's own DMG is packed
before it); the Windows installer comes from the workflow. Then
`node scripts/updater.mjs --windows=<installer>` packs the Mac apps for the
updater, signs every update file with the updater's private key and writes
`latest.json`. All of them go up with the GitHub release, or no installed
app can update itself. The updater's public key is in
`src-tauri/tauri.conf.json`; the private key never enters the repository.

## Traps

- The helper outlives the app and keeps its port; see `PROTOCOL` above.
- It is a WKWebView on the Mac, not Chromium: `-webkit-app-region` and
  `field-sizing: content` do nothing. Dragging needs `data-tauri-drag-region`
  and `core:window:allow-start-dragging`.
- Subprocesses started from the Finder have no `LANG`; say the encoding, or
  `pbpaste` answers in Mac Roman.
- AnkiConnect refuses Tauri's `Origin` header, so Anki is reached through the
  shell (`anki_request`), not through `fetch`.
- Windows keeps a background program from taking the foreground, and a
  focused window is not a focused page: `overlay::bring_to_front` does both.
- A process started from an SSH session or a scheduled task has no logon
  session, and the Credential Manager refuses every key in it. Start the app
  through `explorer.exe` when testing remotely.
- A web view's voice list comes back empty for a moment while it reloads;
  `platform/speech.js` keeps the last full one.
- The app has no dock icon by default and therefore no menu bar of its own:
  Escape and ⌘W exist only because the pages listen for them.

## Contributing

Issues are welcome. The public repository receives one commit per release,
so a pull request is taken over by hand rather than merged.

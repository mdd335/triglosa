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
npm run ios                   # iPhone: build, sign with your own team, install on the connected phone (scripts/ios.mjs)
node scripts/shot.mjs out.png "some text"   # photograph the window's page (needs npm run dev)
```

`npm run check` (`scripts/check.mjs`) is meant as the pre-commit hook:
`git config core.hooksPath scripts/hooks`. In a cloud sandbox,
`scripts/cloud-setup.sh` installs the dependencies and sets the hook.

On Windows, `node scripts/aligner-fetch.mjs` and then
`npx tauri build --bundles nsis` build the installer.
`.github/workflows/windows.yml` does the same on a clean runner, runs both
test suites and keeps the installer as an artifact, with the package for the
Microsoft Store that `scripts/windows/store-package.ps1` makes of the same
program. `scripts/windows/store-try.sh` signs one with a test certificate and
installs it in the machine. `scripts/windows/` builds
and drives the app in a Windows virtual machine over SSH from a Mac.
`scripts/mac-vm/` does the same in a macOS one made with Tart: `driver.sh`
puts a small helper there that points and presses keys, `install.sh` the
built app, and `series.sh` points at every word of a test page, or of any
page, in Safari, Chrome or Firefox (`firefox-words.mjs` asks Firefox from
this side of a tunnel, `firefox-user.js` is its test profile) and lists what
the word and the sentence under the pointer brought;
`scripts/windows/series.sh` does that in Edge, Chrome and Firefox. `tour.sh`,
on either system, tries each way once for real, a few minutes in all: the
selection, Insert, text from a screenshot, a PDF (`mac-vm/tour.pdf`), a plain
text editor, the window over a full screen and a card sent to Anki, with
`scripts/tour-model.mjs` standing in for the AI model.
`scripts/capture-check.sh` runs all of them, one machine after the other.
`scripts/windows/quick.sh` puts a build in the Windows machine without its
installer, minutes sooner than `install.sh`. Both series
read what the window took from the file `TRIGLOSA_TRACE` names, which the
app writes only where it was started with it.

**On the Mac, always build with `npm run bundle`, never `tauri build` alone.**
macOS binds the Accessibility permission to the app's signature, and
`scripts/sign.mjs` signs it so that the permission survives the next build:
with the maintainer's Developer ID where its certificate is in the keychain
(`scripts/signing.mjs` finds it), otherwise ad-hoc with the requirement
pinned to the identifier, which is enough on your own Mac.
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
index.html, settings.html, card.html, welcome.html, screen.html, note.html   the windows' pages
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
  screen-text.js  the lines read off the screen, put back in order as text
  screen-pointer.js the word under the pointer, found in what was read off the screen around it
  spelling.js     whether a looked-up word may be misspelled, and as what
  settings.js     everything the reader can decide, normalised
  setup.js        the two ways to an AI model
  hotkey.js       recording a key combination
  faults.js       what went wrong, as { kind, status, detail } without words
  strings.js      the few words parsers read back, per first language
  text.js         string primitives shared by parsing, matching and drawing
  system.js       which system the page runs on
  updates.js      the project's addresses, and whether a newer version exists
  diagnostics.js  the text a reader copies into a problem report
  stats.js        the anonymous count: what is reported, and when — only after a yes
  languages/      one pack per language, behind a registry (index.js says what a pack may carry)
  prompts/        the prompt texts
  parse/          reading the model's answers back
  match/          finding a fragment's place in a text
  platform/       everything that leaves the process:
    llm.js          the model: one endpoint, retries, the reasoning ladder
    model-fetch.js  its requests, through the shell's kept connection
    aligner.js      the word aligner in the shell, for the hover and the marks
    identifier.js   the language identifier in the shell
    spelling.js     the system's spelling checker in the shell
    translation.js  Apple's translation through the helper (absent on Windows)
    capture.js      text from other programs, and back into them
    screen.js       text read off a piece of the screen, by Apple's recognition or the shell's
    shortcut.js     the global shortcuts
    windows.js      the app's own windows and its menu bar or tray entry
    store.js        the settings file
    keychain.js     the API key, in the keychain or Credential Manager
    anki.js         Anki, over AnkiConnect
    anki-mobile.js  Anki on a phone, through AnkiMobile's own addresses
    search.js       a word looked up on the web
    speech.js       a word said aloud with the system's voices
    update.js       installing a newer version
    stats.js        the anonymous count's file and its one address
    env.js          the one place that knows it runs inside the app
  ui/             the app's windows:
    app.js          the reading window, wired
    reading-view.js drawing one reading
    marking.js      a panel's text with its marks
    selection.js    picking a word out of a panel
    glance-view.js  the hover
    language-choice.js  correcting the source text's language
    settings-view.js, settings-window.js   the settings
    settings-sheet.js   the settings on a phone, over the reading in the same page
    model-setup.js  the settings' two ways to an AI model
    card-view.js, card-window.js           the flashcard
    card-improver.js    the wand behind a card
    card-layer.js       the flashcard on a phone, over the reading in the same page
    phone-sheets.js     a phone's first steps, and its question before a text first goes to the AI model
    welcome-view.js, welcome-window.js     the first steps, shown at a start
    example-view.js the first steps' example: a reading made beforehand, drawn as one
    screen-window.js                       the frame drawn over a screen (Windows)
    note-window.js                         a note said without the reading window, which goes by itself
    elements.js, icons.js, preview.js      small shared pieces
    labels.js       the interface, one file per language under labels/
    style.css
src-tauri/
  src/            the Rust shell: lib.rs (which half is built), desktop.rs
                  (commands, tray, windows), mobile.rs (the iPhone's one
                  page), settings.rs (the settings file and the count's), capture.rs,
                  overlay.rs (window placement), highlight.rs (what a
                  force click read, lit up), model.rs, align.rs (which word
                  became which, by a small model on this machine) with
                  pieces.rs (the pieces a word is cut into for it),
                  identify.rs (which language a text is in, by a small
                  model on this machine), spelling.rs (the system's
                  spelling checker), screen.rs (the screens photographed
                  and framed), ocr.rs (the text in a frame, on Windows),
                  keychain.rs, keyboard.rs, update.rs, diagnostics.rs,
                  journal.rs (the app's last steps, for a problem report), main.rs
  sidecar/        translator.swift, the Mac's translation helper, which also
                  reads text off the screen with Apple's recognition
  ios/            Translation.swift, Apple's translation inside the iPhone's app,
                  and what was copied; Recognition.swift, the text in a picture
                  (the app's and both share extensions');
                  Share/ShareViewController.swift, Triglosa in the share menu,
                  which reads, and once more as a flashcard (targets of their
                  own, added to the project by scripts/ios.mjs); ShareCard/ and ShareRead/,
                  the two actions' names in each language and their symbols; Localized/, the
                  app's words for the system (why the camera is asked for);
                  PrivacyInfo.xcprivacy, the privacy manifest the App Store asks for
  capabilities/   what each window may reach — every window label must be listed
  resources/      the models the app carries: identifier/ (the language
                  identifier's, made by scripts/identifier-pack.py) and
                  aligner/ (the word aligner's, not in the repository:
                  fetched for a build by scripts/aligner-fetch.mjs, made
                  by scripts/aligner-pack.py) and ocr/ (the text recognition
                  for Windows: PaddleOCR's models, fetched by
                  scripts/ocr-fetch.mjs, packed into the Windows build only)
scripts/          build, sign, pack, check; windows/ and mac-vm/ drive the virtual machines
counter/          the anonymous counter on Cloudflare's workers: worker.js (takes
                  a report, adds one to its day's sum, and shows the sums to
                  whoever holds the key), schema.sql (its one table),
                  wrangler.toml (where it runs; README.md says how to set it up)
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
  prompts need nothing else. A language may also be learned without a pack
  (`WITHOUT_PACK` there): the settings list it as not optimised and it gets
  no verb section. A pack - the tense and person names, the auxiliaries, the
  verbs of the first weeks, the articles - is what moves it up.
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

Text read off the screen is recognised on the Mac by Apple's own
recognition, in the helper. On Windows it is read by PaddleOCR's PP-OCRv5
mobile models (a detector and a recogniser per script: Latin, Cyrillic,
Arabic, Chinese with Japanese; about 43 MB, Apache License 2.0, notice and
license in `src-tauri/resources/ocr/`), through the same ONNX Runtime
(`src-tauri/src/ocr.rs`). `scripts/ocr-fetch.mjs` fetches them from
RapidOCR's ONNX release by checksum; `scripts/aligner-fetch.mjs` runs it,
so every build that fetches the aligner has them too.

## Releases

Made by the maintainer, after `npm run security` finds nothing to fix. `npm run release` builds both Mac apps, signs them
with the Developer ID, has Apple check them (`scripts/notarize.mjs`, with a
keychain profile of notarytool's made once) and packs their DMGs, signed and
checked in turn (`scripts/dmg.mjs`, after signing — Tauri's own DMG is packed
before it); the Windows installer comes from the workflow. Then
`node scripts/updater.mjs --windows=<installer>` packs the Mac apps for the
updater, signs every update file with the updater's private key and writes
`latest.json`. All of them go up with the GitHub release, or no installed
app can update itself. The store pages' addresses in the README and the counter's database
are filled in once the stores and Cloudflare have given them: until then
`scripts/unfinished.mjs` has every commit remind of them and the export refuse. The updater's public key is in
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

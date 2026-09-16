# Developing Triglosa

What you need to know before changing the app. The files explain the details
in their own comments.

## Stack

Tauri 2 with Vite and plain JavaScript — no TypeScript, no framework. A Rust
shell holds the global shortcut, the menu bar symbol, the key store and the
text capture. A small Swift helper talks to Apple's on-device translation over
HTTP on `127.0.0.1:51737`. Everything the app knows about language comes from
an OpenAI-compatible model endpoint the reader configures.

## Commands

```bash
npm install
npm run sidecar               # build the Swift translation helper (once, and after changing it)
npm run app                   # the window with live reload
npm test                      # unit tests, a few seconds, no external services
cd src-tauri && cargo test    # the shell's own tests
npm run bundle                # the signed Triglosa.app
npm run release               # helper, signed app and the dmg
node scripts/shot.mjs out.png "some text"   # photograph the window's page (needs npm run app)
```

Always build with `npm run bundle`, never `tauri build` alone: macOS binds the
Accessibility permission to the app's signature, and `scripts/sign.mjs` pins
it to the identifier so it survives the next build. The language download
prompt and the helper's own window only exist in a built app.

## Layout

```
src/
  run.js         one reading, start to finish — decides, draws nothing
  ask.js         every question the model is asked — sends, decides nothing
  detect.js      which language a text is in: function words, the platform, the model
  faults.js      what went wrong, as { kind, status, detail } without words
  card.js        a flashcard's three fields, and which goes where
  settings.js    everything the reader can decide, normalised
  languages/     one pack per language, behind a registry (index.js says what a pack may carry)
  prompts/       the prompt texts
  parse/         reading the model's answers back
  match/         finding a fragment's place in a text
  ui/            the three windows: reading, settings, card
  platform/      everything that leaves the process
src-tauri/
  src/           the Rust shell (lib.rs, capture.rs, overlay.rs, keychain.rs, keyboard.rs)
  sidecar/       translator.swift
  capabilities/  window permissions — every window label must be listed here
tests/
  unit/          the tests; ui tests draw into a jsdom document
```

## Rules

- **Nothing language-specific outside a language pack.** No word list, no
  language name, no assumption about German or Spanish in a general path.
  Where a pack knows nothing, the generic path applies and shows one row too
  few rather than a wrong one.
- **The prompts are the product.** No prompt carries an example, and none
  names a language except out of a pack — examples leak their language into
  the answers. Changing prompt wording is a behaviour change: try it on
  several texts in several languages, for a German and an English reader, at a
  low and a high level, and with both a cloud and a small local model.
- **`run.js` decides, `ask.js` sends, `ui/` draws.** None reaches into another.
  Only `ui/labels.js` writes sentences for the reader, in German and English.
- **Everything that leaves the process goes through `platform/`** and takes
  its own `fetch`, so the same code runs in the app, in a browser and in tests.
  `platform/env.js` is the only file that knows which.
- **Windows is intended.** Keep macOS code behind those seams and behind
  `cfg` in the shell, and keep paths out of the source.
- **Tests stay green.** A change to what the window draws belongs in
  `tests/unit/reading-view.test.js` or its neighbours.
- **No new dependencies** without a good reason.
- **English** in code, comments and commit messages.

## Traps

- The helper outlives the app and keeps its port. Whenever a route's answer
  changes shape, raise `PROTOCOL` in `translator.swift` and in
  `src/platform/translation.js` together, or an old helper keeps answering a
  new window.
- It is a WKWebView, not Chromium: `-webkit-app-region` and
  `field-sizing: content` do nothing. Dragging needs `data-tauri-drag-region`
  and `core:window:allow-start-dragging`.
- A new window needs its label in `capabilities/default.json` and its page as
  a Vite entry in `vite.config.js`.
- Subprocesses started from the Finder have no `LANG`; say the encoding, or
  `pbpaste` answers in Mac Roman.
- AnkiConnect refuses Tauri's `Origin` header, so Anki is reached through the
  shell (`anki_request`), not through `fetch`.
- The app has no dock icon by default and therefore no menu bar of its own:
  Escape and ⌘W exist only because the pages listen for them.

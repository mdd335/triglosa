# Triglosa

Triglosa is an AI-powered translation app, made for language learners.

Select a sentence in any language anywhere on your PC or Mac, press a
shortcut, and Triglosa shows it next to one or two translations in the languages of your choice. The words worth
learning are explained: difficult terms, verb forms, synonyms and abbreviations,
highlighted in every panel at once. Click any word for its meaning and base
form, or turn it into a flashcard which you can export directly to Anki.

![Triglosa showing a Spanish sentence with its English and Russian translations, the verbs and terms found in it](docs/demo.gif)

Supported languages so far: English, German, Spanish, French, Italian, Portuguese,
Russian and Arabic. Feel free to [open an issue](https://github.com/mdd335/triglosa/issues) if yours is not
supported yet.

## Installing

### Installing on Windows

**You need Windows 11 on a PC with an Intel or AMD processor.** Windows 10
probably works, but has not been tested.

1. Download `Triglosa_…_x64-setup.exe` from the
   [latest release](https://github.com/mdd335/triglosa/releases/latest).
2. Open it. Windows will warn you the first time: Triglosa is not signed. This warning is expected. Click **More info**, then **Run anyway**.
3. Install, and open Triglosa from the Start menu.

### Installing on Mac

**You need a Mac with Apple silicon (M1 or newer) and macOS 26 or newer.**

1. Download `Triglosa-…-arm64.dmg` from the
   [latest release](https://github.com/mdd335/triglosa/releases/latest).
2. Open it and drag Triglosa into Applications.
3. Open Triglosa. macOS will refuse the first time — see below.

#### "Apple could not verify Triglosa"

This warning is expected. Apple only vouches for apps whose authors pay for a
developer account (€99 a year) and send every version in for checking. Triglosa
is a free hobby project and does neither. 

To open it anyway:

1. Open Triglosa once and close the warning with **Done**.
2. Open **System Settings → Privacy & Security**
   and scroll to the bottom. Next to "Triglosa was blocked" click
   **Open Anyway** and confirm with your password.
3. Open Triglosa again and confirm once more. From then on it opens normally.

If macOS instead says the app **"is damaged and can't be opened"**, open
Terminal and paste this, then open Triglosa again:

```bash
xattr -dr com.apple.quarantine /Applications/Triglosa.app
```

## First steps

1. **By default, Triglosa lives in the notification area at the bottom right (Windows) or in the menu bar (Mac).** The book symbol there
   brings the window back, translates the selected text, opens the settings, checks for updates, or quits.
2. **Set your languages** in the settings: your own language (English or German), which is also the interface language, and one or two
   you are learning, each with a level from A1 to C2. The level decides which words Triglosa explains, and how explanations, example sentences and flashcards are written.
3. **Set up an AI model**, see below.
4. **You are all set! Select a sentence in any program and press Win+Shift+E (Windows) or ⌃⌥E (Mac).**
   Triglosa translates it. Pressed with nothing selected, the window comes back as you left it. You can also type
   or paste straight into the window. On a Mac, copy the sentence first (⌘C), unless you allow step 5.
5. **Optional, Mac only: use selected text directly.** Translate selected text without
   copying it first, and insert translations straight into other programs.
   For this, Triglosa needs the macOS permission *Device Control and Data Access* (under Privacy & Security; called *Accessibility* up to macOS 26), which you
   can grant in the settings. Triglosa uses it only for reading the selected text and for inserting, and only when you ask it to.
6. **Optional, Mac only: set up Apple's on-device translation as an alternative.** It is very fast and works
   offline, but is often imprecise. In the settings under *Translations*,
   download the language packs and choose who translates by default. If one of the
   two cannot translate, the other steps in.

## What it does

- **Translations side by side**, in two or three panels following your
  language list.
- **Difficult terms and verb forms** are listed under the panels and marked in
  all of them. A verb opens its conjugation table or a web search.
- **Click any word** for its meaning, base form and related words, and ask for
  a longer explanation of it if you want one.
- **Rest the pointer on a word** in a foreign language to see the translation. The matching words light up in every panel.
- **Flashcards** from any word, or from selected text with a shortcut you set in the settings: edit the card, let the AI model improve it
  with the wand at the top, then copy it, or send it directly to
  [Anki](https://apps.ankiweb.net) with the
  [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on (you can switch this on in the settings).
- **Example sentences** for a verb, a term or a clicked word, and a web search for it, each one click away.
- **Insert a translation** into the program you are in, with the Insert button. If text is selected there, it is replaced. On a Mac this needs the optional permission from *First steps*; without it, use Copy.
- **The last five readings** are one click back, and are kept in memory only.

## Setting up an AI model

> Never set up an AI model before? No problem! You can paste this whole section into the AI chatbot of your
> choice and ask it to walk you through getting access step by step.

Triglosa's translations and everything else come from an AI model: what words in the text mean, which verb form is standing there and what its
base form is, related words, and the dictionary entries. Without one, only
Apple's translation is left on a Mac, if you set it up.

Triglosa does not ship an AI model and downloads none. It sends its
questions to one you choose, and there are two ways to have one.

**In the cloud** the model runs on a provider's machines. You create an account
there, generate an API key — a long string of characters, similar to a password — and paste it into
the settings. That takes a few minutes, the answers are fast and good, and
billing is usually per request. Triglosa's questions are short, so this usually comes to
a few cents a month. Providers that speak the common OpenAI-compatible
interface include [OpenRouter](https://openrouter.ai), DeepSeek, Groq, Mistral and OpenAI itself.

**Locally** the model runs on your own machine, provided that your computer has enough memory. Install a program such as
[LM Studio](https://lmstudio.ai) or [Ollama](https://ollama.com), download a
model in it — several gigabytes — and start its built-in server. That costs
nothing, no text leaves your machine and no API key is needed. In exchange it is
a bit slower and small models answer less precisely.

Three things then go into the settings. The **endpoint** is the address Triglosa
sends its questions to; it almost always ends in `/v1`. The **model** is that
provider's name for the model, for example `deepseek/deepseek-v4.1-flash` in the cloud. If left empty, Triglosa takes the first model the
endpoint offers. The **key** is only needed with a cloud provider, and it goes
into the Windows Credential Manager or your macOS keychain, never into a file. **Test connection** says
straight away whether it all works.

### Which model should I choose?

What suits this app is a small or medium-sized,
fast model that does not think first. A model that insists on thinking first is
refused by the app, because it is slow and you pay for every word of it.

These two were measured over everyday translations in all eight languages:

| | Quality | a full reading takes | 100 readings cost |
|---|---|---|---|
| `deepseek/deepseek-v4.1-flash` (via OpenRouter, with routing set to choose the fastest provider) | very good | around 4 seconds | around 0.15 € |
| `gemma-4-e4b-it` (via LM Studio) | acceptable, with some mistakes | around 6 seconds | nothing |

## Privacy

Triglosa sends the text you read to the AI model you set up, and nowhere else.
Apple's on-device translation, if you set it up on a Mac, runs on the device. Your readings are not written to any file, and
the API key is kept in the Windows Credential Manager or the macOS keychain.

If you use a cloud model from OpenRouter, you can limit your account to using only providers with Zero Data Retention (ZDR). This works with `deepseek-v4.1-flash` and many other models.

## Uninstalling

**Windows:** quit Triglosa from its symbol in the notification area and uninstall it under
Settings → Apps. To remove every trace, also delete the folder `%APPDATA%\de.mdd335.triglosa`
and the entry `Triglosa/model-endpoint` in the Credential Manager.

**Mac:** quit Triglosa from the menu bar symbol and move it to the Bin. To remove every
trace, also delete the folder `~/Library/Application Support/de.mdd335.triglosa`,
the keychain entry named `Triglosa` (in Keychain Access), and Triglosa's entry
under System Settings → Privacy & Security → Device Control and Data Access (Accessibility up to macOS 26).

## If you encounter a problem or have an idea

First check whether a newer version has been
[released](https://github.com/mdd335/triglosa/releases). It may fix the problem.

If not, please [open an issue](https://github.com/mdd335/triglosa/issues). Ideally, add which
languages you use and which AI model. Note that many surprises may come from
the model rather than from the app.

## Building the app yourself

Needs Node and Rust, and Visual Studio's C++ build tools (Windows) or Xcode's command line tools (Mac).

```bash
npm install
npm run app                   # the window with live reload
npm test                      # the tests, no external services
cd src-tauri && cargo test    # the shell's own
```

**Windows:** `npx tauri build --bundles nsis` builds the installer into
`src-tauri/target/release/bundle/nsis/`.

**Mac:** `npm run release` builds the translation helper, the signed app in
`src-tauri/target/release/bundle/macos/` and the disk image in `…/bundle/dmg/`.
Use `npm run bundle` rather than `tauri build` for the app alone: the signature
it adds is what the Device Control and Data Access permission is granted to,
and without it the permission is lost with every rebuild.

Before changing anything, read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

MIT

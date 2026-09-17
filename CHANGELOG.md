# Changelog

## 0.3.0

- Triglosa now runs on Windows 11 (Intel and AMD). The shortcut there is
  Win+Shift+E, and an AI model is needed.

### Changed
- The Anki settings say more clearly which note type the deck uses.

### Fixed
- Button labels no longer hang out of a short window.
- Without internet or an AI model, a single word is now translated by
  Apple's translation instead of not at all.
- The settings and the flashcard window no longer pull you onto another
  program's full screen when you switch to them.
- The button for another example sentence stays in place while it works.
- Anki's note types show how many notes in the whole deck use them, not at
  most 100.
- The optional permission is named the way System Settings names it on
  macOS 27: Device Control and Data Access.

## 0.2.0

- The app is now called Triglosa. Settings, the API key and the Accessibility
  permission have to be set up once more.
- Requires macOS 26 or newer.
- The AI model now translates by default. Apple's translation is optional:
  very fast and offline, but often imprecise.
- No permission needed any more: copy a text and press the shortcut. The
  Accessibility permission is optional — with it, selecting is enough, and
  Insert (formerly Replace) puts a translation wherever you are typing.

### New
- Rest the pointer on a word to see what it is in your language.
- Clicked words and terms show a second translation where one exists, and
  what kind of word they are.
- Longer explanations end in example sentences; a button adds more.
- Marking a longer passage translates it whole.
- The settings can check for a newer version.

### Changed
- The window starts hidden and is as tall as what it holds.
- Verbs, terms and flashcards share one set of language choices.
- Error messages are short: what happened, then what to do.
- Without an AI model, the window shows the translations and one line on
  what a model adds, instead of empty sections.

### Fixed
- Texts in languages Triglosa does not offer are no longer taken for one it
  does.
- Fewer wrong verbs: no more prepositions, or two verbs joined into one.
- The window stays open while Spotlight is in front.

## 0.1.0 — first release

The first version for anyone to try. Apple silicon and macOS 15 or newer.

- Select a text anywhere and press ⌃⌥E: it arrives next to its translations,
  in two or three panels for eight languages.
- Choose who translates: Apple's translation on your Mac, or your AI model,
  which is slower and more accurate. The other steps in when the first cannot.
- Difficult terms and verb forms explained and marked in every panel, at the
  level you set for each language.
- Click any word for its meaning, base form and related words; up to three
  words get a dictionary entry. Words, verbs and terms can be explained at
  greater length on request.
- Translations, verbs and terms fold away, and the underlines can be switched
  off.
- Flashcards you can edit, let the AI model improve, copy, or send to Anki.
- A translation can be written back into the program the text came from.
- Triglosa shows its icon in the menu bar, the Dock or both, and its window
  closes when you click elsewhere unless you switch that off.
- Works with any OpenAI-compatible AI model, in the cloud or local, with
  buttons for OpenRouter, LM Studio and Ollama. Without one, the translations
  still work.

# Changelog

## 0.7.0

### New
- Triglosa for the iPhone, in the App Store: copy a text and tap the paste button, take or choose a photo of a text, or share a text or a picture to Triglosa from Safari, Mail, Photos and other apps, also straight onto a flashcard. It asks before the first text goes to an AI model; without one, Apple translates on the iPhone.
- Windows: Triglosa is in the Microsoft Store, which brings its updates. The installer stays for a direct download.
- Text from a screenshot: from the menu or a shortcut of its own, mark a piece of the screen and Triglosa translates the text in it, copies it, or puts it on a flashcard. An image file selected in the Finder or in Explorer, or dropped on the window, is read the same way, and the word and the sentence under the pointer are read off the screen where a program hands over no text. The picture is read on your computer; only the text goes to the AI model. Mac: this needs the permission for screen recording, asked for in the settings.
- The settings help you connect an AI model: Online through OpenRouter (recommended for most), with its steps, or another provider you enter yourself, with a button each for the addresses of LM Studio and Ollama.
- The first steps show an example straight away and name the page of the settings for each step. A box there lets you allow counting anonymously how often Triglosa is used, not ticked at first; you can change it in the settings at any time.
- A reading can get a translation into another language: a symbol in a translation's heading adds a third, and with three a translation's language can be changed there. The choice holds until you quit Triglosa.
- Each language can send its flashcards to an Anki deck of its own.
- Seven further languages can be learned (not optimised): Albanian, Armenian, Esperanto, Filipino, Georgian, Irish and Welsh.

### Changed
- Mac: Triglosa is signed and checked by Apple, so it opens without a warning and without a detour through the system settings.
- The license is now GPL-3.0: a copy built on Triglosa has to stay open too. Versions up to 0.6.0 stay under MIT.
- The settings are split into pages, listed at the left, each setting in a box of its own. *Text from other programs* is now called *Other programs*.
- The preset shortcut is Ctrl+Alt+T on Windows and ⌃⌥T on the Mac. A shortcut you already set stays as it is.

### Fixed
- The sentence under the pointer in a search result in Chrome no longer runs the result's name and address into the sentence.
- The shortcuts for the word and the sentence under the pointer always bring the window up quickly and say what they are doing; where nothing could be read, the window says why instead of staying away.
- Mac: the shortcut shows the window over a program in full screen again, also after another program went into full screen or came out of it.
- The window no longer stays out of sight when the screen it last stood on is gone.
- A looked-up word's translations no longer list a word of another language: "lauter" in Spanish showed German "ehrlich" and "nur" beside "puro".
- An improved flashcard's explanation is written from the word and its meaning alone, and an adjective is no longer made a person: "moreno" stays "moreno", not "el moreno / la morena".
- Mac: after five minutes without use, Apple's translation and text recognition are started again when needed, instead of failing.
- Libraries with known security holes are updated: how secure connections check certificates, and on Windows how an update is unpacked.

## 0.6.0

### New
- A word looked up with a typo is looked up as meant, with "Corrected from …" under it.
- 35 further languages can be learned, among them Polish, Turkish, Greek, Hindi, Chinese, Japanese and Korean. The settings list them as "Not optimised".
- A window with the first steps opens when Triglosa starts, until you tick "Don't show again".
- Anki can sync automatically after every card: a switch in the settings, off by default.
- An improved flashcard names a person or an animal in both forms: "der Lehrer / die Lehrerin", "el/la policía".

### Changed
- Mac: the Force Click is set with a button beside the shortcut for the word or the sentence under the pointer, and can now read the sentence too.

### Fixed
- A word of another of your languages - a Spanish word in an English sentence - is looked up in its own language.
- Mac: Apple's translation also steps in for a language outside Triglosa's eight where the AI model gives no answer.

## 0.5.0

### New
- Two new shortcuts look up the word under the pointer or translate the whole sentence under it, without selecting anything. On the Mac, a Force Click on the trackpad can look up a word, too. Set them up in the settings under "Text from other programs"; on the Mac they need the optional permission explained there.
- A word you look up takes the sentence it stands in along to the AI model, at most 30 words, so the meaning that fits your text comes first. You can switch this off in the settings.
- Looking up one to three words now explains them under the translations where they are hard at your level.
- Read on sentence by sentence: the next sentence of the text you read from can be shown under the original and translated with a click. Switch it on in the settings under "Text from other programs".
- Text to speech: press the loudspeaker to hear a word aloud, with a voice your system already has.
- An AI model on another computer in your own network can be used.
- The settings say how many past translations Triglosa remembers: the last 5, the last 10, or none.

### Changed
- The translation on hover is there as soon as the translations are, and where a word went in the translations is marked at once: a small model that comes with Triglosa works this out on your computer. The download is about 150 MB larger for it.
- Faster and cheaper: a dictionary entry arrives in about half the time, a text's language is mostly recognized on your own computer, and a translation asks the AI model fewer questions.
- The terms and verbs explained fit your language level better, and in a long text they are no longer taken from its first sentences only.

### Fixed
- Texts in Chinese, Japanese, Korean, Thai and other scripts written without spaces are now translated as text and their difficult terms are marked.
- When the AI model is briefly overloaded, Triglosa waits and asks again instead of leaving parts of the translation empty.

## 0.4.3

### New
- A newer version can be installed from the settings with one click, and Triglosa restarts on its own. It is downloaded only when you click.

### Fixed
- A security fix in the part that encrypts the connections to the AI model and to GitHub.

## 0.4.2

### New
- Mac: Triglosa now also runs on Macs with an Intel processor and macOS 26.

### Changed
- A flashcard from the shortcut opens at once. The card fills in when it is known.
- Every new flashcard opens a window of its own, so a card you are still writing stays open.

## 0.4.1

### New
- Ctrl+. (Windows) or Cmd+. (Mac) keeps the window in front, or stops keeping it there, like the pin.

### Changed
- The buttons at the top of the window name their shortcut on hover.
- "Explain more" no longer adds another example sentence under a word that already has one.
- Windows: Triglosa's symbols in the taskbar have the correct size.
- Flashcards are improved by the AI model as soon as they open. The undo button at the top takes it back, and the settings under Flashcards switch it off.

## 0.4.0

### New
- Spanish, French, Italian, Portuguese and Russian can now be your own language, and the interface follows it.
- A text recognised as the wrong language can be put right: click the language above the original and choose another, or type any other language. The translation is made again, and the choice holds until Triglosa quits, also when you edit the text.
- A pin in the translation window keeps it open and in front of all other windows. It replaces the setting that closed the window when clicking elsewhere.
- Choose which search engine is used for looking words up, in the settings under Verbs and terms.

### Fixed
- Insert puts the translation into the program you last clicked into, not back into the one the text came from.
- Windows: starting Triglosa while it is already running opens its window instead of a second copy.
- Windows: the symbol in the notification area shows its name under the pointer.

## 0.3.1

### New
- Two more shortcuts, set in the settings under Shortcuts: one for a new translation and one that makes a flashcard from the selected text.
- Flashcards straight from the menu: from the selected text, or a new blank one.
- The window's automatic height can be switched off in the settings; it then keeps the size you give it.
- Ctrl+Enter (Windows) or Cmd+Enter (Mac) translates what you typed.
- Sections you fold away stay folded for the next translation, until Triglosa quits.
- Windows: Triglosa can also show a button in the taskbar while its window is open.

### Fixed
- Ctrl+C (Windows) or Cmd+C (Mac) now copies a word or passage marked in the translation window.
- Windows: translating selected text from the menu in the notification area now finds the selection.
- Windows: a window snapped to half the screen no longer shifts and shrinks a little when a new translation comes in.

## 0.3.0

- Triglosa now runs on Windows 11 (Intel and AMD). The shortcut there is Win+Shift+E, and an AI model is needed.

### Changed
- The Anki settings say more clearly which note type the deck uses.

### Fixed
- Button labels no longer hang out of a short window.
- Mac: without internet or an AI model, a single word is now translated by Apple's translation instead of not at all.
- Mac: the settings and the flashcard window no longer pull you onto another program's full screen when you switch to them.
- The button for another example sentence stays in place while it works.
- Anki's note types show how many notes in the whole deck use them, not at most 100.
- Mac: the optional permission is named the way System Settings names it on macOS 27, Device Control and Data Access.

## 0.2.0

- The app is now called Triglosa. Settings, the API key and the Accessibility permission have to be set up once more.
- Requires macOS 26 or newer.
- The AI model now translates by default. Apple's translation is optional: very fast and offline, but often imprecise.
- No permission needed any more: copy a text and press the shortcut. The Accessibility permission is optional — with it, selecting is enough, and Insert (formerly Replace) puts a translation wherever you are typing.

### New
- Rest the pointer on a word to see what it is in your language.
- Clicked words and terms show a second translation where one exists, and what kind of word they are.
- Longer explanations end in example sentences; a button adds more.
- Marking a longer passage translates it whole.
- The settings can check for a newer version.

### Changed
- The window starts hidden and is as tall as what it holds.
- Verbs, terms and flashcards share one set of language choices.
- Error messages are short: what happened, then what to do.
- Without an AI model, the window shows the translations and one line on what a model adds, instead of empty sections.

### Fixed
- Texts in languages Triglosa does not offer are no longer taken for one it does.
- Fewer wrong verbs: no more prepositions, or two verbs joined into one.
- The window stays open while Spotlight is in front.

## 0.1.0 — first release

The first version for anyone to try. Apple silicon and macOS 15 or newer.

- Select a text anywhere and press ⌃⌥E: it arrives next to its translations, in two or three panels for eight languages.
- Choose who translates: Apple's translation on your Mac, or your AI model, which is slower and more accurate. The other steps in when the first cannot.
- Difficult terms and verb forms explained and marked in every panel, at the level you set for each language.
- Click any word for its meaning, base form and related words; up to three words get a dictionary entry. Words, verbs and terms can be explained at greater length on request.
- Translations, verbs and terms fold away, and the underlines can be switched off.
- Flashcards you can edit, let the AI model improve, copy, or send to Anki.
- A translation can be written back into the program the text came from.
- Triglosa shows its icon in the menu bar, the Dock or both, and its window closes when you click elsewhere unless you switch that off.
- Works with any OpenAI-compatible AI model, in the cloud or local, with buttons for OpenRouter, LM Studio and Ollama. Without one, the translations still work.

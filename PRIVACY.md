# Privacy

Triglosa runs on your computer and your iPhone. It has no account, shows no advertising and keeps no server that receives what you read. It counts nothing unless you allow it, and then only anonymously, as described below.

## What is sent, and where

**The text you read goes to the AI model you connect, and nowhere else.** That is the address you enter in the settings: a provider on the internet or a model on your own computer. What the provider does with the text is governed by its own terms and privacy policy, so choose one you trust. Without a connected AI model, no text leaves your device for translating.

**On the iPhone, Triglosa asks before the first text goes to an AI model**, and again if you enter another address. Without your permission, Apple translates on the iPhone and no text leaves it. You can change the answer in the settings under *AI model*.

**A looked-up word takes its sentence along**, at most 30 words, even though you did not select that sentence. Switch off *Send the sentence along* in the settings under *Other programs* if you do not want that.

**Your API key** goes only to the provider it belongs to.

## Anonymous usage statistics, only if you allow it

The first steps on a computer ask whether Triglosa may count anonymously. If you say no or leave the question unanswered, nothing is counted. If you say yes, there or in the settings, Triglosa sends at most once a day:

- that it was used, and whether a text was read that day,
- its version and the system (Windows or Mac),
- whether your AI model runs on your computer or your own network, or online, and online whether it is one of the two the settings offer (DeepSeek V4.1 Flash, or Gemma 4 26B for free), or whether none is set up,
- the day it was first counted and the number of weeks since, so that the counter can tell how many people still use Triglosa after a week or a month,
- when something goes wrong, only the kind of error, such as "no connection" or "the key was refused".

Never your texts, the words you look up, your API key, the address or name of your AI model, or any number that identifies you or your device. The counter adds each report to a sum for its day and keeps nothing else; it does not store your IP address. It runs on Cloudflare, which receives the connection in order to deliver it. Its code is public, in the folder `counter` of this repository.

You can switch this on or off at any time in the settings under *About Triglosa*. The iPhone app counts nothing; Apple shows its developers only what you allow under Settings → Privacy & Security → Analytics & Improvements.

## What stays on your device

- Your readings are kept in memory while the app runs and are not written to any file.
- Your settings are kept in a file on your device. Your API key is kept in the Windows Credential Manager or the Apple keychain.
- Text to speech runs on your device, and so does Apple's translation on a Mac and an iPhone.
- Text from a screenshot, a picture or the screen under the pointer is recognized on your computer. Only the recognized text goes to the AI model, never the picture.
- Flashcards go to Anki on your device, if you switch that on.

## Other connections

Triglosa connects to nothing else unless you ask it to:

- *Check for updates* asks GitHub whether there is a newer version. A copy from the Microsoft Store or the App Store has no such button: the store brings its updates.
- A web search or a conjugation table opens in your browser, with the word in the address.
- *Copy diagnostics* puts a report on your clipboard and sends nothing. It holds the version, system, languages, AI model, recent errors and the app's last steps (started, window shown, shortcut pressed), never your texts or your API key. Those steps are kept in a small file on your computer for this report alone.

If you installed Triglosa from the Microsoft Store or the App Store, the store's own privacy terms apply to the store.

## Who is responsible, and contact

Triglosa is made by Malte Brockerhoff, who is responsible for what this page describes.

Questions and problems: [GitHub Issues](https://github.com/mdd335/triglosa/issues). For a privacy question you would rather not ask in public: triglosa@posteo.de

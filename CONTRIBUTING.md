# Contributing

## Building the app yourself

Needs Node and Rust, and Visual Studio's C++ build tools (Windows) or Xcode's command line tools (Mac).

```bash
npm install
npm run app                   # the window with live reload
npm test                      # the tests, no external services
cd src-tauri && cargo test    # the shell's own
```

**Windows:** `node scripts/aligner-fetch.mjs`, then `npx tauri build --bundles nsis` builds the installer into `src-tauri/target/release/bundle/nsis/`.

**Mac:** `npm run release` builds the translation helper, the signed app in `src-tauri/target/release/bundle/macos/` and the disk image in `…/bundle/dmg/`. Use `npm run bundle` rather than `tauri build` for the app alone: the signature it adds is what the Device Control and Data Access permission is granted to, and without it the permission is lost with every rebuild.

Before changing anything, read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). What happens behind a translation, and which requests go to the AI model: [docs/behind-a-translation.md](docs/behind-a-translation.md).

## License

AGPL-3.0. Version 0.7.0 stays under GPL-3.0, versions up to 0.6.0 under MIT.

The app includes small models, each with its notice and license in a folder inside the app: one for matching words between a text and its translation, derived from [OmniAlign](https://huggingface.co/WPS-Qingqiu/OmniAlign) (Apache License 2.0, folder `aligner`), one for recognizing a text's language, derived from [fastText's language identification model](https://fasttext.cc/docs/en/language-identification.html) (Creative Commons Attribution-Share-Alike 3.0, folder `identifier`), and on Windows [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)'s text recognition models (Apache License 2.0, folder `ocr`).

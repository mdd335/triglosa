import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

/* Tauri serves the frontend from this dev server and, in a release build, from
   the files in dist/. The fixed port is what src-tauri/tauri.conf.json expects.

   Six pages, because the settings, a flashcard, the first steps, the
   frame over a screen and a note are each a window of their own: the shell opens them
   by name, in the dev server and in the built app alike, so each has to
   survive the build as a page of its own rather than being rolled into the
   first.

   A phone reaches the dev server over the network, at the address Tauri
   names; a computer keeps to itself. */
export default defineConfig({
  clearScreen: false,
  server: { port: 1420, strictPort: true, host: !!process.env.TAURI_DEV_HOST },
  build: {
    target: "safari15",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(here, "index.html"),
        settings: resolve(here, "settings.html"),
        card: resolve(here, "card.html"),
        welcome: resolve(here, "welcome.html"),
        screen: resolve(here, "screen.html"),
        note: resolve(here, "note.html"),
      },
    },
  },
});

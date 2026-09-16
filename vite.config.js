import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

/* Tauri serves the frontend from this dev server and, in a release build, from
   the files in dist/. The fixed port is what src-tauri/tauri.conf.json expects.

   Three pages, because the settings and a flashcard are each a window of
   their own: the shell opens them by name, in the dev server and in the built
   app alike, so each has to survive the build as a page of its own rather
   than being rolled into the first. */
export default defineConfig({
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    target: "safari15",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(here, "index.html"),
        settings: resolve(here, "settings.html"),
        card: resolve(here, "card.html"),
      },
    },
  },
});

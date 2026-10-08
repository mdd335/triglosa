/* What the linter looks at: the recommended rules only — mistakes, not
   taste. The window's code runs in a web view, the scripts and tests in
   Node, and each gets its own globals. */

import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "src-tauri/", "node_modules/", "tests/runs/"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      /* An empty catch says "this failure means nothing here", and the code
         says why in a comment beside it. */
      "no-empty": ["error", { allowEmptyCatch: true }],
      /* An argument named _ or _something is left unused on purpose. */
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true }],
      /* French sets a narrow no-break space before : ; ! ? and inside « ».
         In the texts that is typography, and meant; in code it is not. */
      "no-irregular-whitespace": ["error", { skipStrings: true, skipTemplates: true }],
    },
  },
  { files: ["src/**/*.js"], languageOptions: { globals: globals.browser } },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.{js,mjs}", "*.config.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];

/* What a file may hold only until the stores and the counter have answered:
   a store page's address, the counter's database. `check.mjs` reminds of
   each at every commit, and `public-export.mjs` refuses to export while one
   is left. */

export const UNFINISHED_IN = [
  ["counter/wrangler.toml", [/set-after-wrangler-d1-create/]],
];

# The anonymous counter

Triglosa asks once, in its first steps, whether it may count anonymously. Where the reader says yes, the app on a computer reports at most once a day that it was used and that a text was read, and a failure by its kind. `src/stats.js` decides what a report holds; `worker.js` here only adds one to the sum for its day and values. Nothing in the table tells one installation from another, and no address, time of day or text is kept. `PRIVACY.md` says the same for readers.

## What a report holds

| Field | Example | Meaning |
|---|---|---|
| `event` | `seen` | `seen` (started or window shown), `read` (a text read) or `fault` |
| `version` | `0.7.0` | the app's version |
| `system` | `mac` | `mac` or `windows` |
| `model` | `online` | the kind of AI model: `online`, `local`, `own` or `none` |
| `since` | `2026-11-03` | the day this installation was first counted (UTC) |
| `week`, `first` | `1`, `true` | the week since that day, and whether this is its first report in that week |
| `kind` | `key` | for a failure only: its kind (`src/faults.js`) |

Who comes back is worked out from `since`, `week` and `first`: the installations first counted on a day form that day's cohort, and the cohort's first reports in week 1 are the ones still there a week later.

## Setting it up once

Needs a free Cloudflare account. From this folder:

```bash
npx wrangler login
npx wrangler d1 create triglosa-counter
```

Write the `database_id` it prints into `wrangler.toml`, then:

```bash
npx wrangler d1 execute triglosa-counter --remote --file=schema.sql
npx wrangler secret put REPORT_KEY
npx wrangler deploy
```

`REPORT_KEY` is any long random string; it opens the report. The address `wrangler deploy` prints, followed by `/v1`, must be `COUNTER_URL` in `src/updates.js`.

## Reading it

Open `<address>/v1/report?key=<REPORT_KEY>` in a browser; `&format=json` gives the numbers alone.

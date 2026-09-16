/* Matching each table row to its spots in the two translated panels.

   a and b are field 1 and field 2 of the model's answer, not two fixed
   languages: which language stands there depends on the source language.

   Rows are matched over field 1, not over position. If the model drops a row
   or reorders them, everything behind would shift — and invisibly so, since
   the panel highlighting links table row and spot by index alone. Nothing
   would look empty; the wrong word would simply be coloured in the
   translation. The result therefore always has the length and the order of
   the expected list. */

import { cleanLine, containsWord, stripDiacritics, stripQuotes } from "../text.js";
import { isFunctionWord } from "../vocabulary.js";

/* The model is asked to copy field 1 unchanged but drifts in capitalisation
   and accents. Comparison runs over this, not over the literal text. */
export function alignKey(s) {
  return stripDiacritics(String(s || ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/* strict decides how hard to filter — the two prompts want different things
   here.

   The verb prompt forbids articles outright ("no articles"), so a "der" in
   front of "ist" is always bycatch and goes.

   The word prompt allows them explicitly, "unless they belong to the term
   itself" — and in "Las + Canteras" or "de + nuevo" they do. There a
   function word falls only when it stands ALONE; otherwise the frame would
   sit in the middle of the term. */
export function alignFragments(field, strict, codes) {
  const raw = String(field || "")
    .split("+")
    .map(stripQuotes)
    .filter((s) => s && s !== "-");
  if (!strict && raw.length > 1) return raw;
  return raw.filter((s) => !isFunctionWord(s, codes));
}

/* Returns { a, b, notes }. notes records every row that did not land on its
   own line — the first place to look when a colour does not match its table
   row.

   columns is how many translations were asked about. With two panels instead
   of three there is only one, and then the answer has two fields rather than
   three and b stays empty throughout. */
export function parseAlign(raw, expected, label, codes, columns = 2) {
  const rows = [];
  for (const line of String(raw || "").split(/\r?\n/)) {
    const L = cleanLine(line);
    if (!L) continue;
    const parts = L.split("|");
    if (parts.length < columns + 1) continue;
    const strict = label === "Verb";
    rows.push({
      key: alignKey(stripQuotes(parts[0])),
      raw: stripQuotes(parts[0]),
      a: alignFragments(parts[1], strict, codes),
      b: columns > 1 ? alignFragments(parts[2], strict, codes) : [],
    });
  }

  const keys = (expected || []).map(alignKey);
  /* Without an expectation list only position remains — the old way. */
  if (!keys.length) {
    return { a: rows.map((r) => r.a), b: rows.map((r) => r.b), notes: [] };
  }

  const name = label || "Assignment";
  const notes = [];
  const a = keys.map(() => []);
  const b = keys.map(() => []);
  const taken = keys.map(() => false);
  const place = (idx, row) => {
    taken[idx] = true;
    a[idx] = row.a;
    b[idx] = row.b;
  };

  /* First pass: field 1 matches an expected entry exactly. */
  let leftover = [];
  rows.forEach((row, position) => {
    const idx = keys.findIndex((k, j) => !taken[j] && k === row.key);
    if (idx === -1) {
      leftover.push(row);
      return;
    }
    if (idx !== position) {
      notes.push(`${name}: "${row.raw}" came as row ${position + 1}, belongs on ${idx + 1}`);
    }
    place(idx, row);
  });

  /* Second pass: the model sometimes shortens field 1 or attaches a pronoun
     — "con" for "con evasivas", "se sustituyen" for "sustituyen". Both seen
     in real runs. If exactly one free entry sits inside the key or the other
     way round, the match is unambiguous; with several it is not, and the row
     goes on to the position fallback. */
  const stillLeft = [];
  for (const row of leftover) {
    let hit = -1;
    for (let j = 0; j < keys.length; j++) {
      if (taken[j]) continue;
      if (!containsWord(keys[j], row.key) && !containsWord(row.key, keys[j])) continue;
      if (hit !== -1) {
        hit = -1;
        break;
      }
      hit = j;
    }
    if (hit === -1) {
      stillLeft.push(row);
      continue;
    }
    place(hit, row);
    notes.push(`${name}: "${row.raw}" matched to "${expected[hit]}" by name`);
  }
  leftover = stillLeft;

  /* Rows whose field 1 fits no entry go into the free slots in order. That
     makes the result never worse than the purely position-based assignment
     it replaced: if the model renames every field, exactly that comes out
     again. */
  for (const row of leftover) {
    const free = taken.indexOf(false);
    if (free === -1) {
      notes.push(`${name}: "${row.raw}" fits no entry and is left lying`);
      continue;
    }
    place(free, row);
    notes.push(`${name}: "${row.raw}" fits no entry, placed on ${free + 1} by position`);
  }

  keys.forEach((_, i) => {
    if (!taken[i]) notes.push(`${name}: "${expected[i]}" without a row`);
  });

  return { a, b, notes };
}

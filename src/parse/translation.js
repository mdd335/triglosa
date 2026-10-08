/* Reading back a whole text the model translated.

   The prompt asks for the translation and nothing else, and every model
   obeys that most of the time. Now and then one writes what it is about to
   do first — "I'll translate the Spanish text into German, preserving the
   formatting and meaning.", a rule of dashes, then the translation — and
   that went into the panel word for word, above a horizontal line, in the
   model's own language rather than the panel's. A panel is the one place in
   the window where the model's answer is shown whole, so nothing catches it
   further down.

   What can be taken off is only what the original does not have. Both cues
   below are checked against the text that was translated: a text that
   carries its own rule of dashes or its own opening line keeps them. */

/* A rule drawn across the page: three or more of one character, nothing
   else on the line. Markdown's way of separating, and what the model reaches
   for to set its remark apart from the answer. */
const RULE = /^\s*([-–—_=*~])\1{2,}\s*$/;

/* A fence, with or without a language after it. */
const FENCE = /^\s*(?:```|~~~)\s*\w*\s*$/;

function lines(text) {
  return String(text || "").replace(/\r\n?/g, "\n").split("\n");
}

function has(text, pattern) {
  return lines(text).some((line) => pattern.test(line));
}

/* The remark before a rule of dashes. It is a remark and not the first
   paragraph of the answer when it is one paragraph, it is shorter than what
   follows, and the original has no such rule of its own. */
function pastRule(rows, source) {
  if (has(source, RULE)) return rows;
  const at = rows.findIndex((line) => RULE.test(line));
  if (at < 1) return rows;
  const before = rows.slice(0, at).join("\n").trim();
  const after = rows.slice(at + 1).join("\n").trim();
  if (!after || /\n\s*\n/.test(before) || before.length >= after.length) return rows;
  return lines(after);
}

/* An announcing line: it ends in a colon, a blank line follows it, the
   original opens with no such line, and what follows is longer. */
function pastOpening(rows, source) {
  const first = (rows[0] || "").trim();
  if (!first.endsWith(":") || rows.length < 3 || rows[1].trim()) return rows;
  if ((lines(source)[0] || "").trim().endsWith(":")) return rows;
  const rest = rows.slice(2).join("\n").trim();
  if (!rest || first.length >= rest.length) return rows;
  return lines(rest);
}

/* A whole answer wrapped in a fence, which the original is not. */
function unfenced(rows, source) {
  if (has(source, FENCE)) return rows;
  if (!FENCE.test(rows[0] || "")) return rows;
  const end = rows.length - 1 - [...rows].reverse().findIndex((line) => FENCE.test(line));
  if (end <= 0) return rows;
  return rows.slice(1, end);
}

/* The translation alone. `source` is the text that was translated — every
   cue is only a cue where the original does not carry it too. */
export function readTranslation(raw, source = "") {
  let rows = lines(String(raw || "").trim());
  rows = unfenced(rows, source);
  rows = pastRule(rows, source);
  rows = pastOpening(rows, source);
  return rows.join("\n").trim();
}

/* String primitives shared by parsing, matching and rendering.
   Pure functions only: no DOM, no settings, no I/O. */

/* Letters, digits and combining marks of any script, so that a word holds
   together whatever it is written in: "fármaco" is one word and not three,
   and so are ходатайства and الصيانة.

   It used to name the Latin-1 and Extended-A ranges outright, which made
   every Cyrillic and Arabic character a separator. Word boundaries are what
   the whole of matching rests on, so under those two scripts nothing could
   be found at all except by accident. */
export function isWordChar(ch) {
  return !!ch && /[\p{L}\p{N}\p{M}]/u.test(ch);
}

/* Drops what a script treats as decoration, so two spellings of one word
   compare equal. Note that verb analysis deliberately does NOT use this:
   "hablo" and "habló" are different tenses.

   It used to decompose everything and drop every combining mark, which is
   right for Latin and wrong elsewhere: й came apart into и plus a breve and
   lost the breve, so мой compared equal to мои — two different words. The
   mark is only dropped where a Latin letter carries it.

   What each script needs instead:

     Cyrillic  ё and е are written interchangeably in running text, so those
               fold; и and й are two letters and do not
     Arabic    the vowel marks are optional in writing, so a model may answer
               with them where the text has none. The alef variants and the
               alef maqsura are interchanged as freely, and the tatweel is
               a stretch mark carrying no sound at all */
const ARABIC_MARKS = /[\u064b-\u0652\u0670\u0640]/g;

export function stripDiacritics(s) {
  const x = String(s || "");
  if (!x.normalize) return x;
  return x
    .normalize("NFD")
    .replace(/([A-Za-z\u00c0-\u024f])[\u0300-\u036f]+/g, "$1")
    .normalize("NFC")
    .replace(/[ёЁ]/g, (c) => (c === "ё" ? "е" : "Е"))
    .replace(ARABIC_MARKS, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064a");
}

/* Splits text into alternating word and non-word runs covering it
   completely, so the pieces can be reassembled without loss. */
export function toTokens(text) {
  const s = String(text || "");
  const out = [];
  let i = 0;
  while (i < s.length) {
    const isWord = isWordChar(s.charAt(i));
    let j = i;
    while (j < s.length && isWordChar(s.charAt(j)) === isWord) j++;
    out.push({ text: s.slice(i, j), start: i, end: j, isWord });
    i = j;
  }
  return out;
}

/* First occurrence of needle as a whole word, or -1. Word boundaries
   matter: "ser" must not match inside "conocerse". */
export function wordIndexOf(haystack, needle) {
  if (!haystack || !needle) return -1;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    const end = i + needle.length;
    const left = !isWordChar(needle.charAt(0)) || !isWordChar(haystack.charAt(i - 1));
    const right =
      !isWordChar(needle.charAt(needle.length - 1)) || !isWordChar(haystack.charAt(end));
    if (left && right) return i;
    i = haystack.indexOf(needle, i + 1);
  }
  return -1;
}

/* Does needle appear as a word of its own? "en" is not in "ensayo". */
export function containsWord(haystack, needle) {
  return wordIndexOf(haystack, needle) !== -1;
}

/* Strips list bullets and numbering the model puts in front of a line. A
   hyphen counts as a bullet only with a space behind it: "-tional" is a
   piece of a word, and read as a bullet it became a synonym. */
export function cleanLine(line) {
  return String(line || "")
    .trim()
    .replace(/^(?:[-*]\s+|•\s*)/, "")
    .replace(/^\d+[.)]\s*/, "");
}

/* Trim first: otherwise the $ anchor misses a closing quote that has
   trailing whitespace behind it.

   A field wrapped whole in angle brackets goes the same way. Every prompt
   marks its fields as <term> and tells the model not to write the brackets;
   the local model writes them anyway, and a spot of "<caught me>" stands
   nowhere in the translation, so the word was never marked there. The cloud
   model once wrote the field as markup instead, <target>ungeduldig</target>. */
export function stripQuotes(s) {
  return String(s || "")
    .trim()
    .replace(/^<([^<>]*)>$/, "$1")
    .replace(/^<(\w+)>([^<>]*)<\/\1>$/, "$2")
    /* And half of one, where the model opened a bracket in one field and
       closed it in the next: "<Zuständigkeit", "können>". */
    .replace(/^<(?=[^\s<>])|(?<=[^\s<>])>$/g, "")
    .trim()
    .replace(/^["„“‘’'«‹]+/, "")
    /* A closing quote whose opening one stands inside the field belongs to
       it: Widerstandsgruppe „Weiße Rose". Guillemets count too — a French,
       Italian or Russian reader's answers come in them, with a space inside
       in French. */
    .replace(/^([^"„“‘’'«‹]*?)["“”‘’'»›]+$/, "$1")
    .trim();
}

/* Removes what a model wraps around its answer: reasoning blocks and
   fenced code markers. */
export function stripModelWrapping(t) {
  return String(t || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*```[a-zA-Z]*\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

/* A text cut into sentences, each keeping its own punctuation.

   The delimiters are the ones the eight supported languages end a sentence
   with, Arabic's question mark and full stop among them. What is deliberately
   not here is a list of abbreviations — that would be a language named
   outside a language pack, and it would cover the languages it was written in
   and no others. What stands in its place is a rule that needs no words: a
   piece whose last word before the stop is a **single letter** is an
   abbreviation and not the end of anything, so "z. B." and "e. g." stay in
   one piece. One-letter words do not end sentences in any of the eight. */
export function toSentences(text) {
  const out = [];
  for (const piece of String(text || "").split(/(?<=[.!?…؟۔])[ \t]*(?:\n|(?=\S))/)) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const previous = out[out.length - 1];
    if (previous && /(?:^|\s)\p{L}\.$/u.test(previous)) {
      out[out.length - 1] = `${previous} ${trimmed}`;
    } else {
      out.push(trimmed);
    }
  }
  return out;
}

/* Which sentence a word stands in, as an index, or -1.

   Two passes: the word as a word of its own first, then as a fragment
   anywhere — a split verb's "winkte + ab", or an inflected form the
   alignment gave back in another shape. */
export function sentenceIndexOf(sentences, word) {
  const needle = String(word || "").trim();
  if (!needle) return -1;
  const found = sentences.findIndex((sentence) => containsWord(sentence, needle));
  if (found !== -1) return found;
  const low = needle.toLowerCase();
  return sentences.findIndex((sentence) => sentence.toLowerCase().includes(low));
}

/* The one sentence a word stands in — what belongs on a card as its example.

   A whole reading does not: the card is about one word, and a paragraph on
   the back of it is not an example but the text the reader already had.
   Putting the lot on there is bearable while a reading is a sentence and is
   not once it is a page.

   `at` — `{ index, total }` — is a second way of finding it, for the side of
   a card where the word being searched for is not the word itself: the
   sentence in the *same place* as the one already picked out of the other
   text. It is tried after the word and only where both texts have the same
   number of sentences.

   That condition is what makes it safe rather than clever. A translation
   keeps a text's sentence for sentence far more reliably than it keeps any
   one word — the word being searched for over there is an equivalent some
   other question answered, and the translator may well have chosen a
   different one. Measured on a real reading: the meaning question answered
   "Raumproblem" where the panel said "Platzproblem", so nothing was found
   and the whole two-sentence translation went onto the card.

   Where neither finds anything: a single sentence is an example whether or
   not the lookup worked, and more than one is not — a wrong sentence is worse
   on a card than none. */
export function sentenceWith(text, word, at = null) {
  const sentences = toSentences(text);
  if (!sentences.length) return "";
  const found = sentenceIndexOf(sentences, word);
  if (found !== -1) return sentences[found];
  if (at && at.index >= 0 && at.total === sentences.length) return sentences[at.index];
  return sentences.length === 1 ? sentences[0] : "";
}

export function wordCount(s) {
  return (String(s || "").trim().match(/\S+/g) || []).length;
}

/* Bring a list into the order its entries appear in the text.

   Both sections are read alongside the sentence, so they have to stand in
   its order — the eye jumps between sentence and list, and a different order
   turns that into a search every time. The model does not deliver the order
   reliably: for words it sorts by difficulty, and for verbs it keeps "in the
   exact order they appear" often, but not always.

   field names the property holding the wording, empty for a list of plain
   strings. What is not found stays at the back; a tie keeps the order it
   had. */
export function orderByTextPosition(list, text, field) {
  const low = String(text || "").toLowerCase();
  return (list || [])
    .map((entry, i) => {
      const wording = String((field ? entry[field] : entry) || "").toLowerCase();
      /* A form the text splits, "winkte + ab", stands where its first part
         does — searched for whole it stood nowhere and went to the end. */
      const at = wordIndexOf(low, wording.includes("+") ? wording.split("+")[0].trim() : wording);
      return { entry, i, pos: at === -1 ? Infinity : at };
    })
    .sort((a, b) => (a.pos !== b.pos ? a.pos - b.pos : a.i - b.i))
    .map((x) => x.entry);
}

/* A field the model joined with a plus or an ellipsis, written as running
   text. "de + nuevo" stands in the text as "de nuevo", and then it is ONE
   spot rather than two side by side. */
export function flattenField(s) {
  return String(s || "")
    .replace(/\s*\+\s*/g, " ")
    .replace(/\s*(?:\.{2,}|…)\s*/g, " … ")
    .trim();
}

/* "a German reader", but "an English reader" — and "an Arabic dictionary".
   With eight languages in the same slot the article has to be chosen. */
export function withArticle(name) {
  return `${/^[aeiou]/i.test(String(name || "")) ? "an" : "a"} ${name}`;
}

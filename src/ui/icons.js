/* The symbols on the buttons in a reading, and beside the settings' pages.

   Drawn rather than fetched: an icon font is a dependency and a network
   request, and six paths are smaller than either. All of them are strokes on
   a 16 px square in the current colour, so a button in either colour scheme
   needs no second version.

   The word each one stands for is not here — it comes from labels.js and
   reaches the button as its accessible name and as the label shown under it
   on hover, so a symbol nobody recognises is one hover away from saying what
   it does. */

const PATHS = {
  /* The arrow the rows use between a form and its base: this becomes that. */
  translate: '<path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/>',
  /* A pencil: changing what stands there. */
  edit: '<path d="M11.2 2.6 13.4 4.8 5.6 12.6 3 13l.4-2.6z"/>',
  /* Two sheets, the front one on top. */
  copy: '<rect x="5.5" y="5" width="8" height="8" rx="1.8"/>'
    + '<path d="M10.5 3h-6a2 2 0 0 0-2 2v6"/>',
  /* An arrow running into a text cursor: this text, where the cursor is. */
  insert: '<path d="M2.5 8h6.5M6.5 5.5 9 8l-2.5 2.5"/><path d="M12 3.5v9M10.8 3.5h2.4M10.8 12.5h2.4"/>',
  /* A table with a first row and a first column: the conjugation table, which
     is what the page that opens actually shows. */
  conjugation: '<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/>'
    + '<path d="M2.5 6.6h11M6.4 6.6v5.9"/>',
  /* A loudspeaker with one wave in front of it: the word said aloud. */
  speak: '<path d="M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z"/><path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.9a5.8 5.8 0 0 1 0 8.2"/>',
  /* A magnifying glass: the web search. */
  search: '<circle cx="7" cy="7" r="4.3"/><path d="m10.2 10.2 3.3 3.3"/>',
  /* A phone's paste: the Translate arrow in a circle, nothing typed first. */
  paste: '<circle cx="8" cy="8" r="6"/><path d="M5.3 8h5.2M8.3 5.7 10.6 8l-2.3 2.3"/>',
  /* A card cut across the middle: a front and a back, which is what a
     flashcard is and what the layer it opens shows. It may not look like the
     copy symbol, which stands in the same row. */
  card: '<rect x="2.2" y="4" width="11.6" height="8" rx="1.6"/><path d="M2.2 8h11.6"/>',
  /* A phone's blank card: the card symbol, smaller, with the plus of "one
     more" at its corner. */
  newCard: '<path d="M3.3 3h6.4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H3.3a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 3.3 3zM1.8 6.4h9.4M13.2 10.6v4M11.2 12.6h4"/>',
  /* The two chevrons the title bar steps through the kept readings with, and
     a look-up through the words one synonym led to another. */
  previous: '<path d="M10 3.5 5.5 8l4.5 4.5"/>',
  /* A translation's fold: pointing down while its text stands under it, and
     sideways — the "next" chevron — once it is folded away. */
  open: '<path d="M3.5 6 8 10.5 12.5 6"/>',
  next: '<path d="M6 3.5 10.5 8 6 12.5"/>',
  /* A cross: the way out of the card. It stands where a window's own close
     button stands, at the top right, and the two written buttons below are
     then only the two that do something. */
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  /* A pushpin, its body a part of its own: pinned, it fills in. */
  pin: '<path class="pin-body" d="M5.5 2.5h5M6.6 2.5v3.8L4.5 9.5h7L9.4 6.3V2.5"/><path d="M8 9.5v4"/>',
  /* A plus: one more of something, where the row it ends holds them. */
  add: '<path d="M8 3v10M3 8h10"/>',
  /* Two four-pointed sparkles, a large one and a small one: the card
     rewritten by the model, in the sign most programs now use for that. */
  improve: '<path d="M6.2 4.4c1.2 3.7 1.2 3.7 4.9 4.9-3.7 1.2-3.7 1.2-4.9 4.9-1.2-3.7-1.2-3.7-4.9-4.9 3.7-1.2 3.7-1.2 4.9-4.9z"/>'
    + '<path d="M12.3 1.2c.65 1.95.65 1.95 2.6 2.6-1.95.65-1.95.65-2.6 2.6-.65-1.95-.65-1.95-2.6-2.6 1.95-.65 1.95-.65 2.6-2.6z"/>',
  /* An arrow turning back on itself: the card as it was before. */
  undo: '<path d="M5.5 3.8 2.6 6.7l2.9 2.9"/><path d="M2.6 6.7h7.2a3.4 3.4 0 0 1 0 6.8H7"/>',
  /* Lines of text with a plus: the longer explanation. */
  more: '<path d="M2.5 4h11M2.5 7.5h11M2.5 11h5.5"/><path d="M12 9.5v5M9.5 12h5"/>',
  /* A quotation mark with a plus: one more example sentence under the longer
     explanation. */
  example: '<path d="M2.5 9.2c0-3.1 1.4-4.8 3.4-5.4"/><rect x="2.5" y="8.8" width="3.2" height="3.4" rx="0.6"/>'
    /* The same plus as the longer explanation carries, in the same place:
       the two buttons stand side by side and both add something. */
    + '<path d="M12 9.5v5M9.5 12h5"/>',
  /* A chevron up over a chevron down: a list to choose from, the way the
     system draws a pop-up button. Two chevrons and not one, since a single
     one in a heading means a fold. */
  choose: '<path d="M5 6.2 8 3.4l3 2.8M5 9.8l3 2.8 3-2.8"/>',
  /* A panel with a plus under it: one more panel, apart from the title
     bar's plus, which is a blank sheet. */
  addPanel: '<rect x="2" y="1.8" width="12" height="4.4" rx="1.3"/><path d="M8 8.6v5.8M5.1 11.5h5.8"/>',
  /* A camera: a photograph's text, taken now. */
  camera: '<path d="M2.5 5.5h2.6l1.2-1.8h3.4l1.2 1.8h2.6v7.2h-11z"/><circle cx="8" cy="9" r="2.3"/>',
  /* A picture with a hill and a sun: one from the photo library. */
  photos: '<rect x="2.2" y="3" width="11.6" height="10" rx="1.6"/><path d="m2.6 11.4 3.4-3.4 2.6 2.6 1.6-1.6 3.2 3.2"/><circle cx="10.6" cy="6" r="1"/>',
  /* A folder: a picture from the Files app. */
  files: '<path d="M2 4.6c0-.7.5-1.2 1.2-1.2h3l1.4 1.6h5.2c.7 0 1.2.5 1.2 1.2v6c0 .7-.5 1.2-1.2 1.2H3.2c-.7 0-1.2-.5-1.2-1.2z"/>',
  /* A card with a star on it, as Anki's own symbol has one: the card into
     its deck, or the deck to choose. */
  anki: '<rect x="2" y="2" width="12" height="12" rx="2.6"/><path d="M8.00 4.35L9.03 7.03 11.90 7.18 9.66 8.99 10.41 11.77 8.00 10.20 5.59 11.77 6.34 8.99 4.10 7.18 6.97 7.03z"/>',
  /* A gear, as the title bar's: the settings. */
  settings: '<circle cx="8" cy="8" r="3.9"/><circle cx="8" cy="8" r="1.5"/><path d="M12.60 8.00L14.10 8.00M11.25 11.25L12.31 12.31M8.00 12.60L8.00 14.10M4.75 11.25L3.69 12.31M3.40 8.00L1.90 8.00M4.75 4.75L3.69 3.69M8.00 3.40L8.00 1.90M11.25 4.75L12.31 3.69"/>',
  /* What a button shows for a moment once it has done its work. */
  done: '<path d="m3.5 8.4 3 3 6-6.8"/>',

  /* The settings' pages, in the list beside them. A globe: the languages. */
  languages: '<circle cx="8" cy="8" r="5.6"/>'
    + '<path d="M2.4 8h11.2M8 2.4c-2.1 3-2.1 8.2 0 11.2M8 2.4c2.1 3 2.1 8.2 0 11.2"/>',
  /* Two arrows passing each other: one language into another and back. */
  translations: '<path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13"/>',
  /* A list with its marks: the rows a reading lists. */
  sections: '<path d="M6 4.5h7.5M6 8h7.5M6 11.5h7.5M2.6 4.5h.4M2.6 8h.4M2.6 11.5h.4"/>',
  /* A window with its title bar. */
  window: '<rect x="2" y="3" width="12" height="10" rx="1.6"/><path d="M2 6h12"/>',
  /* A keyboard. */
  keyboard: '<rect x="1.6" y="4" width="12.8" height="8" rx="1.5"/>'
    + '<path d="M4.2 6.7h.4M6.7 6.7h.4M9.2 6.7h.4M11.7 6.7h.4M5.2 9.4h5.6"/>',
  /* A circled i: about the app. */
  about: '<circle cx="8" cy="8" r="5.6"/><path d="M8 7.4v3.6M8 5.1h.01"/>',
};

/* A symbol's drawing alone, for the title bar's buttons, which are written
   as markup with a stroke of their own (app.js). */
export const iconPaths = (name) => PATHS[name] || "";

/* One <svg>, built as a node rather than as a string: the button it goes into
   is a node too, and nothing here ever touches innerHTML with something that
   came from outside this file. */
export function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.4");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  /* The word beside it is the accessible name; the drawing is decoration. */
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = PATHS[name] || "";
  return svg;
}


/* The symbols on the buttons in a reading.

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
  copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.8"/>'
    + '<path d="M10.5 3.5h-6a2 2 0 0 0-2 2v6"/>',
  /* An arrow running into a text cursor: this text, where the cursor is. */
  insert: '<path d="M2.5 8h6.5M6.5 5.5 9 8l-2.5 2.5"/><path d="M12 3.5v9M10.8 3.5h2.4M10.8 12.5h2.4"/>',
  /* A table with a first row and a first column: the conjugation table, which
     is what the page that opens actually shows. */
  conjugation: '<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/>'
    + '<path d="M2.5 6.6h11M6.4 6.6v5.9"/>',
  /* A magnifying glass: the web search. */
  search: '<circle cx="7" cy="7" r="4.3"/><path d="m10.2 10.2 3.3 3.3"/>',
  /* A card cut across the middle: a front and a back, which is what a
     flashcard is and what the layer it opens shows. Two sheets offset behind
     one another was the first drawing and it was the copy symbol again —
     these two stand in the same row, so they may not look alike. */
  card: '<rect x="2.2" y="4" width="11.6" height="8" rx="1.6"/><path d="M2.2 8h11.6"/>',
  /* Back to where the look-up came from. */
  /* The two chevrons the title bar steps through the kept readings with, here
     stepping through the words one synonym led to another. */
  previous: '<path d="M10 3.5 5.5 8l4.5 4.5"/>',
  /* A translation's fold: pointing down while its text stands under it, and
     sideways — the "next" chevron — once it is folded away. */
  open: '<path d="M3.5 6 8 10.5 12.5 6"/>',
  next: '<path d="M6 3.5 10.5 8 6 12.5"/>',
  /* A cross: the way out of the card. It stands where a window's own close
     button stands, at the top right, and the two written buttons below are
     then only the two that do something. */
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  /* A wand with a spark at its tip: the card rewritten by the model. */
  improve: '<path d="M2.8 13.2 10 6"/><path d="m9 5 2 2"/><path d="M12.5 1.8v2.6M11.2 3.1h2.6M13.8 7.2v1.6M13 8h1.6M8 1.6v1.2M7.4 2.2h1.2"/>',
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
  /* What a button shows for a moment once it has done its work. */
  done: '<path d="m3.5 8.4 3 3 6-6.8"/>',
};

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


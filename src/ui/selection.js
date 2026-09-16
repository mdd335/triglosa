/* Picking a word out of a panel, by click or by dragging across several.

   Only panels drawn word by word take part; a panel still standing as plain
   text keeps the system's own selection. */

const wordSpan = (node) => {
  while (node && node !== document) {
    if (node.nodeType === 1 && node.classList?.contains("w")) return node;
    node = node.parentNode;
  }
  return null;
};

const markSpan = (node) => {
  while (node && node !== document) {
    if (node.nodeType === 1 && node.classList?.contains("mark")) return node;
    node = node.parentNode;
  }
  return null;
};

const spanOf = (element) => ({
  start: Number(element.dataset.from),
  end: Number(element.dataset.to),
});

/* A click inside a coloured mark takes the whole term, not the one word under
   the pointer: the colour says the term belongs together, and taking half of
   it back would contradict what the reader just saw. */
function fromClick(target) {
  const mark = markSpan(target);
  if (mark) {
    return { start: Number(mark.dataset.markFrom), end: Number(mark.dataset.markTo) };
  }
  const word = wordSpan(target);
  return word ? spanOf(word) : null;
}

/* panel is the index the panel has; onPick gets { panel, start, end } once the
   pointer is released. */
export function watchSelection(box, panel, onPick) {
  let anchor = null;

  const extend = (target) => {
    const word = wordSpan(target);
    if (!word || !anchor) return;
    const here = spanOf(word);
    onPick({
      panel,
      start: Math.min(anchor.start, here.start),
      end: Math.max(anchor.end, here.end),
      dragging: true,
    });
  };

  box.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    const word = wordSpan(event.target);
    if (!word) return;
    event.preventDefault();
    anchor = spanOf(word);
    const range = fromClick(event.target);
    if (range) onPick({ panel, ...range, dragging: true });

    const move = (moved) => extend(moved.target);
    const up = (released) => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      const word = wordSpan(released.target);
      /* Released on the word it started on: that is a click, and a click
         inside a mark takes the whole term. */
      const range = word && word !== box && anchor.start === spanOf(word).start
        ? fromClick(released.target)
        : null;
      if (range) onPick({ panel, ...range });
      else if (word) {
        const here = spanOf(word);
        onPick({
          panel,
          start: Math.min(anchor.start, here.start),
          end: Math.max(anchor.end, here.end),
        });
      } else onPick({ panel, ...anchor });
      anchor = null;
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

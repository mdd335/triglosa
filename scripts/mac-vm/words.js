/* global document, window, NodeFilter */
// Every word of the test page and where its middle stands on the screen,
// one "word<TAB>x<TAB>y<TAB>sentence" line each. A picture's and a canvas's
// words are measured in the type page.html draws them in.
(() => {
  /* A window's border is as wide below as at either side: the rest of
     what lies outside the page is above it. */
  const side = (window.outerWidth - window.innerWidth) / 2;
  const top = window.screenY + window.outerHeight - window.innerHeight - side;
  const left = window.screenX + side;
  const sentences = (text) => text.match(/[^.!?]+[.!?]?/g).map((s) => s.trim()).filter(Boolean);
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode());) {
    const block = node.parentElement.closest("p, h2");
    if (!block) continue;
    const whole = block.textContent.replace(/\s+/g, " ").trim();
    for (const match of node.data.matchAll(/[\p{L}\p{N}]+/gu)) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const box = range.getBoundingClientRect();
      const before = document.createRange();
      before.setStart(block, 0);
      before.setEnd(node, match.index);
      const at = before.toString().replace(/\s+/g, " ").trimStart().length;
      let start = 0;
      const sentence = sentences(whole).find((s) => {
        start = whole.indexOf(s, start);
        const end = start + s.length;
        if (at < end) return true;
        start = end;
        return false;
      }) || whole;
      out.push([match[0], Math.round(left + box.left + box.width / 2), Math.round(top + box.top + box.height / 2), sentence].join("\t"));
    }
  }
  for (const canvas of document.querySelectorAll("canvas[data-text]")) {
    const box = canvas.getBoundingClientRect();
    const pen = document.createElement("canvas").getContext("2d");
    pen.font = canvas.dataset.font;
    const whole = canvas.dataset.text.replace("|", " ");
    canvas.dataset.text.split("|").forEach((line, row) => {
      for (const match of line.matchAll(/[\p{L}\p{N}]+/gu)) {
        const x = box.left + Number(canvas.dataset.left) + pen.measureText(line.slice(0, match.index)).width + pen.measureText(match[0]).width / 2;
        const y = box.top + Number(canvas.dataset.top) + (row + 0.5) * Number(canvas.dataset.line);
        const at = whole.indexOf(line) + match.index;
        let start = 0;
        const sentence = sentences(whole).find((s) => {
          start = whole.indexOf(s, start);
          if (at < start + s.length) return true;
          start += s.length;
          return false;
        });
        out.push([match[0], Math.round(left + x), Math.round(top + y), sentence].join("\t"));
      }
    });
  }
  for (const picture of document.querySelectorAll("img[data-text]")) {
    const box = picture.getBoundingClientRect();
    const text = picture.dataset.text;
    const pen = document.createElement("canvas").getContext("2d");
    pen.font = "30px Georgia";
    const width = (part) => pen.measureText(part).width * box.width / picture.width;
    for (const match of text.matchAll(/\S+/g)) {
      const x = box.left + 16 * box.width / picture.width + width(text.slice(0, match.index)) + width(match[0]) / 2;
      out.push([match[0], Math.round(left + x), Math.round(top + box.top + box.height * 0.55), text].join("\t"));
    }
  }
  return out.join("\n");
})();

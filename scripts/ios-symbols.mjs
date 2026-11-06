/* The Control Center's symbols (author 2026-11-06): Triglosa's own, filled
   and in two tones as the system's own controls are, or in one where the
   control draws only one. Open Triglosa is the app's mark, a book with lines
   of text on its pages as on the app's icon; the others are the book (a
   reading), the app's card (a card) or a camera, each with a badge at the
   bottom right — a plus for something new (a photograph too), the paste
   button's arrow for what was copied.

   A template holds filled shapes only, so the strokes are outlined, and the
   shapes added and cut, by CoreGraphics (ios-symbols.swift). The three
   weights a template has are one drawing: a control is drawn in one weight.

     node scripts/ios-symbols.mjs <folder>              writes <folder>/Controls/Symbols.xcassets
                                                        and the share actions' icons
     node scripts/ios-symbols.mjs --preview <file.png>  draws them beside some of the system's
     node scripts/ios-symbols.mjs --sizes               their width and height at 100 points

   scripts/ios.mjs writes them into the generated project at every build,
   and the share menu's two actions' icons from them (SHARE_ICONS). */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* A 16-unit square as 100-point type sets it, centred on the middle of the
   capitals: the book, the card and the camera themselves as wide as the
   system's book, rectangle and camera (`--sizes`), a badge standing out over
   them as the system's do. */
const SCALE = 7.6;
const MIDDLE = -35.27;
/* Room beside a symbol's shape, inside its margins, as the system's own have it. */
const SIDE = 12;

/* ---- The drawings, on the 16-unit square ---- */

/* The menu bar's mark, an open book, as it stands in its own file, put on
   the square: its outline filled, its spine a gap, lines of text of several
   lengths on each page as the app's icon has them. Alone the book is bright
   and its lines in the lighter tone; under a badge, as the system's own
   badged symbols are, the book is the lighter and its lines bright, and the
   right page's lines stop short of the badge. */
function book({ badged = false } = {}) {
  const svg = readFileSync(join(root, "src-tauri/icons/tray.svg"), "utf8");
  const outline = svg.match(/<path d="([^"]*Z)"/)[1];
  const fit = 0.8;
  const place = (x, y) => [8 + (x - 12) * fit, 8 + (y - 12) * fit];
  /* Along a page's top edge, which falls toward the spine, a little less
     steeply than the edge. */
  const top = (x) => 5.3 + (x - 5.69) / 4.5;
  /* Left-aligned as text is, the longest in the middle of its page. */
  const left = [[4.7, 9.5, 3.4], [4.7, 8.9, 6.1], [4.7, 7.7, 8.8]];
  const right = badged
    ? [[14.5, 18.7, 3.4], [14.5, 18.1, 6.1], [14.5, 16.3, 8.8]]
    : [[14.5, 18.7, 3.4], [14.5, 19.3, 6.1], [14.5, 17.5, 8.8]];
  const lines = [
    ...left.map(([from, to, below]) => `M${from} ${top(from) + below}L${to} ${top(to) + below}`),
    ...right.map(([from, to, below]) => `M${from} ${top(24 - from) + below}L${to} ${top(24 - to) + below}`),
  ].join("");
  return [
    { layer: 0, op: "fill", svg: `<path d="${outline}"/>`, place },
    { layer: 0, op: "stroke", width: 1.9 * fit, svg: `<path d="${outline}"/>`, place },
    { op: "cut", width: 0.9, svg: '<path d="M12 6.2V20.4"/>', place },
    { op: "cut", width: 1.05, svg: `<path d="${lines}"/>`, place },
    { layer: 1, op: "stroke", width: 1.05, svg: `<path d="${lines}"/>`, place },
  ];
}
const BOOK_ALONE = [{}, { secondary: true, hiddenAlone: true }];
const BOOK_BADGED = [{ secondary: true }, { hiddenAlone: true }];
const BOOK_BADGE = { x: 15.3, y: 12.8, r: 4.6 };
/* The badge's layer, outside the margins (template). */
const BADGE = { badge: true };

/* A flashcard as the app draws one: its outline, and a line across the
   middle between front and back, both one tone. Filled, or with the line
   higher, it reads as a bank card. */
const CARD = { x: 1.3, y: 2.95, width: 13.4, height: 10.1, r: 2.1 };
function card() {
  const { x, y, width, height, r } = CARD;
  const across = y + height / 2;
  return [
    { layer: 0, op: "stroke", width: 1.25, svg: `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}"/><path d="M${x} ${across}h${width}"/>` },
  ];
}
const CARD_BADGE = { x: 15.4, y: 13.6, r: 4.6 };

/* A camera, filled, its lens a ring cut into it. */
function camera() {
  return [
    { layer: 0, op: "fill", svg: '<rect x="0.4" y="4.1" width="15.2" height="9.7" rx="2.2"/>' },
    { layer: 0, op: "fill", svg: '<path d="M4.8 4.4 6.2 2.2H9.8L11.2 4.4Z"/>' },
    { layer: 0, op: "stroke", width: 1, svg: '<path d="M4.8 4.4 6.2 2.2H9.8L11.2 4.4"/>' },
    { layer: 0, op: "cut", svg: '<circle cx="8" cy="9.1" r="3.7"/>' },
    { layer: 0, op: "fill", svg: '<circle cx="8" cy="9.1" r="2.5"/>' },
  ];
}
/* A little smaller than the others': beside the camera's low body the same
   badge looked larger (author 2026-11-06). */
const CAMERA_BADGE = { x: 15.3, y: 13.6, r: 4.3 };

/* A badge at the bottom right, bright over the lighter shape under it, as
   the system's are: a filled circle, the gap round it cut from what lies
   under it, and a plus or the paste button's arrow cut out of it. */
/* As large as the plus or the arrow tells two controls of one shape apart
   at the Control Center's size (author 2026-11-06). */
function badge(at, layer, mark) {
  const { x, y, r } = at;
  const inside = mark === "plus"
    ? `M${x - r * 0.53} ${y}h${r * 1.06}M${x} ${y - r * 0.53}v${r * 1.06}`
    : `M${x - r * 0.5} ${y}h${r * 0.94}M${x + r * 0.04} ${y - r * 0.43}l${r * 0.43} ${r * 0.43}-${r * 0.43} ${r * 0.43}`;
  return [
    { op: "cut", svg: `<circle cx="${x}" cy="${y}" r="${r + 0.85}"/>` },
    { layer, op: "fill", svg: `<circle cx="${x}" cy="${y}" r="${r}"/>` },
    { layer, op: "cut", width: r * 0.37, svg: `<path d="${inside}"/>` },
  ];
}

/* What was copied is read with the arrow, something new with the plus (a
   photograph is a new one): on the book a reading, on the card a card. */
export const SYMBOLS = [
  { name: "triglosa.open", layers: BOOK_ALONE, steps: () => book() },
  { name: "triglosa.read.clipboard", layers: [...BOOK_BADGED, BADGE], steps: () => [...book({ badged: true }), ...badge(BOOK_BADGE, 2, "arrow")] },
  { name: "triglosa.read.new", layers: [...BOOK_BADGED, BADGE], steps: () => [...book({ badged: true }), ...badge(BOOK_BADGE, 2, "plus")] },
  { name: "triglosa.card.clipboard", layers: [{ secondary: true }, BADGE], steps: () => [...card(), ...badge(CARD_BADGE, 1, "arrow")] },
  { name: "triglosa.card.new", layers: [{ secondary: true }, BADGE], steps: () => [...card(), ...badge(CARD_BADGE, 1, "plus")] },
  { name: "triglosa.read.photo", layers: [{ secondary: true }, BADGE], steps: () => [...camera(), ...badge(CAMERA_BADGE, 1, "plus")] },
];

/* ---- An SVG drawing as moves, lines and curves ---- */

const MOVE = 0, LINE = 1, CURVE = 2, CLOSE = 3;

/* A circle's quarter as a curve: the handles' share of the radius. */
const QUARTER = 0.5522847498;

function ellipse(cx, cy, rx, ry) {
  const k = QUARTER;
  return [
    [MOVE, cx + rx, cy],
    [CURVE, cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry],
    [CURVE, cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy],
    [CURVE, cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry],
    [CURVE, cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy],
    [CLOSE],
  ];
}

function rounded(x, y, w, h, r) {
  if (!r) return [[MOVE, x, y], [LINE, x + w, y], [LINE, x + w, y + h], [LINE, x, y + h], [CLOSE]];
  const k = r * (1 - QUARTER);
  return [
    [MOVE, x + r, y], [LINE, x + w - r, y], [CURVE, x + w - k, y, x + w, y + k, x + w, y + r],
    [LINE, x + w, y + h - r], [CURVE, x + w, y + h - k, x + w - k, y + h, x + w - r, y + h],
    [LINE, x + r, y + h], [CURVE, x + k, y + h, x, y + h - k, x, y + h - r],
    [LINE, x, y + r], [CURVE, x, y + k, x + k, y, x + r, y], [CLOSE],
  ];
}

/* An elliptical arc as curves of a quarter turn at most (SVG 1.1, F.6). */
function arc(x1, y1, rx, ry, turn, large, sweep, x2, y2) {
  if (!rx || !ry) return [[LINE, x2, y2]];
  const phi = (turn * Math.PI) / 180;
  const cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy, yp = -sin * dx + cos * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const sign = large === sweep ? -1 : 1;
  const numerator = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const co = sign * Math.sqrt(Math.max(0, numerator / (rx * rx * yp * yp + ry * ry * xp * xp)));
  const cxp = (co * rx * yp) / ry, cyp = (-co * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let delta = angle((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const pieces = Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9);
  const step = delta / pieces, handle = (4 / 3) * Math.tan(step / 4);
  const point = (t) => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const tangent = (t) => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const out = [];
  for (let index = 0; index < pieces; index += 1) {
    const a = start + index * step, b = a + step;
    const [ax, ay] = point(a), [bx, by] = point(b), [tax, tay] = tangent(a), [tbx, tby] = tangent(b);
    out.push([CURVE, ax + handle * tax, ay + handle * tay, bx - handle * tbx, by - handle * tby, bx, by]);
  }
  return out;
}

function pathData(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e-?\d+)?/g) || [];
  const out = [];
  let x = 0, y = 0, startX = 0, startY = 0, command = "", index = 0;
  const next = () => Number(tokens[index++]);
  /* A flag may stand against what follows it ("01.2" is 0, 1, .2). */
  const flag = () => {
    const token = tokens[index];
    if (token.length > 1 && /^[01]/.test(token)) { tokens[index] = token.slice(1); return Number(token[0]); }
    index += 1;
    return Number(token);
  };
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++];
    const relative = command === command.toLowerCase();
    const ox = relative ? x : 0, oy = relative ? y : 0;
    switch (command.toUpperCase()) {
      case "M":
        x = ox + next(); y = oy + next(); startX = x; startY = y;
        out.push([MOVE, x, y]);
        command = relative ? "l" : "L";
        break;
      case "L": x = ox + next(); y = oy + next(); out.push([LINE, x, y]); break;
      case "H": x = (relative ? x : 0) + next(); out.push([LINE, x, y]); break;
      case "V": y = (relative ? y : 0) + next(); out.push([LINE, x, y]); break;
      case "C": {
        const [a, b, c, e, f, g] = [next(), next(), next(), next(), next(), next()];
        out.push([CURVE, ox + a, oy + b, ox + c, oy + e, ox + f, oy + g]);
        x = ox + f; y = oy + g;
        break;
      }
      case "Q": {
        const [qx, qy, ex, ey] = [ox + next(), oy + next(), ox + next(), oy + next()];
        out.push([CURVE, x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey]);
        x = ex; y = ey;
        break;
      }
      case "A": {
        const [rx, ry, turn] = [next(), next(), next()];
        const large = flag(), sweep = flag();
        const ex = ox + next(), ey = oy + next();
        out.push(...arc(x, y, rx, ry, turn, large, sweep, ex, ey));
        x = ex; y = ey;
        break;
      }
      case "Z": out.push([CLOSE]); x = startX; y = startY; break;
      default: throw new Error(`path command ${command} is not drawn here`);
    }
  }
  return out;
}

function attribute(element, name) {
  const found = element.match(new RegExp(`\\s${name}="([^"]*)"`));
  return found ? Number.isNaN(Number(found[1])) ? found[1] : Number(found[1]) : 0;
}

export function commands(svg) {
  const out = [];
  for (const [element, kind] of svg.matchAll(/<(path|circle|rect)\b[^>]*>/g)) {
    if (kind === "path") out.push(...pathData(attribute(element, "d")));
    if (kind === "circle") out.push(...ellipse(attribute(element, "cx"), attribute(element, "cy"), attribute(element, "r"), attribute(element, "r")));
    if (kind === "rect") {
      out.push(...rounded(attribute(element, "x"), attribute(element, "y"), attribute(element, "width"), attribute(element, "height"), attribute(element, "rx")));
    }
  }
  return out;
}


/* ---- The template ---- */

/* From the 16-unit square to the template's 100-point type: y up from the
   baseline. */
function placed(path, place = (x, y) => [x, y]) {
  return path.map(([kind, ...numbers]) => {
    const out = [kind];
    for (let index = 0; index < numbers.length; index += 2) {
      const [x, y] = place(numbers[index], numbers[index + 1]);
      out.push(x * SCALE, (y - 8) * SCALE + MIDDLE);
    }
    return out;
  });
}

/* Every symbol's layers and steps, as ios-symbols.swift reads them. */
/* A symbol's layers and steps, as ios-symbols.swift reads them. */
function drawing(layers, steps) {
  return {
    layers: layers.length,
    secondary: layers.map((layer) => Boolean(layer.secondary)),
    badge: layers.map((layer) => Boolean(layer.badge)),
    hiddenAlone: layers.map((layer) => Boolean(layer.hiddenAlone)),
    steps: steps().map(({ op, svg, place, width, layer }) => ({
      op, layer, path: placed(commands(svg), place), ...(width ? { width: width * SCALE } : {}),
    })),
  };
}

function outlines(preview) {
  const answer = execFileSync("swift", [join(root, "scripts/ios-symbols.swift"), ...(preview ? [preview] : [])], {
    input: JSON.stringify(SYMBOLS.map(({ layers, steps }) => drawing(layers, steps))), encoding: "utf8", maxBuffer: 1 << 24,
  }).trim().split("\n").map((line) => JSON.parse(line));
  if (answer.length !== SYMBOLS.length || answer.some(({ layers }) => layers.some((layer) => !layer))) {
    throw new Error("The symbols' outlines did not come back whole.");
  }
  return answer;
}

const line = (id, x1, x2, y1, y2) =>
  `  <line id="${id}" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"/>`;

/* The three columns a template's small scale is drawn in, by their middles. */
const COLUMNS = [["Ultralight-S", 559.711], ["Regular-S", 1449.84], ["Black-S", 2933.4]];

const round = (value) => +value.toFixed(3);

/* Each layer a class for each way of drawing: in one tone a layer that only
   fills a hole cut for it is left out, so the hole shows; in two the
   lighter tone is the secondary one. */
function template(name, layers, { layers: paths, box, boxes }) {
  /* Centred halfway between the shape alone and the shape with its badge
     (author 2026-11-06): on the shape alone, as the system places its own,
     the badge stood too near the edge of the control's circle; on the whole,
     the shape too far to the left. The margins are as far apart as the
     shape's alone would be. */
  const shape = boxes.filter((_, index) => !layers[index].badge);
  const shapeMinX = Math.min(...shape.map(([x]) => x));
  const shapeMaxX = Math.max(...shape.map(([, , x]) => x));
  const centre = ((shapeMinX + shapeMaxX) / 2 + (box[0] + box[2]) / 2) / 2;
  const wide = shapeMaxX - shapeMinX + 2 * SIDE;
  const minX = centre - wide / 2 + SIDE;
  const style = layers.flatMap((layer, index) => [
    `.monochrome-${index} {fill:#000000${layer.hiddenAlone ? ";opacity:0.0" : ""}}`,
    `.hierarchical-${index}:${layer.secondary ? "secondary" : "primary"} {fill:${layer.secondary ? "#8E8E93" : "#212121"}}`,
  ]).join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3300" height="2200">',
    ` <style>${style}\n</style>`,
    ' <g id="Notes">',
    '  <rect height="2200" id="artboard" style="fill:white;opacity:1" width="3300" x="0" y="0"/>',
    '  <text id="template-version" style="stroke:none;fill:black;font-family:sans-serif;font-size:13;" transform="matrix(1 0 0 1 3036 1933)">Template v.4.0</text>',
    `  <text id="descriptive-name" style="stroke:none;fill:black;font-family:sans-serif;font-size:13;" transform="matrix(1 0 0 1 3036 1969)">${name}</text>`,
    " </g>",
    ' <g id="Guides">',
    line("Baseline-S", 263, 3036, 696, 696),
    line("Capline-S", 263, 3036, 625.541, 625.541),
    line("Baseline-M", 263, 3036, 1126, 1126),
    line("Capline-M", 263, 3036, 1055.54, 1055.54),
    line("Baseline-L", 263, 3036, 1556, 1556),
    line("Capline-L", 263, 3036, 1485.54, 1485.54),
    ...COLUMNS.flatMap(([id, middle]) => [
      line(`left-margin-${id}`, round(middle - wide / 2), round(middle - wide / 2), 600.785, 720.121),
      line(`right-margin-${id}`, round(middle + wide / 2), round(middle + wide / 2), 600.785, 720.121),
    ]),
    " </g>",
    ' <g id="Symbols">',
    ...COLUMNS.map(([id, middle]) => [
      `  <g id="${id}" transform="matrix(1 0 0 1 ${round(middle - wide / 2 + SIDE - minX)} 696)">`,
      ...paths.map((d, index) => `   <path class="monochrome-${index} hierarchical-${index}:${layers[index].secondary ? "secondary" : "primary"}" d="${d}"/>`),
      "  </g>",
    ].join("\n")),
    " </g>",
    "</svg>",
    "",
  ].join("\n");
}

const CATALOG = `${JSON.stringify({ info: { author: "xcode", version: 1 } }, null, 2)}\n`;

/* The share menu's two actions draw their icons as the controls draw their
   shapes, in one tone and without a badge (author 2026-11-06): the book
   reads what was shared, the card makes a card of it. */
const SHARE_ICONS = {
  ShareRead: { layers: BOOK_ALONE, steps: () => book() },
  ShareCard: { layers: [{}], steps: () => card() },
};

/* Each share action's icon, drawn into a file of its own. */
function shareIcons(folder) {
  const actions = Object.entries(SHARE_ICONS);
  const symbols = actions.map(([action, { layers, steps }]) => ({
    ...drawing(layers, steps), png: join(folder, `${action}.png`),
  }));
  execFileSync("swift", [join(root, "scripts/ios-symbols.swift")], {
    input: JSON.stringify(symbols), encoding: "utf8", maxBuffer: 1 << 24,
  });
  return Object.fromEntries(actions.map(([action]) => [action, readFileSync(join(folder, `${action}.png`))]));
}

/* Every symbol's template, and the catalog round them, written where they
   differ, into <folder>/Controls; and each share action's icon into
   <folder>/<action>. Answers whether anything was. */
export function writeSymbols(apple) {
  const folder = join(apple, "Controls");
  const shapes = outlines();
  const made = mkdtempSync(join(tmpdir(), "triglosa-icons-"));
  const icons = shareIcons(made);
  const catalog = join(folder, "Symbols.xcassets");
  let changed = false;
  const write = (file, content) => {
    if (existsSync(file) && readFileSync(file, "utf8") === content) return;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    changed = true;
  };
  write(join(catalog, "Contents.json"), CATALOG);
  SYMBOLS.forEach(({ name, layers }, index) => {
    const set = join(catalog, `${name}.symbolset`);
    write(join(set, `${name}.svg`), template(name, layers, shapes[index]));
    write(join(set, "Contents.json"), `${JSON.stringify({
      info: { author: "xcode", version: 1 },
      symbols: [{ filename: `${name}.svg`, idiom: "universal" }],
    }, null, 2)}\n`);
  });
  for (const [action, fresh] of Object.entries(icons)) {
    const icon = join(apple, action, "Assets.xcassets/AppIcon.appiconset/icon.png");
    if (!existsSync(icon) || !readFileSync(icon).equals(fresh)) {
      mkdirSync(dirname(icon), { recursive: true });
      writeFileSync(icon, fresh);
      changed = true;
    }
  }
  rmSync(made, { recursive: true, force: true });
  /* A symbol no longer drawn goes. */
  for (const entry of existsSync(catalog) ? readdirSync(catalog) : []) {
    if (entry.endsWith(".symbolset") && !SYMBOLS.some(({ name }) => `${name}.symbolset` === entry)) {
      rmSync(join(catalog, entry), { recursive: true, force: true });
      changed = true;
    }
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [first, second] = process.argv.slice(2);
  if (first === "--sizes") {
    /* Width and height at 100 points, to set beside the system's. */
    outlines().forEach(({ box: [minX, minY, maxX, maxY] }, index) => {
      console.log(`${SYMBOLS[index].name} ${Math.round(maxX - minX)} × ${Math.round(maxY - minY)}`);
    });
  } else if (first === "--preview" && second) {
    outlines(resolve(second));
    console.log(`drawn ${second}`);
  } else if (first && !first.startsWith("--")) {
    writeSymbols(first);
    console.log(`written under ${first}`);
  } else {
    console.error("usage: node scripts/ios-symbols.mjs <folder> | --preview <file.png> | --sizes");
    process.exit(1);
  }
}

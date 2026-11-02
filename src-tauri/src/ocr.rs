#![cfg_attr(not(target_os = "windows"), allow(dead_code))]

//! Reading the text off a piece of the screen, on Windows, with PaddleOCR's
//! models through ONNX Runtime — the runtime the word aligner already
//! brings. The Mac reads with Apple's own recognition in the helper and
//! carries none of this; it is built there all the same, for its tests.
//!
//! Two steps, as PaddleOCR takes them. A detector marks, pixel by pixel,
//! where there is text; the marked patches are the lines. Each line is then
//! cut out, scaled to 48 pixels high and read by the recogniser of its
//! script, which answers a character (or none) for every few columns —
//! collapsed into the line's text. The steps and their numbers follow
//! RapidOCR, which run sixty-six measured against Windows' own and Apple's
//! recognition, with one exception: no line is turned upside down, since a
//! screenshot holds none (the classifier for it turned whole lines over).
//!
//! Which script is read is not known before reading: every script of the
//! reader's languages is tried on the same lines, and the one surest of its
//! characters is kept. The models come with the app in its resources'
//! folder `ocr` (scripts/ocr-fetch.mjs); where they are missing the window
//! is told so.

use ort::session::Session;
use ort::value::Tensor;
use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// A picture, three bytes a pixel in the order blue, green, red — the order
/// Windows hands a screen over in and the models were trained on.
pub struct Picture {
    pub width: usize,
    pub height: usize,
    pub pixels: Vec<u8>,
}

impl Picture {
    /// From four bytes a pixel (blue, green, red and one more), top row
    /// first.
    pub fn from_bgra(width: usize, height: usize, bgra: &[u8]) -> Picture {
        let mut pixels = Vec::with_capacity(width * height * 3);
        for pixel in bgra.chunks_exact(4).take(width * height) {
            pixels.extend_from_slice(&pixel[..3]);
        }
        Picture {
            width,
            height,
            pixels,
        }
    }

    fn at(&self, x: usize, y: usize) -> [u8; 3] {
        let i = (y * self.width + x) * 3;
        [self.pixels[i], self.pixels[i + 1], self.pixels[i + 2]]
    }

    /// Scaled to a new size, each new pixel weighed from the four nearest
    /// old ones.
    fn scaled(&self, width: usize, height: usize) -> Picture {
        let mut pixels = vec![0u8; width * height * 3];
        let sx = self.width as f32 / width as f32;
        let sy = self.height as f32 / height as f32;
        for y in 0..height {
            let fy = ((y as f32 + 0.5) * sy - 0.5).max(0.0);
            let y0 = (fy as usize).min(self.height - 1);
            let y1 = (y0 + 1).min(self.height - 1);
            let wy = fy - y0 as f32;
            for x in 0..width {
                let fx = ((x as f32 + 0.5) * sx - 0.5).max(0.0);
                let x0 = (fx as usize).min(self.width - 1);
                let x1 = (x0 + 1).min(self.width - 1);
                let wx = fx - x0 as f32;
                let (a, b, c, d) = (
                    self.at(x0, y0),
                    self.at(x1, y0),
                    self.at(x0, y1),
                    self.at(x1, y1),
                );
                for k in 0..3 {
                    let top = a[k] as f32 * (1.0 - wx) + b[k] as f32 * wx;
                    let bottom = c[k] as f32 * (1.0 - wx) + d[k] as f32 * wx;
                    pixels[(y * width + x) * 3 + k] =
                        (top * (1.0 - wy) + bottom * wy).round() as u8;
                }
            }
        }
        Picture {
            width,
            height,
            pixels,
        }
    }

    /// Turned a quarter to the left, for a line standing upright.
    fn turned(&self) -> Picture {
        let (width, height) = (self.height, self.width);
        let mut pixels = vec![0u8; width * height * 3];
        for y in 0..height {
            for x in 0..width {
                let from = self.at(self.width - 1 - y, x);
                pixels[(y * width + x) * 3..(y * width + x) * 3 + 3].copy_from_slice(&from);
            }
        }
        Picture {
            width,
            height,
            pixels,
        }
    }

    /// With rows of the edge's own colour above and below.
    fn padded(&self, rows: usize) -> Picture {
        let mut edge = [0u64; 3];
        for x in 0..self.width {
            for (k, sum) in edge.iter_mut().enumerate() {
                *sum += self.at(x, 0)[k] as u64 + self.at(x, self.height - 1)[k] as u64;
            }
        }
        let fill: Vec<u8> = edge
            .iter()
            .map(|sum| (sum / (2 * self.width as u64)) as u8)
            .collect();
        let row: Vec<u8> = fill.iter().copied().cycle().take(self.width * 3).collect();
        let mut pixels = Vec::with_capacity(self.width * (self.height + 2 * rows) * 3);
        for _ in 0..rows {
            pixels.extend_from_slice(&row);
        }
        pixels.extend_from_slice(&self.pixels);
        for _ in 0..rows {
            pixels.extend_from_slice(&row);
        }
        Picture {
            width: self.width,
            height: self.height + 2 * rows,
            pixels,
        }
    }

    /// Made larger to the right and below, in the colour its edges have on
    /// average.
    fn extended(&self, width: usize, height: usize) -> Picture {
        let mut edge = [0u64; 3];
        let mut count = 0u64;
        let mut add = |pixel: [u8; 3]| {
            for (k, sum) in edge.iter_mut().enumerate() {
                *sum += pixel[k] as u64;
            }
            count += 1;
        };
        for x in 0..self.width {
            add(self.at(x, 0));
            add(self.at(x, self.height - 1));
        }
        for y in 0..self.height {
            add(self.at(0, y));
            add(self.at(self.width - 1, y));
        }
        let fill: Vec<u8> = edge.iter().map(|sum| (sum / count) as u8).collect();
        let mut pixels: Vec<u8> = fill
            .iter()
            .copied()
            .cycle()
            .take(width * height * 3)
            .collect();
        for y in 0..self.height {
            let from = &self.pixels[y * self.width * 3..(y + 1) * self.width * 3];
            pixels[y * width * 3..y * width * 3 + self.width * 3].copy_from_slice(from);
        }
        Picture {
            width,
            height,
            pixels,
        }
    }

    /// The numbers a model takes: each colour apart, scaled to -1 … 1.
    fn planes(&self, width: usize) -> Vec<f32> {
        let mut out = vec![0.0f32; 3 * self.height * width];
        let plane = self.height * width;
        for y in 0..self.height {
            for x in 0..self.width.min(width) {
                let pixel = self.at(x, y);
                for k in 0..3 {
                    out[k * plane + y * width + x] = pixel[k] as f32 / 127.5 - 1.0;
                }
            }
        }
        out
    }
}

/// A line read, with its box in the picture's pixels: left, top, right,
/// bottom.
#[derive(Serialize, Clone, Debug)]
pub struct Line {
    pub text: String,
    pub score: f32,
    pub b: [i32; 4],
    /// Where each character of the text stands across the picture, left
    /// and right, for finding the word under the pointer. Empty where the
    /// order read is not the order written (Arabic).
    pub c: Vec<[i32; 2]>,
}

/// The scripts there is a recogniser for, by the file it is in, in the
/// order they are tried: Chinese last, because its recogniser knows Latin
/// letters too, without their accents (run sixty-six's images read with
/// all four: every one in its own script in this order, a fifth of the
/// Latin ones in Chinese the other way round).
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, PartialOrd, Ord)]
pub enum Script {
    Latin,
    Cyrillic,
    Arabic,
    Chinese,
}

impl Script {
    fn file(self) -> &'static str {
        match self {
            Script::Latin => "latin.onnx",
            Script::Cyrillic => "cyrillic.onnx",
            Script::Arabic => "arabic.onnx",
            Script::Chinese => "chinese.onnx",
        }
    }

    pub fn named(name: &str) -> Option<Script> {
        match name {
            "latin" => Some(Script::Latin),
            "cyrillic" => Some(Script::Cyrillic),
            "arabic" => Some(Script::Arabic),
            "chinese" => Some(Script::Chinese),
            _ => None,
        }
    }
}

/* RapidOCR's numbers. */
const MAX_SIDE: usize = 2000;
const MIN_SIDE: usize = 30;
const MIN_HEIGHT: usize = 30;
const MAX_RATIO: f32 = 8.0;
const DETECT_SIDE: usize = 736;
/// The most a picture is enlarged for the detector (not RapidOCR's).
const MAX_ENLARGED: f32 = 2.0;
const THRESHOLD: f32 = 0.3;
const BOX_THRESHOLD: f32 = 0.5;
const UNCLIP: f32 = 1.6;
const MIN_BOX: f32 = 3.0;
const LINE_HEIGHT: usize = 48;
const LINE_WIDTH: usize = 320;
const BATCH: usize = 6;
const TEXT_SCORE: f32 = 0.5;
/// How much surer a later script has to be than an earlier one.
const PREFERENCE: f32 = 0.03;

/// The models are let go after this long without a question.
const IDLE: Duration = Duration::from_secs(300);

struct Reader {
    session: Session,
    letters: Vec<String>,
}

struct Loaded {
    detector: Session,
    readers: HashMap<Script, Reader>,
    used: Instant,
}

static LOADED: Mutex<Option<Loaded>> = Mutex::new(None);

fn session(file: &Path) -> Result<Session, String> {
    let threads = std::thread::available_parallelism()
        .map_or(1, |n| n.get())
        .min(4);
    Session::builder()
        .and_then(|builder| builder.with_intra_threads(threads))
        .and_then(|builder| builder.commit_from_file(file))
        .map_err(|error| error.to_string())
}

/// A recogniser and the characters it answers with: its own list, written
/// into the model, with "nothing here" in front and a space at the end.
fn reader(dir: &Path, script: Script) -> Result<Reader, String> {
    let session = session(&dir.join(script.file()))?;
    let listed = session
        .metadata()
        .and_then(|meta| meta.custom("character"))
        .map_err(|error| error.to_string())?
        .ok_or("no character list in the model")?;
    let mut letters = vec![String::new()];
    letters.extend(listed.lines().map(str::to_string));
    letters.push(" ".into());
    Ok(Reader { session, letters })
}

/// Where the models are, if all of them are.
pub fn folder_with_models(dir: PathBuf) -> Option<PathBuf> {
    let all = [
        "detector.onnx",
        "latin.onnx",
        "cyrillic.onnx",
        "arabic.onnx",
        "chinese.onnx",
    ]
    .iter()
    .all(|name| dir.join(name).is_file());
    all.then_some(dir)
}

/// Lets the models go once nobody has asked for a while.
fn watch() {
    std::thread::spawn(|| loop {
        std::thread::sleep(Duration::from_secs(30));
        let mut loaded = LOADED
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        match loaded.as_ref() {
            Some(models) if models.used.elapsed() < IDLE => {}
            _ => {
                *loaded = None;
                return;
            }
        }
    });
}

/// The lines of text in a picture, read in whichever of the scripts it is
/// surest of — the first of them where two are about as sure. Nothing found
/// is an empty list.
pub fn read(dir: &Path, picture: &Picture, scripts: &[Script]) -> Result<Vec<Line>, String> {
    let mut guard = LOADED
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    if guard.is_none() {
        *guard = Some(Loaded {
            detector: session(&dir.join("detector.onnx"))?,
            readers: HashMap::new(),
            used: Instant::now(),
        });
        watch();
    }
    let loaded = guard.as_mut().expect("loaded just above");
    loaded.used = Instant::now();
    let mut scripts = scripts.to_vec();
    scripts.sort();
    scripts.dedup();
    for &script in &scripts {
        if !loaded.readers.contains_key(&script) {
            loaded.readers.insert(script, reader(dir, script)?);
        }
    }

    let (picture, factor) = within_bounds(picture);
    let boxes = whole_lines(detect(&mut loaded.detector, &picture)?);
    if boxes.is_empty() {
        return Ok(Vec::new());
    }
    let (boxes, cuts): (Vec<Quad>, Vec<Picture>) = boxes
        .into_iter()
        .filter_map(|quad| line_picture(&picture, &quad).map(|cut| (quad, cut)))
        .unzip();
    if cuts.is_empty() {
        return Ok(Vec::new());
    }
    let mut best: Option<(f32, Vec<Read>, Script)> = None;
    for &script in &scripts {
        let reader = loaded.readers.get_mut(&script).expect("loaded above");
        let read = recognise(reader, &cuts)?;
        let sureness = sureness(&read);
        /* A script further down the list has to be clearly surer: the
        Chinese recogniser knows Latin letters too, without their accents,
        and was a hair surer of a German subtitle than the Latin one. */
        if best
            .as_ref()
            .is_none_or(|(sure, _, _)| sureness > *sure + PREFERENCE)
        {
            best = Some((sureness, read, script));
        }
    }
    let Some((_, read, script)) = best else {
        return Ok(Vec::new());
    };
    Ok(boxes
        .iter()
        .zip(read)
        .filter(|(_, (text, score, _))| *score >= TEXT_SCORE && !text.trim().is_empty())
        .map(|(quad, (text, score, middles))| {
            let b = bounds(quad).map(|v| (v / factor).round() as i32);
            let arabic = script == Script::Arabic;
            Line {
                c: if arabic {
                    Vec::new()
                } else {
                    extents(&middles, b[0], b[2])
                },
                text: if arabic { logical_order(&text) } else { text },
                score,
                b,
            }
        })
        .collect())
}

/// Each character's left and right edge across the picture, from the
/// middles read: halfway to its neighbours, the line's own edges at the
/// ends.
fn extents(middles: &[f32], left: i32, right: i32) -> Vec<[i32; 2]> {
    let width = (right - left) as f32;
    let x: Vec<f32> = middles.iter().map(|m| left as f32 + m * width).collect();
    (0..x.len())
        .map(|i| {
            let from = if i == 0 {
                left as f32
            } else {
                (x[i - 1] + x[i]) / 2.0
            };
            let to = if i + 1 == x.len() {
                right as f32
            } else {
                (x[i] + x[i + 1]) / 2.0
            };
            [from.round() as i32, to.round() as i32]
        })
        .collect()
}

/// How sure a reading is of its characters, over all its lines: the mean
/// of each line's sureness, weighed by its length.
fn sureness(read: &[Read]) -> f32 {
    let (mut sum, mut count) = (0.0, 0.0);
    for (text, score, _) in read {
        let n = text.chars().count() as f32;
        sum += score * n;
        count += n;
    }
    if count == 0.0 {
        0.0
    } else {
        sum / count
    }
}

/// Brought within the sizes the models are used to: the longer side at
/// most 2000 pixels, the shorter at least 30. Answers the picture and how
/// much it was scaled.
fn within_bounds(picture: &Picture) -> (Picture, f32) {
    let (w, h) = (picture.width as f32, picture.height as f32);
    let mut factor = 1.0;
    if w.max(h) > MAX_SIDE as f32 {
        factor = MAX_SIDE as f32 / w.max(h);
    }
    if w.min(h) * factor < MIN_SIDE as f32 {
        factor = MIN_SIDE as f32 / w.min(h);
    }
    if factor == 1.0 {
        return (
            Picture {
                width: picture.width,
                height: picture.height,
                pixels: picture.pixels.clone(),
            },
            1.0,
        );
    }
    let width = ((w * factor) as usize).max(1);
    let height = ((h * factor) as usize).max(1);
    (picture.scaled(width, height), factor)
}

/// A line's box: its corners from the top left round to the bottom left.
/// Slightly turned where the line is, as a line on a screen rarely is not
/// quite level in the detector's eyes.
type Quad = [[f32; 2]; 4];

/// The boxes of the lines, in the picture's pixels.
fn detect(detector: &mut Session, picture: &Picture) -> Result<Vec<Quad>, String> {
    /* A low strip gets rows above and below, as RapidOCR gives it: the
    detector was trained on pages, not on a single line. */
    let ratio = picture.width as f32 / picture.height as f32;
    let rows = if picture.height <= MIN_HEIGHT || ratio > MAX_RATIO {
        let wanted = ((picture.width as f32 / MAX_RATIO) as usize).max(MIN_HEIGHT) * 2;
        wanted.abs_diff(picture.height) / 2
    } else {
        0
    };
    let padded = if rows > 0 {
        picture.padded(rows)
    } else {
        Picture {
            width: picture.width,
            height: picture.height,
            pixels: picture.pixels.clone(),
        }
    };

    let (w, h) = (padded.width as f32, padded.height as f32);
    let wanted = if w.min(h) < DETECT_SIDE as f32 {
        DETECT_SIDE as f32 / w.min(h)
    } else {
        1.0
    };
    let scale = wanted.min(MAX_ENLARGED);
    let round32 = |v: f32| (((v / 32.0).round() as usize) * 32).max(32);
    /* A small frame is enlarged only so far and the rest made up with its
    edges' colour: enlarged six times, a line of screen text fell apart
    into words that overlapped. */
    let (sw, sh, dw, dh) = if scale == wanted {
        let (dw, dh) = (round32(w * scale), round32(h * scale));
        (dw, dh, dw, dh)
    } else {
        let (sw, sh) = (
            ((w * scale).round() as usize).max(1),
            ((h * scale).round() as usize).max(1),
        );
        let up32 = |v: usize| v.div_ceil(32) * 32;
        let (mut dw, mut dh) = (up32(sw), up32(sh));
        if dw.min(dh) < DETECT_SIDE {
            if dw < dh {
                dw = up32(DETECT_SIDE);
            } else {
                dh = up32(DETECT_SIDE);
            }
        }
        (sw, sh, dw, dh)
    };
    let input = padded.scaled(sw, sh).extended(dw, dh).planes(dw);
    let tensor =
        Tensor::from_array(([1usize, 3, dh, dw], input)).map_err(|error| error.to_string())?;
    let out = detector
        .run(ort::inputs!["x" => tensor])
        .map_err(|error| error.to_string())?;
    let (_, map) = out[0]
        .try_extract_tensor::<f32>()
        .map_err(|error| error.to_string())?;
    /* Back from the detector's size to the padded picture's, then the
    padding taken off. */
    let back = |[x, y]: [f32; 2]| {
        [
            (x / sw as f32 * padded.width as f32)
                .round()
                .clamp(0.0, padded.width as f32),
            ((y / sh as f32 * padded.height as f32)
                .round()
                .clamp(0.0, padded.height as f32)
                - rows as f32)
                .clamp(0.0, picture.height as f32),
        ]
    };
    let quads: Vec<Quad> = patches(map, dw, dh)
        .into_iter()
        .map(|quad| quad.map(back))
        .filter(|quad| {
            let [l, t, r, b] = bounds(quad);
            r > l && b > t
        })
        .collect();
    Ok(quads)
}

/// Left, top, right and bottom of a box.
fn bounds(quad: &Quad) -> [f32; 4] {
    let xs = quad.iter().map(|p| p[0]);
    let ys = quad.iter().map(|p| p[1]);
    [
        xs.clone().fold(f32::MAX, f32::min),
        ys.clone().fold(f32::MAX, f32::min),
        xs.fold(f32::MIN, f32::max),
        ys.fold(f32::MIN, f32::max),
    ]
}

/// The outline around points: its corners, in turn.
fn hull(mut points: Vec<[f32; 2]>) -> Vec<[f32; 2]> {
    points.sort_by(|a, b| a[0].total_cmp(&b[0]).then(a[1].total_cmp(&b[1])));
    points.dedup();
    if points.len() < 3 {
        return points;
    }
    let cross = |o: [f32; 2], a: [f32; 2], b: [f32; 2]| {
        (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    };
    let mut lower: Vec<[f32; 2]> = Vec::new();
    for &p in &points {
        while lower.len() >= 2 && cross(lower[lower.len() - 2], lower[lower.len() - 1], p) <= 0.0 {
            lower.pop();
        }
        lower.push(p);
    }
    let mut upper: Vec<[f32; 2]> = Vec::new();
    for &p in points.iter().rev() {
        while upper.len() >= 2 && cross(upper[upper.len() - 2], upper[upper.len() - 1], p) <= 0.0 {
            upper.pop();
        }
        upper.push(p);
    }
    lower.pop();
    upper.pop();
    lower.extend(upper);
    lower
}

/// The smallest rectangle around an outline, turned however that takes:
/// its two directions, and how far it reaches along each.
struct Rectangle {
    along: [f32; 2],
    across: [f32; 2],
    a: [f32; 2],
    b: [f32; 2],
}

impl Rectangle {
    fn around(outline: &[[f32; 2]]) -> Rectangle {
        let reach = |dir: [f32; 2]| {
            outline.iter().fold([f32::MAX, f32::MIN], |[lo, hi], p| {
                let d = p[0] * dir[0] + p[1] * dir[1];
                [lo.min(d), hi.max(d)]
            })
        };
        let level = |along: [f32; 2]| {
            let across = [-along[1], along[0]];
            Rectangle {
                along,
                across,
                a: reach(along),
                b: reach(across),
            }
        };
        let mut best = level([1.0, 0.0]);
        for i in 0..outline.len() {
            let (p, q) = (outline[i], outline[(i + 1) % outline.len()]);
            let (dx, dy) = (q[0] - p[0], q[1] - p[1]);
            let length = (dx * dx + dy * dy).sqrt();
            if length == 0.0 {
                continue;
            }
            let candidate = level([dx / length, dy / length]);
            if candidate.area() < best.area() - 1e-3 {
                best = candidate;
            }
        }
        best
    }

    fn sides(&self) -> (f32, f32) {
        (self.a[1] - self.a[0], self.b[1] - self.b[0])
    }

    fn area(&self) -> f32 {
        let (w, h) = self.sides();
        w * h
    }

    fn grown(&self, by: f32) -> Rectangle {
        Rectangle {
            along: self.along,
            across: self.across,
            a: [self.a[0] - by, self.a[1] + by],
            b: [self.b[0] - by, self.b[1] + by],
        }
    }

    /// The corners, from the top left round to the bottom left, as
    /// RapidOCR orders them.
    fn corners(&self) -> Quad {
        let point = |a: f32, b: f32| {
            [
                self.along[0] * a + self.across[0] * b,
                self.along[1] * a + self.across[1] * b,
            ]
        };
        let mut points = [
            point(self.a[0], self.b[0]),
            point(self.a[1], self.b[0]),
            point(self.a[1], self.b[1]),
            point(self.a[0], self.b[1]),
        ];
        points.sort_by(|p, q| p[0].total_cmp(&q[0]));
        let (top_left, bottom_left) = if points[1][1] > points[0][1] {
            (points[0], points[1])
        } else {
            (points[1], points[0])
        };
        let (top_right, bottom_right) = if points[3][1] > points[2][1] {
            (points[2], points[3])
        } else {
            (points[3], points[2])
        };
        [top_left, top_right, bottom_right, bottom_left]
    }
}

/// The patches the detector marked, each as the smallest box around it —
/// turned where the patch lies turned — grown by as much as the detector
/// was trained to shrink it, in the map's pixels.
fn patches(map: &[f32], width: usize, height: usize) -> Vec<Quad> {
    /* Marked where the detector is sure enough, each mark grown by a pixel
    to the right and down so a letter's parts join. */
    let mut marked = vec![false; width * height];
    for y in 0..height {
        for x in 0..width {
            if map[y * width + x] > THRESHOLD {
                marked[y * width + x] = true;
                if x + 1 < width {
                    marked[y * width + x + 1] = true;
                }
                if y + 1 < height {
                    marked[(y + 1) * width + x] = true;
                    if x + 1 < width {
                        marked[(y + 1) * width + x + 1] = true;
                    }
                }
            }
        }
    }
    let mut seen = vec![false; width * height];
    let mut boxes = Vec::new();
    let mut stack = Vec::new();
    for start in 0..width * height {
        if !marked[start] || seen[start] {
            continue;
        }
        /* Each row's leftmost and rightmost pixel: the outline of the patch
        runs through them, and nothing else is needed for it. */
        let mut rows: HashMap<usize, (usize, usize)> = HashMap::new();
        let (mut left, mut top, mut right, mut bottom) = (width, height, 0, 0);
        seen[start] = true;
        stack.push(start);
        while let Some(at) = stack.pop() {
            let (x, y) = (at % width, at / width);
            let row = rows.entry(y).or_insert((x, x));
            row.0 = row.0.min(x);
            row.1 = row.1.max(x);
            left = left.min(x);
            right = right.max(x);
            top = top.min(y);
            bottom = bottom.max(y);
            for dy in -1i32..=1 {
                for dx in -1i32..=1 {
                    let (nx, ny) = (x as i32 + dx, y as i32 + dy);
                    if nx < 0 || ny < 0 || nx >= width as i32 || ny >= height as i32 {
                        continue;
                    }
                    let next = ny as usize * width + nx as usize;
                    if marked[next] && !seen[next] {
                        seen[next] = true;
                        stack.push(next);
                    }
                }
            }
        }
        /* Measured through the pixels' middles, as OpenCV measures a
        patch's outline: a box a pixel larger reached into the next line,
        and dense Arabic lost half its letters to it. */
        let points: Vec<[f32; 2]> = rows
            .iter()
            .flat_map(|(&y, &(l, r))| [[l as f32, y as f32], [r as f32, y as f32]])
            .collect();
        let rectangle = Rectangle::around(&hull(points));
        let (w, h) = rectangle.sides();
        if w.min(h) < MIN_BOX {
            continue;
        }
        let mut sum = 0.0;
        for y in top..=bottom {
            for x in left..=right {
                sum += map[y * width + x];
            }
        }
        let cells = ((right - left + 1) * (bottom - top + 1)) as f32;
        if sum / cells < BOX_THRESHOLD {
            continue;
        }
        let grown = rectangle.grown(w * h * UNCLIP / (2.0 * (w + h)));
        let (gw, gh) = grown.sides();
        if gw.min(gh) < MIN_BOX + 2.0 {
            continue;
        }
        boxes.push(grown.corners());
    }
    boxes
}

/// How far apart two boxes of a row may stand and still be one line, in
/// line heights: a wide word space, not a gap between columns.
const SAME_LINE: f32 = 0.6;
/// How much of the lower box the two have to share up and down.
const SAME_ROW: f32 = 0.6;

/// The detector's boxes with those of one line made one. It cuts a line of
/// wide word spaces into pieces, each with a sliver of its neighbour in it,
/// and read apart they come back with a stray letter or without their space;
/// the recogniser reads the whole line clean.
fn whole_lines(quads: Vec<Quad>) -> Vec<Quad> {
    let mut boxes: Vec<[f32; 4]> = quads.iter().map(bounds).collect();
    let level = |quad: &Quad| (quad[1][1] - quad[0][1]).abs() < (quad[1][0] - quad[0][0]).abs();
    let mut kept: Vec<Option<Quad>> = quads.iter().map(|quad| Some(*quad)).collect();
    let mut order: Vec<usize> = (0..boxes.len()).collect();
    order.sort_by(|a, b| boxes[*a][0].total_cmp(&boxes[*b][0]));
    for at in 1..order.len() {
        let i = order[at];
        let this = boxes[i];
        let joined = order[..at].iter().rev().copied().find(|&j| {
            if !kept[j].as_ref().is_some_and(level) {
                return false;
            }
            let that = boxes[j];
            let high = (this[3] - this[1]).min(that[3] - that[1]);
            let shared = this[3].min(that[3]) - this[1].max(that[1]);
            shared >= SAME_ROW * high && this[0] - that[2] <= SAME_LINE * high
        });
        if let (Some(j), Some(quad)) = (joined, kept[i].as_ref()) {
            if level(quad) {
                let that = boxes[j];
                let hull = [
                    that[0].min(this[0]),
                    that[1].min(this[1]),
                    that[2].max(this[2]),
                    that[3].max(this[3]),
                ];
                boxes[j] = hull;
                kept[j] = Some([
                    [hull[0], hull[1]],
                    [hull[2], hull[1]],
                    [hull[2], hull[3]],
                    [hull[0], hull[3]],
                ]);
                kept[i] = None;
            }
        }
    }
    kept.into_iter().flatten().collect()
}

/// A line cut out of the picture as the recogniser takes it: the box laid
/// level, as RapidOCR lays it, and an upright line turned to lie.
fn line_picture(picture: &Picture, quad: &Quad) -> Option<Picture> {
    let [tl, tr, br, bl] = *quad;
    let distance =
        |p: [f32; 2], q: [f32; 2]| ((p[0] - q[0]).powi(2) + (p[1] - q[1]).powi(2)).sqrt();
    let width = distance(tl, tr).max(distance(bl, br)) as usize;
    let height = distance(tl, bl).max(distance(tr, br)) as usize;
    if width == 0 || height == 0 {
        return None;
    }
    let mut pixels = Vec::with_capacity(width * height * 3);
    let clampx = |v: f32| v.clamp(0.0, (picture.width - 1) as f32);
    let clampy = |v: f32| v.clamp(0.0, (picture.height - 1) as f32);
    for y in 0..height {
        for x in 0..width {
            let (u, v) = (x as f32 / width as f32, y as f32 / height as f32);
            let sx = clampx(tl[0] + (tr[0] - tl[0]) * u + (bl[0] - tl[0]) * v);
            let sy = clampy(tl[1] + (tr[1] - tl[1]) * u + (bl[1] - tl[1]) * v);
            let (x0, y0) = (sx as usize, sy as usize);
            let (x1, y1) = (
                (x0 + 1).min(picture.width - 1),
                (y0 + 1).min(picture.height - 1),
            );
            let (wx, wy) = (sx - x0 as f32, sy - y0 as f32);
            let (a, b, c, d) = (
                picture.at(x0, y0),
                picture.at(x1, y0),
                picture.at(x0, y1),
                picture.at(x1, y1),
            );
            for k in 0..3 {
                let top = a[k] as f32 * (1.0 - wx) + b[k] as f32 * wx;
                let bottom = c[k] as f32 * (1.0 - wx) + d[k] as f32 * wx;
                pixels.push((top * (1.0 - wy) + bottom * wy).round() as u8);
            }
        }
    }
    let cut = Picture {
        width,
        height,
        pixels,
    };
    Some(if height as f32 / width as f32 >= 1.5 {
        cut.turned()
    } else {
        cut
    })
}

/// A line read: its text, how sure the recogniser was of it, and where
/// each character's middle stands, as a share of the line's width.
type Read = (String, f32, Vec<f32>);

/// Every line read, in its order. Lines of a like width go together,
/// padded to the widest.
fn recognise(reader: &mut Reader, cuts: &[Picture]) -> Result<Vec<Read>, String> {
    let mut order: Vec<usize> = (0..cuts.len()).collect();
    let ratio = |p: &Picture| p.width as f32 / p.height as f32;
    order.sort_by(|a, b| ratio(&cuts[*a]).total_cmp(&ratio(&cuts[*b])));
    let mut out = vec![(String::new(), 0.0, Vec::new()); cuts.len()];
    for batch in order.chunks(BATCH) {
        let widest = batch
            .iter()
            .map(|&i| ratio(&cuts[i]))
            .fold(LINE_WIDTH as f32 / LINE_HEIGHT as f32, f32::max);
        let width = (LINE_HEIGHT as f32 * widest) as usize;
        let used =
            |i: usize| ((LINE_HEIGHT as f32 * ratio(&cuts[i])).ceil() as usize).clamp(1, width);
        let mut input = Vec::with_capacity(batch.len() * 3 * LINE_HEIGHT * width);
        for &i in batch {
            input.extend(cuts[i].scaled(used(i), LINE_HEIGHT).planes(width));
        }
        let tensor = Tensor::from_array(([batch.len(), 3, LINE_HEIGHT, width], input))
            .map_err(|error| error.to_string())?;
        let result = reader
            .session
            .run(ort::inputs!["x" => tensor])
            .map_err(|error| error.to_string())?;
        let (shape, data) = result[0]
            .try_extract_tensor::<f32>()
            .map_err(|error| error.to_string())?;
        let (steps, classes) = (shape[1] as usize, shape[2] as usize);
        for (n, &i) in batch.iter().enumerate() {
            let rows = &data[n * steps * classes..(n + 1) * steps * classes];
            let (text, score, steps_at) = collapse(rows, classes, &reader.letters);
            /* From the steps of the padded input to the line's own width. */
            let share = width as f32 / used(i) as f32 / steps as f32;
            let middles = steps_at
                .iter()
                .map(|&step| ((step as f32 + 0.5) * share).min(1.0))
                .collect();
            out[i] = (text, score, middles);
        }
    }
    Ok(out)
}

/// What a recogniser answered for every few columns, as text: the likeliest
/// character of each, a repeat counted once and "nothing here" left out.
/// The sureness is the mean of the characters kept; with them, the column
/// each character was first read in, one per character of the text.
fn collapse(rows: &[f32], classes: usize, letters: &[String]) -> (String, f32, Vec<usize>) {
    let mut text = String::new();
    let mut at = Vec::new();
    let (mut sum, mut count) = (0.0, 0);
    let mut last = usize::MAX;
    for (step, row) in rows.chunks_exact(classes).enumerate() {
        let (best, p) =
            row.iter().enumerate().fold(
                (0, f32::MIN),
                |(bi, bp), (i, &p)| if p > bp { (i, p) } else { (bi, bp) },
            );
        if best != 0 && best != last {
            if let Some(letter) = letters.get(best) {
                text.push_str(letter);
                at.extend(std::iter::repeat_n(step, letter.chars().count()));
                sum += p;
                count += 1;
            }
        }
        last = best;
    }
    let score = if count == 0 { 0.0 } else { sum / count as f32 };
    (text, score, at)
}

fn right_to_left(c: char) -> bool {
    matches!(c as u32, 0x0590..=0x08FF | 0xFB1D..=0xFDFF | 0xFE70..=0xFEFF)
}

/// A line of Arabic in the order it is written, from the order the
/// recogniser reads its pixels in — left to right. Runs of digits and Latin
/// letters keep their own order.
fn logical_order(seen: &str) -> String {
    let reversed: Vec<char> = seen.chars().rev().collect();
    let mut out = String::new();
    let mut i = 0;
    while i < reversed.len() {
        let c = reversed[i];
        if c.is_alphanumeric() && !right_to_left(c) {
            /* A left-to-right run, with the marks and spaces inside it. */
            let mut end = i + 1;
            let mut last = i;
            while end < reversed.len() {
                let d = reversed[end];
                if d.is_alphanumeric() && !right_to_left(d) {
                    last = end;
                } else if right_to_left(d) || !(d.is_ascii_punctuation() || d == ' ') {
                    break;
                }
                end += 1;
            }
            out.extend(reversed[i..=last].iter().rev());
            i = last + 1;
        } else {
            out.push(c);
            i += 1;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collapses_repeats_and_blanks() {
        let letters: Vec<String> = ["", "a", "b", " "].iter().map(|s| s.to_string()).collect();
        /* a a _ a b _ b */
        let pick = |i: usize| {
            let mut row = vec![0.0f32; 4];
            row[i] = 0.9;
            row
        };
        let rows: Vec<f32> = [1, 1, 0, 1, 2, 0, 2]
            .iter()
            .flat_map(|&i| pick(i))
            .collect();
        let (text, score, at) = collapse(&rows, 4, &letters);
        assert_eq!(text, "aabb");
        assert!((score - 0.9).abs() < 1e-6);
        assert_eq!(at, vec![0, 3, 4, 6], "the column each was first read in");
    }

    #[test]
    fn characters_reach_halfway_to_their_neighbours() {
        assert_eq!(
            extents(&[0.1, 0.5, 0.9], 100, 200),
            vec![[100, 130], [130, 170], [170, 200]]
        );
        assert!(extents(&[], 0, 10).is_empty());
    }

    #[test]
    fn a_turned_patch_gets_a_turned_box() {
        let outline = hull(vec![[0.0, 0.0], [100.0, 10.0], [100.0, 20.0], [0.0, 10.0]]);
        let rectangle = Rectangle::around(&outline);
        let (w, h) = rectangle.sides();
        /* Level, it would be 100 by 20; following the slope, about 10 high. */
        assert!(h.min(w) < 11.0, "{w} x {h}");
        let [tl, tr, br, bl] = rectangle.corners();
        assert!(tl[0] < tr[0] && bl[0] < br[0] && tl[1] < bl[1] && tr[1] < br[1]);
    }

    #[test]
    fn nothing_read_is_unsure() {
        let letters: Vec<String> = ["", "a"].iter().map(|s| s.to_string()).collect();
        assert_eq!(
            collapse(&[0.9, 0.1, 0.8, 0.2], 2, &letters),
            (String::new(), 0.0, Vec::new())
        );
    }

    #[test]
    fn a_patch_becomes_a_grown_box() {
        let (w, h) = (40, 20);
        let mut map = vec![0.0f32; w * h];
        for y in 5..10 {
            for x in 5..30 {
                map[y * w + x] = 0.9;
            }
        }
        let boxes = patches(&map, w, h);
        assert_eq!(boxes.len(), 1);
        let [l, t, r, b] = bounds(&boxes[0]);
        assert!(l < 5.0 && t < 5.0 && r > 29.0 && b > 9.0);
    }

    #[test]
    fn faint_and_tiny_patches_are_dropped() {
        let (w, h) = (30, 30);
        let mut map = vec![0.0f32; w * h];
        map[3 * w + 3] = 0.9;
        for y in 10..20 {
            for x in 10..25 {
                map[y * w + x] = 0.35;
            }
        }
        assert!(patches(&map, w, h).is_empty());
    }

    #[test]
    fn two_lines_are_two_patches() {
        let (w, h) = (40, 30);
        let mut map = vec![0.0f32; w * h];
        for y in (4..8).chain(16..20) {
            for x in 2..35 {
                map[y * w + x] = 0.95;
            }
        }
        assert_eq!(patches(&map, w, h).len(), 2);
    }

    #[test]
    fn arabic_comes_back_in_writing_order() {
        /* As the recogniser reads the pixels: left to right. */
        assert_eq!(logical_order("مالس"), "سلام");
        assert_eq!(logical_order("2026 ماع"), "عام 2026");
        assert_eq!(logical_order("PDF فلم"), "ملف PDF");
    }

    #[test]
    fn sureness_weighs_by_length() {
        let read = vec![
            ("abcd".to_string(), 1.0, Vec::new()),
            ("x".to_string(), 0.0, Vec::new()),
        ];
        assert!((sureness(&read) - 0.8).abs() < 1e-6);
        assert_eq!(sureness(&[]), 0.0);
    }

    fn level_box(left: f32, top: f32, right: f32, bottom: f32) -> Quad {
        [[left, top], [right, top], [right, bottom], [left, bottom]]
    }

    #[test]
    fn the_pieces_of_a_line_become_one_box() {
        let pieces = vec![
            level_box(116.0, 106.0, 307.0, 171.0),
            level_box(611.0, 125.0, 653.0, 172.0),
            level_box(308.0, 107.0, 491.0, 175.0),
            level_box(489.0, 112.0, 611.0, 172.0),
            level_box(653.0, 111.0, 860.0, 181.0),
        ];
        let lines = whole_lines(pieces);
        assert_eq!(lines.len(), 1);
        assert_eq!(bounds(&lines[0]), [116.0, 106.0, 860.0, 181.0]);
    }

    #[test]
    fn columns_and_rows_stay_apart() {
        let two_rows = vec![
            level_box(0.0, 0.0, 100.0, 30.0),
            level_box(0.0, 40.0, 100.0, 70.0),
        ];
        assert_eq!(whole_lines(two_rows).len(), 2);
        let two_columns = vec![
            level_box(0.0, 0.0, 100.0, 30.0),
            level_box(140.0, 0.0, 240.0, 30.0),
        ];
        assert_eq!(whole_lines(two_columns).len(), 2);
    }

    #[test]
    fn scaled_keeps_a_flat_colour() {
        let picture = Picture {
            width: 3,
            height: 2,
            pixels: [10u8, 20, 30].repeat(6),
        };
        let bigger = picture.scaled(7, 5);
        assert!(bigger.pixels.chunks(3).all(|p| p == [10, 20, 30]));
    }

    #[test]
    fn extended_keeps_the_picture_and_fills_with_its_edges() {
        let mut pixels = [200u8, 100, 50].repeat(9);
        pixels[12..15].copy_from_slice(&[0, 0, 0]);
        let picture = Picture {
            width: 3,
            height: 3,
            pixels,
        };
        let bigger = picture.extended(5, 4);
        assert_eq!((bigger.width, bigger.height), (5, 4));
        assert_eq!(bigger.at(1, 1), [0, 0, 0]);
        assert_eq!(bigger.at(0, 0), [200, 100, 50]);
        assert_eq!(bigger.at(4, 3), [200, 100, 50]);
        assert_eq!(bigger.at(3, 1), [200, 100, 50]);
    }

    /* A 24- or 32-bit BMP, as `sips -s format bmp` writes one: for the
    measurement below only. */
    fn read_bmp(path: &Path) -> Picture {
        let data = std::fs::read(path).expect("a BMP");
        let u32_at = |i: usize| u32::from_le_bytes(data[i..i + 4].try_into().unwrap());
        let offset = u32_at(10) as usize;
        let width = u32_at(18) as i32 as usize;
        let raw_height = u32_at(22) as i32;
        let bits = u16::from_le_bytes([data[28], data[29]]) as usize;
        let height = raw_height.unsigned_abs() as usize;
        let step = (width * bits / 8).div_ceil(4) * 4;
        let mut pixels = Vec::with_capacity(width * height * 3);
        for row in 0..height {
            let y = if raw_height > 0 {
                height - 1 - row
            } else {
                row
            };
            let start = offset + y * step;
            for x in 0..width {
                let i = start + x * bits / 8;
                pixels.extend_from_slice(&data[i..i + 3]);
            }
        }
        Picture {
            width,
            height,
            pixels,
        }
    }

    /// Reads the screenshots of run sixty-six as the app would and writes
    /// what it read beside RapidOCR's (tests/ocr-score.mjs scores both):
    /// `node tests/ocr-app.mjs` makes the BMPs and runs this. Each image is
    /// read with its own script, as the run read it, or with OCR_SCRIPTS
    /// (say "latin,cyrillic") to try the choice between several.
    #[test]
    #[ignore]
    fn the_screenshots_of_run_sixty_six() {
        let run = std::env::var("OCR_RUN").unwrap_or_else(|_| "ocr".into());
        let chosen: Option<Vec<Script>> = std::env::var("OCR_SCRIPTS")
            .ok()
            .map(|list| list.split(',').filter_map(Script::named).collect());
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../tests/runs")
            .join(&run);
        let models = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/ocr");
        let truth: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(root.join("truth.json")).unwrap())
                .unwrap();
        let mut out = serde_json::Map::new();
        for (name, item) in truth.as_object().unwrap() {
            let own = match item["lang"].as_str().unwrap_or("") {
                "de" | "en" | "es" | "fr" | "it" | "pt" => Some(Script::Latin),
                "ru" | "uk" => Some(Script::Cyrillic),
                "ar" => Some(Script::Arabic),
                "zh" | "ja" => Some(Script::Chinese),
                _ => None,
            };
            let Some(own) = own else { continue };
            let scripts = chosen.clone().unwrap_or_else(|| vec![own]);
            let picture = read_bmp(&root.join("bmp").join(format!("{name}.bmp")));
            let started = Instant::now();
            let lines = read(&models, &picture, &scripts).unwrap();
            let seconds = started.elapsed().as_secs_f64();
            let text: Vec<&str> = lines.iter().map(|line| line.text.as_str()).collect();
            out.insert(
                name.clone(),
                serde_json::json!({
                    "text": text.join("\n"),
                    "lines": lines.iter().map(|line| serde_json::json!({ "t": line.text, "b": line.b })).collect::<Vec<_>>(),
                    "seconds": (seconds * 1000.0).round() / 1000.0,
                }),
            );
            println!("{name} {seconds:.2}s {} lines", lines.len());
        }
        std::fs::write(
            root.join("read-app.json"),
            serde_json::to_string_pretty(&out).unwrap(),
        )
        .unwrap();
    }
}

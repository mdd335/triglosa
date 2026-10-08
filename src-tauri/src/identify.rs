//! Which language a text is in, worked out on this machine by fastText's
//! language identification model instead of asked of an AI model.
//!
//! The window sends a text; what comes back is the five likeliest languages
//! with a probability each, and the window decides what to make of them
//! (src/detect.js). The model is a table: every word of the text and every
//! piece of two to four letters in it has a row of sixteen numbers, the rows
//! are averaged, and a small tree turns the mean into a probability for each
//! of 176 languages.
//!
//! The model comes with the app as one file, `identifier/model.bin` in its
//! resources (src-tauri/resources/identifier in the repository, made by
//! scripts/identifier-pack.py, which describes the file). Where it is missing
//! the window is told so and asks whoever it asked before.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

const MAGIC: &[u8] = b"TGLID1\0\0";

/// How many languages are answered.
const ANSWERS: usize = 5;

/// A text says what it is in long before this many words.
const MAX_WORDS: usize = 400;

/// The end of a line, which the model was trained to see after every text.
const LINE_END: &str = "</s>";

pub struct Identifier {
    dim: usize,
    words_before: usize,
    buckets: u32,
    minn: usize,
    maxn: usize,
    labels: Vec<String>,
    /// Per label the way down the tree: the node, and whether it turns right.
    paths: Vec<Vec<(usize, bool)>>,
    nodes: Vec<f32>,
    scales: Vec<f32>,
    words: HashMap<String, usize>,
    kept_words: usize,
    /// One bit per bucket, and how many are kept before each 64 of them.
    kept: Vec<u64>,
    before: Vec<u32>,
    rows: Vec<u8>,
}

struct Bytes<'a>(&'a [u8]);

impl<'a> Bytes<'a> {
    fn take(&mut self, count: usize) -> Result<&'a [u8], String> {
        if self.0.len() < count {
            return Err("the identifier's file ends too early".into());
        }
        let (head, rest) = self.0.split_at(count);
        self.0 = rest;
        Ok(head)
    }

    fn u8(&mut self) -> Result<usize, String> {
        Ok(self.take(1)?[0] as usize)
    }

    fn u16(&mut self) -> Result<usize, String> {
        let b = self.take(2)?;
        Ok(u16::from_le_bytes([b[0], b[1]]) as usize)
    }

    fn u32(&mut self) -> Result<usize, String> {
        let b = self.take(4)?;
        Ok(u32::from_le_bytes([b[0], b[1], b[2], b[3]]) as usize)
    }

    fn floats(&mut self, count: usize) -> Result<Vec<f32>, String> {
        Ok(self
            .take(count * 4)?
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
            .collect())
    }

    fn text(&mut self, count: usize) -> Result<String, String> {
        String::from_utf8(self.take(count)?.to_vec()).map_err(|error| error.to_string())
    }
}

/// fastText's hash of a piece: FNV-1a over its bytes, each taken as a signed
/// number, which is what the model was trained with.
fn hash(piece: &[u8]) -> u32 {
    piece.iter().fold(2166136261u32, |h, &byte| {
        (h ^ (byte as i8 as u32)).wrapping_mul(16777619)
    })
}

impl Identifier {
    pub fn read(bytes: &[u8]) -> Result<Identifier, String> {
        let mut bytes = Bytes(bytes);
        if bytes.take(MAGIC.len())? != MAGIC {
            return Err("not the identifier's file".into());
        }
        let dim = bytes.u32()?;
        let words_before = bytes.u32()?;
        let buckets = bytes.u32()?;
        let minn = bytes.u32()?;
        let maxn = bytes.u32()?;
        let label_count = bytes.u32()?;
        let kept_words = bytes.u32()?;
        let kept_rows = bytes.u32()?;

        let mut labels = Vec::with_capacity(label_count);
        for _ in 0..label_count {
            let length = bytes.u8()?;
            labels.push(bytes.text(length)?);
        }
        let mut paths = Vec::with_capacity(label_count);
        for _ in 0..label_count {
            let mut path = Vec::new();
            for _ in 0..bytes.u8()? {
                let node = bytes.u16()?;
                path.push((node, bytes.u8()? == 1));
            }
            if path.iter().any(|&(node, _)| node >= label_count) {
                return Err("the identifier's tree names a node it does not have".into());
            }
            paths.push(path);
        }
        let nodes = bytes.floats(label_count * dim)?;
        let scales = bytes.floats(256)?;
        let mut words = HashMap::with_capacity(kept_words);
        for row in 0..kept_words {
            let length = bytes.u16()?;
            words.insert(bytes.text(length)?, row);
        }
        let kept: Vec<u64> = bytes
            .take(buckets.div_ceil(64) * 8)?
            .chunks_exact(8)
            .map(|b| u64::from_le_bytes(b.try_into().unwrap()))
            .collect();
        let mut before = Vec::with_capacity(kept.len());
        let mut seen = 0u32;
        for bits in &kept {
            before.push(seen);
            seen += bits.count_ones();
        }
        let rows = bytes.take(kept_rows * (dim + 1))?.to_vec();
        if kept_words + seen as usize != kept_rows {
            return Err("the identifier's rows do not match what it says is kept".into());
        }
        Ok(Identifier {
            dim,
            words_before,
            buckets: buckets as u32,
            minn,
            maxn,
            labels,
            paths,
            nodes,
            scales,
            words,
            kept_words,
            kept,
            before,
            rows,
        })
    }

    /// Adds a kept row to the sum; a row that was not kept adds nothing.
    fn add(&self, row: usize, sum: &mut [f32], count: &mut usize) {
        let at = row * (self.dim + 1);
        let scale = self.scales[self.rows[at] as usize];
        for (total, &value) in sum.iter_mut().zip(&self.rows[at + 1..at + 1 + self.dim]) {
            *total += value as i8 as f32 * scale;
        }
        *count += 1;
    }

    fn add_bucket(&self, bucket: u32, sum: &mut [f32], count: &mut usize) {
        let (word, bit) = ((bucket / 64) as usize, bucket % 64);
        if self.kept[word] >> bit & 1 == 0 {
            return;
        }
        let earlier = (self.kept[word] & ((1u64 << bit) - 1)).count_ones();
        let row = self.kept_words + (self.before[word] + earlier) as usize;
        self.add(row, sum, count);
    }

    /// The pieces of a word as fastText cuts them: every run of `minn` to
    /// `maxn` characters of the word between its two brackets.
    fn add_pieces(&self, word: &str, sum: &mut [f32], count: &mut usize) {
        let framed = format!("<{word}>");
        let bytes = framed.as_bytes();
        let starts: Vec<usize> = framed.char_indices().map(|(at, _)| at).collect();
        for (index, &from) in starts.iter().enumerate() {
            for length in self.minn..=self.maxn {
                let Some(&to) = starts
                    .get(index + length)
                    .or((index + length == starts.len()).then_some(&bytes.len()))
                else {
                    break;
                };
                self.add_bucket(hash(&bytes[from..to]) % self.buckets, sum, count);
            }
        }
    }

    /// The likeliest languages of a text, likeliest first.
    pub fn top(&self, text: &str) -> Vec<(String, f32)> {
        let mut sum = vec![0f32; self.dim];
        let mut count = 0;
        let separates = |c: char| matches!(c, ' ' | '\n' | '\r' | '\t' | '\x0b' | '\x0c' | '\0');
        for word in text
            .split(separates)
            .filter(|word| !word.is_empty())
            .take(MAX_WORDS)
        {
            if let Some(&row) = self.words.get(word) {
                self.add(row, &mut sum, &mut count);
            }
            if word != LINE_END {
                self.add_pieces(word, &mut sum, &mut count);
            }
        }
        if let Some(&row) = self.words.get(LINE_END) {
            self.add(row, &mut sum, &mut count);
        }
        if count == 0 {
            return Vec::new();
        }
        for value in sum.iter_mut() {
            *value /= count as f32;
        }

        let turns: Vec<f32> = self
            .nodes
            .chunks_exact(self.dim)
            .map(|node| {
                let dot: f32 = node.iter().zip(&sum).map(|(a, b)| a * b).sum();
                1.0 / (1.0 + (-dot).exp())
            })
            .collect();
        let mut found: Vec<(usize, f32)> = self
            .paths
            .iter()
            .map(|path| {
                path.iter()
                    .map(|&(node, right)| {
                        if right {
                            turns[node]
                        } else {
                            1.0 - turns[node]
                        }
                    })
                    .product()
            })
            .enumerate()
            .collect();
        found.sort_by(|a, b| b.1.total_cmp(&a.1));
        found
            .into_iter()
            .take(ANSWERS)
            .map(|(label, share)| (self.labels[label].clone(), share))
            .collect()
    }
}

static LOADED: Mutex<Option<Arc<Identifier>>> = Mutex::new(None);

fn file(app: &AppHandle) -> Option<PathBuf> {
    let file = app
        .path()
        .resource_dir()
        .ok()?
        .join("identifier")
        .join("model.bin");
    file.is_file().then_some(file)
}

fn loaded(app: &AppHandle) -> Result<Arc<Identifier>, String> {
    let mut held = LOADED.lock().map_err(|error| error.to_string())?;
    if let Some(identifier) = held.as_ref() {
        return Ok(identifier.clone());
    }
    let bytes = std::fs::read(file(app).ok_or("absent")?).map_err(|error| error.to_string())?;
    let identifier = Arc::new(Identifier::read(&bytes)?);
    *held = Some(identifier.clone());
    Ok(identifier)
}

/// Whether the model's file is on this machine.
#[tauri::command]
pub fn identifier_ready(app: AppHandle) -> bool {
    file(&app).is_some()
}

/// The likeliest languages of a text with a probability each, likeliest
/// first; none for a text with nothing the model knows.
#[tauri::command]
pub async fn identify_language(app: AppHandle, text: String) -> Result<Vec<(String, f32)>, String> {
    Ok(loaded(&app)?.top(&text))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn a_piece_is_hashed_as_fasttext_hashes_it() {
        assert_eq!(hash(b""), 2166136261);
        assert_eq!(hash(b"a"), 0xe40c292c);
        /* A byte above 127 counts as a negative number. */
        assert_eq!(
            hash("é".as_bytes()),
            "é".as_bytes().iter().fold(2166136261u32, |h, &b| {
                (h ^ (b as i8 as i32 as u32)).wrapping_mul(16777619)
            })
        );
        assert_ne!(
            hash("é".as_bytes()),
            "é".as_bytes()
                .iter()
                .fold(2166136261u32, |h, &b| (h ^ b as u32).wrapping_mul(16777619))
        );
    }

    /// A model of two languages, four buckets and two numbers a row, written
    /// as scripts/identifier-pack.py writes one: the word "si" and the
    /// buckets 1 and 2 are kept.
    fn small() -> Vec<u8> {
        let mut bytes = MAGIC.to_vec();
        for value in [2u32, 2, 4, 2, 2, 2, 2, 4] {
            bytes.extend(value.to_le_bytes());
        }
        for label in ["aa", "bb"] {
            bytes.push(label.len() as u8);
            bytes.extend(label.as_bytes());
        }
        /* One node above both: left is the first label, right the second. */
        bytes.extend([1, 0, 0, 0]);
        bytes.extend([1, 0, 0, 1]);
        for value in [1f32, 0.0, 0.0, 0.0] {
            bytes.extend(value.to_le_bytes());
        }
        for index in 0..256 {
            bytes.extend((index as f32 / 100.0).to_le_bytes());
        }
        for word in [LINE_END, "si"] {
            bytes.extend((word.len() as u16).to_le_bytes());
            bytes.extend(word.as_bytes());
        }
        bytes.extend(0b0110u64.to_le_bytes());
        /* The line's end says nothing, "si" pulls right, the buckets left. */
        bytes.extend([100, 0, 0]);
        bytes.extend([100, 100, 0]);
        bytes.extend([100, (-50i8) as u8, 0]);
        bytes.extend([100, (-50i8) as u8, 0]);
        bytes
    }

    #[test]
    fn a_text_is_read_off_the_kept_rows() {
        let identifier = Identifier::read(&small()).unwrap();
        let found = identifier.top("si");
        assert_eq!(found.len(), 2);
        assert!((found[0].1 + found[1].1 - 1.0).abs() < 1e-6);
        /* A word that is not kept still has pieces, or says nothing. */
        let other = identifier.top("zzzz");
        assert!(other.is_empty() || (other[0].1 + other[1].1 - 1.0).abs() < 1e-6);
        assert!(Identifier::read(&small()[..40]).is_err());
        assert!(Identifier::read(b"something else entirely").is_err());
    }

    #[test]
    fn a_bucket_finds_its_row_among_the_kept() {
        let identifier = Identifier::read(&small()).unwrap();
        let (mut sum, mut count) = (vec![0f32; 2], 0);
        identifier.add_bucket(0, &mut sum, &mut count);
        identifier.add_bucket(3, &mut sum, &mut count);
        assert_eq!(count, 0);
        identifier.add_bucket(2, &mut sum, &mut count);
        assert_eq!(count, 1);
        assert!((sum[0] + 50.0).abs() < 1e-4);
    }

    /// The texts of the detection runs through this file's own reading, for
    /// tests/detection.mjs to score. Wants the model, so it runs only when
    /// asked: TRIGLOSA_IDENTIFIER=<model.bin> TRIGLOSA_ITEMS=<items.jsonl>
    /// TRIGLOSA_ANSWERS=<file to write> cargo test -- --ignored identified
    #[test]
    #[ignore]
    fn the_texts_are_identified() {
        let env = |name: &str| std::env::var(name).expect(name);
        let started = Instant::now();
        let identifier =
            Identifier::read(&std::fs::read(env("TRIGLOSA_IDENTIFIER")).unwrap()).unwrap();
        let load_ms = started.elapsed().as_secs_f64() * 1000.0;
        let lower = std::env::var("TRIGLOSA_LOWER").is_ok();
        let mut texts = serde_json::Map::new();
        for line in std::fs::read_to_string(env("TRIGLOSA_ITEMS"))
            .unwrap()
            .lines()
        {
            let item: serde_json::Value = serde_json::from_str(line).unwrap();
            let mut text = item["text"].as_str().unwrap().to_string();
            if lower {
                text = text.to_lowercase();
            }
            let started = Instant::now();
            let mut top = Vec::new();
            for _ in 0..20 {
                top = identifier.top(&text);
            }
            let ms = started.elapsed().as_secs_f64() * 1000.0 / 20.0;
            texts.insert(
                item["id"].as_str().unwrap().into(),
                serde_json::json!({ "top": top, "ms": ms }),
            );
        }
        std::fs::write(
            env("TRIGLOSA_ANSWERS"),
            serde_json::json!({ "loadMs": load_ms, "texts": texts }).to_string(),
        )
        .unwrap();
        println!("{} texts, loaded in {load_ms:.1} ms", texts.len());
    }
}

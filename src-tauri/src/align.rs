//! Which words of a sentence became which words of its translation, worked
//! out on this machine by a small encoder instead of asked of an AI model.
//!
//! The window sends a sentence, its translation and where the words of each
//! stand; what comes back is pairs of word numbers. Both texts go through the
//! encoder on their own, every piece of one is compared with every piece of
//! the other, and a pair counts where each side gives the other more than a
//! threshold of its weight — the way the model was trained to be read.
//!
//! The model comes with the app, as four files in the folder `aligner` of
//! its resources (fetched for a build by scripts/aligner-fetch.mjs).
//! `model.onnx` is the graph and `model.data` its weights, apart so that
//! ONNX Runtime maps them from the disk instead of copying them — about 110
//! MB held instead of 690. `tokenizer.json` says how a text is tidied and
//! split into words, and `pieces.txt` lists the pieces a word is cut into
//! (pieces.rs). Where any of them is missing the window is told so and asks
//! the AI model as it always did.

use crate::pieces::Pieces;
use ort::session::Session;
use ort::value::Tensor;
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tokenizers::{
    NormalizedString, Normalizer, OffsetType, PreTokenizedString, PreTokenizer, Token, Tokenizer,
};

/// A pair counts from this share of the weight, in both directions.
const THRESHOLD: f32 = 1e-3;

/// The model is let go after this long without a question: it holds some
/// 150 MB, and a reader who has stopped reading wants them back.
const IDLE: Duration = Duration::from_secs(300);

/// What the encoder takes at once. A sentence is far below it; a text whose
/// sentences could not be paired comes whole and is cut here.
const MAX_PIECES: usize = 512;

#[derive(Deserialize)]
pub struct Pair {
    source: String,
    target: String,
    /// Where the words stand, as the window counts: UTF-16 units.
    source_words: Vec<[usize; 2]>,
    target_words: Vec<[usize; 2]>,
}

/// The markers the model wants around a text, and the piece for a character
/// it has never seen: their places in `pieces.txt`.
const OPENS: u32 = 0;
const CLOSES: u32 = 2;
const UNKNOWN: u32 = 3;

struct Loaded {
    session: Session,
    tokenizer: Tokenizer,
    pieces: Pieces,
    used: Instant,
}

static LOADED: Mutex<Option<Loaded>> = Mutex::new(None);

fn folder(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .resource_dir()
        .ok()
        .map(|dir| dir.join("aligner"))
}

fn files(app: &AppHandle) -> Option<PathBuf> {
    let dir = folder(app)?;
    ["model.onnx", "model.data", "tokenizer.json", "pieces.txt"]
        .iter()
        .all(|name| dir.join(name).is_file())
        .then_some(dir)
}

fn load(app: &AppHandle) -> Result<Loaded, String> {
    load_from(files(app).ok_or("absent")?)
}

fn load_from(dir: PathBuf) -> Result<Loaded, String> {
    let threads = std::thread::available_parallelism()
        .map_or(1, |n| n.get())
        .min(4);
    let session = Session::builder()
        .and_then(|builder| builder.with_intra_threads(threads))
        .and_then(|builder| builder.commit_from_file(dir.join("model.onnx")))
        .map_err(|error| error.to_string())?;
    let tokenizer =
        Tokenizer::from_file(dir.join("tokenizer.json")).map_err(|error| error.to_string())?;
    let pieces = Pieces::read(
        &std::fs::read_to_string(dir.join("pieces.txt")).map_err(|error| error.to_string())?,
        UNKNOWN,
    );
    Ok(Loaded {
        session,
        tokenizer,
        pieces,
        used: Instant::now(),
    })
}

/// A text as the model reads it: the ids of its pieces between the two
/// markers, and where each piece stands in the text, counted in characters.
fn pieces_of(loaded: &Loaded, text: &str) -> Result<(Vec<i64>, Vec<(usize, usize)>), String> {
    let failed = |error: tokenizers::Error| error.to_string();
    let mut words = PreTokenizedString::from(text);
    if let Some(normalizer) = loaded.tokenizer.get_normalizer() {
        words
            .normalize(|text: &mut NormalizedString| normalizer.normalize(text))
            .map_err(failed)?;
    }
    if let Some(splitter) = loaded.tokenizer.get_pre_tokenizer() {
        splitter.pre_tokenize(&mut words).map_err(failed)?;
    }
    words
        .tokenize(|word| {
            let word = word.get();
            Ok(loaded
                .pieces
                .cut(word)
                .into_iter()
                .map(|(id, from, to)| Token::new(id, word[from..to].to_string(), (from, to)))
                .collect())
        })
        .map_err(failed)?;
    let cut = words
        .into_encoding(None, 0, OffsetType::Char)
        .map_err(failed)?;
    /* Cut to what the encoder takes, the closing marker included. */
    let kept = cut.get_ids().len().min(MAX_PIECES - 2);
    let mut ids = vec![OPENS as i64];
    ids.extend(cut.get_ids()[..kept].iter().map(|&id| id as i64));
    ids.push(CLOSES as i64);
    let mut offsets = vec![(0, 0)];
    offsets.extend(&cut.get_offsets()[..kept]);
    offsets.push((0, 0));
    Ok((ids, offsets))
}

/// Lets the model go once nobody has asked for a while. Started with the
/// first load and ends with the unloading; the next question loads again.
fn watch() {
    std::thread::spawn(|| loop {
        std::thread::sleep(Duration::from_secs(30));
        let mut loaded = LOADED
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        match loaded.as_ref() {
            Some(model) if model.used.elapsed() < IDLE => {}
            _ => {
                *loaded = None;
                return;
            }
        }
    });
}

/// A position counted in UTF-16 units, as a position counted in characters.
fn in_chars(text: &str, words: &[[usize; 2]]) -> Vec<[usize; 2]> {
    let mut at = Vec::with_capacity(text.len() + 1);
    let mut units = 0;
    for (index, letter) in text.chars().enumerate() {
        for _ in 0..letter.len_utf16() {
            at.push(index);
        }
        units += letter.len_utf16();
    }
    at.push(text.chars().count());
    let of = |unit: usize| at[unit.min(units)];
    words
        .iter()
        .map(|[start, end]| [of(*start), of(*end)])
        .collect()
}

/// For every piece the tokenizer cut, the word it lies in.
fn owners(offsets: &[(usize, usize)], words: &[[usize; 2]]) -> Vec<Option<usize>> {
    offsets
        .iter()
        .map(|&(start, end)| {
            if end <= start {
                return None;
            }
            words
                .iter()
                .position(|[from, to]| start < *to && end > *from)
        })
        .collect()
}

/// The pairs of words, from the pieces' vectors: `a` holds `rows` vectors of
/// `width` numbers, `b` holds `cols`.
fn links(
    a: &[f32],
    b: &[f32],
    width: usize,
    a_owner: &[Option<usize>],
    b_owner: &[Option<usize>],
) -> Vec<[usize; 2]> {
    let rows: Vec<usize> = (0..a_owner.len())
        .filter(|&i| a_owner[i].is_some())
        .collect();
    let cols: Vec<usize> = (0..b_owner.len())
        .filter(|&j| b_owner[j].is_some())
        .collect();
    if rows.is_empty() || cols.is_empty() {
        return Vec::new();
    }
    let mut alike = vec![0f32; rows.len() * cols.len()];
    for (r, &i) in rows.iter().enumerate() {
        let left = &a[i * width..(i + 1) * width];
        for (c, &j) in cols.iter().enumerate() {
            let right = &b[j * width..(j + 1) * width];
            alike[r * cols.len() + c] = left.iter().zip(right).map(|(x, y)| x * y).sum();
        }
    }
    /* Softmax along a row and along a column, each from its own greatest so
    that nothing overflows. */
    let share = |values: &mut dyn Iterator<Item = f32>| -> (f32, f32) {
        let all: Vec<f32> = values.collect();
        let top = all.iter().cloned().fold(f32::MIN, f32::max);
        (top, all.iter().map(|v| (v - top).exp()).sum())
    };
    let by_row: Vec<(f32, f32)> = (0..rows.len())
        .map(|r| share(&mut (0..cols.len()).map(|c| alike[r * cols.len() + c])))
        .collect();
    let by_col: Vec<(f32, f32)> = (0..cols.len())
        .map(|c| share(&mut (0..rows.len()).map(|r| alike[r * cols.len() + c])))
        .collect();

    let mut found: Vec<[usize; 2]> = Vec::new();
    for r in 0..rows.len() {
        for c in 0..cols.len() {
            let value = alike[r * cols.len() + c];
            let across = (value - by_row[r].0).exp() / by_row[r].1;
            let down = (value - by_col[c].0).exp() / by_col[c].1;
            if across > THRESHOLD && down > THRESHOLD {
                let pair = [a_owner[rows[r]].unwrap_or(0), b_owner[cols[c]].unwrap_or(0)];
                if !found.contains(&pair) {
                    found.push(pair);
                }
            }
        }
    }
    found.sort();
    found
}

fn encode(
    loaded: &mut Loaded,
    text: &str,
    words: &[[usize; 2]],
) -> Result<(Vec<f32>, usize, Vec<Option<usize>>), String> {
    let (ids, offsets) = pieces_of(loaded, text)?;
    let count = ids.len();
    let mask = vec![1i64; count];
    let owner = owners(&offsets, &in_chars(text, words));
    let ids = Tensor::from_array(([1usize, count], ids)).map_err(|error| error.to_string())?;
    let mask = Tensor::from_array(([1usize, count], mask)).map_err(|error| error.to_string())?;
    let out = loaded
        .session
        .run(ort::inputs!["input_ids" => ids, "attention_mask" => mask])
        .map_err(|error| error.to_string())?;
    let (shape, data) = out["hidden"]
        .try_extract_tensor::<f32>()
        .map_err(|error| error.to_string())?;
    let width = shape[2] as usize;
    Ok((data.to_vec(), width, owner))
}

fn align(loaded: &mut Loaded, pair: &Pair) -> Result<Vec<[usize; 2]>, String> {
    let (a, width, a_owner) = encode(loaded, &pair.source, &pair.source_words)?;
    let (b, _, b_owner) = encode(loaded, &pair.target, &pair.target_words)?;
    Ok(links(&a, &b, width, &a_owner, &b_owner))
}

/// Whether the model's files are there. Nothing is loaded for the answer.
#[tauri::command]
pub fn aligner_ready(app: AppHandle) -> bool {
    files(&app).is_some()
}

/// The links of every pair handed in, in their order. "absent" where the
/// files are missing; the window then asks the AI model instead.
#[tauri::command]
pub async fn align_words(app: AppHandle, pairs: Vec<Pair>) -> Result<Vec<Vec<[usize; 2]>>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut held = LOADED
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if held.is_none() {
            *held = Some(load(&app)?);
            watch();
        }
        let loaded = held.as_mut().ok_or("absent")?;
        loaded.used = Instant::now();
        pairs.iter().map(|pair| align(loaded, pair)).collect()
    })
    .await
    .map_err(|error| error.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn positions_counted_in_utf16_become_characters() {
        /* An emoji is two units and one character; everything after it moves. */
        let text = "a 😀 bc";
        assert_eq!(in_chars(text, &[[0, 1], [5, 7]]), vec![[0, 1], [4, 6]]);
        /* A position past the end is the end. */
        assert_eq!(in_chars("ab", &[[1, 9]]), vec![[1, 2]]);
    }

    #[test]
    fn a_piece_belongs_to_the_word_it_lies_in() {
        let words = [[0, 3], [4, 9]];
        /* The marker at the start has no length and no word; a piece of the
        second word is the second word's; punctuation is nobody's. */
        let offsets = [(0, 0), (0, 3), (4, 6), (6, 9), (9, 10)];
        assert_eq!(
            owners(&offsets, &words),
            vec![None, Some(0), Some(1), Some(1), None]
        );
    }

    #[test]
    fn like_pieces_are_linked_and_unlike_ones_are_not() {
        /* Two words each, pointing along two different axes: each finds its
        own counterpart and not the other. */
        let a = [10.0, 0.0, 0.0, 10.0];
        let b = [0.0, 10.0, 10.0, 0.0];
        let owner = [Some(0), Some(1)];
        assert_eq!(links(&a, &b, 2, &owner, &owner), vec![[0, 1], [1, 0]]);
    }

    #[test]
    fn pieces_of_one_word_make_one_link() {
        let a = [10.0, 0.0, 10.0, 0.0];
        let b = [10.0, 0.0];
        assert_eq!(
            links(&a, &b, 2, &[Some(0), Some(0)], &[Some(0)]),
            vec![[0, 0]]
        );
    }

    #[test]
    fn nothing_to_link_is_no_link() {
        assert!(links(&[], &[1.0, 0.0], 2, &[], &[Some(0)]).is_empty());
        assert!(links(&[1.0, 0.0], &[1.0, 0.0], 2, &[None], &[Some(0)]).is_empty());
    }

    /// The measured links, pair by pair: the same model through this code
    /// has to say what it said through the measurement's
    /// (`tests/align.py`, run forty). Wants the model, so it runs only when
    /// asked: TRIGLOSA_ALIGNER=<the folder with the model's four files>
    /// TRIGLOSA_ALIGNED=<links-….json> cargo test -- --ignored measured
    #[test]
    #[ignore]
    fn the_measured_links_come_out_again() {
        let dir = PathBuf::from(std::env::var("TRIGLOSA_ALIGNER").expect("TRIGLOSA_ALIGNER"));
        let kept: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(std::env::var("TRIGLOSA_ALIGNED").expect("TRIGLOSA_ALIGNED"))
                .unwrap(),
        )
        .unwrap();
        let items =
            std::fs::read_to_string(std::env::var("TRIGLOSA_ITEMS").expect("TRIGLOSA_ITEMS"))
                .unwrap();
        let mut loaded = load_from(dir).unwrap();
        let ranges = |value: &serde_json::Value| -> Vec<[usize; 2]> {
            value
                .as_array()
                .unwrap()
                .iter()
                .map(|r| {
                    [
                        r[0].as_u64().unwrap() as usize,
                        r[1].as_u64().unwrap() as usize,
                    ]
                })
                .collect()
        };
        let (mut same, mut mine, mut theirs, mut pairs, mut differing) = (0, 0, 0, 0, 0);
        let started = Instant::now();
        for line in items.lines() {
            let item: serde_json::Value = serde_json::from_str(line).unwrap();
            let pair = Pair {
                source: item["sentence"].as_str().unwrap().into(),
                target: item["rendering"].as_str().unwrap().into(),
                source_words: ranges(&item["src"]),
                target_words: ranges(&item["tgt"]),
            };
            let found = align(&mut loaded, &pair).unwrap();
            let wanted = ranges(&kept["pairs"][item["key"].as_str().unwrap()]["links"]);
            pairs += 1;
            mine += found.len();
            theirs += wanted.len();
            same += found.iter().filter(|link| wanted.contains(link)).count();
            if found != wanted {
                differing += 1;
            }
        }
        println!("{pairs} pairs in {:?}: {mine} links here, {theirs} measured, {same} the same, {differing} pairs differ", started.elapsed());
        assert!(
            same * 100 >= mine.max(theirs) * 99,
            "fewer than 99 % of the links agree"
        );
    }
}

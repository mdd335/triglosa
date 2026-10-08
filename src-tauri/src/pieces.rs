//! The pieces a word is cut into before the aligner's model reads it, the way
//! SentencePiece's unigram model cuts it: of all the ways to lay known pieces
//! over the word, the one whose scores add up highest.
//!
//! The `tokenizers` crate does the same and holds a quarter of a million
//! pieces in about 390 MB to do it; a plain table holds them in about 40, and
//! cuts every text of the measurement into the same pieces at the same
//! places (run forty).

use std::collections::HashMap;

pub struct Pieces {
    known: HashMap<Box<[u8]>, (u32, f32)>,
    longest: usize,
    unknown: (u32, f32),
}

/// What an unknown character costs beyond the least likely piece.
const UNKNOWN_PENALTY: f32 = 10.0;

impl Pieces {
    /// One piece a line, its score after a tab; the line's number is its id.
    pub fn read(text: &str, unknown: u32) -> Pieces {
        let mut known = HashMap::new();
        let mut longest = 0;
        let mut least = f32::MAX;
        for (id, line) in text.lines().enumerate() {
            let Some((piece, score)) = line.rsplit_once('\t') else {
                continue;
            };
            let score: f32 = score.parse().unwrap_or(0.0);
            least = least.min(score);
            longest = longest.max(piece.len());
            if id as u32 != unknown {
                known.insert(piece.as_bytes().into(), (id as u32, score));
            }
        }
        Pieces {
            known,
            longest,
            unknown: (unknown, least - UNKNOWN_PENALTY),
        }
    }

    /// The ids of the best cut and where each piece stands, in bytes.
    /// Unknown characters next to each other are one piece.
    pub fn cut(&self, word: &str) -> Vec<(u32, usize, usize)> {
        let bytes = word.as_bytes();
        let size = bytes.len();
        /* For every place a piece can end: the best score up to there, where
        that piece starts and which it is. */
        let mut best: Vec<Option<(f32, usize, u32)>> = vec![None; size + 1];
        best[0] = Some((0.0, 0, 0));
        let mut starts = word.char_indices().map(|(at, _)| at).collect::<Vec<_>>();
        starts.push(size);
        for (index, &from) in starts[..starts.len() - 1].iter().enumerate() {
            let Some((so_far, _, _)) = best[from] else {
                continue;
            };
            let one = starts[index + 1];
            let mut single = false;
            for &to in starts[index + 1..]
                .iter()
                .take_while(|&&to| to - from <= self.longest)
            {
                if let Some(&(id, score)) = self.known.get(&bytes[from..to]) {
                    let total = so_far + score;
                    if best[to].map_or(true, |(other, _, _)| total > other) {
                        best[to] = Some((total, from, id));
                    }
                    if to == one {
                        single = true;
                    }
                }
            }
            if !single {
                let total = so_far + self.unknown.1;
                if best[one].map_or(true, |(other, _, _)| total > other) {
                    best[one] = Some((total, from, self.unknown.0));
                }
            }
        }
        let mut out: Vec<(u32, usize, usize)> = Vec::new();
        let mut at = size;
        while at > 0 {
            let Some((_, from, id)) = best[at] else { break };
            match out.last_mut() {
                Some(last) if id == self.unknown.0 && last.0 == id && last.1 == at => last.1 = from,
                _ => out.push((id, from, at)),
            }
            at = from;
        }
        out.reverse();
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pieces() -> Pieces {
        Pieces::read("<s>\t0\n<pad>\t0\n</s>\t0\n<unk>\t0\n\u{2581}\t-3\n\u{2581}ca\t-4\nsa\t-5\n\u{2581}casa\t-6\ns\t-4\na\t-4\n\u{2581}c\t-9\n", 3)
    }

    #[test]
    fn the_likeliest_cut_wins_over_the_longest_or_the_first() {
        /* "▁casa" as one piece (-6) beats "▁ca" + "sa" (-9). */
        assert_eq!(pieces().cut("\u{2581}casa"), vec![(7, 0, 7)]);
        /* No piece for the whole of it: the best two. */
        assert_eq!(pieces().cut("\u{2581}cas"), vec![(5, 0, 5), (8, 5, 6)]);
    }

    #[test]
    fn unknown_characters_side_by_side_are_one_piece() {
        assert_eq!(
            pieces().cut("\u{2581}ca\u{4e2d}\u{6587}a"),
            vec![(5, 0, 5), (3, 5, 11), (9, 11, 12)]
        );
    }

    #[test]
    fn nothing_is_cut_into_nothing() {
        assert!(pieces().cut("").is_empty());
    }
}

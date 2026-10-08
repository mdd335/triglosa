"""Makes the one file the language identifier reads (src-tauri/src/identify.rs)
out of fastText's published language identification model:

    python scripts/identifier-pack.py <lid.176.bin> <target file> [--rows=1000000]

Wants fasttext and numpy; nothing here is part of the app's build.

The published model is a table of two million rows of sixteen numbers, one
row per word or piece of a word, and a small tree that turns their mean into
a probability for each of 176 languages. What is done to it:

  - only the rows with the largest norm are kept (`--rows`), which is how
    fastText itself shrinks a model: a row near zero moves the mean little;
  - a row's numbers are rounded to 8 bits against a scale of its own, taken
    from a table of 256 scales;
  - which rows are kept is one bit per row, so no row carries its number;
  - the tree is written out as the path to each language.

The file, little-endian throughout:

    "TGLID1\0\0"
    u32 dim, words, buckets, minn, maxn, labels, kept words, kept rows
    labels:   u8 length, the label's bytes
    paths:    per label u8 length, then per step u16 node, u8 turn
    nodes:    labels x dim f32
    scales:   256 f32
    words:    per kept word u16 length, its bytes (its row is its place here)
    buckets:  one bit per bucket, kept or not, to a multiple of 8 bytes
    rows:     per kept row u8 scale, dim i8 - the kept words, then the kept
              buckets in their order

The model is distributed under the Creative Commons Attribution-Share-Alike
License 3.0, and so is the file made of it; NOTICE.txt beside it in
src-tauri/resources/identifier says so.
"""

import struct
import sys

import fasttext
import numpy as np

fasttext.FastText.eprint = lambda x: None


def paths(counts):
    """The tree fastText builds over the labels' counts, as each label's path."""
    size = len(counts)
    count = [1e15] * (2 * size - 1)
    parent = [-1] * (2 * size - 1)
    binary = [False] * (2 * size - 1)
    count[:size] = counts
    leaf, node = size - 1, size
    for i in range(size, 2 * size - 1):
        mini = [0, 0]
        for j in range(2):
            if leaf >= 0 and count[leaf] < count[node]:
                mini[j] = leaf
                leaf -= 1
            else:
                mini[j] = node
                node += 1
        count[i] = count[mini[0]] + count[mini[1]]
        parent[mini[0]] = parent[mini[1]] = i
        binary[mini[1]] = True
    out = []
    for i in range(size):
        path, j = [], i
        while parent[j] != -1:
            path.append((parent[j] - size, binary[j]))
            j = parent[j]
        out.append(path)
    return out


def main():
    source, target = sys.argv[1], sys.argv[2]
    rows = next((int(a.split("=")[1]) for a in sys.argv[3:] if a.startswith("--rows=")), 1_000_000)

    model = fasttext.load_model(source)
    args = model.f.getArgs()
    words = model.get_words()
    labels, counts = model.get_labels(include_freq=True)
    table = model.get_input_matrix()
    nodes = model.get_output_matrix().astype("<f4")
    assert words[0] == "</s>" and table.shape[0] == len(words) + args.bucket

    norms = np.linalg.norm(table, axis=1)
    norms[0] = np.inf  # the end of a line is always kept, as fastText keeps it
    kept = np.zeros(table.shape[0], dtype=bool)
    kept[np.argsort(-norms, kind="stable")[: min(rows, table.shape[0])]] = True
    chosen = table[kept]

    peak = np.abs(chosen).max(axis=1)
    low, high = max(peak[peak > 0].min(), 1e-6), peak.max()
    scales = np.exp(np.linspace(np.log(low / 127), np.log(high / 127), 256)).astype("<f4")
    scales[-1] = np.float32(high / 127 * 1.0001)
    which = np.minimum(np.searchsorted(scales, peak / 127, side="left"), 255).astype(np.uint8)
    rounded = np.clip(np.rint(chosen / scales[which][:, None]), -127, 127).astype(np.int8)

    kept_words = [word for word, keep in zip(words, kept[: len(words)]) if keep]
    with open(target, "wb") as out:
        out.write(b"TGLID1\0\0")
        out.write(struct.pack("<8I", args.dim, len(words), args.bucket, args.minn, args.maxn,
                              len(labels), len(kept_words), int(kept.sum())))
        for label in labels:
            name = label.replace("__label__", "").encode()
            out.write(struct.pack("<B", len(name)) + name)
        for path in paths([int(c) for c in counts]):
            out.write(struct.pack("<B", len(path)))
            for node, turn in path:
                out.write(struct.pack("<HB", node, int(turn)))
        out.write(nodes.tobytes())
        out.write(scales.tobytes())
        for word in kept_words:
            name = word.encode()
            out.write(struct.pack("<H", len(name)) + name)
        bits = np.packbits(kept[len(words):], bitorder="little").tobytes()
        out.write(bits + b"\0" * (-len(bits) % 8))
        both = np.empty((len(rounded), args.dim + 1), dtype=np.uint8)
        both[:, 0] = which
        both[:, 1:] = rounded.view(np.uint8)
        out.write(both.tobytes())
    print(f"{int(kept.sum())} of {table.shape[0]} rows, {len(kept_words)} of {len(words)} words → {target}")


if __name__ == "__main__":
    main()

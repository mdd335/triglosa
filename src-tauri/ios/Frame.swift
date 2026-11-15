/* Where in a picture the text to be read most likely is, worked out from
   the lines Apple recognised in it, for the crop frame to glide onto
   (Crop.swift, `suggestedCut` in Recognition.swift). The file belongs to the
   app's target and to both share extensions', and is compiled on the Mac
   by the measurement tool tests/photo-frame.swift (run 89).

   The lines are put into blocks of text standing close together. The
   block with the most letters is what the reader aimed at; other blocks
   join it unless they are cut off by the picture's edge, mostly numbers (a
   price label, a barcode's digits), of far smaller type, or turned against
   the rest (a bottle's curved side, a newspaper lying under a book). A
   block of a few letters, or one turned a little, joins only beside what
   is kept. Nothing where the text reaches the picture's edge: the reader
   then has framed it already. */

import CoreGraphics
import Foundation
import Vision

/* A line as Apple recognised it: its upright box in the picture's pixels,
   top left first, its slope in pixels of drop in a thousand across, and its
   text. */
struct SeenLine {
  let box: CGRect
  let slope: Int
  let text: String
}

/* Blocks are lines no further apart than this many times the thinner one's
   height. */
private let near = 1.5
/* A block of type smaller than this share of the text's is left out. */
private let smaller = 0.5
/* A block of fewer letters joins only within this many times the text's
   height of what is kept. */
private let few = 10
private let beside = 2.0
/* A line turned against the rest by more than this (radians) is of
   another kind: by a little for a long line, by a lot for any line. */
private let turnedLong = 0.15
private let turnedAny = 0.5
/* Turned more than this, it lies across the rest and never joins; turned
   less, it joins only with type nearly as large as the text's: a chalked
   line written aslant, not a bottle's curved small print. */
private let across = 1.05
private let turnedSize = 0.75

private struct Line {
  let box: CGRect
  let slope: Double
  let letters: Int
  let digits: Int
  let long: Double
  let thick: Double
  var odd = false
  var wordy: Bool { letters > digits }
}

private func median(_ values: [Double]) -> Double {
  values.sorted()[values.count / 2]
}

/* A line's own rectangle, its length along its slope and its thickness,
   worked back from its upright box (as src/screen-text.js does). */
private func shape(_ box: CGRect, _ slope: Double, _ count: Int) -> (long: Double, thick: Double) {
  let own = atan(slope / 1000)
  let (c, s) = (abs(cos(own)), abs(sin(own)))
  let (wide, tall) = (Double(box.width), Double(box.height))
  let square = c * c - s * s
  if abs(square) >= 0.3 {
    return (max((wide * c - tall * s) / square, 1), max((tall * c - wide * s) / square, 1))
  }
  let sum = (wide + tall) / (c + s)
  let thick = sum / (1 + Double(max(count, 1)) / 2)
  return (sum - thick, thick)
}

func textFrame(_ seen: [SeenLine], width: Double, height: Double) -> CGRect? {
  var lines: [Line] = seen.compactMap { line in
    let text = line.text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty else { return nil }
    let letters = text.unicodeScalars.filter { CharacterSet.letters.contains($0) }.count
    let digits = text.unicodeScalars.filter { CharacterSet.decimalDigits.contains($0) }.count
    let count = text.unicodeScalars.filter { !CharacterSet.whitespaces.contains($0) }.count
    let (long, thick) = shape(line.box, Double(line.slope), count)
    return Line(box: line.box, slope: Double(line.slope), letters: letters, digits: digits, long: long, thick: thick)
  }
  guard !lines.isEmpty else { return nil }
  let level = lines.filter { abs($0.slope) <= 1000 && $0.long > 3 * $0.thick }
  let shared = level.isEmpty ? 0 : median(level.map(\.slope))
  func turned(_ line: Line) -> Double { abs(atan(line.slope / 1000) - atan(shared / 1000)) }
  for index in lines.indices {
    let line = lines[index]
    lines[index].odd = (line.long > 3 * line.thick && turned(line) > turnedLong)
      || (line.letters >= 3 && turned(line) > turnedAny)
  }

  var parent = Array(lines.indices)
  func root(_ index: Int) -> Int {
    var at = index
    while parent[at] != at { parent[at] = parent[parent[at]]; at = parent[at] }
    return at
  }
  for i in lines.indices {
    for j in lines.indices where j > i {
      let (a, b) = (lines[i], lines[j])
      guard a.odd == b.odd else { continue }
      let size = min(a.thick, b.thick)
      let dx = max(a.box.minX, b.box.minX) - min(a.box.maxX, b.box.maxX)
      let dy = max(a.box.minY, b.box.minY) - min(a.box.maxY, b.box.maxY)
      if dx <= near * size && dy <= near * size { parent[root(i)] = root(j) }
    }
  }
  var grouped: [Int: [Line]] = [:]
  for index in lines.indices { grouped[root(index), default: []].append(lines[index]) }

  let rtl = seen.contains { line in
    line.text.unicodeScalars.contains { (0x0590...0x08FF).contains($0.value) || (0xFB1D...0xFEFF).contains($0.value) }
  }
  let reach = max(3, 0.01 * min(width, height))
  struct Block { let box: CGRect; let weight: Int; let numbers: Int; let size: Double; let edge: Bool; let odd: Bool; let turned: Double }
  let blocks: [Block] = grouped.values.compactMap { group in
    let words = group.filter(\.wordy)
    guard !words.isEmpty else { return nil }
    var box = words.map(\.box).reduce(CGRect.null) { $0.union($1) }
    /* A number under or over words, or ending a row of them: a price, an
       amount. Not one beside the words' start: a barcode's digits. */
    for line in group where !line.wordy {
      let under = words.contains { $0.box.minX < line.box.maxX && line.box.minX < $0.box.maxX }
      let after = words.contains { word in
        word.box.minY < line.box.maxY && line.box.minY < word.box.maxY
          && (rtl ? word.box.minX >= line.box.maxX - 1 : word.box.maxX <= line.box.minX + 1)
      }
      if under || after { box = box.union(line.box) }
    }
    let edge = box.minX <= reach || box.minY <= reach || Double(box.maxX) >= width - reach || Double(box.maxY) >= height - reach
    let size = words.filter { $0.letters >= 3 }.map(\.thick).max() ?? 0
    return Block(box: box, weight: words.reduce(0) { $0 + $1.letters }, numbers: group.reduce(0) { $0 + $1.digits },
                 size: size, edge: edge, odd: group[0].odd, turned: turned(group[0]))
  }
  let plain = lines.filter { $0.wordy && !$0.odd }
  guard !plain.isEmpty, let heaviest = blocks.filter({ !$0.odd }).max(by: { $0.weight < $1.weight }),
        !heaviest.edge else { return nil }
  /* The text's height: the median line's, every letter counted. */
  let main = median(plain.flatMap { Array(repeating: $0.thick, count: $0.letters) })
  func fits(_ block: Block) -> Bool {
    !block.edge && block.weight >= 2 * block.numbers && block.size >= smaller * main
  }
  var kept = blocks.filter { $0.box == heaviest.box || (!$0.odd && $0.weight >= few && fits($0)) }
  let region = kept.map(\.box).reduce(CGRect.null) { $0.union($1) }
  for block in blocks where block.box != heaviest.box && (block.weight < few || block.odd) && fits(block)
    && (!block.odd || (block.turned <= across && block.size >= turnedSize * main)) {
    let dx = max(region.minX - block.box.maxX, block.box.minX - region.maxX, 0)
    let dy = max(region.minY - block.box.maxY, block.box.minY - region.maxY, 0)
    if Double(max(dx, dy)) <= beside * main { kept.append(block) }
  }
  guard kept.reduce(0, { $0 + $1.weight }) >= 6 else { return nil }
  let shorter = min(width, height)
  let room = max(0.015 * shorter, min(0.6 * main, 0.04 * shorter))
  let cut = kept.map(\.box).reduce(CGRect.null) { $0.union($1) }.insetBy(dx: -room, dy: -room)
    .intersection(CGRect(x: 0, y: 0, width: width, height: height))
  /* Clearly less than the whole picture, or the frame stays where it is. */
  guard !cut.isNull, Double(cut.width * cut.height) <= 0.9 * width * height else { return nil }
  return cut
}

/* Where the text to be read most likely is, for the crop frame to start
   round: in the picture's pixels, nothing where no part of it is clearly
   meant. Apple's careful level, as the quick one found nothing at all in a
   typewritten notice. Where it finds no text in the whole picture — a
   small sign far off, its type a few pixels high — it looks again in nine
   overlapping quarters, each read at its own size. */
func suggestedCut(_ picture: CGImage) async -> CGRect? {
  let (width, height) = (Double(picture.width), Double(picture.height))
  func seen(_ region: CGRect?) async -> [SeenLine] {
    var request = RecognizeTextRequest()
    if let region { request.regionOfInterest = NormalizedRect(normalizedRect: region) }
    guard let found = try? await request.perform(on: picture) else { return [] }
    let within = region ?? CGRect(x: 0, y: 0, width: 1, height: 1)
    return found.compactMap { line in
      guard let text = line.topCandidates(1).first?.string else { return nil }
      let box = line.boundingBox.cgRect
      let (left, right) = (within.minX + box.minX * within.width, within.minX + box.maxX * within.width)
      let (low, high) = (within.minY + box.minY * within.height, within.minY + box.maxY * within.height)
      let across = Double(line.topRight.x - line.topLeft.x) * Double(within.width) * width
      let drop = Double(line.topLeft.y - line.topRight.y) * Double(within.height) * height
      let slope = abs(across) > 0.5 ? Int(max(-1_000_000, min(1_000_000, (1000 * drop / across).rounded())))
        : (drop >= 0 ? 1_000_000 : -1_000_000)
      return SeenLine(box: CGRect(x: left * width, y: (1 - high) * height,
                                  width: (right - left) * width, height: (high - low) * height),
                      slope: slope, text: text)
    }
  }
  var lines = await seen(nil)
  if !lines.contains(where: { line in line.text.unicodeScalars.contains { CharacterSet.letters.contains($0) } }) {
    lines = []
    for row in 0..<3 {
      for column in 0..<3 {
        let more = await seen(CGRect(x: Double(column) * 0.25, y: Double(row) * 0.25, width: 0.5, height: 0.5))
        /* A line read in two overlapping quarters is kept once. */
        for line in more where !lines.contains(where: { kept in
          let common = kept.box.intersection(line.box)
          return !common.isNull && common.width * common.height > 0.5 * min(kept.box.width * kept.box.height, line.box.width * line.box.height)
        }) {
          lines.append(line)
        }
      }
    }
  }
  return textFrame(lines, width: width, height: height)
}

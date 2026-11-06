/* The shapes of the Control Center's symbols (scripts/ios-symbols.mjs): a
   symbol's template takes filled shapes only, so strokes are outlined and
   shapes added and cut by CoreGraphics. Reads the symbols as JSON on
   standard input — per symbol its number of layers and a list of steps,
   each a path added to one layer (stroked or filled) or cut away from one
   layer or from all of them — and answers each symbol as one line of JSON:
   its layers' outlines as SVG path data, and the box round all of them.

   With a file name as its argument it also draws them, beside some of the
   system's own symbols, into that PNG: a look before a build. */

import AppKit
import CoreGraphics
import Foundation

struct Step: Decodable {
  let path: [[Double]]
  let op: String
  let width: Double?
  let layer: Int?
}

struct Symbol: Decodable {
  let layers: Int
  let steps: [Step]
  /* Per layer: drawn in the secondary tone; a badge, outside the margins. */
  let secondary: [Bool]
  let badge: [Bool]
  /* Per layer: left out where one tone is drawn (it fills a hole). */
  let hiddenAlone: [Bool]
  /* Where one tone of it is wanted as a picture: a share action's icon. */
  let png: String?
}

struct Answer: Encodable {
  let layers: [String]
  let box: [Double]
  /* Each layer's own box, so that a badge can stand outside the margins. */
  let boxes: [[Double]]
}

/* A path's commands, as the script writes them: [0, x, y] moves, [1, x, y]
   draws a line, [2, x1, y1, x2, y2, x, y] a curve, [3] closes. */
func built(_ commands: [[Double]]) -> CGPath {
  let path = CGMutablePath()
  for command in commands {
    switch Int(command[0]) {
    case 0: path.move(to: CGPoint(x: command[1], y: command[2]))
    case 1: path.addLine(to: CGPoint(x: command[1], y: command[2]))
    case 2:
      path.addCurve(to: CGPoint(x: command[5], y: command[6]),
                    control1: CGPoint(x: command[1], y: command[2]),
                    control2: CGPoint(x: command[3], y: command[4]))
    default: path.closeSubpath()
    }
  }
  return path
}

/* The shape a step paints: a stroke's outline, or the path filled. */
func shape(_ step: Step) -> CGPath {
  let path = built(step.path)
  guard let width = step.width else { return path.normalized() }
  return path.copy(strokingWithWidth: width, lineCap: .round, lineJoin: .round, miterLimit: 4).normalized()
}

func number(_ value: CGFloat) -> String {
  let rounded = (value * 1000).rounded() / 1000
  return rounded == rounded.rounded() ? String(Int(rounded)) : String(Double(rounded))
}

func data(_ path: CGPath) -> String {
  var out = ""
  path.applyWithBlock { element in
    let points = element.pointee.points
    let at = { (index: Int) in "\(number(points[index].x)) \(number(points[index].y))" }
    switch element.pointee.type {
    case .moveToPoint: out += "M\(at(0))"
    case .addLineToPoint: out += "L\(at(0))"
    case .addQuadCurveToPoint: out += "Q\(at(0)) \(at(1))"
    case .addCurveToPoint: out += "C\(at(0)) \(at(1)) \(at(2))"
    case .closeSubpath: out += "Z"
    @unknown default: break
    }
  }
  return out
}

let symbols = try JSONDecoder().decode([Symbol].self, from: FileHandle.standardInput.readDataToEndOfFile())
var drawn: [[CGPath]] = []
for symbol in symbols {
  var layers = Array(repeating: CGMutablePath() as CGPath, count: symbol.layers)
  for step in symbol.steps {
    let painted = shape(step)
    switch (step.op, step.layer) {
    case ("cut", nil): layers = layers.map { $0.subtracting(painted) }
    case ("cut", let layer?): layers[layer] = layers[layer].subtracting(painted)
    case (_, let layer?): layers[layer] = layers[layer].union(painted)
    default: break
    }
  }
  layers = layers.map { $0.normalized() }
  drawn.append(layers)
  let box = layers.map(\.boundingBoxOfPath).filter { !$0.isNull }.reduce(CGRect.null) { $0.union($1) }
  let corners = { (rect: CGRect) in [rect.minX, rect.minY, rect.maxX, rect.maxY].map(Double.init) }
  let answer = Answer(layers: layers.map(data), box: corners(box),
                      boxes: layers.map { $0.isEmpty ? [0, 0, 0, 0] : corners($0.boundingBoxOfPath) })
  print(String(data: try JSONEncoder().encode(answer), encoding: .utf8)!)
}

/* ---- A share action's icon ---- */

/* The symbol in one tone, white on nothing, on a 1024-pixel square: the
   share menu draws an action's icon by its shape alone. As large as the
   app's own icon's shape stood there, centred on the whole. */
for (index, symbol) in symbols.enumerated() {
  guard let file = symbol.png else { continue }
  let layers = drawn[index].enumerated().filter { !symbol.hiddenAlone[$0.offset] }.map(\.element)
  let box = layers.map(\.boundingBoxOfPath).filter { !$0.isNull }.reduce(CGRect.null) { $0.union($1) }
  let side = 1024, room: CGFloat = 820
  let scale = room / max(box.width, box.height)
  let context = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  context.translateBy(x: CGFloat(side) / 2, y: CGFloat(side) / 2)
  context.scaleBy(x: scale, y: -scale)
  context.translateBy(x: -box.midX, y: -box.midY)
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  for path in layers {
    context.addPath(path)
    context.fillPath()
  }
  let bitmap = NSBitmapImageRep(cgImage: context.makeImage()!)
  try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: file))
}

/* ---- The look before a build ---- */

if CommandLine.arguments.count > 1 {
  let others = ["book.fill", "arrow.right.circle.fill", "rectangle.badge.plus", "camera.fill",
                "qrcode.viewfinder", "flashlight.off.fill", "note.text.badge.plus", "list.bullet.rectangle.fill"]
  let cell: CGFloat = 220, columns = 4
  let count = symbols.count + others.count
  let rows = (count + columns - 1) / columns
  let size = CGSize(width: cell * CGFloat(columns), height: cell * CGFloat(rows))
  let image = NSImage(size: size)
  image.lockFocus()
  let context = NSGraphicsContext.current!.cgContext
  NSColor(white: 0.11, alpha: 1).setFill()
  context.fill(CGRect(origin: .zero, size: size))
  func place(_ index: Int) -> CGPoint {
    CGPoint(x: CGFloat(index % columns) * cell + cell / 2, y: size.height - CGFloat(index / columns) * cell - cell / 2)
  }
  for index in 0..<count {
    let middle = place(index)
    NSColor(white: 0.26, alpha: 1).setFill()
    context.fillEllipse(in: CGRect(x: middle.x - 90, y: middle.y - 90, width: 180, height: 180))
  }
  /* The template's 100-point type at 0.9 of its size: the capitals' middle
     on the cell's. */
  for (index, layers) in drawn.enumerated() {
    let middle = place(index)
    /* Centred as the template's margins have it: halfway between the shape
       alone and the shape with its badge. */
    let union = { (paths: [CGPath]) in paths.map(\.boundingBoxOfPath).filter { !$0.isNull }.reduce(CGRect.null) { $0.union($1) } }
    let shape = union(layers.enumerated().filter { !symbols[index].badge[$0.offset] }.map(\.element))
    let whole = union(layers)
    let box = CGRect(x: (shape.midX + whole.midX) / 2, y: whole.minY, width: 0, height: whole.height)
    context.saveGState()
    context.translateBy(x: middle.x, y: middle.y)
    context.scaleBy(x: 0.9, y: -0.9)
    context.translateBy(x: -box.midX, y: 35.27)
    for (layer, path) in layers.enumerated() {
      context.setFillColor(NSColor(white: 1, alpha: symbols[index].secondary[layer] ? 0.45 : 1).cgColor)
      context.addPath(path)
      context.fillPath()
    }
    context.restoreGState()
  }
  for (offset, name) in others.enumerated() {
    let middle = place(symbols.count + offset)
    let configuration = NSImage.SymbolConfiguration(pointSize: 90, weight: .regular)
      .applying(NSImage.SymbolConfiguration(hierarchicalColor: .white))
    guard let symbol = NSImage(systemSymbolName: name, accessibilityDescription: nil)?.withSymbolConfiguration(configuration) else { continue }
    symbol.draw(in: CGRect(x: middle.x - symbol.size.width / 2, y: middle.y - symbol.size.height / 2,
                           width: symbol.size.width, height: symbol.size.height))
  }
  image.unlockFocus()
  let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
  try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
}

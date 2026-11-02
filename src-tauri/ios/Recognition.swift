/* Text in a picture, by Apple's recognition on the iPhone: for the camera
   and photo buttons and for a picture that was copied (Translation.swift),
   and for a picture shared to Triglosa (Share/ShareViewController.swift).
   The file belongs to the app's target and to both share extensions'.

   The lines are answered the way the Mac's helper answers them
   (sidecar/translator.swift, `recognize`), so the page reads them with the
   same code (`readRecognized` in src/platform/translation.js) and puts them
   in order the same way (src/screen-text.js): "left top right bottom" in
   the picture's pixels, a tab, the line's text, a tab. Where each character
   stands is left out: only the word under a pointer needs it. */

import CoreGraphics
import ImageIO
import UIKit
import Vision

/* The longest side a picture is read at. A photograph from the camera is
   about twice that, which costs memory — an extension has little of it —
   and reads no better. */
private let longestSide: CGFloat = 2400

/* A picture's bytes, upright and no larger than that, decoded at that size
   rather than whole and then made smaller. */
func uprightPicture(_ data: Data) -> CGImage? {
  guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
  let options: [CFString: Any] = [
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceThumbnailMaxPixelSize: Int(longestSide),
  ]
  return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
}

/* The same for a picture the system hands over as an image — the camera's,
   or what was copied: drawn upright, at that size at most. */
func uprightPicture(_ image: UIImage) -> CGImage? {
  let size = image.size
  guard size.width > 0, size.height > 0 else { return nil }
  let scale = min(1, longestSide / max(size.width, size.height))
  let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1
  return UIGraphicsImageRenderer(size: target, format: format).image { _ in
    image.draw(in: CGRect(origin: .zero, size: target))
  }.cgImage
}

/* Apple's recognition at its careful level with its language correction,
   as the Mac reads a screenshot (run sixty-six), the reader's languages
   tried first. An empty answer is a picture without text. */
func recognizedLines(_ picture: CGImage, _ wanted: [String]) async throws -> String {
  var request = RecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true
  let known = Set(request.supportedRecognitionLanguages.compactMap { $0.languageCode?.identifier })
  let languages = wanted.filter { known.contains($0) }.map { Locale.Language(identifier: $0) }
  if !languages.isEmpty { request.recognitionLanguages = languages }
  request.automaticallyDetectsLanguage = true
  let observations = try await request.perform(on: picture)
  let (width, height) = (Double(picture.width), Double(picture.height))
  return observations.compactMap { observation -> String? in
    guard let candidate = observation.topCandidates(1).first else { return nil }
    let box = observation.boundingBox.cgRect
    let left = Int(box.minX * width), right = Int(box.maxX * width)
    let top = Int((1 - box.maxY) * height), bottom = Int((1 - box.minY) * height)
    return "\(left) \(top) \(right) \(bottom)\t\(candidate.string.replacingOccurrences(of: "\n", with: " "))\t"
  }.joined(separator: "\n")
}

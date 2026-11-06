/* Apple's translation on the iPhone, inside the app.

   A computer's app asks a helper process over HTTP (sidecar/translator.swift);
   a phone's app cannot start one, so the same routes are answered here, in
   the app's own process, and the page reads the answers with the same code
   (src/platform/translation.js). The shell reaches this class by name
   through the Objective-C runtime (mobile.rs), the way it reaches the
   pasteboard — nothing is linked by symbol.

   Two routes are the phone's own: what was copied (`/pasteboard`) and the
   text in a picture from the camera, the photo library, the Files app or
   the pasteboard (`/pick?from=…`, cut in Crop.swift, then `/recognize`,
   Recognition.swift).

   Raise PROTOCOL together with translator.swift and translation.js whenever
   a route's answer changes shape. */

import Foundation
import NaturalLanguage
import PhotosUI
import SwiftUI
import Translation
import UIKit
import UniformTypeIdentifiers
import WebKit

private let PROTOCOL = 6

private func statusWord(_ status: LanguageAvailability.Status) -> String {
  switch status {
  case .installed: return "installed"
  case .supported: return "supported"
  default: return "unsupported"
  }
}

private func languages(_ from: String, _ to: String) -> (Locale.Language, Locale.Language) {
  (Locale.Language(identifier: from), Locale.Language(identifier: to))
}

/* Installed where either of Apple's two models is, because either will
   translate. Otherwise what the fast one says — that is the download worth
   asking for (see translator.swift for the measurement). */
@available(iOS 26.0, *)
private func pairStatus(_ from: String, _ to: String) async -> LanguageAvailability.Status {
  let (source, target) = languages(from, to)
  let careful = await LanguageAvailability().status(from: source, to: target)
  guard #available(iOS 26.4, *) else { return careful }
  let fast = await LanguageAvailability(preferredStrategy: .lowLatency).status(from: source, to: target)
  return careful == .installed ? .installed : fast
}

@available(iOS 26.0, *)
private func makeSession(_ from: String, _ to: String) async -> TranslationSession {
  let (source, target) = languages(from, to)
  if #available(iOS 26.4, *) {
    let fast = await LanguageAvailability(preferredStrategy: .lowLatency).status(from: source, to: target)
    if fast == .installed {
      return TranslationSession(installedSource: source, target: target, preferredStrategy: .lowLatency)
    }
  }
  return TranslationSession(installedSource: source, target: target)
}

/* The five likeliest languages, most likely first, one "code confidence"
   line each. */
private func hypothesisLines(of text: String) -> String {
  let recognizer = NLLanguageRecognizer()
  recognizer.processString(text)
  return recognizer.languageHypotheses(withMaximum: 5)
    .sorted { $0.value > $1.value }
    .map { "\($0.key.rawValue) \(String(format: "%.3f", $0.value))" }
    .joined(separator: "\n")
}

/* The sessions kept, and one translation at a time: two callers must not be
   inside the same session at once. */
@available(iOS 26.0, *)
private actor Sessions {
  static let shared = Sessions()
  private var kept: [String: TranslationSession] = [:]

  func translate(_ from: String, _ to: String, _ text: String) async throws -> String {
    let key = "\(from)>\(to)"
    let session: TranslationSession
    if let known = kept[key] {
      session = known
    } else {
      session = await makeSession(from, to)
      kept[key] = session
    }
    return try await session.translate(text).targetText
  }

  /* A pack fetched since is picked up by a new session. */
  func forget() { kept = [:] }
}

/* ---- Asking for a language ---- */

/* The system's own sheet for fetching a language needs a view to hang
   from. This one is laid over the page, see-through, for as long as the
   reader is answering Apple's prompts, one per language. */
@available(iOS 26.0, *)
private struct PrepareView: View {
  let from: String
  let targets: [String]
  let finished: () -> Void
  @State private var index = 0
  @State private var config: TranslationSession.Configuration?

  var body: some View {
    Color.clear
      .task { ask() }
      .translationTask(config) { session in
        /* A refusal is an answer too: the next language is still worth
           asking about. */
        try? await session.prepareTranslation()
        await MainActor.run { next() }
      }
  }

  private func ask() {
    guard index < targets.count else { return finished() }
    let (source, target) = languages(from, targets[index])
    if #available(iOS 26.4, *) {
      config = TranslationSession.Configuration(source: source, target: target, preferredStrategy: .lowLatency)
    } else {
      config = TranslationSession.Configuration(source: source, target: target)
    }
  }

  private func next() {
    index += 1
    ask()
  }
}

@available(iOS 26.0, *)
@MainActor
private func prepare(from: String, targets: [String]) async -> Bool {
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  guard let root = scenes.compactMap({ $0.keyWindow }).first?.rootViewController else { return false }
  await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
    var host: UIViewController?
    var over = false
    let view = PrepareView(from: from, targets: targets) {
      guard !over else { return }
      over = true
      host?.dismiss(animated: false) { done.resume() }
    }
    let holder = UIHostingController(rootView: view)
    holder.view.backgroundColor = .clear
    holder.modalPresentationStyle = .overFullScreen
    host = holder
    root.present(holder, animated: false)
  }
  await Sessions.shared.forget()
  return true
}

/* ---- A picture's text ---- */

/* What lies on top of the page: the system's sheets are presented from it. */
@MainActor
private func uppermost() -> UIViewController? {
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  var top = scenes.compactMap({ $0.keyWindow }).first?.rootViewController
  while let shown = top?.presentedViewController { top = shown }
  return top
}

/* A photograph taken with the camera; nothing where the reader cancels. */
@MainActor
private final class CameraTaking: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
  private var finish: ((CGImage?) -> Void)?
  init(_ finish: @escaping (CGImage?) -> Void) { self.finish = finish }

  private func end(_ picture: CGImage?) {
    finish?(picture)
    finish = nil
  }

  func imagePickerController(_ picker: UIImagePickerController,
                             didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
    let picture = (info[.originalImage] as? UIImage).flatMap(uprightPicture)
    picker.dismiss(animated: true) { self.end(picture) }
  }

  func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
    picker.dismiss(animated: true) { self.end(nil) }
  }
}

/* A picture chosen in the photo library, which asks no permission; nothing
   where the reader cancels or swipes the sheet away. */
@MainActor
private final class LibraryPicking: NSObject, PHPickerViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  private var finish: ((CGImage?) -> Void)?
  init(_ finish: @escaping (CGImage?) -> Void) { self.finish = finish }

  private func end(_ picture: CGImage?) {
    finish?(picture)
    finish = nil
  }

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    guard let provider = results.first?.itemProvider,
          provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else { return end(nil) }
    provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, _ in
      let picture = data.flatMap(uprightPicture)
      Task { @MainActor in self.end(picture) }
    }
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    end(nil)
  }
}

/* A picture chosen in the Files app, copied out of wherever it lies (iCloud
   Drive, the phone, a server); nothing where the reader cancels. */
@MainActor
private final class FilePicking: NSObject, UIDocumentPickerDelegate {
  private var finish: ((CGImage?) -> Void)?
  init(_ finish: @escaping (CGImage?) -> Void) { self.finish = finish }

  private func end(_ picture: CGImage?) {
    finish?(picture)
    finish = nil
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    end(urls.first.flatMap { try? Data(contentsOf: $0) }.flatMap(uprightPicture))
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    end(nil)
  }
}

/* What the reader took or chose, held from the system's sheet closing until
   it is read. */
@MainActor private var pickedPicture: CGImage?

/* The page's view, for its colour behind the page. */
private func webView(in view: UIView) -> WKWebView? {
  if let found = view as? WKWebView { return found }
  for child in view.subviews {
    if let found = webView(in: child) { return found }
  }
  return nil
}

/* The edges of the screen the page does not reach, in the page's ground:
   everything behind it, as each of them shows at one edge or the other. */
@MainActor
private func paintGround(_ hex: String) {
  guard hex.count == 6, let value = Int(hex, radix: 16) else { return }
  let color = UIColor(red: CGFloat(value >> 16 & 255) / 255, green: CGFloat(value >> 8 & 255) / 255,
                      blue: CGFloat(value & 255) / 255, alpha: 1)
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  guard let window = scenes.compactMap({ $0.keyWindow }).first else { return }
  window.backgroundColor = color
  window.rootViewController?.view.backgroundColor = color
  guard let page = webView(in: window) else { return }
  page.isOpaque = false
  page.backgroundColor = color
  page.scrollView.backgroundColor = color
  page.underPageBackgroundColor = color
}

/* The picture to read: taken with the camera, chosen in the library, held
   from then, or what was copied. Nothing where there is none — no camera,
   nothing chosen, no picture copied. */
@MainActor
private func picture(from source: String) async -> CGImage? {
  switch source {
  case "picked":
    defer { pickedPicture = nil }
    return pickedPicture
  case "pasteboard":
    return UIPasteboard.general.image.flatMap(uprightPicture)
  case "camera":
    guard UIImagePickerController.isSourceTypeAvailable(.camera), let top = uppermost() else { return nil }
    return await withCheckedContinuation { (done: CheckedContinuation<CGImage?, Never>) in
      /* Held by its own ending, the picker holding its delegate weakly. */
      var taking: CameraTaking?
      taking = CameraTaking { picture in
        done.resume(returning: picture)
        taking = nil
      }
      let picker = UIImagePickerController()
      picker.sourceType = .camera
      picker.delegate = taking
      top.present(picker, animated: true)
    }
  case "library":
    guard let top = uppermost() else { return nil }
    return await withCheckedContinuation { (done: CheckedContinuation<CGImage?, Never>) in
      var picking: LibraryPicking?
      picking = LibraryPicking { picture in
        done.resume(returning: picture)
        picking = nil
      }
      var configuration = PHPickerConfiguration()
      configuration.filter = .images
      configuration.selectionLimit = 1
      let picker = PHPickerViewController(configuration: configuration)
      picker.delegate = picking
      top.present(picker, animated: true)
      picker.presentationController?.delegate = picking
    }
  case "files":
    guard let top = uppermost() else { return nil }
    return await withCheckedContinuation { (done: CheckedContinuation<CGImage?, Never>) in
      var picking: FilePicking?
      picking = FilePicking { picture in
        done.resume(returning: picture)
        picking = nil
      }
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.image], asCopy: true)
      picker.allowsMultipleSelection = false
      picker.delegate = picking
      top.present(picker, animated: true)
    }
  default:
    return nil
  }
}

/* ---- The routes ---- */

private func query(of route: String) -> (path: String, values: [String: String]) {
  let pieces = route.split(separator: "?", maxSplits: 1)
  var values: [String: String] = [:]
  if pieces.count > 1 {
    for pair in pieces[1].split(separator: "&") {
      let both = pair.split(separator: "=", maxSplits: 1)
      if both.count == 2 { values[String(both[0])] = String(both[1]).removingPercentEncoding ?? String(both[1]) }
    }
  }
  return (pieces.isEmpty ? "" : String(pieces[0]), values)
}

private func answer(_ route: String, _ body: String) async -> (Int32, String) {
  let (path, values) = query(of: route)
  /* What was copied, without reading it: asking does not make iOS ask the
     reader, reading does. Text where there is any, else a picture. */
  if path == "/pasteboard" {
    let held = await MainActor.run { () -> String in
      let board = UIPasteboard.general
      return board.hasStrings ? "text" : board.hasImages ? "picture" : ""
    }
    return (200, held)
  }
  /* A field focused next brings the keyboard up without a tap (Keyboard.swift). */
  if path == "/keyboard" {
    await MainActor.run { allowKeyboard() }
    return (200, "ok")
  }
  if path == "/ground" {
    await paintGround(values["color"] ?? "")
    return (200, "ok")
  }
  if path == "/settings" {
    await MainActor.run {
      if let page = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(page) }
    }
    return (200, "ok")
  }
  /* A picture from the system's sheet or what was copied, cut to the part
     to be read where the page names the buttons for it (Crop.swift); 404
     where none came of it or the reader cancelled. */
  if path == "/pick" {
    var found = await picture(from: values["from"] ?? "")
    if let whole = found, let done = values["done"], !done.isEmpty {
      found = await cropped(whole, over: { uppermost() }, cancel: values["cancel"] ?? "", done: done)
    }
    let kept = found
    await MainActor.run { pickedPicture = kept }
    return kept == nil ? (404, "no picture") : (200, "ok")
  }
  /* The text in a picture; 404 where there is no picture. Apple's
     recognition came before iOS 26, and is asked on any. */
  if path == "/recognize" {
    guard let found = await picture(from: values["from"] ?? "") else { return (404, "no picture") }
    let wanted = (values["langs"] ?? "").split(separator: ",").map(String.init)
    do {
      return (200, try await recognizedLines(found, wanted))
    } catch {
      return (500, "recognition failed: \(error)")
    }
  }
  if path == "/detect" {
    let text = body.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty else { return (400, "empty text") }
    let lines = hypothesisLines(of: text)
    return lines.isEmpty ? (500, "no hypothesis") : (200, lines)
  }
  /* Translating without a view to hang a session from came with iOS 26. */
  guard #available(iOS 26.0, *) else { return (503, "not on this system") }
  switch path {
  case "/ping":
    return (200, "ok \(PROTOCOL)")
  case "/quit":
    return (200, "bye")
  case "/available":
    guard let from = values["from"], let to = values["to"] else { return (400, "from/to missing") }
    var out = ""
    for target in to.split(separator: ",") {
      out += "\(target) \(statusWord(await pairStatus(from, String(target))))\n"
    }
    return (200, out)
  case "/translate":
    guard let from = values["from"], let to = values["to"] else { return (400, "from/to missing") }
    guard !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return (400, "empty text") }
    do {
      return (200, try await Sessions.shared.translate(from, to, body))
    } catch {
      return (500, "translation failed: \(error)")
    }
  case "/prepare":
    guard let from = values["from"], let to = values["targets"] else { return (400, "from/targets missing") }
    let targets = to.split(separator: ",").map(String.init)
    guard !targets.isEmpty else { return (200, "nothing") }
    return await prepare(from: from, targets: targets) ? (200, "shown") : (500, "no window")
  default:
    return (404, "unknown: " + path)
  }
}

@objc(TriglosaTranslation)
final class TriglosaTranslation: NSObject {
  /* One question; `done` is called once, on whatever thread the answer is
     ready on, with what the shell handed in as `context`. */
  @objc static func ask(
    _ route: String,
    body: String,
    context: UnsafeMutableRawPointer,
    done: @convention(c) (UnsafeMutableRawPointer, Int32, UnsafePointer<CChar>) -> Void
  ) {
    Task {
      let (status, text) = await answer(route, body)
      text.withCString { done(context, status, $0) }
    }
  }
}

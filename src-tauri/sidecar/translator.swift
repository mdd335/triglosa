/* Bridge from the app to Apple's on-device frameworks.

   Text always arrives as UTF-8 over stdin or in a request body — selected
   text holds arbitrary quotes and line breaks, which have no business on a
   command line.

     detect                            -> "code confidence" per line, likeliest first
     translate <from> <to>             -> the translation, raw
     available <from> <to,to>          -> one line each, "to installed",
                                          "to supported" or "to unsupported"
     prepare <from> <to,to> [heading]  -> the system's own download prompt
     serve [idleSeconds]               -> resident helper, see below

   The first three are the fallback. Normally the app talks to the resident
   helper over HTTP, because a fresh process pays the connection setup to
   translationd all over again for every translation.

   Exit 0 = good, 1 = error. The caller treats anything but 0 as "ask the
   model instead", so every error message goes to stderr and never to
   stdout — otherwise it would end up displayed as a translation. */
import AppKit
import Foundation
import NaturalLanguage
import SwiftUI
import Translation

func stdinText() -> String {
  let d = FileHandle.standardInput.readDataToEndOfFile()
  return String(data: d, encoding: .utf8) ?? ""
}

func fail(_ s: String) -> Never {
  FileHandle.standardError.write(Data((s + "\n").utf8))
  exit(1)
}

/* The device knows three answers, not two, and the difference is the whole
   point of asking: "supported" means the pair is not there yet but can be
   fetched, and that is something the reader can act on. */
func statusWord(_ status: LanguageAvailability.Status) -> String {
  switch status {
  case .installed: return "installed"
  case .supported: return "supported"
  default: return "unsupported"
  }
}

/* Which of Apple's two models translates: the fast one, wherever it is there.

   Measured over 312 translations in eight languages, the careful default got
   84 wrong in sense and the fast one 70, at a third of the time — careful is
   not the more accurate of the two, only the slower, and it breaks grammar
   more often. The fast strategy exists from macOS 26.4 and is a download of
   its own, so a pair that has only the careful model keeps translating with
   that rather than not at all. */
func languages(_ from: String, _ to: String) -> (Locale.Language, Locale.Language) {
  (Locale.Language(identifier: from), Locale.Language(identifier: to))
}

/* Installed where either model is, because either will translate. Otherwise
   what the fast one says — that is the download worth asking for. */
func pairStatus(_ from: String, _ to: String) async -> LanguageAvailability.Status {
  let (source, target) = languages(from, to)
  let careful = await LanguageAvailability().status(from: source, to: target)
  guard #available(macOS 26.4, *) else { return careful }
  let fast = await LanguageAvailability(preferredStrategy: .lowLatency).status(from: source, to: target)
  return careful == .installed ? .installed : fast
}

func makeSession(_ from: String, _ to: String) async -> TranslationSession {
  let (source, target) = languages(from, to)
  if #available(macOS 26.4, *) {
    let fast = await LanguageAvailability(preferredStrategy: .lowLatency).status(from: source, to: target)
    if fast == .installed {
      return TranslationSession(installedSource: source, target: target, preferredStrategy: .lowLatency)
    }
  }
  return TranslationSession(installedSource: source, target: target)
}

/* The five likeliest languages, most likely first. The window takes a
   reader's own language where it lies close behind a leader they never
   configured, so the runners-up are part of the answer. */
func languageHypotheses(of text: String) -> [(code: String, confidence: Double)] {
  let recognizer = NLLanguageRecognizer()
  recognizer.processString(text)
  return recognizer.languageHypotheses(withMaximum: 5)
    .sorted { $0.value > $1.value }
    .map { ($0.key.rawValue, $0.value) }
}

func hypothesisLines(_ hypotheses: [(code: String, confidence: Double)]) -> String {
  hypotheses.map { "\($0.code) \(String(format: "%.3f", $0.confidence))" }.joined(separator: "\n")
}

@main struct Tool {
  static func main() async {
    let a = CommandLine.arguments
    guard a.count > 1 else { fail("no subcommand") }

    switch a[1] {
    case "detect":
      let t = stdinText().trimmingCharacters(in: .whitespacesAndNewlines)
      guard !t.isEmpty else { fail("empty text") }
      let hypotheses = languageHypotheses(of: t)
      guard !hypotheses.isEmpty else { fail("no hypothesis") }
      print(hypothesisLines(hypotheses))

    /* Availability stands on its own because the app asks once per session and
       remembers: a language pack that is not installed cannot be loaded from
       here anyway, only through Apple's own settings. Without asking up front,
       every run would pay for the same failure again. */
    case "available":
      guard a.count > 3 else { fail("available <from> <to,to>") }
      for target in a[3].split(separator: ",") {
        print("\(target) \(statusWord(await pairStatus(a[2], String(target))))")
      }

    /* Asking macOS to fetch a language pair, with its own prompt rather than
       an instruction to go and find the setting.

       `prepareTranslation()` presents the system sheet, and it needs a
       foreground app to present it over. A bare executable has no bundle
       around it, so LaunchServices calls it background-only and no window is
       ever created — that is the case during development, where the sidecar
       sits in the build directory rather than inside Triglosa.app. Exit 2 says
       so, and the app falls back to opening the settings pane.

       One request per language, not per direction: fetching German → Polish
       installs Polish in both directions, measured. */
    case "prepare":
      guard a.count > 3 else { fail("prepare <from> <to,to> [heading]") }
      guard Bundle.main.bundleIdentifier != nil else {
        FileHandle.standardError.write(Data("no window outside a bundle\n".utf8))
        exit(2)
      }
      let targets = a[3].split(separator: ",").map(String.init)
      guard !targets.isEmpty else { exit(0) }
      prepare(from: a[2], targets: targets, heading: a.count > 4 ? a[4] : "")

    case "serve":
      serve()

    case "translate":
      guard a.count > 3 else { fail("translate <from> <to>") }
      let t = stdinText()
      guard !t.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { fail("empty text") }
      let session = await makeSession(a[2], a[3])
      do {
        print(try await session.translate(t).targetText)
      } catch {
        fail("translation failed: \(error)")
      }

    default:
      fail("unknown subcommand: \(a[1])")
    }
  }
}

/* ---- Asking for a language ---- */

/* A window of its own, small and plainly Triglosa's, with the system's sheet
   on top of it. It exists only to have something for that sheet to hang
   from: the reader answers Apple's prompt, not ours. */
struct PrepareView: View {
  let from: String
  let targets: [String]
  let heading: String
  /* Held as State values rather than through the @State attribute: that
     attribute is a macro, and the macro's plugin ships with Xcode, not with
     the command line tools this helper is built with. */
  private let index = State(initialValue: 0)
  private let config = State<TranslationSession.Configuration?>(initialValue: nil)

  var body: some View {
    VStack(spacing: 6) {
      Text("Triglosa").font(.headline)
      Text(heading).font(.subheadline).foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
    .padding(24)
    .frame(width: 360)
    .task { ask() }
    .translationTask(config.wrappedValue) { session in
      /* A refusal is an answer too: the reader said no, or the download
         failed, and either way the next language is still worth asking
         about. */
      try? await session.prepareTranslation()
      await MainActor.run { next() }
    }
  }

  /* The fast model where it exists: that is the one the helper translates
     with, so it is the one worth fetching. */
  private func ask() {
    guard index.wrappedValue < targets.count else { exit(0) }
    let (source, target) = languages(from, targets[index.wrappedValue])
    if #available(macOS 26.4, *) {
      config.wrappedValue = TranslationSession.Configuration(source: source, target: target, preferredStrategy: .lowLatency)
    } else {
      config.wrappedValue = TranslationSession.Configuration(source: source, target: target)
    }
  }

  private func next() {
    index.wrappedValue += 1
    ask()
  }
}

func prepare(from: String, targets: [String], heading: String) -> Never {
  let app = NSApplication.shared
  app.setActivationPolicy(.regular)
  let window = NSWindow(
    contentRect: NSRect(x: 0, y: 0, width: 360, height: 120),
    styleMask: [.titled, .closable, .fullSizeContentView],
    backing: .buffered, defer: false)
  window.title = "Triglosa"
  window.titlebarAppearsTransparent = true
  window.isReleasedWhenClosed = false
  window.contentView = NSHostingView(
    rootView: PrepareView(from: from, targets: targets, heading: heading))
  window.center()
  window.makeKeyAndOrderFront(nil)
  app.activate(ignoringOtherApps: true)
  /* Closing the window is a refusal, and it has to end the process — the
     app is waiting on it. */
  let closer = WindowCloser()
  NotificationCenter.default.addObserver(
    closer, selector: #selector(WindowCloser.closed), name: NSWindow.willCloseNotification,
    object: window)
  app.run()
  exit(0)
}

final class WindowCloser: NSObject {
  @objc func closed() { exit(0) }
}

/* ---- Resident mode ---- */
/* Why it exists: the first translate() in a fresh process pays the connection
   setup to translationd. Measured es->de: 0.86 s in a fresh process, 0.36 s in
   a warm one. Starting a process per translation made EVERY call a first
   call. The helper keeps the sessions open and speaks HTTP on 127.0.0.1.

   A session is opened per pair and the first translation through it pays for
   that: measured 0.70 s against 0.42 s once the pair has been used. The app
   therefore warms the pairs it is configured for when the window appears —
   see `warmPairs` in platform/translation.js.

   It quits after IDLE_SECONDS without a request: an open session keeps
   translationd and its model in memory (around 325 MB), and that should not sit
   there permanently just because the app was open once. */
let PORT: UInt16 = 51737

/* The helper outlives the app: it holds the port, and a second instance
   started by a newer build exits at once because the port is taken. So an
   old helper can go on answering a new window in a format it no longer
   understands — which is exactly what happened once, and reached the reader
   as "the device cannot translate German to English".

   /ping therefore says which protocol this one speaks, and /quit lets the
   window retire a helper that speaks an older one. Raise this whenever a
   route's answer changes shape. */
let PROTOCOL = 4
/* A second argument lowers the deadline — there so it can be tested without
   waiting five minutes. */
let IDLE_SECONDS: Double =
  CommandLine.arguments.count > 2 ? (Double(CommandLine.arguments[2]) ?? 300) : 300

final class Helper: @unchecked Sendable {
  var sessions: [String: TranslationSession] = [:]
  var lastRequest = Date()
  let lock = NSLock()
  /* Held for the length of one translation. Every connection is answered on
     a thread of its own — see serve() — and that is only safe because the
     long route is still single file: translationd works through requests one
     by one anyway, and two threads must not be inside the same session at
     once. What the threads buy is that /ping and /available answer while a
     translation is running, instead of standing in a queue behind it and
     timing out. */
  let work = NSLock()

  func touch() {
    lock.lock(); lastRequest = Date(); lock.unlock()
  }

  /* Only ever called with `work` held, so two callers never build the same
     pair at once. Which model a session uses is decided when it is opened and
     kept for as long as the helper lives — a fast model fetched in the
     meantime is picked up by the next helper, five idle minutes later. */
  func session(_ from: String, _ to: String) async -> TranslationSession {
    let key = "\(from)>\(to)"
    if let s = cached(key) { return s }
    let s = await makeSession(from, to)
    store(key, s)
    return s
  }

  private func cached(_ key: String) -> TranslationSession? {
    lock.lock(); defer { lock.unlock() }
    return sessions[key]
  }

  private func store(_ key: String, _ session: TranslationSession) {
    lock.lock(); defer { lock.unlock() }
    sessions[key] = session
  }
}

/* Minimal HTTP/1.1 server. One thread per connection, and the translations
   inside them serialised by a lock of their own.

   It answered exactly one client at a time once, on the grounds that
   translationd works through requests singly and the app sends them in
   sequence. The app is two windows, though: open the settings while a reading
   is being translated and the pair probes queue up behind a request that may
   take a minute — while the window gives a probe two seconds before it gives
   up. A probe that ran out of time used to be read as "the device cannot do
   this pair", which is a confident wrong answer about the one thing the
   reader cannot fix. */
func serve() -> Never {
  let helper = Helper()
  let sock = socket(AF_INET, SOCK_STREAM, 0)
  guard sock >= 0 else { fail("socket() failed") }
  var on: Int32 = 1
  setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &on, socklen_t(MemoryLayout<Int32>.size))
  var address = sockaddr_in()
  address.sin_family = sa_family_t(AF_INET)
  address.sin_port = PORT.bigEndian
  address.sin_addr.s_addr = UInt32(0x7f00_0001).bigEndian  // 127.0.0.1 only
  let bound = withUnsafePointer(to: &address) { p in
    p.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) }
  }
  /* Taken means one is already running. Not an error but the normal case when
     the app is opened twice in a row. */
  if bound != 0 { close(sock); exit(0) }
  listen(sock, 16)

  Thread.detachNewThread {
    while true {
      Thread.sleep(forTimeInterval: 10)
      helper.lock.lock(); let idle = Date().timeIntervalSince(helper.lastRequest); helper.lock.unlock()
      if idle > IDLE_SECONDS { exit(0) }
    }
  }

  /* The accept loop runs on its OWN thread, not on the main thread. That is
     not a matter of style: handle() waits on a semaphore for the asynchronous
     translation, and translationd delivers its XPC answer over the main queue.
     Block the main thread there and the answer never arrives — /ping replied,
     every translation ran into the timeout. The main thread therefore stays
     free with dispatchMain() for exactly that delivery. */
  Thread.detachNewThread {
    while true {
      let client = accept(sock, nil, nil)
      if client < 0 { continue }
      helper.touch()
      /* A thread of its own, so a short question is not held up by a long
         one. The deadline is touched again on the way out: a translation may
         take longer than the idle watchdog's patience, and a helper that quit
         in the middle of answering would be a translation lost. */
      Thread.detachNewThread {
        handle(client, helper)
        close(client)
        helper.touch()
      }
    }
  }
  dispatchMain()
}

func readBytes(_ fd: Int32, _ n: Int) -> Data {
  var data = Data(); var buffer = [UInt8](repeating: 0, count: 65536)
  while data.count < n {
    let r = read(fd, &buffer, min(65536, n - data.count))
    if r <= 0 { break }
    data.append(contentsOf: buffer[0..<r])
  }
  return data
}

func respond(_ fd: Int32, _ code: Int, _ text: String) {
  let body = Array(text.utf8)
  let head = "HTTP/1.1 \(code) \(code == 200 ? "OK" : "Error")\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: \(body.count)\r\nConnection: close\r\n\r\n"
  var all = Array(head.utf8); all.append(contentsOf: body)
  var sent = 0
  while sent < all.count {
    let w = all[sent...].withUnsafeBufferPointer { write(fd, $0.baseAddress, $0.count) }
    if w <= 0 { break }
    sent += w
  }
}

func handle(_ fd: Int32, _ helper: Helper) {
  // Read the head up to the blank line
  var head = Data(); var byte = [UInt8](repeating: 0, count: 1)
  while head.count < 65536 {
    let r = read(fd, &byte, 1)
    if r <= 0 { return }
    head.append(byte[0])
    if head.count >= 4, head.suffix(4) == Data([13, 10, 13, 10]) { break }
  }
  guard let headText = String(data: head, encoding: .utf8) else { return respond(fd, 400, "broken head") }
  let lines = headText.split(separator: "\r\n", omittingEmptySubsequences: false)
  guard let first = lines.first else { return respond(fd, 400, "empty") }
  let parts = first.split(separator: " ")
  guard parts.count >= 2 else { return respond(fd, 400, "broken request") }
  let target = String(parts[1])
  var length = 0
  for line in lines where line.lowercased().hasPrefix("content-length:") {
    length = Int(line.dropFirst(15).trimmingCharacters(in: .whitespaces)) ?? 0
  }
  let body = length > 0 ? (String(data: readBytes(fd, length), encoding: .utf8) ?? "") : ""

  // Split /path?a=1&b=2
  let pieces = target.split(separator: "?", maxSplits: 1)
  let path = String(pieces[0])
  var query: [String: String] = [:]
  if pieces.count > 1 {
    for pair in pieces[1].split(separator: "&") {
      let kv = pair.split(separator: "=", maxSplits: 1)
      if kv.count == 2 { query[String(kv[0])] = String(kv[1]).removingPercentEncoding ?? String(kv[1]) }
    }
  }

  switch path {
  case "/ping":
    respond(fd, 200, "ok \(PROTOCOL)")

  /* Answer first, then go: the window waits for this before it starts the
     replacement, or the new one would find the port still taken. */
  case "/quit":
    respond(fd, 200, "bye")
    exit(0)

  case "/detect":
    let t = body.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !t.isEmpty else { return respond(fd, 400, "empty text") }
    let hypotheses = languageHypotheses(of: t)
    guard !hypotheses.isEmpty else { return respond(fd, 500, "no hypothesis") }
    respond(fd, 200, hypothesisLines(hypotheses))

  case "/available":
    guard let from = query["from"], let to = query["to"] else { return respond(fd, 400, "from/to missing") }
    let done = DispatchSemaphore(value: 0); var out = ""
    Task {
      for target in to.split(separator: ",") {
        out += "\(target) \(statusWord(await pairStatus(from, String(target))))\n"
      }
      done.signal()
    }
    done.wait()
    respond(fd, 200, out)

  case "/translate":
    guard let from = query["from"], let to = query["to"] else { return respond(fd, 400, "from/to missing") }
    guard !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      return respond(fd, 400, "empty text")
    }
    let done = DispatchSemaphore(value: 0); var out: String? = nil; var failure = ""
    /* One translation at a time, whatever else is being answered. */
    helper.work.lock()
    Task {
      let session = await helper.session(from, to)
      do { out = try await session.translate(body).targetText }
      catch { failure = "\(error)" }
      done.signal()
    }
    done.wait()
    helper.work.unlock()
    if let o = out { respond(fd, 200, o) } else { respond(fd, 500, "translation failed: " + failure) }

  default:
    respond(fd, 404, "unknown: " + path)
  }
}

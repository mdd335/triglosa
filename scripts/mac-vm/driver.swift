// A helper for the test VM: run with no arguments it waits for command
// files in /tmp/drive and runs each in the logged-in session; run with
// arguments it moves the pointer, clicks, presses keys or types.
import AppKit
import Foundation
import CoreGraphics
import ApplicationServices

let keys: [String: CGKeyCode] = [
  "a":0,"s":1,"d":2,"f":3,"h":4,"g":5,"z":6,"x":7,"c":8,"v":9,"b":11,"q":12,"w":13,"e":14,"r":15,
  "y":16,"t":17,"1":18,"2":19,"3":20,"4":21,"6":22,"5":23,"=":24,"9":25,"7":26,"-":27,"8":28,"0":29,
  "]":30,"o":31,"u":32,"[":33,"i":34,"p":35,"return":36,"l":37,"j":38,"'":39,"k":40,";":41,"\\":42,
  ",":43,"/":44,"n":45,"m":46,".":47,"tab":48,"space":49,"`":50,"delete":51,"escape":53,
  "left":123,"right":124,"down":125,"up":126,
]

func post(_ e: CGEvent?) { e?.post(tap: .cghidEventTap); usleep(20000) }

func mouse(_ type: CGEventType, _ x: Double, _ y: Double, _ button: CGMouseButton = .left, clicks: Int64 = 1) {
  let e = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: button)
  e?.setIntegerValueField(.mouseEventClickState, value: clicks)
  post(e)
}

func combo(_ spec: String) {
  var flags: CGEventFlags = []
  var key: CGKeyCode? = nil
  for part in spec.lowercased().split(separator: "+").map(String.init) {
    switch part {
    case "cmd": flags.insert(.maskCommand)
    case "ctrl": flags.insert(.maskControl)
    case "alt", "opt": flags.insert(.maskAlternate)
    case "shift": flags.insert(.maskShift)
    default: key = keys[part]
    }
  }
  guard let code = key else { print("unknown key \(spec)"); exit(2) }
  let down = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true); down?.flags = flags; post(down)
  let up = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false); up?.flags = flags; post(up)
  // Let go of the modifiers too, or the next click counts as held with them.
  let release = CGEvent(source: nil); release?.type = .flagsChanged; release?.flags = []; post(release)
}

/* A web view builds its tree only for a client that says it needs one. */
func root(_ app: NSRunningApplication) -> AXUIElement {
  let element = AXUIElementCreateApplication(app.processIdentifier)
  AXUIElementSetAttributeValue(element, "AXEnhancedUserInterface" as CFString, kCFBooleanTrue)
  usleep(300000)
  return element
}

/* Every element of a program's windows, as far down as a web page goes. */
func elements(_ element: AXUIElement, _ depth: Int = 0) -> [AXUIElement] {
  var value: CFTypeRef?
  guard depth < 40,
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &value) == .success,
        let children = value as? [AXUIElement] else { return [element] }
  return [element] + children.flatMap { elements($0, depth + 1) }
}

func text(_ element: AXUIElement, _ attribute: String) -> String {
  var value: CFTypeRef?
  AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
  return value as? String ?? ""
}

/* The button of a program called what a label says, pressed. */
func press(_ program: String, _ label: String) {
  guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: program).first else { print("no \(program)"); exit(1) }
  var found: AXUIElement? = nil
  for _ in 1...10 where found == nil {
    found = elements(root(app)).first { one in
      text(one, kAXRoleAttribute) == kAXButtonRole && [kAXDescriptionAttribute, kAXTitleAttribute].contains { text(one, $0) == label }
    }
  }
  guard let button = found else { print("no button \(label)"); exit(1) }
  print(AXUIElementPerformAction(button, kAXPressAction as CFString) == .success ? "pressed" : "not pressed")
}

/* A word in a program's text field: the field and where the word stands. */
func wordIn(_ program: String, _ word: String) -> (AXUIElement, NSRange)? {
  guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: program).first else { return nil }
  for one in elements(AXUIElementCreateApplication(app.processIdentifier)) where text(one, kAXRoleAttribute) == kAXTextAreaRole {
    let range = (text(one, kAXValueAttribute) as NSString).range(of: word)
    if range.location != NSNotFound { return (one, range) }
  }
  return nil
}

/* A program's text field, whole. */
func value(_ program: String) {
  guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: program).first else { exit(1) }
  let field = elements(AXUIElementCreateApplication(app.processIdentifier)).first { text($0, kAXRoleAttribute) == kAXTextAreaRole }
  print(field.map { text($0, kAXValueAttribute) } ?? "")
}

/* Every labelled element of a program, to find out what it is called. */
func list(_ program: String) {
  guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: program).first else { exit(1) }
  for one in elements(root(app)) {
    print(text(one, kAXRoleAttribute), "|", text(one, kAXDescriptionAttribute), "|", text(one, kAXTitleAttribute))
  }
}

/* Where a word stands: x, y, width, height. */
func bounds(_ program: String, _ word: String) {
  guard let (field, found) = wordIn(program, word) else { print("no \(word)"); exit(1) }
  var range = CFRange(location: found.location, length: found.length)
  var box: CFTypeRef?
  var rect = CGRect.zero
  guard let asked = AXValueCreate(.cfRange, &range),
        AXUIElementCopyParameterizedAttributeValue(field, kAXBoundsForRangeParameterizedAttribute as CFString, asked, &box) == .success,
        let value = box, AXValueGetValue(value as! AXValue, .cgRect, &rect) else { print("no box"); exit(1) }
  print(Int(rect.minX), Int(rect.minY), Int(rect.width), Int(rect.height))
}

func select(_ program: String, _ word: String) {
  guard let (field, found) = wordIn(program, word) else { print("no \(word)"); exit(1) }
  var range = CFRange(location: found.location, length: found.length)
  guard let asked = AXValueCreate(.cfRange, &range) else { exit(1) }
  print(AXUIElementSetAttributeValue(field, kAXSelectedTextRangeAttribute as CFString, asked) == .success ? "selected" : "not selected")
}

/* The windows on the screen, front first: owner and layer. */
func windows() {
  let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
  for one in list where (one[kCGWindowAlpha as String] as? Double ?? 0) > 0 {
    print(one[kCGWindowOwnerName as String] as? String ?? "?", one[kCGWindowLayer as String] as? Int ?? 0)
  }
}

func type(_ text: String) {
  for ch in text.utf16 {
    var c = ch
    let down = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true)
    down?.keyboardSetUnicodeString(stringLength: 1, unicodeString: &c); post(down)
    let up = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false)
    up?.keyboardSetUnicodeString(stringLength: 1, unicodeString: &c); post(up)
  }
}

let args = Array(CommandLine.arguments.dropFirst())
if !args.isEmpty {
  let n = { (i: Int) in Double(args[i]) ?? 0 }
  switch args[0] {
  case "move": mouse(.mouseMoved, n(1), n(2))
  case "click": mouse(.mouseMoved, n(1), n(2)); mouse(.leftMouseDown, n(1), n(2)); mouse(.leftMouseUp, n(1), n(2))
  case "double":
    mouse(.leftMouseDown, n(1), n(2)); mouse(.leftMouseUp, n(1), n(2))
    mouse(.leftMouseDown, n(1), n(2), clicks: 2); mouse(.leftMouseUp, n(1), n(2), clicks: 2)
  case "drag":
    mouse(.leftMouseDown, n(1), n(2))
    for i in 1...10 { let t = Double(i) / 10; mouse(.leftMouseDragged, n(1) + (n(3) - n(1)) * t, n(2) + (n(4) - n(2)) * t) }
    mouse(.leftMouseUp, n(3), n(4))
  case "down": mouse(.mouseMoved, n(1), n(2)); mouse(.leftMouseDown, n(1), n(2))
  case "up": mouse(.leftMouseUp, n(1), n(2))
  case "key": combo(args[1])
  case "type": type(args[1...].joined(separator: " "))
  case "bounds": bounds(args[1], args[2...].joined(separator: " "))
  case "select": select(args[1], args[2...].joined(separator: " "))
  case "windows": windows()
  case "value": value(args[1])
  case "list": list(args[1])
  case "press": press(args[1], args[2...].joined(separator: " "))
  case "where": let p = CGEvent(source: nil)?.location ?? .zero; print(p.x, p.y)
  case "trusted": print(CGPreflightPostEventAccess(), CGPreflightScreenCaptureAccess())
  case "ask": print(CGRequestPostEventAccess(), CGRequestScreenCaptureAccess())
  default: print("unknown \(args[0])"); exit(2)
  }
  exit(0)
}

let dir = URL(fileURLWithPath: "/tmp/drive")
try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
let me = Bundle.main.executablePath ?? CommandLine.arguments[0]
while true {
  let files = (try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? []
  for name in files.sorted() where name.hasSuffix(".cmd") {
    let file = dir.appendingPathComponent(name)
    guard let script = try? String(contentsOf: file, encoding: .utf8) else { continue }
    try? FileManager.default.removeItem(at: file)
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/bin/sh")
    p.arguments = ["-c", script]
    var env = ProcessInfo.processInfo.environment
    env["DRIVE"] = me
    env["LANG"] = "en_US.UTF-8"
    p.environment = env
    let out = dir.appendingPathComponent(name.replacingOccurrences(of: ".cmd", with: ".tmp"))
    FileManager.default.createFile(atPath: out.path, contents: nil)
    let handle = try? FileHandle(forWritingTo: out)
    p.standardOutput = handle; p.standardError = handle
    try? p.run(); p.waitUntilExit()
    try? handle?.close()
    try? FileManager.default.moveItem(at: out, to: dir.appendingPathComponent(name.replacingOccurrences(of: ".cmd", with: ".out")))
  }
  usleep(100000)
}

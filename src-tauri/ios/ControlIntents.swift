/* The Control Center's intents (Controls.swift draws the buttons). An
   intent's answer of an address from the extension opens nothing, so each
   one asks to be run in the app (`openAppWhenRun`), which the system starts
   or brings to the front, and the app opens its own address there: it
   arrives as any address does, and the page reads it (`textHandedOver`).
   This file is a member of the app's target and the extension's; in the
   extension (TRIGLOSA_CONTROLS) nothing is opened, the app being where the
   system runs them. */

import AppIntents
import UIKit

@MainActor
private func openOwn(_ address: String) {
#if !TRIGLOSA_CONTROLS
  if let url = URL(string: address) { UIApplication.shared.open(url) }
#endif
}

struct OpenAppIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Triglosa"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult { .result() }
}

struct ReadClipboardIntent: AppIntent {
  static let title: LocalizedStringResource = "Translate copied text"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult {
    openOwn("triglosa://read?from=clipboard")
    return .result()
  }
}

struct NewReadingIntent: AppIntent {
  static let title: LocalizedStringResource = "New translation"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult {
    openOwn("triglosa://read")
    return .result()
  }
}

struct CardFromClipboardIntent: AppIntent {
  static let title: LocalizedStringResource = "Flashcard from copied text"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult {
    openOwn("triglosa://card?from=clipboard")
    return .result()
  }
}

struct NewCardIntent: AppIntent {
  static let title: LocalizedStringResource = "New flashcard"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult {
    openOwn("triglosa://card")
    return .result()
  }
}

struct ReadPhotoIntent: AppIntent {
  static let title: LocalizedStringResource = "Translate a photo"
  static let isDiscoverable = false
  static let openAppWhenRun = true
  @MainActor func perform() async throws -> some IntentResult {
    openOwn("triglosa://read?from=camera")
    return .result()
  }
}

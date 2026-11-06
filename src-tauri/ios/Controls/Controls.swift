/* Triglosa's buttons for the Control Center, the Lock Screen and the Action
   button (author 2026-11-06): each opens the app at one of its own addresses,
   which the page reads as it reads a text another app hands over
   (`textHandedOver` in src/platform/env.js). What was copied is read by the
   app, not here: an extension that read it would ask the reader twice.

     Open Triglosa                triglosa://open
     Translate copied text        triglosa://read?from=clipboard   (nothing copied: the app opens)
     New translation              triglosa://read
     Flashcard from copied text   triglosa://card?from=clipboard   (no text copied: a blank card)
     New flashcard                triglosa://card
     Translate a photo            triglosa://read?from=camera

   Their names are in each language's Localizable.strings beside this file;
   the intents themselves in ControlIntents.swift, which the app carries too.
   Their symbols are Triglosa's own, filled and in two tones as the system's
   are (author 2026-11-06), drawn at every build by scripts/ios-symbols.mjs. */

import AppIntents
import SwiftUI
import WidgetKit

/* One button: its name in the gallery and under it, its symbol (from
   Symbols.xcassets), its intent. */
private func button<Action: AppIntent>(_ kind: String, _ name: LocalizedStringResource, _ symbol: Image,
                                       _ action: Action) -> some ControlWidgetConfiguration {
  StaticControlConfiguration(kind: "de.mdd335.triglosa.controls.\(kind)") {
    ControlWidgetButton(action: action) {
      Label {
        Text(name)
      } icon: {
        symbol.symbolRenderingMode(.hierarchical)
      }
    }
  }
  .displayName(name)
}

struct OpenAppControl: ControlWidget {
  var body: some ControlWidgetConfiguration { button("open", "Open Triglosa", Image("triglosa.open"), OpenAppIntent()) }
}

struct ReadClipboardControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    button("read-clipboard", "Translate copied text", Image("triglosa.read.clipboard"), ReadClipboardIntent())
  }
}

struct NewReadingControl: ControlWidget {
  var body: some ControlWidgetConfiguration { button("new-reading", "New translation", Image("triglosa.read.new"), NewReadingIntent()) }
}

struct CardFromClipboardControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    button("card-clipboard", "Flashcard from copied text", Image("triglosa.card.clipboard"), CardFromClipboardIntent())
  }
}

struct NewCardControl: ControlWidget {
  var body: some ControlWidgetConfiguration { button("new-card", "New flashcard", Image("triglosa.card.new"), NewCardIntent()) }
}

struct ReadPhotoControl: ControlWidget {
  var body: some ControlWidgetConfiguration { button("read-photo", "Translate a photo", Image("triglosa.read.photo"), ReadPhotoIntent()) }
}

@main
struct TriglosaControls: WidgetBundle {
  var body: some Widget {
    OpenAppControl()
    ReadClipboardControl()
    NewReadingControl()
    CardFromClipboardControl()
    NewCardControl()
    ReadPhotoControl()
  }
}

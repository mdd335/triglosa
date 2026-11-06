/* The keyboard for a field focused without a tap (author 2026-11-06): the
   Control Center's "New translation" opens the app with the caret in the
   empty field, as the bar's plus does. A web view shows its keyboard only
   for a field focused during a tap; the page asks for it here (`/keyboard`)
   just before it focuses the field, and for two seconds a focus counts as
   one the reader made.

   It wraps WebKit's own, unpublished, handling of a focused field
   (`WKContentView`), the way many apps with a web view do: the risk taken
   knowingly (author), that an iOS update renames it, and then the keyboard
   only stays down as before — where the method is not found, nothing is
   wrapped. Outside those two seconds a focus goes through unchanged.

   It reaches only as far as WebKit's page process lets a focus through: not
   before the reader has tapped a field once since the app started, which
   that process remembers and the app cannot change (tried in the simulator,
   2026-11-06). After a fresh start the caret is set, and the keyboard waits
   for a tap. */

import ObjectiveC
import UIKit

@MainActor private var keyboardUntil = Date.distantPast
@MainActor private var focusWrapped = false

/* A focus within the next two seconds brings the keyboard up. */
@MainActor
func allowKeyboard() {
  keyboardUntil = Date().addingTimeInterval(2)
  wrapFocus()
}

@MainActor
private func wrapFocus() {
  guard !focusWrapped, let content = NSClassFromString("WKContentView") else { return }
  focusWrapped = true
  let selector = NSSelectorFromString("_elementDidFocus:userIsInteracting:blurPreviousNode:activityStateChanges:userObject:")
  guard let method = class_getInstanceMethod(content, selector) else { return }
  /* The element's information comes by reference, the changes as a number. */
  typealias Focus = @convention(c) (AnyObject, Selector, UnsafeRawPointer, Bool, Bool, UInt64, AnyObject?) -> Void
  let original = unsafeBitCast(method_getImplementation(method), to: Focus.self)
  let wrapped: @convention(block) (AnyObject, UnsafeRawPointer, Bool, Bool, UInt64, AnyObject?) -> Void = {
    view, element, interacting, blur, changes, object in
    let allowed = MainActor.assumeIsolated { Date() < keyboardUntil }
    original(view, selector, element, interacting || allowed, blur, changes, object)
  }
  method_setImplementation(method, imp_implementationWithBlock(wrapped))
}

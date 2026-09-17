/* What is actually written on a key, and what the system already took.

   Both questions have the same shape: the window knows a key by its *place*
   (`KeyL`, `BracketLeft` — the W3C names, which are positions on a US
   keyboard and stay the same wherever the keyboard was made), and both
   answers depend on things only this side can see.

   ## Why the label cannot be worked out in the window

   A browser hands over `event.key`, the character produced by the press. With
   Option held that is the *modified* character: pressing ⌃⌥L on a German
   keyboard reports `@`, and the settings then said the shortcut was ⌃⌥@. It
   is not a browser quirk — Option is a character-composing modifier on macOS,
   and asking what a key types while it is held is asking the wrong question.

   `navigator.keyboard.getLayoutMap()` is the web API for the right question
   and WebKit does not implement it, so the window has no way to ask.

   The right question is what the key types with nothing held, and macOS
   answers it through `UCKeyTranslate` against the layout currently in use.
   That is what native shortcut recorders have always done.

   ## Why "is it already taken" is answerable after all

   Not through the registration: `RegisterEventHotKey` succeeds on
   combinations the system holds, so it cannot be used as a test. But the
   system's own shortcuts live in a readable preference domain,
   `com.apple.symbolichotkeys`, which is where every other tool looks too. It
   covers Spotlight, Mission Control, the input-source switch and the rest —
   everything System Settings lists under Keyboard Shortcuts, including
   whatever the reader has changed.

   What it does not cover is shortcuts belonging to *other programs*. Nothing
   does; there is no register for those. The window keeps a short list of the
   handful every program has, which is a different file and a different kind
   of knowledge. */

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use std::collections::BTreeMap;

    pub fn labels() -> BTreeMap<String, String> {
        BTreeMap::new()
    }
    pub fn taken() -> Vec<String> {
        Vec::new()
    }
}

/* On Windows the label is asked of the active keyboard layout through
   `ToUnicodeEx`, by scan code — the place on the keyboard, the same kind of
   "where" as the W3C name. What is taken cannot be read anywhere: Windows
   keeps its own combinations in no register. It does refuse to register one
   that another program already holds, which the shell reports; the list here
   is the Windows key combinations Windows documents for itself. */
#[cfg(target_os = "windows")]
mod platform {
    use std::collections::BTreeMap;
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        GetKeyboardLayout, MapVirtualKeyExW, ToUnicodeEx, MAPVK_VSC_TO_VK_EX,
    };
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

    /* Scan codes of the keys that type a character. */
    const KEYS: &[(&str, u32)] = &[
        ("Backquote", 0x29), ("Digit1", 0x02), ("Digit2", 0x03), ("Digit3", 0x04),
        ("Digit4", 0x05), ("Digit5", 0x06), ("Digit6", 0x07), ("Digit7", 0x08),
        ("Digit8", 0x09), ("Digit9", 0x0A), ("Digit0", 0x0B), ("Minus", 0x0C),
        ("Equal", 0x0D), ("KeyQ", 0x10), ("KeyW", 0x11), ("KeyE", 0x12), ("KeyR", 0x13),
        ("KeyT", 0x14), ("KeyY", 0x15), ("KeyU", 0x16), ("KeyI", 0x17), ("KeyO", 0x18),
        ("KeyP", 0x19), ("BracketLeft", 0x1A), ("BracketRight", 0x1B), ("KeyA", 0x1E),
        ("KeyS", 0x1F), ("KeyD", 0x20), ("KeyF", 0x21), ("KeyG", 0x22), ("KeyH", 0x23),
        ("KeyJ", 0x24), ("KeyK", 0x25), ("KeyL", 0x26), ("Semicolon", 0x27),
        ("Quote", 0x28), ("Backslash", 0x2B), ("KeyZ", 0x2C), ("KeyX", 0x2D),
        ("KeyC", 0x2E), ("KeyV", 0x2F), ("KeyB", 0x30), ("KeyN", 0x31), ("KeyM", 0x32),
        ("Comma", 0x33), ("Period", 0x34), ("Slash", 0x35),
    ];

    pub fn labels() -> BTreeMap<String, String> {
        let mut out = BTreeMap::new();
        /* The layout of the program in front, which is the reader's current
           one; this app's own thread may still be on the layout it started
           with. */
        let layout = unsafe {
            let thread = GetWindowThreadProcessId(GetForegroundWindow(), None);
            GetKeyboardLayout(thread)
        };
        let nothing_held = [0u8; 256];
        for (code, scan) in KEYS {
            let key = unsafe { MapVirtualKeyExW(*scan, MAPVK_VSC_TO_VK_EX, Some(layout)) };
            if key == 0 {
                continue;
            }
            let mut buffer = [0u16; 8];
            /* Flag 4: leave the keyboard's state alone, so a dead key asked
               about here does not put an accent on the reader's next letter. */
            let mut length = unsafe { ToUnicodeEx(key, *scan, &nothing_held, &mut buffer, 4, Some(layout)) };
            if length < 0 {
                /* A dead key answers with its accent and a negative count. */
                length = 1;
            }
            if length <= 0 {
                continue;
            }
            let text = String::from_utf16_lossy(&buffer[..length as usize]);
            let text = text.trim();
            if text.is_empty() || text.chars().any(|c| c.is_control()) {
                continue;
            }
            let shown = text.to_uppercase();
            let shown = if shown.chars().count() == text.chars().count() { shown } else { text.to_string() };
            out.insert((*code).to_string(), shown);
        }
        out
    }

    pub fn taken() -> Vec<String> {
        let mut out: Vec<String> = "ABCDEGHIKLMNOPQRSTUVWXZ"
            .chars()
            .map(|letter| format!("Super+Key{letter}"))
            .chain((0..=9).map(|digit| format!("Super+Digit{digit}")))
            .chain(
                ["Tab", "Space", "Comma", "Period", "Semicolon", "Home", "ArrowUp", "ArrowDown",
                 "ArrowLeft", "ArrowRight"]
                    .iter()
                    .map(|key| format!("Super+{key}")),
            )
            .chain(
                ["KeyS", "KeyM", "KeyC", "KeyV", "KeyR", "ArrowUp", "ArrowDown", "ArrowLeft",
                 "ArrowRight"]
                    .iter()
                    .map(|key| format!("Super+Shift+{key}")),
            )
            .chain(["Super+Control+KeyD", "Super+Alt+KeyR", "Super+Alt+KeyG",
                    "Super+Alt+KeyB"].iter().map(|one| one.to_string()))
            .collect();
        out.sort();
        out
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use std::collections::BTreeMap;
    use std::ffi::c_void;
    use std::process::{Command, Stdio};

    type CFTypeRef = *const c_void;
    type CFStringRef = *const c_void;
    type CFDataRef = *const c_void;

    /* Every key the recorder accepts, at its place on the keyboard. The
       numbers are macOS virtual key codes — the same kind of "where" as the
       W3C names beside them, which is why the two can be paired at all. */
    const KEYS: &[(&str, u16)] = &[
        ("KeyA", 0), ("KeyB", 11), ("KeyC", 8), ("KeyD", 2), ("KeyE", 14),
        ("KeyF", 3), ("KeyG", 5), ("KeyH", 4), ("KeyI", 34), ("KeyJ", 38),
        ("KeyK", 40), ("KeyL", 37), ("KeyM", 46), ("KeyN", 45), ("KeyO", 31),
        ("KeyP", 35), ("KeyQ", 12), ("KeyR", 15), ("KeyS", 1), ("KeyT", 17),
        ("KeyU", 32), ("KeyV", 9), ("KeyW", 13), ("KeyX", 7), ("KeyY", 16),
        ("KeyZ", 6),
        ("Digit0", 29), ("Digit1", 18), ("Digit2", 19), ("Digit3", 20),
        ("Digit4", 21), ("Digit5", 23), ("Digit6", 22), ("Digit7", 26),
        ("Digit8", 28), ("Digit9", 25),
        ("Minus", 27), ("Equal", 24), ("BracketLeft", 33), ("BracketRight", 30),
        ("Backslash", 42), ("Semicolon", 41), ("Quote", 39), ("Comma", 43),
        ("Period", 47), ("Slash", 44), ("Backquote", 50),
        ("Space", 49), ("Enter", 36), ("Tab", 48), ("Escape", 53),
        ("Backspace", 51), ("Delete", 117),
        ("ArrowLeft", 123), ("ArrowRight", 124), ("ArrowDown", 125), ("ArrowUp", 126),
        ("Home", 115), ("End", 119), ("PageUp", 116), ("PageDown", 121),
        ("F1", 122), ("F2", 120), ("F3", 99), ("F4", 118), ("F5", 96),
        ("F6", 97), ("F7", 98), ("F8", 100), ("F9", 101), ("F10", 109),
        ("F11", 103), ("F12", 111), ("F13", 105), ("F14", 107), ("F15", 113),
        ("F16", 106), ("F17", 64), ("F18", 79), ("F19", 80), ("F20", 90),
        ("Numpad0", 82), ("Numpad1", 83), ("Numpad2", 84), ("Numpad3", 85),
        ("Numpad4", 86), ("Numpad5", 87), ("Numpad6", 88), ("Numpad7", 89),
        ("Numpad8", 91), ("Numpad9", 92),
    ];

    /* Keys that produce a character. The rest have names of their own — Space
       is Space on every keyboard in the world — and asking the layout what
       they type would answer with an invisible control character. */
    fn types_a_character(code: &str) -> bool {
        matches!(
            code,
            "Minus" | "Equal" | "BracketLeft" | "BracketRight" | "Backslash"
                | "Semicolon" | "Quote" | "Comma" | "Period" | "Slash" | "Backquote"
        ) || code.starts_with("Key")
            || code.starts_with("Digit")
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFRelease(cf: CFTypeRef);
        fn CFDataGetBytePtr(data: CFDataRef) -> *const u8;
    }

    #[link(name = "Carbon", kind = "framework")]
    extern "C" {
        static kTISPropertyUnicodeKeyLayoutData: CFStringRef;
        fn TISCopyCurrentKeyboardLayoutInputSource() -> *const c_void;
        fn TISGetInputSourceProperty(source: *const c_void, key: CFStringRef) -> *const c_void;
        fn LMGetKbdType() -> u8;
        #[allow(clippy::too_many_arguments)]
        fn UCKeyTranslate(
            layout: *const u8,
            key_code: u16,
            key_action: u16,
            modifier_state: u32,
            keyboard_type: u32,
            options: u32,
            dead_key_state: *mut u32,
            max_length: usize,
            actual_length: *mut usize,
            unicode: *mut u16,
        ) -> i32;
    }

    /* Asking for the character as it would be *shown*, with nothing held and
       dead keys resolved rather than left pending — otherwise the key that
       starts an accent on a French layout answers with nothing at all. */
    const ACTION_DISPLAY: u16 = 3;
    const NO_DEAD_KEYS: u32 = 1;

    pub fn labels() -> BTreeMap<String, String> {
        let mut out = BTreeMap::new();
        let source = unsafe { TISCopyCurrentKeyboardLayoutInputSource() };
        if source.is_null() {
            return out;
        }
        let data = unsafe { TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData) };
        if data.is_null() {
            unsafe { CFRelease(source) };
            return out;
        }
        let layout = unsafe { CFDataGetBytePtr(data) };
        let keyboard = unsafe { LMGetKbdType() } as u32;

        for (code, key) in KEYS.iter().filter(|(code, _)| types_a_character(code)) {
            let mut dead: u32 = 0;
            let mut length: usize = 0;
            let mut buffer = [0u16; 8];
            let status = unsafe {
                UCKeyTranslate(
                    layout,
                    *key,
                    ACTION_DISPLAY,
                    0,
                    keyboard,
                    NO_DEAD_KEYS,
                    &mut dead,
                    buffer.len(),
                    &mut length,
                    buffer.as_mut_ptr(),
                )
            };
            if status != 0 || length == 0 {
                continue;
            }
            let text = String::from_utf16_lossy(&buffer[..length]);
            let text = text.trim();
            /* Control characters have no business on a button. */
            if text.is_empty() || text.chars().any(|c| c.is_control()) {
                continue;
            }
            /* Upper case, unless upper case is a different number of
               letters: ß would arrive on the button as SS. */
            let shown = text.to_uppercase();
            let shown = if shown.chars().count() == text.chars().count() {
                shown
            } else {
                text.to_string()
            };
            out.insert((*code).to_string(), shown);
        }

        unsafe { CFRelease(source) };
        out
    }

    /* The modifier bits as this preference domain writes them. They are
       NSEvent's, and the two that are not here — Fn and the numeric keypad —
       are deliberately ignored: a shortcut carrying them is not one this app
       could register anyway, so it cannot collide with one either. */
    const SHIFT: u64 = 0x0002_0000;
    const CONTROL: u64 = 0x0004_0000;
    const OPTION: u64 = 0x0008_0000;
    const COMMAND: u64 = 0x0010_0000;

    pub fn taken() -> Vec<String> {
        let Some(raw) = read_symbolic_hotkeys() else {
            return Vec::new();
        };
        let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&raw) else {
            return Vec::new();
        };
        let Some(entries) = parsed.get("AppleSymbolicHotKeys").and_then(|v| v.as_object()) else {
            return Vec::new();
        };

        let mut out = Vec::new();
        for entry in entries.values() {
            /* A shortcut the reader switched off is not taken. */
            if entry.get("enabled").and_then(|v| v.as_bool()) != Some(true) {
                continue;
            }
            let Some(parameters) = entry
                .pointer("/value/parameters")
                .and_then(|v| v.as_array())
                .filter(|list| list.len() >= 3)
            else {
                continue;
            };
            let key = parameters[1].as_u64().unwrap_or(u64::MAX);
            let flags = parameters[2].as_u64().unwrap_or(0);
            let Some((code, _)) = KEYS.iter().find(|(_, value)| *value as u64 == key) else {
                continue;
            };

            /* Written exactly the way the window writes one, because that
               string is what the comparison is made on. */
            let mut parts = Vec::new();
            if flags & COMMAND != 0 {
                parts.push("CommandOrControl");
            }
            if flags & CONTROL != 0 {
                parts.push("Control");
            }
            if flags & OPTION != 0 {
                parts.push("Alt");
            }
            if flags & SHIFT != 0 {
                parts.push("Shift");
            }
            if parts.is_empty() {
                continue;
            }
            parts.push(code);
            out.push(parts.join("+"));
        }
        out.sort();
        out.dedup();
        out
    }

    /* Through `defaults` rather than by reading the file, because the file is
       not the truth — preferences are cached in a daemon and a plist read
       straight off disk can be stale. `plutil` turns the old-style output
       into JSON, which is already parseable here. */
    fn read_symbolic_hotkeys() -> Option<String> {
        let exported = Command::new("defaults")
            .args(["export", "com.apple.symbolichotkeys", "-"])
            .stderr(Stdio::null())
            .output()
            .ok()?;
        if !exported.status.success() {
            return None;
        }
        let mut child = Command::new("plutil")
            .args(["-convert", "json", "-o", "-", "-"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .ok()?;
        {
            use std::io::Write;
            child.stdin.as_mut()?.write_all(&exported.stdout).ok()?;
        }
        let converted = child.wait_with_output().ok()?;
        if !converted.status.success() {
            return None;
        }
        String::from_utf8(converted.stdout).ok()
    }
}

pub use platform::{labels, taken};

#[cfg(test)]
mod tests {
    /* Not an assertion about this machine's keyboard — it is a check that the
       layout is being asked at all. On any layout, the letter keys have to
       come back with single characters on them, and the reader's own keyboard
       decides which. */
    #[test]
    fn the_layout_answers_for_the_letter_keys() {
        let labels = super::labels();
        assert!(labels.len() > 30, "got {} labels", labels.len());
        for code in ["KeyA", "KeyL", "KeyD", "KeyZ", "Digit1", "BracketLeft"] {
            let label = labels.get(code).unwrap_or_else(|| panic!("no label for {code}"));
            assert_eq!(label.chars().count(), 1, "{code} came back as {label:?}");
        }
        eprintln!("this keyboard: {:?}", labels);
    }

    #[test]
    fn the_systems_own_shortcuts_are_readable() {
        let taken = super::taken();
        eprintln!("taken: {taken:?}");
        for one in &taken {
            assert!(one.contains('+'), "{one} carries no modifier");
        }
    }
}

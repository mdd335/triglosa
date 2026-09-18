#![cfg_attr(not(target_os = "macos"), allow(dead_code))]

/* Where a window is allowed to appear.

   A window belongs to one Space. Asking for it from a program that is running
   full screen therefore makes macOS leave that Space in order to show it —
   the reader presses the shortcut over the text they are reading and the
   desktop slides away under them.

   Two flags in the window's collection behaviour take that decision back: the
   window joins every Space instead of owning one, and it is allowed to sit
   over a full screen program rather than displace it. The second is the one
   that matters, and it is the one no layer below us sets — tao offers only
   the first, through `set_visible_on_all_workspaces`.

   A window left standing behind another program — the settings, a card — is
   the exception to the first flag. On every Space at once it is on the full
   screen Space too, and macOS, asked to bring the app forward, went there to
   show it rather than stay on the desktop the reader was on. Those two move
   to whichever Space is active when they are brought forward instead: the
   same trip into a full screen, never out of the one the reader is on.

   Said by hand through the Objective-C runtime, the way capture.rs speaks to
   the Accessibility API: this is one message to the window, and a binding
   crate for one message is a dependency that carries nothing. */

const CAN_JOIN_ALL_SPACES: u64 = 1 << 0;
const MOVE_TO_ACTIVE_SPACE: u64 = 1 << 1;
/* Mutually exclusive with the one below: a window cannot both be something
   another program's full screen may cover and something that goes full screen
   itself. tao sets Primary on every resizable window, so it has to come off
   again — the green button loses its full screen and keeps the zoom, which is
   the trade this whole file is about. */
const FULL_SCREEN_PRIMARY: u64 = 1 << 7;
const FULL_SCREEN_AUXILIARY: u64 = 1 << 8;

/* Which Space a window lives on: every one, or whichever is active when it
   is brought forward. */
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Spaces {
    All,
    Active,
}

pub fn collection_behavior(current: u64, spaces: Spaces) -> u64 {
    let placed = match spaces {
        Spaces::All => CAN_JOIN_ALL_SPACES,
        Spaces::Active => MOVE_TO_ACTIVE_SPACE,
    };
    (current & !(FULL_SCREEN_PRIMARY | CAN_JOIN_ALL_SPACES | MOVE_TO_ACTIVE_SPACE))
        | placed
        | FULL_SCREEN_AUXILIARY
}

#[cfg(target_os = "macos")]
mod platform {
    use std::ffi::{c_void, CString};
    use std::os::raw::c_char;

    /* The three buttons at the top left, in the order macOS numbers them. */
    const CLOSE_BUTTON: u64 = 0;
    const MINIATURIZE_BUTTON: u64 = 1;
    const ZOOM_BUTTON: u64 = 2;

    use super::{collection_behavior, Spaces};

    extern "C" {
        fn sel_registerName(name: *const c_char) -> *const c_void;
        fn objc_msgSend();
    }

    fn selector(name: &str) -> *const c_void {
        let name = CString::new(name).expect("a selector with no zero byte in it");
        unsafe { sel_registerName(name.as_ptr()) }
    }

    /* Must run on the main thread, like everything else that touches a
       window; the caller sees to that. */
    pub fn over_full_screen(ns_window: *mut c_void, spaces: Spaces) {
        if ns_window.is_null() {
            return;
        }
        /* objc_msgSend is declared without a signature and cast to the one
           each call actually has. That is how it is meant to be used: the
           real function takes whatever the selector takes. */
        let send = objc_msgSend as *const ();
        let read: extern "C" fn(*mut c_void, *const c_void) -> u64 =
            unsafe { std::mem::transmute(send) };
        let write: extern "C" fn(*mut c_void, *const c_void, u64) =
            unsafe { std::mem::transmute(send) };

        let current = read(ns_window, selector("collectionBehavior"));
        write(ns_window, selector("setCollectionBehavior:"), collection_behavior(current, spaces));
    }

    /* The first entry of a status item's menu drawn as a section heading —
       the small grey bold line macOS writes over a group of entries. muda
       has no such item, so the one it built is swapped for AppKit's own,
       with the same title. */
    pub fn first_entry_as_heading(ns_status_item: *mut c_void) {
        if ns_status_item.is_null() {
            return;
        }
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let at: extern "C" fn(*mut c_void, *const c_void, i64) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let with: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let remove: extern "C" fn(*mut c_void, *const c_void, i64) =
            unsafe { std::mem::transmute(send) };
        let insert: extern "C" fn(*mut c_void, *const c_void, *mut c_void, i64) =
            unsafe { std::mem::transmute(send) };

        let menu = object(ns_status_item, selector("menu"));
        if menu.is_null() {
            return;
        }
        let first = at(menu, selector("itemAtIndex:"), 0);
        if first.is_null() {
            return;
        }
        let title = object(first, selector("title"));
        let class = CString::new("NSMenuItem").expect("a class name");
        let item_class = unsafe { objc_getClass(class.as_ptr()) };
        if title.is_null() || item_class.is_null() {
            return;
        }
        let heading = with(item_class, selector("sectionHeaderWithTitle:"), title);
        if heading.is_null() {
            return;
        }
        remove(menu, selector("removeItemAtIndex:"), 0);
        insert(menu, selector("insertItem:atIndex:"), heading, 0);
    }

    /* A key equivalent written beside the entry with this title. */
    pub fn key_equivalent(ns_status_item: *mut c_void, title: &str, key: &str, mask: u64) {
        if ns_status_item.is_null() {
            return;
        }
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let with: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let from_utf8: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let set_object: extern "C" fn(*mut c_void, *const c_void, *mut c_void) =
            unsafe { std::mem::transmute(send) };
        let set_mask: extern "C" fn(*mut c_void, *const c_void, u64) =
            unsafe { std::mem::transmute(send) };

        let menu = object(ns_status_item, selector("menu"));
        let class = CString::new("NSString").expect("a class name");
        let string_class = unsafe { objc_getClass(class.as_ptr()) };
        let (Ok(title), Ok(key)) = (CString::new(title), CString::new(key)) else { return };
        if menu.is_null() || string_class.is_null() {
            return;
        }
        let title = from_utf8(string_class, selector("stringWithUTF8String:"), title.as_ptr());
        let key = from_utf8(string_class, selector("stringWithUTF8String:"), key.as_ptr());
        if title.is_null() || key.is_null() {
            return;
        }
        let entry = with(menu, selector("itemWithTitle:"), title);
        if entry.is_null() {
            return;
        }
        set_object(entry, selector("setKeyEquivalent:"), key);
        set_mask(entry, selector("setKeyEquivalentModifierMask:"), mask);
    }

    /* The window keeps its frame — its rounded corners, its shadow, its
       resizable edges and the title bar band that drags it — and loses only
       the three buttons drawn into that band. Hiding them rather than taking
       the frame away is what makes this three messages instead of a rebuilt
       window: a borderless window would have to bring its own corners, its
       own shadow and its own edges back. */
    pub fn hide_window_buttons(ns_window: *mut c_void) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let button: extern "C" fn(*mut c_void, *const c_void, u64) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let hide: extern "C" fn(*mut c_void, *const c_void, bool) =
            unsafe { std::mem::transmute(send) };

        for which in [CLOSE_BUTTON, MINIATURIZE_BUTTON, ZOOM_BUTTON] {
            let node = button(ns_window, selector("standardWindowButton:"), which);
            if !node.is_null() {
                hide(node, selector("setHidden:"), true);
            }
        }
    }

    /* Whether this app is still the active one. */
    pub fn app_is_active() -> bool {
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool =
            unsafe { std::mem::transmute(send) };
        let class = CString::new("NSApplication").expect("a class name");
        let app = object(unsafe { objc_getClass(class.as_ptr()) }, selector("sharedApplication"));
        !app.is_null() && ask(app, selector("isActive"))
    }
}

/* Whether the focus went to a panel that does not take the app's activation
   with it — Spotlight, with the clipboard history the reader pastes from, or
   the character viewer — rather than to another program. The window then
   stays: it is still what the reader is working in. Must be called on the
   main thread. */
pub fn app_is_active() -> bool {
    #[cfg(target_os = "macos")]
    {
        platform::app_is_active()
    }
    /* On Windows: whether the window in front is one of ours. A window just
       built — a card — can be in front before it reports the focus. */
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};
        let mut process = 0u32;
        unsafe { GetWindowThreadProcessId(GetForegroundWindow(), Some(&mut process)) };
        process == std::process::id()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        false
    }
}

/* A window's height changed with its top edge standing still, over a fifth
   of a second — the way a Finder info window opens a section. AppKit counts
   from the bottom left, so keeping the top means moving the origin by what
   the height changes. Through the window's animator inside an animation
   group rather than `setFrame:display:animate:`, which blocks until it is
   done and takes as long as the distance is long. Apple silicon only, where
   a rectangle comes back from objc_msgSend like any other value; elsewhere
   the height is set at once. */
#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
mod animate {
    use std::ffi::{c_void, CString};
    use std::os::raw::c_char;

    #[repr(C)]
    #[derive(Clone, Copy)]
    struct Rect {
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    }

    extern "C" {
        fn sel_registerName(name: *const c_char) -> *const c_void;
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn objc_msgSend();
    }

    fn selector(name: &str) -> *const c_void {
        let name = CString::new(name).expect("a selector with no zero byte in it");
        unsafe { sel_registerName(name.as_ptr()) }
    }

    pub const DURATION: f64 = 0.18;

    pub fn height(ns_window: *mut c_void, height: f64, animated: bool) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let frame: extern "C" fn(*mut c_void, *const c_void) -> Rect = unsafe { std::mem::transmute(send) };
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void = unsafe { std::mem::transmute(send) };
        let plain: extern "C" fn(*mut c_void, *const c_void) = unsafe { std::mem::transmute(send) };
        let duration: extern "C" fn(*mut c_void, *const c_void, f64) = unsafe { std::mem::transmute(send) };
        let set_frame: extern "C" fn(*mut c_void, *const c_void, Rect, bool) = unsafe { std::mem::transmute(send) };

        let now = frame(ns_window, selector("frame"));
        let wanted = Rect { y: now.y + now.height - height, height, ..now };
        if !animated {
            set_frame(ns_window, selector("setFrame:display:"), wanted, true);
            return;
        }
        let name = CString::new("NSAnimationContext").expect("a class name");
        let context_class = unsafe { objc_getClass(name.as_ptr()) };
        plain(context_class, selector("beginGrouping"));
        let context = object(context_class, selector("currentContext"));
        duration(context, selector("setDuration:"), DURATION);
        let animator = object(ns_window, selector("animator"));
        set_frame(animator, selector("setFrame:display:"), wanted, true);
        plain(context_class, selector("endGrouping"));
    }

    /* Fully transparent or fully there. */
    pub fn alpha(ns_window: *mut c_void, value: f64) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let set: extern "C" fn(*mut c_void, *const c_void, f64) = unsafe { std::mem::transmute(send) };
        set(ns_window, selector("setAlphaValue:"), value);
    }

    /* NSWindowAnimationBehaviorNone: no fade or zoom of the system's own when
       the window is ordered in. */
    pub fn no_appearing_animation(ns_window: *mut c_void) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let set: extern "C" fn(*mut c_void, *const c_void, i64) = unsafe { std::mem::transmute(send) };
        set(ns_window, selector("setAnimationBehavior:"), 2);
    }

    /* Whether the reader is dragging an edge right now. */
    pub fn in_live_resize(ns_window: *mut c_void) -> bool {
        if ns_window.is_null() {
            return false;
        }
        let send = objc_msgSend as *const ();
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool = unsafe { std::mem::transmute(send) };
        ask(ns_window, selector("inLiveResize"))
    }
}

/* The reading window to a frame height in points, its top edge kept, and
   animated where the caller says somebody is watching it grow. Must be called
   on the main thread. */
pub fn set_height_keeping_top(window: &tauri::WebviewWindow, height: f64, animated: bool) {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        if let Ok(handle) = window.ns_window() {
            animate::height(handle, height, animated);
        }
    }
    #[cfg(not(all(target_os = "macos", target_arch = "aarch64")))]
    {
        let _ = animated;
        let scale = window.scale_factor().unwrap_or(1.0);
        if let (Ok(outer), Ok(inner)) = (window.outer_size(), window.inner_size()) {
            let chrome = f64::from(outer.height - inner.height) / scale;
            let width = f64::from(inner.width) / scale;
            let _ = window.set_size(tauri::LogicalSize::new(width, height - chrome));
        }
    }
}

/* A window shown veiled: in front and focused, but transparent until the page
   has painted what it now holds. Hidden, a web view paints nothing, so the
   first frame of a window just shown is the last one it painted before it
   was put away — the previous reading, for a moment. Must be called on the
   main thread. */
pub fn set_veiled(window: &tauri::WebviewWindow, veiled: bool) {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        if let Ok(handle) = window.ns_window() {
            animate::no_appearing_animation(handle);
            animate::alpha(handle, if veiled { 0.0 } else { 1.0 });
        }
    }
    #[cfg(not(all(target_os = "macos", target_arch = "aarch64")))]
    let _ = (window, veiled);
}

/* Whether a size change comes from the reader's hand. Must be called on the
   main thread, which is where window events arrive. */
pub fn in_live_resize(window: &tauri::WebviewWindow) -> bool {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        window.ns_window().map(animate::in_live_resize).unwrap_or(false)
    }
    #[cfg(not(all(target_os = "macos", target_arch = "aarch64")))]
    {
        let _ = window;
        false
    }
}

/* Both windows get this, not only the one the shortcut opens: the settings
   are reached from that window, and a settings window that pulled the reader
   out of their full screen would have moved the problem rather than solved
   it. */
pub fn over_full_screen(window: &tauri::WebviewWindow, spaces: Spaces) {
    #[cfg(target_os = "macos")]
    {
        let target = window.clone();
        let _ = window.run_on_main_thread(move || {
            if let Ok(handle) = target.ns_window() {
                platform::over_full_screen(handle, spaces);
            }
        });
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (window, spaces);
}

/* The reading window only, and never the settings: a window that is reached
   from another one and has nothing else to say has to be closable by the one
   means everybody already knows.

   The reading window has three of its own — Escape, the focus leaving, and
   the menu bar symbol — and closing it never ended anything anyway: it hides.
   What goes with the buttons is the yellow one; there is no minimising a
   window that puts itself away when it is not being looked at. */
pub fn without_window_buttons(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        let target = window.clone();
        let _ = window.run_on_main_thread(move || {
            if let Ok(handle) = target.ns_window() {
                platform::hide_window_buttons(handle);
            }
        });
    }
    #[cfg(not(target_os = "macos"))]
    let _ = window;
}

/* The window in front and focused, on Windows.

   Windows lets a program take the foreground only while it is the one the
   reader last used, and a window shown from a global shortcut or the
   notification area is not: it opened behind whatever was in front, and the
   focus stayed there. The one sanctioned way round it is to share the input
   state of the thread that holds the foreground for the moment of asking —
   the program in front then counts as having handed the focus over. Must be
   called on the main thread. Elsewhere Tauri's own focus is enough. */
pub fn bring_to_front(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::Threading::GetCurrentThreadId;
        use windows::Win32::UI::WindowsAndMessaging::{
            BringWindowToTop, GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow,
        };
        use windows::Win32::System::Threading::AttachThreadInput;
        let Ok(handle) = window.hwnd() else { return };
        unsafe {
            let front = GetForegroundWindow();
            let theirs = GetWindowThreadProcessId(front, None);
            let ours = GetCurrentThreadId();
            let attached = theirs != 0 && theirs != ours && AttachThreadInput(ours, theirs, true).as_bool();
            let _ = BringWindowToTop(handle);
            let _ = SetForegroundWindow(handle);
            if attached {
                let _ = AttachThreadInput(ours, theirs, false);
            }
        }
        /* The window having the focus is not the page having it: without
           this the keys went to the frame, and Escape did nothing. */
        let _ = AsRef::<tauri::Webview>::as_ref(window).set_focus();
        return;
    }
    #[allow(unreachable_code)]
    let _ = window.set_focus();
}

/* How far the window's frame reaches past what can be seen of it, in
   physical pixels: left, top, right, bottom.

   Windows gives a window an invisible border to take hold of for resizing,
   and a window snapped to half the screen has that border lying past the
   screen's edge. Measured with it, the snapped window did not fit, and was
   pushed a few pixels towards the middle and made as much shorter every time
   it was brought forward. Nothing of the kind elsewhere. */
pub fn invisible_border(window: &tauri::WebviewWindow) -> (i32, i32, i32, i32) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::RECT;
        use windows::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_EXTENDED_FRAME_BOUNDS};
        use windows::Win32::UI::WindowsAndMessaging::GetWindowRect;
        let Ok(handle) = window.hwnd() else { return (0, 0, 0, 0) };
        let mut whole = RECT::default();
        let mut seen = RECT::default();
        let measured = unsafe {
            GetWindowRect(handle, &mut whole).is_ok()
                && DwmGetWindowAttribute(
                    handle,
                    DWMWA_EXTENDED_FRAME_BOUNDS,
                    &mut seen as *mut RECT as *mut core::ffi::c_void,
                    std::mem::size_of::<RECT>() as u32,
                )
                .is_ok()
        };
        if !measured {
            return (0, 0, 0, 0);
        }
        return (
            (seen.left - whole.left).max(0),
            (seen.top - whole.top).max(0),
            (whole.right - seen.right).max(0),
            (whole.bottom - seen.bottom).max(0),
        );
    }
    #[allow(unreachable_code)]
    {
        let _ = window;
        (0, 0, 0, 0)
    }
}

/* Whether a combination ends on a key with a character of its own, the kind
   AppKit is handed directly. */
pub fn is_character_combination(accelerator: &str) -> bool {
    accelerator.rsplit('+').next().is_some_and(|key| key.chars().count() == 1)
}

/* The modifier mask AppKit wants for a combination, and its key. */
fn key_and_mask(accelerator: &str) -> Option<(String, u64)> {
    let mut parts: Vec<&str> = accelerator.split('+').collect();
    let key = parts.pop()?;
    if key.chars().count() != 1 {
        return None;
    }
    let mut mask = 0u64;
    for part in parts {
        mask |= match part {
            "Shift" => 1 << 17,
            "Control" => 1 << 18,
            "Alt" => 1 << 19,
            "CommandOrControl" | "Command" | "Super" => 1 << 20,
            _ => return None,
        };
    }
    Some((key.to_string(), mask))
}

/* The menu bar symbol's menu finished where muda cannot: the first entry
   drawn as a section heading, and the shortcut beside the entry it belongs
   to. Both are left as muda built them where AppKit does not answer. */
pub fn finish_tray_menu(tray: &tauri::tray::TrayIcon, shortcuts: Vec<(String, String)>) {
    #[cfg(target_os = "macos")]
    let _ = tray.with_inner_tray_icon(move |inner| {
        if let Some(item) = inner.ns_status_item() {
            let item = &*item as *const _ as *mut std::ffi::c_void;
            platform::first_entry_as_heading(item);
            for (title, accelerator) in &shortcuts {
                if let Some((key, mask)) = key_and_mask(accelerator) {
                    platform::key_equivalent(item, title, &key, mask);
                }
            }
        }
    });
    #[cfg(not(target_os = "macos"))]
    let _ = (tray, shortcuts);
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn a_window_lives_on_every_space_or_follows_the_active_one_never_both() {
        let primary = FULL_SCREEN_PRIMARY | CAN_JOIN_ALL_SPACES;
        let all = collection_behavior(primary, Spaces::All);
        assert_eq!(all, CAN_JOIN_ALL_SPACES | FULL_SCREEN_AUXILIARY);
        let active = collection_behavior(primary, Spaces::Active);
        assert_eq!(active, MOVE_TO_ACTIVE_SPACE | FULL_SCREEN_AUXILIARY);
    }

    #[test]
    fn a_combination_on_a_character_key_is_told_to_appkit_with_its_mask() {
        use super::{is_character_combination, key_and_mask};
        assert!(is_character_combination("CommandOrControl+ü"));
        assert!(!is_character_combination("Control+Alt+Space"));
        assert_eq!(key_and_mask("CommandOrControl+ü"), Some(("ü".into(), 1 << 20)));
        assert_eq!(
            key_and_mask("Control+Alt+Shift+e"),
            Some(("e".into(), (1 << 18) | (1 << 19) | (1 << 17)))
        );
        assert_eq!(key_and_mask("Control+F5"), None);
    }
}

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
        write(
            ns_window,
            selector("setCollectionBehavior:"),
            collection_behavior(current, spaces),
        );
    }

    /* Off the screen where it is shown but not on the active Space. */
    pub fn order_out_where_unseen(ns_window: *mut c_void) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool =
            unsafe { std::mem::transmute(send) };
        let order: extern "C" fn(*mut c_void, *const c_void, *mut c_void) =
            unsafe { std::mem::transmute(send) };
        if ask(ns_window, selector("isVisible")) && !ask(ns_window, selector("isOnActiveSpace")) {
            order(ns_window, selector("orderOut:"), std::ptr::null_mut());
        }
    }

    /* Whether the window server has this window on the screen: the Space the
    reader is on, ordered in. Asked of the window server rather than of
    AppKit, which went on counting a window as shown that stood nowhere. */
    pub fn on_screen(ns_window: *mut c_void) -> Option<bool> {
        use std::ffi::c_void as Object;
        type CFTypeRef = *const Object;
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGWindowListCopyWindowInfo(option: u32, relative_to: u32) -> CFTypeRef;
            static kCGWindowIsOnscreen: CFTypeRef;
        }
        #[link(name = "CoreFoundation", kind = "framework")]
        extern "C" {
            fn CFArrayGetCount(array: CFTypeRef) -> isize;
            fn CFArrayGetValueAtIndex(array: CFTypeRef, index: isize) -> CFTypeRef;
            fn CFDictionaryGetValue(dictionary: CFTypeRef, key: CFTypeRef) -> CFTypeRef;
            fn CFBooleanGetValue(boolean: CFTypeRef) -> bool;
            fn CFRelease(object: CFTypeRef);
        }
        const INCLUDING_WINDOW: u32 = 1 << 3;

        if ns_window.is_null() {
            return None;
        }
        let send = objc_msgSend as *const ();
        let number: extern "C" fn(*mut c_void, *const c_void) -> isize =
            unsafe { std::mem::transmute(send) };
        let id = number(ns_window, selector("windowNumber"));
        /* No window of the window server's behind it at all. */
        if id <= 0 {
            return Some(false);
        }
        let list = unsafe { CGWindowListCopyWindowInfo(INCLUDING_WINDOW, id as u32) };
        if list.is_null() {
            return None;
        }
        let mut standing = false;
        if unsafe { CFArrayGetCount(list) } > 0 {
            /* The key is left out where the window is not on the screen. */
            let value = unsafe {
                CFDictionaryGetValue(CFArrayGetValueAtIndex(list, 0), kCGWindowIsOnscreen)
            };
            standing = !value.is_null() && unsafe { CFBooleanGetValue(value) };
        }
        unsafe { CFRelease(list) };
        Some(standing)
    }

    /* What the menu bar symbol's menu is given once it opens: the title of
    one of its entries that tells it from every other menu, and the key
    equivalents with the titles of the entries they go beside. */
    pub struct Finish {
        pub mark: String,
        pub shortcuts: Vec<(String, String, u64)>,
    }

    static FINISH: std::sync::Mutex<Option<Finish>> = std::sync::Mutex::new(None);

    /* The menu is finished as it opens, not when it is built: tray-icon
    hands it to the status item only for as long as it is open, so before
    that there is no way to it. AppKit tells every observer when a menu
    begins tracking, before it is drawn, with the menu itself. */
    pub fn finish_menu_on_open(finish: Finish) {
        *FINISH
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = Some(finish);
        static WATCH: std::sync::Once = std::sync::Once::new();
        WATCH.call_once(watch_menus);
    }

    fn watch_menus() {
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
            fn objc_allocateClassPair(
                superclass: *mut c_void,
                name: *const c_char,
                extra: usize,
            ) -> *mut c_void;
            fn objc_registerClassPair(class: *mut c_void);
            fn class_addMethod(
                class: *mut c_void,
                name: *const c_void,
                imp: *const c_void,
                types: *const c_char,
            ) -> bool;
        }
        #[link(name = "AppKit", kind = "framework")]
        extern "C" {
            static NSMenuDidBeginTrackingNotification: *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let observe: extern "C" fn(
            *mut c_void,
            *const c_void,
            *mut c_void,
            *const c_void,
            *mut c_void,
            *mut c_void,
        ) = unsafe { std::mem::transmute(send) };

        let name = CString::new("TriglosaMenuWatch").expect("a class name");
        let base = CString::new("NSObject").expect("a class name");
        let types = CString::new("v@:@").expect("a method type");
        let began = selector("menuBegan:");
        let class = unsafe {
            let class = objc_allocateClassPair(objc_getClass(base.as_ptr()), name.as_ptr(), 0);
            if class.is_null() {
                return;
            }
            class_addMethod(class, began, menu_began as *const c_void, types.as_ptr());
            objc_registerClassPair(class);
            class
        };
        /* Never released: it watches for as long as the app runs. */
        let watcher = object(class, selector("new"));
        let center_class = CString::new("NSNotificationCenter").expect("a class name");
        let center = object(
            unsafe { objc_getClass(center_class.as_ptr()) },
            selector("defaultCenter"),
        );
        if watcher.is_null() || center.is_null() {
            return;
        }
        observe(
            center,
            selector("addObserver:selector:name:object:"),
            watcher,
            began,
            unsafe { NSMenuDidBeginTrackingNotification },
            std::ptr::null_mut(),
        );
    }

    extern "C" fn menu_began(_this: *mut c_void, _cmd: *const c_void, notification: *mut c_void) {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let menu = object(notification, selector("object"));
        let finish = FINISH
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let Some(finish) = finish.as_ref() else {
            return;
        };
        if menu.is_null() || entry_titled(menu, &finish.mark).is_null() {
            return;
        }
        greyed_entries_as_headings(menu);
        for (title, key, mask) in &finish.shortcuts {
            key_equivalent(menu, title, key, *mask);
        }
    }

    fn ns_string(text: &str) -> *mut c_void {
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let from_utf8: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let class = CString::new("NSString").expect("a class name");
        let (string_class, Ok(text)) =
            (unsafe { objc_getClass(class.as_ptr()) }, CString::new(text))
        else {
            return std::ptr::null_mut();
        };
        if string_class.is_null() {
            return std::ptr::null_mut();
        }
        from_utf8(
            string_class,
            selector("stringWithUTF8String:"),
            text.as_ptr(),
        )
    }

    fn entry_titled(menu: *mut c_void, title: &str) -> *mut c_void {
        let send = objc_msgSend as *const ();
        let with: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let title = ns_string(title);
        if title.is_null() {
            return std::ptr::null_mut();
        }
        with(menu, selector("itemWithTitle:"), title)
    }

    /* Every greyed entry drawn as a section heading — the small grey bold
    line macOS writes over a group of entries. muda has no such item, so a
    greyed one is built and swapped for AppKit's own, with the same title.
    The menu has no other greyed entry. */
    fn greyed_entries_as_headings(menu: *mut c_void) {
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let count: extern "C" fn(*mut c_void, *const c_void) -> i64 =
            unsafe { std::mem::transmute(send) };
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool =
            unsafe { std::mem::transmute(send) };
        let at: extern "C" fn(*mut c_void, *const c_void, i64) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let with: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let remove: extern "C" fn(*mut c_void, *const c_void, i64) =
            unsafe { std::mem::transmute(send) };
        let insert: extern "C" fn(*mut c_void, *const c_void, *mut c_void, i64) =
            unsafe { std::mem::transmute(send) };

        let class = CString::new("NSMenuItem").expect("a class name");
        let item_class = unsafe { objc_getClass(class.as_ptr()) };
        if item_class.is_null() {
            return;
        }
        for index in 0..count(menu, selector("numberOfItems")) {
            let entry = at(menu, selector("itemAtIndex:"), index);
            if entry.is_null()
                || ask(entry, selector("isEnabled"))
                || ask(entry, selector("isSeparatorItem"))
                || ask(entry, selector("isSectionHeader"))
            {
                continue;
            }
            let title = object(entry, selector("title"));
            if title.is_null() {
                continue;
            }
            let heading = with(item_class, selector("sectionHeaderWithTitle:"), title);
            if heading.is_null() {
                continue;
            }
            remove(menu, selector("removeItemAtIndex:"), index);
            insert(menu, selector("insertItem:atIndex:"), heading, index);
        }
    }

    /* A key equivalent written beside the entry with this title. */
    fn key_equivalent(menu: *mut c_void, title: &str, key: &str, mask: u64) {
        let send = objc_msgSend as *const ();
        let set_object: extern "C" fn(*mut c_void, *const c_void, *mut c_void) =
            unsafe { std::mem::transmute(send) };
        let set_mask: extern "C" fn(*mut c_void, *const c_void, u64) =
            unsafe { std::mem::transmute(send) };
        let entry = entry_titled(menu, title);
        let key = ns_string(key);
        if entry.is_null() || key.is_null() {
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

    /* The program macOS counts as the one in front. A panel that comes
    forward without bringing this app along leaves it where it was. */
    pub fn front_program() -> i32 {
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
        }
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let number: extern "C" fn(*mut c_void, *const c_void) -> i32 =
            unsafe { std::mem::transmute(send) };
        let class = CString::new("NSWorkspace").expect("a class name");
        let workspace = object(
            unsafe { objc_getClass(class.as_ptr()) },
            selector("sharedWorkspace"),
        );
        if workspace.is_null() {
            return 0;
        }
        let front = object(workspace, selector("frontmostApplication"));
        if front.is_null() {
            return 0;
        }
        number(front, selector("processIdentifier"))
    }

    /* Seconds since a mouse button last went down anywhere. The system's own
    idle counter, which asks no permission. */
    pub fn seconds_since_click() -> f64 {
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGEventSourceSecondsSinceLastEventType(state: i32, kind: u32) -> f64;
        }
        const COMBINED_SESSION: i32 = 0;
        const LEFT_DOWN: u32 = 1;
        const RIGHT_DOWN: u32 = 3;
        const OTHER_DOWN: u32 = 25;
        [LEFT_DOWN, RIGHT_DOWN, OTHER_DOWN]
            .into_iter()
            .map(|kind| unsafe { CGEventSourceSecondsSinceLastEventType(COMBINED_SESSION, kind) })
            .fold(f64::INFINITY, f64::min)
    }

    /* The program owning the topmost window under the pointer, this app's
    own left out: 0 where there is none. The window server's list runs from
    front to back, in the same top-left points as the pointer. */
    pub fn owner_under_pointer() -> i32 {
        type CFTypeRef = *const c_void;
        #[repr(C)]
        #[derive(Default)]
        struct Point {
            x: f64,
            y: f64,
        }
        #[repr(C)]
        #[derive(Default)]
        struct Rect {
            origin: Point,
            width: f64,
            height: f64,
        }
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGEventCreate(source: CFTypeRef) -> CFTypeRef;
            fn CGEventGetLocation(event: CFTypeRef) -> Point;
            fn CGWindowListCopyWindowInfo(option: u32, relative_to: u32) -> CFTypeRef;
            fn CGRectMakeWithDictionaryRepresentation(
                dictionary: CFTypeRef,
                rect: *mut Rect,
            ) -> bool;
            static kCGWindowOwnerPID: CFTypeRef;
            static kCGWindowAlpha: CFTypeRef;
            static kCGWindowBounds: CFTypeRef;
        }
        #[link(name = "CoreFoundation", kind = "framework")]
        extern "C" {
            fn CFArrayGetCount(array: CFTypeRef) -> isize;
            fn CFArrayGetValueAtIndex(array: CFTypeRef, index: isize) -> CFTypeRef;
            fn CFDictionaryGetValue(dictionary: CFTypeRef, key: CFTypeRef) -> CFTypeRef;
            fn CFNumberGetValue(number: CFTypeRef, kind: i32, value: *mut c_void) -> u8;
            fn CFRelease(object: CFTypeRef);
        }
        const ON_SCREEN_ONLY: u32 = 1 << 0;
        const SINT32: i32 = 3;
        const DOUBLE: i32 = 13;

        let event = unsafe { CGEventCreate(std::ptr::null()) };
        if event.is_null() {
            return 0;
        }
        let pointer = unsafe { CGEventGetLocation(event) };
        unsafe { CFRelease(event) };
        let list = unsafe { CGWindowListCopyWindowInfo(ON_SCREEN_ONLY, 0) };
        if list.is_null() {
            return 0;
        }
        let own = std::process::id() as i32;
        let mut found = 0;
        for index in 0..unsafe { CFArrayGetCount(list) } {
            let window = unsafe { CFArrayGetValueAtIndex(list, index) };
            let mut pid: i32 = 0;
            let mut alpha: f64 = 1.0;
            let mut bounds = Rect::default();
            unsafe {
                let value = CFDictionaryGetValue(window, kCGWindowOwnerPID);
                if !value.is_null() {
                    CFNumberGetValue(value, SINT32, &mut pid as *mut i32 as *mut c_void);
                }
                let value = CFDictionaryGetValue(window, kCGWindowAlpha);
                if !value.is_null() {
                    CFNumberGetValue(value, DOUBLE, &mut alpha as *mut f64 as *mut c_void);
                }
                let value = CFDictionaryGetValue(window, kCGWindowBounds);
                if value.is_null() || !CGRectMakeWithDictionaryRepresentation(value, &mut bounds) {
                    continue;
                }
            }
            let holds = pointer.x >= bounds.origin.x
                && pointer.x < bounds.origin.x + bounds.width
                && pointer.y >= bounds.origin.y
                && pointer.y < bounds.origin.y + bounds.height;
            if holds && alpha > 0.0 && pid > 0 && pid != own {
                found = pid;
                break;
            }
        }
        unsafe { CFRelease(list) };
        found
    }

    /* Keys given back to whatever had them before the panel took them, the
    panel left standing where it is: out and in again, in one turn of the
    main thread, without being made key on the way in. */
    pub fn give_up_keys(ns_window: *mut c_void) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool =
            unsafe { std::mem::transmute(send) };
        let plain: extern "C" fn(*mut c_void, *const c_void) = unsafe { std::mem::transmute(send) };
        let order: extern "C" fn(*mut c_void, *const c_void, *mut c_void) =
            unsafe { std::mem::transmute(send) };
        if ask(ns_window, selector("isKeyWindow")) && ask(ns_window, selector("isVisible")) {
            order(ns_window, selector("orderOut:"), std::ptr::null_mut());
            plain(ns_window, selector("orderFrontRegardless"));
        }
    }
}

/* Where things stood when the reading window lost the focus. */
pub struct FocusLeft {
    at: std::time::Instant,
    front: i32,
}

/* Must be called on the main thread, which is where the loss is reported. */
pub fn focus_left() -> FocusLeft {
    FocusLeft {
        at: std::time::Instant::now(),
        #[cfg(target_os = "macos")]
        front: platform::front_program(),
        #[cfg(not(target_os = "macos"))]
        front: 0,
    }
}

/* Whether the reader has gone to another program since the reading window
lost the focus, rather than to a panel that floats over the one they are
in — Spotlight, with the clipboard history they paste from, or the
character viewer. The window stays for those: it is still what the reader
is working in.

On the Mac the reading window is a panel that never makes this app the
active one, so being active says nothing. Another program has been reached
when the one in front is no longer the one that was, or when a mouse button
went down since a moment before the focus left over a window of the
program in front — a click into the program under the window keeps it in
front and takes the focus all the same, while a click into Spotlight's
list lands on a window of Spotlight's own, which is never in front. This
app coming forward with a card or the settings is not another program, and
a click into one of its windows has given that window the focus by the
time this is asked. A panel opened from the keyboard does neither. Must be called on the main
thread. */
pub fn reached_elsewhere(left: &FocusLeft) -> bool {
    #[cfg(target_os = "macos")]
    {
        const CLICK_BEFORE_LOSS: f64 = 0.3;
        let front = platform::front_program();
        let own = std::process::id() as i32;
        let clicked =
            platform::seconds_since_click() < left.at.elapsed().as_secs_f64() + CLICK_BEFORE_LOSS;
        (front != left.front && front != own)
            || (clicked && front > 0 && platform::owner_under_pointer() == front)
    }
    /* On Windows: whether the window in front is anything but one of ours. A
    window just built — a card — can be in front before it reports the
    focus. */
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::{
            GetForegroundWindow, GetWindowThreadProcessId,
        };
        let _ = left;
        let mut process = 0u32;
        unsafe { GetWindowThreadProcessId(GetForegroundWindow(), Some(&mut process)) };
        process != std::process::id()
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = left;
        true
    }
}

/* A window's height changed with its top edge standing still, over a fifth
of a second — the way a Finder info window opens a section. AppKit counts
from the bottom left, so keeping the top means moving the origin by what
the height changes. Through the window's animator inside an animation
group rather than `setFrame:display:animate:`, which blocks until it is
done and takes as long as the distance is long. On Apple silicon a
rectangle comes back from objc_msgSend like any other value; on Intel a
structure that large comes back through objc_msgSend_stret, which writes
it where the caller points — what Rust's C calling convention does for a
return value of that size anyway. */
#[cfg(target_os = "macos")]
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
        #[cfg(target_arch = "x86_64")]
        fn objc_msgSend_stret();
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
        #[cfg(target_arch = "x86_64")]
        let send_rect = objc_msgSend_stret as *const ();
        #[cfg(not(target_arch = "x86_64"))]
        let send_rect = send;
        let frame: extern "C" fn(*mut c_void, *const c_void) -> Rect =
            unsafe { std::mem::transmute(send_rect) };
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let plain: extern "C" fn(*mut c_void, *const c_void) = unsafe { std::mem::transmute(send) };
        let duration: extern "C" fn(*mut c_void, *const c_void, f64) =
            unsafe { std::mem::transmute(send) };
        let set_frame: extern "C" fn(*mut c_void, *const c_void, Rect, bool) =
            unsafe { std::mem::transmute(send) };

        let now = frame(ns_window, selector("frame"));
        let wanted = Rect {
            y: now.y + now.height - height,
            height,
            ..now
        };
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
        let set: extern "C" fn(*mut c_void, *const c_void, f64) =
            unsafe { std::mem::transmute(send) };
        set(ns_window, selector("setAlphaValue:"), value);
    }

    /* NSWindowAnimationBehaviorNone: no fade or zoom of the system's own when
    the window is ordered in. */
    pub fn no_appearing_animation(ns_window: *mut c_void) {
        if ns_window.is_null() {
            return;
        }
        let send = objc_msgSend as *const ();
        let set: extern "C" fn(*mut c_void, *const c_void, i64) =
            unsafe { std::mem::transmute(send) };
        set(ns_window, selector("setAnimationBehavior:"), 2);
    }

    /* Whether the reader is dragging an edge right now. */
    pub fn in_live_resize(ns_window: *mut c_void) -> bool {
        if ns_window.is_null() {
            return false;
        }
        let send = objc_msgSend as *const ();
        let ask: extern "C" fn(*mut c_void, *const c_void) -> bool =
            unsafe { std::mem::transmute(send) };
        ask(ns_window, selector("inLiveResize"))
    }
}

/* The reading window to a frame height in points, its top edge kept, and
animated where the caller says somebody is watching it grow. Must be called
on the main thread. */
pub fn set_height_keeping_top(window: &tauri::WebviewWindow, height: f64, animated: bool) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(handle) = window.ns_window() {
            animate::height(handle, height, animated);
        }
    }
    #[cfg(not(target_os = "macos"))]
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
    #[cfg(target_os = "macos")]
    {
        if let Ok(handle) = window.ns_window() {
            animate::no_appearing_animation(handle);
            animate::alpha(handle, if veiled { 0.0 } else { 1.0 });
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (window, veiled);
}

/* Whether a size change comes from the reader's hand. Must be called on the
main thread, which is where window events arrive. */
pub fn in_live_resize(window: &tauri::WebviewWindow) -> bool {
    #[cfg(target_os = "macos")]
    {
        window
            .ns_window()
            .map(animate::in_live_resize)
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
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

/* The reading window shown on the Space the reader is on, and on every
Space from there.

Hidden, a window on every Space does not stay on every Space: a program
going into full screen or coming out of it leaves it on one of them alone,
its flags unchanged, and shown from another it took the reader there and
was put away at once, the focus lost on the way. Its flags changed while it
is hidden change nothing. So it is shown following the active Space, which
puts it on the one the reader is on, and joins every Space again once it
stands there.

A window can also be shown and stand on no Space at all: macOS then counts
it as shown, showing it again does nothing, and the app came forward with
nothing to see. Shown anywhere but on the Space the reader is on, it is
taken off the screen first. Must be called on the main thread. */
pub fn show_on_active_space(window: &tauri::WebviewWindow, show: impl FnOnce()) {
    #[cfg(target_os = "macos")]
    {
        let handle = window.ns_window().ok();
        if let Some(handle) = handle {
            platform::over_full_screen(handle, Spaces::Active);
            platform::order_out_where_unseen(handle);
        }
        show();
        if let Some(handle) = handle {
            platform::over_full_screen(handle, Spaces::All);
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = window;
        show();
    }
}

/* The reading window as a panel that takes the keys without making this app
the active one — the kind of window Spotlight and the launchers float over
the program the reader is in.

An ordinary window comes forward by making its app active, and macOS
answers an app becoming active by going to the Space its window stands on.
A hidden window's Space drifts — a program going into full screen or
coming out of it leaves it on one Space alone, or on none — and the reader
was taken there, or shown nothing. A panel that does not activate is
ordered in where the reader is and takes the keys; the program in front
stays in front, and no Space is left for it.

Its class swapped for an NSPanel subclass and the non-activating flag set
by tauri-nspanel, which also tells the window server: the flag alone, set
on a window built as an ordinary one, is not heard there. The settings,
the first steps and a card stay ordinary windows: each is built anew on the
Space the reader is on and never hidden to drift, and they are windows to
stay in, not to glance at. Must be called before the window is first
shown. */
#[cfg(target_os = "macos")]
mod panel {
    tauri_nspanel::tauri_panel! {
        panel!(ReadingPanel {
            config: {
                can_become_key_window: true,
                hides_on_deactivate: false
            }
        })
    }
}

pub fn as_panel(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        use tauri_nspanel::{panel::NSWindowStyleMask, WebviewWindowExt};
        let target = window.clone();
        let _ = window.run_on_main_thread(move || {
            if let Ok(panel) = target.to_panel::<panel::ReadingPanel>() {
                let _ = panel.add_style_mask(NSWindowStyleMask::NonactivatingPanel);
            }
        });
    }
    #[cfg(not(target_os = "macos"))]
    let _ = window;
}

/* Whether the window server has the window on the screen; `None` where that
cannot be asked (on Windows, or without a window behind it). Must be called
on the main thread. */
pub fn stands_on_screen(window: &tauri::WebviewWindow) -> Option<bool> {
    #[cfg(target_os = "macos")]
    {
        window.ns_window().ok().and_then(platform::on_screen)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = window;
        None
    }
}

/* The reading window's keys handed back to the program under it, the window
left standing: a pinned panel keeps them otherwise, and what is pasted
there lands in the panel. Must be called on the main thread. */
pub fn give_up_keys(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    if let Ok(handle) = window.ns_window() {
        platform::give_up_keys(handle);
    }
    #[cfg(not(target_os = "macos"))]
    let _ = window;
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
called on the main thread. Elsewhere Tauri's own focus is enough, but for
the reading window's panel. */
pub fn bring_to_front(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::System::Threading::AttachThreadInput;
        use windows::Win32::System::Threading::GetCurrentThreadId;
        use windows::Win32::UI::WindowsAndMessaging::{
            BringWindowToTop, GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow,
        };
        let Ok(handle) = window.hwnd() else { return };
        unsafe {
            let front = GetForegroundWindow();
            let theirs = GetWindowThreadProcessId(front, None);
            let ours = GetCurrentThreadId();
            let attached =
                theirs != 0 && theirs != ours && AttachThreadInput(ours, theirs, true).as_bool();
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
    /* A panel is made key and its page given the keys, and the app is not
    made active: Tauri's own focus would, and that is the one thing the
    panel is there to avoid. Ordered in front regardless: a window of an app
    that is not active comes forward only among its own app's windows, and
    stood behind the program the reader was in. */
    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;
        use tauri_nspanel::ManagerExt;
        if let Ok(panel) = window.app_handle().get_webview_panel(window.label()) {
            panel.order_front_regardless();
            panel.make_key_window();
            let _ = AsRef::<tauri::Webview>::as_ref(window).set_focus();
            return;
        }
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
        let Ok(handle) = window.hwnd() else {
            return (0, 0, 0, 0);
        };
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
    accelerator
        .rsplit('+')
        .next()
        .is_some_and(|key| key.chars().count() == 1)
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

/* The menu bar symbol's menu finished where muda cannot, each time it opens:
its greyed entries drawn as section headings, and each shortcut beside the
entry it belongs to. `mark` is the title of one of its entries, which tells
it from every other menu. Left as muda built it where AppKit does not
answer. */
pub fn finish_tray_menu(mark: &str, shortcuts: Vec<(String, String)>) {
    #[cfg(target_os = "macos")]
    platform::finish_menu_on_open(platform::Finish {
        mark: mark.to_string(),
        shortcuts: shortcuts
            .into_iter()
            .filter_map(|(title, accelerator)| {
                key_and_mask(&accelerator).map(|(key, mask)| (title, key, mask))
            })
            .collect(),
    });
    #[cfg(not(target_os = "macos"))]
    let _ = (mark, shortcuts);
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
        assert_eq!(
            key_and_mask("CommandOrControl+ü"),
            Some(("ü".into(), 1 << 20))
        );
        assert_eq!(
            key_and_mask("Control+Alt+Shift+e"),
            Some(("e".into(), (1 << 18) | (1 << 19) | (1 << 17)))
        );
        assert_eq!(key_and_mask("Control+F5"), None);
    }
}

/* Apple's dictionary on the Mac, where no AI model explains a word: whether
one of the dictionaries the reader has active holds it (Dictionary
Services, public since 10.5), and the system's own Look Up panel for it,
laid over the word where it stands in the window. What the dictionaries say
is never read into the app: it stays in Apple's panel. The phone's half is
in src-tauri/ios/Translation.swift; the page's in src/platform/dictionary.js. */

use std::ffi::{c_void, CString};
use std::os::raw::c_char;

type CFTypeRef = *const c_void;

#[repr(C)]
#[derive(Clone, Copy)]
struct CFRange {
    location: isize,
    length: isize,
}

#[repr(C)]
#[derive(Clone, Copy)]
struct NSPoint {
    x: f64,
    y: f64,
}

#[link(name = "CoreServices", kind = "framework")]
extern "C" {
    fn DCSCopyTextDefinition(dictionary: CFTypeRef, text: CFTypeRef, range: CFRange) -> CFTypeRef;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFStringCreateWithBytes(
        allocator: CFTypeRef,
        bytes: *const u8,
        length: isize,
        encoding: u32,
        external: u8,
    ) -> CFTypeRef;
    fn CFStringGetLength(string: CFTypeRef) -> isize;
    fn CFRelease(object: CFTypeRef);
}

#[link(name = "AppKit", kind = "framework")]
extern "C" {
    static NSFontAttributeName: *mut c_void;
}

extern "C" {
    fn sel_registerName(name: *const c_char) -> *const c_void;
    fn objc_getClass(name: *const c_char) -> *mut c_void;
    fn objc_msgSend();
    fn objc_autoreleasePoolPush() -> *mut c_void;
    fn objc_autoreleasePoolPop(pool: *mut c_void);
}

const UTF8: u32 = 0x0800_0100;

fn selector(name: &str) -> *const c_void {
    let name = CString::new(name).expect("a selector with no zero byte in it");
    unsafe { sel_registerName(name.as_ptr()) }
}

/* Whether an active dictionary has an entry for the whole term — a form
too: the dictionaries find "gingen" under "gehen". */
fn holds(term: &str) -> bool {
    let term = term.trim();
    if term.is_empty() {
        return false;
    }
    unsafe {
        let text = CFStringCreateWithBytes(
            std::ptr::null(),
            term.as_ptr(),
            term.len() as isize,
            UTF8,
            0,
        );
        if text.is_null() {
            return false;
        }
        let whole = CFRange {
            location: 0,
            length: CFStringGetLength(text),
        };
        let entry = DCSCopyTextDefinition(std::ptr::null(), text, whole);
        CFRelease(text);
        if entry.is_null() {
            return false;
        }
        CFRelease(entry);
        true
    }
}

#[tauri::command]
pub async fn dictionary_has(term: String) -> bool {
    tauri::async_runtime::spawn_blocking(move || holds(&term))
        .await
        .unwrap_or(false)
}

/* The Look Up panel for the term, the word laid over the window at `x`, `y`
(its baseline's start, in the page's points from the top left) in a system
font of `size`. Must run on the main thread; the caller sees to that. */
fn show(view: *mut c_void, height: f64, term: &str, x: f64, y: f64, size: f64) {
    let Ok(term) = CString::new(term.replace('\0', "")) else {
        return;
    };
    if view.is_null() {
        return;
    }
    unsafe {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            std::mem::transmute(send);
        let from_text: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            std::mem::transmute(send);
        let font_of: extern "C" fn(*mut c_void, *const c_void, f64) -> *mut c_void =
            std::mem::transmute(send);
        let pair: extern "C" fn(
            *mut c_void,
            *const c_void,
            *mut c_void,
            *mut c_void,
        ) -> *mut c_void = std::mem::transmute(send);
        let flipped: extern "C" fn(*mut c_void, *const c_void) -> bool = std::mem::transmute(send);
        let look_up: extern "C" fn(*mut c_void, *const c_void, *mut c_void, NSPoint) =
            std::mem::transmute(send);

        let pool = objc_autoreleasePoolPush();
        let text = from_text(
            objc_getClass(c"NSString".as_ptr()),
            selector("stringWithUTF8String:"),
            term.as_ptr(),
        );
        let font = font_of(
            objc_getClass(c"NSFont".as_ptr()),
            selector("systemFontOfSize:"),
            if size > 0.0 { size } else { 13.0 },
        );
        let attributes = pair(
            objc_getClass(c"NSDictionary".as_ptr()),
            selector("dictionaryWithObject:forKey:"),
            font,
            NSFontAttributeName,
        );
        let made = object(
            objc_getClass(c"NSAttributedString".as_ptr()),
            selector("alloc"),
        );
        let words = pair(
            made,
            selector("initWithString:attributes:"),
            text,
            attributes,
        );
        let at = NSPoint {
            x,
            y: if flipped(view, selector("isFlipped")) {
                y
            } else {
                height - y
            },
        };
        look_up(
            view,
            selector("showDefinitionForAttributedString:atPoint:"),
            words,
            at,
        );
        let release: extern "C" fn(*mut c_void, *const c_void) = std::mem::transmute(send);
        release(words, selector("release"));
        objc_autoreleasePoolPop(pool);
    }
}

#[tauri::command]
pub async fn dictionary_show(
    window: tauri::WebviewWindow,
    term: String,
    x: f64,
    y: f64,
    size: f64,
) -> bool {
    let Ok(view) = window.ns_view() else {
        return false;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let height = window
        .inner_size()
        .map(|inner| inner.height as f64 / scale)
        .unwrap_or(0.0);
    let view = view as usize;
    window
        .run_on_main_thread(move || show(view as *mut c_void, height, &term, x, y, size))
        .is_ok()
}

/* The Dictionary app, where the reader ticks the dictionaries Look Up uses. */
#[tauri::command]
pub async fn dictionary_settings() -> bool {
    std::process::Command::new("/usr/bin/open")
        .args(["-b", "com.apple.Dictionary"])
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

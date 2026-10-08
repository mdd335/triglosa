#![cfg_attr(not(target_os = "macos"), allow(dead_code))]

/* What a force click or a pointer shortcut read, lit up where it stands
for a moment — the way Apple's Look Up marks its word — in the light blue
of the app's icon.

One window around all the boxes, borderless, see-through, every click
passing through it to the program underneath, on every Space and over a
full screen program. Each box is a rounded layer in it. The window fades
in, stays a moment and fades out, then is closed; nothing in it can be
focused, so the program the reader is in stays in front.

On Windows the same window is a layered one the boxes are painted into
(`paint`), in the screen's pixels, which is what UI Automation hands the
boxes over in.

Said by hand through the Objective-C runtime, as in overlay.rs: a binding
crate for a dozen messages is a dependency that carries nothing. Every
structure goes in as an argument, never comes back as a return value, so
Intel needs no `objc_msgSend_stret` here. */

use crate::capture::Mark;

/* The icon's light blue, #18daf1. */
const COLOUR: (f64, f64, f64) = (
    0x18 as f64 / 255.0,
    0xda as f64 / 255.0,
    0xf1 as f64 / 255.0,
);
const OPACITY: f64 = 0.4;
/* Around the text's own box, so the colour does not cut into the letters. */
const MARGIN_X: f64 = 2.0;
const MARGIN_Y: f64 = 1.0;
const CORNER: f64 = 4.0;
const FADE_IN: f64 = 0.12;
const STAY_MS: u64 = 900;
const FADE_OUT: f64 = 0.35;

/* A rectangle as AppKit counts: from the bottom left of the main display,
upwards. */
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/* The window's frame and each box inside it, in AppKit's counting. The
accessibility tree counts from the top left of the main display downwards;
AppKit from its bottom left upwards, so a box's bottom edge is the main
display's height less the tree's bottom edge. */
pub fn layout(marks: &[Mark], main_height: f64) -> Option<(Rect, Vec<Rect>)> {
    let boxes: Vec<Rect> = marks
        .iter()
        .filter(|mark| mark.width > 0.0 && mark.height > 0.0)
        .map(|mark| Rect {
            x: mark.x - MARGIN_X,
            y: main_height - (mark.y + mark.height) - MARGIN_Y,
            width: mark.width + 2.0 * MARGIN_X,
            height: mark.height + 2.0 * MARGIN_Y,
        })
        .collect();
    let left = boxes.iter().map(|rect| rect.x).reduce(f64::min)?;
    let bottom = boxes.iter().map(|rect| rect.y).reduce(f64::min)?;
    let right = boxes
        .iter()
        .map(|rect| rect.x + rect.width)
        .reduce(f64::max)?;
    let top = boxes
        .iter()
        .map(|rect| rect.y + rect.height)
        .reduce(f64::max)?;
    let frame = Rect {
        x: left,
        y: bottom,
        width: right - left,
        height: top - bottom,
    };
    let inside = boxes
        .iter()
        .map(|rect| Rect {
            x: rect.x - left,
            y: rect.y - bottom,
            ..*rect
        })
        .collect();
    Some((frame, inside))
}

#[cfg(target_os = "macos")]
mod native {
    use super::Rect;
    use std::ffi::{c_void, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn sel_registerName(name: *const c_char) -> *const c_void;
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn objc_msgSend();
        fn objc_autoreleasePoolPush() -> *mut c_void;
        fn objc_autoreleasePoolPop(pool: *mut c_void);
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGMainDisplayID() -> u32;
        fn CGDisplayBounds(display: u32) -> Rect;
        fn CGColorCreateSRGB(red: f64, green: f64, blue: f64, alpha: f64) -> *const c_void;
        fn CGColorRelease(colour: *const c_void);
    }

    #[link(name = "QuartzCore", kind = "framework")]
    extern "C" {}

    fn selector(name: &str) -> *const c_void {
        let name = CString::new(name).expect("a selector with no zero byte in it");
        unsafe { sel_registerName(name.as_ptr()) }
    }

    fn class(name: &str) -> *mut c_void {
        let name = CString::new(name).expect("a class name with no zero byte in it");
        unsafe { objc_getClass(name.as_ptr()) }
    }

    pub fn main_height() -> f64 {
        unsafe { CGDisplayBounds(CGMainDisplayID()) }.height
    }

    const BORDERLESS: u64 = 0;
    const BUFFERED: u64 = 2;
    /* NSNormalWindowLevel: ordered in over the program read from, and under
    the reading window, which comes forward after it — and, pinned, floats
    a level higher anyway. */
    const LEVEL: i64 = 0;
    /* Every Space, over a full screen program, left where it is by Exposé,
    and out of the window cycle. */
    const BEHAVIOUR: u64 = (1 << 0) | (1 << 8) | (1 << 4) | (1 << 6);
    const NO_ANIMATION: i64 = 2;

    /* The window made and faded in; its address, or 0. Main thread. */
    pub fn open(frame: Rect, boxes: &[Rect]) -> usize {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let with_object: extern "C" fn(*mut c_void, *const c_void, *const c_void) =
            unsafe { std::mem::transmute(send) };
        let with_bool: extern "C" fn(*mut c_void, *const c_void, bool) =
            unsafe { std::mem::transmute(send) };
        let with_float: extern "C" fn(*mut c_void, *const c_void, f64) =
            unsafe { std::mem::transmute(send) };
        let with_integer: extern "C" fn(*mut c_void, *const c_void, i64) =
            unsafe { std::mem::transmute(send) };
        let with_rect: extern "C" fn(*mut c_void, *const c_void, Rect) =
            unsafe { std::mem::transmute(send) };
        let make: extern "C" fn(*mut c_void, *const c_void, Rect, u64, u64, bool) -> *mut c_void =
            unsafe { std::mem::transmute(send) };

        unsafe {
            let pool = objc_autoreleasePoolPush();
            let window = object(class("NSWindow"), selector("alloc"));
            let window = make(
                window,
                selector("initWithContentRect:styleMask:backing:defer:"),
                frame,
                BORDERLESS,
                BUFFERED,
                false,
            );
            if window.is_null() {
                objc_autoreleasePoolPop(pool);
                return 0;
            }
            with_bool(window, selector("setReleasedWhenClosed:"), false);
            with_bool(window, selector("setOpaque:"), false);
            let clear = object(class("NSColor"), selector("clearColor"));
            with_object(window, selector("setBackgroundColor:"), clear);
            with_bool(window, selector("setHasShadow:"), false);
            with_bool(window, selector("setIgnoresMouseEvents:"), true);
            with_integer(window, selector("setLevel:"), LEVEL);
            with_integer(window, selector("setCollectionBehavior:"), BEHAVIOUR as i64);
            with_integer(window, selector("setAnimationBehavior:"), NO_ANIMATION);
            with_float(window, selector("setAlphaValue:"), 0.0);

            let view = object(window, selector("contentView"));
            with_bool(view, selector("setWantsLayer:"), true);
            let root = object(view, selector("layer"));
            let (red, green, blue) = super::COLOUR;
            let colour = CGColorCreateSRGB(red, green, blue, super::OPACITY);
            for rect in boxes {
                let layer = object(class("CALayer"), selector("layer"));
                with_rect(layer, selector("setFrame:"), *rect);
                with_object(layer, selector("setBackgroundColor:"), colour);
                with_float(layer, selector("setCornerRadius:"), super::CORNER);
                with_object(root, selector("addSublayer:"), layer);
            }
            CGColorRelease(colour);
            let plain: extern "C" fn(*mut c_void, *const c_void) = std::mem::transmute(send);
            plain(window, selector("orderFrontRegardless"));
            fade(window, 1.0, super::FADE_IN);
            objc_autoreleasePoolPop(pool);
            window as usize
        }
    }

    /* The window's opacity carried to a value over a time, through its
    animator. Main thread. */
    pub fn fade(window: *mut c_void, value: f64, seconds: f64) {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let plain: extern "C" fn(*mut c_void, *const c_void) = unsafe { std::mem::transmute(send) };
        let with_float: extern "C" fn(*mut c_void, *const c_void, f64) =
            unsafe { std::mem::transmute(send) };
        let context_class = class("NSAnimationContext");
        plain(context_class, selector("beginGrouping"));
        let context = object(context_class, selector("currentContext"));
        with_float(context, selector("setDuration:"), seconds);
        let animator = object(window, selector("animator"));
        with_float(animator, selector("setAlphaValue:"), value);
        plain(context_class, selector("endGrouping"));
    }

    /* Taken off the screen and let go. Main thread. */
    pub fn close(window: *mut c_void) {
        let send = objc_msgSend as *const ();
        let plain: extern "C" fn(*mut c_void, *const c_void) = unsafe { std::mem::transmute(send) };
        plain(window, selector("orderOut:"));
        plain(window, selector("close"));
        plain(window, selector("release"));
    }
}

/* The boxes lit up, faded out again after a moment. Returns at once; the
window's work is done on the main thread. */
#[cfg(target_os = "macos")]
pub fn show(app: &tauri::AppHandle, marks: Vec<Mark>) {
    use std::ffi::c_void;
    use std::time::Duration;

    let Some((frame, boxes)) = layout(&marks, native::main_height()) else {
        return;
    };
    let (made, window) = std::sync::mpsc::channel();
    let _ = app.run_on_main_thread(move || {
        let _ = made.send(native::open(frame, &boxes));
    });
    let app = app.clone();
    std::thread::spawn(move || {
        let Ok(window) = window.recv() else {
            return;
        };
        if window == 0 {
            return;
        }
        std::thread::sleep(Duration::from_millis(STAY_MS));
        let _ = app.run_on_main_thread(move || {
            native::fade(window as *mut c_void, 0.0, FADE_OUT);
        });
        std::thread::sleep(Duration::from_secs_f64(FADE_OUT + 0.1));
        let _ = app.run_on_main_thread(move || native::close(window as *mut c_void));
    });
}

/* The window's place and its pixels, for a system that counts from the top
left in the screen's pixels: a frame around the boxes with their margins,
and every pixel of it, blue in the boxes with their corners rounded and
clear around them, premultiplied the way a layered window wants them
(BGRA, one u32 each). */
pub fn paint(marks: &[Mark], scale: f64) -> Option<((i32, i32, i32, i32), Vec<u32>)> {
    let boxes: Vec<(f64, f64, f64, f64)> = marks
        .iter()
        .filter(|mark| mark.width > 0.0 && mark.height > 0.0)
        .map(|mark| {
            (
                mark.x - MARGIN_X * scale,
                mark.y - MARGIN_Y * scale,
                mark.x + mark.width + MARGIN_X * scale,
                mark.y + mark.height + MARGIN_Y * scale,
            )
        })
        .collect();
    let left = boxes.iter().map(|b| b.0).reduce(f64::min)?.floor();
    let top = boxes.iter().map(|b| b.1).reduce(f64::min)?.floor();
    let right = boxes.iter().map(|b| b.2).reduce(f64::max)?.ceil();
    let bottom = boxes.iter().map(|b| b.3).reduce(f64::max)?.ceil();
    let (width, height) = ((right - left) as i32, (bottom - top) as i32);
    if width <= 0 || height <= 0 || width as i64 * height as i64 > 64_000_000 {
        return None;
    }
    let alpha = OPACITY;
    let channel = |value: f64| ((value * alpha * 255.0).round() as u32).min(255);
    let blue = (((alpha * 255.0).round() as u32) << 24)
        | (channel(COLOUR.0) << 16)
        | (channel(COLOUR.1) << 8)
        | channel(COLOUR.2);
    let radius = CORNER * scale;
    let mut pixels = vec![0u32; (width * height) as usize];
    for (x0, y0, x1, y1) in boxes {
        let (x0, y0, x1, y1) = (x0 - left, y0 - top, x1 - left, y1 - top);
        let r = radius.min((x1 - x0) / 2.0).min((y1 - y0) / 2.0);
        for y in (y0.floor().max(0.0) as i32)..(y1.ceil().min(height as f64) as i32) {
            for x in (x0.floor().max(0.0) as i32)..(x1.ceil().min(width as f64) as i32) {
                let (px, py) = (x as f64 + 0.5, y as f64 + 0.5);
                if px < x0 || px > x1 || py < y0 || py > y1 {
                    continue;
                }
                /* In a corner, only within the radius of its centre. */
                let cx = px.clamp(x0 + r, x1 - r);
                let cy = py.clamp(y0 + r, y1 - r);
                if (px - cx).powi(2) + (py - cy).powi(2) > r * r {
                    continue;
                }
                pixels[(y * width + x) as usize] = blue;
            }
        }
    }
    Some(((left as i32, top as i32, width, height), pixels))
}

#[cfg(target_os = "windows")]
pub fn show(_app: &tauri::AppHandle, marks: Vec<Mark>) {
    std::thread::spawn(move || layered::show(&marks));
}

/* A layered window: no border, never focused, every click passing through,
out of the taskbar and the task switcher. Shown without being activated,
it stands over the program read from and under the reading window, which
comes forward after it. Made, faded and destroyed on a thread of its own,
which pumps its messages meanwhile. */
#[cfg(target_os = "windows")]
mod layered {
    use super::Mark;
    use std::time::{Duration, Instant};
    use windows::core::w;
    use windows::Win32::Foundation::{COLORREF, HWND, LPARAM, LRESULT, POINT, SIZE, WPARAM};
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDC, ReleaseDC,
        SelectObject, AC_SRC_ALPHA, AC_SRC_OVER, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
        BLENDFUNCTION, DIB_RGB_COLORS,
    };
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::UI::HiDpi::GetDpiForSystem;
    use windows::Win32::UI::WindowsAndMessaging::{
        CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW, PeekMessageW,
        RegisterClassW, ShowWindow, TranslateMessage, UpdateLayeredWindow, MSG, PM_REMOVE,
        SW_SHOWNOACTIVATE, ULW_ALPHA, WNDCLASSW, WS_EX_LAYERED, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
        WS_EX_TRANSPARENT, WS_POPUP,
    };

    unsafe extern "system" fn procedure(
        window: HWND,
        message: u32,
        w: WPARAM,
        l: LPARAM,
    ) -> LRESULT {
        DefWindowProcW(window, message, w, l)
    }

    fn pump() {
        let mut message = MSG::default();
        unsafe {
            while PeekMessageW(&mut message, None, 0, 0, PM_REMOVE).as_bool() {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }
    }

    /* The opacity carried from one value to another over a time, the
    window's messages pumped between the steps. */
    fn fade(set: &dyn Fn(u8), from: f64, to: f64, seconds: f64) {
        let start = Instant::now();
        loop {
            let done = (start.elapsed().as_secs_f64() / seconds).min(1.0);
            set(((from + (to - from) * done) * 255.0).round() as u8);
            pump();
            if done >= 1.0 {
                return;
            }
            std::thread::sleep(Duration::from_millis(15));
        }
    }

    fn wait(time: Duration) {
        let end = Instant::now() + time;
        while Instant::now() < end {
            pump();
            std::thread::sleep(Duration::from_millis(30));
        }
    }

    pub fn show(marks: &[Mark]) {
        let scale = unsafe { GetDpiForSystem() } as f64 / 96.0;
        let Some(((x, y, width, height), pixels)) = super::paint(marks, scale) else {
            return;
        };
        unsafe {
            let Ok(module) = GetModuleHandleW(None) else {
                return;
            };
            let class = w!("TriglosaHighlight");
            /* Registered once; a second registration fails and is harmless. */
            RegisterClassW(&WNDCLASSW {
                lpfnWndProc: Some(procedure),
                hInstance: module.into(),
                lpszClassName: class,
                ..Default::default()
            });
            let Ok(window) = CreateWindowExW(
                WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
                class,
                w!(""),
                WS_POPUP,
                x,
                y,
                width,
                height,
                None,
                None,
                Some(module.into()),
                None,
            ) else {
                return;
            };
            let screen = GetDC(None);
            let memory = CreateCompatibleDC(Some(screen));
            let info = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: width,
                    biHeight: -height,
                    biPlanes: 1,
                    biBitCount: 32,
                    biCompression: BI_RGB.0,
                    ..Default::default()
                },
                ..Default::default()
            };
            let mut bits: *mut std::ffi::c_void = std::ptr::null_mut();
            let Ok(bitmap) =
                CreateDIBSection(Some(memory), &info, DIB_RGB_COLORS, &mut bits, None, 0)
            else {
                let _ = DeleteDC(memory);
                ReleaseDC(None, screen);
                let _ = DestroyWindow(window);
                return;
            };
            std::ptr::copy_nonoverlapping(pixels.as_ptr(), bits as *mut u32, pixels.len());
            let old = SelectObject(memory, bitmap.into());
            let set = |opacity: u8| {
                let blend = BLENDFUNCTION {
                    BlendOp: AC_SRC_OVER as u8,
                    BlendFlags: 0,
                    SourceConstantAlpha: opacity,
                    AlphaFormat: AC_SRC_ALPHA as u8,
                };
                let _ = UpdateLayeredWindow(
                    window,
                    Some(screen),
                    Some(&POINT { x, y }),
                    Some(&SIZE {
                        cx: width,
                        cy: height,
                    }),
                    Some(memory),
                    Some(&POINT { x: 0, y: 0 }),
                    COLORREF(0),
                    Some(&blend),
                    ULW_ALPHA,
                );
            };
            set(0);
            let _ = ShowWindow(window, SW_SHOWNOACTIVATE);
            fade(&set, 0.0, 1.0, super::FADE_IN);
            wait(Duration::from_millis(super::STAY_MS));
            fade(&set, 1.0, 0.0, super::FADE_OUT);
            let _ = DestroyWindow(window);
            SelectObject(memory, old);
            let _ = DeleteObject(bitmap.into());
            let _ = DeleteDC(memory);
            ReleaseDC(None, screen);
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn show(_app: &tauri::AppHandle, _marks: Vec<Mark>) {}

#[cfg(test)]
mod tests {
    use super::*;

    fn mark(x: f64, y: f64, width: f64, height: f64) -> Mark {
        Mark {
            x,
            y,
            width,
            height,
        }
    }

    /* A word 20 pt from the top of a 1000 pt display stands, counted from
    the bottom, at 1000 − 20 − its height; the margin goes round it. */
    #[test]
    fn a_word_is_turned_the_way_appkit_counts() {
        let (frame, boxes) = layout(&[mark(100.0, 20.0, 50.0, 16.0)], 1000.0).unwrap();
        assert_eq!(
            frame,
            Rect {
                x: 98.0,
                y: 963.0,
                width: 54.0,
                height: 18.0
            }
        );
        assert_eq!(
            boxes,
            [Rect {
                x: 0.0,
                y: 0.0,
                width: 54.0,
                height: 18.0
            }]
        );
    }

    /* Two lines of a selection: one window around both, the first line on
    top, each box placed inside the window. */
    #[test]
    fn the_lines_of_a_selection_share_one_window() {
        let marks = [
            mark(300.0, 100.0, 200.0, 20.0),
            mark(100.0, 120.0, 150.0, 20.0),
        ];
        let (frame, boxes) = layout(&marks, 800.0).unwrap();
        assert_eq!(
            frame,
            Rect {
                x: 98.0,
                y: 659.0,
                width: 404.0,
                height: 42.0
            }
        );
        assert_eq!(boxes[0].y, 20.0);
        assert_eq!(boxes[1].y, 0.0);
        assert_eq!(boxes[0].x, 200.0);
        assert_eq!(boxes[1].x, 0.0);
    }

    /* In the screen's pixels from the top left: the frame is the boxes'
    with their margins, blue inside a box, clear in its rounded corner and
    between two lines. */
    #[test]
    fn the_boxes_are_painted_into_their_frame() {
        let marks = [mark(100.0, 50.0, 40.0, 20.0), mark(100.0, 80.0, 30.0, 20.0)];
        let ((x, y, width, height), pixels) = paint(&marks, 1.0).unwrap();
        assert_eq!((x, y, width, height), (98, 49, 44, 52));
        let at = |px: i32, py: i32| pixels[(py * width + px) as usize];
        let blue = at(20, 10);
        assert_eq!(blue >> 24, 102, "40 % opaque");
        assert_eq!(
            (blue >> 16) & 0xff,
            (0x18 as f64 * 0.4).round() as u32,
            "premultiplied"
        );
        assert_eq!(at(0, 0), 0, "the corner is rounded off");
        assert_eq!(at(20, 25), 0, "clear between the lines");
        assert_eq!(at(40, 45), 0, "clear beside the shorter line");
        assert_eq!(at(20, 45), blue);
        assert!(paint(&[], 1.0).is_none());
    }

    #[test]
    fn nothing_to_light_is_no_window() {
        assert!(layout(&[], 800.0).is_none());
        assert!(layout(&[mark(10.0, 10.0, 0.0, 0.0)], 800.0).is_none());
    }
}

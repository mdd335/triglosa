/* Text read off a piece of the screen: the reader frames a piece, and the
piece is handed to the recogniser.

On the Mac the system's own crosshair frames it — `screencapture -i`, the
one ⌘⇧4 opens — and writes the piece to a file, which Apple's recognition
reads in the helper (translator.swift). The tool runs as the app's child,
so the Screen Recording permission it needs is the app's own: without it
the tool fails without asking anything, so the permission is asked first
and the window says what is missing. A frame of our own needed the same
permission and more of our own code.

On Windows the screens are photographed with GDI, which any program in the
reader's session may do, before anything of ours appears, so the frame is
drawn on what was there. A window of our own over each screen shows its
photograph and lets the reader draw the frame; the coordinates it sends
back are the photograph's own pixels, so no screen geometry needs to agree
between here, the window and the system. ocr.rs reads the piece. */

use crate::ocr;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

/// One screen's photograph, while the reader frames: its pixels, four
/// bytes each.
#[cfg_attr(target_os = "macos", allow(dead_code))]
struct Photograph {
    label: String,
    pixels: (usize, usize, Vec<u8>),
}

/// What the reader framed, until the window has had it read.
#[cfg_attr(target_os = "macos", allow(dead_code))]
enum Framed {
    /// The Mac: the framed piece's file and its size.
    File(PathBuf, [u32; 4]),
    /// Windows: the framed piece itself.
    Picture(ocr::Picture),
}

static PHOTOGRAPHS: Mutex<Vec<Photograph>> = Mutex::new(Vec::new());
static FRAMED: Mutex<Option<Framed>> = Mutex::new(None);
/// Whether the reading window stood on the screen when the frame was asked
/// for: it is put away for the photograph and back if nothing is framed.
static WAS_SHOWN: Mutex<bool> = Mutex::new(false);
/// What the framed text is for, from the press until the window has it.
static PURPOSE: Mutex<Purpose> = Mutex::new(Purpose::Read);

/// What a piece of the screen is framed for: translated in the reading
/// window, copied with nothing shown, or put on a new card.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Purpose {
    Read,
    Copy,
    Card,
}

/// Told to the reading window with the framed piece: what it is for, and
/// whether the window stood on the screen before — it is put away for the
/// frame, and comes back after a copy or a card only if it stood.
#[derive(Clone, Serialize)]
struct Chosen {
    purpose: Purpose,
    shown: bool,
}

fn chosen(app: &AppHandle) {
    let payload = Chosen {
        purpose: *PURPOSE.lock().unwrap(),
        shown: *WAS_SHOWN.lock().unwrap(),
    };
    let _ = app.emit_to("main", "screen-chosen", payload);
}
/// While a frame is being drawn.
static PICKING: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

const LABEL: &str = "screen-";

fn is_overlay(label: &str) -> bool {
    label.starts_with(LABEL)
}

fn folder(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_cache_dir().ok()?.join("screen");
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

/// Whether the screen may be photographed: the Mac asks the permission,
/// Windows nothing.
pub fn permitted() -> bool {
    #[cfg(target_os = "macos")]
    {
        unsafe { mac::CGPreflightScreenCaptureAccess() }
    }
    #[cfg(not(target_os = "macos"))]
    true
}

#[tauri::command]
pub fn screen_permitted() -> bool {
    permitted()
}

/// The system's own question about the permission. macOS asks it once;
/// later it answers at once, and the way is through System Settings.
#[tauri::command]
pub fn request_screen_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        unsafe { mac::CGRequestScreenCaptureAccess() }
    }
    #[cfg(not(target_os = "macos"))]
    true
}

/// System Settings at the list the permission is given in.
#[tauri::command]
pub fn open_screen_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let status = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .status()
            .map_err(|error| error.to_string())?;
        if status.success() {
            return Ok(());
        }
        Err("System Settings did not open.".into())
    }
    #[cfg(not(target_os = "macos"))]
    Ok(())
}

/// From the shortcut or the menu: a piece of the screen framed. A second
/// press while the frame is being drawn does nothing. From the menu it
/// waits for the menu to be gone, or the menu is on the screen framed.
pub fn start(app: &AppHandle, from_menu: bool, purpose: Purpose) {
    if app.webview_windows().keys().any(|label| is_overlay(label))
        || PICKING.swap(true, std::sync::atomic::Ordering::SeqCst)
    {
        return;
    }
    *PURPOSE.lock().unwrap() = purpose;
    let app = app.clone();
    std::thread::spawn(move || {
        if from_menu {
            std::thread::sleep(std::time::Duration::from_millis(250));
        }
        if !permitted() {
            #[cfg(target_os = "macos")]
            unsafe {
                /* The system's own question, once; later calls answer at
                once and the window points the way instead. */
                mac::CGRequestScreenCaptureAccess();
            }
            PICKING.store(false, std::sync::atomic::Ordering::SeqCst);
            fail(&app, "permission");
            return;
        }
        let shown = app
            .get_webview_window("main")
            .map(|window| window.is_visible().unwrap_or(false))
            .unwrap_or(false);
        *WAS_SHOWN.lock().unwrap() = shown;
        if shown {
            if let Some(window) = app.get_webview_window("main") {
                crate::desktop::put_away(&window);
                /* Gone from the screen before it is photographed. */
                std::thread::sleep(std::time::Duration::from_millis(250));
            }
        }
        #[cfg(target_os = "macos")]
        pick(&app);
        #[cfg(not(target_os = "macos"))]
        match photograph(&app) {
            Ok(photographs) if !photographs.is_empty() => {
                if let Err(error) = open_frames(&app, photographs) {
                    eprintln!("the frames did not open: {error}");
                    close_frames(&app);
                    fail(&app, "capture");
                }
            }
            Ok(_) => fail(&app, "capture"),
            Err(error) => {
                eprintln!("the screen was not photographed: {error}");
                fail(&app, "capture");
            }
        }
        PICKING.store(false, std::sync::atomic::Ordering::SeqCst);
    });
}

/// The Mac: the system's crosshair, and the piece it wrote. Escape writes
/// nothing, and the reading window comes back as it stood; a piece the
/// tool could not take is said in the window.
#[cfg(target_os = "macos")]
fn pick(app: &AppHandle) {
    let Some(dir) = folder(app) else {
        return fail(app, "capture");
    };
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let _ = std::fs::remove_file(entry.path());
        }
    }
    let file = dir.join("framed.png");
    let out = std::process::Command::new("/usr/sbin/screencapture")
        .args(["-i", "-x", "-t", "png"])
        .arg(&file)
        .output();
    let size = std::fs::read(&file).ok().and_then(|bytes| png_size(&bytes));
    match (out, size) {
        (_, Some((width, height))) => {
            *FRAMED.lock().unwrap() = Some(Framed::File(file, [0, 0, width, height]));
            chosen(app);
        }
        (Ok(out), None) if out.status.success() => cancelled(app),
        (out, None) => {
            eprintln!("the screen was not photographed: {out:?}");
            fail(app, "capture");
        }
    }
}

/// The piece of the screen read around the pointer: where its top left
/// stands on the screen and how much of the screen one of its pixels
/// covers — points on the Mac, the screen's pixels on Windows, as the
/// highlight counts — so what was read can be lit up where it stands.
static AROUND: Mutex<Option<(f64, f64, f64)>> = Mutex::new(None);

/// How much of the screen around the pointer is read, in points: a word's
/// line and those beside it, or enough lines for a sentence around it.
const AROUND_WORD: (f64, f64) = (640.0, 140.0);
const AROUND_SENTENCE: (f64, f64) = (1500.0, 480.0);

/// The piece around a point, kept inside the display it is on — the
/// system cuts off what lies beyond, and the piece would then not start
/// where it is reckoned to. Near an edge the point is off its middle.
/// `display` is the display's left, top, width and height.
fn within(
    (px, py): (f64, f64),
    (wide, high): (f64, f64),
    display: Option<(f64, f64, f64, f64)>,
) -> (f64, f64, f64, f64) {
    let (x, y) = (px - wide / 2.0, py - high / 2.0);
    let Some((left, top, width, height)) = display else {
        return (x, y, wide, high);
    };
    let (wide, high) = (wide.min(width), high.min(height));
    (
        x.clamp(left, left + width - wide),
        y.clamp(top, top + height - high),
        wide,
        high,
    )
}

/// Where a program hands over no text under the pointer: a piece of the
/// screen around it photographed, without anything shown, and the reading
/// window told where in it the pointer stands, so it can find the word or
/// the sentence there in what the recogniser reads (`pointer-screen`). A
/// shortcut is never left unanswered: where there is no piece the window
/// is told why (`pointer-failed`) — `permission` where the Mac may not
/// photograph the screen, `screen` where the photograph was not taken.
pub fn under_pointer(app: &AppHandle, sentence: bool) {
    let piece = if permitted() {
        around_pointer(app, sentence).ok_or("screen")
    } else {
        Err("permission")
    };
    match piece {
        Ok((at, size)) => {
            let _ = app.emit_to(
                "main",
                "pointer-screen",
                PointerScreen { sentence, at, size },
            );
        }
        Err(reason) => {
            let _ = app.emit_to("main", "pointer-failed", reason);
        }
    }
}

/// The piece around the pointer, photographed: where the pointer stands in
/// it and how large it is, in its pixels. None where it could not be taken.
fn around_pointer(app: &AppHandle, sentence: bool) -> Option<([f64; 2], [f64; 2])> {
    let (wide, high) = if sentence {
        AROUND_SENTENCE
    } else {
        AROUND_WORD
    };
    #[cfg(target_os = "macos")]
    let piece = {
        let Some((px, py)) = mac::pointer() else {
            return None;
        };
        let (x, y, wide, high) = within((px, py), (wide, high), mac::display_at(px, py));
        let Some(dir) = folder(app) else {
            return None;
        };
        let file = dir.join("around.png");
        let _ = std::fs::remove_file(&file);
        let rect = format!("{},{},{},{}", x.round(), y.round(), wide, high);
        let taken = std::process::Command::new("/usr/sbin/screencapture")
            .args(["-x", "-t", "png", "-R", &rect])
            .arg(&file)
            .status()
            .is_ok_and(|status| status.success());
        let Some((width, height)) = std::fs::read(&file).ok().and_then(|bytes| png_size(&bytes))
        else {
            return None;
        };
        if !taken {
            return None;
        }
        let per_pixel = wide / width as f64;
        *AROUND.lock().unwrap() = Some((x.round(), y.round(), per_pixel));
        *FRAMED.lock().unwrap() = Some(Framed::File(file, [0, 0, width, height]));
        Some((
            [(px - x.round()) / per_pixel, (py - y.round()) / per_pixel],
            [width as f64, height as f64],
        ))
    };
    #[cfg(target_os = "windows")]
    let piece = {
        let Some((px, py)) = windows_screen::pointer() else {
            return None;
        };
        let scale = app
            .monitor_from_point(px as f64, py as f64)
            .ok()
            .flatten()
            .map_or(1.0, |monitor| monitor.scale_factor());
        let (w, h) = ((wide * scale) as i32, (high * scale) as i32);
        let (x, y) = (px - w / 2, py - h / 2);
        let Ok((width, height, bgra)) = windows_screen::copy(x, y, w, h) else {
            return None;
        };
        *AROUND.lock().unwrap() = Some((x as f64, y as f64, 1.0));
        *FRAMED.lock().unwrap() = Some(Framed::Picture(ocr::Picture::from_bgra(
            width, height, &bgra,
        )));
        Some((
            [(px - x) as f64, (py - y) as f64],
            [width as f64, height as f64],
        ))
    };
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let piece: Option<([f64; 2], [f64; 2])> = {
        let _ = (app, wide, high);
        None
    };
    piece
}

/// The screen read around the pointer although the program handed over
/// something: the window found only a word where a sentence was asked for.
#[tauri::command]
pub fn screen_under_pointer(app: AppHandle, sentence: bool) {
    std::thread::spawn(move || under_pointer(&app, sentence));
}

/// Told to the reading window: what the shortcut asked for, where the
/// pointer stands in the piece read around it and how large the piece is,
/// in its pixels.
#[derive(Clone, Serialize)]
struct PointerScreen {
    sentence: bool,
    at: [f64; 2],
    size: [f64; 2],
}

/// What was read around the pointer lit up where it stands: boxes in the
/// piece's pixels, left, top, right, bottom, one a line.
#[tauri::command]
pub fn light_screen(app: AppHandle, boxes: Vec<[f64; 4]>) {
    let Some((x, y, per_pixel)) = *AROUND.lock().unwrap() else {
        return;
    };
    let marks = boxes
        .iter()
        .map(|[left, top, right, bottom]| crate::capture::Mark {
            x: x + left * per_pixel,
            y: y + top * per_pixel,
            width: (right - left) * per_pixel,
            height: (bottom - top) * per_pixel,
        })
        .collect();
    std::thread::spawn(move || crate::highlight::show(&app, marks));
}

/// Whether a file's name says it is a picture the recognisers read.
pub fn is_image(path: &str) -> bool {
    const KINDS: [&str; 10] = [
        "png", "jpg", "jpeg", "gif", "bmp", "tif", "tiff", "webp", "heic", "heif",
    ];
    std::path::Path::new(path.trim())
        .extension()
        .and_then(|kind| kind.to_str())
        .is_some_and(|kind| KINDS.contains(&kind.to_lowercase().as_str()))
}

/// An image file to read the text of — selected in the Finder or Explorer
/// and taken by the shortcut, or dropped on the window — kept as a framed
/// piece for screen_file or screen_text. The Mac's helper reads the whole
/// file where the frame is empty; Windows decodes it here.
#[tauri::command]
pub async fn screen_image(path: String) -> Result<(), String> {
    if !is_image(&path) || !std::path::Path::new(&path).is_file() {
        return Err("no picture".into());
    }
    #[cfg(target_os = "windows")]
    let framed = {
        let picture = tauri::async_runtime::spawn_blocking(move || windows_screen::decode(&path))
            .await
            .map_err(|error| error.to_string())??;
        Framed::Picture(picture)
    };
    #[cfg(not(target_os = "windows"))]
    let framed = Framed::File(PathBuf::from(path), [0, 0, 0, 0]);
    *FRAMED.lock().unwrap() = Some(framed);
    Ok(())
}

/// A PNG file's width and height, from its header.
#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
fn png_size(bytes: &[u8]) -> Option<(u32, u32)> {
    if bytes.len() < 24 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" || &bytes[12..16] != b"IHDR" {
        return None;
    }
    let width = u32::from_be_bytes(bytes[16..20].try_into().ok()?);
    let height = u32::from_be_bytes(bytes[20..24].try_into().ok()?);
    (width > 0 && height > 0).then_some((width, height))
}

/// What went wrong before anything was framed, told to the reading window
/// with what the frame was for: a frame for copying or for a card says it
/// in a note of its own (desktop.rs, show_note), and only one for reading
/// brings the reading window forward to say it.
#[derive(Clone, Serialize)]
struct Failed<'a> {
    reason: &'a str,
    purpose: Purpose,
}

fn fail(app: &AppHandle, reason: &str) {
    let purpose = *PURPOSE.lock().unwrap();
    let _ = app.emit_to("main", "screen-failed", Failed { reason, purpose });
    if purpose != Purpose::Read {
        return;
    }
    let hidden = app
        .get_webview_window("main")
        .map(|window| !window.is_visible().unwrap_or(true))
        .unwrap_or(false);
    if hidden {
        crate::desktop::show_window(app);
    }
}

/// One screen's photograph with where the screen stands in physical pixels.
#[cfg_attr(target_os = "macos", allow(dead_code))]
type Shot = (Photograph, (i32, i32), (u32, u32));

/// Every screen, photographed whole.
#[cfg_attr(target_os = "macos", allow(dead_code))]
fn photograph(app: &AppHandle) -> Result<Vec<Shot>, String> {
    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;
        Err("no way to photograph the screen".into())
    }
    #[cfg(target_os = "windows")]
    {
        let monitors = app
            .available_monitors()
            .map_err(|error| error.to_string())?;
        let mut out = Vec::new();
        for (index, monitor) in monitors.iter().enumerate() {
            let (position, size) = (monitor.position(), monitor.size());
            let pixels = windows_screen::copy(
                position.x,
                position.y,
                size.width as i32,
                size.height as i32,
            )?;
            out.push((
                Photograph {
                    label: format!("{LABEL}{index}"),
                    pixels,
                },
                (position.x, position.y),
                (size.width, size.height),
            ));
        }
        Ok(out)
    }
}

#[cfg_attr(target_os = "macos", allow(dead_code))]
fn open_frames(app: &AppHandle, photographs: Vec<Shot>) -> Result<(), String> {
    let mut kept = Vec::new();
    for (photograph, (x, y), (width, height)) in photographs {
        let window = tauri::WebviewWindowBuilder::new(
            app,
            &photograph.label,
            tauri::WebviewUrl::App("screen.html".into()),
        )
        .title("Triglosa")
        .decorations(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .shadow(false)
        .visible(false)
        .build()
        .map_err(|error| error.to_string())?;
        let _ = window.set_size(tauri::PhysicalSize::new(width, height));
        let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
        kept.push(photograph);
    }
    *PHOTOGRAPHS.lock().unwrap() = kept;
    Ok(())
}

/// The frame windows gone — on the main thread once the call that asked
/// has returned, never from inside the page's own call.
fn close_frames(app: &AppHandle) {
    PHOTOGRAPHS.lock().unwrap().clear();
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        for (label, window) in handle.webview_windows() {
            if is_overlay(&label) {
                let _ = window.hide();
                let _ = window.destroy();
            }
        }
    });
}

/// The photograph of the screen a frame window stands on, as a BMP file,
/// which the page shows as it comes.
#[tauri::command]
pub fn screen_picture(window: WebviewWindow) -> Result<tauri::ipc::Response, String> {
    let photographs = PHOTOGRAPHS.lock().unwrap();
    let photograph = photographs
        .iter()
        .find(|one| one.label == window.label())
        .ok_or("no photograph")?;
    let (width, height, bgra) = &photograph.pixels;
    Ok(tauri::ipc::Response::new(bmp(*width, *height, bgra)))
}

/// A frame window has drawn its photograph: shown, and the keys given to it.
#[tauri::command]
pub fn screen_ready(window: WebviewWindow) {
    let _ = window.show();
    let target = window.clone();
    let _ = window.run_on_main_thread(move || crate::overlay::bring_to_front(&target));
}

/// The reader framed a piece of one screen — in its photograph's pixels:
/// left, top, width, height. The frames go, and the reading window is told.
#[tauri::command]
pub async fn screen_chosen(app: AppHandle, window: WebviewWindow, rect: [f64; 4]) {
    let framed = {
        let photographs = PHOTOGRAPHS.lock().unwrap();
        photographs
            .iter()
            .find(|one| one.label == window.label())
            .and_then(|photograph| frame(photograph, rect))
    };
    close_frames(&app);
    match framed {
        Some(framed) => {
            *FRAMED.lock().unwrap() = Some(framed);
            chosen(&app);
        }
        None => cancelled(&app),
    }
}

/// Escape, or a click without a frame: nothing read, and the reading window
/// back where it stood.
#[tauri::command]
pub async fn screen_cancel(app: AppHandle) {
    close_frames(&app);
    cancelled(&app);
}

fn cancelled(app: &AppHandle) {
    if *WAS_SHOWN.lock().unwrap() {
        crate::desktop::show_window(app);
    }
}

fn frame(photograph: &Photograph, rect: [f64; 4]) -> Option<Framed> {
    let [x, y, w, h] = rect.map(|value| value.max(0.0).round() as u32);
    if w < 4 || h < 4 {
        return None;
    }
    let (width, height, bgra) = &photograph.pixels;
    let (width, height) = (*width as u32, *height as u32);
    let (x, y) = (x.min(width - 1), y.min(height - 1));
    let (w, h) = (w.min(width - x), h.min(height - y));
    let mut piece = Vec::with_capacity((w * h * 4) as usize);
    for row in y..y + h {
        let from = ((row * width + x) * 4) as usize;
        piece.extend_from_slice(&bgra[from..from + (w * 4) as usize]);
    }
    Some(Framed::Picture(ocr::Picture::from_bgra(
        w as usize, h as usize, &piece,
    )))
}

/// Where the Mac's photograph is and the frame in it, for the helper.
#[derive(Serialize)]
pub struct FramedFile {
    path: String,
    rect: [u32; 4],
}

#[tauri::command]
pub fn screen_file() -> Option<FramedFile> {
    match FRAMED.lock().unwrap().as_ref()? {
        Framed::File(path, rect) => Some(FramedFile {
            path: path.to_string_lossy().into_owned(),
            rect: *rect,
        }),
        Framed::Picture(_) => None,
    }
}

/// The framed piece read with the scripts named ("latin", "cyrillic",
/// "arabic", "chinese"). "absent" where the models are missing.
#[tauri::command]
pub async fn screen_text(app: AppHandle, scripts: Vec<String>) -> Result<Vec<ocr::Line>, String> {
    let picture = match FRAMED.lock().unwrap().take() {
        Some(Framed::Picture(picture)) => picture,
        _ => return Err("nothing framed".into()),
    };
    let dir = app
        .path()
        .resource_dir()
        .ok()
        .and_then(|dir| ocr::folder_with_models(dir.join("ocr")))
        .ok_or("absent")?;
    let scripts: Vec<ocr::Script> = scripts
        .iter()
        .filter_map(|name| ocr::Script::named(name))
        .collect();
    if scripts.is_empty() {
        return Err("no script".into());
    }
    tauri::async_runtime::spawn_blocking(move || ocr::read(&dir, &picture, &scripts))
        .await
        .map_err(|error| error.to_string())?
}

/// A picture of four bytes a pixel, top row first, as a BMP file: what a
/// web page shows without anything decoding it first.
fn bmp(width: usize, height: usize, bgra: &[u8]) -> Vec<u8> {
    let size = 54 + bgra.len();
    let mut out = Vec::with_capacity(size);
    out.extend_from_slice(b"BM");
    out.extend_from_slice(&(size as u32).to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(&54u32.to_le_bytes());
    out.extend_from_slice(&40u32.to_le_bytes());
    out.extend_from_slice(&(width as i32).to_le_bytes());
    /* Negative: the rows run from the top. */
    out.extend_from_slice(&(-(height as i32)).to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&32u16.to_le_bytes());
    out.extend_from_slice(&[0u8; 24]);
    out.extend_from_slice(bgra);
    out
}

#[cfg(target_os = "macos")]
mod mac {
    use std::ffi::c_void;

    #[repr(C)]
    struct Point {
        x: f64,
        y: f64,
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        pub fn CGPreflightScreenCaptureAccess() -> bool;
        pub fn CGRequestScreenCaptureAccess() -> bool;
        fn CGEventCreate(source: *const c_void) -> *const c_void;
        fn CGEventGetLocation(event: *const c_void) -> Point;
        fn CGGetDisplaysWithPoint(
            point: Point,
            max: u32,
            displays: *mut u32,
            count: *mut u32,
        ) -> i32;
        fn CGDisplayBounds(display: u32) -> crate::highlight::Rect;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFRelease(object: *const c_void);
    }

    /// Where the pointer is, in points from the top left of the main
    /// display — as screencapture counts and the highlight draws.
    pub fn pointer() -> Option<(f64, f64)> {
        unsafe {
            let event = CGEventCreate(std::ptr::null());
            if event.is_null() {
                return None;
            }
            let point = CGEventGetLocation(event);
            CFRelease(event);
            Some((point.x, point.y))
        }
    }

    /// The left, top, width and height of the display a point is on, in
    /// the same points.
    pub fn display_at(x: f64, y: f64) -> Option<(f64, f64, f64, f64)> {
        let (mut display, mut count) = (0u32, 0u32);
        let found = unsafe { CGGetDisplaysWithPoint(Point { x, y }, 1, &mut display, &mut count) };
        if found != 0 || count == 0 {
            return None;
        }
        let bounds = unsafe { CGDisplayBounds(display) };
        Some((bounds.x, bounds.y, bounds.width, bounds.height))
    }
}

#[cfg(target_os = "windows")]
mod windows_screen {
    use windows::Win32::Graphics::Gdi::{
        BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC,
        GetDIBits, ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, CAPTUREBLT,
        DIB_RGB_COLORS, SRCCOPY,
    };

    /// Where the pointer is, in the screen's pixels.
    pub fn pointer() -> Option<(i32, i32)> {
        let mut point = windows::Win32::Foundation::POINT::default();
        unsafe { windows::Win32::UI::WindowsAndMessaging::GetCursorPos(&mut point) }.ok()?;
        Some((point.x, point.y))
    }

    /// An image file as a picture, through the Windows Imaging Component,
    /// which reads every format the system knows.
    pub fn decode(path: &str) -> Result<crate::ocr::Picture, String> {
        use windows::core::HSTRING;
        use windows::Win32::Foundation::GENERIC_READ;
        use windows::Win32::Graphics::Imaging::{
            CLSID_WICImagingFactory, GUID_WICPixelFormat32bppBGRA, IWICImagingFactory,
            WICConvertBitmapSource, WICDecodeMetadataCacheOnDemand,
        };
        use windows::Win32::System::Com::{
            CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
        };
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
            let factory: IWICImagingFactory =
                CoCreateInstance(&CLSID_WICImagingFactory, None, CLSCTX_INPROC_SERVER)
                    .map_err(|error| error.to_string())?;
            let decoder = factory
                .CreateDecoderFromFilename(
                    &HSTRING::from(path),
                    None,
                    GENERIC_READ,
                    WICDecodeMetadataCacheOnDemand,
                )
                .map_err(|error| error.to_string())?;
            let frame = decoder.GetFrame(0).map_err(|error| error.to_string())?;
            let bgra = WICConvertBitmapSource(&GUID_WICPixelFormat32bppBGRA, &frame)
                .map_err(|error| error.to_string())?;
            let (mut width, mut height) = (0u32, 0u32);
            bgra.GetSize(&mut width, &mut height)
                .map_err(|error| error.to_string())?;
            let mut pixels = vec![0u8; (width * height * 4) as usize];
            bgra.CopyPixels(std::ptr::null(), width * 4, &mut pixels)
                .map_err(|error| error.to_string())?;
            Ok(crate::ocr::Picture::from_bgra(
                width as usize,
                height as usize,
                &pixels,
            ))
        }
    }

    /// A piece of the desktop in physical pixels, four bytes a pixel in the
    /// order blue, green, red, nothing — top row first.
    pub fn copy(
        x: i32,
        y: i32,
        width: i32,
        height: i32,
    ) -> Result<(usize, usize, Vec<u8>), String> {
        unsafe {
            let screen = GetDC(None);
            if screen.is_invalid() {
                return Err("no screen to copy".into());
            }
            let memory = CreateCompatibleDC(Some(screen));
            let bitmap = CreateCompatibleBitmap(screen, width, height);
            let previous = SelectObject(memory, bitmap.into());
            let copied = BitBlt(
                memory,
                0,
                0,
                width,
                height,
                Some(screen),
                x,
                y,
                SRCCOPY | CAPTUREBLT,
            );
            let mut info = BITMAPINFO {
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
            let mut pixels = vec![0u8; (width * height * 4) as usize];
            let rows = GetDIBits(
                memory,
                bitmap,
                0,
                height as u32,
                Some(pixels.as_mut_ptr().cast()),
                &mut info,
                DIB_RGB_COLORS,
            );
            SelectObject(memory, previous);
            let _ = DeleteObject(bitmap.into());
            let _ = DeleteDC(memory);
            ReleaseDC(None, screen);
            copied.map_err(|error| error.to_string())?;
            if rows == 0 {
                return Err("the screen's pixels did not come".into());
            }
            Ok((width as usize, height as usize, pixels))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_piece_around_the_pointer_stays_on_its_display() {
        let display = Some((0.0, 0.0, 1440.0, 900.0));
        assert_eq!(
            within((700.0, 400.0), (640.0, 140.0), display),
            (380.0, 330.0, 640.0, 140.0),
            "in the middle, the pointer is the piece's middle"
        );
        assert_eq!(
            within((130.0, 30.0), (640.0, 140.0), display),
            (0.0, 0.0, 640.0, 140.0),
            "at the top left corner, moved in"
        );
        assert_eq!(
            within((1430.0, 890.0), (1100.0, 480.0), display),
            (340.0, 420.0, 1100.0, 480.0),
            "at the bottom right corner, moved in"
        );
        assert_eq!(
            within(
                (2000.0, 100.0),
                (640.0, 140.0),
                Some((1440.0, -200.0, 800.0, 600.0))
            ),
            (1600.0, 30.0, 640.0, 140.0),
            "a second display beside the first"
        );
        assert_eq!(
            within(
                (100.0, 100.0),
                (1100.0, 480.0),
                Some((0.0, 0.0, 800.0, 400.0))
            ),
            (0.0, 0.0, 800.0, 400.0),
            "a display smaller than the piece"
        );
        assert_eq!(
            within((100.0, 100.0), (640.0, 140.0), None),
            (-220.0, 30.0, 640.0, 140.0)
        );
    }

    #[test]
    fn a_bmp_says_its_size_and_runs_from_the_top() {
        let file = bmp(2, 1, &[1, 2, 3, 0, 4, 5, 6, 0]);
        assert_eq!(&file[..2], b"BM");
        assert_eq!(u32::from_le_bytes(file[2..6].try_into().unwrap()), 62);
        assert_eq!(i32::from_le_bytes(file[22..26].try_into().unwrap()), -1);
        assert_eq!(&file[54..], &[1, 2, 3, 0, 4, 5, 6, 0]);
    }

    #[test]
    fn a_frame_is_cut_out_of_the_pixels() {
        /* 6 by 5, each pixel's blue its number. */
        let bgra: Vec<u8> = (0..30u8).flat_map(|n| [n, 0, 0, 0]).collect();
        let photograph = Photograph {
            label: "screen-0".into(),
            pixels: (6, 5, bgra),
        };
        let Some(Framed::Picture(picture)) = frame(&photograph, [1.0, 1.0, 4.0, 4.0]) else {
            panic!("a picture was framed");
        };
        assert_eq!((picture.width, picture.height), (4, 4));
        let blues: Vec<u8> = picture.pixels.chunks(3).map(|p| p[0]).collect();
        assert_eq!(&blues[..4], &[7, 8, 9, 10]);
        assert_eq!(&blues[12..], &[25, 26, 27, 28]);
    }

    #[test]
    fn a_frame_too_small_is_none() {
        let photograph = Photograph {
            label: "screen-0".into(),
            pixels: (40, 40, vec![0; 40 * 40 * 4]),
        };
        assert!(frame(&photograph, [10.0, 10.0, 2.0, 30.0]).is_none());
        assert!(frame(&photograph, [10.0, 10.0, 20.0, 30.0]).is_some());
    }

    #[test]
    fn a_picture_is_told_by_its_name() {
        assert!(is_image("/Users/a/Bild 1.PNG"));
        assert!(is_image("C:\\Fotos\\menu.jpeg"));
        assert!(!is_image("/Users/a/notes.txt"));
        assert!(!is_image("Bild"));
    }

    #[test]
    fn a_png_says_its_size_in_its_header() {
        let mut header = b"\x89PNG\r\n\x1a\n\0\0\0\x0dIHDR".to_vec();
        header.extend_from_slice(&640u32.to_be_bytes());
        header.extend_from_slice(&120u32.to_be_bytes());
        assert_eq!(png_size(&header), Some((640, 120)));
        assert_eq!(png_size(b"not a picture at all, not at all"), None);
    }
}

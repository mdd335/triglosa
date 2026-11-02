/* The iPhone's shell: one page, the settings file, the key, the language
identifier and the connection to the AI model. Text comes in through the
page itself. */

use std::ffi::{c_char, c_void, CStr};

use tauri::Emitter;

use crate::{diagnostics, identify, keychain, model, settings, spelling};

#[link(name = "UIKit", kind = "framework")]
extern "C" {}

#[link(name = "objc")]
extern "C" {
    fn objc_getClass(name: *const c_char) -> *mut c_void;
    fn sel_registerName(name: *const c_char) -> *const c_void;
    fn objc_msgSend();
    fn objc_autoreleasePoolPush() -> *mut c_void;
    fn objc_autoreleasePoolPop(pool: *mut c_void);
}

/* What was copied last, as text; empty where it is something else or the
reader refused. Asked on the paste button only: iOS asks the reader whether
the app may, until they allow it for good in the system's settings. */
#[tauri::command]
fn read_pasteboard() -> String {
    unsafe {
        /* objc_msgSend is declared without a signature and cast to the one
        each call has. */
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            std::mem::transmute(send);
        let characters: extern "C" fn(*mut c_void, *const c_void) -> *const c_char =
            std::mem::transmute(send);
        let class = objc_getClass(c"UIPasteboard".as_ptr());
        if class.is_null() {
            return String::new();
        }
        let board = object(class, sel_registerName(c"generalPasteboard".as_ptr()));
        if board.is_null() {
            return String::new();
        }
        let text = object(board, sel_registerName(c"string".as_ptr()));
        if text.is_null() {
            return String::new();
        }
        let bytes = characters(text, sel_registerName(c"UTF8String".as_ptr()));
        if bytes.is_null() {
            return String::new();
        }
        CStr::from_ptr(bytes).to_string_lossy().into_owned()
    }
}

/* An address handed to the system, which opens the app it belongs to.
Answers whether an app took it. */
fn open_address(url: &str, only_if_taken: bool) -> Result<bool, String> {
    let address = std::ffi::CString::new(url).map_err(|error| error.to_string())?;
    unsafe {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            std::mem::transmute(send);
        let from_text: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            std::mem::transmute(send);
        let from_object: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            std::mem::transmute(send);
        let asks: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> bool =
            std::mem::transmute(send);
        let open: extern "C" fn(*mut c_void, *const c_void, *mut c_void, *mut c_void, *mut c_void) =
            std::mem::transmute(send);
        let text = from_text(
            objc_getClass(c"NSString".as_ptr()),
            sel_registerName(c"stringWithUTF8String:".as_ptr()),
            address.as_ptr(),
        );
        let link = from_object(
            objc_getClass(c"NSURL".as_ptr()),
            sel_registerName(c"URLWithString:".as_ptr()),
            text,
        );
        if link.is_null() {
            return Err("not an address".into());
        }
        let app = object(
            objc_getClass(c"UIApplication".as_ptr()),
            sel_registerName(c"sharedApplication".as_ptr()),
        );
        /* Asked only about a kind of address Info.ios.plist names. */
        if only_if_taken && !asks(app, sel_registerName(c"canOpenURL:".as_ptr()), link) {
            return Ok(false);
        }
        let options = object(
            objc_getClass(c"NSDictionary".as_ptr()),
            sel_registerName(c"dictionary".as_ptr()),
        );
        open(
            app,
            sel_registerName(c"openURL:options:completionHandler:".as_ptr()),
            link,
            options,
            std::ptr::null_mut(),
        );
    }
    Ok(true)
}

/* A search in Safari, with the engine the reader set there: the system's
own address for it, which no web address stands in for. */
#[tauri::command]
fn search_in_safari(url: String) -> Result<(), String> {
    if !url.starts_with("x-web-search://?") {
        return Err("not a search".into());
    }
    open_address(&url, false).map(|_| ())
}

/* A question to AnkiMobile, which comes to the front to answer it and sends
the reader back through the address the question names (see `run`). False
where no Anki is installed. */
#[tauri::command]
fn open_anki(url: String) -> Result<bool, String> {
    if !url.starts_with("anki://x-callback-url/") {
        return Err("not a question to Anki".into());
    }
    open_address(&url, true)
}

/* What AnkiMobile left on the pasteboard about its decks and note types,
under a type of its own; empty where there is nothing of that type. */
#[tauri::command]
fn read_anki_info() -> String {
    unsafe {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            std::mem::transmute(send);
        let from_text: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            std::mem::transmute(send);
        let from_object: extern "C" fn(*mut c_void, *const c_void, *mut c_void) -> *mut c_void =
            std::mem::transmute(send);
        let bytes_of: extern "C" fn(*mut c_void, *const c_void) -> *const u8 =
            std::mem::transmute(send);
        let length_of: extern "C" fn(*mut c_void, *const c_void) -> usize =
            std::mem::transmute(send);
        let class = objc_getClass(c"UIPasteboard".as_ptr());
        if class.is_null() {
            return String::new();
        }
        let board = object(class, sel_registerName(c"generalPasteboard".as_ptr()));
        if board.is_null() {
            return String::new();
        }
        let kind = from_text(
            objc_getClass(c"NSString".as_ptr()),
            sel_registerName(c"stringWithUTF8String:".as_ptr()),
            c"net.ankimobile.json".as_ptr(),
        );
        let data = from_object(
            board,
            sel_registerName(c"dataForPasteboardType:".as_ptr()),
            kind,
        );
        if data.is_null() {
            return String::new();
        }
        let bytes = bytes_of(data, sel_registerName(c"bytes".as_ptr()));
        let length = length_of(data, sel_registerName(c"length".as_ptr()));
        if bytes.is_null() || length == 0 {
            return String::new();
        }
        String::from_utf8_lossy(std::slice::from_raw_parts(bytes, length)).into_owned()
    }
}

/* What Apple's translation answered: a status as a web server would give
it, and the text. */
#[derive(serde::Serialize)]
struct Answered {
    status: i32,
    text: String,
}

type Waiting = std::sync::mpsc::Sender<(i32, String)>;

extern "C" fn answered(context: *mut c_void, status: i32, text: *const c_char) {
    unsafe {
        let waiting = Box::from_raw(context as *mut Waiting);
        let text = if text.is_null() {
            String::new()
        } else {
            CStr::from_ptr(text).to_string_lossy().into_owned()
        };
        let _ = waiting.send((status, text));
    }
}

/* Hands one question to the Swift half (ios/Translation.swift), found by
its class name; false where the app was built without it. */
fn ask_translation(route: &str, body: &str, waiting: Waiting) -> bool {
    let (Ok(route), Ok(body)) = (
        std::ffi::CString::new(route),
        std::ffi::CString::new(body.replace('\0', "")),
    ) else {
        return false;
    };
    unsafe {
        let send = objc_msgSend as *const ();
        let from_text: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            std::mem::transmute(send);
        let ask: extern "C" fn(
            *mut c_void,
            *const c_void,
            *mut c_void,
            *mut c_void,
            *mut c_void,
            extern "C" fn(*mut c_void, i32, *const c_char),
        ) = std::mem::transmute(send);
        let class = objc_getClass(c"TriglosaTranslation".as_ptr());
        if class.is_null() {
            return false;
        }
        /* A worker thread has no pool for the two strings to end in. */
        let pool = objc_autoreleasePoolPush();
        let text = |value: &std::ffi::CString| {
            from_text(
                objc_getClass(c"NSString".as_ptr()),
                sel_registerName(c"stringWithUTF8String:".as_ptr()),
                value.as_ptr(),
            )
        };
        let context = Box::into_raw(Box::new(waiting)) as *mut c_void;
        ask(
            class,
            sel_registerName(c"ask:body:context:done:".as_ptr()),
            text(&route),
            text(&body),
            context,
            answered,
        );
        objc_autoreleasePoolPop(pool);
    }
    true
}

/* Apple's translation on the device, asked the routes a computer's helper
answers over HTTP: /ping, /available, /translate, /detect, /prepare. */
#[tauri::command]
async fn apple_translation(route: String, body: String) -> Result<Answered, String> {
    let (waiting, answer) = std::sync::mpsc::channel();
    if !ask_translation(&route, &body, waiting) {
        return Err("no translation in this build".into());
    }
    let (status, text) = tauri::async_runtime::spawn_blocking(move || answer.recv())
        .await
        .map_err(|error| error.to_string())?
        .map_err(|error| error.to_string())?;
    Ok(Answered { status, text })
}

/* The address the app was opened with last, until the page takes it: an
app started by an address has no page yet to hear of it. */
static OPENED: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

#[tauri::command]
fn take_opened() -> String {
    OPENED
        .lock()
        .ok()
        .and_then(|mut held| held.take())
        .unwrap_or_default()
}

#[tauri::mobile_entry_point]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            settings::read_settings,
            settings::write_settings,
            keychain::read_api_key,
            keychain::write_api_key,
            model::model_request,
            identify::identifier_ready,
            identify::identify_language,
            diagnostics::note_fault,
            diagnostics::system_report,
            spelling::check_spelling,
            read_pasteboard,
            search_in_safari,
            open_anki,
            read_anki_info,
            apple_translation,
            take_opened,
        ])
        .build(tauri::generate_context!())
        .expect("the app could not be built")
        /* Another app sending the reader back here names an address of this
        app's own; the page hears which, and that the app is in front again. */
        .run(|app, event| match event {
            tauri::RunEvent::Opened { urls } => {
                for url in urls {
                    /* Anki's way back is only heard; an address that
                    brings a text is kept for the page to take. */
                    if !url.as_str().starts_with("triglosa://anki/") {
                        if let Ok(mut held) = OPENED.lock() {
                            *held = Some(url.to_string());
                        }
                    }
                    let _ = app.emit("opened", url.to_string());
                }
            }
            tauri::RunEvent::Resumed => {
                let _ = app.emit("resumed", ());
            }
            _ => {}
        });
}

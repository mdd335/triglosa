/* The shell around the app.
   Everything that leaves the process goes through a plugin: HTTP for the model
   endpoint, Anki and the translation helper; shell for the helper itself;
   opener for dictionary links. The window itself is described in
   tauri.conf.json. */

use std::fs;
use std::sync::Mutex;

mod capture;
mod keyboard;
mod keychain;
mod overlay;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

/* The on-device translation helper. It keeps its sessions open, which is the
   whole point of it, and that costs memory — so it stops itself after five
   idle minutes, and the window stops it on exit. A second instance exits at
   once when the port is taken, so neither a crash here nor two windows leave
   anything behind.

   That idle deadline is why starting it once is not enough: after five quiet
   minutes the window would still be open with nothing behind it, and every
   translation would silently come back empty. The window asks for it again
   whenever it does not answer. */
#[derive(Default)]
struct Helper(Mutex<Option<CommandChild>>);

/* What the settings window is called, kept because the menu bar can be opened
   long after the window last said anything. The window names it — it follows
   the interface language, and that follows the reader's first language — and
   the shell only remembers the last thing it was told. */
struct SettingsName(Mutex<String>);

impl Default for SettingsName {
    fn default() -> Self {
        SettingsName(Mutex::new("Triglosa · Settings".into()))
    }
}

/* The card a window is being opened for, and its title.

   Handed over here rather than through an event, because there is no moment
   at which both ends are ready: the window is told to open and the card would
   be emitted before its page has a listener. The page asks for it instead,
   once, when it has loaded — and asks again when it is told the card changed,
   which is what a second row's button does to a window already standing
   open. */
#[derive(Default)]
struct PendingCard(Mutex<Option<String>>);

/* The height the reading window was last asked to take, in points of its
   whole frame — what it is on its way to while it animates, which its frame
   cannot say yet. See fit_reading_window. */
#[derive(Default)]
struct ReadingHeight(Mutex<f64>);

/* When the reading window was last shown. A fit in the first moments after
   that is not animated: what the page had queued while hidden — a reading
   that finished in the meantime, a section that changed height — lands
   then, and a window that visibly grows as it appears is the thing the page
   fits it beforehand to avoid. */
/* The entries a shortcut is written beside and their combinations, kept so
   the menu can be finished again when its symbol comes back (apply_presence). */
#[derive(Default)]
struct TrayShortcut(Mutex<Vec<(String, String)>>);

#[derive(Default)]
struct ShownAt(Mutex<Option<std::time::Instant>>);

const SETTLING_AFTER_SHOW: std::time::Duration = std::time::Duration::from_millis(400);

/* How the running app presents itself, from the reader's settings: whether
   the reading window is pinned — kept above every other window rather than
   put away when the focus leaves it — and whether there is a Dock icon, a
   menu bar symbol or both. Read from the settings file at
   start, before any window is shown, and told again by the window whenever
   the settings change. */
struct Presence {
    pinned: std::sync::atomic::AtomicBool,
    icon: Mutex<String>,
}

impl Default for Presence {
    fn default() -> Self {
        Self {
            pinned: std::sync::atomic::AtomicBool::new(false),
            icon: Mutex::new("menubar".into()),
        }
    }
}

/* The two answers out of the settings file, with the defaults where it says
   nothing or something this version does not know. */
fn presence_from(contents: &str) -> (bool, String) {
    let value: serde_json::Value = serde_json::from_str(contents).unwrap_or_default();
    /* A file the window has not written since the pin came is read the way
       the window reads it: not closing on a focus change is pinned. */
    let pinned = match value.get("pinned").and_then(|v| v.as_bool()) {
        Some(pinned) => pinned,
        None => value.get("closeOnBlur").and_then(|v| v.as_bool()) == Some(false),
    };
    let icon = match value.get("appIcon").and_then(|v| v.as_str()) {
        Some(icon @ ("dock" | "both")) => icon.to_string(),
        _ => "menubar".to_string(),
    };
    (pinned, icon)
}

fn is_pinned(app: &tauri::AppHandle) -> bool {
    app.try_state::<Presence>()
        .map(|presence| presence.pinned.load(std::sync::atomic::Ordering::Relaxed))
        .unwrap_or(false)
}

fn apply_presence_to(app: &tauri::AppHandle, pinned: bool, icon: &str) {
    let Some(presence) = app.try_state::<Presence>() else { return };
    presence.pinned.store(pinned, std::sync::atomic::Ordering::Relaxed);
    *presence.icon.lock().unwrap() = icon.to_string();
    /* Every window this app has, not only the reading one: the settings and
       a card are opened from a pinned window, and at the ordinary level they
       would open underneath it. */
    for window in app.webview_windows().values() {
        let _ = window.set_always_on_top(pinned);
    }
    /* A Dock icon means an ordinary app, a menu bar symbol alone an accessory
       one — the policy is what puts the icon in the Dock. */
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(if icon == "menubar" {
        tauri::ActivationPolicy::Accessory
    } else {
        tauri::ActivationPolicy::Regular
    });
    /* On Windows the symbol in the notification area always stays: a hidden
       window has no taskbar button, so the symbol is the way back. What the
       reader chooses is whether the open window also has a taskbar button —
       "both", as the Dock is on a Mac. Windows shows it only while the window
       is visible, which is the ordinary way a program sits in the taskbar. */
    #[cfg(target_os = "windows")]
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_skip_taskbar(icon == "menubar");
    }
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_visible(cfg!(target_os = "windows") || icon != "dock");
        finish_tray_menu(app, &tray);
    }
}

#[tauri::command]
fn apply_presence(app: tauri::AppHandle, pinned: bool, icon: String) {
    apply_presence_to(&app, pinned, &icon);
}

/* Safe to call at any time: an old handle is dropped first, and a helper that
   is genuinely still running keeps the port, which makes the new process exit
   by itself. */
#[tauri::command]
fn start_translation_helper(app: tauri::AppHandle) {
    stop_helper(&app);
    start_helper(&app);
}

fn start_helper(app: &tauri::AppHandle) {
    /* The helper is Swift and exists on macOS alone. */
    if !cfg!(target_os = "macos") {
        return;
    }
    let started = app
        .shell()
        .sidecar("translator")
        .and_then(|command| Ok(command.args(["serve"]).spawn()?));
    match started {
        Ok((_events, child)) => {
            if let Some(state) = app.try_state::<Helper>() {
                *state.0.lock().unwrap() = Some(child);
            }
        }
        /* Not fatal: without the helper every translation goes to the model
           instead. That is slower and the app says so, but it still works. */
        Err(error) => eprintln!("translation helper did not start: {error}"),
    }
}

fn stop_helper(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<Helper>() {
        if let Some(child) = state.0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}

/* The settings file. Its directory comes from the platform rather than from a
   path written down here, so Windows needs no special case later.

   Reading a file that is not there is not a failure — it is the first start,
   and the app then runs on its defaults. Anything unreadable is handed up as
   text so the window can say what happened rather than quietly resetting
   somebody's settings. */
fn settings_file(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let directory = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory.join("settings.json"))
}

#[tauri::command]
fn read_settings(app: tauri::AppHandle) -> Result<String, String> {
    let path = settings_file(&app)?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_settings(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    fs::write(settings_file(&app)?, contents).map_err(|e| e.to_string())
}

/* Where the window was last time, and how big.

   Kept beside the settings rather than in them: this is the shell's own note
   about a window, it is written from here without the page knowing, and a
   settings file the reader can look at should hold what the reader decided,
   not where they let go of a corner.

   In points, not pixels. A window measured on a Retina screen and restored on
   an external one would otherwise come back at half or double the size.

   The corner is optional so that a note written before the window remembered
   one still reads back — and so that a corner belonging to a screen that is
   no longer there can simply be dropped. */
#[derive(serde::Serialize, serde::Deserialize, Clone, Copy)]
struct WindowPlace {
    width: f64,
    height: f64,
    #[serde(default)]
    x: Option<f64>,
    #[serde(default)]
    y: Option<f64>,
}

/* The same floor the window itself has, in tauri.conf.json. A size below it
   is not a size the reader chose — it is a window on its way to being
   minimised, or a screen that was not there yet — and remembering it would
   open the app in a slot the next start cannot even honour. */
const SMALLEST: (f64, f64) = (390.0, 90.0);

fn window_file(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let directory = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory.join("window.json"))
}

/* Nothing remembered is the ordinary first start, and so is anything that
   will not read back: the window then opens at the size the configuration
   gives it. */
fn remembered_place(app: &tauri::AppHandle) -> Option<WindowPlace> {
    let contents = fs::read_to_string(window_file(app).ok()?).ok()?;
    let place: WindowPlace = serde_json::from_str(&contents).ok()?;
    (place.width >= SMALLEST.0 && place.height >= SMALLEST.1).then_some(place)
}

fn remember_place(window: &tauri::WebviewWindow) {
    let Ok(size) = window.inner_size() else { return };
    let scale = window.scale_factor().unwrap_or(1.0);
    let corner = window.outer_position().ok();
    let place = WindowPlace {
        width: f64::from(size.width) / scale,
        height: f64::from(size.height) / scale,
        x: corner.map(|at| f64::from(at.x) / scale),
        y: corner.map(|at| f64::from(at.y) / scale),
    };
    if place.width < SMALLEST.0 || place.height < SMALLEST.1 {
        return;
    }
    if let (Ok(path), Ok(contents)) =
        (window_file(window.app_handle()), serde_json::to_string(&place))
    {
        let _ = fs::write(path, contents);
    }
}

/* Is that corner on a screen that is there today? A window put down on a
   second monitor and reopened without it would otherwise come back at a place
   nobody can reach, and there is no way to drag back a title bar that is not
   on any screen. Asked of the window's top left corner only: a window whose
   corner is on a screen can always be moved. */
fn is_on_a_screen(window: &tauri::WebviewWindow, x: f64, y: f64) -> bool {
    let Ok(monitors) = window.available_monitors() else { return false };
    monitors.iter().any(|monitor| {
        let scale = monitor.scale_factor();
        let at = monitor.position();
        let size = monitor.size();
        let left = f64::from(at.x) / scale;
        let top = f64::from(at.y) / scale;
        x >= left
            && y >= top
            && x < left + f64::from(size.width) / scale
            && y < top + f64::from(size.height) / scale
    })
}

/* The part of a screen a window can be handled in, and a frame pushed into
   it: moved first, and made smaller only where it is taller or wider than the
   whole area. In one unit, whatever that unit is — the caller measures in
   pixels.

   Why it exists: the bottom edge of the window sometimes could not be dragged
   while the top edge could. The window can be put down anywhere — over
   another program's full screen, where there is no Dock, or by its drag line,
   which macOS does not keep out of the Dock's way — and it comes back where it
   was left. With its bottom edge under the Dock there is nothing to take hold
   of; the top edge never lies under anything. */
fn fit_within(
    corner: (i32, i32),
    size: (u32, u32),
    area: (i32, i32, u32, u32),
) -> ((i32, i32), (u32, u32)) {
    let (left, top, width, height) = area;
    let size = (size.0.min(width), size.1.min(height));
    let right = left + width as i32 - size.0 as i32;
    let bottom = top + height as i32 - size.1 as i32;
    let corner = (corner.0.clamp(left, right), corner.1.clamp(top, bottom));
    (corner, size)
}

/* Before the window is shown, into the screen it stands on — above the Dock
   and below the menu bar. Nothing is touched where it already fits, which is
   every ordinary case. */
fn fit_on_screen(window: &tauri::WebviewWindow) {
    let (Ok(at), Ok(outer), Ok(inner), Ok(Some(monitor))) = (
        window.outer_position(),
        window.outer_size(),
        window.inner_size(),
        window.current_monitor(),
    ) else {
        return;
    };
    let work = monitor.work_area();
    let area = (work.position.x, work.position.y, work.size.width, work.size.height);
    /* What can be seen of the frame is what has to fit. */
    let (left, top, right, bottom) = overlay::invisible_border(window);
    let seen_at = (at.x + left, at.y + top);
    let seen = (
        outer.width.saturating_sub((left + right) as u32),
        outer.height.saturating_sub((top + bottom) as u32),
    );
    let (corner, size) = fit_within(seen_at, seen, area);
    if size != seen {
        /* The frame is measured outside and set inside; the difference is
           whatever the frame itself takes. */
        let _ = window.set_size(tauri::PhysicalSize::new(
            (size.0 + (left + right) as u32).saturating_sub(outer.width - inner.width),
            (size.1 + (top + bottom) as u32).saturating_sub(outer.height - inner.height),
        ));
    }
    if corner != seen_at {
        let _ = window.set_position(tauri::PhysicalPosition::new(corner.0 - left, corner.1 - top));
    }
}

/* Put away, and the place noted on the way. Every route out of the window
   ends here — the close button, the Escape key, reaching for another program
   — so there is no way to move or resize the window and then leave by a door
   that forgets it.

   On the main thread, because measuring a window is one of the things macOS
   only answers there, and one of these doors — the focus leaving — is
   reported to a thread of its own. */
/* A question only the main thread may ask, asked from another one. No answer
   counts as no. */
fn main_thread_answer(window: &tauri::WebviewWindow, ask: fn() -> bool) -> bool {
    let (tell, answer) = std::sync::mpsc::channel();
    if window.run_on_main_thread(move || {
        let _ = tell.send(ask());
    }).is_err() {
        return false;
    }
    answer.recv_timeout(std::time::Duration::from_secs(1)).unwrap_or(false)
}

fn put_away(window: &tauri::WebviewWindow) {
    let window = window.clone();
    let _ = window.clone().run_on_main_thread(move || {
        remember_place(&window);
        let _ = window.hide();
        capture::note_clipboard();
    });
}

/* The model key. It never passes through the settings file — see keychain.rs
   for where it goes instead and why. An empty key means the app runs without
   one, which is a state it is built for: the translation panels keep working
   and everything the model would add stays visibly locked. */
#[tauri::command]
fn read_api_key() -> Result<String, String> {
    keychain::read()
}

#[tauri::command]
fn write_api_key(key: String) -> Result<(), String> {
    keychain::write(key.trim())
}

/* The search engine the user set for the whole system, so a look-up does not
   quietly ignore the one they chose.

   It lives in NSGlobalDomain under NSPreferredWebServices — the very setting
   Safari shows in its preferences. Three nearer-looking routes do not work:
   the x-web-search scheme has no handler on macOS, Safari's own preferences
   file in its container is locked by TCC even for reading, and the
   com.apple.Safari domain no longer knows the key.

   Returned raw; the JS side reads the identifier out of it. */
#[tauri::command]
fn preferred_search_report() -> String {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("defaults")
            .args(["read", "NSGlobalDomain", "NSPreferredWebServices"])
            .output()
            .map(|out| String::from_utf8_lossy(&out.stdout).into_owned())
            .unwrap_or_default()
    }
    #[cfg(not(target_os = "macos"))]
    String::new()
}

/* The languages the reader set for the system, first one first — what a
   first start takes its first language from. On the Mac from the global
   domain, because the web view answers with the app's own localisation
   rather than the reader's; on Windows the web view's own list is right, so
   nothing is asked here. Returned raw; the JS side reads the codes out. */
#[tauri::command]
fn system_languages_report() -> String {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("defaults")
            .args(["read", "NSGlobalDomain", "AppleLanguages"])
            .output()
            .map(|out| String::from_utf8_lossy(&out.stdout).into_owned())
            .unwrap_or_default()
    }
    #[cfg(not(target_os = "macos"))]
    String::new()
}

/* Asking macOS to fetch translation languages, with its own prompt.

   The work happens in the sidecar, because `prepareTranslation()` is Swift
   and needs a foreground app to present its sheet over. Inside Triglosa.app
   the helper gets one; run from a build directory it does not, and says so
   with exit code 2 — then the window falls back to opening the settings
   pane.

   Answers whether the prompt was actually shown. */
#[tauri::command]
async fn prepare_languages(
    app: tauri::AppHandle,
    from: String,
    targets: String,
    heading: String,
) -> Result<bool, String> {
    let output = app
        .shell()
        .sidecar("translator")
        .map_err(|e| e.to_string())?
        .args(["prepare", &from, &targets, &heading])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    match output.status.code() {
        Some(0) => Ok(true),
        /* Not an error: there was no window to show it in. */
        Some(2) => Ok(false),
        _ => Err(String::from_utf8_lossy(&output.stderr).trim().to_string()),
    }
}

/* Where the reader goes when the prompt above cannot be shown: the one
   settings pane that holds "Translation Languages", opened rather than
   described. On anything but macOS there is no such pane and the caller
   says so. */
#[tauri::command]
fn open_language_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.Localization-Settings.extension")
            .status()
            .map_err(|e| e.to_string())
            .and_then(|s| if s.success() { Ok(()) } else { Err("System Settings did not open.".into()) })
    }
    #[cfg(not(target_os = "macos"))]
    Err("There is no language download on this platform.".into())
}

/* One question to AnkiConnect, asked from here rather than from the window.

   Not because the window could not reach a local port — it reaches a model
   endpoint on one — but because of a header it cannot get rid of. Tauri's
   http plugin appends `Origin: tauri://localhost` to every request and lists
   Origin among the headers a caller may not set, and AnkiConnect answers a
   foreign origin with 403 Forbidden. So every card the app ever sent would
   have come back as "Anki is not answering" with Anki running.

   The alternative was to have the reader put `tauri://localhost` into the
   add-on's own configuration by hand, which is exactly the kind of step this
   feature exists to avoid. A request from here carries no Origin at all, and
   AnkiConnect allows that, the same way a plain curl is allowed.

   The reply comes back as text and is read in the window: what the answer
   means is AnkiConnect's business, and this end only has to carry it. */
const ANKI_URL: &str = "http://127.0.0.1:8765";

#[tauri::command]
async fn anki_request(body: String) -> Result<String, String> {
    let response = tauri_plugin_http::reqwest::Client::new()
        .post(ANKI_URL)
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(15))
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status();
    if !status.is_success() {
        return Err(status.as_u16().to_string());
    }
    response.text().await.map_err(|e| e.to_string())
}

/* Anki, brought up in the background so a card has somewhere to go.

   The one thing this app starts that is not its own, and it happens only on
   a button that says so. In the background: the reader is looking at a card
   in this window and a program jumping in front of it would take that away.
   Whether it then answers is not decided here — the window asks AnkiConnect
   until it does. */
#[tauri::command]
fn launch_anki() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-g", "-a", "Anki"])
            .status()
            .map_err(|e| e.to_string())
            .and_then(|s| if s.success() { Ok(()) } else { Err("Anki did not start.".into()) })
    }
    #[cfg(target_os = "windows")]
    {
        /* Where Anki's own installer puts it: for the user alone, or for
           everybody. Started detached, and not brought to the front. */
        let places = [
            std::env::var("LOCALAPPDATA").map(|dir| format!("{dir}\\Programs\\Anki\\anki.exe")),
            std::env::var("ProgramFiles").map(|dir| format!("{dir}\\Anki\\anki.exe")),
        ];
        let program = places
            .into_iter()
            .flatten()
            .find(|path| std::path::Path::new(path).exists())
            .ok_or_else(|| "Anki is not installed.".to_string())?;
        std::process::Command::new(program)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    Err("Starting Anki is not implemented on this platform.".into())
}

/* Reading what is selected somewhere else, and writing back into it. The
   work itself is in capture.rs; what is here is the shape the window sees.

   Errors are short words rather than sentences: "accessibility", "empty",
   "focus". The window turns them into text, in the reader's own language,
   which is where all the other wording lives too. */
#[tauri::command]
async fn read_selection() -> Result<capture::Selection, String> {
    tauri::async_runtime::spawn_blocking(capture::read)
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
async fn insert_text(source: i32, text: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || capture::write(source, &text))
        .await
        .map_err(|error| error.to_string())?
}

/* What is written on each key, in the layout being used right now, and which
   combinations the system already holds. Both are asked once when the
   settings open — a reader who changes their keyboard layout while the
   window is open is not a case worth carrying state for. */
#[tauri::command]
fn key_labels() -> std::collections::BTreeMap<String, String> {
    keyboard::labels()
}

#[tauri::command]
fn taken_shortcuts() -> Vec<String> {
    keyboard::taken()
}

#[tauri::command]
fn accessibility_granted() -> bool {
    capture::trusted()
}

/* The system's own consent dialog, asked for only after the window has
   explained what it is for. An unexplained permission dialog costs half the
   users, and this one arrives on a button press rather than on startup. */
#[tauri::command]
async fn request_accessibility() -> bool {
    tauri::async_runtime::spawn_blocking(capture::request)
        .await
        .unwrap_or(false)
}

#[tauri::command]
fn open_accessibility_settings() -> Result<(), String> {
    capture::open_settings()
}

/* The window, brought back from wherever it went. Closing it only hides it —
   the shortcut has to go on working, and a program that has to be running
   before its global shortcut does is not a global shortcut. */
fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        fit_on_screen(&window);
        /* What the window is now is where the next fit counts from. */
        if let (Ok(outer), Some(height)) = (window.outer_size(), window.try_state::<ReadingHeight>()) {
            *height.0.lock().unwrap() = f64::from(outer.height) / window.scale_factor().unwrap_or(1.0);
        }
        let _ = window.show();
        let target = window.clone();
        let _ = window.run_on_main_thread(move || overlay::bring_to_front(&target));
        if let Some(shown) = window.try_state::<ShownAt>() {
            *shown.0.lock().unwrap() = Some(std::time::Instant::now());
        }
        /* The page hears this and opens the device's language pairs again.
           The window hides rather than closing, so this is the only moment
           it learns that a session has come back — and the translation
           helper may have idled out in between. */
        let _ = window.emit("shown", ());
    }
}

/* The height to set, or none for leaving it alone. A pixel or two either way
   is the measurement's own noise. The floor wins over the room left on the
   screen: a window has to stay a window. */
fn fitted_height(wanted: f64, now: f64, room: f64, floor: f64, grow: bool) -> Option<f64> {
    let height = wanted.min(room).max(floor).round();
    if (height - now).abs() <= 2.0 || (grow && height < now) {
        return None;
    }
    Some(height)
}

/* The reading window to the height its page wants, in points of the whole
   frame — the page measures that, because only the page knows how tall what
   it holds is. Never past the bottom of the screen's free part, where the
   sheet scrolls instead, and never below the window's floor; the top edge
   stays where it is. `grow` is for a reading still arriving: taller only, so the window
   does not bob up and down while pieces replace their placeholders. Nothing
   happens while the reader is dragging an edge. */
/* The window brought forward from the menu bar symbol or the Dock. Where it
   is hidden the page is asked to do it: it fits the window to what it holds
   first, while nobody can see that, and then shows it — the same way the
   shortcut does. Shown from here after a moment all the same, in case the
   page never answers. */
fn ask_to_show(app: &tauri::AppHandle, fresh: bool) {
    let Some(window) = app.get_webview_window("main") else { return };
    if window.is_visible().unwrap_or(false) {
        if fresh {
            let _ = window.emit("fresh", ());
        }
        show_window(app);
        return;
    }
    let _ = window.emit("appear", fresh);
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(600));
        let hidden = app
            .get_webview_window("main")
            .map(|window| !window.is_visible().unwrap_or(true))
            .unwrap_or(false);
        if hidden {
            show_window(&app);
        }
    });
}

#[tauri::command]
async fn fit_reading_window(app: tauri::AppHandle, height: f64, grow: bool) -> bool {
    let Some(window) = app.get_webview_window("main") else { return false };
    /* Answers whether the height changes, so the page can wait for it: a
       window only measures itself on the main thread. */
    let (tell, answer) = std::sync::mpsc::channel();
    let target = window.clone();
    let _ = window.run_on_main_thread(move || {
        let _ = tell.send(fit_now(&target, height, grow));
    });
    tauri::async_runtime::spawn_blocking(move || answer.recv().unwrap_or(false))
        .await
        .unwrap_or(false)
}

fn fit_now(window: &tauri::WebviewWindow, height: f64, grow: bool) -> bool {
    if overlay::in_live_resize(window) {
        return false;
    }
    let Some(state) = window.try_state::<ReadingHeight>() else { return false };
    let (Ok(outer), Ok(inner), Ok(at), Ok(Some(monitor))) = (
        window.outer_size(),
        window.inner_size(),
        window.outer_position(),
        window.current_monitor(),
    ) else {
        return false;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let chrome = f64::from(outer.height.saturating_sub(inner.height)) / scale;
    let work = monitor.work_area();
    /* Down to where the frame stops being seen: the invisible border below
       it may lie past the screen's free part. */
    let (_, _, _, below) = overlay::invisible_border(window);
    let room = f64::from(work.position.y + work.size.height as i32 - at.y + below) / scale;
    let mut now = state.0.lock().unwrap();
    if *now <= 0.0 {
        *now = f64::from(outer.height) / scale;
    }
    let Some(wanted) = fitted_height(height, *now, room, SMALLEST.1 + chrome, grow) else { return false };
    *now = wanted;
    drop(now);
    let settling = window
        .try_state::<ShownAt>()
        .and_then(|shown| *shown.0.lock().unwrap())
        .is_some_and(|at| at.elapsed() < SETTLING_AFTER_SHOW);
    let animated = window.is_visible().unwrap_or(false) && !settling;
    overlay::set_height_keeping_top(window, wanted, animated);
    true
}

/* `veiled` is the page showing the window it has just drawn into: shown
   transparent, and made visible by unveil_main_window once the page has
   painted. Made visible from here after a moment all the same, in case the
   page never says so. */
#[tauri::command]
fn show_main_window(app: tauri::AppHandle, veiled: Option<bool>) {
    let veiled = veiled.unwrap_or(false);
    if let Some(window) = app.get_webview_window("main") {
        let target = window.clone();
        let _ = window.run_on_main_thread(move || overlay::set_veiled(&target, veiled));
    }
    show_window(&app);
    if veiled {
        let app = app.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(400));
            unveil(&app);
        });
    }
}

fn unveil(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let target = window.clone();
        let _ = window.run_on_main_thread(move || overlay::set_veiled(&target, false));
    }
}

#[tauri::command]
fn unveil_main_window(app: tauri::AppHandle) {
    unveil(&app);
}

#[tauri::command]
fn hide_main_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        put_away(&window);
    }
}

/* The settings, in a window of their own.

   Opened rather than toggled: a second call brings the one that is already
   there to the front, so the gear, the menu bar entry and ⌘, cannot between
   them produce three of them.

   Closing it really closes it — unlike the main window, which only hides.
   That is what the other window waits for: the shortcut recorder lets go of
   the combination while its field has focus, so a window closed at that
   moment would leave the app holding nothing at all. */
fn settings_window(app: &tauri::AppHandle, about: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        if about {
            let _ = app.emit_to("settings", "settings-about", ());
        }
        return Ok(());
    }

    let title = app
        .try_state::<SettingsName>()
        .map(|state| state.0.lock().unwrap().clone())
        .unwrap_or_else(|| "Triglosa · Settings".into());

    let window = tauri::WebviewWindowBuilder::new(
        app,
        "settings",
        /* Opened at its last group, for the menu's update entry: a page that
           is still loading cannot hear an event yet, but it can read its
           own address. */
        tauri::WebviewUrl::App(if about { "settings.html#about" } else { "settings.html" }.into()),
    )
    .title(title)
    .inner_size(560.0, 720.0)
    .min_inner_size(460.0, 380.0)
    .resizable(true)
    .always_on_top(is_pinned(app))
    /* Built hidden and then brought forward, the way an existing one is.
       Shown as it was built, from the menu bar, the window stood behind the
       program in front — an accessory app is not active — and was found
       later on a full screen Space where nothing covered it. */
    .visible(false)
    .build()
    .map_err(|error| error.to_string())?;
    overlay::over_full_screen(&window, overlay::Spaces::Active);
    let _ = window.show();
    let target = window.clone();
    let _ = window.run_on_main_thread(move || overlay::bring_to_front(&target));

    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            let _ = handle.emit("settings-closed", ());
        }
    });
    Ok(())
}

/* A flashcard, in a window of its own.

   A layer inside the reading window was the first answer and it was wrong for
   one reason found by using it: a card cannot be edited while
   looking something up in the reading, because a layer takes the whole window
   and there is no way back and forth. Two windows switch. Nothing is lost by
   it — the reading window asks every window this app has before it puts
   itself away, so bringing the card forward leaves the reading standing.

   Opened rather than toggled, like the settings: a second row's button fills
   the window that is already there and brings it forward. */
fn card_window(app: &tauri::AppHandle, title: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("card") {
        let _ = window.set_title(&title);
        let _ = window.unminimize();
        let _ = window.show();
        /* In front even where another program is: the card shortcut opens
           this window straight out of whatever the reader was working in. */
        let target = window.clone();
        let _ = window.run_on_main_thread(move || overlay::bring_to_front(&target));
        /* The page is already past asking, so it has to be told. */
        let _ = app.emit_to("card", "card-changed", ());
        return Ok(());
    }

    let builder =
        tauri::WebviewWindowBuilder::new(app, "card", tauri::WebviewUrl::App("card.html".into()))
            .title(title)
            /* Near what a card actually comes to, because the page measures
               itself and sets its own height as soon as it has drawn — a
               number far from it would be a visible jump on the way. */
            .inner_size(460.0, 400.0)
            .min_inner_size(380.0, 220.0)
            .resizable(true)
            .always_on_top(is_pinned(app))
            /* Built hidden and then brought forward, like the settings: shown
               as it was built, from the card shortcut, it stood behind the
               program in front. */
            .visible(false);
    /* The page runs the full height and draws the title line itself, so the
       wand can stand in it the way the gear stands in the reading window's.
       The three buttons stay: this window is closed the way everybody knows.
       Windows has no overlaid title bar, and keeps its own. */
    #[cfg(target_os = "macos")]
    let builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
    let window = builder.build().map_err(|error| error.to_string())?;
    overlay::over_full_screen(&window, overlay::Spaces::Active);
    let _ = window.show();
    let target = window.clone();
    let _ = window.run_on_main_thread(move || overlay::bring_to_front(&target));
    Ok(())
}

/* Async, as every command that builds a window has to be: a synchronous one
   runs on the main thread, and on Windows building a web view there waits
   for the very thread it is holding. */
#[tauri::command]
async fn open_card_window(app: tauri::AppHandle, title: String, card: String) -> Result<(), String> {
    if let Some(state) = app.try_state::<PendingCard>() {
        *state.0.lock().unwrap() = Some(card);
    }
    card_window(&app, title)
}

/* What the card window asks for once it has loaded, and again whenever it is
   told the card changed. */
#[tauri::command]
fn take_card(app: tauri::AppHandle) -> Option<String> {
    app.try_state::<PendingCard>()
        .and_then(|state| state.0.lock().unwrap().clone())
}

#[tauri::command]
fn close_card_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("card") {
        let _ = window.close();
    }
}

/* And the way out of it with the keyboard. This app has no menu bar of its
   own — an Accessory app gets none — so ⌘W and ⌘Q do not exist here and the
   red button is otherwise the only door. The window asks for this when the
   reader presses Escape or ⌘W, the two keys every window on this system
   answers to. */
#[tauri::command]
fn close_settings_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.close();
    }
}

#[tauri::command]
async fn open_settings_window(app: tauri::AppHandle, title: String) -> Result<(), String> {
    if let Some(state) = app.try_state::<SettingsName>() {
        *state.0.lock().unwrap() = title;
    }
    settings_window(&app, false)
}

/* The three combinations, by what they set off. */
#[derive(serde::Deserialize, Default)]
struct Shortcuts {
    capture: Option<String>,
    fresh: Option<String>,
    card: Option<String>,
}

/* Taking hold of the shortcuts, and giving them up again.

   Everything is unregistered first, so changing a combination in the
   settings cannot leave the old one behind. A field left empty is how the
   reader who cleared it is honoured — that combination is then not held.

   What macOS does not offer is a reliable answer to "is this already taken":
   registering a combination another program holds usually succeeds here.
   Where one does fail the others are still taken, and the first failure is
   handed up for the window to say. */
#[tauri::command]
fn set_shortcut(app: tauri::AppHandle, shortcuts: Shortcuts) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

    let manager = app.global_shortcut();
    let _ = manager.unregister_all();

    let wanted: [(Option<String>, fn(&tauri::AppHandle)); 3] = [
        /* The order matters and is the opposite of what it looks like: the
           selection is read while the other program is still in front.
           Showing the window first would make this app the focused one, and
           the focused element would then be our own input field. And the
           window is shown by the page, not here: the page first draws what
           arrived and fits the window to it while it is still hidden, so it
           appears at its size instead of animating into it in front of the
           reader. Shown from here after a moment all the same, in case the
           page never answers. */
        (shortcuts.capture, |app| capture_and_show(app, false)),
        (shortcuts.fresh, |app| ask_to_show(app, true)),
        (shortcuts.card, |app| capture_for_card(app, false)),
    ];
    let mut failed = None;
    for (accelerator, act) in wanted {
        let Some(accelerator) = accelerator.filter(|value| !value.trim().is_empty()) else {
            continue;
        };
        let taken = accelerator
            .parse::<Shortcut>()
            .map_err(|_| format!("{accelerator} is not a combination this system can take."))
            .and_then(|shortcut| {
                manager
                    .on_shortcut(shortcut, move |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            act(app);
                        }
                    })
                    .map_err(|error| error.to_string())
            });
        if let Err(reason) = taken {
            failed.get_or_insert(reason);
        }
    }
    failed.map_or(Ok(()), Err)
}

/* The selection, read the way the shortcut reads it or the way a menu entry
   has to: after the menu is gone, so ⌘C reaches the program underneath it,
   and on Windows with that program brought back in front first. */
fn selection_for(from_menu: bool) -> Result<capture::Selection, String> {
    if !from_menu {
        return capture::read();
    }
    std::thread::sleep(std::time::Duration::from_millis(150));
    capture::read_from_menu()
}

/* The selection taken out of the program in front, then the window. What the
   shortcut does, and what the menu's entry does. */
fn capture_and_show(app: &tauri::AppHandle, from_menu: bool) {
    let app = app.clone();
    std::thread::spawn(move || {
        let found = selection_for(from_menu);
        #[cfg(debug_assertions)]
        match &found {
            Ok(selection) => eprintln!("capture: {} chars by {}", selection.text.chars().count(), selection.route),
            Err(reason) => eprintln!("capture failed: {reason}"),
        }
        match found {
            Ok(selection) => {
                let _ = app.emit("capture", selection);
            }
            Err(reason) => {
                let _ = app.emit("capture-failed", reason);
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(600));
        let hidden = app
            .get_webview_window("main")
            .map(|window| !window.is_visible().unwrap_or(true))
            .unwrap_or(false);
        if hidden {
            show_window(&app);
        }
    });
}

/* The selection taken out of the program in front for a flashcard: the page
   of the reading window decides which side of the card it goes on, and opens
   the card window — blank where nothing came. The reading window itself stays
   where it is. */
fn capture_for_card(app: &tauri::AppHandle, from_menu: bool) {
    let app = app.clone();
    std::thread::spawn(move || {
        let found = selection_for(from_menu);
        let _ = match found {
            Ok(selection) => app.emit_to("main", "capture-card", selection),
            Err(reason) => app.emit_to("main", "capture-card-failed", reason),
        };
    });
}

/* The menu bar symbol. It exists because closing the window no longer quits:
   without a visible anchor the app would go on running with no way back to it
   and no way out of it.

   Every click opens the menu. A left click that shows the window instead
   depends on a view laid over the system's button, and macOS 27 hands the
   click to the button underneath.

   Its two words come from the window rather than from here — they follow the
   interface language, and that follows the reader's first language. */
/* What muda cannot draw, done to the menu once it stands: the name as a
   section heading, and the shortcut beside its entry. */
fn finish_tray_menu(app: &tauri::AppHandle, tray: &tauri::tray::TrayIcon) {
    let shortcuts = app
        .try_state::<TrayShortcut>()
        .map(|state| state.0.lock().unwrap().clone())
        .unwrap_or_default();
    overlay::finish_tray_menu(tray, shortcuts);
}

#[derive(serde::Deserialize)]
struct TrayWords {
    show: String,
    capture: String,
    fresh: String,
    card: String,
    #[serde(rename = "blankCard")]
    blank_card: String,
    settings: String,
    updates: String,
    help: String,
    problem: String,
    restart: String,
    quit: String,
}

/* Where the menu's three entries about the project go. The window names the
   same addresses in src/updates.js. */
const HELP_URL: &str = "https://github.com/mdd335/triglosa#readme";
const ISSUES_URL: &str = "https://github.com/mdd335/triglosa/issues";

#[tauri::command]
fn apply_tray(
    app: tauri::AppHandle,
    words: TrayWords,
    shortcuts: Shortcuts,
) -> Result<(), String> {
    /* The window is hidden as often as it is closed, so its settings have to
       be reachable from out here too — otherwise the only way to them is to
       bring back a window in order to leave it again. */
    if let Some(state) = app.try_state::<SettingsName>() {
        /* As a title, the way the page's windowTitle writes one: the menu
           entry is the bare word, the window it opens is not. */
        *state.0.lock().unwrap() = format!("Triglosa · {}", words.settings);
    }
    let item = |id: &str, text: &str| {
        MenuItem::with_id(&app, id, text, true, None::<&str>).map_err(|error| error.to_string())
    };
    /* The app's name on top as a section heading: a menu under a symbol says
       whose it is. Built as a plain greyed entry and restyled once the menu
       stands (overlay::tray_heading). */
    let name = MenuItem::with_id(&app, "name", "Triglosa", false, None::<&str>)
        .map_err(|error| error.to_string())?;
    let open = item("show", &words.show)?;
    /* Each shortcut beside the entry that does what it does, so it is learned
       in passing. A combination the menu cannot write is left off rather than
       taking the whole menu with it. */
    /* A combination on a key with a character — ⌘Ü, ⌃⌥E — is written beside
       the entry by AppKit once the menu stands: muda reads only the keys of an
       American keyboard and drops anything else without a word. One on a named
       key (Space, F5) goes through muda, which knows those. */
    let mut later = Vec::new();
    let mut entry = |id: &str, text: &str, accelerator: Option<String>| {
        let accelerator = accelerator.filter(|value| !value.is_empty());
        if let Some(value) = accelerator.as_deref() {
            if overlay::is_character_combination(value) {
                later.push((text.to_string(), value.to_string()));
            } else if let Ok(entry) = MenuItem::with_id(&app, id, text, true, Some(value)) {
                return Ok(entry);
            }
        }
        item(id, text)
    };
    let selected = entry("capture", &words.capture, shortcuts.capture)?;
    let blank = entry("fresh", &words.fresh, shortcuts.fresh)?;
    let card = entry("card", &words.card, shortcuts.card)?;
    let blank_card = item("blank-card", &words.blank_card)?;
    if let Some(state) = app.try_state::<TrayShortcut>() {
        *state.0.lock().unwrap() = later;
    }
    let configure = item("settings", &words.settings)?;
    let updates = item("updates", &words.updates)?;
    let help = item("help", &words.help)?;
    let problem = item("problem", &words.problem)?;
    let again = item("restart", &words.restart)?;
    let leave = item("quit", &words.quit)?;
    let line = || PredefinedMenuItem::separator(&app).map_err(|error| error.to_string());
    let (second, cards, third) = (line()?, line()?, line()?);
    let menu = Menu::with_items(
        &app,
        &[
            &name, &open, &selected, &blank, &cards, &card, &blank_card, &second, &configure, &updates, &help,
            &problem, &third, &again, &leave,
        ],
    )
    .map_err(|error| error.to_string())?;

    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu)).map_err(|error| error.to_string())?;
        finish_tray_menu(&app, &tray);
        return Ok(());
    }

    let visible = app
        .try_state::<Presence>()
        .map(|presence| cfg!(target_os = "windows") || presence.icon.lock().unwrap().as_str() != "dock")
        .unwrap_or(true);
    let builder = TrayIconBuilder::with_id("main");
    /* A template of its own: the app icon is a coloured square, and a
       template is drawn from its alpha alone, so it came out as a filled
       block. Decoded at compile time, so no image feature is needed. */
    #[cfg(not(target_os = "windows"))]
    let builder = builder.icon(tauri::include_image!("icons/tray.png")).icon_as_template(true);
    /* Windows draws no templates: a black symbol would vanish on a dark
       taskbar, and the notification area is full of coloured ones anyway. A
       left click shows the window and a right click opens the menu, which is
       what every symbol there does. */
    #[cfg(target_os = "windows")]
    let builder = builder
        .icon(tauri::include_image!("icons/32x32.png"))
        /* The name under the pointer, as every other symbol there has. */
        .tooltip("Triglosa")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                ..
            } = event
            {
                ask_to_show(tray.app_handle(), false);
            }
        });
    builder
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => ask_to_show(app, false),
            "capture" => capture_and_show(app, true),
            "fresh" => ask_to_show(app, true),
            "card" => capture_for_card(app, true),
            "blank-card" => {
                let _ = app.emit_to("main", "card-blank", ());
            }
            "settings" | "updates" => {
                /* After the menu has closed: while it is still tracking, the
                   app is not made active and the window lands behind the
                   program in front. */
                let about = event.id.as_ref() == "updates";
                let app = app.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    let handle = app.clone();
                    let _ = app.run_on_main_thread(move || {
                        if let Err(error) = settings_window(&handle, about) {
                            eprintln!("the settings window did not open: {error}");
                        }
                    });
                });
            }
            "help" | "problem" => {
                use tauri_plugin_opener::OpenerExt;
                let url = if event.id.as_ref() == "help" { HELP_URL } else { ISSUES_URL };
                let _ = app.opener().open_url(url, None::<&str>);
            }
            "restart" => app.request_restart(),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(&app)
        .and_then(|tray| {
            finish_tray_menu(&app, &tray);
            tray.set_visible(visible)
        })
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    /* First, so that a second copy goes before it has built anything: it
       hands over, and the running app shows its window the way the menu's
       entry does. */
    #[cfg(target_os = "windows")]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        ask_to_show(app, false);
    }));
    builder
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(Helper::default())
        .manage(SettingsName::default())
        .manage(PendingCard::default())
        .manage(Presence::default())
        .manage(ReadingHeight::default())
        .manage(ShownAt::default())
        .manage(TrayShortcut::default())
        .invoke_handler(tauri::generate_handler![
            start_translation_helper,
            apply_presence,
            read_settings,
            write_settings,
            read_api_key,
            write_api_key,
            prepare_languages,
            open_language_settings,
            anki_request,
            launch_anki,
            preferred_search_report,
            system_languages_report,
            read_selection,
            insert_text,
            accessibility_granted,
            request_accessibility,
            open_accessibility_settings,
            show_main_window,
            fit_reading_window,
            unveil_main_window,
            hide_main_window,
            set_shortcut,
            open_settings_window,
            close_settings_window,
            open_card_window,
            close_card_window,
            take_card,
            key_labels,
            taken_shortcuts,
            apply_tray
        ])
        .setup(|app| {
            capture::note_clipboard();
            capture::watch_front();
            start_helper(app.handle());
            /* No dock icon: the menu bar symbol is already the anchor, and an
               app that is not in the dock activates without carrying a Space
               of its own along with it. */
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            /* Unless the reader asked for a Dock icon, which is known before
               any window is shown. */
            if let Ok(contents) = settings_file(app.handle()).and_then(|path| {
                fs::read_to_string(path).map_err(|error| error.to_string())
            }) {
                let (pinned, icon) = presence_from(&contents);
                apply_presence_to(app.handle(), pinned, &icon);
            }
            /* Closing the window hides it. The shortcut goes on working, and
               the menu bar symbol is the way back — see apply_tray, which the
               window builds as soon as it knows which language to name it
               in. */
            if let Some(window) = app.get_webview_window("main") {
                overlay::over_full_screen(&window, overlay::Spaces::All);
                overlay::without_window_buttons(&window);
                /* On Windows the system's title bar would stand above the
                   page's own line with its three buttons: the frame goes and
                   the page's line is the title bar. Whether it has a taskbar
                   button is the reader's choice (apply_presence_to). */
                #[cfg(target_os = "windows")]
                {
                    let _ = window.set_decorations(false);
                    let _ = window.set_shadow(true);
                }
                /* The size and the place the reader left it at. Set before
                   the window is ever looked at, so it does not open at one
                   size and jump to another. */
                if let Some(place) = remembered_place(app.handle()) {
                    let _ = window.set_size(tauri::LogicalSize::new(place.width, place.height));
                    if let (Some(x), Some(y)) = (place.x, place.y) {
                        if is_on_a_screen(&window, x, y) {
                            let _ = window.set_position(tauri::LogicalPosition::new(x, y));
                        }
                    }
                }
                fit_on_screen(&window);
                if let (Ok(outer), Some(height)) = (window.outer_size(), window.try_state::<ReadingHeight>()) {
                    *height.0.lock().unwrap() = f64::from(outer.height) / window.scale_factor().unwrap_or(1.0);
                }
                let handle = window.clone();
                window.on_window_event(move |event| match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        put_away(&handle);
                    }
                    /* Reaching for something else puts the window away, the
                       way a menu closes on a focus change. It
                       lies over another program's full screen, and something
                       lying there that only goes when it is dismissed is in
                       the way rather than at hand. Hiding takes nothing with
                       it: a reading that is still being worked out goes on,
                       and the window comes back to it.

                       Asked a moment later, and of every window this app has:
                       opening the settings takes the focus off this one, and
                       macOS reports the loss before it reports the gain. */
                    WindowEvent::Focused(false) => {
                        if is_pinned(handle.app_handle()) {
                            return;
                        }
                        let window = handle.clone();
                        std::thread::spawn(move || {
                            std::thread::sleep(std::time::Duration::from_millis(200));
                            /* A panel that leaves this app active — Spotlight
                               opened for its clipboard history — is not
                               reaching for something else. The window waits
                               until either one of ours has the focus again or
                               another program has taken it. */
                            loop {
                                let ours = window
                                    .app_handle()
                                    .webview_windows()
                                    .values()
                                    .any(|window| window.is_focused().unwrap_or(false));
                                if ours || !window.is_visible().unwrap_or(false) {
                                    return;
                                }
                                if !main_thread_answer(&window, overlay::app_is_active) {
                                    put_away(&window);
                                    return;
                                }
                                std::thread::sleep(std::time::Duration::from_millis(250));
                            }
                        });
                    }
                    _ => {}
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("the app could not be built")
        .run(|app, event| match event {
            /* A click on the Dock icon, where there is one. */
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { .. } => ask_to_show(app, false),
            RunEvent::ExitRequested { .. } => {
                /* Quitting from the menu bar is the one way out that does not
                   go through put_away. */
                if let Some(window) = app.get_webview_window("main") {
                    remember_place(&window);
                }
                stop_helper(app);
            }
            _ => {}
        });
}

#[cfg(test)]
mod tests {
    #[test]
    fn the_reading_window_fits_its_page_on_the_screen() {
        use super::fitted_height;
        /* Down to a short reading, up to a long one, and no further than the
           screen's free part. */
        assert_eq!(fitted_height(300.0, 770.0, 900.0, 188.0, false), Some(300.0));
        assert_eq!(fitted_height(1200.0, 300.0, 900.0, 188.0, false), Some(900.0));
        assert_eq!(fitted_height(90.0, 300.0, 900.0, 188.0, false), Some(188.0));
        /* Noise, and a reading still arriving, leave it alone. */
        assert_eq!(fitted_height(301.5, 300.0, 900.0, 188.0, false), None);
        assert_eq!(fitted_height(250.0, 300.0, 900.0, 188.0, true), None);
        assert_eq!(fitted_height(350.0, 300.0, 900.0, 188.0, true), Some(350.0));
    }

    #[test]
    fn presence_is_read_from_the_settings_with_its_defaults() {
        use super::presence_from;
        assert_eq!(presence_from(""), (false, "menubar".to_string()));
        assert_eq!(presence_from(r#"{"pinned":true,"appIcon":"both"}"#), (true, "both".to_string()));
        assert_eq!(presence_from(r#"{"closeOnBlur":false,"appIcon":"both"}"#), (true, "both".to_string()));
        assert_eq!(presence_from(r#"{"closeOnBlur":false,"pinned":false}"#), (false, "menubar".to_string()));
        assert_eq!(presence_from(r#"{"closeOnBlur":"no","appIcon":"taskbar"}"#), (false, "menubar".to_string()));
    }

    /* A window left with its bottom edge under the Dock comes back above it,
       and one taller than the screen's free part is made to fit it. */
    #[test]
    fn a_window_is_pushed_out_from_under_the_dock() {
        use super::fit_within;
        /* 1512 × 982 points: menu bar 33 at the top, Dock 73 at the bottom. */
        let area = (0, 33, 1512, 876);
        assert_eq!(fit_within((209, 89), (520, 714), area), ((209, 89), (520, 714)));
        assert_eq!(fit_within((209, 300), (520, 714), area), ((209, 195), (520, 714)));
        assert_eq!(fit_within((209, 10), (520, 714), area), ((209, 33), (520, 714)));
        assert_eq!(fit_within((1200, 89), (520, 714), area), ((992, 89), (520, 714)));
        assert_eq!(fit_within((209, 200), (520, 950), area), ((209, 33), (520, 876)));
    }

    /* Starting the app is not asking for the window. It waits for the
       shortcut, the menu bar symbol or the Dock, and until then only the
       symbol is there — a window that put itself in front of whatever the
       reader was doing would be in the way, and the app is started once and
       left running. Set in the window's configuration, because a window
       shown and hidden again flashes. */
    #[test]
    fn the_reading_window_starts_hidden() {
        let config = std::fs::read_to_string("tauri.conf.json").expect("tauri.conf.json");
        let parsed: serde_json::Value = serde_json::from_str(&config).expect("valid json");
        assert_eq!(parsed["app"]["windows"][0]["visible"], serde_json::json!(false));
    }

    /* The one thing about the shortcut that can fail silently. The default is
       written by hand in JavaScript, in the spelling the recorder produces —
       and a spelling this side cannot parse would be a shortcut that never
       registers, with nothing to see anywhere. The two files have to agree,
       and this is where that is checked. */
    #[test]
    fn the_preset_combination_is_one_the_shell_can_read() {
        use std::str::FromStr;
        use tauri_plugin_global_shortcut::Shortcut;

        let preset = std::fs::read_to_string("../src/hotkey.js").expect("hotkey.js");
        let written = |name: &str| {
            let line = preset
                .lines()
                .find(|line| line.starts_with(&format!("export const {name} =")))
                .expect("a default is written down");
            line.split("accelerator: \"")
                .nth(1)
                .and_then(|rest| rest.split('"').next())
                .expect("with an accelerator in it")
                .to_string()
        };

        /* One per system: Ctrl+Alt is AltGr on Windows. */
        for (name, expected) in [("DEFAULT_HOTKEY", "Control+Alt+KeyE"), ("WINDOWS_HOTKEY", "Super+Shift+KeyE")] {
            let accelerator = written(name);
            assert_eq!(accelerator, expected);
            assert!(
                Shortcut::from_str(&accelerator).is_ok(),
                "{accelerator} is not a combination this shell can register",
            );
        }
    }
}

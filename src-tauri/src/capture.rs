/* Reading what is selected in another program, and writing back into it.

   Two routes, in this order, and the order is the whole point:

   1. Ask the focused element for its selected text. Nothing else is touched —
      no keystroke is simulated, and the clipboard keeps whatever the reader
      had in it.
   2. Where that comes back empty — many Electron apps and some browser
      fields answer nothing — simulate ⌘C with the clipboard bracketed around
      it.

   Both routes need the same one permission, Accessibility, and so does
   writing back. That is worth knowing before choosing between them: the
   ⌘C route is not the cheaper one in permissions, only in code. AppleScript
   through System Events is not here either, because it asks for an
   Automation consent per target program (error -1743).

   The permission is optional. Without it the reader copies the text
   themselves and presses the shortcut, and what is read is the clipboard —
   but only where something was copied since the app last looked, or a
   shortcut pressed to bring the window back would translate whatever
   happened to be copied an hour ago. The clipboard's change count says
   that without reading anything. The app looks when it starts, when it
   reads, and whenever the window is put away, which also covers anything
   copied out of the window itself.

   Writing back has no such pair. It raises the program and pastes, always.
   The symmetric-looking route — setting the focused element's selected text —
   was tried and taken out again: VS Code reports success and changes nothing,
   so the fall-back never ran and the reader saw a window disappear and no
   replacement. A route that cannot be told apart from a working one is worse
   than no route at all.

   On Windows the same two routes run through UI Automation and Ctrl+C, and
   neither needs a permission: any program in the reader's session may read
   the focused element and send keys to it. So there `trusted` is always yes
   and the clipboard-only route never runs.

   The clipboard goes through pbcopy and pbpaste rather than through a crate,
   the same way the keychain goes through `security`: no dependency, and the
   seam a Windows counterpart hangs on. The price is that only text survives
   the bracket — an image in the clipboard is lost where route 2 runs. The
   original had a wider version of the same limit. */

use serde::Serialize;

/* What one reading of a selection produced. The process id travels with the
   text because replacing needs to find its way back to the same program, and
   by then this app is in front. */
#[derive(Serialize, Clone, Default)]
pub struct Selection {
    pub text: String,
    /* 0 means "not known", which is not a failure — the text is still there,
       only the way back is missing. */
    pub source: i32,
    /* Which of the two routes answered. Shown nowhere; it is what makes the
       thing measurable in the built app. */
    pub route: String,
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use super::Selection;

    const NO: &str = "Reading a selection is not implemented on this platform.";

    pub fn trusted() -> bool {
        false
    }
    pub fn request() -> bool {
        false
    }
    pub fn open_settings() -> Result<(), String> {
        Err(NO.into())
    }
    pub fn read() -> Result<Selection, String> {
        Err(NO.into())
    }
    pub fn write(_source: i32, _text: &str) -> Result<(), String> {
        Err(NO.into())
    }
    pub fn note_clipboard() {}
    pub fn watch_front() {}
    pub fn read_from_menu() -> Result<Selection, String> {
        read()
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::Selection;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::time::{Duration, Instant};
    use windows::Win32::Foundation::{HANDLE, HGLOBAL, HWND};
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::DataExchange::{
        CloseClipboard, EmptyClipboard, GetClipboardData, GetClipboardSequenceNumber,
        OpenClipboard, SetClipboardData,
    };
    use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
    use windows::Win32::System::Ole::CF_UNICODETEXT;
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationTextPattern, SetWinEventHook, HWINEVENTHOOK,
        UIA_TextPatternId,
    };
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT,
        KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_C, VK_CONTROL, VK_LWIN, VK_MENU,
        VK_RWIN, VK_SHIFT, VK_V,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetForegroundWindow, GetWindowThreadProcessId, IsWindow,
        SetForegroundWindow, EVENT_SYSTEM_FOREGROUND, WINEVENT_OUTOFCONTEXT,
    };
    use std::sync::atomic::AtomicIsize;

    pub fn trusted() -> bool {
        true
    }
    pub fn request() -> bool {
        true
    }
    pub fn open_settings() -> Result<(), String> {
        Ok(())
    }

    /* The clipboard's sequence number, the counterpart of macOS' change
       count: asking reads nothing out of it. */
    static SEEN: AtomicU32 = AtomicU32::new(0);

    pub fn note_clipboard() {
        SEEN.store(unsafe { GetClipboardSequenceNumber() }, Ordering::Relaxed);
    }

    /* Another program may hold the clipboard open for a moment; it is asked
       again rather than read as empty. */
    fn open_clipboard() -> bool {
        for _ in 0..20 {
            if unsafe { OpenClipboard(None) }.is_ok() {
                return true;
            }
            std::thread::sleep(Duration::from_millis(10));
        }
        false
    }

    fn clipboard_read() -> String {
        if !open_clipboard() {
            return String::new();
        }
        let text = unsafe {
            match GetClipboardData(CF_UNICODETEXT.0 as u32) {
                Ok(handle) if !handle.is_invalid() => {
                    let global = HGLOBAL(handle.0);
                    let start = GlobalLock(global) as *const u16;
                    if start.is_null() {
                        String::new()
                    } else {
                        let mut length = 0;
                        while *start.add(length) != 0 {
                            length += 1;
                        }
                        let text = String::from_utf16_lossy(std::slice::from_raw_parts(start, length));
                        let _ = GlobalUnlock(global);
                        text
                    }
                }
                _ => String::new(),
            }
        };
        let _ = unsafe { CloseClipboard() };
        text
    }

    /* An empty text empties the clipboard, which is what "nothing arrived"
       is told apart by. */
    fn clipboard_write(text: &str) {
        if !open_clipboard() {
            return;
        }
        unsafe {
            let _ = EmptyClipboard();
            if !text.is_empty() {
                let wide: Vec<u16> = text.encode_utf16().chain(std::iter::once(0)).collect();
                if let Ok(global) = GlobalAlloc(GMEM_MOVEABLE, wide.len() * 2) {
                    let start = GlobalLock(global) as *mut u16;
                    if !start.is_null() {
                        std::ptr::copy_nonoverlapping(wide.as_ptr(), start, wide.len());
                        let _ = GlobalUnlock(global);
                        /* The system owns the memory once this succeeds. */
                        let _ = SetClipboardData(CF_UNICODETEXT.0 as u32, Some(HANDLE(global.0)));
                    }
                }
            }
            let _ = CloseClipboard();
        }
    }

    fn held(key: VIRTUAL_KEY) -> bool {
        (unsafe { GetAsyncKeyState(key.0 as i32) } as u16) & 0x8000 != 0
    }

    /* The shortcut is still held when it arrives, and Ctrl+C sent into it
       would reach the other program as a different combination. */
    fn wait_for_release() {
        let deadline = Instant::now() + Duration::from_millis(600);
        while Instant::now() < deadline {
            if ![VK_CONTROL, VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN].into_iter().any(held) {
                return;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
    }

    fn key(code: VIRTUAL_KEY, flags: KEYBD_EVENT_FLAGS) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT { wVk: code, dwFlags: flags, ..Default::default() },
            },
        }
    }

    fn press_with_control(code: VIRTUAL_KEY) {
        let none = KEYBD_EVENT_FLAGS(0);
        let presses = [
            key(VK_CONTROL, none),
            key(code, none),
            key(code, KEYEVENTF_KEYUP),
            key(VK_CONTROL, KEYEVENTF_KEYUP),
        ];
        unsafe { SendInput(&presses, std::mem::size_of::<INPUT>() as i32) };
    }

    /* Route 1: the focused element's selection, through UI Automation. On a
       thread of its own with a deadline, because the question crosses into
       the other program and a program that is busy does not answer it. */
    fn selected_by_automation() -> Option<String> {
        let (tell, answer) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let found = unsafe {
                let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
                (|| -> Option<String> {
                    let automation: IUIAutomation =
                        CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok()?;
                    let element = automation.GetFocusedElement().ok()?;
                    let pattern: IUIAutomationTextPattern =
                        element.GetCurrentPatternAs(UIA_TextPatternId).ok()?;
                    let ranges = pattern.GetSelection().ok()?;
                    let mut text = String::new();
                    for index in 0..ranges.Length().ok()? {
                        text.push_str(&ranges.GetElement(index).ok()?.GetText(-1).ok()?.to_string());
                    }
                    Some(text)
                })()
            };
            let _ = tell.send(found);
        });
        answer.recv_timeout(Duration::from_millis(700)).ok().flatten()
    }

    fn handle_of(source: i32) -> HWND {
        HWND(source as isize as *mut std::ffi::c_void)
    }

    fn process_of(window: HWND) -> u32 {
        let mut process = 0u32;
        unsafe { GetWindowThreadProcessId(window, Some(&mut process)) };
        process
    }

    pub fn read() -> Result<Selection, String> {
        /* The window the text is in, which is where it goes back to. A window
           handle fits in 32 bits on every version of Windows, which is what
           lets 64-bit and 32-bit programs pass them to each other. */
        let front = unsafe { GetForegroundWindow() };
        let source = front.0 as isize as i32;

        let automated = selected_by_automation();
        #[cfg(debug_assertions)]
        eprintln!("automation answered: {:?}", automated.as_ref().map(|text| text.chars().count()));
        if let Some(text) = automated {
            if !text.trim().is_empty() {
                return Ok(Selection { text, source, route: "automation".into() });
            }
        }

        /* Route 2, bracketed the same way as on macOS: emptied first, so a
           copy that did nothing is not read as the reader's last one. */
        let saved = clipboard_read();
        clipboard_write("");
        wait_for_release();
        press_with_control(VK_C);
        let deadline = Instant::now() + Duration::from_millis(500);
        let mut copied = String::new();
        while Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(25));
            copied = clipboard_read();
            if !copied.is_empty() {
                break;
            }
        }
        clipboard_write(&saved);
        note_clipboard();

        if copied.trim().is_empty() {
            return Err("empty".into());
        }
        Ok(Selection { text: copied, source, route: "clipboard".into() })
    }

    /* The program in front once the window has hidden itself, and only where
       that is still this app, the window the text came from. */
    fn front_after_hiding(source: i32) -> bool {
        let own = std::process::id();
        let deadline = Instant::now() + Duration::from_millis(600);
        while Instant::now() < deadline {
            let front = unsafe { GetForegroundWindow() };
            if !front.is_invalid() && process_of(front) != own {
                std::thread::sleep(Duration::from_millis(120));
                return true;
            }
            std::thread::sleep(Duration::from_millis(25));
        }
        raise(source)
    }

    fn raise(source: i32) -> bool {
        let window = handle_of(source);
        if source == 0 || !unsafe { IsWindow(Some(window)) }.as_bool() {
            return false;
        }
        let _ = unsafe { SetForegroundWindow(window) };
        let deadline = Instant::now() + Duration::from_millis(1500);
        while Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(25));
            if unsafe { GetForegroundWindow() } == window {
                std::thread::sleep(Duration::from_millis(120));
                return true;
            }
        }
        false
    }

    /* The program the reader was last working in. A click on the symbol in
       the notification area puts the taskbar in front, so by the time a menu
       entry asks for the selection the program holding it is no longer the
       one in front. Windows says whenever the foreground changes; the last
       program that is neither this app nor the taskbar is kept, and brought
       back in front before a menu entry reads. */
    static LAST_FRONT: AtomicIsize = AtomicIsize::new(0);

    /* The taskbar, its overflow of symbols and the desktop: in front after a
       click on them, and never where a selection is. */
    const SHELL: [&str; 6] = [
        "Shell_TrayWnd",
        "Shell_SecondaryTrayWnd",
        "NotifyIconOverflowWindow",
        "TopLevelWindowForOverflowXamlIsland",
        "Progman",
        "WorkerW",
    ];

    fn is_shell(window: HWND) -> bool {
        let mut name = [0u16; 64];
        let length = unsafe { GetClassNameW(window, &mut name) };
        let class = String::from_utf16_lossy(&name[..length.max(0) as usize]);
        SHELL.contains(&class.as_str())
    }

    unsafe extern "system" fn on_front(
        _hook: HWINEVENTHOOK,
        _event: u32,
        window: HWND,
        _object: i32,
        _child: i32,
        _thread: u32,
        _time: u32,
    ) {
        if window.is_invalid() || process_of(window) == std::process::id() || is_shell(window) {
            return;
        }
        LAST_FRONT.store(window.0 as isize, Ordering::Relaxed);
    }

    /* Called once on the main thread, whose message loop the notices are
       delivered through. */
    pub fn watch_front() {
        let front = unsafe { GetForegroundWindow() };
        unsafe { on_front(HWINEVENTHOOK::default(), 0, front, 0, 0, 0, 0) };
        let _ = unsafe {
            SetWinEventHook(
                EVENT_SYSTEM_FOREGROUND,
                EVENT_SYSTEM_FOREGROUND,
                None,
                Some(on_front),
                0,
                0,
                WINEVENT_OUTOFCONTEXT,
            )
        };
    }

    /* A menu entry's reading: the program last worked in brought back in
       front first. Where Windows refuses that, nothing is read — the window
       in front then is not the one holding the selection. */
    pub fn read_from_menu() -> Result<Selection, String> {
        let last = LAST_FRONT.load(Ordering::Relaxed);
        let source = last as i32;
        if last == 0 || !raise(source) {
            return Err("focus".into());
        }
        read()
    }

    pub fn write(source: i32, text: &str) -> Result<(), String> {
        if text.trim().is_empty() {
            return Err("empty".into());
        }
        if !front_after_hiding(source) {
            return Err("focus".into());
        }
        let saved = clipboard_read();
        clipboard_write(text);
        wait_for_release();
        press_with_control(VK_V);
        std::thread::sleep(Duration::from_millis(400));
        clipboard_write(&saved);
        note_clipboard();
        Ok(())
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::Selection;
    use std::ffi::c_void;
    use std::io::Write;
    use std::os::raw::c_char;
    use std::process::{Command, Stdio};
    use std::sync::atomic::{AtomicI64, Ordering};
    use std::time::{Duration, Instant};

    type CFTypeRef = *const c_void;
    type CFStringRef = *const c_void;
    type CFDictionaryRef = *const c_void;
    type CFAllocatorRef = *const c_void;
    type AXUIElementRef = *const c_void;
    type CFIndex = isize;
    type CFTypeID = usize;

    const UTF8: u32 = 0x0800_0100;
    const AX_OK: i32 = 0;

    /* Virtual key codes. They are positions on the keyboard, not characters —
       code 8 is the key that types C on a US layout and stays code 8 wherever
       the keyboard was made, which is exactly the property the shortcut
       setting relies on too. */
    const KEY_C: u16 = 8;
    const KEY_V: u16 = 9;
    const FLAG_COMMAND: u64 = 1 << 20;
    /* The modifiers a person can be holding. The shortcut that got us here is
       one of them, and it must be out of the way before a keystroke is
       simulated — otherwise ⌘C arrives at the other program as ⌃⌥⌘C. */
    const FLAGS_HELD: u64 = (1 << 17) | (1 << 18) | (1 << 19) | (1 << 20);

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        static kCFAllocatorDefault: CFAllocatorRef;
        static kCFBooleanTrue: CFTypeRef;
        static kCFTypeDictionaryKeyCallBacks: c_void;
        static kCFTypeDictionaryValueCallBacks: c_void;
        fn CFRelease(cf: CFTypeRef);
        fn CFGetTypeID(cf: CFTypeRef) -> CFTypeID;
        fn CFStringGetTypeID() -> CFTypeID;
        fn CFStringCreateWithBytes(
            allocator: CFAllocatorRef,
            bytes: *const u8,
            length: CFIndex,
            encoding: u32,
            external: u8,
        ) -> CFStringRef;
        fn CFStringGetLength(string: CFStringRef) -> CFIndex;
        fn CFStringGetMaximumSizeForEncoding(length: CFIndex, encoding: u32) -> CFIndex;
        fn CFStringGetCString(
            string: CFStringRef,
            buffer: *mut c_char,
            size: CFIndex,
            encoding: u32,
        ) -> u8;
        fn CFDictionaryCreate(
            allocator: CFAllocatorRef,
            keys: *const CFTypeRef,
            values: *const CFTypeRef,
            count: CFIndex,
            key_callbacks: *const c_void,
            value_callbacks: *const c_void,
        ) -> CFDictionaryRef;
    }

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        static kAXTrustedCheckOptionPrompt: CFStringRef;
        fn AXIsProcessTrusted() -> u8;
        fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> u8;
        fn AXUIElementCreateSystemWide() -> AXUIElementRef;
        fn AXUIElementCreateApplication(pid: i32) -> AXUIElementRef;
        fn AXUIElementCopyAttributeValue(
            element: AXUIElementRef,
            attribute: CFStringRef,
            value: *mut CFTypeRef,
        ) -> i32;
        fn AXUIElementSetAttributeValue(
            element: AXUIElementRef,
            attribute: CFStringRef,
            value: CFTypeRef,
        ) -> i32;
        fn AXUIElementGetPid(element: AXUIElementRef, pid: *mut i32) -> i32;
    }

    extern "C" {
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn sel_registerName(name: *const c_char) -> *const c_void;
        fn objc_msgSend();
    }

    /* How often the clipboard has changed since the system started. Asking
       reads nothing out of it, so no program's text is looked at to answer. */
    fn clipboard_count() -> i64 {
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let number: extern "C" fn(*mut c_void, *const c_void) -> i64 =
            unsafe { std::mem::transmute(send) };
        unsafe {
            let class = objc_getClass(c"NSPasteboard".as_ptr());
            if class.is_null() {
                return -1;
            }
            let board = object(class, sel_registerName(c"generalPasteboard".as_ptr()));
            if board.is_null() {
                return -1;
            }
            number(board, sel_registerName(c"changeCount".as_ptr()))
        }
    }

    /* The change count the app has already seen. */
    static SEEN: AtomicI64 = AtomicI64::new(-1);

    pub fn note_clipboard() {
        SEEN.store(clipboard_count(), Ordering::Relaxed);
    }

    /* The menu bar's menu leaves the program in front where it is, so a menu
       entry reads the way the shortcut does. */
    pub fn watch_front() {}
    pub fn read_from_menu() -> Result<Selection, String> {
        read()
    }

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceCreate(state: i32) -> *const c_void;
        fn CGEventSourceFlagsState(state: i32) -> u64;
        fn CGEventCreateKeyboardEvent(
            source: *const c_void,
            keycode: u16,
            down: u8,
        ) -> *const c_void;
        fn CGEventSetFlags(event: *const c_void, flags: u64);
        fn CGEventPost(tap: u32, event: *const c_void);
    }

    /* A CoreFoundation string that releases itself. Every attribute name below
       is one of these, and forgetting a single CFRelease in a function called
       on every reading is the kind of leak nobody ever notices. */
    struct CfString(CFStringRef);

    impl CfString {
        fn new(value: &str) -> Self {
            let bytes = value.as_bytes();
            let string = unsafe {
                CFStringCreateWithBytes(
                    kCFAllocatorDefault,
                    bytes.as_ptr(),
                    bytes.len() as CFIndex,
                    UTF8,
                    0,
                )
            };
            CfString(string)
        }
    }

    impl Drop for CfString {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe { CFRelease(self.0) };
            }
        }
    }

    fn string_from(value: CFTypeRef) -> Option<String> {
        if value.is_null() {
            return None;
        }
        unsafe {
            if CFGetTypeID(value) != CFStringGetTypeID() {
                return None;
            }
            let length = CFStringGetLength(value);
            let capacity = CFStringGetMaximumSizeForEncoding(length, UTF8) + 1;
            let mut buffer = vec![0i8; capacity as usize];
            if CFStringGetCString(value, buffer.as_mut_ptr(), capacity, UTF8) == 0 {
                return None;
            }
            let bytes: Vec<u8> = buffer
                .iter()
                .take_while(|byte| **byte != 0)
                .map(|byte| *byte as u8)
                .collect();
            String::from_utf8(bytes).ok()
        }
    }

    /* One attribute of one element. The value is released here, so callers get
       an owned Rust value and never a pointer that has to be tidied up. */
    fn attribute(element: AXUIElementRef, name: &str) -> Option<CFTypeRef> {
        if element.is_null() {
            return None;
        }
        let key = CfString::new(name);
        let mut value: CFTypeRef = std::ptr::null();
        let status = unsafe { AXUIElementCopyAttributeValue(element, key.0, &mut value) };
        if status != AX_OK || value.is_null() {
            return None;
        }
        Some(value)
    }

    fn text_attribute(element: AXUIElementRef, name: &str) -> Option<String> {
        let value = attribute(element, name)?;
        let text = string_from(value);
        unsafe { CFRelease(value) };
        text
    }

    /* The element the keystrokes of the moment would go to, wherever it is.
       Returned as a raw pointer with ownership: release it when done. */
    fn focused_element() -> Option<AXUIElementRef> {
        let system = unsafe { AXUIElementCreateSystemWide() };
        if system.is_null() {
            return None;
        }
        let element = attribute(system, "AXFocusedUIElement");
        unsafe { CFRelease(system) };
        element
    }

    fn pid_of(element: AXUIElementRef) -> i32 {
        let mut pid: i32 = 0;
        let status = unsafe { AXUIElementGetPid(element, &mut pid) };
        if status == AX_OK {
            pid
        } else {
            0
        }
    }

    /* kAXErrorAPIDisabled. Measured to be the only return code that means
       "this process may not use the accessibility API", and it only ever
       comes back from a call aimed at *another* program. */
    const AX_NOT_PERMITTED: i32 = -25211;

    /* Two questions, because one of them lies in each direction.

       `AXIsProcessTrusted` reads a cache filled at its first call inside this
       process. A reader who turns the switch on while the window is open goes
       on being told they have not, and there is no notification to listen for
       either — so a false from it is worth nothing on its own.

       The second question has to be aimed at another program. Everything
       asked of the system-wide element answers the same either way, measured:
       without the permission `AXRole` still succeeds, `AXFocusedUIElement`
       and `AXFocusedApplication` both come back "no value", and only a call
       against a window belonging to somebody else is refused outright. An
       earlier version asked the system-wide element and would have called
       every refusal a yes. */
    pub fn trusted() -> bool {
        if unsafe { AXIsProcessTrusted() != 0 } {
            return true;
        }
        let Some(other) = another_program() else {
            return false;
        };
        let app = unsafe { AXUIElementCreateApplication(other) };
        if app.is_null() {
            return false;
        }
        let key = CfString::new("AXFocusedWindow");
        let mut value: CFTypeRef = std::ptr::null();
        let status = unsafe { AXUIElementCopyAttributeValue(app, key.0, &mut value) };
        if !value.is_null() {
            unsafe { CFRelease(value) };
        }
        unsafe { CFRelease(app) };
        /* Anything but the refusal means the door is open, "that program has
           no focused window" very much included. */
        status != AX_NOT_PERMITTED
    }

    /* Somebody else's process, to ask a question about. The Finder is the one
       thing running on every Mac with a desktop, and it is looked up afresh
       rather than remembered — a stale process id would answer "not found"
       and be read as permission. */
    fn another_program() -> Option<i32> {
        let out = Command::new("pgrep").args(["-n", "-x", "Finder"]).output().ok()?;
        String::from_utf8_lossy(&out.stdout).trim().parse().ok().filter(|pid| *pid > 0)
    }

    /* The system's own consent dialog. It is asked for deliberately rather
       than avoided: it puts the app into the Accessibility list, so what is
       left for the reader is one switch rather than finding and adding a
       binary by hand. The window explains what it is for before this runs. */
    pub fn request() -> bool {
        unsafe {
            let keys: [CFTypeRef; 1] = [kAXTrustedCheckOptionPrompt];
            let values: [CFTypeRef; 1] = [kCFBooleanTrue];
            let options = CFDictionaryCreate(
                kCFAllocatorDefault,
                keys.as_ptr(),
                values.as_ptr(),
                1,
                &kCFTypeDictionaryKeyCallBacks,
                &kCFTypeDictionaryValueCallBacks,
            );
            let granted = AXIsProcessTrustedWithOptions(options) != 0;
            if !options.is_null() {
                CFRelease(options);
            }
            granted
        }
    }

    pub fn open_settings() -> Result<(), String> {
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .status()
            .map_err(|error| error.to_string())
            .and_then(|status| {
                if status.success() {
                    Ok(())
                } else {
                    Err("System Settings did not open.".into())
                }
            })
    }

    /* The locale has to be said out loud. A program started from the Finder
       inherits no LANG, and pbpaste then falls back to Mac Roman: é comes
       back as the single byte 8e, which is not UTF-8 at all, and every
       accented letter in the text turns into a replacement character. It
       looks like a bug in the reading and is a bug in the asking. */
    fn clipboard_read() -> String {
        Command::new("pbpaste")
            .env("LC_CTYPE", "UTF-8")
            .output()
            .map(|out| String::from_utf8_lossy(&out.stdout).into_owned())
            .unwrap_or_default()
    }

    fn clipboard_write(text: &str) {
        let child = Command::new("pbcopy")
            .env("LC_CTYPE", "UTF-8")
            .stdin(Stdio::piped())
            .spawn();
        if let Ok(mut child) = child {
            if let Some(pipe) = child.stdin.as_mut() {
                let _ = pipe.write_all(text.as_bytes());
            }
            let _ = child.wait();
        }
    }

    /* The shortcut that got us here is still held down at this moment. Posting
       ⌘C into that would deliver ⌃⌥⌘C to the other program, which is somebody
       else's shortcut and not a copy. So the keys are waited out first —
       normally a few dozen milliseconds, the time it takes to lift a finger. */
    fn wait_for_release() {
        let deadline = Instant::now() + Duration::from_millis(600);
        while Instant::now() < deadline {
            if unsafe { CGEventSourceFlagsState(0) } & FLAGS_HELD == 0 {
                return;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
    }

    fn press_with_command(key: u16) {
        unsafe {
            let source = CGEventSourceCreate(0);
            for down in [1u8, 0u8] {
                let event = CGEventCreateKeyboardEvent(source, key, down);
                if event.is_null() {
                    continue;
                }
                CGEventSetFlags(event, FLAG_COMMAND);
                /* Posted where a keyboard would deliver it, so the program in
                   front handles it exactly as it handles a person typing. */
                CGEventPost(0, event);
                CFRelease(event);
            }
            if !source.is_null() {
                CFRelease(source);
            }
        }
    }

    pub fn read() -> Result<Selection, String> {
        if !trusted() {
            return read_copied();
        }

        let element = focused_element();
        let source = element.map(pid_of).unwrap_or(0);

        /* Route 1. Nothing is simulated and nothing is overwritten, so it is
           tried whenever there is a focused element at all. */
        if let Some(element) = element {
            let selected = text_attribute(element, "AXSelectedText");
            unsafe { CFRelease(element) };
            if let Some(text) = selected {
                if !text.trim().is_empty() {
                    return Ok(Selection {
                        text,
                        source,
                        route: "accessibility".into(),
                    });
                }
            }
        }

        /* Route 2. The clipboard is emptied first so that "nothing arrived"
           can be told apart from "the selection happens to be what was in the
           clipboard already" — without that, a failed copy silently reads the
           reader's last copied text and translates it instead. */
        let saved = clipboard_read();
        clipboard_write("");
        wait_for_release();
        press_with_command(KEY_C);

        /* The copy is not finished when the keystroke returns. The pause
           ends as soon as something arrives instead of always waiting the
           full time. */
        let deadline = Instant::now() + Duration::from_millis(500);
        let mut copied = String::new();
        while Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(25));
            copied = clipboard_read();
            if !copied.is_empty() {
                break;
            }
        }

        clipboard_write(&saved);

        if copied.trim().is_empty() {
            return Err("empty".into());
        }
        Ok(Selection {
            text: copied,
            source,
            route: "clipboard".into(),
        })
    }

    /* Without the permission: what the reader copied, where it is new.
       "nothing-copied" is not a failure — it is also how a reader brings the
       window back. */
    fn read_copied() -> Result<Selection, String> {
        let count = clipboard_count();
        if count == SEEN.swap(count, Ordering::Relaxed) {
            return Err("nothing-copied".into());
        }
        let text = clipboard_read();
        if text.trim().is_empty() {
            return Err("nothing-copied".into());
        }
        Ok(Selection {
            text,
            source: 0,
            route: "copied".into(),
        })
    }

    /* The program that takes the front once the window has hidden itself —
       macOS normally hands it back to whatever the reader was last in, which
       is where they want the text: they may have clicked into another field
       since the text was read. Only where nothing but this app holds the
       focus after a moment is the program the text came from raised. */
    fn front_after_hiding(source: i32) -> bool {
        let own = std::process::id() as i32;
        let deadline = Instant::now() + Duration::from_millis(600);
        while Instant::now() < deadline {
            if let Some(element) = focused_element() {
                let focused = pid_of(element);
                unsafe { CFRelease(element) };
                if focused > 0 && focused != own {
                    std::thread::sleep(Duration::from_millis(120));
                    return true;
                }
            }
            std::thread::sleep(Duration::from_millis(25));
        }
        raise(source)
    }

    /* Bring a program back to the front and wait until it actually is there.
       Measured: 0.35 s was not enough and the keystroke
       arrived before the window would take it, leaving the text unchanged
       with no error and no trace. Asking instead of waiting a fixed time is
       both quicker in the normal case and safer in the slow one. */
    fn raise(source: i32) -> bool {
        if source <= 0 {
            return false;
        }
        let app = unsafe { AXUIElementCreateApplication(source) };
        if !app.is_null() {
            let key = CfString::new("AXFrontmost");
            /* Not every program lets this be set — VS Code is one that does
               not. Refusing here would have meant giving up before trying,
               and the reader saw a window disappear and nothing happen. The
               answer is asked for below rather than deduced from this: after
               the window hides, macOS usually hands the front back on its
               own, and then there was never anything to raise. */
            let _ = unsafe { AXUIElementSetAttributeValue(app, key.0, kCFBooleanTrue) };
            unsafe { CFRelease(app) };
        }

        let deadline = Instant::now() + Duration::from_millis(1500);
        while Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(25));
            if let Some(element) = focused_element() {
                let focused = pid_of(element);
                unsafe { CFRelease(element) };
                if focused == source {
                    /* A window that has just come forward is not always ready
                        for the very next keystroke. */
                    std::thread::sleep(Duration::from_millis(120));
                    return true;
                }
            }
        }
        false
    }

    pub fn write(source: i32, text: &str) -> Result<(), String> {
        if !trusted() {
            return Err("accessibility".into());
        }
        if text.trim().is_empty() {
            return Err("empty".into());
        }
        if !front_after_hiding(source) {
            return Err("focus".into());
        }

        /* The clipboard and ⌘V, always — unlike reading, which has a quiet
           route worth trying first.

           Setting AXSelectedText on the focused element looked like the
           symmetric answer and is not one: VS Code returns success and
           changes nothing, so the fall-back never ran and the reader saw a
           window vanish and no replacement. A route that cannot be told apart
           from a working one is worse than no route. Every tool that does
           this for a living pastes.

           Replacing is a deliberate press on a button rather than something
           that happens on every shortcut, so borrowing the clipboard for a
           moment is a fair price here in a way it is not there. */
        let saved = clipboard_read();
        clipboard_write(text);
        wait_for_release();
        press_with_command(KEY_V);
        /* Long enough for the other program to have taken the clipboard's
           contents before they are put back. Too short and the paste picks up
           what was there before, which reads as "it replaced it with the
           wrong thing". */
        std::thread::sleep(Duration::from_millis(400));
        clipboard_write(&saved);
        Ok(())
    }
}

pub use platform::{
    note_clipboard, open_settings, read, read_from_menu, request, trusted, watch_front, write,
};

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
    /* The text around a word a force click read, so the word can be read in
    its sentence. None wherever the text was selected. */
    pub context: Option<Around>,
}

/* A paragraph, or the text near a word where a program gives no
paragraph, and where the word starts in it — in UTF-16 units, which is
what a JavaScript string counts, and what the accessibility API counts
too. */
#[derive(Serialize, Clone, Default, Debug, PartialEq)]
pub struct Around {
    pub text: String,
    pub at: usize,
    /* Whether the program's text goes on after this one: then its last
    sentence may be half of one, and the window does not step on to it. */
    pub cut: bool,
}

/* A box on the screen around what a force click read, in the accessibility
tree's points: from the top left of the main display, downwards. */
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Mark {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/* What a force click hands on: the word under the pointer, or the
selection it landed in, and the boxes it stands in — one per line. Called
on a thread of its own. */
pub type ForceClick = std::sync::Arc<dyn Fn(Selection, Vec<Mark>) + Send + Sync>;

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
    pub fn watch_force_click(_on: bool, _act: super::ForceClick) -> bool {
        false
    }
    pub fn read_under_pointer(_sentence: bool) -> Option<(Selection, Vec<super::Mark>)> {
        None
    }
    pub fn sentence_marks(_start: usize, _end: usize) -> Vec<super::Mark> {
        Vec::new()
    }
    pub fn use_permission(_on: bool) {}
}

/* Where a selection stands in a text, nearest the place the pointer
found — in UTF-16 units, as `Around` counts. None where it is further
away than its own length and a little: then it is not the one under
the pointer. */
#[cfg_attr(not(any(target_os = "macos", target_os = "windows")), allow(dead_code))]
fn selection_near(text: &str, pointer: usize, selected: &str) -> Option<usize> {
    let text: Vec<u16> = text.encode_utf16().collect();
    let needle: Vec<u16> = selected.encode_utf16().collect();
    if needle.is_empty() || needle.len() > text.len() {
        return None;
    }
    let reach = needle.len() + 8;
    text.windows(needle.len())
        .enumerate()
        .filter(|(_, window)| *window == needle.as_slice())
        .map(|(at, _)| at)
        .filter(|&at| at <= pointer + reach && pointer <= at + reach)
        .min_by_key(|&at| at.abs_diff(pointer))
}

#[cfg(target_os = "windows")]
mod platform {
    use super::Selection;
    use std::sync::atomic::AtomicIsize;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::time::{Duration, Instant};
    use windows::Win32::Foundation::POINT;
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
    use windows::Win32::System::Ole::{
        SafeArrayAccessData, SafeArrayDestroy, SafeArrayGetLBound, SafeArrayGetUBound,
        SafeArrayUnaccessData,
    };
    use windows::Win32::UI::Accessibility::{
        CUIAutomation, IUIAutomation, IUIAutomationElement, IUIAutomationTextPattern,
        IUIAutomationTextRange, SetWinEventHook, TextPatternRangeEndpoint_End,
        TextPatternRangeEndpoint_Start, TextUnit_Character, TextUnit_Word, UIA_TextPatternId,
        HWINEVENTHOOK,
    };
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
        KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_C, VK_CONTROL, VK_LWIN, VK_MENU, VK_RWIN, VK_SHIFT, VK_V,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetAncestor, GetClassNameW, GetCursorPos, GetForegroundWindow, GetWindowThreadProcessId,
        IsWindow, SetForegroundWindow, WindowFromPoint, EVENT_SYSTEM_FOREGROUND, GA_ROOT,
        WINEVENT_OUTOFCONTEXT,
    };

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
                        let text =
                            String::from_utf16_lossy(std::slice::from_raw_parts(start, length));
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
            if ![VK_CONTROL, VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN]
                .into_iter()
                .any(held)
            {
                return;
            }
            std::thread::sleep(Duration::from_millis(20));
        }
    }

    fn key(code: VIRTUAL_KEY, flags: KEYBD_EVENT_FLAGS) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: code,
                    dwFlags: flags,
                    ..Default::default()
                },
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
    /* A selection takes the text around it along: for the sentence of one
    to three words, and for stepping on to the sentence after a longer one,
    which is lit up from the range kept here. */
    fn selected_by_automation() -> Option<(String, Option<super::Around>)> {
        in_time(Duration::from_millis(700), || unsafe {
            let automation = automation()?;
            let element = automation.GetFocusedElement().ok()?;
            /* Edge's PDF view focuses the page, a group without text of
            its own; the document above it has the selection (measured). */
            let pattern = text_pattern(&automation, element)?;
            let ranges = pattern.GetSelection().ok()?;
            let count = ranges.Length().ok()?;
            let mut text = String::new();
            for index in 0..count {
                text.push_str(&ranges.GetElement(index).ok()?.GetText(-1).ok()?.to_string());
            }
            let (context, wide) = (count == 1)
                .then(|| around(&ranges.GetElement(0).ok()?))
                .flatten()
                .map_or((None, None), |(around, wide)| (Some(around), Some(wide)));
            *LAST_AROUND.lock().unwrap() = wide.map(Held);
            Some((text, context))
        })
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
        eprintln!(
            "automation answered: {:?}",
            automated.as_ref().map(|(text, _)| text.chars().count())
        );
        if let Some((text, context)) = automated {
            if !text.trim().is_empty() {
                let context = context.or_else(|| around_pointer(&text));
                return Ok(Selection {
                    text,
                    source,
                    route: "automation".into(),
                    context,
                });
            }
        }

        /* Route 2, bracketed the same way as on macOS: emptied first, so a
        copy that did nothing is not read as the reader's last one. */
        *LAST_AROUND.lock().unwrap() = None;
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
        let context = around_pointer(&copied);
        Ok(Selection {
            text: copied,
            source,
            route: "clipboard".into(),
            context,
        })
    }

    /* The text goes where the reader was last working: they may have
    clicked into another program's field since the text was read, and a
    pinned window stays standing in front while they do. Only where no such
    program is known is it the one the text came from. Brought in front
    and waited for, since this app is in front while its button is being
    pressed. */
    fn front_for_writing(source: i32) -> bool {
        let last = LAST_FRONT.load(Ordering::Relaxed) as i32;
        let target = if last != 0 && unsafe { IsWindow(Some(handle_of(last))) }.as_bool() {
            last
        } else {
            source
        };
        if target != 0 && unsafe { GetForegroundWindow() } == handle_of(target) {
            std::thread::sleep(Duration::from_millis(120));
            return true;
        }
        raise(target)
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

    /* A force click is the Mac's; Windows has nothing it could hear. */
    pub fn watch_force_click(_on: bool, _act: super::ForceClick) -> bool {
        false
    }

    /* ---- What is under the pointer, and the text around a word ----

    Through UI Automation, the way the selection is read: the element at the
    pointer, or the nearest one above it with a text pattern, is asked for
    the range at the point, widened to its word. The word's boxes have to
    hold the pointer, as on the Mac: a program may answer the nearest word
    for a point on empty space. Its boxes come in the screen's pixels, which
    is what the highlight counts in here.

    The text around a word is its range moved out by characters on either
    side, and where the word starts in it is counted from the text between,
    in the units a JavaScript string counts. For the sentence the range is
    kept until the page has cut the sentence out of it (sentence_marks). */

    struct Held(IUIAutomationTextRange);

    /* Kept between reading the sentence and lighting it up, which is on
    another thread; both are in the multithreaded apartment. */
    unsafe impl Send for Held {}

    impl Held {
        /* Taken out whole, so a closure moves the Held and not its field. */
        fn range(self) -> IUIAutomationTextRange {
            self.0
        }
    }

    static LAST_AROUND: std::sync::Mutex<Option<Held>> = std::sync::Mutex::new(None);

    /* Characters taken either side of a word, as on the Mac, and how many
    after it: the window steps on through them a sentence at a time. */
    const AROUND: i32 = 300;
    const AHEAD: i32 = 3000;

    fn automation() -> Option<IUIAutomation> {
        unsafe {
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
            CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER).ok()
        }
    }

    /* A question that crosses into another program, on a thread of its own
    with a deadline: a program that is busy does not answer. */
    fn in_time<T: Send + 'static>(
        wait: Duration,
        ask: impl FnOnce() -> Option<T> + Send + 'static,
    ) -> Option<T> {
        let (tell, answer) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let _ = tell.send(ask());
        });
        answer.recv_timeout(wait).ok().flatten()
    }

    fn text_of(range: &IUIAutomationTextRange) -> Option<String> {
        unsafe { range.GetText(-1) }
            .ok()
            .map(|text| text.to_string())
    }

    /* A range's boxes, one per line. */
    fn boxes(range: &IUIAutomationTextRange) -> Vec<super::Mark> {
        unsafe {
            let Ok(array) = range.GetBoundingRectangles() else {
                return Vec::new();
            };
            if array.is_null() {
                return Vec::new();
            }
            let mut found = Vec::new();
            let lower = SafeArrayGetLBound(array, 1).unwrap_or(0);
            let upper = SafeArrayGetUBound(array, 1).unwrap_or(-1);
            let mut data: *mut std::ffi::c_void = std::ptr::null_mut();
            if upper >= lower && SafeArrayAccessData(array, &mut data).is_ok() {
                let values =
                    std::slice::from_raw_parts(data as *const f64, (upper - lower + 1) as usize);
                for rect in values.chunks_exact(4) {
                    found.push(super::Mark {
                        x: rect[0],
                        y: rect[1],
                        width: rect[2],
                        height: rect[3],
                    });
                }
                let _ = SafeArrayUnaccessData(array);
            }
            let _ = SafeArrayDestroy(array);
            found
        }
    }

    /* A point on the edge of a box counts as in it. */
    fn holds(mark: &super::Mark, point: POINT) -> bool {
        let (x, y) = (point.x as f64, point.y as f64);
        x >= mark.x - 1.0
            && x <= mark.x + mark.width + 1.0
            && y >= mark.y - 1.0
            && y <= mark.y + mark.height + 1.0
    }

    /* The text around a range, where the range starts in it, and the wider
    range itself. */
    fn around(range: &IUIAutomationTextRange) -> Option<(super::Around, IUIAutomationTextRange)> {
        unsafe {
            let wide = range.Clone().ok()?;
            wide.MoveEndpointByUnit(TextPatternRangeEndpoint_Start, TextUnit_Character, -AROUND)
                .ok()?;
            let ahead = wide
                .MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, AHEAD)
                .ok()?;
            let before = wide.Clone().ok()?;
            before
                .MoveEndpointByRange(
                    TextPatternRangeEndpoint_End,
                    range,
                    TextPatternRangeEndpoint_Start,
                )
                .ok()?;
            let at = text_of(&before)?.encode_utf16().count();
            let text = text_of(&wide)?;
            let cut = ahead >= AHEAD;
            Some((super::Around { text, at, cut }, wide))
        }
    }

    /* A selection short enough to be looked up as a word: one to three
    words. */
    fn looked_up(selected: &str) -> bool {
        (1..=3).contains(&selected.split_whitespace().count())
    }

    /* The nearest element at or above one that has a text pattern. */
    fn text_pattern(
        automation: &IUIAutomation,
        element: IUIAutomationElement,
    ) -> Option<IUIAutomationTextPattern> {
        let walker = unsafe { automation.ControlViewWalker() }.ok()?;
        let mut current = element;
        for _ in 0..12 {
            if let Ok(pattern) = unsafe {
                current.GetCurrentPatternAs::<IUIAutomationTextPattern>(UIA_TextPatternId)
            } {
                return Some(pattern);
            }
            current = unsafe { walker.GetParentElement(&current) }.ok()?;
        }
        None
    }

    /* A word range narrowed to the word: a program's word takes the space
    after it along, and may take a quotation mark or a comma. */
    fn narrowed(range: &IUIAutomationTextRange) -> Option<String> {
        let text = text_of(range)?;
        let lead = text.chars().take_while(|c| !c.is_alphanumeric()).count() as i32;
        let trail = text
            .chars()
            .rev()
            .take_while(|c| !c.is_alphanumeric())
            .count() as i32;
        let word: String = text
            .trim_matches(|c: char| !c.is_alphanumeric())
            .to_string();
        if word.is_empty() {
            return None;
        }
        unsafe {
            if lead > 0 {
                range
                    .MoveEndpointByUnit(TextPatternRangeEndpoint_Start, TextUnit_Character, lead)
                    .ok()?;
            }
            if trail > 0 {
                range
                    .MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, -trail)
                    .ok()?;
            }
        }
        Some(text_of(range).filter(|now| now == &word).unwrap_or(word))
    }

    /* The word whose boxes hold the point, its text and its boxes. Edge's
    PDF view answers a point on a link with the word before it (measured),
    so where the word at the point does not hold it, the words next to it
    are asked, two either side. */
    fn word_holding(
        pattern: &IUIAutomationTextPattern,
        point: POINT,
    ) -> Option<(IUIAutomationTextRange, String, Vec<super::Mark>)> {
        let found = unsafe { pattern.RangeFromPoint(point) }.ok()?;
        unsafe { found.ExpandToEnclosingUnit(TextUnit_Word) }.ok()?;
        for step in [0, 1, -1, 2, -2] {
            let range = unsafe { found.Clone() }.ok()?;
            if step != 0 && unsafe { range.Move(TextUnit_Word, step) }.ok()? != step {
                continue;
            }
            let Some(word) = narrowed(&range) else {
                continue;
            };
            let marks = boxes(&range);
            if marks.iter().any(|mark| holds(mark, point)) {
                return Some((range, word, marks));
            }
        }
        None
    }

    /* The text around a selection whose place UI Automation does not say,
    from the text under the pointer, which has just selected it — as on the
    Mac (see there). Taken only where the selection stands at the pointer. */
    fn around_pointer(selected: &str) -> Option<super::Around> {
        let selected = selected.trim().to_string();
        if !looked_up(&selected) {
            return None;
        }
        let mut point = POINT::default();
        unsafe { GetCursorPos(&mut point) }.ok()?;
        in_time(Duration::from_millis(700), move || {
            let automation = automation()?;
            let element = unsafe { automation.ElementFromPoint(point) }.ok()?;
            if unsafe { element.CurrentProcessId() }.ok()? as u32 == std::process::id() {
                return None;
            }
            let pattern = text_pattern(&automation, element)?;
            let (range, _, _) = word_holding(&pattern, point)?;
            let (around, _) = around(&range)?;
            let at = super::selection_near(&around.text, around.at, &selected)?;
            Some(super::Around { at, ..around })
        })
    }

    /* The word under the pointer, for its shortcut, with its boxes; or,
    for the sentence's, the word and the text around it, the sentence's
    boxes asked for once the window has cut it out. Nothing where there is
    no text under the pointer. */
    pub fn read_under_pointer(sentence: bool) -> Option<(Selection, Vec<super::Mark>)> {
        let mut point = POINT::default();
        unsafe { GetCursorPos(&mut point) }.ok()?;
        let window = unsafe { GetAncestor(WindowFromPoint(point), GA_ROOT) };
        let source = window.0 as isize as i32;
        in_time(Duration::from_millis(1500), move || {
            let automation = automation()?;
            let element = unsafe { automation.ElementFromPoint(point) }.ok()?;
            if unsafe { element.CurrentProcessId() }.ok()? as u32 == std::process::id() {
                return None;
            }
            let pattern = text_pattern(&automation, element)?;
            let (range, word, marks) = word_holding(&pattern, point)?;
            let (context, wide) =
                around(&range).map_or((None, None), |(around, wide)| (Some(around), Some(wide)));
            let selection = Selection {
                text: word,
                source,
                route: if sentence {
                    "pointer-sentence"
                } else {
                    "pointer-word"
                }
                .into(),
                context,
            };
            /* Kept for the word too: a program may give one character of a
            Chinese word as the word, and the page lights up the whole word
            it belongs to. */
            *LAST_AROUND.lock().unwrap() = wide.map(Held);
            if !sentence {
                return Some((selection, marks));
            }
            selection.context.as_ref()?;
            Some((selection, Vec::new()))
        })
    }

    /* The boxes of the stretch [start, end) of the text around the last
    word or sentence read under the pointer, moved to by characters. */
    pub fn sentence_marks(start: usize, end: usize) -> Vec<super::Mark> {
        /* A copy of it: the range stays for the next sentence stepped to. */
        let held = LAST_AROUND
            .lock()
            .unwrap()
            .as_ref()
            .and_then(|held| unsafe { held.0.Clone() }.ok());
        let Some(held) = held.map(Held) else {
            return Vec::new();
        };
        if end <= start {
            return Vec::new();
        }
        in_time(Duration::from_millis(1500), move || {
            let _ = automation()?;
            let wide = held.range();
            unsafe {
                let stretch = wide.Clone().ok()?;
                stretch
                    .MoveEndpointByRange(
                        TextPatternRangeEndpoint_End,
                        &stretch,
                        TextPatternRangeEndpoint_Start,
                    )
                    .ok()?;
                stretch
                    .MoveEndpointByUnit(
                        TextPatternRangeEndpoint_End,
                        TextUnit_Character,
                        end as i32,
                    )
                    .ok()?;
                stretch
                    .MoveEndpointByUnit(
                        TextPatternRangeEndpoint_Start,
                        TextUnit_Character,
                        start as i32,
                    )
                    .ok()?;
                Some(boxes(&stretch))
            }
        })
        .unwrap_or_default()
    }

    /* Windows asks no permission, so there is nothing to leave unused. */
    pub fn use_permission(_on: bool) {}

    pub fn write(source: i32, text: &str) -> Result<(), String> {
        if text.trim().is_empty() {
            return Err("empty".into());
        }
        if !front_for_writing(source) {
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

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGWindowListCopyWindowInfo(option: u32, relative_to: u32) -> CFTypeRef;
        static kCGWindowLayer: CFStringRef;
        static kCGWindowOwnerPID: CFStringRef;
        static kCGWindowAlpha: CFStringRef;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFArrayGetCount(array: CFTypeRef) -> CFIndex;
        fn CFArrayGetValueAtIndex(array: CFTypeRef, index: CFIndex) -> CFTypeRef;
        fn CFDictionaryGetValue(dictionary: CFTypeRef, key: CFTypeRef) -> CFTypeRef;
        fn CFNumberGetValue(number: CFTypeRef, kind: i32, value: *mut c_void) -> u8;
    }

    /* The program the reader was last working in, other than this app —
    where a translation is written. It owns the frontmost ordinary window
    on screen: a click into a program brings its window to the top of the
    ordinary ones, and a pinned window floats above them without taking
    that place. Asked at the moment of writing; the system's own "front
    application", asked from a thread of this app's, lagged behind and
    named the program before. */
    fn last_front() -> i32 {
        const ON_SCREEN_ONLY: u32 = 1 << 0;
        const WITHOUT_DESKTOP: u32 = 1 << 4;
        const SINT32: i32 = 3;
        const DOUBLE: i32 = 13;
        let own = std::process::id() as i32;
        let list = unsafe { CGWindowListCopyWindowInfo(ON_SCREEN_ONLY | WITHOUT_DESKTOP, 0) };
        if list.is_null() {
            return 0;
        }
        let mut found = 0;
        for index in 0..unsafe { CFArrayGetCount(list) } {
            let window = unsafe { CFArrayGetValueAtIndex(list, index) };
            let number = |key: CFStringRef| unsafe {
                let value = CFDictionaryGetValue(window, key);
                let mut out: i32 = -1;
                if !value.is_null() {
                    CFNumberGetValue(value, SINT32, &mut out as *mut i32 as *mut c_void);
                }
                out
            };
            let alpha = unsafe {
                let value = CFDictionaryGetValue(window, kCGWindowAlpha);
                let mut out: f64 = 1.0;
                if !value.is_null() {
                    CFNumberGetValue(value, DOUBLE, &mut out as *mut f64 as *mut c_void);
                }
                out
            };
            let pid = number(unsafe { kCGWindowOwnerPID });
            if number(unsafe { kCGWindowLayer }) == 0 && alpha > 0.0 && pid > 0 && pid != own {
                found = pid;
                break;
            }
        }
        unsafe { CFRelease(list) };
        found
    }

    pub fn watch_front() {}

    /* The menu bar's menu leaves the program in front where it is, so a menu
    entry reads the way the shortcut does. */
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
    Returned as a raw pointer with ownership: release it when done.

    Asked of the whole system first, then of the program in front: the
    system answered "cannot complete" for Preview with a PDF, where Preview
    itself named its document at once (measured, macOS 26), and without it
    the selection came by ⌘C and without the text around it. */
    fn focused_element() -> Option<AXUIElementRef> {
        let system = unsafe { AXUIElementCreateSystemWide() };
        if system.is_null() {
            return None;
        }
        let element = attribute(system, "AXFocusedUIElement");
        unsafe { CFRelease(system) };
        element.or_else(|| {
            let pid = last_front();
            if pid <= 0 {
                return None;
            }
            let program = unsafe { AXUIElementCreateApplication(pid) };
            if program.is_null() {
                return None;
            }
            let element = attribute(program, "AXFocusedUIElement");
            unsafe { CFRelease(program) };
            element
        })
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
        let out = Command::new("pgrep")
            .args(["-n", "-x", "Finder"])
            .output()
            .ok()?;
        String::from_utf8_lossy(&out.stdout)
            .trim()
            .parse()
            .ok()
            .filter(|pid| *pid > 0)
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

    /* Whether the reader wants the permission used for the selection — the
    switch in the settings. Off, the shortcut reads what was copied and
    nothing is inserted, whatever System Settings says; what is under the
    pointer has shortcuts and a switch of its own and asks only whether the
    permission is there. */
    static DIRECT: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(true);

    pub fn use_permission(on: bool) {
        DIRECT.store(on, Ordering::Relaxed);
    }

    fn permitted() -> bool {
        DIRECT.load(Ordering::Relaxed) && trusted()
    }

    pub fn read() -> Result<Selection, String> {
        if !permitted() {
            return read_copied();
        }

        let element = focused_element();
        let source = element.map(pid_of).unwrap_or(0);
        /* What stood under the pointer before is not where this selection's
        sentences are. */
        *LAST_ANCHOR.lock().unwrap() = None;

        /* Route 1. Nothing is simulated and nothing is overwritten, so it is
        tried whenever there is a focused element at all. */
        if let Some(element) = element {
            let selected = text_attribute(element, "AXSelectedText")
                .filter(|text| !text.trim().is_empty())
                .or_else(|| page_selected_text(element));
            let (context, placed) = selected
                .as_deref()
                .and_then(|text| {
                    selection_around(element)
                        .or_else(|| around_pointer(text).map(|around| (around, None)))
                })
                .map_or((None, None), |(around, placed)| (Some(around), placed));
            *LAST_ANCHOR.lock().unwrap() = placed;
            unsafe { CFRelease(element) };
            if let Some(text) = selected {
                if !text.trim().is_empty() {
                    return Ok(Selection {
                        text,
                        source,
                        route: "accessibility".into(),
                        context,
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
        let context = around_pointer(&copied);
        Ok(Selection {
            text: copied,
            source,
            route: "clipboard".into(),
            context,
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
            context: None,
        })
    }

    /* The text goes where the reader was last working: they may have
    clicked into another program's field since the text was read, and a
    pinned window stays standing in front while they do. Only where no such
    program is known is it the one the text came from. */
    fn front_for_writing(source: i32) -> bool {
        let last = last_front();
        let target = if last > 0 { last } else { source };
        if let Some(element) = focused_element() {
            let focused = pid_of(element);
            unsafe { CFRelease(element) };
            if focused > 0 && focused == target {
                std::thread::sleep(Duration::from_millis(120));
                return true;
            }
        }
        raise(target)
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
        if !permitted() {
            return Err("accessibility".into());
        }
        if text.trim().is_empty() {
            return Err("empty".into());
        }
        if !front_for_writing(source) {
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
    /* ---- A force click: the word under the pointer, or the selection it
    lands in ----

    Heard through a listening event tap, the one public way the pressure of
    a click in another program reaches this one; a global NSEvent monitor
    gets the ordinary clicks and never the pressure. The tap only listens —
    it takes nothing away, so the program under the pointer does with the
    click whatever it does anyway — and it asks for pressure events alone.
    It needs the same permission as reading a selection, and is made only
    once that permission is there: one made before would hear nothing.

    What is under the pointer is asked the way the reading of a selection
    asks, through the accessibility tree, and programs answer three ways:
    a text marker at a position (Safari), a character index at a position
    (TextEdit, Word), or neither — then the element's own text is walked
    word by word until one's box holds the pointer (Chrome, Firefox,
    Preview). Every answer is checked against the pointer: several programs
    answer the start of the text, or the nearest word, for a point on empty
    space. Words are cut by CFStringTokenizer, so no language is assumed.

    The selection is looked at first, before the button comes up again —
    a click inside a selection clears it in many programs on release.

    Chrome, Firefox and Word keep their tree to themselves until told an
    assistive program is reading. That is said to a program once, and
    only when nothing could be read under the pointer: the programs that
    answer anyway are never put into that mode, which some of them run
    slower in. The tree takes a while to fill after that, so the same
    point is asked again for two and a half seconds, which is what the
    slowest of them was measured to need. */

    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    struct CGPoint {
        x: f64,
        y: f64,
    }

    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    struct CGSize {
        width: f64,
        height: f64,
    }

    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    struct CGRect {
        origin: CGPoint,
        size: CGSize,
    }

    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    struct CFRange {
        location: CFIndex,
        length: CFIndex,
    }

    const AX_VALUE_POINT: u32 = 1;
    const AX_VALUE_SIZE: u32 = 2;
    const AX_VALUE_RECT: u32 = 3;
    const AX_VALUE_RANGE: u32 = 4;
    const CF_NUMBER_INDEX: i32 = 14;
    const TOKENIZER_WORD_BOUNDARY: usize = 4;
    /* NSEventTypePressure: what AppKit calls the event, whatever kind the
    tap was handed it as. */
    const PRESSURE: u32 = 34;
    /* What the tap asks for. Pressure reaches a tap as a gesture event
    (NSEventTypeGesture, 29), measured in the built app; asked for by its
    own bit alone, nothing came. Its own bit is asked for too. */
    const GESTURE: u32 = 29;
    const LISTENED: u64 = (1 << GESTURE) | (1 << PRESSURE);
    const TAP_DISABLED_BY_TIMEOUT: u32 = 0xFFFF_FFFE;
    const TAP_DISABLED_BY_INPUT: u32 = 0xFFFF_FFFF;

    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXUIElementCopyElementAtPosition(
            application: AXUIElementRef,
            x: f32,
            y: f32,
            element: *mut AXUIElementRef,
        ) -> i32;
        fn AXUIElementCopyParameterizedAttributeValue(
            element: AXUIElementRef,
            attribute: CFStringRef,
            parameter: CFTypeRef,
            value: *mut CFTypeRef,
        ) -> i32;
        fn AXUIElementSetMessagingTimeout(element: AXUIElementRef, seconds: f32) -> i32;
        fn AXValueCreate(kind: u32, value: *const c_void) -> CFTypeRef;
        fn AXValueGetValue(value: CFTypeRef, kind: u32, out: *mut c_void) -> u8;
        fn AXValueGetTypeID() -> CFTypeID;
        fn AXTextMarkerRangeGetTypeID() -> CFTypeID;
        fn AXTextMarkerRangeCopyStartMarker(range: CFTypeRef) -> CFTypeRef;
        fn AXTextMarkerRangeCopyEndMarker(range: CFTypeRef) -> CFTypeRef;
        fn CFURLGetString(url: CFTypeRef) -> CFStringRef;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        static kCFTypeArrayCallBacks: c_void;
        static kCFRunLoopCommonModes: CFStringRef;
        fn CFRetain(cf: CFTypeRef) -> CFTypeRef;
        fn CFEqual(first: CFTypeRef, second: CFTypeRef) -> u8;
        fn CFAttributedStringGetString(string: CFTypeRef) -> CFStringRef;
        fn CFNumberGetTypeID() -> CFTypeID;
        fn CFNumberCreate(allocator: CFAllocatorRef, kind: i32, value: *const c_void) -> CFTypeRef;
        fn CFArrayCreate(
            allocator: CFAllocatorRef,
            values: *const CFTypeRef,
            count: CFIndex,
            callbacks: *const c_void,
        ) -> CFTypeRef;
        fn CFStringCreateWithSubstring(
            allocator: CFAllocatorRef,
            string: CFStringRef,
            range: CFRange,
        ) -> CFStringRef;
        fn CFStringTokenizerCreate(
            allocator: CFAllocatorRef,
            string: CFStringRef,
            range: CFRange,
            options: usize,
            locale: CFTypeRef,
        ) -> CFTypeRef;
        fn CFStringTokenizerGoToTokenAtIndex(tokenizer: CFTypeRef, index: CFIndex) -> usize;
        fn CFStringTokenizerAdvanceToNextToken(tokenizer: CFTypeRef) -> usize;
        fn CFStringTokenizerGetCurrentTokenRange(tokenizer: CFTypeRef) -> CFRange;
        fn CFMachPortCreateRunLoopSource(
            allocator: CFAllocatorRef,
            port: CFTypeRef,
            order: CFIndex,
        ) -> CFTypeRef;
        fn CFRunLoopGetCurrent() -> CFTypeRef;
        fn CFRunLoopAddSource(run_loop: CFTypeRef, source: CFTypeRef, mode: CFStringRef);
        fn CFRunLoopRun();
    }

    type TapCallback =
        extern "C" fn(*const c_void, u32, *const c_void, *mut c_void) -> *const c_void;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            events: u64,
            callback: TapCallback,
            user: *mut c_void,
        ) -> CFTypeRef;
        fn CGEventTapEnable(tap: CFTypeRef, enable: bool);
        fn CGEventGetLocation(event: *const c_void) -> CGPoint;
        fn CGEventCreate(source: *const c_void) -> *const c_void;
    }

    extern "C" {
        fn objc_autoreleasePoolPush() -> *mut c_void;
        fn objc_autoreleasePoolPop(pool: *mut c_void);
    }

    /* A CoreFoundation value this code owns, released when it goes. The
    walk below holds a good many at once, and one forgotten release on
    every force click is a leak nobody would ever see. */
    struct Owned(CFTypeRef);

    impl Owned {
        fn new(value: CFTypeRef) -> Option<Self> {
            (!value.is_null()).then_some(Owned(value))
        }

        /* One held elsewhere too, with a reference of its own taken. */
        fn retained(value: CFTypeRef) -> Option<Self> {
            (!value.is_null()).then(|| Owned(unsafe { CFRetain(value) }))
        }
    }

    impl Drop for Owned {
        fn drop(&mut self) {
            unsafe { CFRelease(self.0) };
        }
    }

    fn owned_attribute(element: AXUIElementRef, name: &str) -> Option<Owned> {
        attribute(element, name).and_then(Owned::new)
    }

    fn parameterized(element: AXUIElementRef, name: &str, parameter: CFTypeRef) -> Option<Owned> {
        if parameter.is_null() {
            return None;
        }
        let key = CfString::new(name);
        let mut value: CFTypeRef = std::ptr::null();
        let status = unsafe {
            AXUIElementCopyParameterizedAttributeValue(element, key.0, parameter, &mut value)
        };
        if status != AX_OK {
            if !value.is_null() {
                unsafe { CFRelease(value) };
            }
            return None;
        }
        Owned::new(value)
    }

    fn ax_point(point: CGPoint) -> Option<Owned> {
        Owned::new(unsafe {
            AXValueCreate(AX_VALUE_POINT, &point as *const CGPoint as *const c_void)
        })
    }

    fn ax_range(range: CFRange) -> Option<Owned> {
        Owned::new(unsafe {
            AXValueCreate(AX_VALUE_RANGE, &range as *const CFRange as *const c_void)
        })
    }

    fn ax_value<T: Default>(value: &Owned, kind: u32) -> Option<T> {
        let mut out = T::default();
        let read = unsafe {
            CFGetTypeID(value.0) == AXValueGetTypeID()
                && AXValueGetValue(value.0, kind, &mut out as *mut T as *mut c_void) != 0
        };
        read.then_some(out)
    }

    fn number(value: &Owned) -> Option<CFIndex> {
        let mut out: CFIndex = 0;
        let read = unsafe {
            CFGetTypeID(value.0) == CFNumberGetTypeID()
                && CFNumberGetValue(
                    value.0,
                    CF_NUMBER_INDEX,
                    &mut out as *mut CFIndex as *mut c_void,
                ) != 0
        };
        read.then_some(out)
    }

    fn is_marker_range(value: &Owned) -> bool {
        unsafe { CFGetTypeID(value.0) == AXTextMarkerRangeGetTypeID() }
    }

    fn is_string(value: &Owned) -> bool {
        unsafe { CFGetTypeID(value.0) == CFStringGetTypeID() }
    }

    /* A point on the edge of a word's box counts as on the word. */
    fn holds(rect: CGRect, point: CGPoint) -> bool {
        point.x >= rect.origin.x - 1.0
            && point.x <= rect.origin.x + rect.size.width + 1.0
            && point.y >= rect.origin.y - 1.0
            && point.y <= rect.origin.y + rect.size.height + 1.0
    }

    fn range_box(element: AXUIElementRef, range: CFRange) -> Option<CGRect> {
        let range = ax_range(range)?;
        ax_value(
            &parameterized(element, "AXBoundsForRange", range.0)?,
            AX_VALUE_RECT,
        )
    }

    fn marker_box(element: AXUIElementRef, range: &Owned) -> Option<CGRect> {
        ax_value(
            &parameterized(element, "AXBoundsForTextMarkerRange", range.0)?,
            AX_VALUE_RECT,
        )
    }

    /* What a force click read: the text, its box on each line, for a word
    the text around it, and where that text stands in the program. */
    type Found = (String, Vec<CGRect>, Option<super::Around>, Option<Anchor>);

    /* Where the text around a word stands, so a stretch of it can be found
    on the screen again: its first character's index in the element's text,
    or in the page's where the element belongs to one. The sentence under
    the pointer is cut out of that text by the window (sentence.js), and
    lit up from here once it is known. */
    struct Anchor {
        holder: Owned,
        page: bool,
        origin: CFIndex,
        /* The word's height, which is a line's in the element's text. */
        line: f64,
        /* The block a piece of a page's text stands in, where the word was
        found in such a piece (Chrome): its pieces are asked for their
        boxes where the page's own answer is no box of the text. */
        block: Option<Owned>,
        /* The pieces of a PDF's paragraph, where the word was found in one:
        the origin counts in the paragraph's text, and each piece is asked
        for its own lines. */
        pieces: Vec<Piece>,
        /* The text handed to the window, in UTF-16 units: a stretch of it
        is found among the block's pieces by its characters where the page
        does not say where a piece stands. */
        text: Vec<u16>,
        /* Whether the block's pieces are asked before the page's markers:
        Chrome answers every piece's place in the page with 0 (measured
        2026-10-07), and a stretch counted from there lit up other text. */
        by_text: bool,
    }

    /* Held between reading the sentence and lighting it up, which happens
    on another thread. The accessibility API may be asked from any. */
    unsafe impl Send for Anchor {}

    static LAST_ANCHOR: std::sync::Mutex<Option<Anchor>> = std::sync::Mutex::new(None);

    /* A page's index of a text marker. */
    fn marker_index(area: AXUIElementRef, marker: CFTypeRef) -> Option<CFIndex> {
        number(&parameterized(area, "AXIndexForTextMarker", marker)?)
    }

    /* The anchor of a word's surroundings, from where the word itself
    stands. */
    fn anchor(
        holder: AXUIElementRef,
        page: bool,
        word: CFIndex,
        around: &Option<super::Around>,
        line: f64,
    ) -> Option<Anchor> {
        let at = around.as_ref()?.at as CFIndex;
        Some(Anchor {
            holder: Owned::retained(holder)?,
            page,
            origin: word - at,
            line,
            block: None,
            pieces: Vec::new(),
            text: around.as_ref()?.text.encode_utf16().collect(),
            by_text: false,
        })
    }
    /* A word found by its character: the word, the character's index, the
    word's box, its range in the element's text and the text around it. */
    type Hit = (String, CFIndex, CGRect, CFRange, Option<super::Around>);

    /* Something a reader would call a word: a token of the string holding a
    letter or a digit, in whatever script. Spaces and punctuation are
    tokens too and are passed over. */
    fn word_text(string: CFStringRef, range: CFRange) -> Option<String> {
        let part =
            Owned::new(unsafe { CFStringCreateWithSubstring(kCFAllocatorDefault, string, range) })?;
        string_from(part.0).filter(|word| word.chars().any(char::is_alphanumeric))
    }

    fn tokenizer(string: CFStringRef) -> Option<Owned> {
        let whole = CFRange {
            location: 0,
            length: unsafe { CFStringGetLength(string) },
        };
        Owned::new(unsafe {
            CFStringTokenizerCreate(
                kCFAllocatorDefault,
                string,
                whole,
                TOKENIZER_WORD_BOUNDARY,
                std::ptr::null(),
            )
        })
    }

    /* The words of a string, in order, as ranges of it. */
    fn words(string: CFStringRef) -> Vec<CFRange> {
        let Some(tokens) = tokenizer(string) else {
            return Vec::new();
        };
        let mut found = Vec::new();
        while unsafe { CFStringTokenizerAdvanceToNextToken(tokens.0) } != 0 {
            let range = unsafe { CFStringTokenizerGetCurrentTokenRange(tokens.0) };
            if word_text(string, range).is_some() {
                found.push(range);
            }
        }
        found
    }

    /* The text a force click takes along with a word: a little on either
    side, which is all a clause needs, and a string cut at a surrogate pair
    reads as none. */
    const AROUND: CFIndex = 300;

    /* And how much after it: the window steps on through it a sentence at a
    time (sentence.js), without asking the program again. */
    const AHEAD: CFIndex = 3000;

    /* A string of an element too long to be sent whole, such as a
    document's value, is sent near the word only. */
    fn around_range(string: CFStringRef, word: CFRange) -> Option<super::Around> {
        let length = unsafe { CFStringGetLength(string) };
        let start = (word.location - AROUND).max(0);
        let end = (word.location + word.length + AHEAD).min(length);
        let part = Owned::new(unsafe {
            CFStringCreateWithSubstring(
                kCFAllocatorDefault,
                string,
                CFRange {
                    location: start,
                    length: end - start,
                },
            )
        })?;
        Some(super::Around {
            text: string_from(part.0)?,
            at: (word.location - start) as usize,
            cut: end < length,
        })
    }

    /* The text near a word, cut out of a longer text around it, and where
    the word stands in it. */
    fn near(text: &str, at: usize, length: usize) -> super::Around {
        near_by(text, at, length, AROUND as usize, AHEAD as usize)
    }

    /* The stretch of a text that `near` keeps around a word. */
    fn kept(at: usize, length: usize) -> std::ops::Range<usize> {
        at.saturating_sub(AROUND as usize)..at + length + AHEAD as usize
    }

    /* How far a PDF page's text is taken before a word. */
    const PAGE_AROUND: usize = 1000;

    fn near_by(text: &str, at: usize, length: usize, before: usize, after: usize) -> super::Around {
        let units: Vec<u16> = text.encode_utf16().collect();
        let at = at.min(units.len());
        let from = at.saturating_sub(before);
        let to = (at + length + after).min(units.len());
        super::Around {
            text: String::from_utf16_lossy(&units[from..to]),
            at: at - from,
            cut: to < units.len(),
        }
    }

    /* Whether an element stands on a PDF's page. PDFKit, in Preview and in
    Safari alike, gives a paragraph as one piece of text with a line break
    wherever a line of the page ends (measured); headings and list items
    are pieces of their own. */
    fn pdf_page(element: AXUIElementRef) -> Option<Owned> {
        let mut current = Owned::retained(element)?;
        for _ in 0..60 {
            if text_attribute(current.0, "AXRole").as_deref() == Some("AXPage") {
                return Some(current);
            }
            current = owned_attribute(current.0, "AXParent")?;
        }
        None
    }

    /* A PDF page's whole text, in reading order and with its spaces, which
    its pieces do not have: PDFKit gives a link's text without the spaces
    around it. */
    fn page_text(page: AXUIElementRef) -> Option<String> {
        let length =
            owned_attribute(page, "AXNumberOfCharacters").and_then(|value| number(&value))?;
        let range = ax_range(CFRange {
            location: 0,
            length,
        })?;
        let text = parameterized(page, "AXAttributedStringForRange", range.0)?;
        string_from(unsafe { CFAttributedStringGetString(text.0) })
    }

    /* Whether an element holds text of its own, as a piece of running
    text does. */
    fn holds_text(element: AXUIElementRef) -> bool {
        let Some(children) = owned_attribute(element, "AXChildren") else {
            return false;
        };
        (0..unsafe { CFArrayGetCount(children.0) }).any(|index| {
            let child = unsafe { CFArrayGetValueAtIndex(children.0, index) };
            matches!(
                text_attribute(child, "AXRole").as_deref(),
                Some("AXStaticText") | Some("AXLink")
            )
        })
    }

    /* The paragraph a piece of a PDF's text stands in. PDFKit cuts a
    paragraph at every link — the text before it, the link, and the rest in
    a group of its own, one level deeper at every link (measured) — so the
    paragraph is the highest element above the piece that still holds text
    of its own; the one above it holds paragraphs. */
    fn pdf_paragraph(element: AXUIElementRef) -> Option<Owned> {
        let mut current = Owned::retained(element)?;
        for _ in 0..60 {
            let parent = owned_attribute(current.0, "AXParent")?;
            if text_attribute(parent.0, "AXRole").as_deref() == Some("AXPage")
                || !holds_text(parent.0)
            {
                break;
            }
            current = parent;
        }
        Some(current)
    }

    /* A piece of a PDF paragraph's text, and where it stands in the
    paragraph's. */
    struct Piece {
        element: Owned,
        start: CFIndex,
        length: CFIndex,
    }

    /* A text's characters other than white space, and each one's place in
    the text in UTF-16 units. */
    fn solid(text: &str) -> (Vec<char>, Vec<usize>) {
        let mut chars = Vec::new();
        let mut places = Vec::new();
        let mut at = 0;
        for c in text.chars() {
            if !c.is_whitespace() {
                chars.push(c);
                places.push(at);
            }
            at += c.len_utf16();
        }
        (chars, places)
    }

    /* Every place a run of characters stands in a longer one. */
    fn occurrences(text: &[char], run: &[char]) -> Vec<usize> {
        if run.is_empty() || run.len() > text.len() {
            return Vec::new();
        }
        text.windows(run.len())
            .enumerate()
            .filter(|(_, window)| *window == run)
            .map(|(at, _)| at)
            .collect()
    }

    /* Where a piece stands among a page's solid characters, where it may
    stand at several places — a year, an author's name: the place with its
    neighbours in reading order nearest before and after it. */
    fn piece_in_page(
        page: &[char],
        own: &[char],
        before: Option<&[char]>,
        after: Option<&[char]>,
    ) -> Option<usize> {
        let places = occurrences(page, own);
        let before = before.map(|run| occurrences(page, run)).unwrap_or_default();
        let after = after.map(|run| occurrences(page, run)).unwrap_or_default();
        let gap = |at: usize| {
            let back = before
                .iter()
                .filter(|&&found| found < at)
                .map(|&found| at - found)
                .min()
                .unwrap_or(usize::MAX / 4);
            let ahead = after
                .iter()
                .filter(|&&found| found > at)
                .map(|&found| found - at)
                .min()
                .unwrap_or(usize::MAX / 4);
            back + ahead
        };
        places.into_iter().min_by_key(|&at| gap(at))
    }

    /* A PDF page's text with the line breaks inside a paragraph taken
    out, one unit for one so every place still holds. PDFKit ends a
    paragraph with a line break; within one it joins the lines with spaces
    in some PDFs and breaks every line in others, and breaks one where a
    link runs over a line's end (measured). A break after a full line — at
    least seven tenths of the page's long lines, as running text fills its
    column and a heading, a list item or a paragraph's last line does not —
    or after a comma or an opening bracket becomes a space, and so does one
    while a bracket stands open: a reference running over a line's end is
    a link, and its line ends short wherever the link does ("(Bowman et
    al., 2015;⏎Williams et al., 2018) and paraphrasing (Dolan⏎and Brockett,
    2005)", measured in a two-column paper) — a bracket left open for more
    than a few lines is not believed. A break inside a word, after a letter
    and a hyphen, stays for the page to join (sentence.js). */
    fn page_lines_joined(text: &str) -> String {
        const OPEN_FOR: usize = 240;
        let lines: Vec<usize> = text.split('\n').map(|line| line.chars().count()).collect();
        let mut sorted = lines.clone();
        sorted.sort_unstable();
        let long = sorted[sorted.len() * 4 / 5];
        let chars: Vec<char> = text.chars().collect();
        let mut line = 0;
        let mut open: Vec<usize> = Vec::new();
        chars
            .iter()
            .enumerate()
            .map(|(i, &c)| {
                match c {
                    '(' | '[' => open.push(i),
                    ')' | ']' => {
                        open.pop();
                    }
                    _ => {}
                }
                if c != '\n' {
                    return c;
                }
                open.retain(|&at| i - at <= OPEN_FOR);
                let full = lines[line] * 10 >= long * 7;
                line += 1;
                let before = chars[..i].iter().rev().find(|c| **c != ' ').copied();
                let next = chars.get(i + 1).copied();
                let broken = i >= 2
                    && chars[i - 1] == '-'
                    && chars[i - 2].is_alphabetic()
                    && next.is_some_and(char::is_alphabetic);
                let wrapped =
                    full || !open.is_empty() || matches!(before, Some(',') | Some('(') | Some('['));
                if wrapped && !broken {
                    ' '
                } else {
                    c
                }
            })
            .collect()
    }

    /* A piece's place on the page for reading order: its first letter's box,
    since a piece over two lines has a frame from the paragraph's left
    edge. */
    fn first_box(element: AXUIElementRef, text: &str) -> Option<CGRect> {
        let lead = text
            .chars()
            .take_while(|c| c.is_whitespace())
            .map(char::len_utf16)
            .sum::<usize>() as CFIndex;
        range_box(
            element,
            CFRange {
                location: lead,
                length: 1,
            },
        )
    }

    /* Pieces with their first boxes in reading order: line by line, a line
    being the pieces whose first box starts within half a line of the
    line's first, and left to right in each. */
    fn reading_order(pieces: &mut Vec<(Owned, String, CGRect)>) {
        pieces.sort_by(|a, b| a.2.origin.y.total_cmp(&b.2.origin.y));
        let mut lines = Vec::with_capacity(pieces.len());
        let mut line = 0;
        let mut top = f64::NEG_INFINITY;
        let mut height = 0.0;
        for piece in pieces.iter() {
            if piece.2.origin.y - top > height / 2.0 {
                line += 1;
                top = piece.2.origin.y;
                height = piece.2.size.height;
            }
            lines.push(line);
        }
        let mut keyed: Vec<(usize, (Owned, String, CGRect))> =
            lines.into_iter().zip(pieces.drain(..)).collect();
        keyed.sort_by(|a, b| {
            a.0.cmp(&b.0)
                .then(a.1 .2.origin.x.total_cmp(&b.1 .2.origin.x))
        });
        pieces.extend(keyed.into_iter().map(|(_, piece)| piece));
    }

    /* The text around a word on a PDF's page, out of the page's own text:
    PDFKit gives only some of a paragraph's pieces to the tree — around the
    links of a paragraph full of references, the text between them is
    missing — and none of the spaces around a link (measured). The word's
    piece is found in the page's text by its characters other than white
    space, with its neighbours in reading order where it stands at several
    places. Also the word's piece and where the word stands in the page's
    text. */
    fn pdf_text(
        element: AXUIElementRef,
        place: CFRange,
    ) -> Option<(super::Around, Vec<Piece>, CFIndex)> {
        let page = pdf_page(element)?;
        let paragraph = pdf_paragraph(element)?;
        let whole = page_text(page.0)?;
        let mut found = Vec::new();
        let mut budget = 4000;
        text_pieces(paragraph.0, 60, &mut budget, &mut found);
        let mut pieces: Vec<(Owned, String, CGRect)> = found
            .into_iter()
            .filter_map(|piece| {
                let text = text_attribute(piece.0, "AXValue")?;
                let first = first_box(piece.0, &text)?;
                Some((piece, text, first))
            })
            .filter(|(_, text, _)| !text.trim().is_empty())
            .collect();
        reading_order(&mut pieces);
        let own_text = text_attribute(element, "AXValue")?;
        let own_run = solid(&own_text).0;
        let own = pieces
            .iter()
            .position(|piece| unsafe { CFEqual(piece.0 .0, element) } != 0);
        let (chars, places) = solid(&whole);
        let runs: Vec<Vec<char>> = pieces.iter().map(|piece| solid(&piece.1).0).collect();
        let at = piece_in_page(
            &chars,
            &own_run,
            own.and_then(|own| own.checked_sub(1))
                .map(|i| runs[i].as_slice()),
            own.and_then(|own| runs.get(own + 1)).map(Vec::as_slice),
        )?;
        let before: Vec<u16> = own_text
            .encode_utf16()
            .take(place.location as usize)
            .collect();
        let solid_before = solid(&String::from_utf16_lossy(&before)).0.len();
        let index = *places.get(at + solid_before)? as CFIndex;
        /* The other pieces, each at its first place past the one before it
        going forward, and before the one after it going back. */
        /* The sentence lights up where it runs through the word's own piece:
        all of it where the piece is the whole paragraph, as in a PDF
        whose lines the page breaks, less where links cut the paragraph. */
        let lead = own_text
            .chars()
            .take_while(|c| c.is_whitespace())
            .map(char::len_utf16)
            .sum::<usize>();
        let parts = vec![Piece {
            element: Owned::retained(element)?,
            start: places[at] as CFIndex - lead as CFIndex,
            length: own_text.encode_utf16().count() as CFIndex,
        }];
        let around = near_by(
            &page_lines_joined(&whole),
            index as usize,
            place.length as usize,
            PAGE_AROUND,
            AHEAD as usize,
        );
        Some((around, parts, index))
    }

    /* The block a piece of a page's text stands in: up from the piece as
    long as the element above holds running text of its own, past a link,
    bold, a mark, code, an abbreviation or a superscript reference — each
    an element of its own in Safari, Chrome and Firefox (measured) — to the
    paragraph, list item or cell holding it. */
    fn block_of(element: AXUIElementRef) -> Option<Owned> {
        let mut current = Owned::retained(element)?;
        for _ in 0..8 {
            let parent = owned_attribute(current.0, "AXParent")?;
            match text_attribute(parent.0, "AXRole").as_deref() {
                Some("AXWebArea") | None => break,
                _ if !holds_text(parent.0) => break,
                _ => current = parent,
            }
        }
        match text_attribute(current.0, "AXRole").as_deref() {
            Some("AXStaticText") | Some("AXLink") | None => None,
            _ => Some(current),
        }
    }

    /* What stands in the place of a unit taken out of a text whose places
    have to hold: a word joiner, which the page drops (sentence.js). */
    const TAKEN_OUT: u16 = 0x2060;

    /* A formula standing in a line of running text, as Safari gives it
    (measured, 2026-10-01): its parts one to a line and a line break
    before and after it ("rho (\nρ\n).", "en \nx\n=\n1\n."), or a break
    after it and a space either side that the page does not have
    ("rho ( ρ\n )."), and after the break the formula once more as it is
    drawn, where the page draws it as text ("\nρ\nρ)"). Chrome and Firefox
    give the formula in its line and nothing else.

    `start..end` is the formula's own stretch. The breaks, the added
    spaces and the second copy are taken out, every other unit staying in
    its place; one space stays where a letter or a digit would run into
    the formula, as after a formula that ends a line, where Safari gives
    the page's own space no more. A formula without a break after it is
    left as it is. */
    fn formula_in_line(units: &mut [u16], start: usize, end: usize) {
        let solid = |unit: Option<u16>| {
            unit.and_then(|unit| char::from_u32(u32::from(unit)))
                .is_some_and(char::is_alphanumeric)
        };
        let end = end.min(units.len());
        let start = start.min(end);
        let last = if end > start && units[end - 1] == BREAK {
            end - 1
        } else if units.get(end) == Some(&BREAK) {
            end
        } else {
            return;
        };
        for unit in &mut units[start..last] {
            if *unit == BREAK {
                *unit = TAKEN_OUT;
            }
        }
        let mut after = last + 1;
        if let Some(copied) = drawn_again(units, start..last, after) {
            units[after..copied].fill(TAKEN_OUT);
            after = copied;
        }
        /* What stands after it: of two spaces one is Safari's, and so is
        one before what closes — a bracket, a comma, a stop. */
        let spaced = units.get(after) == Some(&SPACE);
        let then = units.get(after + usize::from(spaced)).copied();
        units[last] = TAKEN_OUT;
        if spaced && then.is_none_or(|unit| unit == SPACE || CLOSING.contains(&unit)) {
            units[after] = TAKEN_OUT;
        } else if !spaced && solid(then) {
            units[last] = SPACE;
        }
        /* What stands before it. The page's own space comes before the
        first break, and a break with none before it stands for one,
        unless a bracket or a quotation mark opens there. Without a break
        the second of two spaces is Safari's, and so is one after what
        opens. */
        let mut from = start;
        while from > 0 && matches!(units[from - 1], SPACE | BREAK) {
            from -= 1;
        }
        let before = (from > 0).then(|| units[from - 1]);
        match (from..start).find(|&at| units[at] == BREAK) {
            Some(first) => {
                units[first..start].fill(TAKEN_OUT);
                if first == from && before.is_some_and(|unit| !OPENING.contains(&unit)) {
                    units[first] = SPACE;
                }
            }
            None if start - from >= 2 => units[start - 1] = TAKEN_OUT,
            None if start - from == 1 && before.is_none_or(|unit| OPENING.contains(&unit)) => {
                units[start - 1] = TAKEN_OUT;
            }
            None => {}
        }
    }

    const SPACE: u16 = 0x20;
    const BREAK: u16 = 0x0a;

    /* What a formula may stand right in front of: ) ] } » ” ’ › , . ; : ! ?
    … " ' */
    const CLOSING: [u16; 16] = [
        0x29, 0x5d, 0x7d, 0xbb, 0x201d, 0x2019, 0x203a, 0x2c, 0x2e, 0x3b, 0x3a, 0x21, 0x3f, 0x2026,
        0x22, 0x27,
    ];

    /* What a formula may stand right behind: ( [ { ¿ ¡ « „ “ ‘ ‹ " ' */
    const OPENING: [u16; 12] = [
        0x28, 0x5b, 0x7b, 0xbf, 0xa1, 0xab, 0x201e, 0x201c, 0x2018, 0x2039, 0x22, 0x27,
    ];

    /* Where the second copy of a formula ends, the one a page draws as
    text right after the formula's break: the same letters and signs,
    whatever their order — a fraction is drawn with what stands below
    first — and what is blank after them, through its last break. None
    where what follows is something else: text of the page is never taken
    for a copy unless it starts at the break and holds exactly the
    formula. */
    fn drawn_again(units: &[u16], formula: std::ops::Range<usize>, after: usize) -> Option<usize> {
        let blank = |unit: &u16| matches!(*unit, SPACE | BREAK | 0x09 | 0x200b | 0x2060..=0x2064);
        let mut own: Vec<u16> = units[formula]
            .iter()
            .copied()
            .filter(|unit| !blank(unit))
            .collect();
        if own.is_empty() || units.get(after).is_none_or(blank) {
            return None;
        }
        let mut copy = Vec::with_capacity(own.len());
        let mut end = after;
        while end < units.len() && copy.len() < own.len() {
            if !blank(&units[end]) {
                copy.push(units[end]);
            }
            end += 1;
        }
        own.sort_unstable();
        copy.sort_unstable();
        if own != copy {
            return None;
        }
        let run = (end..units.len())
            .find(|&at| !blank(&units[at]))
            .unwrap_or(units.len());
        Some(
            (end..run)
                .rev()
                .find(|&at| units[at] != SPACE)
                .map_or(end, |at| at + 1),
        )
    }

    /* Whether an element is a formula, has one among its children, and
    has running text among them. Only its first children are looked at:
    what is wrapped around a formula holds little else. */
    fn formula_and_text(element: AXUIElementRef) -> (bool, bool) {
        let is_formula =
            |element| text_attribute(element, "AXSubrole").as_deref() == Some("AXDocumentMath");
        if is_formula(element) {
            return (true, false);
        }
        let Some(children) = owned_attribute(element, "AXChildren") else {
            return (false, false);
        };
        let mut found = (false, false);
        for index in 0..unsafe { CFArrayGetCount(children.0) }.min(24) {
            let child = unsafe { CFArrayGetValueAtIndex(children.0, index) };
            match text_attribute(child, "AXRole").as_deref() {
                Some("AXStaticText") | Some("AXLink") => found.1 = true,
                _ if is_formula(child) => found.0 = true,
                _ => {}
            }
        }
        found
    }

    /* Where an element's text starts and ends, as the page counts. */
    fn index_range(area: AXUIElementRef, element: AXUIElementRef) -> Option<(CFIndex, CFIndex)> {
        let own = parameterized(area, "AXTextMarkerRangeForUIElement", element)
            .filter(is_marker_range)?;
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(own.0) })?;
        let end = Owned::new(unsafe { AXTextMarkerRangeCopyEndMarker(own.0) })?;
        Some((marker_index(area, start.0)?, marker_index(area, end.0)?))
    }

    /* The formula the page's unit `index` belongs to, where it stands in a
    line of running text: its own stretch, as the page counts. Up from the element at that unit to a
    formula, or to what a page wraps around one; running text reached
    first holds none. A formula set on a line of its own has no text
    beside it and ends a sentence as before. */
    fn formula_around(area: AXUIElementRef, index: CFIndex) -> Option<(CFIndex, CFIndex)> {
        let marker = parameterized(area, "AXTextMarkerForIndex", index_number(index)?.0)?;
        let mut formula = parameterized(area, "AXUIElementForTextMarker", marker.0)?;
        for level in 0.. {
            /* A formula's own parts hold text too, and are no running
            text. */
            let part = text_attribute(formula.0, "AXSubrole")
                .is_some_and(|subrole| subrole.starts_with("AXMath"));
            match formula_and_text(formula.0) {
                (true, false) => break,
                (_, true) if !part => return None,
                _ if level == 8 => return None,
                _ => formula = owned_attribute(formula.0, "AXParent")?,
            }
        }
        let mut block = owned_attribute(formula.0, "AXParent")?;
        if formula_and_text(block.0) == (true, false) {
            formula = block;
            block = owned_attribute(formula.0, "AXParent")?;
        }
        if !formula_and_text(block.0).1 {
            return None;
        }
        index_range(area, formula.0)
    }

    /* The most line breaks of one text that are asked about. */
    const BREAKS_ASKED: usize = 24;

    /* A stretch of a page that starts at the marker `start`, with the
    formulas in its lines read as part of them: every unit in its place,
    TAKEN_OUT where one was dropped. Only the line breaks `within` are
    asked about — each costs a few milliseconds (measured) — and a text
    without a line break asks nothing. */
    fn with_formulas_in_line(
        area: AXUIElementRef,
        start: CFTypeRef,
        text: String,
        within: std::ops::Range<usize>,
    ) -> String {
        if !text.contains('\n') {
            return text;
        }
        let Some(first) = marker_index(area, start) else {
            return text;
        };
        let mut units: Vec<u16> = text.encode_utf16().collect();
        let length = units.len() as CFIndex;
        let place = |index: CFIndex| (index - first).clamp(0, length) as usize;
        let mut asked = 0;
        let mut done = 0;
        let mut changed = false;
        for at in within.start.max(1)..within.end.min(units.len()) {
            /* Two breaks in a row are the end of a paragraph. */
            if at < done || units[at] != BREAK || units[at - 1] == BREAK {
                continue;
            }
            if asked == BREAKS_ASKED {
                break;
            }
            asked += 1;
            let Some((from, to)) = formula_around(area, first + at as CFIndex) else {
                continue;
            };
            let (from, to) = (place(from), place(to));
            formula_in_line(&mut units, from, to);
            done = to + 1;
            changed = true;
        }
        if changed {
            String::from_utf16_lossy(&units)
        } else {
            text
        }
    }

    /* A page's selection as text, the formulas in its lines part of
    them. */
    fn selected_on_page(area: AXUIElementRef, range: &Owned) -> Option<String> {
        let text = parameterized(area, "AXStringForTextMarkerRange", range.0)
            .and_then(|value| string_from(value.0))?;
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(range.0) })?;
        let taken_out = char::from_u32(u32::from(TAKEN_OUT))?;
        Some(with_formulas_in_line(area, start.0, text, 0..usize::MAX).replace(taken_out, ""))
    }

    /* A piece of a page's text knows only itself — a paragraph with a link
    in it is three pieces in Chrome — so a word found in one takes the text
    of the block it stands in along, where the page gives it. */
    fn in_block(element: AXUIElementRef, place: CFRange) -> Option<super::Around> {
        let area = web_area(element)?;
        let block = block_of(element)?;
        let whole = parameterized(area.0, "AXTextMarkerRangeForUIElement", block.0)
            .filter(is_marker_range)?;
        let own = parameterized(area.0, "AXTextMarkerRangeForUIElement", element)
            .filter(is_marker_range)?;
        let text = parameterized(area.0, "AXStringForTextMarkerRange", whole.0)
            .and_then(|value| string_from(value.0))?;
        let from = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(whole.0) })?;
        let to = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(own.0) })?;
        let before = marker_range(area.0, &from, &to)
            .and_then(|range| parameterized(area.0, "AXStringForTextMarkerRange", range.0))
            .and_then(|value| string_from(value.0))?
            .encode_utf16()
            .count();
        let at = before + place.location as usize;
        let length = place.length as usize;
        let text = if pdf_view(area.0) {
            viewed_lines_joined(&text)
        } else {
            with_formulas_in_line(area.0, from.0, text, kept(at, length))
        };
        Some(near(&text, at, length))
    }

    /* Whether a page is a PDF in Chromium's own viewer, which is a page
    inside the viewer's page (measured in Chrome, 2026-10-07): its text
    comes with a break at the end of every line, so each line read as a
    sentence. */
    fn pdf_view(area: AXUIElementRef) -> bool {
        const VIEWER: &str = "chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai";
        let mut current = owned_attribute(area, "AXParent");
        for _ in 0..16 {
            let Some(element) = current else {
                return false;
            };
            if text_attribute(element.0, "AXRole").as_deref() == Some("AXWebArea") {
                return owned_attribute(element.0, "AXURL")
                    .and_then(|url| string_from(unsafe { CFURLGetString(url.0) }))
                    .is_some_and(|url| url.starts_with(VIEWER));
            }
            current = owned_attribute(element.0, "AXParent");
        }
        false
    }

    /* A marker one step inside a stretch, for asking what the stretch
    stands in: the marker at a paragraph's first character is the end of
    the paragraph before it, and Firefox answered a selection from a
    paragraph's start with that paragraph (measured 2026-10-07) — nothing
    of the selection in it, and nothing after. */
    fn inside_marker(asked: AXUIElementRef, start: &Owned) -> Owned {
        parameterized(asked, "AXNextTextMarkerForTextMarker", start.0)
            .or_else(|| Owned::retained(start.0))
            .expect("a marker")
    }

    /* A paragraph of a PDF in Chromium's viewer with its lines joined, one
    unit for one so every place still holds. The viewer gives a paragraph
    as a block of its own and ends some of its lines with a carriage
    return and a line feed, while others come joined already (measured) —
    so a line's length says nothing there, and every break in the block is
    a line's. The return goes the way a unit taken out does (sentence.js
    drops it), the feed becomes the space. */
    fn viewed_lines_joined(text: &str) -> String {
        let taken_out = char::from_u32(u32::from(TAKEN_OUT)).unwrap_or(' ');
        text.chars()
            .map(|c| match c {
                '\r' => taken_out,
                '\n' => ' ',
                other => other,
            })
            .collect()
    }

    /* The text a word's text marker range stands in, and where the word
    starts in it: the block around it on a page — the paragraph a program
    names ends at a link or a bold word, measured in Chrome — else the
    paragraph the program names. */
    fn around_marker(element: AXUIElementRef, word: &Owned) -> Option<super::Around> {
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(word.0) })?;
        let area = web_area(element);
        let asked = area.as_ref().map_or(element, |area| area.0);
        let inside = inside_marker(asked, &start);
        let whole = area
            .as_ref()
            .and_then(|area| {
                let block = block_of(element)?;
                parameterized(area.0, "AXTextMarkerRangeForUIElement", block.0)
            })
            .filter(is_marker_range)
            .or_else(|| {
                parameterized(element, "AXParagraphTextMarkerRangeForTextMarker", inside.0)
                    .filter(is_marker_range)
            })?;
        let text = parameterized(asked, "AXStringForTextMarkerRange", whole.0)
            .and_then(|value| string_from(value.0))?;
        let from = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(whole.0) })?;
        let at = marker_range(asked, &from, &start)
            .and_then(|range| parameterized(asked, "AXStringForTextMarkerRange", range.0))
            .and_then(|value| string_from(value.0))
            .map_or(0, |before| before.encode_utf16().count());
        let length = parameterized(asked, "AXStringForTextMarkerRange", word.0)
            .and_then(|value| string_from(value.0))
            .map_or(0, |word| word.encode_utf16().count());
        let text = match &area {
            Some(area) if pdf_view(area.0) => viewed_lines_joined(&text),
            Some(area) => with_formulas_in_line(area.0, from.0, text, kept(at, length)),
            None => text,
        };
        Some(near(&text, at, length))
    }

    /* A selection short enough to be looked up as a word: one to three
    words. A longer one is a text of its own and takes nothing along. */
    fn looked_up(selected: &str) -> bool {
        (1..=3).contains(&selected.split_whitespace().count())
    }

    /* The text around a page's selection, which the page cuts the sentence
    out of (sentence.js): the block it stands in, as for a force-clicked
    word. */
    fn around_page_selection(area: AXUIElementRef, range: &Owned) -> Option<super::Around> {
        placed_page_selection(area, range).map(|(around, _)| around)
    }

    /* The text around a selection and where it stands in the program, so
    the sentences after it can be lit up as the window steps on to them. */
    type Placed = (super::Around, Option<Anchor>);

    /* A line's height where the program gives no box to take it from. */
    const LINE: f64 = 18.0;

    fn placed_page_selection(area: AXUIElementRef, range: &Owned) -> Option<Placed> {
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(range.0) })?;
        /* What holds the selection's start, and where that is the piece
        before it — the text it stands in then ends where the selection
        begins — what holds its end. */
        let end = Owned::new(unsafe { AXTextMarkerRangeCopyEndMarker(range.0) })?;
        let (holder, around) = [inside_marker(area, &start), end]
            .iter()
            .find_map(|marker| {
                let holder = parameterized(area, "AXUIElementForTextMarker", marker.0)?;
                let around = around_marker(holder.0, range)?;
                (around.at < around.text.encode_utf16().count()).then_some((holder, around))
            })?;
        let around = Some(around);
        let line = parameterized(area, "AXRightWordTextMarkerRangeForTextMarker", start.0)
            .and_then(|word| marker_box(area, &word))
            .map_or(LINE, |rect| rect.size.height);
        let placed = marker_index(area, start.0)
            .and_then(|index| anchor(area, true, index, &around, line))
            .map(|placed| Anchor {
                block: block_of(holder.0),
                /* A selection's first marker at the page's very start is
                Chrome's answer for every place. */
                by_text: marker_index(area, start.0) == Some(0),
                ..placed
            });
        Some((around?, placed))
    }

    /* The text near an element's selection. */
    fn around_element_selection(element: AXUIElementRef, range: CFRange) -> Option<super::Around> {
        placed_element_selection(element, range).map(|(around, _)| around)
    }

    fn placed_element_selection(element: AXUIElementRef, range: CFRange) -> Option<Placed> {
        let first = CFRange {
            location: range.location,
            length: 1,
        };
        let line = range_box(element, first).map_or(LINE, |rect| rect.size.height);
        if let Some((around, pieces, index)) = pdf_text(element, range) {
            let around = Some(around);
            let placed = anchor(element, false, index, &around, line)
                .map(|placed| Anchor { pieces, ..placed });
            return Some((around?, placed));
        }
        let around = Some(near_element_selection(element, range)?);
        let placed = anchor(element, false, range.location, &around, line);
        Some((around?, placed))
    }

    fn near_element_selection(element: AXUIElementRef, range: CFRange) -> Option<super::Around> {
        let length =
            owned_attribute(element, "AXNumberOfCharacters").and_then(|value| number(&value));
        let start = (range.location - AROUND).max(0);
        let end = range.location + range.length + AHEAD;
        let end = length.map_or(end, |length| end.min(length));
        let near = ax_range(CFRange {
            location: start,
            length: end - start,
        })
        .and_then(|asked| parameterized(element, "AXStringForRange", asked.0))
        .and_then(|value| string_from(value.0));
        match near {
            Some(text) => Some(super::Around {
                text,
                at: (range.location - start) as usize,
                cut: length.is_none_or(|length| end < length),
            }),
            None => around_range(
                owned_attribute(element, "AXValue").filter(is_string)?.0,
                range,
            ),
        }
    }

    /* The text around the focused element's selection, for the shortcut:
    where the selection stands — a page's marker range, the element's own
    range, or the range in the piece of a PDF holding it — and from there
    the same text a force click on it takes along. One to three words are
    read in their sentence; after a longer selection the window steps on
    to the next one. */
    fn selection_around(element: AXUIElementRef) -> Option<Placed> {
        let on_page = web_area(element).and_then(|area| {
            let range =
                owned_attribute(area.0, "AXSelectedTextMarkerRange").filter(is_marker_range)?;
            placed_page_selection(area.0, &range)
        });
        if on_page.is_some() {
            return on_page;
        }
        let own = owned_attribute(element, "AXSelectedTextRange")
            .and_then(|value| ax_value::<CFRange>(&value, AX_VALUE_RANGE));
        if let Some(range) = own {
            return placed_element_selection(element, range);
        }
        let (piece, range) = pdf_selection(element)?;
        placed_element_selection(piece.0, range)
    }

    /* Where a PDF's selection stands. PDFKit, in Preview and in Safari,
    focuses the document, which answers AXSelectedText and nothing about
    where; the pages answer it too, and the piece of text holding the
    selection its range (measured). The first piece holding any of it. */
    fn pdf_selection(element: AXUIElementRef) -> Option<(Owned, CFRange)> {
        let pages: Vec<Owned> = if text_attribute(element, "AXRole").as_deref() == Some("AXPage") {
            Owned::retained(element).into_iter().collect()
        } else {
            let children = owned_attribute(element, "AXChildren")?;
            (0..unsafe { CFArrayGetCount(children.0) })
                .filter_map(|index| {
                    Owned::retained(unsafe { CFArrayGetValueAtIndex(children.0, index) })
                })
                .filter(|child| text_attribute(child.0, "AXRole").as_deref() == Some("AXPage"))
                .collect()
        };
        let page = pages.into_iter().find(|page| {
            text_attribute(page.0, "AXSelectedText").is_some_and(|text| !text.trim().is_empty())
        })?;
        let mut pieces = Vec::new();
        let mut budget = 4000;
        text_pieces(page.0, 60, &mut budget, &mut pieces);
        pieces.into_iter().find_map(|piece| {
            text_attribute(piece.0, "AXSelectedText").filter(|text| !text.is_empty())?;
            let range: CFRange = ax_value(
                &owned_attribute(piece.0, "AXSelectedTextRange")?,
                AX_VALUE_RANGE,
            )?;
            (range.length > 0).then_some((piece, range))
        })
    }

    /* A page's selection as text. Safari answers AXSelectedText on no element
    of a page (measured), so without this the shortcut fell back to copying,
    which brings the selection and nothing around it. */
    fn page_selected_text(element: AXUIElementRef) -> Option<String> {
        let area = web_area(element)?;
        let range = owned_attribute(area.0, "AXSelectedTextMarkerRange").filter(is_marker_range)?;
        selected_on_page(area.0, &range).filter(|text| !text.trim().is_empty())
    }

    /* Route one: a text marker for the point, and the word on either side of
    it whose box holds the point. */
    fn word_by_marker(element: AXUIElementRef, point: CGPoint) -> Option<Found> {
        let at = ax_point(point)?;
        let marker = parameterized(element, "AXTextMarkerForPosition", at.0)?;
        for side in [
            "AXRightWordTextMarkerRangeForTextMarker",
            "AXLeftWordTextMarkerRangeForTextMarker",
        ] {
            let Some(range) = parameterized(element, side, marker.0) else {
                continue;
            };
            let Some(rect) = marker_box(element, &range).filter(|rect| holds(*rect, point)) else {
                continue;
            };
            let text = parameterized(element, "AXStringForTextMarkerRange", range.0)
                .and_then(|value| string_from(value.0));
            if let Some(word) = text.filter(|word| word.chars().any(char::is_alphanumeric)) {
                let around = around_marker(element, &range);
                let area = web_area(element);
                let asked = area.as_ref().map_or(element, |area| area.0);
                let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(range.0) });
                let placed = start
                    .and_then(|start| marker_index(asked, start.0))
                    .and_then(|index| anchor(asked, true, index, &around, rect.size.height));
                return Some((word.trim().to_string(), vec![rect], around, placed));
            }
        }
        None
    }

    /* Route two: the character at the point, the word around it cut out of
    the text near it. Returns the word, the character's index, the word's
    box and the text around it. */
    fn word_by_index(element: AXUIElementRef, point: CGPoint) -> Option<Hit> {
        let at = ax_point(point)?;
        let index = ax_value::<CFRange>(
            &parameterized(element, "AXRangeForPosition", at.0)?,
            AX_VALUE_RANGE,
        )?
        .location;
        if index < 0 {
            return None;
        }
        /* The text around the index, not all of it: a long document's value
        is the whole document. */
        let length =
            owned_attribute(element, "AXNumberOfCharacters").and_then(|value| number(&value));
        let (text, start) = match length {
            Some(length) if index < length => {
                let start = (index - 200).max(0);
                let near = CFRange {
                    location: start,
                    length: (length - start).min(400 + AHEAD),
                };
                let text = ax_range(near)
                    .and_then(|range| parameterized(element, "AXStringForRange", range.0));
                match text.filter(is_string) {
                    Some(text) => (text, start),
                    None => (owned_attribute(element, "AXValue").filter(is_string)?, 0),
                }
            }
            _ => (owned_attribute(element, "AXValue").filter(is_string)?, 0),
        };
        let tokens = tokenizer(text.0)?;
        if unsafe { CFStringTokenizerGoToTokenAtIndex(tokens.0, index - start) } == 0 {
            return None;
        }
        let token = unsafe { CFStringTokenizerGetCurrentTokenRange(tokens.0) };
        let word = word_text(text.0, token)?;
        let place = CFRange {
            location: start + token.location,
            length: token.length,
        };
        let rect = range_box(element, place).filter(|rect| holds(*rect, point))?;
        Some((word, index, rect, place, around_range(text.0, token)))
    }

    /* Route three: the element's own text, word by word, until a word's box
    holds the point. Asked a group of words at a time first — one box
    around a group rules out all of them — so a long paragraph costs a few
    dozen questions rather than one per word. */
    fn word_by_boxes(element: AXUIElementRef, point: CGPoint) -> Option<Hit> {
        const GROUP: usize = 24;
        let text = owned_attribute(element, "AXValue").filter(is_string)?;
        let all = words(text.0);
        let hit = |range: &CFRange| {
            range_box(element, *range)
                .filter(|rect| holds(*rect, point))
                .map(|rect| (*range, rect))
        };
        for group in all.chunks(GROUP) {
            let (first, last) = (group[0], group[group.len() - 1]);
            let around = CFRange {
                location: first.location,
                length: last.location + last.length - first.location,
            };
            /* A program that gives no box for a group gets its words asked
            one by one. */
            if range_box(element, around).is_some_and(|rect| !holds(rect, point)) {
                continue;
            }
            if let Some((range, rect)) = group.iter().find_map(hit) {
                let around = around_range(text.0, range);
                return Some((
                    word_text(text.0, range)?,
                    range.location,
                    rect,
                    range,
                    around,
                ));
            }
        }
        None
    }

    /* The web area a page's element belongs to, if it belongs to one. */
    fn web_area(element: AXUIElementRef) -> Option<Owned> {
        let mut current = Owned::retained(element)?;
        for _ in 0..40 {
            if text_attribute(current.0, "AXRole").as_deref() == Some("AXWebArea") {
                return Some(current);
            }
            current = owned_attribute(current.0, "AXParent")?;
        }
        None
    }

    fn marker_range(area: AXUIElementRef, from: &Owned, to: &Owned) -> Option<Owned> {
        let pair = [from.0, to.0];
        let list = Owned::new(unsafe {
            CFArrayCreate(
                kCFAllocatorDefault,
                pair.as_ptr(),
                2,
                &kCFTypeArrayCallBacks,
            )
        })?;
        parameterized(area, "AXTextMarkerRangeForUnorderedTextMarkers", list.0)
            .filter(is_marker_range)
    }

    fn marker_length(area: AXUIElementRef, range: &Owned) -> Option<CFIndex> {
        number(&parameterized(area, "AXLengthForTextMarkerRange", range.0)?)
    }

    /* The boxes of a stretch of a page, one per line. Its one box would
    also take in the start of its first line and the end of its last, so it
    is walked a line at a time and each line's piece asked for its own
    box. */
    fn marker_lines(area: AXUIElementRef, stretch: &Owned) -> Option<Vec<CGRect>> {
        let total = marker_length(area, stretch).filter(|length| *length > 0)?;
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(stretch.0) })?;
        let end = Owned::new(unsafe { AXTextMarkerRangeCopyEndMarker(stretch.0) })?;
        let mut at = Owned::retained(start.0)?;
        let mut boxes = Vec::new();
        for number in 0..400 {
            let line = parameterized(area, "AXLineTextMarkerRangeForTextMarker", at.0)
                .filter(is_marker_range)?;
            let line_end = Owned::new(unsafe { AXTextMarkerRangeCopyEndMarker(line.0) })?;
            let done = marker_range(area, &start, &line_end)
                .and_then(|range| marker_length(area, &range))
                .map_or(true, |length| length >= total);
            /* A later line from its own start: the marker after the end of
            the line before stands one character into it. */
            let from = (number > 0)
                .then(|| Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(line.0) }))
                .flatten();
            let piece = marker_range(
                area,
                from.as_ref().unwrap_or(&at),
                if done { &end } else { &line_end },
            )?;
            if let Some(rect) = marker_box(area, &piece) {
                boxes.push(rect);
            }
            if done {
                break;
            }
            at = parameterized(area, "AXNextTextMarkerForTextMarker", line_end.0)?;
        }
        Some(boxes)
    }

    /* A page's selection, where the point is inside it, and its box on each
    line. */
    fn selection_in_page(area: AXUIElementRef, point: CGPoint) -> Option<Found> {
        let selected =
            owned_attribute(area, "AXSelectedTextMarkerRange").filter(is_marker_range)?;
        if marker_box(area, &selected).is_some_and(|rect| !holds(rect, point)) {
            return None;
        }
        let boxes = marker_lines(area, &selected)?;
        if !boxes.iter().any(|rect| holds(*rect, point)) {
            return None;
        }
        let text = selected_on_page(area, &selected)?;
        let around = looked_up(&text)
            .then(|| around_page_selection(area, &selected))
            .flatten();
        Some((text, boxes, around, None))
    }

    fn index_number(index: CFIndex) -> Option<Owned> {
        Owned::new(unsafe {
            CFNumberCreate(
                kCFAllocatorDefault,
                CF_NUMBER_INDEX,
                &index as *const CFIndex as *const c_void,
            )
        })
    }

    /* The boxes of a range of an element's text, one per line: through the
    element's own lines where it knows them, else word by word where the
    range's one box is taller than a line — its box would take in the
    start of the first line and the end of the last. */
    fn range_lines(element: AXUIElementRef, range: CFRange, line: f64) -> Vec<CGRect> {
        /* Chrome answers every index with the largest number there is. */
        let line_of = |index: CFIndex| {
            index_number(index)
                .and_then(|at| parameterized(element, "AXLineForIndex", at.0))
                .and_then(|value| number(&value))
                .filter(|line| (0..1_000_000).contains(line))
        };
        let end = range.location + range.length;
        if let (Some(first), Some(last)) = (line_of(range.location), line_of(end - 1)) {
            let boxes: Vec<CGRect> = (first..=last.min(first + 400))
                .filter_map(|number| {
                    let whole: CFRange = ax_value(
                        &parameterized(element, "AXRangeForLine", index_number(number)?.0)?,
                        AX_VALUE_RANGE,
                    )?;
                    let from = whole.location.max(range.location);
                    let to = (whole.location + whole.length).min(end);
                    (to > from)
                        .then(|| {
                            range_box(
                                element,
                                CFRange {
                                    location: from,
                                    length: to - from,
                                },
                            )
                        })
                        .flatten()
                })
                .collect();
            if !boxes.is_empty() {
                return boxes;
            }
        }
        let Some(whole) = range_box(element, range) else {
            return Vec::new();
        };
        if whole.size.height <= line * 1.5 {
            return vec![whole];
        }
        let text = ax_range(range)
            .and_then(|asked| parameterized(element, "AXStringForRange", asked.0))
            .filter(is_string);
        let boxes: Vec<CGRect> = text
            .map(|text| words(text.0))
            .unwrap_or_default()
            .iter()
            .take(400)
            .filter_map(|word| {
                range_box(
                    element,
                    CFRange {
                        location: range.location + word.location,
                        length: word.length,
                    },
                )
            })
            .collect();
        if boxes.is_empty() {
            vec![whole]
        } else {
            lines_of(&boxes)
        }
    }

    /* Word boxes joined into one box per line: a box belongs to the line
    before it where their middles are less than half a line apart. */
    fn lines_of(boxes: &[CGRect]) -> Vec<CGRect> {
        let mut lines: Vec<CGRect> = Vec::new();
        for rect in boxes {
            let middle = rect.origin.y + rect.size.height / 2.0;
            if let Some(last) = lines.last_mut() {
                let last_middle = last.origin.y + last.size.height / 2.0;
                if (middle - last_middle).abs() < last.size.height / 2.0 {
                    let left = last.origin.x.min(rect.origin.x);
                    let right =
                        (last.origin.x + last.size.width).max(rect.origin.x + rect.size.width);
                    let top = last.origin.y.min(rect.origin.y);
                    let bottom =
                        (last.origin.y + last.size.height).max(rect.origin.y + rect.size.height);
                    *last = CGRect {
                        origin: CGPoint { x: left, y: top },
                        size: CGSize {
                            width: right - left,
                            height: bottom - top,
                        },
                    };
                    continue;
                }
            }
            lines.push(*rect);
        }
        lines
    }

    /* An element's own selection, where it holds the character that was
    clicked, and its boxes; a line is as tall as the clicked word. */
    fn selection_in_element(
        element: AXUIElementRef,
        index: CFIndex,
        word: CGRect,
    ) -> Option<Found> {
        let range: CFRange = ax_value(
            &owned_attribute(element, "AXSelectedTextRange")?,
            AX_VALUE_RANGE,
        )?;
        if range.length <= 0 || index < range.location || index >= range.location + range.length {
            return None;
        }
        let text = text_attribute(element, "AXSelectedText").or_else(|| {
            ax_range(range)
                .and_then(|range| parameterized(element, "AXStringForRange", range.0))
                .and_then(|value| string_from(value.0))
        })?;
        let around = looked_up(&text)
            .then(|| around_element_selection(element, range))
            .flatten();
        Some((
            text,
            range_lines(element, range, word.size.height),
            around,
            None,
        ))
    }

    /* Where a piece of a page's text starts in the page. */
    fn element_index(area: AXUIElementRef, element: AXUIElementRef) -> Option<CFIndex> {
        let own = parameterized(area, "AXTextMarkerRangeForUIElement", element)
            .filter(is_marker_range)?;
        let start = Owned::new(unsafe { AXTextMarkerRangeCopyStartMarker(own.0) })?;
        marker_index(area, start.0)
    }

    /* The word under the point, or the element's selection where the point
    is in it — never that where only words are wanted. */
    fn word_at(element: AXUIElementRef, point: CGPoint, words_only: bool) -> Option<Found> {
        if let Some(found) = word_by_marker(element, point) {
            return Some(found);
        }
        let (word, index, rect, place, around) =
            word_by_index(element, point).or_else(|| word_by_boxes(element, point))?;
        let line = rect.size.height;
        let (around, placed) = match in_block(element, place) {
            Some(block) => {
                let block = Some(block);
                let placed = web_area(element).and_then(|area| {
                    let index = element_index(area.0, element)? + place.location;
                    let placed = anchor(area.0, true, index, &block, line)?;
                    Some(Anchor {
                        block: block_of(element),
                        by_text: true,
                        ..placed
                    })
                });
                (block, placed)
            }
            None => match pdf_text(element, place) {
                Some((paragraph, pieces, index)) => {
                    let paragraph = Some(paragraph);
                    let placed = anchor(element, false, index, &paragraph, line)
                        .map(|placed| Anchor { pieces, ..placed });
                    (paragraph, placed)
                }
                None => {
                    /* A paragraph of a PDF in Chromium's viewer is one piece
                    of text with every line's break in it. */
                    let viewed = web_area(element).is_some_and(|area| pdf_view(area.0));
                    let around = around.map(|around| super::Around {
                        text: if viewed {
                            viewed_lines_joined(&around.text)
                        } else {
                            around.text
                        },
                        ..around
                    });
                    let placed = anchor(element, false, place.location, &around, line);
                    (around, placed)
                }
            },
        };
        let selected = (!words_only)
            .then(|| selection_in_element(element, index, rect))
            .flatten();
        Some(selected.unwrap_or((word, vec![rect], around, placed)))
    }

    fn frame(element: AXUIElementRef) -> Option<CGRect> {
        let origin = ax_value(&owned_attribute(element, "AXPosition")?, AX_VALUE_POINT)?;
        let size = ax_value(&owned_attribute(element, "AXSize")?, AX_VALUE_SIZE)?;
        Some(CGRect { origin, size })
    }

    /* The children of an element whose frames hold the point. */
    fn children_at(element: AXUIElementRef, point: CGPoint, budget: &mut usize) -> Vec<Owned> {
        let Some(children) = owned_attribute(element, "AXChildren") else {
            return Vec::new();
        };
        let mut found = Vec::new();
        for index in 0..unsafe { CFArrayGetCount(children.0) } {
            if *budget == 0 {
                break;
            }
            *budget -= 1;
            let child = unsafe { CFArrayGetValueAtIndex(children.0, index) };
            if frame(child).is_some_and(|rect| holds(rect, point)) {
                found.extend(Owned::retained(child));
            }
        }
        found
    }

    /* The word under the point in the element or below it, the child it
    came from passed over. */
    fn word_under(
        element: AXUIElementRef,
        point: CGPoint,
        skip: CFTypeRef,
        depth: usize,
        budget: &mut usize,
        words_only: bool,
    ) -> Option<Found> {
        if let Some(word) = word_at(element, point, words_only) {
            return Some(word);
        }
        if depth == 0 {
            return None;
        }
        children_at(element, point, budget)
            .iter()
            .filter(|child| skip.is_null() || unsafe { CFEqual(child.0, skip) } == 0)
            .find_map(|child| {
                word_under(
                    child.0,
                    point,
                    std::ptr::null(),
                    depth - 1,
                    budget,
                    words_only,
                )
            })
    }

    /* Chrome answers the question for a point from what it last worked out,
    and only then works out the new answer: a click away from the last one
    is answered with the paragraph around the text, the whole page, or a
    piece of text next to it whose frame takes in two lines (measured). The
    text is below that or beside it, so the search goes down from what was
    answered and then from each element above it. The budget caps how many
    children are looked at, so a page of a thousand paragraphs cannot hold
    a click up. */
    fn text_at(element: AXUIElementRef, point: CGPoint, words_only: bool) -> Option<Found> {
        let selected = (!words_only)
            .then(|| web_area(element).and_then(|area| selection_in_page(area.0, point)))
            .flatten();
        if selected.is_some() {
            return selected;
        }
        let mut budget = 400;
        let mut current = Owned::retained(element)?;
        let mut searched: Option<Owned> = None;
        for _ in 0..4 {
            let skip = searched.as_ref().map_or(std::ptr::null(), |child| child.0);
            if let Some(word) = word_under(current.0, point, skip, 8, &mut budget, words_only) {
                return Some(word);
            }
            if text_attribute(current.0, "AXRole").as_deref() == Some("AXWebArea") {
                return None;
            }
            let parent = owned_attribute(current.0, "AXParent")?;
            searched = Some(std::mem::replace(&mut current, parent));
        }
        None
    }

    fn element_at(system: &Owned, point: CGPoint) -> Option<Owned> {
        let mut element: AXUIElementRef = std::ptr::null();
        let status = unsafe {
            AXUIElementCopyElementAtPosition(system.0, point.x as f32, point.y as f32, &mut element)
        };
        if status != AX_OK {
            return None;
        }
        Owned::new(element)
    }

    /* The programs told an assistive program is reading, by process. */
    static WOKEN: std::sync::Mutex<Vec<i32>> = std::sync::Mutex::new(Vec::new());

    /* Chromium's word for it and the one VoiceOver sets, which Firefox and
    Word listen to. Told once per program; false where it was told
    already. */
    fn wake(pid: i32) -> bool {
        {
            let mut woken = WOKEN.lock().unwrap();
            if woken.contains(&pid) {
                return false;
            }
            woken.push(pid);
        }
        let Some(app) = Owned::new(unsafe { AXUIElementCreateApplication(pid) }) else {
            return false;
        };
        for name in ["AXManualAccessibility", "AXEnhancedUserInterface"] {
            let key = CfString::new(name);
            unsafe { AXUIElementSetAttributeValue(app.0, key.0, kCFBooleanTrue) };
        }
        true
    }

    /* What is under a point: a force click's word or selection, or with
    `words_only` the word alone, and where its surroundings stand. */
    fn read_at(
        point: CGPoint,
        route: &str,
        words_only: bool,
    ) -> Option<(Selection, Vec<super::Mark>, Option<Anchor>)> {
        let system = Owned::new(unsafe { AXUIElementCreateSystemWide() })?;
        /* Asked on the system-wide element, the wait holds for every
        element: a program that hangs must not hold the next click up. */
        unsafe { AXUIElementSetMessagingTimeout(system.0, 0.5) };
        let element = element_at(&system, point)?;
        let pid = pid_of(element.0);
        if pid <= 0 || pid == std::process::id() as i32 {
            return None;
        }
        let found = |(text, boxes, context, placed): Found| {
            let marks = marks_of(&boxes);
            let selection = Selection {
                text,
                source: pid,
                route: route.into(),
                context,
            };
            (selection, marks, placed)
        };
        if let Some(text) = text_at(element.0, point, words_only) {
            return Some(found(text));
        }
        if !wake(pid) {
            return None;
        }
        /* Measured in the built app: a second was not enough for Chrome or
        Word, and the first click in them came to nothing. */
        for _ in 0..10 {
            std::thread::sleep(Duration::from_millis(250));
            let element = element_at(&system, point)?;
            if pid_of(element.0) != pid {
                return None;
            }
            if let Some(text) = text_at(element.0, point, words_only) {
                return Some(found(text));
            }
        }
        None
    }

    fn marks_of(boxes: &[CGRect]) -> Vec<super::Mark> {
        boxes
            .iter()
            .map(|rect| super::Mark {
                x: rect.origin.x,
                y: rect.origin.y,
                width: rect.size.width,
                height: rect.size.height,
            })
            .collect()
    }

    fn pointer() -> Option<CGPoint> {
        unsafe {
            let event = CGEventCreate(std::ptr::null());
            if event.is_null() {
                return None;
            }
            let point = CGEventGetLocation(event);
            CFRelease(event);
            Some(point)
        }
    }

    /* The text around a selection whose place the program does not say,
    from the text under the pointer, which has just selected it: Safari's
    PDF view answers the selection to no element at all (measured), so the
    shortcut had the word from ⌘C and nothing around it. Taken only where
    the selection stands where the pointer is, within its own length and a
    few characters; a pointer moved elsewhere leaves the word alone. Asked
    once, without waking the program: the shortcut may not wait on it. */
    fn around_pointer(selected: &str) -> Option<super::Around> {
        let selected = selected.trim();
        if !looked_up(selected) {
            return None;
        }
        let point = pointer()?;
        let system = Owned::new(unsafe { AXUIElementCreateSystemWide() })?;
        unsafe { AXUIElementSetMessagingTimeout(system.0, 0.5) };
        let element = element_at(&system, point)?;
        if pid_of(element.0) == std::process::id() as i32 {
            return None;
        }
        let (_, _, around, _) = text_at(element.0, point, true)?;
        let around = around?;
        let at = super::selection_near(&around.text, around.at, selected)?;
        Some(super::Around { at, ..around })
    }

    /* The word under the pointer, for its shortcut, with its boxes; or,
    for the sentence's, the word and the text around it, the sentence's
    boxes asked for once the window has cut it out (sentence_marks).
    Nothing where there is no text under the pointer, or no permission. */
    pub fn read_under_pointer(sentence: bool) -> Option<(Selection, Vec<super::Mark>)> {
        if !trusted() {
            return None;
        }
        let point = pointer()?;
        let route = if sentence {
            "pointer-sentence"
        } else {
            "pointer-word"
        };
        let (selection, marks, placed) = read_at(point, route, true)?;
        /* Kept for the word too, as on Windows. */
        *LAST_ANCHOR.lock().unwrap() = placed;
        if !sentence {
            return Some((selection, marks));
        }
        selection.context.as_ref()?;
        Some((selection, Vec::new()))
    }

    /* The boxes of a stretch of the text handed to the window, by the
    pieces of text in the block that hold it: the pieces in order make the
    block's text, and the stretch is found in them by its characters other
    than white space — a list's marker and a line broken by hand are no
    piece of text, and the page's own counting of where a piece stands is
    not to be had in Chrome. Each piece is asked in its own counting. */
    fn page_pieces(
        anchor: &Anchor,
        block: AXUIElementRef,
        start: usize,
        end: usize,
    ) -> Vec<CGRect> {
        let Some(stretch) = anchor.text.get(start..end.min(anchor.text.len())) else {
            return Vec::new();
        };
        /* Without what leads it in that is no letter: a list's marker is
        in the block's text and in none of its pieces. */
        let taken_out = char::from_u32(u32::from(TAKEN_OUT));
        let wanted: Vec<char> = solid(&String::from_utf16_lossy(stretch))
            .0
            .into_iter()
            .filter(|c| Some(*c) != taken_out)
            .skip_while(|c| !c.is_alphanumeric())
            .collect();
        let mut pieces = Vec::new();
        let mut budget = 400;
        text_pieces(block, 8, &mut budget, &mut pieces);
        /* Every character of the block that is not white space: which piece
        it stands in, and where. */
        let mut chars = Vec::new();
        let mut homes = Vec::new();
        for (index, piece) in pieces.iter().enumerate() {
            let Some(text) = text_attribute(piece.0, "AXValue") else {
                continue;
            };
            let (run, places) = solid(&text);
            chars.extend(run);
            homes.extend(places.into_iter().map(|place| (index, place as CFIndex)));
        }
        /* Standing twice in the block, the one nearest to where the text
        before it puts it. */
        let before = solid(&String::from_utf16_lossy(&anchor.text[..start]))
            .0
            .iter()
            .filter(|c| Some(**c) != taken_out)
            .count();
        let Some(first) = occurrences(&chars, &wanted)
            .into_iter()
            .min_by_key(|&at| at.abs_diff(before.min(chars.len())))
        else {
            return Vec::new();
        };
        let mut boxes = Vec::new();
        let mut at = first;
        while at < first + wanted.len() {
            let (index, from) = homes[at];
            let mut last = at;
            while last + 1 < first + wanted.len() && homes[last + 1].0 == index {
                last += 1;
            }
            let range = CFRange {
                location: from,
                length: homes[last].1 - from + chars[last].len_utf16() as CFIndex,
            };
            boxes.extend(range_lines(pieces[index].0, range, anchor.line));
            at = last + 1;
        }
        lines_of(&boxes)
    }

    /* The pieces of text below an element, in order. */
    fn text_pieces(
        element: AXUIElementRef,
        depth: usize,
        budget: &mut usize,
        found: &mut Vec<Owned>,
    ) {
        if text_attribute(element, "AXRole").as_deref() == Some("AXStaticText") {
            found.extend(Owned::retained(element));
            return;
        }
        if depth == 0 {
            return;
        }
        let Some(children) = owned_attribute(element, "AXChildren") else {
            return;
        };
        for index in 0..unsafe { CFArrayGetCount(children.0) } {
            if *budget == 0 {
                return;
            }
            *budget -= 1;
            let child = unsafe { CFArrayGetValueAtIndex(children.0, index) };
            text_pieces(child, depth - 1, budget, found);
        }
    }

    /* The boxes of the stretch [start, end) of the text around the last
    word or sentence read under the pointer, in the units a JavaScript
    string counts. */
    pub fn sentence_marks(start: usize, end: usize) -> Vec<super::Mark> {
        /* Not taken out: the window steps on to the sentences after it. */
        let held = LAST_ANCHOR.lock().unwrap();
        let Some(anchor) = held.as_ref() else {
            return Vec::new();
        };
        if end <= start {
            return Vec::new();
        }
        let from = anchor.origin + start as CFIndex;
        let to = anchor.origin + end as CFIndex;
        let boxes = if !anchor.pieces.is_empty() {
            let mut boxes = Vec::new();
            for piece in &anchor.pieces {
                let (low, high) = (from.max(piece.start), to.min(piece.start + piece.length));
                if high > low {
                    let range = CFRange {
                        location: low - piece.start,
                        length: high - low,
                    };
                    boxes.extend(range_lines(piece.element.0, range, anchor.line));
                }
            }
            lines_of(&boxes)
        } else if anchor.page {
            let pieces = || {
                anchor
                    .block
                    .as_ref()
                    .map_or_else(Vec::new, |block| page_pieces(anchor, block.0, start, end))
            };
            let first = if anchor.by_text { pieces() } else { Vec::new() };
            if !first.is_empty() {
                return marks_of(&first);
            }
            let marker = |index: CFIndex| {
                index_number(index)
                    .and_then(|at| parameterized(anchor.holder.0, "AXTextMarkerForIndex", at.0))
            };
            let lines = marker(from)
                .zip(marker(to))
                .and_then(|(from, to)| marker_range(anchor.holder.0, &from, &to))
                .and_then(|stretch| marker_lines(anchor.holder.0, &stretch))
                .unwrap_or_default();
            /* Chrome hands out a marker for an index that belongs to the
            page as a whole, and a stretch between two such has the page's
            box (measured), so there its pieces are asked one by one. */
            let fits = !lines.is_empty()
                && lines
                    .iter()
                    .all(|rect| rect.size.height <= anchor.line * 2.0);
            if fits {
                lines
            } else if anchor.by_text {
                Vec::new()
            } else {
                pieces()
            }
        } else {
            range_lines(
                anchor.holder.0,
                CFRange {
                    location: from,
                    length: to - from,
                },
                anchor.line,
            )
        };
        marks_of(&boxes)
    }

    /* The event tap, as an address so it can sit in a static; 0 until made. */
    static TAP: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
    static LISTENING: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
    /* Whether the click holding the pressure has been heard: a force click
    is the second stage, reported once until the stage is back at 0. */
    static HEARD: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
    static ON_FORCE_CLICK: std::sync::Mutex<Option<super::ForceClick>> =
        std::sync::Mutex::new(None);

    /* The stage of a pressure event, through AppKit, which is the one that
    can say it; nothing for any other event. */
    fn pressure_stage(event: *const c_void) -> Option<i64> {
        let send = objc_msgSend as *const ();
        let wrap: extern "C" fn(*mut c_void, *const c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let unsigned: extern "C" fn(*mut c_void, *const c_void) -> u64 =
            unsafe { std::mem::transmute(send) };
        let signed: extern "C" fn(*mut c_void, *const c_void) -> i64 =
            unsafe { std::mem::transmute(send) };
        unsafe {
            let pool = objc_autoreleasePoolPush();
            let class = objc_getClass(c"NSEvent".as_ptr());
            let mut stage = None;
            if !class.is_null() {
                let ns = wrap(
                    class,
                    sel_registerName(c"eventWithCGEvent:".as_ptr()),
                    event,
                );
                if !ns.is_null()
                    && unsigned(ns, sel_registerName(c"type".as_ptr())) == PRESSURE as u64
                {
                    stage = Some(signed(ns, sel_registerName(c"stage".as_ptr())));
                }
            }
            objc_autoreleasePoolPop(pool);
            stage
        }
    }

    extern "C" fn on_tap_event(
        _proxy: *const c_void,
        kind: u32,
        event: *const c_void,
        _user: *mut c_void,
    ) -> *const c_void {
        /* The system switches a tap off that was slow to answer, or while
        secure input is on; it is switched back on while wanted. */
        if kind == TAP_DISABLED_BY_TIMEOUT || kind == TAP_DISABLED_BY_INPUT {
            let tap = TAP.load(Ordering::Relaxed);
            if tap != 0 && LISTENING.load(Ordering::Relaxed) {
                unsafe { CGEventTapEnable(tap as CFTypeRef, true) };
            }
            return event;
        }
        if event.is_null() || !LISTENING.load(Ordering::Relaxed) {
            return event;
        }
        /* Pressure arrives among the trackpad's gesture events, and between
        two of its own there are gesture events that are no pressure at
        all. Read as stage 0, they made one held force click into dozens,
        and the window drew the same word over and over. So only pressure
        counts, and a force click is heard once — again only after the
        finger has let go entirely. */
        let Some(stage) = pressure_stage(event) else {
            return event;
        };
        if stage == 0 {
            HEARD.store(false, Ordering::Relaxed);
            return event;
        }
        if stage >= 2 && !HEARD.swap(true, Ordering::Relaxed) {
            let point = unsafe { CGEventGetLocation(event) };
            /* Off the tap's thread: the tap is switched off by the system
            when it answers slowly, and reading takes a while. */
            std::thread::spawn(move || {
                let Some((selection, marks, _)) = read_at(point, "force-click", false) else {
                    return;
                };
                let act = ON_FORCE_CLICK.lock().unwrap().clone();
                if let Some(act) = act {
                    act(selection, marks);
                }
            });
        }
        event
    }

    /* The tap, made once on a thread of its own that runs its loop for the
    life of the app. */
    fn make_tap() -> bool {
        if TAP.load(Ordering::Relaxed) != 0 {
            return true;
        }
        let (tell, made) = std::sync::mpsc::channel();
        std::thread::spawn(move || unsafe {
            const SESSION: u32 = 1;
            const HEAD: u32 = 0;
            const LISTEN_ONLY: u32 = 1;
            let tap = CGEventTapCreate(
                SESSION,
                HEAD,
                LISTEN_ONLY,
                LISTENED,
                on_tap_event,
                std::ptr::null_mut(),
            );
            if tap.is_null() {
                let _ = tell.send(false);
                return;
            }
            let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0);
            if source.is_null() {
                CFRelease(tap);
                let _ = tell.send(false);
                return;
            }
            CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes);
            CGEventTapEnable(tap, true);
            TAP.store(tap as usize, Ordering::Relaxed);
            let _ = tell.send(true);
            CFRunLoopRun();
        });
        made.recv().unwrap_or(false)
    }

    /* Listening switched on or off. Answers whether a force click will now be
    heard: not before the permission is there, which the window asks about
    again whenever the permission changes. */
    pub fn watch_force_click(on: bool, act: super::ForceClick) -> bool {
        *ON_FORCE_CLICK.lock().unwrap() = Some(act);
        LISTENING.store(on, Ordering::Relaxed);
        let tap = TAP.load(Ordering::Relaxed);
        if !on {
            if tap != 0 {
                unsafe { CGEventTapEnable(tap as CFTypeRef, false) };
            }
            return false;
        }
        if !trusted() || !make_tap() {
            return false;
        }
        unsafe { CGEventTapEnable(TAP.load(Ordering::Relaxed) as CFTypeRef, true) };
        true
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        /* A selection is taken from the text under the pointer only where
        it stands at the pointer: the nearer of two, none far away. */
        #[test]
        fn a_selection_is_found_where_the_pointer_is() {
            let text = "el perro corre; otro perro duerme al sol";
            assert_eq!(crate::capture::selection_near(text, 3, "perro"), Some(3));
            assert_eq!(crate::capture::selection_near(text, 22, "perro"), Some(21));
            /* A drag leaves the pointer at the selection's end. */
            assert_eq!(
                crate::capture::selection_near(text, 14, "perro corre"),
                Some(3)
            );
            assert_eq!(crate::capture::selection_near(text, 38, "perro"), None);
            assert_eq!(crate::capture::selection_near(text, 3, "gato"), None);
            /* Counted as a JavaScript string counts: "😀" is two. */
            assert_eq!(
                crate::capture::selection_near("😀 perro", 3, "perro"),
                Some(3)
            );
        }

        /* A formula in a line, as Safari gives it, read as part of the
        line: every unit in its place, a word joiner where one went. The
        formula's stretch is written between « and ». */
        #[test]
        fn a_formula_in_a_line_ends_nothing() {
            let read = |marked: &str| {
                let place = |mark: &str| marked[..marked.find(mark).unwrap()].chars().count();
                let (start, end) = (place("«"), place("»") - 1);
                let text: String = marked.chars().filter(|c| !"«»".contains(*c)).collect();
                let mut units: Vec<u16> = text.encode_utf16().collect();
                formula_in_line(&mut units, start, end);
                assert_eq!(units.len(), text.encode_utf16().count());
                String::from_utf16(&units).unwrap().replace('\u{2060}', "_")
            };
            /* A break after it and a space either side. */
            assert_eq!(read("rho ( «ρ\n» ). Este"), "rho (_ρ__). Este");
            assert_eq!(read("en  «x=1\n»  y la"), "en _x=1__ y la");
            /* After a formula that ends a line the page's own space is
            missing: one stays. */
            assert_eq!(read("en  «x=0.2\n» es el"), "en _x=0.2_ es el");
            assert_eq!(read("en  «x=0.2\n»es el"), "en _x=0.2 es el");
            assert_eq!(read("valor «x\n»"), "valor x_");
            /* One space is the page's own, but for a bracket's. */
            assert_eq!(read("el mismo, «2\n». Luego"), "el mismo, 2_. Luego");
            assert_eq!(read("en «x=1\n» y la"), "en x=1_ y la");
            assert_eq!(read("donde «f\n» (como antes)"), "donde f_ (como antes)");
            assert_eq!(read("rho («ρ\n»). Este"), "rho (ρ_). Este");
            /* Its parts one to a line, a break before and after. */
            assert_eq!(read("rho (\n«ρ»\n). Luego"), "rho (_ρ_). Luego");
            assert_eq!(read("está en \n«x\n=\n1»\n. Otra"), "está en _x_=_1_. Otra");
            assert_eq!(
                read("fracción \n \n«a\n+\nb\n2»\n vale"),
                "fracción ___a_+_b_2_ vale"
            );
            assert_eq!(
                read("aparte:\n«x\n←\nm»\ny después"),
                "aparte: x_←_m y después"
            );
            /* And once more as it is drawn. */
            assert_eq!(read("rho (\n«ρ»\nρ). Luego"), "rho (_ρ__). Luego");
            assert_eq!(read("en \n«x\n=\n1»\nx=1. Otra"), "en _x_=_1____. Otra");
            assert_eq!(
                read("la \n«a\n2»\n2\na\n\u{200b}\t\n  vale"),
                "la _a_2_________ vale"
            );
            /* Text of the page is no copy: a word that happens to be the
            formula, and whatever else follows. */
            assert_eq!(read("de \n«a»\n a la derecha"), "de _a_ a la derecha");
            assert_eq!(
                read("aparte:\n«x\n←\nm»\nx←m\ny después sigue"),
                "aparte: x_←_m ____y después sigue"
            );
            assert_eq!(
                read("la \n«a\n2»\ny después sigue."),
                "la _a_2 y después sigue."
            );
            /* No break after it: nothing was added. */
            assert_eq!(read("rho («𝜌»). Este"), "rho (𝜌). Este");
        }

        fn words_of(text: &str) -> Vec<String> {
            let string = CfString::new(text);
            words(string.0)
                .into_iter()
                .filter_map(|range| word_text(string.0, range))
                .collect()
        }

        /* A long text goes along near the word only, and the word's place
        is counted the way a JavaScript string counts it: "😀" is two. */
        #[test]
        fn a_word_takes_the_text_near_it_along() {
            let text = format!("{}😀 Möwen kreisten{}", "a ".repeat(400), " b".repeat(2000));
            let string = CfString::new(&text);
            let at = text[..text.find("Möwen").unwrap()].encode_utf16().count() as CFIndex;
            let around = around_range(
                string.0,
                CFRange {
                    location: at,
                    length: 5,
                },
            )
            .unwrap();
            let utf16: Vec<u16> = around.text.encode_utf16().collect();
            assert_eq!(
                String::from_utf16(&utf16[around.at..around.at + 5]).unwrap(),
                "Möwen"
            );
            assert_eq!(utf16.len(), (AROUND + AHEAD) as usize + 5);
            assert!(around.cut, "the text goes on after it");
            let short = CfString::new("Der Hafen lag still.");
            let whole = around_range(
                short.0,
                CFRange {
                    location: 4,
                    length: 5,
                },
            )
            .unwrap();
            assert_eq!((whole.text.as_str(), whole.at), ("Der Hafen lag still.", 4));
        }

        /* Cut by the system's own word boundaries, so a script needs nothing
        of its own here; punctuation and spaces are never a word. */
        #[test]
        fn a_pdf_page_joins_full_lines_and_keeps_short_ones() {
            let text = "Contenidos:\nEl máster oficial en Sistemas Inteligentes está orientado a\nsuministrar alumnos competencias relacionadas con la I+D en la\nIngeniería Computacional de hoy.\nBloque 1: Conceptos\nAgentes Inteligentes\nBloque 2: Arquitecturas\nEs un camino largo y un Fahr-\nrad, el camino es largo [Wang,\n2017] y fin.";
            let joined = page_lines_joined(text);
            assert_eq!(
                joined,
                "Contenidos:\nEl máster oficial en Sistemas Inteligentes está orientado a suministrar alumnos competencias relacionadas con la I+D en la Ingeniería Computacional de hoy.\nBloque 1: Conceptos\nAgentes Inteligentes\nBloque 2: Arquitecturas\nEs un camino largo y un Fahr-\nrad, el camino es largo [Wang, 2017] y fin."
            );
            assert_eq!(joined.encode_utf16().count(), text.encode_utf16().count());
            /* A reference over a line's end breaks the line short. */
            let cited = "These include tasks such as natural language inference (Bowman et al., 2015;\nWilliams et al., 2018) and paraphrasing (Dolan\nand Brockett, 2005), which aim.\nShort line\na) first item\nb) second item";
            assert_eq!(
                page_lines_joined(cited),
                "These include tasks such as natural language inference (Bowman et al., 2015; Williams et al., 2018) and paraphrasing (Dolan and Brockett, 2005), which aim.\nShort line\na) first item\nb) second item"
            );
        }

        #[test]
        fn a_piece_found_twice_is_the_one_between_its_neighbours() {
            let page: Vec<char> = "A[Wang,2020].B[Cohen,2011].C[Dudfield,2020]."
                .chars()
                .collect();
            let run = |text: &str| text.chars().collect::<Vec<char>>();
            let found = piece_in_page(
                &page,
                &run("2020"),
                Some(&run("Dudfield")),
                Some(&run("].")),
            );
            assert_eq!(found, Some(38));
            let found = piece_in_page(&page, &run("2020"), Some(&run("Wang")), None);
            assert_eq!(found, Some(7));
            assert_eq!(piece_in_page(&page, &run("Nakov"), None, None), None);
        }

        #[test]
        fn words_are_cut_in_any_script_and_punctuation_is_none() {
            assert_eq!(
                words_of("Der Hafen lag still, im Nebel."),
                ["Der", "Hafen", "lag", "still", "im", "Nebel"]
            );
            assert_eq!(words_of("¿Abrió el mercado?"), ["Abrió", "el", "mercado"]);
            assert_eq!(
                words_of("Маяк стоял — пустой."),
                ["Маяк", "стоял", "пустой"]
            );
            assert_eq!(words_of("الميناء كان هادئا"), ["الميناء", "كان", "هادئا"]);
            assert!(words_of(" … — !").is_empty());
        }

        /* Word ranges are in UTF-16 units, the way the accessibility tree
        counts: a word after an emoji starts two units on, not one. */
        #[test]
        fn word_ranges_count_the_way_the_tree_counts() {
            let string = CfString::new("😀 Hafen");
            let found = words(string.0);
            assert_eq!(found.len(), 1);
            assert_eq!((found[0].location, found[0].length), (3, 5));
        }

        fn rect(x: f64, y: f64, width: f64, height: f64) -> CGRect {
            CGRect {
                origin: CGPoint { x, y },
                size: CGSize { width, height },
            }
        }

        /* A selection's word boxes become one box per line; a word set a
        little higher on the same line stays on it. */
        #[test]
        fn word_boxes_are_joined_a_line_at_a_time() {
            let lines = lines_of(&[
                rect(300.0, 100.0, 40.0, 20.0),
                rect(345.0, 102.0, 60.0, 18.0),
                rect(100.0, 125.0, 50.0, 20.0),
                rect(155.0, 125.0, 30.0, 20.0),
            ]);
            assert_eq!(lines.len(), 2);
            let first = lines[0];
            assert_eq!(
                (
                    first.origin.x,
                    first.origin.y,
                    first.size.width,
                    first.size.height
                ),
                (300.0, 100.0, 105.0, 20.0)
            );
            let second = lines[1];
            assert_eq!(
                (second.origin.x, second.origin.y, second.size.width),
                (100.0, 125.0, 85.0)
            );
        }

        #[test]
        fn a_point_on_the_edge_of_a_word_is_on_it() {
            let word = CGRect {
                origin: CGPoint { x: 10.0, y: 20.0 },
                size: CGSize {
                    width: 30.0,
                    height: 12.0,
                },
            };
            assert!(holds(word, CGPoint { x: 25.0, y: 26.0 }));
            assert!(holds(word, CGPoint { x: 40.5, y: 32.5 }));
            assert!(!holds(word, CGPoint { x: 42.0, y: 26.0 }));
            assert!(!holds(word, CGPoint { x: 25.0, y: 34.0 }));
        }
    }
}

pub use platform::{
    note_clipboard, open_settings, read, read_from_menu, read_under_pointer, request,
    sentence_marks, trusted, use_permission, watch_force_click, watch_front, write,
};

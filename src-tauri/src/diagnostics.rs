/* What a problem report needs to know about this installation, and nothing
of what was read in it.

The settings window builds the text (src/diagnostics.js) and the reader
copies it — nothing is sent anywhere. This side answers the two things
the page cannot know: which system version it runs on, and what went
wrong in the reading window, which is another window with its own memory.
The failures are kept in memory only, the last few, as the reading window
worded them for a log: kind, number, what the service said. */

use std::collections::VecDeque;
use std::sync::Mutex;

const KEPT: usize = 5;

static FAULTS: Mutex<VecDeque<String>> = Mutex::new(VecDeque::new());

#[tauri::command]
pub fn note_fault(line: String) {
    let mut faults = FAULTS.lock().unwrap_or_else(|e| e.into_inner());
    let line: String = line.chars().take(300).collect();
    if faults.back() == Some(&line) {
        return;
    }
    faults.push_back(line);
    while faults.len() > KEPT {
        faults.pop_front();
    }
}

#[derive(serde::Serialize)]
pub struct SystemReport {
    system: String,
    arch: &'static str,
    faults: Vec<String>,
}

#[tauri::command]
pub fn system_report() -> SystemReport {
    let faults = FAULTS
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .iter()
        .cloned()
        .collect();
    SystemReport {
        system: system_version(),
        arch: std::env::consts::ARCH,
        faults,
    }
}

#[cfg(target_os = "macos")]
fn system_version() -> String {
    std::process::Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .map(|out| format!("macOS {}", String::from_utf8_lossy(&out.stdout).trim()))
        .unwrap_or_else(|_| "macOS".into())
}

#[cfg(windows)]
fn system_version() -> String {
    use std::os::windows::process::CommandExt;
    /* Without a console window flashing up for it. */
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    std::process::Command::new("cmd")
        .args(["/c", "ver"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string())
        .unwrap_or_else(|_| "Windows".into())
}

#[cfg(not(any(target_os = "macos", windows)))]
fn system_version() -> String {
    std::env::consts::OS.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_last_few_failures_are_kept_and_a_repeat_once() {
        for n in 0..8 {
            note_fault(format!("fault {n}"));
            note_fault(format!("fault {n}"));
        }
        let report = system_report();
        assert_eq!(
            report.faults,
            ["fault 3", "fault 4", "fault 5", "fault 6", "fault 7"]
        );
        assert!(!report.system.is_empty());
    }
}

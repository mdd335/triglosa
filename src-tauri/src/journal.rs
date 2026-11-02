/* What the app did lately, in a few words a line: started, the window asked
for and where it was shown, put away, a shortcut pressed, the page ready.
Never a text, a word of one, the key or an address. Kept in a file in the
app's log folder, the last few hundred lines, so that a window that would
not come — reported on 2026-10-31, after a restart overnight —
leaves a trace to read afterwards. "Copy diagnostics" puts its end on the
clipboard with the rest of the report (diagnostics.rs); nothing is sent. */

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

static PATH: Mutex<Option<PathBuf>> = Mutex::new(None);
/* Trimmed back to the last lines once the file has grown past this. */
const MOST_BYTES: u64 = 64 * 1024;
const KEPT_LINES: usize = 400;
/* How many of the last lines go into a problem report. */
pub const REPORTED: usize = 40;

/* The file, in the folder the system keeps an app's logs in. */
pub fn open(directory: PathBuf) {
    if fs::create_dir_all(&directory).is_ok() {
        *PATH.lock().unwrap_or_else(|e| e.into_inner()) = Some(directory.join("journal.txt"));
    }
}

fn path() -> Option<PathBuf> {
    PATH.lock().unwrap_or_else(|e| e.into_inner()).clone()
}

/* One line, with the time in UTC before it. Nothing is said where the file
cannot be written: a journal that fails is no reason for the app to. */
pub fn note(what: &str) {
    let Some(path) = path() else {
        return;
    };
    if fs::metadata(&path).is_ok_and(|meta| meta.len() > MOST_BYTES) {
        if let Ok(text) = fs::read_to_string(&path) {
            let lines: Vec<&str> = text.lines().collect();
            let kept = lines[lines.len().saturating_sub(KEPT_LINES)..].join("\n");
            let _ = fs::write(&path, kept + "\n");
        }
    }
    let line: String = what.chars().filter(|c| !c.is_control()).take(200).collect();
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&path) {
        let _ = writeln!(file, "{} {line}", stamp(std::time::SystemTime::now()));
    }
}

/* The last lines, oldest first. */
pub fn recent(count: usize) -> Vec<String> {
    let Some(text) = path().and_then(|path| fs::read_to_string(path).ok()) else {
        return Vec::new();
    };
    let lines: Vec<String> = text.lines().map(str::to_string).collect();
    lines[lines.len().saturating_sub(count)..].to_vec()
}

/* What the page notes for itself, from a short list: the page says only
which of these happened, so nothing else can reach the file through it. */
const FROM_THE_PAGE: [&str; 3] = ["page ready", "page shown", "page put away"];

#[tauri::command]
pub fn note_journal(what: String) {
    if FROM_THE_PAGE.contains(&what.as_str()) {
        note(&what);
    }
}

/* A moment as the journal writes it, in UTC: 2026-10-31T12:04:05Z. */
fn stamp(at: std::time::SystemTime) -> String {
    let seconds = at
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_secs())
        .unwrap_or(0) as i64;
    let (days, rest) = (seconds.div_euclid(86_400), seconds.rem_euclid(86_400));
    let (year, month, day) = civil(days);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}Z",
        rest / 3600,
        rest % 3600 / 60,
        rest % 60
    )
}

/* Days since 1970-01-01 as a date of the calendar in use (Howard Hinnant's
`civil_from_days`). */
fn civil(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    (year, month, day)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_moment_is_written_in_utc() {
        let at = std::time::UNIX_EPOCH + std::time::Duration::from_secs(1_793_448_245);
        assert_eq!(stamp(at), "2026-10-31T12:04:05Z");
        assert_eq!(
            stamp(std::time::UNIX_EPOCH + std::time::Duration::from_secs(951_782_400)),
            "2000-02-29T00:00:00Z"
        );
    }

    #[test]
    fn the_journal_keeps_its_last_lines_and_takes_only_known_words_from_the_page() {
        let folder = std::env::temp_dir().join(format!("triglosa-journal-{}", std::process::id()));
        let _ = fs::remove_dir_all(&folder);
        open(folder.clone());
        for n in 0..3000 {
            note(&format!(
                "line {n} with a little more to say so that the file grows"
            ));
        }
        let size = fs::metadata(folder.join("journal.txt")).unwrap().len();
        assert!(size <= MOST_BYTES + 200, "{size}");
        assert_eq!(
            recent(1)[0].split_once(' ').unwrap().1,
            "line 2999 with a little more to say so that the file grows"
        );
        note_journal("page ready".into());
        note_journal("the text the reader read".into());
        let last = recent(1);
        assert!(last[0].ends_with(" page ready"), "{last:?}");
        let _ = fs::remove_dir_all(&folder);
    }
}

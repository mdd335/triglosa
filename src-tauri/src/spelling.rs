/* The system's own spelling checker: whether it knows a word in a language,
and what it would make of it where it does not (src/spelling.js decides what
that is worth). macOS through NSSpellChecker, Windows through ISpellChecker;
elsewhere nothing is known. What it would make of a word is asked only
where it is wanted (`full`): a correction and guesses cost the Mac about 60 ms
a language, a yes or no a few.

A language is every dictionary the system has for it: "pt" is Brazilian and
European Portuguese, "en" every English there is, and a word is known where
any of them knows it. Windows has a dictionary only for the languages set up
on it, and then the answer says there is none — which is "nothing known",
never "misspelled". */

use serde::Serialize;
use std::collections::HashMap;

/* What one language's dictionaries say about one word. */
#[derive(Serialize, Clone, Debug, Default, PartialEq)]
pub struct Verdict {
    /* Whether this system has a dictionary for the language at all. */
    pub there: bool,
    pub known: bool,
    /* The word it would put in by itself, where it is that sure. */
    pub correction: Option<String>,
    /* What it would offer, likeliest first. */
    pub guesses: Vec<String>,
}

const MOST_GUESSES: usize = 3;

/* Whether a dictionary's name is one of the language's: "pt_BR" and "pt-PT"
are Portuguese, "en" is English. */
fn is_of(tag: &str, code: &str) -> bool {
    tag.split(['_', '-'])
        .next()
        .is_some_and(|primary| primary.eq_ignore_ascii_case(code))
}

/* The language's own dictionary first where there is one by its bare name,
so that its correction is the one taken. */
fn dictionaries_of(available: &[String], code: &str) -> Vec<String> {
    let mut found: Vec<String> = available
        .iter()
        .filter(|tag| is_of(tag, code))
        .cloned()
        .collect();
    found.sort_by_key(|tag| !tag.eq_ignore_ascii_case(code));
    found
}

/* Several dictionaries of one language read as one. */
fn merged(verdicts: Vec<Verdict>) -> Verdict {
    if verdicts.is_empty() {
        return Verdict::default();
    }
    if verdicts.iter().any(|v| v.known) {
        return Verdict {
            there: true,
            known: true,
            ..Verdict::default()
        };
    }
    let mut guesses: Vec<String> = Vec::new();
    for guess in verdicts.iter().flat_map(|v| v.guesses.iter()) {
        if !guesses.contains(guess) {
            guesses.push(guess.clone());
        }
    }
    guesses.truncate(MOST_GUESSES);
    Verdict {
        there: true,
        known: false,
        correction: verdicts.iter().find_map(|v| v.correction.clone()),
        guesses,
    }
}

#[cfg(target_os = "macos")]
mod native {
    use super::{dictionaries_of, merged, Verdict, MOST_GUESSES};
    use std::collections::HashMap;
    use std::ffi::{c_void, CStr, CString};
    use std::os::raw::c_char;

    extern "C" {
        fn sel_registerName(name: *const c_char) -> *const c_void;
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn objc_msgSend();
        fn objc_autoreleasePoolPush() -> *mut c_void;
        fn objc_autoreleasePoolPop(pool: *mut c_void);
    }

    #[link(name = "AppKit", kind = "framework")]
    extern "C" {}

    #[repr(C)]
    #[derive(Clone, Copy)]
    struct Range {
        location: usize,
        length: usize,
    }

    const NOT_FOUND: usize = isize::MAX as usize;

    fn selector(name: &str) -> *const c_void {
        let name = CString::new(name).expect("a selector with no zero byte in it");
        unsafe { sel_registerName(name.as_ptr()) }
    }

    fn class(name: &str) -> *mut c_void {
        let name = CString::new(name).expect("a class name with no zero byte in it");
        unsafe { objc_getClass(name.as_ptr()) }
    }

    unsafe fn string(text: &str) -> *mut c_void {
        let send = objc_msgSend as *const ();
        let make: extern "C" fn(*mut c_void, *const c_void, *const c_char) -> *mut c_void =
            std::mem::transmute(send);
        let text = CString::new(text.replace('\0', "")).unwrap_or_default();
        make(
            class("NSString"),
            selector("stringWithUTF8String:"),
            text.as_ptr(),
        )
    }

    unsafe fn rust(object: *mut c_void) -> Option<String> {
        if object.is_null() {
            return None;
        }
        let send = objc_msgSend as *const ();
        let utf8: extern "C" fn(*mut c_void, *const c_void) -> *const c_char =
            std::mem::transmute(send);
        let bytes = utf8(object, selector("UTF8String"));
        (!bytes.is_null()).then(|| CStr::from_ptr(bytes).to_string_lossy().into_owned())
    }

    unsafe fn strings(array: *mut c_void) -> Vec<String> {
        if array.is_null() {
            return Vec::new();
        }
        let send = objc_msgSend as *const ();
        let count: extern "C" fn(*mut c_void, *const c_void) -> usize = std::mem::transmute(send);
        let at: extern "C" fn(*mut c_void, *const c_void, usize) -> *mut c_void =
            std::mem::transmute(send);
        (0..count(array, selector("count")))
            .filter_map(|index| rust(at(array, selector("objectAtIndex:"), index)))
            .collect()
    }

    /* One dictionary's verdict. */
    unsafe fn verdict(
        checker: *mut c_void,
        word: &str,
        language: &str,
        tag: isize,
        full: bool,
    ) -> Verdict {
        let send = objc_msgSend as *const ();
        let check: extern "C" fn(
            *mut c_void,
            *const c_void,
            *mut c_void,
            isize,
            *mut c_void,
            bool,
            isize,
            *mut isize,
        ) -> Range = std::mem::transmute(send);
        let correct: extern "C" fn(
            *mut c_void,
            *const c_void,
            Range,
            *mut c_void,
            *mut c_void,
            isize,
        ) -> *mut c_void = std::mem::transmute(send);
        let guess: extern "C" fn(
            *mut c_void,
            *const c_void,
            Range,
            *mut c_void,
            *mut c_void,
            isize,
        ) -> *mut c_void = std::mem::transmute(send);
        let text = string(word);
        let language = string(language);
        let miss = check(
            checker,
            selector(
                "checkSpellingOfString:startingAt:language:wrap:inSpellDocumentWithTag:wordCount:",
            ),
            text,
            0,
            language,
            false,
            tag,
            std::ptr::null_mut(),
        );
        if miss.location == NOT_FOUND || miss.length == 0 {
            return Verdict {
                there: true,
                known: true,
                ..Verdict::default()
            };
        }
        if !full {
            return Verdict {
                there: true,
                ..Verdict::default()
            };
        }
        let whole = Range {
            location: 0,
            length: word.encode_utf16().count(),
        };
        let correction = rust(correct(
            checker,
            selector("correctionForWordRange:inString:language:inSpellDocumentWithTag:"),
            whole,
            text,
            language,
            tag,
        ));
        let mut guesses = strings(guess(
            checker,
            selector("guessesForWordRange:inString:language:inSpellDocumentWithTag:"),
            whole,
            text,
            language,
            tag,
        ));
        guesses.truncate(MOST_GUESSES);
        Verdict {
            there: true,
            known: false,
            correction,
            guesses,
        }
    }

    /* One question at a time: the checker is shared by the whole process,
    and nothing says it may be asked from two threads at once. Not on the
    main thread — loading a language's dictionaries takes a second and more
    the first time, and the window would stand still for it. */
    static ONE_AT_A_TIME: std::sync::Mutex<()> = std::sync::Mutex::new(());

    /* Every word in every language. */
    pub fn check(
        words: &[String],
        languages: &[String],
        full: bool,
    ) -> HashMap<String, HashMap<String, Verdict>> {
        let _turn = ONE_AT_A_TIME
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let send = objc_msgSend as *const ();
        let object: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            unsafe { std::mem::transmute(send) };
        let number: extern "C" fn(*mut c_void, *const c_void) -> isize =
            unsafe { std::mem::transmute(send) };
        let close: extern "C" fn(*mut c_void, *const c_void, isize) =
            unsafe { std::mem::transmute(send) };
        let mut answers = HashMap::new();
        unsafe {
            let pool = objc_autoreleasePoolPush();
            let checker = object(class("NSSpellChecker"), selector("sharedSpellChecker"));
            if !checker.is_null() {
                let available = strings(object(checker, selector("availableLanguages")));
                /* A document of its own, so that nothing this reading checks
                is remembered for the next. */
                let tag = number(class("NSSpellChecker"), selector("uniqueSpellDocumentTag"));
                for word in words {
                    let mut per_language = HashMap::new();
                    for code in languages {
                        let verdicts = dictionaries_of(&available, code)
                            .iter()
                            .map(|dictionary| verdict(checker, word, dictionary, tag, full))
                            .collect();
                        per_language.insert(code.clone(), merged(verdicts));
                    }
                    answers.insert(word.clone(), per_language);
                }
                close(checker, selector("closeSpellDocumentWithTag:"), tag);
            }
            objc_autoreleasePoolPop(pool);
        }
        answers
    }
}

#[cfg(windows)]
mod native {
    use super::{dictionaries_of, merged, Verdict, MOST_GUESSES};
    use std::collections::HashMap;
    use windows::core::{HSTRING, PWSTR};
    use windows::Win32::Globalization::{
        ISpellChecker, ISpellCheckerFactory, ISpellingError, SpellCheckerFactory,
        CORRECTIVE_ACTION_REPLACE,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, IEnumString, CLSCTX_INPROC_SERVER,
        COINIT_MULTITHREADED,
    };

    fn take(text: PWSTR) -> String {
        if text.is_null() {
            return String::new();
        }
        let read = unsafe { text.to_string().unwrap_or_default() };
        unsafe { CoTaskMemFree(Some(text.0 as _)) };
        read
    }

    fn all(found: &IEnumString, most: usize) -> Vec<String> {
        let mut out = Vec::new();
        while out.len() < most {
            let mut one = [PWSTR::null()];
            let mut fetched = 0u32;
            if unsafe { found.Next(&mut one, Some(&mut fetched)) }.is_err() || fetched == 0 {
                break;
            }
            out.push(take(one[0]));
        }
        out
    }

    fn verdict(checker: &ISpellChecker, word: &str, full: bool) -> Option<Verdict> {
        let errors = unsafe { checker.Check(&HSTRING::from(word)) }.ok()?;
        let mut first: Option<ISpellingError> = None;
        unsafe { errors.Next(&mut first) }.ok().ok()?;
        let Some(error) = first else {
            return Some(Verdict {
                there: true,
                known: true,
                ..Verdict::default()
            });
        };
        let action = unsafe { error.CorrectiveAction() }.ok()?;
        let replacement = unsafe { error.Replacement() }.map(take).unwrap_or_default();
        let correction =
            (action == CORRECTIVE_ACTION_REPLACE && !replacement.is_empty()).then_some(replacement);
        let guesses = if full {
            unsafe { checker.Suggest(&HSTRING::from(word)) }
                .map(|found| all(&found, MOST_GUESSES))
                .unwrap_or_default()
        } else {
            Vec::new()
        };
        Some(Verdict {
            there: true,
            known: false,
            correction,
            guesses,
        })
    }

    pub fn check(
        words: &[String],
        languages: &[String],
        full: bool,
    ) -> HashMap<String, HashMap<String, Verdict>> {
        let mut answers = HashMap::new();
        let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
        let factory: Option<ISpellCheckerFactory> =
            unsafe { CoCreateInstance(&SpellCheckerFactory, None, CLSCTX_INPROC_SERVER) }.ok();
        let Some(factory) = factory else {
            return answers;
        };
        let available = unsafe { factory.SupportedLanguages() }
            .map(|found| all(&found, usize::MAX))
            .unwrap_or_default();
        let checkers: HashMap<&String, Vec<ISpellChecker>> = languages
            .iter()
            .map(|code| {
                let made = dictionaries_of(&available, code)
                    .iter()
                    .filter_map(|tag| {
                        unsafe { factory.CreateSpellChecker(&HSTRING::from(tag.as_str())) }.ok()
                    })
                    .collect();
                (code, made)
            })
            .collect();
        for word in words {
            let mut per_language = HashMap::new();
            for code in languages {
                let verdicts = checkers[code]
                    .iter()
                    .filter_map(|checker| verdict(checker, word, full))
                    .collect();
                per_language.insert(code.clone(), merged(verdicts));
            }
            answers.insert(word.clone(), per_language);
        }
        answers
    }
}

/* What every language the reader's reading touches says about each of a
looked-up text's words; with `full`, what it would make of a word it does
not know as well. Nothing at all where the question cannot be put. */
#[tauri::command]
pub async fn check_spelling(
    words: Vec<String>,
    languages: Vec<String>,
    full: Option<bool>,
) -> HashMap<String, HashMap<String, Verdict>> {
    let full = full.unwrap_or(false);
    #[cfg(any(target_os = "macos", windows))]
    {
        tauri::async_runtime::spawn_blocking(move || native::check(&words, &languages, full))
            .await
            .unwrap_or_default()
    }
    #[cfg(not(any(target_os = "macos", windows)))]
    {
        let _ = (words, languages, full);
        HashMap::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_language_is_every_dictionary_of_it_its_own_name_first() {
        let available: Vec<String> = ["en_GB", "en", "pt_BR", "pt-PT", "es"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(dictionaries_of(&available, "en"), ["en", "en_GB"]);
        assert_eq!(dictionaries_of(&available, "pt"), ["pt_BR", "pt-PT"]);
        assert!(dictionaries_of(&available, "de").is_empty());
    }

    #[test]
    fn known_in_one_dictionary_is_known() {
        let unknown = Verdict {
            there: true,
            known: false,
            correction: Some("x".into()),
            guesses: vec!["x".into()],
        };
        let known = Verdict {
            there: true,
            known: true,
            ..Verdict::default()
        };
        assert!(merged(vec![unknown.clone(), known]).known);
        assert_eq!(
            merged(vec![unknown.clone(), unknown.clone()]).guesses,
            ["x"]
        );
        assert!(!merged(Vec::new()).there);
    }

    /// The Mac's checker on a few words, run where AppKit is: cargo test --
    /// --ignored the_mac_checks
    #[cfg(target_os = "macos")]
    #[test]
    #[ignore]
    fn the_mac_checks() {
        let words: Vec<String> = ["Wrot", "Obacht", "weird"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        let languages: Vec<String> = ["de", "en", "pt", "xx"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        for (round, full) in [false, false, true].into_iter().enumerate() {
            let started = std::time::Instant::now();
            native::check(
                &["Kleingikeit".to_string()],
                &["de".into(), "en".into(), "es".into()],
                full,
            );
            println!("round {round}, full {full}: {:?}", started.elapsed());
        }
        let answers = native::check(&words, &languages, true);
        assert_eq!(answers["Wrot"]["de"].correction.as_deref(), Some("Wort"));
        assert!(answers["Obacht"]["de"].known);
        assert!(answers["weird"]["en"].known);
        assert!(answers["weird"]["pt"].there);
        assert!(!answers["weird"]["xx"].there);
    }
}

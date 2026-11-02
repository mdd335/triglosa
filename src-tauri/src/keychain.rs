/* The model key, kept out of the settings file.

The settings file is plain JSON in a directory that gets copied, synced and
pasted into bug reports. A key does not belong there, so it goes to the
system's own store instead — on macOS the keychain, reached through the
`security` tool that ships with it. That keeps the dependency list as it is
and uses the store macOS itself uses.

On Windows the counterpart is the Credential Manager, asked directly
through its API: Windows ships no tool that can read a stored password
back. Everything above the two functions here is platform-neutral, and the
JS side never learns which store answered.

On the iPhone it is the keychain again, asked through the Security
framework: there is no tool to run there.

One honest caveat: `security` takes the password as an argument, so it is
briefly visible to anyone who can list processes on this machine. There is
no stdin route in that tool, and a user who can read this machine's process
list can read the keychain through the same account anyway. */

#[cfg_attr(target_os = "windows", allow(dead_code))]
const SERVICE: &str = "Triglosa";

/* One entry per way to a model that takes a key (see setup.js), and the one
entry from before there were ways, which the first of them takes over. No
other name reaches the store. */
const ACCOUNTS: [&str; 3] = ["model-online", "model-own", "model-endpoint"];

pub fn account(name: &str) -> Result<&'static str, String> {
    ACCOUNTS
        .iter()
        .copied()
        .find(|known| *known == name)
        .ok_or_else(|| format!("unknown key entry: {name}"))
}

#[cfg(target_os = "macos")]
pub fn read(account: &str) -> Result<String, String> {
    let output = std::process::Command::new("security")
        .args(["find-generic-password", "-s", SERVICE, "-a", account, "-w"])
        .output()
        .map_err(|e| e.to_string())?;
    /* Not found is the ordinary first-start case, not a failure: the app then
    runs without a key, which is a state it is built for. */
    if !output.status.success() {
        return Ok(String::new());
    }
    Ok(String::from_utf8_lossy(&output.stdout)
        .trim_end_matches('\n')
        .to_string())
}

#[cfg(target_os = "macos")]
pub fn write(account: &str, key: &str) -> Result<(), String> {
    /* An empty key means "forget it". Deleting an entry that is not there is
    not an error either — the wanted state is reached in both cases. */
    if key.is_empty() {
        let _ = std::process::Command::new("security")
            .args(["delete-generic-password", "-s", SERVICE, "-a", account])
            .output();
        return Ok(());
    }
    /* -U updates the entry in place instead of refusing because it exists. */
    let output = std::process::Command::new("security")
        .args([
            "add-generic-password",
            "-U",
            "-s",
            SERVICE,
            "-a",
            account,
            "-w",
            key,
        ])
        .output()
        .map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(())
}

#[cfg(target_os = "windows")]
mod credentials {
    use windows::core::{PCWSTR, PWSTR};
    use windows::Win32::Security::Credentials::{
        CredDeleteW, CredFree, CredReadW, CredWriteW, CREDENTIALW, CRED_PERSIST_LOCAL_MACHINE,
        CRED_TYPE_GENERIC,
    };

    fn wide(text: &str) -> Vec<u16> {
        text.encode_utf16().chain(std::iter::once(0)).collect()
    }

    /* An entry per account, named the way the Credential Manager lists
    generic ones: "Triglosa/model-online". */
    fn target(account: &str) -> String {
        format!("{}/{account}", super::SERVICE)
    }

    pub fn read(account: &str) -> Result<String, String> {
        read_from(&target(account))
    }

    pub fn write(account: &str, key: &str) -> Result<(), String> {
        write_to(&target(account), account, key)
    }

    pub fn read_from(target: &str) -> Result<String, String> {
        let name = wide(target);
        let mut found: *mut CREDENTIALW = std::ptr::null_mut();
        /* Not found is the ordinary first start, as on macOS. */
        if unsafe { CredReadW(PCWSTR(name.as_ptr()), CRED_TYPE_GENERIC, None, &mut found) }.is_err()
        {
            return Ok(String::new());
        }
        let key = unsafe {
            let entry = &*found;
            let bytes =
                std::slice::from_raw_parts(entry.CredentialBlob, entry.CredentialBlobSize as usize);
            let key = String::from_utf8_lossy(bytes).into_owned();
            CredFree(found as *const std::ffi::c_void);
            key
        };
        Ok(key)
    }

    pub fn write_to(target: &str, account: &str, key: &str) -> Result<(), String> {
        let mut name = wide(target);
        if key.is_empty() {
            let _ = unsafe { CredDeleteW(PCWSTR(name.as_ptr()), CRED_TYPE_GENERIC, None) };
            return Ok(());
        }
        let mut account = wide(account);
        let mut blob = key.as_bytes().to_vec();
        let entry = CREDENTIALW {
            Type: CRED_TYPE_GENERIC,
            TargetName: PWSTR(name.as_mut_ptr()),
            UserName: PWSTR(account.as_mut_ptr()),
            CredentialBlobSize: blob.len() as u32,
            CredentialBlob: blob.as_mut_ptr(),
            /* This machine and this user, not roamed to other machines. */
            Persist: CRED_PERSIST_LOCAL_MACHINE,
            ..Default::default()
        };
        unsafe { CredWriteW(&entry, 0) }.map_err(|error| error.message())
    }
}

#[cfg(target_os = "windows")]
pub use credentials::{read, write};

#[cfg(target_os = "ios")]
mod items {
    use std::ffi::c_void;

    type Ref = *const c_void;

    #[repr(C)]
    struct CallBacks {
        _opaque: [u8; 0],
    }

    const UTF8: u32 = 0x0800_0100;
    const NOT_FOUND: i32 = -25300;

    #[link(name = "Security", kind = "framework")]
    extern "C" {
        static kSecClass: Ref;
        static kSecClassGenericPassword: Ref;
        static kSecAttrService: Ref;
        static kSecAttrAccount: Ref;
        static kSecAttrAccessible: Ref;
        static kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: Ref;
        static kSecValueData: Ref;
        static kSecReturnData: Ref;
        fn SecItemCopyMatching(query: Ref, result: *mut Ref) -> i32;
        fn SecItemAdd(attributes: Ref, result: *mut Ref) -> i32;
        fn SecItemDelete(query: Ref) -> i32;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        static kCFBooleanTrue: Ref;
        static kCFTypeDictionaryKeyCallBacks: CallBacks;
        static kCFTypeDictionaryValueCallBacks: CallBacks;
        fn CFDictionaryCreateMutable(
            allocator: Ref,
            capacity: isize,
            keys: *const CallBacks,
            values: *const CallBacks,
        ) -> Ref;
        fn CFDictionarySetValue(dictionary: Ref, key: Ref, value: Ref);
        fn CFStringCreateWithBytes(
            allocator: Ref,
            bytes: *const u8,
            length: isize,
            encoding: u32,
            external: u8,
        ) -> Ref;
        fn CFDataCreate(allocator: Ref, bytes: *const u8, length: isize) -> Ref;
        fn CFDataGetBytePtr(data: Ref) -> *const u8;
        fn CFDataGetLength(data: Ref) -> isize;
        fn CFRelease(object: Ref);
    }

    unsafe fn string(text: &str) -> Ref {
        CFStringCreateWithBytes(
            std::ptr::null(),
            text.as_ptr(),
            text.len() as isize,
            UTF8,
            0,
        )
    }

    /* One entry, as a query: the dictionary holds its strings itself. */
    unsafe fn entry(account: &str) -> Ref {
        let query = CFDictionaryCreateMutable(
            std::ptr::null(),
            0,
            &raw const kCFTypeDictionaryKeyCallBacks,
            &raw const kCFTypeDictionaryValueCallBacks,
        );
        CFDictionarySetValue(query, kSecClass, kSecClassGenericPassword);
        for (key, value) in [
            (kSecAttrService, super::SERVICE),
            (kSecAttrAccount, account),
        ] {
            let value = string(value);
            CFDictionarySetValue(query, key, value);
            CFRelease(value);
        }
        query
    }

    pub fn read(account: &str) -> Result<String, String> {
        unsafe {
            let query = entry(account);
            CFDictionarySetValue(query, kSecReturnData, kCFBooleanTrue);
            let mut found: Ref = std::ptr::null();
            let status = SecItemCopyMatching(query, &mut found);
            CFRelease(query);
            /* Not found is the ordinary first start, as on macOS. */
            if status == NOT_FOUND || found.is_null() {
                return Ok(String::new());
            }
            if status != 0 {
                return Err(format!("keychain: {status}"));
            }
            let bytes = std::slice::from_raw_parts(
                CFDataGetBytePtr(found),
                CFDataGetLength(found) as usize,
            );
            let key = String::from_utf8_lossy(bytes).into_owned();
            CFRelease(found);
            Ok(key)
        }
    }

    pub fn write(account: &str, key: &str) -> Result<(), String> {
        unsafe {
            let query = entry(account);
            /* Taken out first either way: an empty key means "forget it", and
            adding refuses an entry that is already there. */
            SecItemDelete(query);
            if key.is_empty() {
                CFRelease(query);
                return Ok(());
            }
            let data = CFDataCreate(std::ptr::null(), key.as_ptr(), key.len() as isize);
            CFDictionarySetValue(query, kSecValueData, data);
            /* This phone only, and readable once it was unlocked after a
            restart. */
            CFDictionarySetValue(
                query,
                kSecAttrAccessible,
                kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            );
            let status = SecItemAdd(query, std::ptr::null_mut());
            CFRelease(data);
            CFRelease(query);
            if status != 0 {
                return Err(format!("keychain: {status}"));
            }
            Ok(())
        }
    }
}

#[cfg(target_os = "ios")]
pub use items::{read, write};

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "ios")))]
pub fn read(_account: &str) -> Result<String, String> {
    Ok(String::new())
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "ios")))]
pub fn write(_account: &str, _key: &str) -> Result<(), String> {
    Err("This platform has no key store yet.".to_string())
}

/* The model key. It never passes through the settings file. An empty key means the app runs without
one, which is a state it is built for: the translation panels keep working
and everything the model would add stays visibly locked. */
/* Off the main thread, and given up after a while: on the Mac the store is
asked through a tool, which waits for as long as the system keeps a question
of its own open, and a command without `async` runs on the main thread — the
whole app, menu and shortcut included, would wait with it. A key not read in
time is no key; the reading window then says what a model would add. */
const READ_WAIT: std::time::Duration = std::time::Duration::from_secs(20);

#[tauri::command]
pub async fn read_api_key(account: String) -> Result<String, String> {
    let account = crate::keychain::account(&account)?;
    let (tell, answer) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        let _ = tell.send(read(account));
    });
    tauri::async_runtime::spawn_blocking(move || answer.recv_timeout(READ_WAIT))
        .await
        .map_err(|error| error.to_string())?
        .unwrap_or_else(|_| {
            crate::journal::note("the key was not read in time");
            Ok(String::new())
        })
}

#[tauri::command]
pub async fn write_api_key(account: String, key: String) -> Result<(), String> {
    let account = crate::keychain::account(&account)?;
    let key = key.trim().to_string();
    tauri::async_runtime::spawn_blocking(move || write(account, &key))
        .await
        .map_err(|error| error.to_string())?
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::credentials::{read_from, write_to};

    /* An entry of its own, so running this never touches a reader's key. */
    #[test]
    fn a_key_written_to_the_credential_manager_reads_back() {
        let target = "Triglosa/test-entry";
        /* A process without a logon session of its own — an SSH session, a
        scheduled task, a CI runner's service — has no credential store at
        all, which says nothing about the code. */
        if let Err(error) = write_to(target, "test-entry", "sk-test-ÄÖ-123") {
            eprintln!("no credential store in this session, skipped: {error}");
            return;
        }
        assert_eq!(read_from(target).expect("read"), "sk-test-ÄÖ-123");
        write_to(target, "test-entry", "").expect("forgotten");
        assert_eq!(read_from(target).expect("read"), "");
    }
}

#[cfg(test)]
mod account_tests {
    #[test]
    fn only_the_known_entries_reach_the_store() {
        assert_eq!(super::account("model-online"), Ok("model-online"));
        assert_eq!(super::account("model-endpoint"), Ok("model-endpoint"));
        assert!(super::account("login.keychain").is_err());
        assert!(super::account("").is_err());
    }
}

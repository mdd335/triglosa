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

   One honest caveat: `security` takes the password as an argument, so it is
   briefly visible to anyone who can list processes on this machine. There is
   no stdin route in that tool, and a user who can read this machine's process
   list can read the keychain through the same account anyway. */

#[cfg_attr(target_os = "windows", allow(dead_code))]
const SERVICE: &str = "Triglosa";
const ACCOUNT: &str = "model-endpoint";

#[cfg(target_os = "macos")]
pub fn read() -> Result<String, String> {
    let output = std::process::Command::new("security")
        .args(["find-generic-password", "-s", SERVICE, "-a", ACCOUNT, "-w"])
        .output()
        .map_err(|e| e.to_string())?;
    /* Not found is the ordinary first-start case, not a failure: the app then
       runs without a key, which is a state it is built for. */
    if !output.status.success() {
        return Ok(String::new());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim_end_matches('\n').to_string())
}

#[cfg(target_os = "macos")]
pub fn write(key: &str) -> Result<(), String> {
    /* An empty key means "forget it". Deleting an entry that is not there is
       not an error either — the wanted state is reached in both cases. */
    if key.is_empty() {
        let _ = std::process::Command::new("security")
            .args(["delete-generic-password", "-s", SERVICE, "-a", ACCOUNT])
            .output();
        return Ok(());
    }
    /* -U updates the entry in place instead of refusing because it exists. */
    let output = std::process::Command::new("security")
        .args(["add-generic-password", "-U", "-s", SERVICE, "-a", ACCOUNT, "-w", key])
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

    /* One entry, named the way the Credential Manager lists generic ones. */
    const TARGET: &str = "Triglosa/model-endpoint";

    pub fn read() -> Result<String, String> {
        read_from(TARGET)
    }

    pub fn write(key: &str) -> Result<(), String> {
        write_to(TARGET, key)
    }

    pub fn read_from(target: &str) -> Result<String, String> {
        let name = wide(target);
        let mut found: *mut CREDENTIALW = std::ptr::null_mut();
        /* Not found is the ordinary first start, as on macOS. */
        if unsafe { CredReadW(PCWSTR(name.as_ptr()), CRED_TYPE_GENERIC, None, &mut found) }.is_err() {
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

    pub fn write_to(target: &str, key: &str) -> Result<(), String> {
        let mut name = wide(target);
        if key.is_empty() {
            let _ = unsafe { CredDeleteW(PCWSTR(name.as_ptr()), CRED_TYPE_GENERIC, None) };
            return Ok(());
        }
        let mut account = wide(super::ACCOUNT);
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

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn read() -> Result<String, String> {
    Ok(String::new())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn write(_key: &str) -> Result<(), String> {
    Err("This platform has no key store yet.".to_string())
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
        if let Err(error) = write_to(target, "sk-test-ÄÖ-123") {
            eprintln!("no credential store in this session, skipped: {error}");
            return;
        }
        assert_eq!(read_from(target).expect("read"), "sk-test-ÄÖ-123");
        write_to(target, "").expect("forgotten");
        assert_eq!(read_from(target).expect("read"), "");
    }
}

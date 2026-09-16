/* The model key, kept out of the settings file.

   The settings file is plain JSON in a directory that gets copied, synced and
   pasted into bug reports. A key does not belong there, so it goes to the
   system's own store instead — on macOS the keychain, reached through the
   `security` tool that ships with it. That keeps the dependency list as it is
   and uses the store macOS itself uses.

   Windows has a counterpart, the Credential Manager, and this file is where
   it hangs: everything above the two functions here is platform-neutral, and
   the JS side never learns which store answered.

   One honest caveat: `security` takes the password as an argument, so it is
   briefly visible to anyone who can list processes on this machine. There is
   no stdin route in that tool, and a user who can read this machine's process
   list can read the keychain through the same account anyway. */

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

#[cfg(not(target_os = "macos"))]
pub fn read() -> Result<String, String> {
    Ok(String::new())
}

#[cfg(not(target_os = "macos"))]
pub fn write(_key: &str) -> Result<(), String> {
    Err("This platform has no key store yet.".to_string())
}

/* Installing a newer version, on the reader's click and never otherwise.

The window has already asked GitHub whether there is one (src/updates.js)
and shows what it found; this is the step after, when the reader asks for
it. The updater reads `latest.json` from the newest release, downloads the
file for this system, checks it against the public key in tauri.conf.json
and puts it in place of the running app. A file that does not carry the
signature made with the matching private key is refused.

Nothing of this needs Apple's or Microsoft's signing: the updater's
signature is its own. And a file the app downloaded itself carries no
quarantine mark, so the Mac asks nothing on the way.

The window tells the failures apart by their first word, the way it does
for the AI model (model-fetch.js):

  none         the release carries nothing to install from — the window
               offers the download page instead
  unreachable  the release could not be asked or downloaded
  failed       the download arrived and could not be verified or put in
               place */

use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, serde::Serialize)]
struct Progress {
    done: u64,
    total: Option<u64>,
}

/* Not reached is not the same as reached and refused: a release that could
not be fetched is worth trying again later, one whose file did not verify
is not. */
fn said(error: tauri_plugin_updater::Error) -> String {
    match error {
        tauri_plugin_updater::Error::Reqwest(inner) => format!("unreachable: {inner}"),
        other => format!("failed: {other}"),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| format!("failed: {e}"))?;
    let update = updater
        .check()
        .await
        .map_err(said)?
        .ok_or_else(|| "none: the newest release has nothing to install from".to_string())?;
    let mut done: u64 = 0;
    let reporter = app.clone();
    update
        .download_and_install(
            move |chunk, total| {
                done += chunk as u64;
                let _ = reporter.emit("update-progress", Progress { done, total });
            },
            || {},
        )
        .await
        .map_err(said)?;
    /* On Windows the installer has already ended this process; on the Mac
    the new bundle stands where the old one stood, and this starts it. */
    app.restart();
}

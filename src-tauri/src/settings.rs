/* The settings file. Its directory comes from the platform rather than from a
path written down here, so Windows needs no special case later.

Reading a file that is not there is not a failure — it is the first start,
and the app then runs on its defaults. Anything unreadable is handed up as
text so the window can say what happened rather than quietly resetting
somebody's settings. */
use std::fs;

use tauri::Manager;

pub fn settings_file(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let directory = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory.join("settings.json"))
}

#[tauri::command]
pub fn read_settings(app: tauri::AppHandle) -> Result<String, String> {
    let path = settings_file(&app)?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_settings(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    fs::write(settings_file(&app)?, contents).map_err(|e| e.to_string())
}

/* A file of the app's own beside the settings, for what the page keeps that
is not a setting: the anonymous count's days (src/stats.js). Only names
listed here, so the page cannot write anywhere else. */
const STATES: [&str; 1] = ["counted"];

fn state_file(app: &tauri::AppHandle, name: &str) -> Result<std::path::PathBuf, String> {
    if !STATES.contains(&name) {
        return Err(format!("no state called {name}"));
    }
    let directory = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory.join(format!("{name}.json")))
}

#[tauri::command]
pub fn read_state(app: tauri::AppHandle, name: String) -> Result<String, String> {
    let path = state_file(&app, &name)?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_state(app: tauri::AppHandle, name: String, contents: String) -> Result<(), String> {
    fs::write(state_file(&app, &name)?, contents).map_err(|e| e.to_string())
}

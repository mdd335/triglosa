// The windows_subsystem attribute keeps a console window from opening on
// Windows; it costs nothing on macOS and saves a special case later.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    triglosa_lib::run()
}

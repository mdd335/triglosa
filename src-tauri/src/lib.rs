/* The shell around the app.
Everything that leaves the process goes through it: the model endpoint, the
key store, the settings file, and on a computer the windows, the menu bar,
the shortcuts and what is read out of other programs (desktop.rs). On the
iPhone there is one page and none of the rest (mobile.rs). */

mod diagnostics;
mod identify;
mod journal;
mod keychain;
mod model;
mod settings;

#[cfg(desktop)]
mod align;
#[cfg(desktop)]
mod capture;
#[cfg(desktop)]
mod desktop;
#[cfg(desktop)]
mod highlight;
#[cfg(desktop)]
mod keyboard;
#[cfg(desktop)]
mod ocr;
#[cfg(desktop)]
mod overlay;
#[cfg(desktop)]
mod pieces;
#[cfg(desktop)]
mod screen;
mod spelling;
#[cfg(desktop)]
mod update;

#[cfg(desktop)]
pub use desktop::run;

#[cfg(mobile)]
mod mobile;
#[cfg(mobile)]
pub use mobile::run;

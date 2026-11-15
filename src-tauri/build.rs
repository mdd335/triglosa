fn main() {
    /* ONNX Runtime for the iPhone (the word aligner) runs on Core ML where it
    can, and the library Rust links for the phone has to name it. */
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("ios") {
        println!("cargo:rustc-link-lib=framework=CoreML");
    }
    tauri_build::build()
}

/* ONNX Runtime for the iPhone, which the word aligner runs on there
   (src-tauri/src/align.rs). The `ort` crate brings a ready-made library for
   the Mac and Windows only; for the iPhone it links the one Microsoft
   publishes, a static library for the phone and one for the simulator. This
   fetches that archive once, by checksum, and lays each library out the way
   `ort` takes it through ORT_LIB_LOCATION: the one architecture the app is
   built for, named libonnxruntime.a.

   It also lays a copy of the compiler's iOS runtime there under the Mac's
   runtime's name: `ort` asks for `clang_rt.osx` on every Apple system, and a
   build for the phone cannot take the Mac's.

   Version 1.22.0 is the one `ort` 2.0.0-rc.10 is written against.

     node scripts/onnxruntime-ios.mjs        (scripts/ios.mjs runs it) */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ARCHIVE = "https://download.onnxruntime.ai/pod-archive-onnxruntime-c-1.22.0.zip";
const CHECKSUM = "90d9de5a139087a6b05a18125d01d01d198820e1731e6f0f11b38749b2ab181f";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const folder = path.join(root, "src-tauri", "gen", "onnxruntime");
/* Where the archive's library for each build lies, and the compiler's
   runtime for it. */
const SLICES = {
  device: ["ios-arm64", "libclang_rt.ios.a"],
  simulator: ["ios-arm64_x86_64-simulator", "libclang_rt.iossim.a"],
};

async function checksum(file) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(file), hash);
  return hash.digest("hex");
}

/* The folder to hand `ort` for a build for the phone or for the simulator,
   fetched and laid out where it is not yet. */
export async function onnxRuntimeFor(kind, developerDir) {
  const [slice, runtime] = SLICES[kind];
  const out = path.join(folder, kind);
  const library = path.join(out, "libonnxruntime.a");
  if (existsSync(library)) return out;
  mkdirSync(folder, { recursive: true });
  const zip = path.join(folder, "onnxruntime-c-1.22.0.zip");
  if (!existsSync(zip) || (await checksum(zip)) !== CHECKSUM) {
    const response = await fetch(ARCHIVE);
    if (!response.ok) throw new Error(`ONNX Runtime for the iPhone: the download answered ${response.status}`);
    const partial = `${zip}.part`;
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
    const got = await checksum(partial);
    if (got !== CHECKSUM) {
      rmSync(partial, { force: true });
      throw new Error(`ONNX Runtime for the iPhone: the checksum is ${got}, not the expected one`);
    }
    renameSync(partial, zip);
  }
  const unpacked = path.join(folder, "unpacked");
  if (!existsSync(unpacked)) execFileSync("unzip", ["-q", zip, "-d", unpacked]);
  mkdirSync(out, { recursive: true });
  const fat = path.join(unpacked, "onnxruntime.xcframework", slice, "onnxruntime.framework", "onnxruntime");
  execFileSync("lipo", [fat, "-thin", "arm64", "-output", library]);
  const clang = path.join(developerDir, "Toolchains", "XcodeDefault.xctoolchain", "usr", "lib", "clang");
  const version = execFileSync("ls", [clang], { encoding: "utf8" }).trim().split("\n").pop();
  copyFileSync(path.join(clang, version, "lib", "darwin", runtime), path.join(out, "libclang_rt.osx.a"));
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const developer = process.env.XCODE_DEVELOPER_DIR || "/Applications/Xcode.app/Contents/Developer";
  for (const kind of Object.keys(SLICES)) console.log(await onnxRuntimeFor(kind, developer));
}

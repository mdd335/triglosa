/* Packing the signed app into the disk image a release carries.

   Tauri can build a DMG of its own, but it builds it before `sign.mjs` has
   run, so the app inside would carry the code-hash requirement and lose its
   Accessibility permission with the next version. This packs the app that
   was signed instead, next to a link to /Applications so the window that
   opens says what to do with it.

   The name carries the version and the architecture: the build is Apple
   silicon only, and a file called Triglosa.dmg says nothing to somebody with an
   Intel Mac. */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP = "src-tauri/target/release/bundle/macos/Triglosa.app";
const OUT = "src-tauri/target/release/bundle/dmg";

if (!existsSync(APP)) {
  console.error(`${APP} is not there — run npm run bundle first.`);
  process.exit(1);
}

const run = (command, args) =>
  execFileSync(command, args, { stdio: ["ignore", "ignore", "inherit"] });

/* A dmg of an app whose seal is broken opens as "damaged" on every other
   Mac, which is a far worse first sentence than the usual warning. */
run("codesign", ["--verify", "--deep", "--strict", APP]);

const { version } = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
const arch = execFileSync("uname", ["-m"], { encoding: "utf8" }).trim();
const image = join(OUT, `Triglosa-${version}-${arch}.dmg`);

const stage = join(tmpdir(), `triglosa-dmg-${process.pid}`);
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
mkdirSync(OUT, { recursive: true });

/* ditto rather than a copy: it keeps the extended attributes and the
   signature's resources exactly as they were. */
run("ditto", [APP, join(stage, "Triglosa.app")]);
symlinkSync("/Applications", join(stage, "Applications"));

run("hdiutil", [
  "create",
  "-volname", "Triglosa",
  "-srcfolder", stage,
  "-format", "UDZO",
  "-ov",
  image,
]);
rmSync(stage, { recursive: true, force: true });

console.log(image);

/* Packing the signed app into the disk image a release carries.

   Tauri can build a DMG of its own, but it builds it before `sign.mjs` has
   run, so the app inside would carry the code-hash requirement and lose its
   Accessibility permission with the next version. This packs the app that
   was signed instead, next to a link to /Applications so the window that
   opens says what to do with it.

   The name carries the architecture but not the version: Apple silicon and
   Intel get a download each, and a file called Triglosa.dmg says nothing
   about which one it is, while the README links straight to the newest
   release's file by its name, which must therefore stay the same from one
   release to the next. A target triple as the argument packs that
   target's build; without one, this machine's own. */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const target = process.argv[2];
const RELEASE = `src-tauri/target/${target ? `${target}/` : ""}release`;
const APP = `${RELEASE}/bundle/macos/Triglosa.app`;
const OUT = `${RELEASE}/bundle/dmg`;

if (!existsSync(APP)) {
  console.error(`${APP} is not there — run npm run bundle first.`);
  process.exit(1);
}

const run = (command, args) =>
  execFileSync(command, args, { stdio: ["ignore", "ignore", "inherit"] });

/* A dmg of an app whose seal is broken opens as "damaged" on every other
   Mac, which is a far worse first sentence than the usual warning. */
run("codesign", ["--verify", "--deep", "--strict", APP]);

/* In the words About This Mac uses, so that nobody needs to know what arm64
   means to pick the right one. */
const machine = target ? target.split("-")[0] : execFileSync("uname", ["-m"], { encoding: "utf8" }).trim();
const arch = machine === "x86_64" ? "Intel" : "Apple-Silicon";
const image = join(OUT, `Triglosa-${arch}.dmg`);

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

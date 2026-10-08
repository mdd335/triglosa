/* The files a release carries so that the app can install it itself.

   The updater (src-tauri/src/update.rs) reads `latest.json` from the newest
   release: the version, and per system a download and its signature. This
   writes all of it, after `npm run release` and after the Windows installer
   has come back from the workflow:

       node scripts/updater.mjs --windows=path/to/Triglosa_<version>_x64-setup.exe

   For each Mac build that is there, the signed app is packed as it stands —
   after `sign.mjs`, for the same reason the DMG is (dmg.mjs) — into
   `Triglosa-<version>-<arch>.app.tar.gz`. The Windows installer is the one
   file readers and the updater share, so it is copied under the name the
   README links to, `Triglosa-Windows-Setup.exe`. Every file is signed with the
   updater's private key, which never enters the repository: by default
   `~/.tauri/triglosa-updater.key`, or TAURI_SIGNING_PRIVATE_KEY_PATH. The
   public half is in tauri.conf.json; a release signed with any other key is
   refused by every installed app, so losing the private key means readers
   can only update by downloading again. The signatures travel inside
   `latest.json`, the only place the updater reads them, so no .sig file is
   uploaded.

   Everything lands in src-tauri/target/updater/, and the last line lists
   what to upload with the release. */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const OUT = "src-tauri/target/updater";
const KEY = process.env.TAURI_SIGNING_PRIVATE_KEY_PATH || join(homedir(), ".tauri", "triglosa-updater.key");
const { version } = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
const BASE = `https://github.com/mdd335/triglosa/releases/download/v${version}`;
const argument = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) || "";

if (!existsSync(KEY)) {
  console.error(`No updater key at ${KEY}. Set TAURI_SIGNING_PRIVATE_KEY_PATH to where it is.`);
  process.exit(1);
}

const run = (command, args, env = {}) =>
  execFileSync(command, args, { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, ...env } });

/* The signature, as the text of the .sig file the signer writes beside it. */
function sign(file) {
  run("npx", ["tauri", "signer", "sign", "--private-key-path", KEY, "--password", "", file]);
  return readFileSync(`${file}.sig`, "utf8").trim();
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const platforms = {};
const uploads = [];

for (const [target, arch, platform] of [
  ["", "Apple-Silicon", "darwin-aarch64"],
  ["x86_64-apple-darwin", "Intel", "darwin-x86_64"],
]) {
  const app = `src-tauri/target/${target ? `${target}/` : ""}release/bundle/macos/Triglosa.app`;
  if (!existsSync(app)) {
    console.warn(`${app} is not there — no update for ${arch}.`);
    continue;
  }
  /* The same guard as the DMG's: an app whose seal is broken would be
     installed over a working one. */
  run("codesign", ["--verify", "--deep", "--strict", app]);
  /* A build left over from an earlier version would be announced as this
     one and installed as a downgrade. */
  const built = execFileSync("plutil", ["-extract", "CFBundleShortVersionString", "raw", join(app, "Contents/Info.plist")],
    { encoding: "utf8" }).trim();
  if (built !== version) {
    console.error(`${app} is version ${built}, not ${version} — build it again first.`);
    process.exit(1);
  }
  const name = `Triglosa-${version}-${arch}.app.tar.gz`;
  const archive = join(OUT, name);
  /* COPYFILE_DISABLE keeps macOS from adding ._ files, which would land in
     the bundle and break its seal on the other side. */
  run("tar", ["-czf", archive, "-C", join(app, ".."), "Triglosa.app"], { COPYFILE_DISABLE: "1" });
  platforms[platform] = { signature: sign(archive), url: `${BASE}/${name}` };
  uploads.push(archive);
}

const windows = argument("windows");
if (windows) {
  if (!existsSync(windows)) {
    console.error(`${windows} is not there.`);
    process.exit(1);
  }
  const name = "Triglosa-Windows-Setup.exe";
  const copy = join(OUT, name);
  copyFileSync(windows, copy);
  platforms["windows-x86_64"] = { signature: sign(copy), url: `${BASE}/${name}` };
  uploads.push(copy);
} else {
  console.warn("No --windows= installer — Windows readers will be sent to the download page.");
}

if (!Object.keys(platforms).length) {
  console.error("Nothing to publish.");
  process.exit(1);
}

/* What the release says it brings, out of the changelog's section for it. */
const changelog = readFileSync("CHANGELOG.md", "utf8");
const section = changelog.split(/^## /m).find((part) => part.startsWith(`${version}\n`));
const notes = section ? section.slice(version.length).trim() : "";

const manifest = join(OUT, "latest.json");
writeFileSync(manifest, JSON.stringify({ version, notes, pub_date: new Date().toISOString(), platforms }, null, 2) + "\n");
uploads.push(manifest);

console.log(`upload with the release: ${uploads.join(" ")}`);

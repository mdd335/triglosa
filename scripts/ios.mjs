/* The iPhone app, built and put on the phone that is connected.

     node scripts/ios.mjs            build, sign with the reader's own team, install
     node scripts/ios.mjs --build    build only
     node scripts/ios.mjs --store    build for release, for App Store Connect; installs nothing
     node scripts/ios.mjs --device=<udid>   install on that phone, by cable or Wi-Fi

   Needs Xcode itself, not only the command line tools, signed in with an
   Apple ID (Settings → Accounts), and the phone in developer mode. The team
   is the Developer ID's where there is one, the paid team that holds the
   app's identifier, otherwise the one of the development certificate Xcode
   made for that account; APPLE_DEVELOPMENT_TEAM names another.

   The Mac's own build runs on the command line tools, and stays there: the
   active developer directory is not switched. Tauri starts `xcodebuild`
   without this process's environment, so the two tools it calls are put in
   front of the path as small scripts that name Xcode themselves. */

import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { signingIdentity, teamOf } from "./signing.mjs";

/* The share menu's list under the apps. */
const ACTION = "com.apple.ui-services";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const xcode = process.env.XCODE_DEVELOPER_DIR || "/Applications/Xcode.app/Contents/Developer";
const store = process.argv.includes("--store");
const buildOnly = store || process.argv.includes("--build");
const chosen = process.argv.find((arg) => arg.startsWith("--device="))?.slice("--device=".length) || "";

function stop(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(xcode)) stop(`Xcode is not at ${xcode}. Install it, or name its developer directory in XCODE_DEVELOPER_DIR.`);

const tools = mkdtempSync(join(tmpdir(), "triglosa-ios-"));
/* A phone the team has not seen yet is registered with it on the way, or
   there is no profile to sign for. */
const EXTRA = { xcodebuild: " -allowProvisioningDeviceRegistration", xcrun: "" };
for (const tool of ["xcodebuild", "xcrun"]) {
  const file = join(tools, tool);
  writeFileSync(file, `#!/bin/sh\nDEVELOPER_DIR="${xcode}" exec /usr/bin/${tool} "$@"${EXTRA[tool]}\n`);
  chmodSync(file, 0o755);
}
const env = { ...process.env, DEVELOPER_DIR: xcode, PATH: `${tools}:${process.env.PATH}` };

function run(command, args, options = {}) {
  const done = spawnSync(command, args, { cwd: root, env, stdio: "inherit", ...options });
  if (done.status !== 0) {
    rmSync(tools, { recursive: true, force: true });
    process.exit(done.status || 1);
  }
}

/* The Developer ID's team, otherwise that of the first development
   certificate in the keychain: its organisational unit. */
function team() {
  if (process.env.APPLE_DEVELOPMENT_TEAM) return process.env.APPLE_DEVELOPMENT_TEAM;
  const paid = teamOf(signingIdentity());
  if (paid) return paid;
  try {
    const certificate = execFileSync("security", ["find-certificate", "-c", "Apple Development", "-p"], { encoding: "utf8" });
    const subject = execFileSync("openssl", ["x509", "-noout", "-subject"], { input: certificate, encoding: "utf8" });
    return subject.match(/OU\s*=\s*([A-Z0-9]{10})/)?.[1] || "";
  } catch {
    return "";
  }
}

/* A phone, never a simulator: one paired over Wi-Fi is listed as
   disconnected until something is asked of it, and devicectl connects it. */
function phone() {
  if (chosen) return chosen;
  const report = join(tools, "devices.json");
  spawnSync("xcrun", ["devicectl", "list", "devices", "--json-output", report], { env, stdio: "ignore" });
  try {
    const devices = JSON.parse(readFileSync(report, "utf8")).result?.devices || [];
    const found = devices.find((device) =>
      device.hardwareProperties?.platform === "iOS" && device.hardwareProperties?.reality !== "simulated"
      && device.connectionProperties?.tunnelState !== "unavailable");
    return found?.hardwareProperties?.udid || found?.identifier || "";
  } catch {
    return "";
  }
}

const signing = team();
if (!signing) {
  stop("No development certificate found. Sign in to Xcode with an Apple ID (Settings → Accounts) "
    + "and let it create one, or set APPLE_DEVELOPMENT_TEAM.");
}
env.APPLE_DEVELOPMENT_TEAM = signing;

if (!existsSync(join(root, "src-tauri/gen/apple"))) run("npx", ["tauri", "ios", "init"]);

/* The generated project starts out with Tauri's own symbol; the app's is
   kept under icons/ios, made from icons/ios-source.png by `tauri icon`. */
const icons = join(root, "src-tauri/icons/ios");
const iconSet = join(root, "src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset");
for (const name of readdirSync(icons)) copyFileSync(join(icons, name), join(iconSet, name));
/* The app's own Swift — Apple's translation, which a phone's app has to
   carry inside itself — is kept under src-tauri/ios and belongs to the app's
   target. The project is written anew from its description when a file is
   added, so the target knows it. */
const swift = join(root, "src-tauri/ios");
const sources = join(root, "src-tauri/gen/apple/Sources/triglosa");
let added = false;
/* With it the privacy manifest the App Store asks for (PrivacyInfo.xcprivacy):
   nothing collected, no tracking, and why the app reads file dates, the
   time since start and its own defaults — the Rust half and the web view do. */
for (const name of readdirSync(swift).filter((file) => file.endsWith(".swift") || file.endsWith(".xcprivacy"))) {
  if (!existsSync(join(sources, name))) added = true;
  copyFileSync(join(swift, name), join(sources, name));
}
/* The words the system shows for the app, in the interface's languages:
   why the camera is asked for (NSCameraUsageDescription), one
   InfoPlist.strings a language under src-tauri/ios/Localized. */
if (copyTree(join(swift, "Localized"), sources)) added = true;
/* The share extensions (src-tauri/ios/Share), targets of their own beside the
   app's, written into the generated project's description once and kept
   there; their version follows the app's, which the App Store requires. */
if (shareExtension()) added = true;
if (added) run("xcodegen", ["generate", "--spec", "project.yml"], { cwd: join(root, "src-tauri/gen/apple") });

/* Every file under `from` copied to the same place under `to`. Answers
   whether one was new or changed. */
function copyTree(from, to) {
  let changed = false;
  if (!existsSync(from)) return changed;
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isDirectory()) {
      if (copyTree(source, target)) changed = true;
    } else if (!existsSync(target) || !readFileSync(target).equals(readFileSync(source))) {
      copyFileSync(source, target);
      changed = true;
    }
  }
  return changed;
}

/* One share extension's description in project.yml. Both run the same
   Swift with the text recognition the app has too (Recognition.swift); what
   they open the app with is their Info.plist's `TriglosaOpens`. */
function shareTarget({ name, folder, sources, title, opens, product, identifier, version, point }) {
  return [
    `  ${name}:`,
    "    type: app-extension",
    "    platform: iOS",
    "    sources:",
    ...sources.map((path) => `      - path: ${path}`),
    "      - path: Sources/triglosa/Recognition.swift",
    "    info:",
    `      path: ${folder}/Info.plist`,
    "      properties:",
    `        CFBundleDisplayName: ${title}`,
    `        CFBundleShortVersionString: "${version}"`,
    `        CFBundleVersion: "${version}"`,
    `        TriglosaOpens: ${opens}`,
    "        NSExtension:",
    `          NSExtensionPointIdentifier: ${point}`,
    "          NSExtensionPrincipalClass: $(PRODUCT_MODULE_NAME).ShareViewController",
    "          NSExtensionAttributes:",
    "            NSExtensionActivationRule:",
    "              NSExtensionActivationSupportsText: true",
    "              NSExtensionActivationSupportsImageWithMaxCount: 1",
    "    settings:",
    "      groups: [app]",
    "      base:",
    `        PRODUCT_NAME: ${product}`,
    `        PRODUCT_BUNDLE_IDENTIFIER: ${identifier}`,
    "        SWIFT_VERSION: \"5.0\"",
    "        SKIP_INSTALL: true",
    "        CODE_SIGN_STYLE: Automatic",
    `        DEVELOPMENT_TEAM: ${signing}`,
    /* An action's symbol is the shape of its icon: see-through around it. */
    ...(point === ACTION ? ["        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon"] : []),
    "",
  ].join("\n");
}

/* A target's description put in, or put right where it differs, and the
   app's dependency on it. */
function withTarget(yml, name, target) {
  const old = yml.match(new RegExp(`\\n {2}${name}:\\n(?: {4}.*\\n|\\n)*`));
  if (!old) yml = `${yml.replace(/\n*$/, "\n")}${target}`;
  else if (old[0] !== `\n${target}`) yml = yml.replace(old[0], `\n${target}`);
  if (!new RegExp(`\\n {6}- target: ${name}\\n`).test(yml)) {
    yml = yml.replace(/(\n {2}triglosa_iOS:\n[\s\S]*?\n {4}dependencies:\n)/, `$1      - target: ${name}\n`);
  }
  return yml;
}

/* The share menu's Triglosas — one in the row of apps, and two actions in the
   list under it, one that reads and one that makes a card, named in the
   reader's language (their InfoPlist.strings) — their Swift copied in, and
   the targets and the app's dependencies on them added to project.yml where
   they are missing. Answers whether the description changed. */
function shareExtension() {
  const apple = join(root, "src-tauri/gen/apple");
  let changed = copyTree(join(root, "src-tauri/ios/Share"), join(apple, "Share"));
  for (const folder of ["ShareCard", "ShareRead"]) {
    if (copyTree(join(root, "src-tauri/ios", folder), join(apple, folder))) changed = true;
  }
  const spec = join(apple, "project.yml");
  let yml = readFileSync(spec, "utf8");
  const { version } = JSON.parse(readFileSync(join(root, "src-tauri/tauri.conf.json"), "utf8"));
  yml = withTarget(yml, "triglosa_Share", shareTarget({
    name: "triglosa_Share", folder: "Share", sources: ["Share"], title: "Triglosa", opens: "read",
    product: "TriglosaShare", identifier: "de.mdd335.triglosa.share", version,
    point: "com.apple.share-services",
  }));
  yml = withTarget(yml, "triglosa_ShareCard", shareTarget({
    name: "triglosa_ShareCard", folder: "ShareCard", sources: ["Share/ShareViewController.swift", "ShareCard"],
    title: "Make a flashcard with Triglosa", opens: "card",
    product: "TriglosaShareCard", identifier: "de.mdd335.triglosa.sharecard", version,
    /* An action: in the list under the apps, where it can be found, not a
       second Triglosa at the far end of their row. */
    point: ACTION,
  }));
  yml = withTarget(yml, "triglosa_ShareRead", shareTarget({
    name: "triglosa_ShareRead", folder: "ShareRead", sources: ["Share/ShareViewController.swift", "ShareRead"],
    title: "Translate with Triglosa", opens: "read",
    product: "TriglosaShareRead", identifier: "de.mdd335.triglosa.shareread", version,
    point: ACTION,
  }));
  /* The Rust library is linked, never carried in the app: Apple refuses one
     lying in it, and a debug and a release one beside each other do not build. */
  yml = yml.replace(/( {6}- path: Externals\n)(?! {8}buildPhase)/, "$1        buildPhase: none\n");
  /* The iPhone only: on an iPad the app runs as the iPhone's, and the App
     Store asks no iPad screenshots of it. */
  if (!/\n {8}TARGETED_DEVICE_FAMILY:/.test(yml)) {
    yml = yml.replace(/(\n {2}triglosa_iOS:\n[\s\S]*?\n {4}settings:\n {6}base:\n)/, '$1        TARGETED_DEVICE_FAMILY: "1"\n');
  }
  if (yml !== readFileSync(spec, "utf8")) {
    writeFileSync(spec, yml);
    changed = true;
  }
  return changed;
}

/* A phone takes a debug build; the store a release build, signed by Xcode for distribution. */
run("npx", ["tauri", "ios", "build", ...(store ? ["--export-method", "app-store-connect"] : ["--debug", "--export-method", "debugging"])]);

const out = join(root, "src-tauri/gen/apple/build/arm64");
const ipa = existsSync(out) ? readdirSync(out).find((name) => name.endsWith(".ipa")) : "";
if (!ipa) stop(`No .ipa under ${out}.`);
console.log(`built ${join(out, ipa)}`);

if (!buildOnly) {
  const device = phone();
  if (!device) stop("No iPhone found. Connect it, unlock it and trust this computer.");
  run("xcrun", ["devicectl", "device", "install", "app", "--device", device, join(out, ipa)]);
}

rmSync(tools, { recursive: true, force: true });

/* Apple's check of a signed build ("notarization"), so that macOS opens it
   on any Mac without a warning, and the ticket stapled to it, so that it
   opens without asking Apple first.

     node scripts/notarize.mjs                    the app of this Mac's build
     node scripts/notarize.mjs x86_64-apple-darwin   the Intel build's app
     node scripts/notarize.mjs --file=<path.dmg>     a disk image (dmg.mjs)

   The app goes up as a zip and its ticket is stapled to the app itself:
   the update files (updater.mjs) are packed from it, and an app updated in
   place is opened without its disk image. A disk image goes up as it is
   and gets its own ticket.

   The credentials are a keychain profile of notarytool's, made once on
   this Mac and never in the repository:

     xcrun notarytool store-credentials triglosa-notary --apple-id <id> --team-id <team>

   which asks for an app-specific password made at account.apple.com.
   TRIGLOSA_NOTARY_PROFILE names another profile. Only a build signed with
   the Developer ID can be notarized (sign.mjs): an ad-hoc one is refused
   here, before anything goes to Apple. */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { signedWithDeveloperId } from "./signing.mjs";

const PROFILE = process.env.TRIGLOSA_NOTARY_PROFILE || "triglosa-notary";
const file = process.argv.find((arg) => arg.startsWith("--file="))?.slice("--file=".length) || "";
const target = process.argv.slice(2).find((arg) => !arg.startsWith("--")) || "";
const APP = `src-tauri/target/${target ? `${target}/` : ""}release/bundle/macos/Triglosa.app`;
const what = file || APP;

function stop(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(what)) stop(`${what} is not there — build it first.`);
if (!signedWithDeveloperId(what)) {
  stop(`${what} is not signed with a Developer ID, which Apple's check needs. Put the certificate in the keychain and build again (sign.mjs).`);
}

const xcrun = (args, options = {}) => spawnSync("xcrun", args, { encoding: "utf8", ...options });

/* The app goes up zipped, with its folder: ditto keeps the signature's
   extended attributes, which zip would lose. */
let upload = what;
let scratch = "";
if (!file) {
  scratch = mkdtempSync(join(tmpdir(), "triglosa-notarize-"));
  upload = join(scratch, "Triglosa.zip");
  execFileSync("ditto", ["-c", "-k", "--keepParent", what, upload]);
}

console.log(`sending ${basename(what)} to Apple's check — usually a few minutes`);
const sent = xcrun(["notarytool", "submit", upload, "--keychain-profile", PROFILE, "--wait", "--output-format", "json"]);
if (scratch) rmSync(scratch, { recursive: true, force: true });
let answer = {};
try {
  answer = JSON.parse(sent.stdout || "{}");
} catch {
  /* Said below with what notarytool wrote. */
}
if (answer.status !== "Accepted") {
  /* What Apple found, which is the whole of the explanation. */
  if (answer.id) console.error(xcrun(["notarytool", "log", answer.id, "--keychain-profile", PROFILE]).stdout);
  stop(`Apple's check did not accept ${basename(what)}: ${answer.status || sent.stderr || sent.stdout}`);
}

const stapled = xcrun(["stapler", "staple", what]);
if (stapled.status !== 0) stop(`the ticket was not stapled to ${what}:\n${stapled.stdout}${stapled.stderr}`);

/* What Gatekeeper itself will say on a reader's Mac. */
const assessed = spawnSync("spctl", ["--assess", "--verbose=2", ...(file ? ["--type", "open", "--context", "context:primary-signature"] : ["--type", "execute"]), what], { encoding: "utf8" });
const verdict = `${assessed.stdout}${assessed.stderr}`.trim();
if (assessed.status !== 0) stop(`Gatekeeper refuses ${what}:\n${verdict}`);
console.log(verdict.split("\n").slice(-2).join("\n"));

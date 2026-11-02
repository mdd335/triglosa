/* Signing the built app so that a permission survives the next build, and
   so that macOS opens it on any Mac without a warning.

   macOS binds the Accessibility consent to the app's *designated
   requirement* — the rule it uses to decide whether the thing asking today
   is the thing that was allowed yesterday. What that requirement says
   depends on how the app is signed:

   - **With the Developer ID** (scripts/signing.mjs finds it in the
     keychain): the requirement codesign writes names the identifier and the
     maintainer's team at Apple, and every later build satisfies it. The app is
     signed with the hardened runtime and a secure timestamp, which Apple's
     check asks for (notarize.mjs), and needs no entitlement: the web view's
     own process is Apple's, the helper reads the screen through a system
     tool, and nothing here sends Apple events to another program.

   - **Ad-hoc**, where there is no certificate (a contributor's build): the
     requirement codesign hands out of its own accord is the code hash,

         designated => cdhash H"4cedadba9da6bda3e6af1e6293f3474eb257e91d"

     which changes with every build, so the entry stays in System Settings,
     still switched on, pointing at a version that no longer exists, and the
     new one has no permission at all while looking as though it has. That
     cost an evening of "I granted it and nothing happens". So the
     requirement is pinned to the identifier instead,

         designated => identifier "de.mdd335.triglosa"

     which the next build still satisfies — and which anything calling itself
     by this identifier would satisfy too. Good enough on one's own Mac, and
     no way to hand the app to anybody.

   The versions up to 0.6.0 were signed ad-hoc and their readers' consent is
   bound to the identifier alone, which the Developer ID's build satisfies as
   well: the first signed version keeps the permission.

   The helper is signed first: signing a bundle seals what is inside it, so
   anything replaced afterwards breaks the seal.

   A target triple as the argument signs that target's build
   (`npm run bundle:intel`); without one, this machine's own. */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { IDENTIFIER, signingIdentity, teamOf } from "./signing.mjs";

const target = process.argv[2];
const APP = `src-tauri/target/${target ? `${target}/` : ""}release/bundle/macos/Triglosa.app`;

if (!existsSync(APP)) {
  console.error(`${APP} is not there — build it first.`);
  process.exit(1);
}

const sign = (args) =>
  execFileSync("codesign", args, { stdio: ["ignore", "ignore", "pipe"] });

const identity = signingIdentity();
if (identity) {
  const hardened = ["--force", "--options", "runtime", "--timestamp", "--sign", identity];
  sign([...hardened, `${APP}/Contents/MacOS/translator`]);
  sign([...hardened, "--identifier", IDENTIFIER, APP]);
} else {
  sign(["--force", "--sign", "-", `${APP}/Contents/MacOS/translator`]);
  sign([
    "--force",
    "--sign",
    "-",
    "--identifier",
    IDENTIFIER,
    /* One argument, joined with "=". Handed over as two, codesign reads the
       second as the name of a file holding the requirement. */
    `-r=designated => identifier "${IDENTIFIER}"`,
    APP,
  ]);
}

/* Said out loud, because a requirement that quietly went back to a hash would
   look exactly like everything working. */
const requirement = execFileSync("codesign", ["-d", "-r-", APP], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

const team = identity ? teamOf(identity) : "";
const holds = requirement.includes(`identifier "${IDENTIFIER}"`)
  && (!identity || (requirement.includes("anchor apple generic") && (!team || requirement.includes(team))));
if (!holds) {
  console.error(`the requirement did not take:\n${requirement}`);
  process.exit(1);
}
execFileSync("codesign", ["--verify", "--deep", "--strict", APP], { stdio: ["ignore", "ignore", "inherit"] });
console.log(requirement.split("\n").pop());
console.log(identity
  ? `signed with ${identity}; notarize.mjs has Apple check it`
  : "signed ad-hoc: no Developer ID in the keychain — fine on this Mac, not for a release");

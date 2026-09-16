/* Signing the built app so that a permission survives the next build.

   macOS binds Accessibility consent to the app's *designated requirement* —
   the rule it uses to decide whether the thing asking today is the thing that
   was allowed yesterday. Signing hands out a requirement of its own accord,
   and for an ad-hoc signature that requirement is the code hash:

       designated => cdhash H"4cedadba9da6bda3e6af1e6293f3474eb257e91d"

   Which changes with every build. So the entry stays in System Settings,
   still switched on, pointing at a version of the app that no longer exists,
   and the new one has no permission at all while looking exactly as though it
   has. That cost an evening of "I granted it and nothing happens".

   Signing again with the requirement named explicitly pins it to the
   identifier instead:

       designated => identifier "de.mdd335.triglosa"

   which the next build still satisfies.

   The honest caveat: without a certificate, that requirement is all there is,
   so anything calling itself by this identifier would inherit the permission.
   That is a property of having no signing identity rather than of this
   script — an ad-hoc signature has no identity to bind to in the first place.
   Once there is a real certificate the requirement becomes the
   identifier *and* the certificate, and this stops being a compromise.

   The sidecar is signed first: signing a bundle seals what is inside it, so
   anything replaced afterwards breaks the seal. */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const APP = "src-tauri/target/release/bundle/macos/Triglosa.app";
const IDENTIFIER = "de.mdd335.triglosa";

if (!existsSync(APP)) {
  console.error(`${APP} is not there — build it first.`);
  process.exit(1);
}

const sign = (args) =>
  execFileSync("codesign", args, { stdio: ["ignore", "ignore", "pipe"] });

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

/* Said out loud, because a requirement that quietly went back to a hash would
   look exactly like everything working. */
const requirement = execFileSync("codesign", ["-d", "-r-", APP], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

if (!requirement.includes(`identifier "${IDENTIFIER}"`)) {
  console.error(`the requirement did not take:\n${requirement}`);
  process.exit(1);
}
console.log(requirement.split("\n").pop());

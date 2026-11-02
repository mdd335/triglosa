/* Which certificate a Mac build is signed with: the maintainer's Developer ID,
   where its certificate is in the keychain, so that macOS opens the app
   without a warning once Apple has checked it (notarize.mjs); otherwise an
   ad-hoc signature, which is enough for trying a build on this Mac and not
   enough for anybody else's.

   TRIGLOSA_SIGN_IDENTITY names another identity, or "-" for ad-hoc even
   where a certificate is there. */

import { execFileSync, spawnSync } from "node:child_process";

export const IDENTIFIER = "de.mdd335.triglosa";

export function signingIdentity() {
  const named = process.env.TRIGLOSA_SIGN_IDENTITY;
  if (named) return named === "-" ? "" : named;
  try {
    const found = execFileSync("security", ["find-identity", "-v", "-p", "codesigning"], { encoding: "utf8" });
    const line = found.split("\n").find((entry) => entry.includes("\"Developer ID Application:"));
    return line?.match(/"([^"]+)"/)?.[1] || "";
  } catch {
    return "";
  }
}

/* The team a Developer ID names in brackets at its end. */
export const teamOf = (identity) => identity.match(/\(([A-Z0-9]{10})\)\s*$/)?.[1] || "";

/* Whether a signed thing carries a Developer ID signature, as codesign
   reports it (on its error stream). */
export function signedWithDeveloperId(path) {
  const said = spawnSync("codesign", ["-dvv", path], { encoding: "utf8" });
  return /Authority=Developer ID Application:/.test(`${said.stdout}${said.stderr}`);
}

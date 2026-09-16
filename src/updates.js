/* Where the app lives in public, and whether a newer version stands there.

   Asked only when the reader presses the button for it: this is the one
   request the app would otherwise make on its own, and a check at every start
   would tell GitHub each time that somebody opened Triglosa. Nothing is
   downloaded — the answer is a version and the page to fetch it from.

   The shell names the same addresses for its menu (lib.rs). */

export const PROJECT_URL = "https://github.com/mdd335/triglosa";
export const HELP_URL = `${PROJECT_URL}#readme`;
/* The README section on setting up a model. Renaming that heading means changing this. */
export const MODEL_HELP_URL = `${PROJECT_URL}#setting-up-an-ai-model`;
export const ISSUES_URL = `${PROJECT_URL}/issues`;
export const RELEASES_URL = `${PROJECT_URL}/releases`;
/* The file that does everything the Accessibility permission allows, named
   beside the permission so a reader can check what it is used for. */
export const CAPTURE_CODE_URL = `${PROJECT_URL}/blob/main/src-tauri/src/capture.rs`;
const LATEST_URL = "https://api.github.com/repos/mdd335/triglosa/releases/latest";

/* "v0.2.0" and "0.2.0" are the same version; anything after a hyphen is a
   pre-release and counts as older than the version it leads up to. */
function parts(version) {
  const [core, pre] = String(version || "").trim().replace(/^v/i, "").split("-");
  const numbers = core.split(".").map((part) => Number.parseInt(part, 10));
  if (numbers.length === 0 || numbers.some((n) => !Number.isFinite(n))) return null;
  while (numbers.length < 3) numbers.push(0);
  return { numbers, pre: pre !== undefined };
}

export function isNewer(candidate, current) {
  const a = parts(candidate);
  const b = parts(current);
  if (!a || !b) return false;
  for (let i = 0; i < Math.max(a.numbers.length, b.numbers.length); i += 1) {
    const x = a.numbers[i] || 0;
    const y = b.numbers[i] || 0;
    if (x !== y) return x > y;
  }
  return !a.pre && b.pre;
}

/* `{ newer: false }`, `{ newer: true, version, url }`, or a thrown error the
   window words as a failure. A repository with no release yet answers 404,
   and that is not newer. */
export async function checkForUpdate(current, fetchImpl) {
  const response = await fetchImpl(LATEST_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (response.status === 404) return { newer: false };
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
  const release = await response.json();
  const version = String(release.tag_name || "").replace(/^v/i, "");
  if (!isNewer(version, current)) return { newer: false };
  return { newer: true, version, url: release.html_url || RELEASES_URL };
}

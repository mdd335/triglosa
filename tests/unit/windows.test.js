import test from "node:test";
import assert from "node:assert";
import { createTranslationBackend } from "../../src/platform/translation.js";
import { labels } from "../../src/ui/labels.js";

/* Windows has no translation on the device, and nothing may be asked of a
   helper that cannot exist there — a request to its port would only cost the
   reading its timeout. */
test("on Windows the device translation answers like a helper that is not there", async () => {
  let asked = 0;
  const backend = createTranslationBackend({ helperUrl: "http://127.0.0.1:1", system: "windows" }, () => {
    asked += 1;
    throw new Error("no");
  });
  assert.strictEqual(await backend.running(), false);
  assert.strictEqual(await backend.canTranslate("es", "de"), false);
  assert.strictEqual(await backend.translate("es", "de", "hola"), "");
  assert.strictEqual(await backend.detect("hola"), "");
  assert.strictEqual(asked, 0);
});

test("the Windows wording names no Mac and no Apple", () => {
  for (const code of ["de", "en"]) {
    const text = labels(code, "windows");
    for (const key of ["noDevice", "onlyKnownLanguages", "modelIntro", "lockedHow", "apiKeyHint", "hotkeyLead",
      "hotkeyTakenSystem"]) {
      assert.doesNotMatch(String(text[key]), /Apple|macOS|⌘|Schlüsselbund|keychain/i, `${code}.${key}`);
    }
    assert.doesNotMatch(text.copyFirst("Win+Shift+E"), /⌘/);
    assert.doesNotMatch(text.pairMissing("A", "B"), /Sprachpaket|language pack/i);
    /* Everything the overlay does not name is the Mac's own. */
    assert.strictEqual(text.noAnswer, labels(code, "mac").noAnswer);
  }
  assert.match(labels("de", "mac").noDevice, /Apple/);
});

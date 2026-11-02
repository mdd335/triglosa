import test from "node:test";
import assert from "node:assert";
import { createTranslationBackend, inProcessFetch } from "../../src/platform/translation.js";
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
    for (const key of ["noDevice", "onlyKnownLanguages", "modelIntro", "lockedHow", "apiKeyHints", "endpointHints", "hotkeyLead",
      "hotkeyTakenSystem", "enterKey"]) {
      assert.doesNotMatch(JSON.stringify(text[key]), /Apple|macOS|⌘|Schlüsselbund|keychain/i, `${code}.${key}`);
    }
    assert.doesNotMatch(text.copyFirst("Ctrl+Alt+T"), /⌘/);
    assert.doesNotMatch(text.pairMissing("A", "B"), /Sprachpaket|language pack/i);
    /* Everything the overlay does not name is the Mac's own. */
    assert.strictEqual(text.noAnswer, labels(code, "mac").noAnswer);
  }
  assert.match(labels("de", "mac").noDevice, /Apple/);
  assert.match(labels("de", "mac").enterKey, /⌘/);
  assert.match(labels("en", "windows").enterKey, /Ctrl\+Enter/);
});

/* The iPhone has Apple's translation inside the app: the helper's routes,
   asked through the shell, and the Mac's wording with the phone's system
   named. */
test("on a phone Apple's translation answers the helper's routes inside the app", async () => {
  const asked = [];
  const invoke = async (command, { route, body }) => {
    asked.push([command, route, body]);
    if (route === "/ping") return { status: 200, text: "ok 6" };
    if (route.startsWith("/available")) return { status: 200, text: "de installed\n" };
    if (route.startsWith("/translate")) return { status: 200, text: "hallo" };
    return { status: 404, text: "unknown" };
  };
  const backend = createTranslationBackend({ helperUrl: "http://127.0.0.1:1", system: "ios" }, inProcessFetch(invoke));
  assert.strictEqual(await backend.running(), true);
  assert.strictEqual(backend.current(), true);
  assert.strictEqual(await backend.canTranslate("es", "de"), true);
  assert.strictEqual(await backend.translate("es", "de", "hola"), "hallo");
  assert.deepStrictEqual(asked.map(([command, route]) => [command, route]), [
    ["apple_translation", "/ping"],
    ["apple_translation", "/available?from=es&to=de"],
    ["apple_translation", "/translate?from=es&to=de"],
  ]);
  assert.strictEqual(asked[2][2], "hola");
  /* An app built without it, or a system too old for it, is a helper that
     is not running. */
  const none = createTranslationBackend({ helperUrl: "http://127.0.0.1:1", system: "ios" },
    inProcessFetch(async () => ({ status: 503, text: "not on this system" })));
  assert.strictEqual(await none.running(), false);
  assert.strictEqual(await none.translate("es", "de", "hola"), "");
  for (const code of ["de", "en", "es", "fr", "it", "pt", "ru"]) {
    const text = labels(code, "ios");
    assert.strictEqual(text.modelIntro, labels(code, "mac").modelIntro);
    assert.strictEqual(text.noDevice, labels(code, "mac").noDevice);
    assert.match(text.deviceIntro, /iOS/);
    assert.doesNotMatch(`${text.deviceIntro} ${text.pairsOnTheirWay}`, /macOS/);
    assert.ok(text.paste && text.settingsDone);
  }
});

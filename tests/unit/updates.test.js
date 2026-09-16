import { test } from "node:test";
import assert from "node:assert/strict";
import { RELEASES_URL, checkForUpdate, isNewer } from "../../src/updates.js";

test("a version is newer by its numbers, not by its spelling", () => {
  assert.equal(isNewer("0.2.0", "0.1.0"), true);
  assert.equal(isNewer("v0.1.1", "0.1.0"), true);
  assert.equal(isNewer("0.10.0", "0.9.0"), true);
  assert.equal(isNewer("1.0", "0.9.9"), true);
  assert.equal(isNewer("0.1.0", "0.1.0"), false);
  assert.equal(isNewer("v0.1.0", "0.1.0"), false);
  assert.equal(isNewer("0.0.9", "0.1.0"), false);
});

test("a pre-release is older than the version it leads up to", () => {
  assert.equal(isNewer("0.2.0-beta", "0.1.0"), true);
  assert.equal(isNewer("0.2.0-beta", "0.2.0"), false);
  assert.equal(isNewer("0.2.0", "0.2.0-beta"), true);
});

test("something that is no version is never newer", () => {
  assert.equal(isNewer("latest", "0.1.0"), false);
  assert.equal(isNewer("", "0.1.0"), false);
  assert.equal(isNewer("0.2.0", ""), false);
});

const answering = (status, body) => async () => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

test("the latest release is read for its version and its page", async () => {
  const found = await checkForUpdate("0.1.0", answering(200, {
    tag_name: "v0.2.0",
    html_url: "https://github.com/mdd335/triglosa/releases/tag/v0.2.0",
  }));
  assert.deepEqual(found, {
    newer: true,
    version: "0.2.0",
    url: "https://github.com/mdd335/triglosa/releases/tag/v0.2.0",
  });
  assert.deepEqual(await checkForUpdate("0.2.0", answering(200, { tag_name: "v0.2.0" })), { newer: false });
  const bare = await checkForUpdate("0.1.0", answering(200, { tag_name: "0.3.0" }));
  assert.equal(bare.url, RELEASES_URL);
});

test("no release at all is not a failure, anything else is", async () => {
  assert.deepEqual(await checkForUpdate("0.1.0", answering(404, {})), { newer: false });
  await assert.rejects(checkForUpdate("0.1.0", answering(403, {})), { status: 403 });
});

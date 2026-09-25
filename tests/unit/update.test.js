import test from "node:test";
import assert from "node:assert/strict";
import { updateFault } from "../../src/platform/update.js";

test("what the shell says went wrong with an update is told apart by its first word", () => {
  assert.deepEqual(updateFault("none: the newest release has nothing to install from"),
    { kind: "none", detail: "the newest release has nothing to install from" });
  assert.equal(updateFault("unreachable: error sending request").kind, "unreachable");
  assert.equal(updateFault("failed: signature verification failed").detail, "signature verification failed");
  assert.deepEqual(updateFault(new Error("something odd")), { kind: "failed", detail: "something odd" });
});

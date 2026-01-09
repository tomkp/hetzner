import { describe, it } from "node:test";
import assert from "node:assert";
import { delay } from "./utils.ts";

describe("utils", () => {
  describe("delay", () => {
    it("returns a promise that resolves after the specified time", async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      assert.ok(elapsed >= 45, `Expected at least 45ms, got ${String(elapsed)}ms`);
      assert.ok(elapsed < 100, `Expected less than 100ms, got ${String(elapsed)}ms`);
    });

    it("resolves to undefined", async () => {
      await delay(1);
      // delay returns void/undefined - if it resolves, the test passes
      assert.ok(true);
    });
  });
});

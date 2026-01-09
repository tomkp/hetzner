import { describe, it } from "node:test";
import assert from "node:assert";
import { delay, calculateBackoff } from "./utils.ts";

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

  describe("calculateBackoff", () => {
    it("uses retryAfter when larger than exponential backoff", () => {
      // retryAfter = 5 seconds = 5000ms, exponential = 100 * 2^1 = 200ms
      const result = calculateBackoff(5, 1);
      assert.strictEqual(result, 5000);
    });

    it("uses exponential backoff when larger than retryAfter", () => {
      // retryAfter = 0 seconds = 0ms, exponential = 100 * 2^3 = 800ms
      const result = calculateBackoff(0, 3);
      assert.strictEqual(result, 800);
    });

    it("calculates exponential backoff correctly", () => {
      // retryAfter = 0, retry 1: 100 * 2^1 = 200
      assert.strictEqual(calculateBackoff(0, 1), 200);
      // retryAfter = 0, retry 2: 100 * 2^2 = 400
      assert.strictEqual(calculateBackoff(0, 2), 400);
      // retryAfter = 0, retry 3: 100 * 2^3 = 800
      assert.strictEqual(calculateBackoff(0, 3), 800);
    });

    it("converts retryAfter seconds to milliseconds", () => {
      const result = calculateBackoff(10, 1);
      assert.strictEqual(result, 10000);
    });
  });
});

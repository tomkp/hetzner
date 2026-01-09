import { describe, it } from "node:test";
import assert from "node:assert";
import { VERSION } from "./index.ts";

describe("hetzner client", () => {
  it("exports VERSION", () => {
    assert.strictEqual(VERSION, "0.1.0");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import { getIntegrationClient, shouldRunIntegrationTests } from "./test-helpers.ts";
import { PricingApi } from "../resources/pricing.ts";

const runTests = shouldRunIntegrationTests();

describe("PricingApi Integration", { skip: !runTests }, () => {
  it("gets pricing information", async () => {
    const client = getIntegrationClient();
    const pricingApi = new PricingApi(client);

    const pricing = await pricingApi.get();

    assert.ok(pricing.currency, "Should have currency");
    assert.ok(pricing.server_types, "Should have server type pricing");
    assert.ok(pricing.server_types.length > 0, "Should have at least one server type price");
  });
});

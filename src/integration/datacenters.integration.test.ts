import { describe, it } from "node:test";
import assert from "node:assert";
import { getIntegrationClient, shouldRunIntegrationTests } from "./test-helpers.ts";
import { DatacentersApi } from "../resources/datacenters.ts";

const runTests = shouldRunIntegrationTests();

describe("DatacentersApi Integration", { skip: !runTests }, () => {
  it("lists all datacenters", async () => {
    const client = getIntegrationClient();
    const datacenters = new DatacentersApi(client);

    const result = await datacenters.list();

    assert.ok(result.datacenters.length > 0, "Should have at least one datacenter");
    const datacenter = result.datacenters[0];
    assert.ok(datacenter.id, "Datacenter should have an id");
    assert.ok(datacenter.name, "Datacenter should have a name");
    assert.ok(datacenter.location, "Datacenter should have a location");
  });

  it("gets a datacenter by id", async () => {
    const client = getIntegrationClient();
    const datacenters = new DatacentersApi(client);

    const { datacenters: all } = await datacenters.list();
    const first = all[0];

    const datacenter = await datacenters.get(first.id);

    assert.strictEqual(datacenter.id, first.id);
    assert.strictEqual(datacenter.name, first.name);
  });

  it("gets a datacenter by name", async () => {
    const client = getIntegrationClient();
    const datacenters = new DatacentersApi(client);

    const datacenter = await datacenters.getByName("fsn1-dc14");

    assert.ok(datacenter, "Should find fsn1-dc14 datacenter");
    assert.strictEqual(datacenter.name, "fsn1-dc14");
  });
});

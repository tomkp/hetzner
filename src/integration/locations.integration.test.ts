import { describe, it } from "node:test";
import assert from "node:assert";
import { getIntegrationClient, shouldRunIntegrationTests } from "./test-helpers.ts";
import { LocationsApi } from "../resources/locations.ts";

const runTests = shouldRunIntegrationTests();

describe("LocationsApi Integration", { skip: !runTests }, () => {
  it("lists all locations", async () => {
    const client = getIntegrationClient();
    const locations = new LocationsApi(client);

    const result = await locations.list();

    assert.ok(result.locations.length > 0, "Should have at least one location");
    const location = result.locations[0];
    assert.ok(location.id, "Location should have an id");
    assert.ok(location.name, "Location should have a name");
    assert.ok(location.city, "Location should have a city");
    assert.ok(location.country, "Location should have a country");
  });

  it("gets a location by id", async () => {
    const client = getIntegrationClient();
    const locations = new LocationsApi(client);

    const { locations: allLocations } = await locations.list();
    const firstLocation = allLocations[0];

    const location = await locations.get(firstLocation.id);

    assert.strictEqual(location.id, firstLocation.id);
    assert.strictEqual(location.name, firstLocation.name);
  });

  it("gets a location by name", async () => {
    const client = getIntegrationClient();
    const locations = new LocationsApi(client);

    const location = await locations.getByName("fsn1");

    assert.ok(location, "Should find fsn1 location");
    assert.strictEqual(location.name, "fsn1");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import { getIntegrationClient, shouldRunIntegrationTests } from "./test-helpers.ts";
import { ServerTypesApi } from "../resources/server-types.ts";

const runTests = shouldRunIntegrationTests();

describe("ServerTypesApi Integration", { skip: !runTests }, () => {
  it("lists all server types", async () => {
    const client = getIntegrationClient();
    const serverTypes = new ServerTypesApi(client);

    const result = await serverTypes.list();

    assert.ok(result.server_types.length > 0, "Should have at least one server type");
    const serverType = result.server_types[0];
    assert.ok(serverType.id, "Server type should have an id");
    assert.ok(serverType.name, "Server type should have a name");
    assert.ok(serverType.cores > 0, "Server type should have cores");
    assert.ok(serverType.memory > 0, "Server type should have memory");
    assert.ok(serverType.disk > 0, "Server type should have disk");
  });

  it("gets a server type by id", async () => {
    const client = getIntegrationClient();
    const serverTypes = new ServerTypesApi(client);

    const { server_types } = await serverTypes.list();
    const first = server_types[0];

    const serverType = await serverTypes.get(first.id);

    assert.strictEqual(serverType.id, first.id);
    assert.strictEqual(serverType.name, first.name);
  });

  it("gets a server type by name", async () => {
    const client = getIntegrationClient();
    const serverTypes = new ServerTypesApi(client);

    const serverType = await serverTypes.getByName("cx22");

    assert.ok(serverType, "Should find cx22 server type");
    assert.strictEqual(serverType.name, "cx22");
  });
});

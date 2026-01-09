import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { NetworksApi, type Network } from "./networks.ts";
import { type Action } from "./actions.ts";

describe("NetworksApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let networks: NetworksApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "add_subnet",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 200, type: "network" }],
    error: { code: "", message: "" },
  };

  const mockNetwork: Network = {
    id: 200,
    name: "my-network",
    ip_range: "10.0.0.0/8",
    subnets: [
      {
        type: "cloud",
        ip_range: "10.0.1.0/24",
        network_zone: "eu-central",
        gateway: "10.0.0.1",
      },
    ],
    routes: [
      {
        destination: "10.100.1.0/24",
        gateway: "10.0.1.1",
      },
    ],
    servers: [42],
    load_balancers: [],
    protection: { delete: false },
    labels: { env: "test" },
    created: "2025-01-01T00:00:00+00:00",
    expose_routes_to_vswitch: false,
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    networks = new NetworksApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a network by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ network: mockNetwork }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const network = await networks.get(200);

      assert.strictEqual(network.id, 200);
      assert.strictEqual(network.name, "my-network");
      assert.strictEqual(network.ip_range, "10.0.0.0/8");
    });
  });

  describe("list", () => {
    it("lists networks with pagination", async () => {
      const response = {
        networks: [mockNetwork],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 1,
          },
        },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await networks.list();

      assert.strictEqual(result.networks.length, 1);
      assert.strictEqual(result.networks[0].name, "my-network");
    });
  });

  describe("create", () => {
    it("creates a new network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ network: mockNetwork }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await networks.create({
        name: "my-network",
        ip_range: "10.0.0.0/8",
      });

      assert.strictEqual(result.id, 200);
      assert.strictEqual(result.name, "my-network");
    });
  });

  describe("update", () => {
    it("updates network name and labels", async () => {
      const updatedNetwork = { ...mockNetwork, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ network: updatedNetwork }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await networks.update(200, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a network", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await networks.delete(200);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds network by name", async () => {
      const response = {
        networks: [mockNetwork],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 1,
          },
        },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const network = await networks.getByName("my-network");

      assert.strictEqual(network?.id, 200);
    });
  });

  describe("addSubnet", () => {
    it("adds a subnet to the network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "add_subnet" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await networks.addSubnet(200, {
        type: "cloud",
        ip_range: "10.0.2.0/24",
        network_zone: "eu-central",
      });

      assert.strictEqual(action.command, "add_subnet");
    });
  });

  describe("deleteSubnet", () => {
    it("deletes a subnet from the network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "delete_subnet" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await networks.deleteSubnet(200, "10.0.1.0/24");

      assert.strictEqual(action.command, "delete_subnet");
    });
  });

  describe("addRoute", () => {
    it("adds a route to the network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "add_route" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await networks.addRoute(200, "10.100.2.0/24", "10.0.1.1");

      assert.strictEqual(action.command, "add_route");
    });
  });

  describe("deleteRoute", () => {
    it("deletes a route from the network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "delete_route" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await networks.deleteRoute(200, "10.100.1.0/24", "10.0.1.1");

      assert.strictEqual(action.command, "delete_route");
    });
  });

  describe("changeIpRange", () => {
    it("changes the network IP range", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "change_ip_range" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await networks.changeIpRange(200, "10.0.0.0/16");

      assert.strictEqual(action.command, "change_ip_range");
    });
  });

  describe("changeProtection", () => {
    it("changes network protection settings", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "change_protection" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await networks.changeProtection(200, { delete: true });

      assert.strictEqual(action.command, "change_protection");
    });
  });
});

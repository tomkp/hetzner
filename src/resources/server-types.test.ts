import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { ServerTypesApi, type ServerType } from "./server-types.ts";

describe("ServerTypesApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let serverTypes: ServerTypesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockServerType: ServerType = {
    id: 1,
    name: "cx11",
    description: "CX11",
    cores: 1,
    memory: 2,
    disk: 20,
    deprecated: false,
    prices: [
      {
        location: "fsn1",
        price_hourly: { net: "0.0050000000", gross: "0.0059500000" },
        price_monthly: { net: "3.2900000000", gross: "3.9200000000" },
      },
    ],
    storage_type: "local",
    cpu_type: "shared",
    architecture: "x86",
    included_traffic: 654311424000,
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    serverTypes = new ServerTypesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a server type by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ server_type: mockServerType }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const serverType = await serverTypes.get(1);

      assert.strictEqual(serverType.id, 1);
      assert.strictEqual(serverType.name, "cx11");
      assert.strictEqual(serverType.cores, 1);
    });
  });

  describe("list", () => {
    it("lists all server types", async () => {
      const response = {
        server_types: [mockServerType],
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

      const result = await serverTypes.list();

      assert.strictEqual(result.server_types.length, 1);
    });
  });

  describe("getByName", () => {
    it("finds server type by name", async () => {
      const response = {
        server_types: [mockServerType],
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

      const serverType = await serverTypes.getByName("cx11");

      assert.strictEqual(serverType?.name, "cx11");
    });
  });
});

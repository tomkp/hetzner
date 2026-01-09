import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { DatacentersApi, type Datacenter } from "./datacenters.ts";

describe("DatacentersApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let datacenters: DatacentersApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockDatacenter: Datacenter = {
    id: 1,
    name: "fsn1-dc14",
    description: "Falkenstein 1 DC14",
    location: {
      id: 1,
      name: "fsn1",
      description: "Falkenstein DC Park 1",
      country: "DE",
      city: "Falkenstein",
      latitude: 50.47612,
      longitude: 12.370071,
      network_zone: "eu-central",
    },
    server_types: {
      supported: [1, 2, 3],
      available: [1, 2, 3],
      available_for_migration: [1, 2, 3],
    },
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    datacenters = new DatacentersApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a datacenter by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ datacenter: mockDatacenter }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const datacenter = await datacenters.get(1);

      assert.strictEqual(datacenter.id, 1);
      assert.strictEqual(datacenter.name, "fsn1-dc14");
      assert.strictEqual(datacenter.location.name, "fsn1");
    });
  });

  describe("list", () => {
    it("lists all datacenters with recommendation", async () => {
      const response = {
        datacenters: [mockDatacenter],
        recommendation: 1,
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

      const result = await datacenters.list();

      assert.strictEqual(result.datacenters.length, 1);
      assert.strictEqual(result.recommendation, 1);
    });
  });

  describe("getByName", () => {
    it("finds datacenter by name", async () => {
      const response = {
        datacenters: [mockDatacenter],
        recommendation: 1,
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

      const datacenter = await datacenters.getByName("fsn1-dc14");

      assert.strictEqual(datacenter?.name, "fsn1-dc14");
    });
  });
});

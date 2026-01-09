import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerDnsClient } from "./client.ts";
import { ZonesApi, type Zone } from "./zones.ts";

describe("ZonesApi", () => {
  const mockToken = "test-dns-api-token";
  let client: HetznerDnsClient;
  let zones: ZonesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockZone: Zone = {
    id: "zone-123",
    name: "example.com",
    ttl: 3600,
    ns: ["hydrogen.ns.hetzner.com", "oxygen.ns.hetzner.com", "helium.ns.hetzner.de"],
    records_count: 4,
    created: "2025-01-01T00:00:00+00:00",
    modified: "2025-01-01T00:00:00+00:00",
    status: "verified",
  };

  beforeEach(() => {
    client = new HetznerDnsClient(mockToken);
    zones = new ZonesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a zone by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zone: mockZone }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const zone = await zones.get("zone-123");

      assert.strictEqual(zone.id, "zone-123");
      assert.strictEqual(zone.name, "example.com");
      assert.strictEqual(zone.ttl, 3600);
    });
  });

  describe("list", () => {
    it("lists all zones with pagination", async () => {
      const response = {
        zones: [mockZone],
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

      const result = await zones.list();

      assert.strictEqual(result.zones.length, 1);
      assert.strictEqual(result.zones[0].name, "example.com");
    });

    it("filters zones by name", async () => {
      const response = {
        zones: [mockZone],
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

      await zones.list({ name: "example.com" });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("name=example.com"));
    });
  });

  describe("create", () => {
    it("creates a new zone", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zone: mockZone }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const zone = await zones.create({ name: "example.com", ttl: 3600 });

      assert.strictEqual(zone.name, "example.com");
      assert.strictEqual(zone.ttl, 3600);
    });
  });

  describe("update", () => {
    it("updates a zone", async () => {
      const updatedZone = { ...mockZone, ttl: 7200 };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zone: updatedZone }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const zone = await zones.update("zone-123", { ttl: 7200 });

      assert.strictEqual(zone.ttl, 7200);
    });
  });

  describe("delete", () => {
    it("deletes a zone", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response("", { status: 200 })));

      await zones.delete("zone-123");

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      const options = call?.arguments[1] as RequestInit;
      assert.ok(url.includes("/zones/zone-123"));
      assert.strictEqual(options.method, "DELETE");
    });
  });

  describe("getByName", () => {
    it("finds zone by name", async () => {
      const response = {
        zones: [mockZone],
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

      const zone = await zones.getByName("example.com");

      assert.strictEqual(zone?.name, "example.com");
    });

    it("returns undefined when zone not found", async () => {
      const response = {
        zones: [],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 0,
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

      const zone = await zones.getByName("nonexistent.com");

      assert.strictEqual(zone, undefined);
    });
  });
});

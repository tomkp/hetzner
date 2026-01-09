import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerDnsClient } from "./client.ts";
import { RecordsApi, type Record } from "./records.ts";

describe("RecordsApi", () => {
  const mockToken = "test-dns-api-token";
  let client: HetznerDnsClient;
  let records: RecordsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockRecord: Record = {
    id: "record-123",
    zone_id: "zone-456",
    type: "A",
    name: "@",
    value: "192.168.1.1",
    ttl: 3600,
    created: "2025-01-01T00:00:00+00:00",
    modified: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerDnsClient(mockToken);
    records = new RecordsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a record by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ record: mockRecord }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const record = await records.get("record-123");

      assert.strictEqual(record.id, "record-123");
      assert.strictEqual(record.type, "A");
      assert.strictEqual(record.value, "192.168.1.1");
    });
  });

  describe("list", () => {
    it("lists all records for a zone", async () => {
      const response = {
        records: [mockRecord],
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

      const result = await records.list({ zone_id: "zone-456" });

      assert.strictEqual(result.records.length, 1);
      assert.strictEqual(result.records[0].type, "A");
    });

    it("filters records by type", async () => {
      const response = {
        records: [mockRecord],
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

      await records.list({ zone_id: "zone-456", type: "A" });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("zone_id=zone-456"));
      assert.ok(url.includes("type=A"));
    });
  });

  describe("create", () => {
    it("creates a new record", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ record: mockRecord }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const record = await records.create({
        zone_id: "zone-456",
        type: "A",
        name: "@",
        value: "192.168.1.1",
        ttl: 3600,
      });

      assert.strictEqual(record.type, "A");
      assert.strictEqual(record.value, "192.168.1.1");
    });
  });

  describe("update", () => {
    it("updates a record", async () => {
      const updatedRecord = { ...mockRecord, value: "192.168.1.2" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ record: updatedRecord }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const record = await records.update("record-123", {
        zone_id: "zone-456",
        type: "A",
        name: "@",
        value: "192.168.1.2",
        ttl: 3600,
      });

      assert.strictEqual(record.value, "192.168.1.2");
    });
  });

  describe("delete", () => {
    it("deletes a record", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response("", { status: 200 })));

      await records.delete("record-123");

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      const options = call?.arguments[1] as RequestInit;
      assert.ok(url.includes("/records/record-123"));
      assert.strictEqual(options.method, "DELETE");
    });
  });

  describe("bulkCreate", () => {
    it("creates multiple records at once", async () => {
      const response = {
        records: [mockRecord, { ...mockRecord, id: "record-124", name: "www" }],
        valid_records: [mockRecord, { ...mockRecord, id: "record-124", name: "www" }],
        invalid_records: [],
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await records.bulkCreate({
        records: [
          { zone_id: "zone-456", type: "A", name: "@", value: "192.168.1.1", ttl: 3600 },
          { zone_id: "zone-456", type: "A", name: "www", value: "192.168.1.1", ttl: 3600 },
        ],
      });

      assert.strictEqual(result.records.length, 2);
      assert.strictEqual(result.valid_records.length, 2);
      assert.strictEqual(result.invalid_records.length, 0);
    });
  });
});

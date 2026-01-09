import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { IsosApi, type Iso } from "./isos.ts";

describe("IsosApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let isos: IsosApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockIso: Iso = {
    id: 1,
    name: "FreeBSD-13.2-RELEASE-amd64-dvd1",
    description: "FreeBSD 13.2",
    type: "public",
    deprecated: null,
    architecture: "x86",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    isos = new IsosApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves an ISO by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ iso: mockIso }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const iso = await isos.get(1);

      assert.strictEqual(iso.id, 1);
      assert.strictEqual(iso.name, "FreeBSD-13.2-RELEASE-amd64-dvd1");
    });
  });

  describe("list", () => {
    it("lists all ISOs", async () => {
      const response = {
        isos: [mockIso],
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

      const result = await isos.list();

      assert.strictEqual(result.isos.length, 1);
    });
  });

  describe("getByName", () => {
    it("finds ISO by name", async () => {
      const response = {
        isos: [mockIso],
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

      const iso = await isos.getByName("FreeBSD-13.2-RELEASE-amd64-dvd1");

      assert.strictEqual(iso?.name, "FreeBSD-13.2-RELEASE-amd64-dvd1");
    });
  });
});

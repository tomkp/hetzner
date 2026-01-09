import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { LocationsApi, type Location } from "./locations.ts";

describe("LocationsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let locations: LocationsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockLocation: Location = {
    id: 1,
    name: "fsn1",
    description: "Falkenstein DC Park 1",
    country: "DE",
    city: "Falkenstein",
    latitude: 50.47612,
    longitude: 12.370071,
    network_zone: "eu-central",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    locations = new LocationsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a location by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ location: mockLocation }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const location = await locations.get(1);

      assert.strictEqual(location.id, 1);
      assert.strictEqual(location.name, "fsn1");
      assert.strictEqual(location.city, "Falkenstein");
    });
  });

  describe("list", () => {
    it("lists all locations", async () => {
      const response = {
        locations: [mockLocation],
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

      const result = await locations.list();

      assert.strictEqual(result.locations.length, 1);
    });
  });

  describe("getByName", () => {
    it("finds location by name", async () => {
      const response = {
        locations: [mockLocation],
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

      const location = await locations.getByName("fsn1");

      assert.strictEqual(location?.name, "fsn1");
    });
  });
});

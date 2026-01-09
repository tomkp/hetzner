import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  setupMockClient,
  mockResponse,
  mockPaginatedResponse,
  type TestContext,
} from "../test-utils.ts";
import { LocationsApi, type Location } from "./locations.ts";

describe("LocationsApi", () => {
  let ctx: TestContext;
  let locations: LocationsApi;

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
    ctx = setupMockClient();
    locations = new LocationsApi(ctx.client);
  });

  describe("get", () => {
    it("retrieves a location by id", async () => {
      ctx.fetchMock.mock.mockImplementation(() =>
        Promise.resolve(mockResponse({ location: mockLocation }))
      );

      const location = await locations.get(1);

      assert.strictEqual(location.id, 1);
      assert.strictEqual(location.name, "fsn1");
      assert.strictEqual(location.city, "Falkenstein");
    });
  });

  describe("list", () => {
    it("lists all locations", async () => {
      ctx.fetchMock.mock.mockImplementation(() =>
        Promise.resolve(mockResponse(mockPaginatedResponse("locations", [mockLocation])))
      );

      const result = await locations.list();

      assert.strictEqual(result.locations.length, 1);
    });
  });

  describe("getByName", () => {
    it("finds location by name", async () => {
      ctx.fetchMock.mock.mockImplementation(() =>
        Promise.resolve(mockResponse(mockPaginatedResponse("locations", [mockLocation])))
      );

      const location = await locations.getByName("fsn1");

      assert.strictEqual(location?.name, "fsn1");
    });
  });
});

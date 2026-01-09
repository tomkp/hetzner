import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { PlacementGroupsApi, type PlacementGroup } from "./placement-groups.ts";

describe("PlacementGroupsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let placementGroups: PlacementGroupsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockPlacementGroup: PlacementGroup = {
    id: 800,
    name: "my-placement-group",
    type: "spread",
    servers: [100, 101, 102],
    labels: { env: "test" },
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    placementGroups = new PlacementGroupsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a placement group by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ placement_group: mockPlacementGroup }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const pg = await placementGroups.get(800);

      assert.strictEqual(pg.id, 800);
      assert.strictEqual(pg.name, "my-placement-group");
      assert.strictEqual(pg.type, "spread");
    });
  });

  describe("list", () => {
    it("lists placement groups with pagination", async () => {
      const response = {
        placement_groups: [mockPlacementGroup],
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

      const result = await placementGroups.list();

      assert.strictEqual(result.placement_groups.length, 1);
      assert.strictEqual(result.placement_groups[0].name, "my-placement-group");
    });

    it("filters by type", async () => {
      const response = {
        placement_groups: [mockPlacementGroup],
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

      const result = await placementGroups.list({ type: "spread" });

      assert.strictEqual(result.placement_groups.length, 1);
    });
  });

  describe("create", () => {
    it("creates a placement group", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ placement_group: mockPlacementGroup }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await placementGroups.create({
        name: "my-placement-group",
        type: "spread",
      });

      assert.strictEqual(result.placement_group.id, 800);
      assert.strictEqual(result.placement_group.type, "spread");
    });
  });

  describe("update", () => {
    it("updates placement group name and labels", async () => {
      const updatedPG = { ...mockPlacementGroup, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ placement_group: updatedPG }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await placementGroups.update(800, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a placement group", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await placementGroups.delete(800);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds placement group by name", async () => {
      const response = {
        placement_groups: [mockPlacementGroup],
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

      const pg = await placementGroups.getByName("my-placement-group");

      assert.strictEqual(pg?.id, 800);
    });

    it("returns undefined when not found", async () => {
      const response = {
        placement_groups: [],
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

      const pg = await placementGroups.getByName("nonexistent");

      assert.strictEqual(pg, undefined);
    });
  });
});

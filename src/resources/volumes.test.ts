import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { VolumesApi, type Volume, type VolumeCreateResponse } from "./volumes.ts";
import { type Action } from "./actions.ts";

describe("VolumesApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let volumes: VolumesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "create_volume",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 100, type: "volume" }],
    error: { code: "", message: "" },
  };

  const mockVolume: Volume = {
    id: 100,
    name: "my-volume",
    server: null,
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
    size: 100,
    linux_device: "/dev/disk/by-id/scsi-0HC_Volume_100",
    protection: { delete: false },
    labels: { env: "test" },
    status: "available",
    created: "2025-01-01T00:00:00+00:00",
    format: "ext4",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    volumes = new VolumesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a volume by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ volume: mockVolume }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const volume = await volumes.get(100);

      assert.strictEqual(volume.id, 100);
      assert.strictEqual(volume.name, "my-volume");
      assert.strictEqual(volume.size, 100);
    });
  });

  describe("list", () => {
    it("lists volumes with pagination", async () => {
      const response = {
        volumes: [mockVolume],
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

      const result = await volumes.list({ status: "available" });

      assert.strictEqual(result.volumes.length, 1);
      assert.strictEqual(result.volumes[0].name, "my-volume");
    });
  });

  describe("create", () => {
    it("creates a new volume", async () => {
      const createResponse: VolumeCreateResponse = {
        volume: mockVolume,
        action: mockAction,
        next_actions: [],
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(createResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await volumes.create({
        name: "my-volume",
        size: 100,
        location: "fsn1",
      });

      assert.strictEqual(result.volume.id, 100);
      assert.strictEqual(result.action.command, "create_volume");
    });
  });

  describe("update", () => {
    it("updates volume name and labels", async () => {
      const updatedVolume = { ...mockVolume, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ volume: updatedVolume }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await volumes.update(100, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a volume", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await volumes.delete(100);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds volume by name", async () => {
      const response = {
        volumes: [mockVolume],
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

      const volume = await volumes.getByName("my-volume");

      assert.strictEqual(volume?.id, 100);
    });
  });

  describe("attach", () => {
    it("attaches volume to server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "attach_volume" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await volumes.attach(100, 42);

      assert.strictEqual(action.command, "attach_volume");
    });

    it("attaches volume with automount option", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "attach_volume" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await volumes.attach(100, 42, true);

      assert.strictEqual(action.command, "attach_volume");
      const call = fetchMock.mock.calls[0] as { arguments: [string, { body: string }] };
      const requestBody = JSON.parse(call.arguments[1].body) as { automount: boolean };
      assert.strictEqual(requestBody.automount, true);
    });
  });

  describe("detach", () => {
    it("detaches volume from server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "detach_volume" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await volumes.detach(100);

      assert.strictEqual(action.command, "detach_volume");
    });
  });

  describe("resize", () => {
    it("resizes volume to new size", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "resize_volume" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await volumes.resize(100, 200);

      assert.strictEqual(action.command, "resize_volume");
      const call = fetchMock.mock.calls[0] as { arguments: [string, { body: string }] };
      const requestBody = JSON.parse(call.arguments[1].body) as { size: number };
      assert.strictEqual(requestBody.size, 200);
    });
  });

  describe("changeProtection", () => {
    it("changes volume protection settings", async () => {
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

      const action = await volumes.changeProtection(100, { delete: true });

      assert.strictEqual(action.command, "change_protection");
    });
  });
});

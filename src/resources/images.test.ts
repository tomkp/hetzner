import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { ImagesApi, type Image } from "./images.ts";

describe("ImagesApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let images: ImagesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockImage: Image = {
    id: 1,
    type: "system",
    status: "available",
    name: "ubuntu-22.04",
    description: "Ubuntu 22.04",
    image_size: 2.3,
    disk_size: 10,
    created: "2025-01-01T00:00:00+00:00",
    created_from: null,
    bound_to: null,
    os_flavor: "ubuntu",
    os_version: "22.04",
    rapid_deploy: true,
    protection: { delete: false },
    deprecated: null,
    labels: {},
    deleted: null,
    architecture: "x86",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    images = new ImagesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves an image by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ image: mockImage }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const image = await images.get(1);

      assert.strictEqual(image.id, 1);
      assert.strictEqual(image.name, "ubuntu-22.04");
    });
  });

  describe("list", () => {
    it("lists images with filters", async () => {
      const response = {
        images: [mockImage],
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

      const result = await images.list({ type: "system" });

      assert.strictEqual(result.images.length, 1);
    });
  });

  describe("update", () => {
    it("updates image description and labels", async () => {
      const updatedImage = { ...mockImage, description: "Updated description" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ image: updatedImage }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await images.update(1, { description: "Updated description" });

      assert.strictEqual(result.description, "Updated description");
    });
  });

  describe("delete", () => {
    it("deletes an image", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await images.delete(1);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });
});

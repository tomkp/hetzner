import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { FloatingIPsApi, type FloatingIP } from "./floating-ips.ts";
import { type Action } from "./actions.ts";

describe("FloatingIPsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let floatingIPs: FloatingIPsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "assign_floating_ip",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 400, type: "floating_ip" }],
    error: { code: "", message: "" },
  };

  const mockFloatingIP: FloatingIP = {
    id: 400,
    name: "my-floating-ip",
    description: "My Floating IP",
    ip: "1.2.3.4",
    type: "ipv4",
    server: null,
    dns_ptr: [{ ip: "1.2.3.4", dns_ptr: "server01.example.com" }],
    home_location: {
      id: 1,
      name: "fsn1",
      description: "Falkenstein DC Park 1",
      country: "DE",
      city: "Falkenstein",
      latitude: 50.47612,
      longitude: 12.370071,
      network_zone: "eu-central",
    },
    blocked: false,
    protection: { delete: false },
    labels: { env: "test" },
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    floatingIPs = new FloatingIPsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a floating IP by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ floating_ip: mockFloatingIP }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const floatingIP = await floatingIPs.get(400);

      assert.strictEqual(floatingIP.id, 400);
      assert.strictEqual(floatingIP.name, "my-floating-ip");
      assert.strictEqual(floatingIP.ip, "1.2.3.4");
    });
  });

  describe("list", () => {
    it("lists floating IPs with pagination", async () => {
      const response = {
        floating_ips: [mockFloatingIP],
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

      const result = await floatingIPs.list();

      assert.strictEqual(result.floating_ips.length, 1);
      assert.strictEqual(result.floating_ips[0].name, "my-floating-ip");
    });
  });

  describe("create", () => {
    it("creates a new floating IP", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ floating_ip: mockFloatingIP }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await floatingIPs.create({
        type: "ipv4",
        home_location: "fsn1",
      });

      assert.strictEqual(result.id, 400);
      assert.strictEqual(result.type, "ipv4");
    });
  });

  describe("update", () => {
    it("updates floating IP name and description", async () => {
      const updatedFloatingIP = { ...mockFloatingIP, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ floating_ip: updatedFloatingIP }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await floatingIPs.update(400, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a floating IP", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await floatingIPs.delete(400);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds floating IP by name", async () => {
      const response = {
        floating_ips: [mockFloatingIP],
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

      const floatingIP = await floatingIPs.getByName("my-floating-ip");

      assert.strictEqual(floatingIP?.id, 400);
    });
  });

  describe("assign", () => {
    it("assigns floating IP to server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "assign_floating_ip" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await floatingIPs.assign(400, 42);

      assert.strictEqual(action.command, "assign_floating_ip");
    });
  });

  describe("unassign", () => {
    it("unassigns floating IP from server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "unassign_floating_ip" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await floatingIPs.unassign(400);

      assert.strictEqual(action.command, "unassign_floating_ip");
    });
  });

  describe("changeDnsPtr", () => {
    it("changes reverse DNS pointer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "change_dns_ptr" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await floatingIPs.changeDnsPtr(400, "1.2.3.4", "new.example.com");

      assert.strictEqual(action.command, "change_dns_ptr");
    });
  });

  describe("changeProtection", () => {
    it("changes floating IP protection settings", async () => {
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

      const action = await floatingIPs.changeProtection(400, { delete: true });

      assert.strictEqual(action.command, "change_protection");
    });
  });
});

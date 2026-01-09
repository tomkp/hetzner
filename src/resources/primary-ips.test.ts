import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { PrimaryIPsApi, type PrimaryIP, type PrimaryIPCreateResponse } from "./primary-ips.ts";
import { type Action } from "./actions.ts";

describe("PrimaryIPsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let primaryIPs: PrimaryIPsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "assign_primary_ip",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 500, type: "primary_ip" }],
    error: { code: "", message: "" },
  };

  const mockPrimaryIP: PrimaryIP = {
    id: 500,
    name: "my-primary-ip",
    ip: "1.2.3.4",
    type: "ipv4",
    datacenter: {
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
      server_types: { available: [], available_for_migration: [], supported: [] },
    },
    blocked: false,
    dns_ptr: [{ ip: "1.2.3.4", dns_ptr: "server01.example.com" }],
    assignee_id: null,
    assignee_type: "server",
    auto_delete: false,
    protection: { delete: false },
    labels: { env: "test" },
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    primaryIPs = new PrimaryIPsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a primary IP by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ primary_ip: mockPrimaryIP }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const primaryIP = await primaryIPs.get(500);

      assert.strictEqual(primaryIP.id, 500);
      assert.strictEqual(primaryIP.name, "my-primary-ip");
      assert.strictEqual(primaryIP.ip, "1.2.3.4");
    });
  });

  describe("list", () => {
    it("lists primary IPs with pagination", async () => {
      const response = {
        primary_ips: [mockPrimaryIP],
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

      const result = await primaryIPs.list();

      assert.strictEqual(result.primary_ips.length, 1);
      assert.strictEqual(result.primary_ips[0].name, "my-primary-ip");
    });
  });

  describe("create", () => {
    it("creates a new primary IP", async () => {
      const createResponse: PrimaryIPCreateResponse = {
        primary_ip: mockPrimaryIP,
        action: mockAction,
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(createResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await primaryIPs.create({
        name: "my-primary-ip",
        type: "ipv4",
        assignee_type: "server",
        datacenter: "fsn1-dc14",
      });

      assert.strictEqual(result.primary_ip.id, 500);
      assert.strictEqual(result.primary_ip.type, "ipv4");
    });
  });

  describe("update", () => {
    it("updates primary IP name and auto_delete", async () => {
      const updatedPrimaryIP = { ...mockPrimaryIP, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ primary_ip: updatedPrimaryIP }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await primaryIPs.update(500, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a primary IP", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await primaryIPs.delete(500);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds primary IP by name", async () => {
      const response = {
        primary_ips: [mockPrimaryIP],
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

      const primaryIP = await primaryIPs.getByName("my-primary-ip");

      assert.strictEqual(primaryIP?.id, 500);
    });
  });

  describe("assign", () => {
    it("assigns primary IP to server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "assign_primary_ip" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await primaryIPs.assign(500, 42, "server");

      assert.strictEqual(action.command, "assign_primary_ip");
    });
  });

  describe("unassign", () => {
    it("unassigns primary IP from server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "unassign_primary_ip" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await primaryIPs.unassign(500);

      assert.strictEqual(action.command, "unassign_primary_ip");
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

      const action = await primaryIPs.changeDnsPtr(500, "1.2.3.4", "new.example.com");

      assert.strictEqual(action.command, "change_dns_ptr");
    });
  });

  describe("changeProtection", () => {
    it("changes primary IP protection settings", async () => {
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

      const action = await primaryIPs.changeProtection(500, { delete: true });

      assert.strictEqual(action.command, "change_protection");
    });
  });
});

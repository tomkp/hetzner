import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { FirewallsApi, type Firewall, type FirewallCreateResponse } from "./firewalls.ts";
import { type Action } from "./actions.ts";

describe("FirewallsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let firewalls: FirewallsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "set_firewall_rules",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 300, type: "firewall" }],
    error: { code: "", message: "" },
  };

  const mockFirewall: Firewall = {
    id: 300,
    name: "my-firewall",
    rules: [
      {
        direction: "in",
        protocol: "tcp",
        port: "80",
        source_ips: ["0.0.0.0/0", "::/0"],
        description: "Allow HTTP",
      },
      {
        direction: "in",
        protocol: "tcp",
        port: "443",
        source_ips: ["0.0.0.0/0", "::/0"],
        description: "Allow HTTPS",
      },
    ],
    applied_to: [
      {
        type: "server",
        server: { id: 42 },
      },
    ],
    labels: { env: "test" },
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    firewalls = new FirewallsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a firewall by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ firewall: mockFirewall }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const firewall = await firewalls.get(300);

      assert.strictEqual(firewall.id, 300);
      assert.strictEqual(firewall.name, "my-firewall");
      assert.strictEqual(firewall.rules.length, 2);
    });
  });

  describe("list", () => {
    it("lists firewalls with pagination", async () => {
      const response = {
        firewalls: [mockFirewall],
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

      const result = await firewalls.list();

      assert.strictEqual(result.firewalls.length, 1);
      assert.strictEqual(result.firewalls[0].name, "my-firewall");
    });
  });

  describe("create", () => {
    it("creates a new firewall", async () => {
      const createResponse: FirewallCreateResponse = {
        firewall: mockFirewall,
        actions: [mockAction],
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(createResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await firewalls.create({
        name: "my-firewall",
        rules: [
          {
            direction: "in",
            protocol: "tcp",
            port: "80",
            source_ips: ["0.0.0.0/0"],
          },
        ],
      });

      assert.strictEqual(result.firewall.id, 300);
      assert.strictEqual(result.firewall.name, "my-firewall");
    });
  });

  describe("update", () => {
    it("updates firewall name and labels", async () => {
      const updatedFirewall = { ...mockFirewall, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ firewall: updatedFirewall }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await firewalls.update(300, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a firewall", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await firewalls.delete(300);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds firewall by name", async () => {
      const response = {
        firewalls: [mockFirewall],
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

      const firewall = await firewalls.getByName("my-firewall");

      assert.strictEqual(firewall?.id, 300);
    });
  });

  describe("setRules", () => {
    it("sets firewall rules", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ actions: [{ ...mockAction, command: "set_firewall_rules" }] }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const actions = await firewalls.setRules(300, [
        {
          direction: "in",
          protocol: "tcp",
          port: "22",
          source_ips: ["10.0.0.0/8"],
        },
      ]);

      assert.strictEqual(actions.length, 1);
      assert.strictEqual(actions[0].command, "set_firewall_rules");
    });
  });

  describe("applyToResources", () => {
    it("applies firewall to resources", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ actions: [{ ...mockAction, command: "apply_firewall" }] }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const actions = await firewalls.applyToResources(300, [
        { type: "server", server: { id: 42 } },
      ]);

      assert.strictEqual(actions.length, 1);
      assert.strictEqual(actions[0].command, "apply_firewall");
    });
  });

  describe("removeFromResources", () => {
    it("removes firewall from resources", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ actions: [{ ...mockAction, command: "remove_firewall" }] }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const actions = await firewalls.removeFromResources(300, [
        { type: "server", server: { id: 42 } },
      ]);

      assert.strictEqual(actions.length, 1);
      assert.strictEqual(actions[0].command, "remove_firewall");
    });
  });
});

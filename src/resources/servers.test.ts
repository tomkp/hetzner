import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import {
  ServersApi,
  type Server,
  type ServerCreateResponse,
  type ServerStatus,
} from "./servers.ts";
import { type Action } from "./actions.ts";

describe("ServersApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let servers: ServersApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "create_server",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 42, type: "server" }],
    error: { code: "", message: "" },
  };

  const mockServer: Server = {
    id: 42,
    name: "my-server",
    status: "running" as ServerStatus,
    created: "2025-01-01T00:00:00+00:00",
    public_net: {
      ipv4: { ip: "1.2.3.4", blocked: false, dns_ptr: "server.example.com" },
      ipv6: { ip: "2001:db8::/64", blocked: false, dns_ptr: [] },
      floating_ips: [],
      firewalls: [{ id: 1, status: "applied" }],
    },
    private_net: [],
    server_type: {
      id: 1,
      name: "cx11",
      description: "CX11",
      cores: 1,
      memory: 2,
      disk: 20,
      deprecated: false,
      prices: [],
      storage_type: "local",
      cpu_type: "shared",
      architecture: "x86",
      included_traffic: 654321,
    },
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
    image: {
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
    },
    iso: null,
    rescue_enabled: false,
    locked: false,
    backup_window: null,
    outgoing_traffic: 123456789,
    ingoing_traffic: 987654321,
    included_traffic: 654321098765,
    protection: { delete: false, rebuild: false },
    labels: { env: "test" },
    volumes: [],
    load_balancers: [],
    primary_disk_size: 20,
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    servers = new ServersApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a server by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ server: mockServer }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const server = await servers.get(42);

      assert.strictEqual(server.id, 42);
      assert.strictEqual(server.name, "my-server");
      assert.strictEqual(server.status, "running");
    });
  });

  describe("list", () => {
    it("lists servers with pagination", async () => {
      const response = {
        servers: [mockServer],
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

      const result = await servers.list({ status: "running" });

      assert.strictEqual(result.servers.length, 1);
      assert.strictEqual(result.servers[0].name, "my-server");
    });
  });

  describe("create", () => {
    it("creates a new server", async () => {
      const createResponse: ServerCreateResponse = {
        server: mockServer,
        action: mockAction,
        root_password: "secret123",
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

      const result = await servers.create({
        name: "my-server",
        server_type: "cx11",
        image: "ubuntu-22.04",
      });

      assert.strictEqual(result.server.id, 42);
      assert.strictEqual(result.root_password, "secret123");
      assert.strictEqual(result.action.command, "create_server");
    });
  });

  describe("update", () => {
    it("updates server name and labels", async () => {
      const updatedServer = { ...mockServer, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ server: updatedServer }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await servers.update(42, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a server and returns action", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.delete(42);

      assert.strictEqual(action.id, 1);
    });
  });

  describe("getByName", () => {
    it("finds server by name", async () => {
      const response = {
        servers: [mockServer],
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

      const server = await servers.getByName("my-server");

      assert.strictEqual(server?.id, 42);
    });
  });

  describe("power actions", () => {
    it("powers on a server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "start_server" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.powerOn(42);

      assert.strictEqual(action.command, "start_server");
    });

    it("powers off a server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "stop_server" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.powerOff(42);

      assert.strictEqual(action.command, "stop_server");
    });

    it("reboots a server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "reboot_server" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.reboot(42);

      assert.strictEqual(action.command, "reboot_server");
    });

    it("resets a server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "reset_server" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.reset(42);

      assert.strictEqual(action.command, "reset_server");
    });

    it("shuts down a server gracefully", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "shutdown_server" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.shutdown(42);

      assert.strictEqual(action.command, "shutdown_server");
    });
  });

  describe("rescue mode", () => {
    it("enables rescue mode", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              action: { ...mockAction, command: "enable_rescue" },
              root_password: "rescue123",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const result = await servers.enableRescue(42);

      assert.strictEqual(result.action.command, "enable_rescue");
      assert.strictEqual(result.root_password, "rescue123");
    });

    it("disables rescue mode", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "disable_rescue" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.disableRescue(42);

      assert.strictEqual(action.command, "disable_rescue");
    });
  });

  describe("image actions", () => {
    it("creates an image from server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              action: { ...mockAction, command: "create_image" },
              image: mockServer.image,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const result = await servers.createImage(42, { type: "snapshot" });

      assert.strictEqual(result.action.command, "create_image");
      assert.ok(result.image);
    });

    it("rebuilds server from image", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              action: { ...mockAction, command: "rebuild_server" },
              root_password: "newpass123",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const result = await servers.rebuild(42, "ubuntu-22.04");

      assert.strictEqual(result.action.command, "rebuild_server");
      assert.strictEqual(result.root_password, "newpass123");
    });

    it("attaches ISO to server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "attach_iso" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.attachIso(42, "debian-10.0.0-amd64-netinst.iso");

      assert.strictEqual(action.command, "attach_iso");
    });

    it("detaches ISO from server", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "detach_iso" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.detachIso(42);

      assert.strictEqual(action.command, "detach_iso");
    });
  });

  describe("type and protection", () => {
    it("changes server type", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "change_server_type" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await servers.changeType(42, "cx21", true);

      assert.strictEqual(action.command, "change_server_type");
    });

    it("changes protection settings", async () => {
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

      const action = await servers.changeProtection(42, { delete: true });

      assert.strictEqual(action.command, "change_protection");
    });
  });

  describe("backup", () => {
    it("enables backup", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "enable_backup" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.enableBackup(42);

      assert.strictEqual(action.command, "enable_backup");
    });

    it("disables backup", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "disable_backup" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.disableBackup(42);

      assert.strictEqual(action.command, "disable_backup");
    });
  });

  describe("DNS", () => {
    it("changes reverse DNS pointer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "change_dns_ptr" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.changeDnsPtr(42, "1.2.3.4", "server.example.com");

      assert.strictEqual(action.command, "change_dns_ptr");
    });
  });

  describe("network", () => {
    it("attaches to network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "attach_to_network" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await servers.attachToNetwork(42, 123);

      assert.strictEqual(action.command, "attach_to_network");
    });

    it("detaches from network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "detach_from_network" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await servers.detachFromNetwork(42, 123);

      assert.strictEqual(action.command, "detach_from_network");
    });

    it("changes alias IPs", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: { ...mockAction, command: "change_alias_ips" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await servers.changeAliasIps(42, 123, ["10.0.0.5", "10.0.0.6"]);

      assert.strictEqual(action.command, "change_alias_ips");
    });
  });

  describe("metrics", () => {
    it("retrieves server metrics", async () => {
      const metricsResponse = {
        metrics: {
          start: "2025-01-01T00:00:00+00:00",
          end: "2025-01-01T01:00:00+00:00",
          step: 60,
          time_series: {
            cpu: {
              values: [[1704067200, "0.5"]],
            },
          },
        },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(metricsResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await servers.getMetrics(
        42,
        "cpu",
        "2025-01-01T00:00:00+00:00",
        "2025-01-01T01:00:00+00:00"
      );

      assert.ok(result.metrics);
      assert.strictEqual(result.metrics.step, 60);
    });
  });
});

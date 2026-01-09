import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import {
  LoadBalancersApi,
  type LoadBalancer,
  type LoadBalancerService,
  type LoadBalancerTarget,
  type LoadBalancerCreateResponse,
} from "./load-balancers.ts";
import { type Action } from "./actions.ts";

describe("LoadBalancersApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let loadBalancers: LoadBalancersApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "create_load_balancer",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 700, type: "load_balancer" }],
    error: { code: "", message: "" },
  };

  const mockService: LoadBalancerService = {
    protocol: "http",
    listen_port: 80,
    destination_port: 80,
    proxyprotocol: false,
    health_check: {
      protocol: "http",
      port: 80,
      interval: 15,
      timeout: 10,
      retries: 3,
      http: {
        domain: "example.com",
        path: "/health",
        response: '{"status":"ok"}',
        status_codes: ["2??", "3??"],
        tls: false,
      },
    },
    http: {
      cookie_name: "HCLBSTICKY",
      cookie_lifetime: 300,
      certificates: [600],
      redirect_http: true,
      sticky_sessions: true,
    },
  };

  const mockTarget: LoadBalancerTarget = {
    type: "server",
    server: { id: 100 },
    use_private_ip: false,
    health_status: [
      {
        listen_port: 80,
        status: "healthy",
      },
    ],
  };

  const mockLoadBalancer: LoadBalancer = {
    id: 700,
    name: "my-load-balancer",
    public_net: {
      enabled: true,
      ipv4: { ip: "1.2.3.4", dns_ptr: "lb1.example.com" },
      ipv6: { ip: "2001:db8::1", dns_ptr: "lb1.example.com" },
    },
    private_net: [
      {
        network: 1,
        ip: "10.0.0.2",
      },
    ],
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
    load_balancer_type: {
      id: 1,
      name: "lb11",
      description: "LB11",
      max_connections: 10000,
      max_services: 5,
      max_targets: 25,
      max_assigned_certificates: 10,
      deprecated: null,
      prices: [],
    },
    protection: {
      delete: false,
    },
    labels: { env: "test" },
    targets: [mockTarget],
    services: [mockService],
    algorithm: { type: "round_robin" },
    outgoing_traffic: 123456789,
    ingoing_traffic: 987654321,
    included_traffic: 654321098765,
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    loadBalancers = new LoadBalancersApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a load balancer by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ load_balancer: mockLoadBalancer }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const lb = await loadBalancers.get(700);

      assert.strictEqual(lb.id, 700);
      assert.strictEqual(lb.name, "my-load-balancer");
      assert.strictEqual(lb.algorithm.type, "round_robin");
    });
  });

  describe("list", () => {
    it("lists load balancers with pagination", async () => {
      const response = {
        load_balancers: [mockLoadBalancer],
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

      const result = await loadBalancers.list();

      assert.strictEqual(result.load_balancers.length, 1);
      assert.strictEqual(result.load_balancers[0].name, "my-load-balancer");
    });

    it("filters by label selector", async () => {
      const response = {
        load_balancers: [mockLoadBalancer],
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

      const result = await loadBalancers.list({ label_selector: "env=test" });

      assert.strictEqual(result.load_balancers.length, 1);
    });
  });

  describe("create", () => {
    it("creates a load balancer", async () => {
      const createResponse: LoadBalancerCreateResponse = {
        load_balancer: mockLoadBalancer,
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

      const result = await loadBalancers.create({
        name: "my-load-balancer",
        load_balancer_type: "lb11",
        location: "fsn1",
        algorithm: { type: "round_robin" },
      });

      assert.strictEqual(result.load_balancer.id, 700);
      assert.ok(result.action);
    });
  });

  describe("update", () => {
    it("updates load balancer name and labels", async () => {
      const updatedLB = { ...mockLoadBalancer, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ load_balancer: updatedLB }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await loadBalancers.update(700, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a load balancer", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await loadBalancers.delete(700);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds load balancer by name", async () => {
      const response = {
        load_balancers: [mockLoadBalancer],
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

      const lb = await loadBalancers.getByName("my-load-balancer");

      assert.strictEqual(lb?.id, 700);
    });
  });

  describe("addService", () => {
    it("adds a service to load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.addService(700, {
        protocol: "http",
        listen_port: 8080,
        destination_port: 80,
        proxyprotocol: false,
        health_check: {
          protocol: "http",
          port: 80,
          interval: 15,
          timeout: 10,
          retries: 3,
        },
      });

      assert.ok(action.id);
    });
  });

  describe("updateService", () => {
    it("updates a service on load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.updateService(700, {
        listen_port: 80,
        protocol: "https",
        destination_port: 443,
        proxyprotocol: false,
        health_check: {
          protocol: "http",
          port: 80,
          interval: 15,
          timeout: 10,
          retries: 3,
        },
      });

      assert.ok(action.id);
    });
  });

  describe("deleteService", () => {
    it("deletes a service from load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.deleteService(700, 80);

      assert.ok(action.id);
    });
  });

  describe("addTarget", () => {
    it("adds a server target to load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.addTarget(700, {
        type: "server",
        server: { id: 100 },
        use_private_ip: false,
      });

      assert.ok(action.id);
    });

    it("adds a label_selector target to load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.addTarget(700, {
        type: "label_selector",
        label_selector: { selector: "env=prod" },
        use_private_ip: true,
      });

      assert.ok(action.id);
    });
  });

  describe("removeTarget", () => {
    it("removes a target from load balancer", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.removeTarget(700, {
        type: "server",
        server: { id: 100 },
      });

      assert.ok(action.id);
    });
  });

  describe("attachToNetwork", () => {
    it("attaches load balancer to network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.attachToNetwork(700, {
        network: 1,
        ip: "10.0.0.2",
      });

      assert.ok(action.id);
    });
  });

  describe("detachFromNetwork", () => {
    it("detaches load balancer from network", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.detachFromNetwork(700, 1);

      assert.ok(action.id);
    });
  });

  describe("changeAlgorithm", () => {
    it("changes load balancer algorithm", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.changeAlgorithm(700, "least_connections");

      assert.ok(action.id);
    });
  });

  describe("changeDnsPtr", () => {
    it("changes DNS PTR record", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.changeDnsPtr(700, "1.2.3.4", "lb.example.com");

      assert.ok(action.id);
    });
  });

  describe("changeProtection", () => {
    it("changes load balancer protection", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.changeProtection(700, { delete: true });

      assert.ok(action.id);
    });
  });

  describe("changeType", () => {
    it("changes load balancer type", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.changeType(700, "lb21");

      assert.ok(action.id);
    });
  });

  describe("enablePublicInterface", () => {
    it("enables public interface", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.enablePublicInterface(700);

      assert.ok(action.id);
    });
  });

  describe("disablePublicInterface", () => {
    it("disables public interface", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await loadBalancers.disablePublicInterface(700);

      assert.ok(action.id);
    });
  });

  describe("getMetrics", () => {
    it("retrieves load balancer metrics", async () => {
      const metricsResponse = {
        metrics: {
          start: "2025-01-01T00:00:00+00:00",
          end: "2025-01-01T01:00:00+00:00",
          step: 60,
          time_series: {
            requests_per_second: {
              values: [[1704067200, "100"]],
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

      const result = await loadBalancers.getMetrics(700, {
        type: "requests_per_second",
        start: "2025-01-01T00:00:00Z",
        end: "2025-01-01T01:00:00Z",
      });

      assert.ok(result.metrics);
      assert.ok(result.metrics.time_series.requests_per_second);
    });
  });
});

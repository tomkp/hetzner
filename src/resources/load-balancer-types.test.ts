import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { LoadBalancerTypesApi, type LoadBalancerType } from "./load-balancer-types.ts";

describe("LoadBalancerTypesApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let loadBalancerTypes: LoadBalancerTypesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockLoadBalancerType: LoadBalancerType = {
    id: 1,
    name: "lb11",
    description: "LB11",
    max_connections: 10000,
    max_services: 5,
    max_targets: 25,
    max_assigned_certificates: 10,
    deprecated: null,
    prices: [
      {
        location: "fsn1",
        price_hourly: { net: "0.0060000000", gross: "0.0071400000" },
        price_monthly: { net: "4.0000000000", gross: "4.7600000000" },
      },
    ],
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    loadBalancerTypes = new LoadBalancerTypesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a load balancer type by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ load_balancer_type: mockLoadBalancerType }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const lbType = await loadBalancerTypes.get(1);

      assert.strictEqual(lbType.id, 1);
      assert.strictEqual(lbType.name, "lb11");
      assert.strictEqual(lbType.max_connections, 10000);
    });
  });

  describe("list", () => {
    it("lists all load balancer types", async () => {
      const response = {
        load_balancer_types: [mockLoadBalancerType],
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

      const result = await loadBalancerTypes.list();

      assert.strictEqual(result.load_balancer_types.length, 1);
      assert.strictEqual(result.load_balancer_types[0].name, "lb11");
    });
  });

  describe("getByName", () => {
    it("finds load balancer type by name", async () => {
      const response = {
        load_balancer_types: [mockLoadBalancerType],
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

      const lbType = await loadBalancerTypes.getByName("lb11");

      assert.strictEqual(lbType?.id, 1);
    });
  });
});

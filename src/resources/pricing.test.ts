import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { PricingApi, type Pricing } from "./pricing.ts";

describe("PricingApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let pricing: PricingApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockPricing: Pricing = {
    currency: "EUR",
    vat_rate: "19.00000000",
    image: {
      price_per_gb_month: {
        net: "0.0000000000",
        gross: "0.0000000000",
      },
    },
    floating_ip: {
      price_monthly: {
        net: "4.0000000000",
        gross: "4.7600000000",
      },
    },
    floating_ips: [
      {
        type: "ipv4",
        prices: [
          {
            location: "fsn1",
            price_monthly: {
              net: "4.0000000000",
              gross: "4.7600000000",
            },
          },
        ],
      },
    ],
    primary_ips: [
      {
        type: "ipv4",
        prices: [
          {
            location: "fsn1",
            price_hourly: {
              net: "0.0055000000",
              gross: "0.0065450000",
            },
            price_monthly: {
              net: "4.0000000000",
              gross: "4.7600000000",
            },
          },
        ],
      },
    ],
    traffic: {
      price_per_tb: {
        net: "1.0000000000",
        gross: "1.1900000000",
      },
    },
    server_backup: {
      percentage: "20.00000000",
    },
    server_types: [
      {
        id: 1,
        name: "cx11",
        prices: [
          {
            location: "fsn1",
            price_hourly: {
              net: "0.0050000000",
              gross: "0.0059500000",
            },
            price_monthly: {
              net: "2.9600000000",
              gross: "3.5224000000",
            },
          },
        ],
      },
    ],
    load_balancer_types: [
      {
        id: 1,
        name: "lb11",
        prices: [
          {
            location: "fsn1",
            price_hourly: {
              net: "0.0060000000",
              gross: "0.0071400000",
            },
            price_monthly: {
              net: "4.0000000000",
              gross: "4.7600000000",
            },
          },
        ],
      },
    ],
    volume: {
      price_per_gb_month_by_location: [
        {
          location: "fsn1",
          price_per_gb_month: {
            net: "0.0440000000",
            gross: "0.0523600000",
          },
        },
      ],
    },
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    pricing = new PricingApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves all pricing information", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.currency, "EUR");
      assert.strictEqual(result.vat_rate, "19.00000000");
    });

    it("includes server type pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.server_types.length, 1);
      assert.strictEqual(result.server_types[0].name, "cx11");
      assert.strictEqual(result.server_types[0].prices[0].location, "fsn1");
    });

    it("includes load balancer type pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.load_balancer_types.length, 1);
      assert.strictEqual(result.load_balancer_types[0].name, "lb11");
    });

    it("includes volume pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.volume.price_per_gb_month_by_location.length, 1);
      assert.strictEqual(result.volume.price_per_gb_month_by_location[0].location, "fsn1");
    });

    it("includes floating IP pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.floating_ips.length, 1);
      assert.strictEqual(result.floating_ips[0].type, "ipv4");
    });

    it("includes primary IP pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.primary_ips.length, 1);
      assert.strictEqual(result.primary_ips[0].type, "ipv4");
    });

    it("includes traffic pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.ok(result.traffic.price_per_tb);
      assert.strictEqual(result.traffic.price_per_tb.net, "1.0000000000");
    });

    it("includes image pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.ok(result.image.price_per_gb_month);
    });

    it("includes server backup pricing", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ pricing: mockPricing }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await pricing.get();

      assert.strictEqual(result.server_backup.percentage, "20.00000000");
    });
  });
});

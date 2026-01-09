import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerDnsClient, HetznerDnsError, DnsRateLimitError } from "./client.ts";

describe("HetznerDnsClient", () => {
  const mockToken = "test-dns-api-token";
  let client: HetznerDnsClient;
  let fetchMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    client = new HetznerDnsClient(mockToken);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("constructor", () => {
    it("uses default DNS API base URL", () => {
      assert.strictEqual(client.baseUrl, "https://dns.hetzner.com/api/v1");
    });

    it("allows custom base URL", () => {
      const customClient = new HetznerDnsClient(mockToken, {
        baseUrl: "https://custom.dns.api/v1",
      });
      assert.strictEqual(customClient.baseUrl, "https://custom.dns.api/v1");
    });
  });

  describe("get", () => {
    it("makes GET request with Auth-API-Token header", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zones: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/zones");

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      assert.strictEqual(url, "https://dns.hetzner.com/api/v1/zones");
      assert.strictEqual(options.method, "GET");
      assert.strictEqual(headers["Auth-API-Token"], mockToken);
    });

    it("includes query parameters in URL", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zones: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/zones", { name: "example.com", page: 1 });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("name=example.com"));
      assert.ok(url.includes("page=1"));
    });

    it("handles undefined query parameters", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zones: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/zones", { name: "example.com", page: undefined });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("name=example.com"));
      assert.ok(!url.includes("page="));
    });

    it("handles array query parameters", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ records: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/records", { type: ["A", "AAAA"] });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("type=A"));
      assert.ok(url.includes("type=AAAA"));
    });
  });

  describe("post", () => {
    it("makes POST request with JSON body", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zone: { id: "1" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.post("/zones", { name: "example.com" });

      const call = fetchMock.mock.calls[0];
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      assert.strictEqual(options.method, "POST");
      assert.strictEqual(headers["Content-Type"], "application/json");
      assert.strictEqual(options.body, JSON.stringify({ name: "example.com" }));
    });
  });

  describe("put", () => {
    it("makes PUT request with JSON body", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ zone: { id: "1" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.put("/zones/1", { name: "updated.com" });

      const call = fetchMock.mock.calls[0];
      const options = call?.arguments[1] as RequestInit;
      assert.strictEqual(options.method, "PUT");
    });
  });

  describe("delete", () => {
    it("makes DELETE request", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 200 })));

      await client.delete("/zones/1");

      const call = fetchMock.mock.calls[0];
      const options = call?.arguments[1] as RequestInit;
      assert.strictEqual(options.method, "DELETE");
    });

    it("returns undefined for empty response", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response("", { status: 200 })));

      const result = await client.delete("/zones/1");

      assert.strictEqual(result, undefined);
    });
  });

  describe("error handling", () => {
    it("throws HetznerDnsError on API error", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: { message: "Zone not found", code: 404 },
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      await assert.rejects(
        async () => client.get("/zones/invalid"),
        (error) => {
          assert.ok(error instanceof HetznerDnsError);
          assert.strictEqual(error.message, "Zone not found");
          assert.strictEqual(error.code, 404);
          assert.strictEqual(error.statusCode, 404);
          return true;
        }
      );
    });

    it("throws DnsRateLimitError with retryAfter on 429", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: { message: "Rate limit exceeded", code: 429 },
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "60",
              },
            }
          )
        )
      );

      await assert.rejects(
        async () => client.get("/zones"),
        (error) => {
          assert.ok(error instanceof DnsRateLimitError);
          assert.strictEqual(error.statusCode, 429);
          assert.strictEqual(error.retryAfter, 60);
          return true;
        }
      );
    });

    it("handles error response with message field", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "Bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        async () => client.post("/zones", {}),
        (error) => {
          assert.ok(error instanceof HetznerDnsError);
          assert.strictEqual(error.message, "Bad request");
          return true;
        }
      );
    });

    it("handles malformed JSON error response", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response("Not valid JSON", {
            status: 500,
            statusText: "Internal Server Error",
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        async () => client.get("/zones"),
        (error) => {
          assert.ok(error instanceof HetznerDnsError);
          assert.strictEqual(error.statusCode, 500);
          assert.ok(error.message.includes("HTTP 500"));
          return true;
        }
      );
    });
  });
});

import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient, HetznerError, RateLimitError } from "./client.ts";

describe("HetznerClient", () => {
  const mockToken = "test-api-token";

  describe("constructor", () => {
    it("creates client with token", () => {
      const client = new HetznerClient(mockToken);
      assert.ok(client);
    });

    it("uses default base URL", () => {
      const client = new HetznerClient(mockToken);
      assert.strictEqual(client.baseUrl, "https://api.hetzner.cloud/v1");
    });

    it("allows custom base URL", () => {
      const client = new HetznerClient(mockToken, {
        baseUrl: "https://custom.api.com",
      });
      assert.strictEqual(client.baseUrl, "https://custom.api.com");
    });
  });

  describe("request methods", () => {
    let client: HetznerClient;
    let fetchMock: ReturnType<typeof mock.fn>;

    beforeEach(() => {
      client = new HetznerClient(mockToken);
      fetchMock = mock.fn();
      mock.method(globalThis, "fetch", fetchMock);
    });

    it("sends GET request with auth header", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/servers");

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      assert.strictEqual(url, "https://api.hetzner.cloud/v1/servers");
      assert.strictEqual(options.method, "GET");
      assert.strictEqual(headers["Authorization"], `Bearer ${mockToken}`);
    });

    it("sends POST request with JSON body", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ server: { id: 1 } }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const body = { name: "my-server", server_type: "cx11" };
      await client.post("/servers", body);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;
      assert.strictEqual(options.method, "POST");
      assert.strictEqual(headers["Content-Type"], "application/json");
      assert.strictEqual(options.body, JSON.stringify(body));
    });

    it("sends PUT request with JSON body", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ server: { id: 1 } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const body = { name: "updated-server" };
      await client.put("/servers/1", body);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const [, options] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(options.method, "PUT");
    });

    it("sends DELETE request", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await client.delete("/servers/1");

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const [, options] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(options.method, "DELETE");
    });

    it("parses JSON response", async () => {
      const responseData = { servers: [{ id: 1, name: "test" }] };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await client.get<{ servers: { id: number; name: string }[] }>("/servers");

      assert.deepStrictEqual(result, responseData);
    });

    it("returns undefined for 204 No Content", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      const result = await client.delete("/servers/1");

      assert.strictEqual(result, undefined);
    });
  });

  describe("error handling", () => {
    let client: HetznerClient;
    let fetchMock: ReturnType<typeof mock.fn>;

    beforeEach(() => {
      client = new HetznerClient(mockToken);
      fetchMock = mock.fn();
      mock.method(globalThis, "fetch", fetchMock);
    });

    it("throws HetznerError on API error response", async () => {
      const errorResponse = {
        error: {
          code: "uniqueness_error",
          message: "server name is already used",
        },
      };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        () => client.post("/servers", { name: "duplicate" }),
        (error: HetznerError) => {
          assert.ok(error instanceof HetznerError);
          assert.strictEqual(error.code, "uniqueness_error");
          assert.strictEqual(error.message, "server name is already used");
          assert.strictEqual(error.statusCode, 409);
          return true;
        }
      );
    });

    it("throws HetznerError on unauthorized", async () => {
      const errorResponse = {
        error: {
          code: "unauthorized",
          message: "unable to authenticate",
        },
      };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        () => client.get("/servers"),
        (error: HetznerError) => {
          assert.ok(error instanceof HetznerError);
          assert.strictEqual(error.code, "unauthorized");
          assert.strictEqual(error.statusCode, 401);
          return true;
        }
      );
    });

    it("throws RateLimitError on 429", async () => {
      const errorResponse = {
        error: {
          code: "rate_limit_exceeded",
          message: "rate limit exceeded",
        },
      };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "30",
            },
          })
        )
      );

      await assert.rejects(
        () => client.get("/servers"),
        (error: RateLimitError) => {
          assert.ok(error instanceof RateLimitError);
          assert.strictEqual(error.retryAfter, 30);
          return true;
        }
      );
    });

    it("throws HetznerError on not found", async () => {
      const errorResponse = {
        error: {
          code: "not_found",
          message: "server not found",
        },
      };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        () => client.get("/servers/999"),
        (error: HetznerError) => {
          assert.ok(error instanceof HetznerError);
          assert.strictEqual(error.code, "not_found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        }
      );
    });
  });

  describe("query parameters", () => {
    let client: HetznerClient;
    let fetchMock: ReturnType<typeof mock.fn>;

    beforeEach(() => {
      client = new HetznerClient(mockToken);
      fetchMock = mock.fn();
      mock.method(globalThis, "fetch", fetchMock);
    });

    it("appends query parameters to URL", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/servers", { page: 1, per_page: 25 });

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(url, "https://api.hetzner.cloud/v1/servers?page=1&per_page=25");
    });

    it("handles array query parameters", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/servers", { status: ["running", "starting"] });

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(
        url,
        "https://api.hetzner.cloud/v1/servers?status=running&status=starting"
      );
    });
  });
});

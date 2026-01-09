import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { BaseHttpClient, type QueryParams } from "./base-client.ts";

// Concrete implementation for testing
class TestClient extends BaseHttpClient {
  public lastAuthHeaders: Record<string, string> | null = null;
  public errorToThrow: Error | null = null;

  constructor(token: string, baseUrl = "https://test.api.com") {
    super(token, baseUrl);
  }

  protected getAuthHeaders(): Record<string, string> {
    this.lastAuthHeaders = { "X-Test-Token": this.token };
    return this.lastAuthHeaders;
  }

  protected handleError(response: Response): Promise<never> {
    if (this.errorToThrow) {
      return Promise.reject(this.errorToThrow);
    }
    return Promise.reject(new Error(`HTTP ${String(response.status)}`));
  }
}

describe("BaseHttpClient", () => {
  let client: TestClient;
  let fetchMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    client = new TestClient("test-token");
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("constructor", () => {
    it("uses provided base URL", () => {
      const customClient = new TestClient("token", "https://custom.api.com");
      assert.strictEqual(customClient.baseUrl, "https://custom.api.com");
    });

    it("allows base URL override via options", () => {
      const customClient = new TestClient("token", "https://default.api.com");
      // BaseClientOptions allows baseUrl override - tested via HetznerClient
      assert.strictEqual(customClient.baseUrl, "https://default.api.com");
    });
  });

  describe("HTTP methods", () => {
    it("makes GET requests with auth headers", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/test");

      assert.strictEqual(fetchMock.mock.callCount(), 1);
      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;

      assert.strictEqual(url, "https://test.api.com/test");
      assert.strictEqual(options.method, "GET");
      assert.strictEqual(headers["X-Test-Token"], "test-token");
    });

    it("makes POST requests with JSON body", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ result: "ok" }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const body = { name: "test" };
      await client.post("/test", body);

      const call = fetchMock.mock.calls[0];
      const options = call?.arguments[1] as RequestInit;
      const headers = options.headers as Record<string, string>;

      assert.strictEqual(options.method, "POST");
      assert.strictEqual(headers["Content-Type"], "application/json");
      assert.strictEqual(options.body, JSON.stringify(body));
    });

    it("makes PUT requests", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.put("/test", { key: "value" });

      const [, options] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(options.method, "PUT");
    });

    it("makes DELETE requests", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      const result = await client.delete("/test");

      const [, options] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(options.method, "DELETE");
      assert.strictEqual(result, undefined);
    });
  });

  describe("query parameters", () => {
    it("appends query parameters to URL", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await client.get("/test", { page: 1, limit: 10 });

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(url, "https://test.api.com/test?page=1&limit=10");
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

      await client.get("/test", { ids: [1, 2, 3] });

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(url, "https://test.api.com/test?ids=1&ids=2&ids=3");
    });

    it("ignores undefined parameters", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const params: QueryParams = { page: 1, filter: undefined };
      await client.get("/test", params);

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.strictEqual(url, "https://test.api.com/test?page=1");
    });
  });

  describe("response handling", () => {
    it("returns undefined for 204 No Content", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      const result = await client.get("/test");

      assert.strictEqual(result, undefined);
    });

    it("parses JSON response", async () => {
      const responseData = { items: [1, 2, 3] };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(responseData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await client.get<{ items: number[] }>("/test");

      assert.deepStrictEqual(result, responseData);
    });
  });

  describe("error handling", () => {
    it("calls handleError for non-ok responses", async () => {
      client.errorToThrow = new Error("Custom error");
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: "test" }), { status: 404 }))
      );

      await assert.rejects(() => client.get("/test"), { message: "Custom error" });
    });
  });
});

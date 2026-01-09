import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "./client.ts";
import { paginate, type PaginatedData } from "./pagination.ts";

describe("Pagination", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let fetchMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("PaginatedResponse", () => {
    it("includes pagination metadata", () => {
      const response: PaginatedData<{ id: number }, "servers"> = {
        servers: [{ id: 1 }, { id: 2 }],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: 2,
            last_page: 4,
            total_entries: 100,
          },
        },
      };

      assert.strictEqual(response.meta.pagination.page, 1);
      assert.strictEqual(response.meta.pagination.total_entries, 100);
      assert.strictEqual(response.meta.pagination.next_page, 2);
    });
  });

  describe("paginate", () => {
    it("fetches all pages automatically", async () => {
      const page1 = {
        servers: [{ id: 1 }, { id: 2 }],
        meta: {
          pagination: {
            page: 1,
            per_page: 2,
            previous_page: null,
            next_page: 2,
            last_page: 2,
            total_entries: 4,
          },
        },
      };
      const page2 = {
        servers: [{ id: 3 }, { id: 4 }],
        meta: {
          pagination: {
            page: 2,
            per_page: 2,
            previous_page: 1,
            next_page: null,
            last_page: 2,
            total_entries: 4,
          },
        },
      };

      fetchMock.mock.mockImplementation((url: string) => {
        if (url.includes("page=2")) {
          return Promise.resolve(
            new Response(JSON.stringify(page2), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(page1), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      const items: { id: number }[] = [];
      for await (const server of paginate(client, "/servers", "servers")) {
        items.push(server);
      }

      assert.strictEqual(items.length, 4);
      assert.deepStrictEqual(items, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });

    it("handles single page response", async () => {
      const response = {
        servers: [{ id: 1 }],
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

      const items: { id: number }[] = [];
      for await (const server of paginate(client, "/servers", "servers")) {
        items.push(server);
      }

      assert.strictEqual(items.length, 1);
      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });

    it("passes query parameters to requests", async () => {
      const response = {
        servers: [{ id: 1 }],
        meta: {
          pagination: {
            page: 1,
            per_page: 10,
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

      const items: { id: number }[] = [];
      for await (const server of paginate(client, "/servers", "servers", {
        per_page: 10,
        status: "running",
      })) {
        items.push(server);
      }

      const [url] = fetchMock.mock.calls[0]?.arguments ?? [];
      assert.ok((url as string).includes("per_page=10"));
      assert.ok((url as string).includes("status=running"));
    });
  });

  describe("rate limiting with retry", () => {
    it("retries on rate limit with exponential backoff", async () => {
      const errorResponse = {
        error: {
          code: "rate_limit_exceeded",
          message: "rate limit exceeded",
        },
      };
      const successResponse = {
        servers: [{ id: 1 }],
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

      let callCount = 0;
      fetchMock.mock.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "0",
              },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(successResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      const items: { id: number }[] = [];
      for await (const server of paginate(client, "/servers", "servers")) {
        items.push(server);
      }

      assert.strictEqual(items.length, 1);
      assert.strictEqual(callCount, 2);
    });
  });
});

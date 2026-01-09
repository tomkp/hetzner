import { mock } from "node:test";
import { HetznerClient } from "./client.ts";

/** Mock token used for testing */
export const MOCK_TOKEN = "test-api-token";

/**
 * Creates a mock Response for testing API calls.
 * @param body - The response body (will be JSON stringified)
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 */
export function mockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Creates a mock paginated response.
 * @param key - The key for the items array (e.g., "servers")
 * @param items - The items to include
 * @param page - Current page number (default: 1)
 * @param totalEntries - Total entries (default: items.length)
 */
export function mockPaginatedResponse(
  key: string,
  items: unknown[],
  page = 1,
  totalEntries = items.length
): unknown {
  return {
    [key]: items,
    meta: {
      pagination: {
        page,
        per_page: 25,
        previous_page: page > 1 ? page - 1 : null,
        next_page: null,
        last_page: 1,
        total_entries: totalEntries,
      },
    },
  };
}

export type FetchMock = ReturnType<typeof mock.fn>;

export interface TestContext {
  client: HetznerClient;
  fetchMock: FetchMock;
}

/**
 * Sets up a mock client and fetch mock for testing.
 * Call this in beforeEach and use the returned objects.
 *
 * @example
 * ```typescript
 * let ctx: TestContext;
 *
 * beforeEach(() => {
 *   ctx = setupMockClient();
 * });
 *
 * it("does something", async () => {
 *   ctx.fetchMock.mock.mockImplementation(() =>
 *     Promise.resolve(mockResponse({ data: "test" }))
 *   );
 *   // use ctx.client
 * });
 * ```
 */
export function setupMockClient(): TestContext {
  const client = new HetznerClient(MOCK_TOKEN);
  const fetchMock: FetchMock = mock.fn();
  mock.method(globalThis, "fetch", fetchMock);
  return { client, fetchMock };
}

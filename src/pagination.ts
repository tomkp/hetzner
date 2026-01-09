import { HetznerClient, RateLimitError, type QueryParams } from "./client.ts";
import { calculateBackoff, delay } from "./utils.ts";

/**
 * Pagination metadata returned by the Hetzner API.
 */
export interface Pagination {
  /** Current page number */
  page: number;
  /** Number of items per page */
  per_page: number;
  /** Previous page number, or null if on first page */
  previous_page: number | null;
  /** Next page number, or null if on last page */
  next_page: number | null;
  /** Last page number */
  last_page: number;
  /** Total number of entries across all pages */
  total_entries: number;
}

/**
 * Base interface for paginated API responses.
 */
export interface PaginatedResponse {
  meta: {
    pagination: Pagination;
  };
}

/**
 * Generic type for paginated data with a dynamic key.
 */
export type PaginatedData<T, K extends string> = Record<K, T[]> & PaginatedResponse;

/**
 * Async generator that iterates through all pages of a paginated API endpoint.
 * Automatically handles pagination and rate limiting with exponential backoff.
 *
 * @param client - The Hetzner client instance
 * @param path - The API endpoint path (e.g., "/servers")
 * @param key - The key in the response containing the items array (e.g., "servers")
 * @param params - Optional query parameters
 * @yields Individual items from each page
 * @throws {HetznerError} When the API returns an error after retries are exhausted
 *
 * @example
 * ```typescript
 * for await (const server of paginate(client, "/servers", "servers")) {
 *   console.log(server.name);
 * }
 * ```
 */
export async function* paginate<T>(
  client: HetznerClient,
  path: string,
  key: string,
  params: QueryParams = {}
): AsyncGenerator<T, void, unknown> {
  let page = 1;
  let hasMore = true;
  let retryCount = 0;
  const maxRetries = 3;

  while (hasMore) {
    try {
      const response = await client.get<PaginatedData<T, string>>(path, {
        ...params,
        page,
      });

      const items = response[key];
      if (items) {
        for (const item of items) {
          yield item;
        }
      }

      const pagination = response.meta.pagination;
      hasMore = pagination.next_page !== null;
      page = pagination.next_page ?? page + 1;
      retryCount = 0;
    } catch (error) {
      if (error instanceof RateLimitError && retryCount < maxRetries) {
        retryCount++;
        await delay(calculateBackoff(error.retryAfter, retryCount));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Fetches all items from a paginated API endpoint and returns them as an array.
 * This is a convenience wrapper around `paginate` for when you need all items at once.
 *
 * @param client - The Hetzner client instance
 * @param path - The API endpoint path (e.g., "/servers")
 * @param key - The key in the response containing the items array (e.g., "servers")
 * @param params - Optional query parameters
 * @returns Promise resolving to an array of all items
 * @throws {HetznerError} When the API returns an error
 *
 * @example
 * ```typescript
 * const allServers = await fetchAllPages(client, "/servers", "servers");
 * ```
 */
export async function fetchAllPages<T>(
  client: HetznerClient,
  path: string,
  key: string,
  params: QueryParams = {}
): Promise<T[]> {
  const items: T[] = [];
  for await (const item of paginate<T>(client, path, key, params)) {
    items.push(item);
  }
  return items;
}

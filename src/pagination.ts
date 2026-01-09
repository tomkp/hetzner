import { HetznerClient, RateLimitError, type QueryParams } from "./client.ts";

export interface Pagination {
  page: number;
  per_page: number;
  previous_page: number | null;
  next_page: number | null;
  last_page: number;
  total_entries: number;
}

export interface PaginatedResponse {
  meta: {
    pagination: Pagination;
  };
}

export type PaginatedData<T, K extends string> = Record<K, T[]> & PaginatedResponse;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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
        const backoffMs = Math.max(error.retryAfter * 1000, 100 * Math.pow(2, retryCount));
        await delay(backoffMs);
        continue;
      }
      throw error;
    }
  }
}

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

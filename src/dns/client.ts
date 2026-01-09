/**
 * Configuration options for the Hetzner DNS client.
 */
export interface HetznerDnsClientOptions {
  /** Base URL for the Hetzner DNS API. Defaults to https://dns.hetzner.com/api/v1 */
  baseUrl?: string;
}

export interface DnsErrorResponse {
  error?: {
    message: string;
    code: number;
  };
  message?: string;
}

/**
 * Error thrown when the Hetzner DNS API returns an error response.
 */
export class HetznerDnsError extends Error {
  /** The error code from the API response */
  readonly code: number;
  /** The HTTP status code of the response */
  readonly statusCode: number;

  constructor(message: string, code: number, statusCode: number) {
    super(message);
    this.name = "HetznerDnsError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when the DNS API rate limit is exceeded.
 * Contains information about when the request can be retried.
 */
export class DnsRateLimitError extends HetznerDnsError {
  /** Number of seconds to wait before retrying the request */
  readonly retryAfter: number;

  constructor(message: string, code: number, retryAfter: number) {
    super(message, code, 429);
    this.name = "DnsRateLimitError";
    this.retryAfter = retryAfter;
  }
}

type QueryValue = string | number | boolean | string[] | number[];
/** Query parameters for DNS API requests */
export type DnsQueryParams = Record<string, QueryValue | undefined>;

/**
 * HTTP client for communicating with the Hetzner DNS API.
 *
 * Note: The DNS API uses different authentication than the Cloud API.
 * It requires an 'Auth-API-Token' header instead of 'Bearer' token.
 *
 * @example
 * ```typescript
 * const client = new HetznerDnsClient("your-dns-api-token");
 * const zones = await client.get("/zones");
 * ```
 */
export class HetznerDnsClient {
  /** The base URL for DNS API requests */
  public readonly baseUrl: string;
  private readonly token: string;

  /**
   * Creates a new Hetzner DNS client.
   * @param token - Your Hetzner DNS API token (not the Cloud API token)
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerDnsClientOptions = {}) {
    this.token = token;
    this.baseUrl = options.baseUrl ?? "https://dns.hetzner.com/api/v1";
  }

  /**
   * Performs a GET request to the DNS API.
   * @param path - The API endpoint path (e.g., "/zones")
   * @param params - Optional query parameters
   * @returns The parsed JSON response
   * @throws {HetznerDnsError} When the API returns an error
   * @throws {DnsRateLimitError} When the rate limit is exceeded
   */
  async get<T>(path: string, params?: DnsQueryParams): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  /**
   * Performs a POST request to the DNS API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   * @throws {HetznerDnsError} When the API returns an error
   * @throws {DnsRateLimitError} When the rate limit is exceeded
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * Performs a PUT request to the DNS API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   * @throws {HetznerDnsError} When the API returns an error
   * @throws {DnsRateLimitError} When the rate limit is exceeded
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  /**
   * Performs a DELETE request to the DNS API.
   * @param path - The API endpoint path
   * @returns The parsed JSON response, or undefined for empty responses
   * @throws {HetznerDnsError} When the API returns an error
   * @throws {DnsRateLimitError} When the rate limit is exceeded
   */
  async delete<T>(path: string): Promise<T | undefined> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: DnsQueryParams
  ): Promise<T> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      "Auth-API-Token": this.token,
    };

    const init: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      await this.handleError(response);
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  private buildUrl(path: string, params?: DnsQueryParams): string {
    const fullPath = this.baseUrl + path;
    const url = new URL(fullPath);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(key, String(item));
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async handleError(response: Response): Promise<never> {
    let errorMessage = `HTTP ${String(response.status)}: ${response.statusText}`;
    let errorCode = 0;

    try {
      const errorData = (await response.json()) as DnsErrorResponse;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
        errorCode = errorData.error.code;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "0", 10);
      throw new DnsRateLimitError(errorMessage, errorCode, retryAfter);
    }

    throw new HetznerDnsError(errorMessage, errorCode, response.status);
  }
}

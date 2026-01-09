/**
 * Configuration options for the Hetzner client.
 */
export interface HetznerClientOptions {
  /** Base URL for the Hetzner Cloud API. Defaults to https://api.hetzner.cloud/v1 */
  baseUrl?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Error thrown when the Hetzner API returns an error response.
 */
export class HetznerError extends Error {
  /** The error code returned by the API (e.g., "not_found", "uniqueness_error") */
  readonly code: string;
  /** The HTTP status code of the response */
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "HetznerError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when the API rate limit is exceeded.
 * Contains information about when the request can be retried.
 */
export class RateLimitError extends HetznerError {
  /** Number of seconds to wait before retrying the request */
  readonly retryAfter: number;

  constructor(message: string, code: string, retryAfter: number) {
    super(message, code, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

type QueryValue = string | number | boolean | string[] | number[];
/** Query parameters for API requests */
export type QueryParams = Record<string, QueryValue | undefined>;

/**
 * HTTP client for communicating with the Hetzner Cloud API.
 *
 * @example
 * ```typescript
 * const client = new HetznerClient("your-api-token");
 * const servers = await client.get("/servers");
 * ```
 */
export class HetznerClient {
  /** The base URL for API requests */
  public readonly baseUrl: string;
  private readonly token: string;

  /**
   * Creates a new Hetzner client.
   * @param token - Your Hetzner Cloud API token
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerClientOptions = {}) {
    this.token = token;
    this.baseUrl = options.baseUrl ?? "https://api.hetzner.cloud/v1";
  }

  /**
   * Performs a GET request to the API.
   * @param path - The API endpoint path (e.g., "/servers")
   * @param params - Optional query parameters
   * @returns The parsed JSON response
   * @throws {HetznerError} When the API returns an error
   * @throws {RateLimitError} When the rate limit is exceeded
   */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  /**
   * Performs a POST request to the API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   * @throws {HetznerError} When the API returns an error
   * @throws {RateLimitError} When the rate limit is exceeded
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * Performs a PUT request to the API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   * @throws {HetznerError} When the API returns an error
   * @throws {RateLimitError} When the rate limit is exceeded
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  /**
   * Performs a DELETE request to the API.
   * @param path - The API endpoint path
   * @returns The parsed JSON response, or undefined for 204 responses
   * @throws {HetznerError} When the API returns an error
   * @throws {RateLimitError} When the rate limit is exceeded
   */
  async delete<T>(path: string): Promise<T | undefined> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: QueryParams
  ): Promise<T> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
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

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private buildUrl(path: string, params?: QueryParams): string {
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
    let errorData: ErrorResponse;

    try {
      errorData = (await response.json()) as ErrorResponse;
    } catch {
      throw new HetznerError(
        `HTTP ${String(response.status)}: ${response.statusText}`,
        "unknown",
        response.status
      );
    }

    const { code, message } = errorData.error;

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "0", 10);
      throw new RateLimitError(message, code, retryAfter);
    }

    throw new HetznerError(message, code, response.status);
  }
}

import { BaseHttpClient, type BaseClientOptions, type QueryParams } from "../base-client.ts";

/**
 * Configuration options for the Hetzner DNS client.
 */
export interface HetznerDnsClientOptions extends BaseClientOptions {
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

/** Query parameters for DNS API requests */
export type DnsQueryParams = QueryParams;

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
export class HetznerDnsClient extends BaseHttpClient {
  /**
   * Creates a new Hetzner DNS client.
   * @param token - Your Hetzner DNS API token (not the Cloud API token)
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerDnsClientOptions = {}) {
    super(token, "https://dns.hetzner.com/api/v1", options);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      "Auth-API-Token": this.token,
    };
  }

  protected async parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  protected async handleError(response: Response): Promise<never> {
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

import { BaseHttpClient, type BaseClientOptions, type QueryParams } from "./base-client.ts";

/**
 * Configuration options for the Hetzner client.
 */
export interface HetznerClientOptions extends BaseClientOptions {
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

export type { QueryParams };

/**
 * HTTP client for communicating with the Hetzner Cloud API.
 *
 * @example
 * ```typescript
 * const client = new HetznerClient("your-api-token");
 * const servers = await client.get("/servers");
 * ```
 */
export class HetznerClient extends BaseHttpClient {
  /**
   * Creates a new Hetzner client.
   * @param token - Your Hetzner Cloud API token
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerClientOptions = {}) {
    super(token, "https://api.hetzner.cloud/v1", options);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  protected async handleError(response: Response): Promise<never> {
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

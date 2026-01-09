type QueryValue = string | number | boolean | string[] | number[];

/**
 * Query parameters for API requests.
 */
export type QueryParams = Record<string, QueryValue | undefined>;

/**
 * Configuration options for HTTP clients.
 */
export interface BaseClientOptions {
  /** Base URL for the API */
  baseUrl?: string;
}

/**
 * Abstract base class for HTTP clients.
 * Provides common HTTP functionality with customizable authentication and error handling.
 */
export abstract class BaseHttpClient {
  /** The base URL for API requests */
  public readonly baseUrl: string;
  protected readonly token: string;

  /**
   * Creates a new HTTP client.
   * @param token - API token for authentication
   * @param defaultBaseUrl - Default base URL if not provided in options
   * @param options - Optional configuration options
   */
  constructor(token: string, defaultBaseUrl: string, options: BaseClientOptions = {}) {
    this.token = token;
    this.baseUrl = options.baseUrl ?? defaultBaseUrl;
  }

  /**
   * Returns the authentication headers for this client.
   * Must be implemented by subclasses.
   */
  protected abstract getAuthHeaders(): Record<string, string>;

  /**
   * Handles error responses from the API.
   * Must be implemented by subclasses.
   */
  protected abstract handleError(response: Response): Promise<never>;

  /**
   * Parses a successful response.
   * Can be overridden by subclasses for custom parsing behavior.
   */
  protected async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  /**
   * Performs a GET request to the API.
   * @param path - The API endpoint path
   * @param params - Optional query parameters
   * @returns The parsed JSON response
   */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  /**
   * Performs a POST request to the API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * Performs a PUT request to the API.
   * @param path - The API endpoint path
   * @param body - Optional request body (will be JSON-encoded)
   * @returns The parsed JSON response
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  /**
   * Performs a DELETE request to the API.
   * @param path - The API endpoint path
   * @returns The parsed JSON response, or undefined for empty responses
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
      ...this.getAuthHeaders(),
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

    return this.parseResponse<T>(response);
  }

  /**
   * Builds a URL with query parameters.
   * @param path - The API endpoint path
   * @param params - Optional query parameters
   * @returns The full URL string
   */
  protected buildUrl(path: string, params?: QueryParams): string {
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
}

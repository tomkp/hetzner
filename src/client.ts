export interface HetznerClientOptions {
  baseUrl?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export class HetznerError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "HetznerError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class RateLimitError extends HetznerError {
  readonly retryAfter: number;

  constructor(message: string, code: string, retryAfter: number) {
    super(message, code, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

type QueryValue = string | number | boolean | string[] | number[];
export type QueryParams = Record<string, QueryValue | undefined>;

export class HetznerClient {
  public readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, options: HetznerClientOptions = {}) {
    this.token = token;
    this.baseUrl = options.baseUrl ?? "https://api.hetzner.cloud/v1";
  }

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

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

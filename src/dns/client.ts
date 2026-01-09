export interface HetznerDnsClientOptions {
  baseUrl?: string;
}

export interface DnsErrorResponse {
  error?: {
    message: string;
    code: number;
  };
  message?: string;
}

export class HetznerDnsError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "HetznerDnsError";
    this.statusCode = statusCode;
  }
}

type QueryValue = string | number | boolean | string[] | number[];
export type DnsQueryParams = Record<string, QueryValue | undefined>;

export class HetznerDnsClient {
  public readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, options: HetznerDnsClientOptions = {}) {
    this.token = token;
    this.baseUrl = options.baseUrl ?? "https://dns.hetzner.com/api/v1";
  }

  async get<T>(path: string, params?: DnsQueryParams): Promise<T> {
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

    if (response.status === 200 && response.headers.get("Content-Length") === "0") {
      return undefined as T;
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

    try {
      const errorData = (await response.json()) as DnsErrorResponse;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }

    throw new HetznerDnsError(errorMessage, response.status);
  }
}

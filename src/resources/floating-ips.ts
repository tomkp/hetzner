import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";
import { type Location } from "./locations.ts";

export type FloatingIPType = "ipv4" | "ipv6";

export interface FloatingIP {
  id: number;
  name: string;
  description: string;
  ip: string;
  type: FloatingIPType;
  server: number | null;
  dns_ptr: { ip: string; dns_ptr: string }[];
  home_location: Location;
  blocked: boolean;
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

export interface FloatingIPsListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  sort?: string;
}

export interface FloatingIPsListResponse extends PaginatedResponse {
  floating_ips: FloatingIP[];
}

export interface FloatingIPCreateParams {
  name?: string;
  description?: string;
  type: FloatingIPType;
  server?: number;
  home_location?: string;
  labels?: Record<string, string>;
}

export interface FloatingIPUpdateParams {
  name?: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface FloatingIPActionResponse {
  action: Action;
}

export class FloatingIPsApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<FloatingIP> {
    const response = await this.client.get<{ floating_ip: FloatingIP }>(
      `/floating_ips/${String(id)}`
    );
    return response.floating_ip;
  }

  async list(params: FloatingIPsListParams = {}): Promise<FloatingIPsListResponse> {
    return this.client.get<FloatingIPsListResponse>("/floating_ips", params);
  }

  async create(params: FloatingIPCreateParams): Promise<FloatingIP> {
    const response = await this.client.post<{ floating_ip: FloatingIP }>("/floating_ips", params);
    return response.floating_ip;
  }

  async update(id: number, params: FloatingIPUpdateParams): Promise<FloatingIP> {
    const response = await this.client.put<{ floating_ip: FloatingIP }>(
      `/floating_ips/${String(id)}`,
      params
    );
    return response.floating_ip;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/floating_ips/${String(id)}`);
  }

  async getByName(name: string): Promise<FloatingIP | undefined> {
    const response = await this.list({ name });
    return response.floating_ips[0];
  }

  // Floating IP Actions
  async assign(id: number, server: number): Promise<Action> {
    const response = await this.client.post<FloatingIPActionResponse>(
      `/floating_ips/${String(id)}/actions/assign`,
      { server }
    );
    return response.action;
  }

  async unassign(id: number): Promise<Action> {
    const response = await this.client.post<FloatingIPActionResponse>(
      `/floating_ips/${String(id)}/actions/unassign`
    );
    return response.action;
  }

  async changeDnsPtr(id: number, ip: string, dnsPtr: string | null): Promise<Action> {
    const response = await this.client.post<FloatingIPActionResponse>(
      `/floating_ips/${String(id)}/actions/change_dns_ptr`,
      { ip, dns_ptr: dnsPtr }
    );
    return response.action;
  }

  async changeProtection(id: number, protection: { delete?: boolean }): Promise<Action> {
    const response = await this.client.post<FloatingIPActionResponse>(
      `/floating_ips/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }
}

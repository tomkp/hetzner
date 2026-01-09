import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";
import { type Datacenter } from "./datacenters.ts";

export type PrimaryIPType = "ipv4" | "ipv6";
export type PrimaryIPAssigneeType = "server";

export interface PrimaryIP {
  id: number;
  name: string;
  ip: string;
  type: PrimaryIPType;
  datacenter: Datacenter;
  blocked: boolean;
  dns_ptr: { ip: string; dns_ptr: string }[];
  assignee_id: number | null;
  assignee_type: PrimaryIPAssigneeType;
  auto_delete: boolean;
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

export interface PrimaryIPsListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  ip?: string;
  sort?: string;
}

export interface PrimaryIPsListResponse extends PaginatedResponse {
  primary_ips: PrimaryIP[];
}

export interface PrimaryIPCreateParams {
  name: string;
  type: PrimaryIPType;
  assignee_type: PrimaryIPAssigneeType;
  assignee_id?: number;
  datacenter?: string;
  auto_delete?: boolean;
  labels?: Record<string, string>;
}

export interface PrimaryIPCreateResponse {
  primary_ip: PrimaryIP;
  action?: Action;
}

export interface PrimaryIPUpdateParams {
  name?: string;
  auto_delete?: boolean;
  labels?: Record<string, string>;
}

export interface PrimaryIPActionResponse {
  action: Action;
}

export class PrimaryIPsApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<PrimaryIP> {
    const response = await this.client.get<{ primary_ip: PrimaryIP }>(`/primary_ips/${String(id)}`);
    return response.primary_ip;
  }

  async list(params: PrimaryIPsListParams = {}): Promise<PrimaryIPsListResponse> {
    return this.client.get<PrimaryIPsListResponse>("/primary_ips", params);
  }

  async create(params: PrimaryIPCreateParams): Promise<PrimaryIPCreateResponse> {
    return this.client.post<PrimaryIPCreateResponse>("/primary_ips", params);
  }

  async update(id: number, params: PrimaryIPUpdateParams): Promise<PrimaryIP> {
    const response = await this.client.put<{ primary_ip: PrimaryIP }>(
      `/primary_ips/${String(id)}`,
      params
    );
    return response.primary_ip;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/primary_ips/${String(id)}`);
  }

  async getByName(name: string): Promise<PrimaryIP | undefined> {
    const response = await this.list({ name });
    return response.primary_ips[0];
  }

  // Primary IP Actions
  async assign(
    id: number,
    assigneeId: number,
    assigneeType: PrimaryIPAssigneeType
  ): Promise<Action> {
    const response = await this.client.post<PrimaryIPActionResponse>(
      `/primary_ips/${String(id)}/actions/assign`,
      { assignee_id: assigneeId, assignee_type: assigneeType }
    );
    return response.action;
  }

  async unassign(id: number): Promise<Action> {
    const response = await this.client.post<PrimaryIPActionResponse>(
      `/primary_ips/${String(id)}/actions/unassign`
    );
    return response.action;
  }

  async changeDnsPtr(id: number, ip: string, dnsPtr: string | null): Promise<Action> {
    const response = await this.client.post<PrimaryIPActionResponse>(
      `/primary_ips/${String(id)}/actions/change_dns_ptr`,
      { ip, dns_ptr: dnsPtr }
    );
    return response.action;
  }

  async changeProtection(id: number, protection: { delete?: boolean }): Promise<Action> {
    const response = await this.client.post<PrimaryIPActionResponse>(
      `/primary_ips/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }
}

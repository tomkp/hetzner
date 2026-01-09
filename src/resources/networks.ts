import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";

export type SubnetType = "cloud" | "server" | "vswitch";

export interface Subnet {
  type: SubnetType;
  ip_range: string;
  network_zone: string;
  gateway: string;
  vswitch_id?: number;
}

export interface Route {
  destination: string;
  gateway: string;
}

export interface Network {
  id: number;
  name: string;
  ip_range: string;
  subnets: Subnet[];
  routes: Route[];
  servers: number[];
  load_balancers: number[];
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
  expose_routes_to_vswitch: boolean;
}

export interface NetworksListParams extends QueryParams {
  name?: string;
  label_selector?: string;
}

export interface NetworksListResponse extends PaginatedResponse {
  networks: Network[];
}

export interface NetworkCreateParams {
  name: string;
  ip_range: string;
  subnets?: {
    type: SubnetType;
    ip_range?: string;
    network_zone: string;
    vswitch_id?: number;
  }[];
  routes?: Route[];
  labels?: Record<string, string>;
  expose_routes_to_vswitch?: boolean;
}

export interface NetworkUpdateParams {
  name?: string;
  labels?: Record<string, string>;
  expose_routes_to_vswitch?: boolean;
}

export interface NetworkActionResponse {
  action: Action;
}

export interface SubnetParams {
  type: SubnetType;
  ip_range?: string;
  network_zone: string;
  vswitch_id?: number;
}

export class NetworksApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<Network> {
    const response = await this.client.get<{ network: Network }>(`/networks/${String(id)}`);
    return response.network;
  }

  async list(params: NetworksListParams = {}): Promise<NetworksListResponse> {
    return this.client.get<NetworksListResponse>("/networks", params);
  }

  async create(params: NetworkCreateParams): Promise<Network> {
    const response = await this.client.post<{ network: Network }>("/networks", params);
    return response.network;
  }

  async update(id: number, params: NetworkUpdateParams): Promise<Network> {
    const response = await this.client.put<{ network: Network }>(`/networks/${String(id)}`, params);
    return response.network;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/networks/${String(id)}`);
  }

  async getByName(name: string): Promise<Network | undefined> {
    const response = await this.list({ name });
    return response.networks[0];
  }

  // Network Actions
  async addSubnet(id: number, params: SubnetParams): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/add_subnet`,
      params
    );
    return response.action;
  }

  async deleteSubnet(id: number, ipRange: string): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/delete_subnet`,
      { ip_range: ipRange }
    );
    return response.action;
  }

  async addRoute(id: number, destination: string, gateway: string): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/add_route`,
      { destination, gateway }
    );
    return response.action;
  }

  async deleteRoute(id: number, destination: string, gateway: string): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/delete_route`,
      { destination, gateway }
    );
    return response.action;
  }

  async changeIpRange(id: number, ipRange: string): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/change_ip_range`,
      { ip_range: ipRange }
    );
    return response.action;
  }

  async changeProtection(id: number, protection: { delete?: boolean }): Promise<Action> {
    const response = await this.client.post<NetworkActionResponse>(
      `/networks/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }
}

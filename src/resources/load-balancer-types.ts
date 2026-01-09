import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export interface LoadBalancerTypePrice {
  location: string;
  price_hourly: { net: string; gross: string };
  price_monthly: { net: string; gross: string };
}

export interface LoadBalancerType {
  id: number;
  name: string;
  description: string;
  max_connections: number;
  max_services: number;
  max_targets: number;
  max_assigned_certificates: number;
  deprecated: string | null;
  prices: LoadBalancerTypePrice[];
}

export interface LoadBalancerTypesListParams extends QueryParams {
  name?: string;
}

export interface LoadBalancerTypesListResponse extends PaginatedResponse {
  load_balancer_types: LoadBalancerType[];
}

export class LoadBalancerTypesApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<LoadBalancerType> {
    const response = await this.client.get<{ load_balancer_type: LoadBalancerType }>(
      `/load_balancer_types/${String(id)}`
    );
    return response.load_balancer_type;
  }

  async list(params: LoadBalancerTypesListParams = {}): Promise<LoadBalancerTypesListResponse> {
    return this.client.get<LoadBalancerTypesListResponse>("/load_balancer_types", params);
  }

  async getByName(name: string): Promise<LoadBalancerType | undefined> {
    const response = await this.list({ name });
    return response.load_balancer_types[0];
  }
}

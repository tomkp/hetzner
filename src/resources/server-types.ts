import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export interface ServerTypePrice {
  location: string;
  price_hourly: { net: string; gross: string };
  price_monthly: { net: string; gross: string };
}

export interface ServerType {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
  deprecated: boolean;
  prices: ServerTypePrice[];
  storage_type: "local" | "network";
  cpu_type: "shared" | "dedicated";
  architecture: "x86" | "arm";
  included_traffic: number;
}

export interface ServerTypesListParams extends QueryParams {
  name?: string;
}

export interface ServerTypesListResponse extends PaginatedResponse {
  server_types: ServerType[];
}

export class ServerTypesApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<ServerType> {
    const response = await this.client.get<{ server_type: ServerType }>(
      `/server_types/${String(id)}`
    );
    return response.server_type;
  }

  async list(params: ServerTypesListParams = {}): Promise<ServerTypesListResponse> {
    return this.client.get<ServerTypesListResponse>("/server_types", params);
  }

  async getByName(name: string): Promise<ServerType | undefined> {
    const response = await this.list({ name });
    return response.server_types[0];
  }
}

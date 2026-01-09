import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Location } from "./locations.ts";

export interface Datacenter {
  id: number;
  name: string;
  description: string;
  location: Location;
  server_types: {
    supported: number[];
    available: number[];
    available_for_migration: number[];
  };
}

export interface DatacentersListParams extends QueryParams {
  name?: string;
  sort?: string;
}

export interface DatacentersListResponse extends PaginatedResponse {
  datacenters: Datacenter[];
  recommendation: number;
}

export class DatacentersApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Datacenter> {
    const response = await this.client.get<{ datacenter: Datacenter }>(
      `/datacenters/${String(id)}`
    );
    return response.datacenter;
  }

  async list(params: DatacentersListParams = {}): Promise<DatacentersListResponse> {
    return this.client.get<DatacentersListResponse>("/datacenters", params);
  }

  async getByName(name: string): Promise<Datacenter | undefined> {
    const response = await this.list({ name });
    return response.datacenters[0];
  }
}

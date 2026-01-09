import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export interface Location {
  id: number;
  name: string;
  description: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  network_zone: string;
}

export interface LocationsListParams extends QueryParams {
  name?: string;
  sort?: string;
}

export interface LocationsListResponse extends PaginatedResponse {
  locations: Location[];
}

export class LocationsApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Location> {
    const response = await this.client.get<{ location: Location }>(`/locations/${String(id)}`);
    return response.location;
  }

  async list(params: LocationsListParams = {}): Promise<LocationsListResponse> {
    return this.client.get<LocationsListResponse>("/locations", params);
  }

  async getByName(name: string): Promise<Location | undefined> {
    const response = await this.list({ name });
    return response.locations[0];
  }
}

import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export type PlacementGroupType = "spread";

export interface PlacementGroup {
  id: number;
  name: string;
  type: PlacementGroupType;
  servers: number[];
  labels: Record<string, string>;
  created: string;
}

export interface PlacementGroupsListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  type?: PlacementGroupType;
  sort?: string;
}

export interface PlacementGroupsListResponse extends PaginatedResponse {
  placement_groups: PlacementGroup[];
}

export interface PlacementGroupCreateParams {
  name: string;
  type: PlacementGroupType;
  labels?: Record<string, string>;
}

export interface PlacementGroupCreateResponse {
  placement_group: PlacementGroup;
}

export interface PlacementGroupUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export class PlacementGroupsApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<PlacementGroup> {
    const response = await this.client.get<{ placement_group: PlacementGroup }>(
      `/placement_groups/${String(id)}`
    );
    return response.placement_group;
  }

  async list(params: PlacementGroupsListParams = {}): Promise<PlacementGroupsListResponse> {
    return this.client.get<PlacementGroupsListResponse>("/placement_groups", params);
  }

  async create(params: PlacementGroupCreateParams): Promise<PlacementGroupCreateResponse> {
    return this.client.post<PlacementGroupCreateResponse>("/placement_groups", params);
  }

  async update(id: number, params: PlacementGroupUpdateParams): Promise<PlacementGroup> {
    const response = await this.client.put<{ placement_group: PlacementGroup }>(
      `/placement_groups/${String(id)}`,
      params
    );
    return response.placement_group;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/placement_groups/${String(id)}`);
  }

  async getByName(name: string): Promise<PlacementGroup | undefined> {
    const response = await this.list({ name });
    return response.placement_groups[0];
  }
}

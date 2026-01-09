import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";
import { type Location } from "./locations.ts";

export type VolumeStatus = "creating" | "available";

export interface Volume {
  id: number;
  name: string;
  server: number | null;
  location: Location;
  size: number;
  linux_device: string;
  protection: { delete: boolean };
  labels: Record<string, string>;
  status: VolumeStatus;
  created: string;
  format: string | null;
}

export interface VolumesListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  sort?: string;
  status?: VolumeStatus;
}

export interface VolumesListResponse extends PaginatedResponse {
  volumes: Volume[];
}

export interface VolumeCreateParams {
  name: string;
  size: number;
  server?: number;
  location?: string;
  automount?: boolean;
  format?: string;
  labels?: Record<string, string>;
}

export interface VolumeCreateResponse {
  volume: Volume;
  action: Action;
  next_actions: Action[];
}

export interface VolumeUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export interface VolumeActionResponse {
  action: Action;
}

export class VolumesApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Volume> {
    const response = await this.client.get<{ volume: Volume }>(`/volumes/${String(id)}`);
    return response.volume;
  }

  async list(params: VolumesListParams = {}): Promise<VolumesListResponse> {
    return this.client.get<VolumesListResponse>("/volumes", params);
  }

  async create(params: VolumeCreateParams): Promise<VolumeCreateResponse> {
    return this.client.post<VolumeCreateResponse>("/volumes", params);
  }

  async update(id: number, params: VolumeUpdateParams): Promise<Volume> {
    const response = await this.client.put<{ volume: Volume }>(`/volumes/${String(id)}`, params);
    return response.volume;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/volumes/${String(id)}`);
  }

  async getByName(name: string): Promise<Volume | undefined> {
    const response = await this.list({ name });
    return response.volumes[0];
  }

  // Volume Actions
  async attach(id: number, server: number, automount?: boolean): Promise<Action> {
    const body: { server: number; automount?: boolean } = { server };
    if (automount !== undefined) {
      body.automount = automount;
    }
    const response = await this.client.post<VolumeActionResponse>(
      `/volumes/${String(id)}/actions/attach`,
      body
    );
    return response.action;
  }

  async detach(id: number): Promise<Action> {
    const response = await this.client.post<VolumeActionResponse>(
      `/volumes/${String(id)}/actions/detach`
    );
    return response.action;
  }

  async resize(id: number, size: number): Promise<Action> {
    const response = await this.client.post<VolumeActionResponse>(
      `/volumes/${String(id)}/actions/resize`,
      { size }
    );
    return response.action;
  }

  async changeProtection(id: number, protection: { delete?: boolean }): Promise<Action> {
    const response = await this.client.post<VolumeActionResponse>(
      `/volumes/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }
}

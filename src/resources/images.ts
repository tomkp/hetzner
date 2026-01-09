import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export type ImageType = "snapshot" | "backup" | "system" | "app";
export type ImageStatus = "available" | "creating" | "unavailable";

export interface Image {
  id: number;
  type: ImageType;
  status: ImageStatus;
  name: string | null;
  description: string;
  image_size: number | null;
  disk_size: number;
  created: string;
  created_from: { id: number; name: string } | null;
  bound_to: number | null;
  os_flavor: string;
  os_version: string | null;
  rapid_deploy: boolean;
  protection: { delete: boolean };
  deprecated: string | null;
  labels: Record<string, string>;
  deleted: string | null;
  architecture: "x86" | "arm";
}

export interface ImagesListParams extends QueryParams {
  type?: ImageType;
  status?: ImageStatus;
  bound_to?: string;
  name?: string;
  label_selector?: string;
  sort?: string;
  architecture?: string;
  include_deprecated?: boolean;
}

export interface ImagesListResponse extends PaginatedResponse {
  images: Image[];
}

export interface ImageUpdateParams {
  description?: string;
  type?: "snapshot";
  labels?: Record<string, string>;
}

export class ImagesApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Image> {
    const response = await this.client.get<{ image: Image }>(`/images/${String(id)}`);
    return response.image;
  }

  async list(params: ImagesListParams = {}): Promise<ImagesListResponse> {
    return this.client.get<ImagesListResponse>("/images", params);
  }

  async update(id: number, params: ImageUpdateParams): Promise<Image> {
    const response = await this.client.put<{ image: Image }>(`/images/${String(id)}`, params);
    return response.image;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/images/${String(id)}`);
  }

  async getByName(name: string): Promise<Image | undefined> {
    const response = await this.list({ name });
    return response.images[0];
  }
}

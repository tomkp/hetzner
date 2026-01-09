import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export type IsoType = "public" | "private";

export interface Iso {
  id: number;
  name: string | null;
  description: string;
  type: IsoType;
  deprecated: string | null;
  architecture: "x86" | "arm" | null;
}

export interface IsosListParams extends QueryParams {
  name?: string;
  architecture?: string;
  include_architecture_wildcard?: boolean;
}

export interface IsosListResponse extends PaginatedResponse {
  isos: Iso[];
}

export class IsosApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Iso> {
    const response = await this.client.get<{ iso: Iso }>(`/isos/${String(id)}`);
    return response.iso;
  }

  async list(params: IsosListParams = {}): Promise<IsosListResponse> {
    return this.client.get<IsosListResponse>("/isos", params);
  }

  async getByName(name: string): Promise<Iso | undefined> {
    const response = await this.list({ name });
    return response.isos[0];
  }
}

import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";

export interface SshKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Record<string, string>;
  created: string;
}

export interface SshKeysListParams extends QueryParams {
  name?: string;
  fingerprint?: string;
  label_selector?: string;
  sort?: string;
}

export interface SshKeysListResponse extends PaginatedResponse {
  ssh_keys: SshKey[];
}

export interface SshKeyCreateParams {
  name: string;
  public_key: string;
  labels?: Record<string, string>;
}

export interface SshKeyUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export class SshKeysApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<SshKey> {
    const response = await this.client.get<{ ssh_key: SshKey }>(`/ssh_keys/${String(id)}`);
    return response.ssh_key;
  }

  async list(params: SshKeysListParams = {}): Promise<SshKeysListResponse> {
    return this.client.get<SshKeysListResponse>("/ssh_keys", params);
  }

  async create(params: SshKeyCreateParams): Promise<SshKey> {
    const response = await this.client.post<{ ssh_key: SshKey }>("/ssh_keys", params);
    return response.ssh_key;
  }

  async update(id: number, params: SshKeyUpdateParams): Promise<SshKey> {
    const response = await this.client.put<{ ssh_key: SshKey }>(`/ssh_keys/${String(id)}`, params);
    return response.ssh_key;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/ssh_keys/${String(id)}`);
  }

  async getByName(name: string): Promise<SshKey | undefined> {
    const response = await this.list({ name });
    return response.ssh_keys[0];
  }

  async getByFingerprint(fingerprint: string): Promise<SshKey | undefined> {
    const response = await this.list({ fingerprint });
    return response.ssh_keys[0];
  }
}

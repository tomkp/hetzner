import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";

export type CertificateType = "uploaded" | "managed";
export type CertificateStatus = "pending" | "completed" | "failed";

export interface CertificateStatusDetails {
  issuance: CertificateStatus;
  renewal: CertificateStatus;
  error?: { code: string; message: string };
}

export interface Certificate {
  id: number;
  name: string;
  type: CertificateType;
  certificate: string | null;
  created: string;
  not_valid_before: string | null;
  not_valid_after: string | null;
  domain_names: string[];
  fingerprint: string | null;
  status: CertificateStatusDetails | null;
  used_by: { id: number; type: string }[];
  labels: Record<string, string>;
}

export interface CertificatesListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  type?: CertificateType;
  sort?: string;
}

export interface CertificatesListResponse extends PaginatedResponse {
  certificates: Certificate[];
}

export interface CertificateCreateUploadedParams {
  name: string;
  type?: "uploaded";
  certificate: string;
  private_key: string;
  labels?: Record<string, string>;
}

export interface CertificateCreateManagedParams {
  name: string;
  type: "managed";
  domain_names: string[];
  labels?: Record<string, string>;
}

export type CertificateCreateParams =
  | CertificateCreateUploadedParams
  | CertificateCreateManagedParams;

export interface CertificateCreateResponse {
  certificate: Certificate;
  action?: Action;
}

export interface CertificateUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export interface CertificateActionResponse {
  action: Action;
}

export class CertificatesApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Certificate> {
    const response = await this.client.get<{ certificate: Certificate }>(
      `/certificates/${String(id)}`
    );
    return response.certificate;
  }

  async list(params: CertificatesListParams = {}): Promise<CertificatesListResponse> {
    return this.client.get<CertificatesListResponse>("/certificates", params);
  }

  async create(params: CertificateCreateParams): Promise<CertificateCreateResponse> {
    return this.client.post<CertificateCreateResponse>("/certificates", params);
  }

  async update(id: number, params: CertificateUpdateParams): Promise<Certificate> {
    const response = await this.client.put<{ certificate: Certificate }>(
      `/certificates/${String(id)}`,
      params
    );
    return response.certificate;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/certificates/${String(id)}`);
  }

  async getByName(name: string): Promise<Certificate | undefined> {
    const response = await this.list({ name });
    return response.certificates[0];
  }

  // Certificate Actions
  async retry(id: number): Promise<Action> {
    const response = await this.client.post<CertificateActionResponse>(
      `/certificates/${String(id)}/actions/retry`
    );
    return response.action;
  }
}

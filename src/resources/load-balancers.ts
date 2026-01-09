import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";
import { type Location } from "./locations.ts";
import { type LoadBalancerType } from "./load-balancer-types.ts";

export type LoadBalancerAlgorithmType = "round_robin" | "least_connections";
export type LoadBalancerServiceProtocol = "tcp" | "http" | "https";
export type LoadBalancerTargetType = "server" | "label_selector" | "ip";
export type LoadBalancerTargetHealthStatus = "healthy" | "unhealthy" | "unknown";

export interface LoadBalancerAlgorithm {
  type: LoadBalancerAlgorithmType;
}

export interface LoadBalancerHealthCheckHttp {
  domain?: string;
  path: string;
  response?: string;
  status_codes?: string[];
  tls?: boolean;
}

export interface LoadBalancerHealthCheck {
  protocol: LoadBalancerServiceProtocol;
  port: number;
  interval: number;
  timeout: number;
  retries: number;
  http?: LoadBalancerHealthCheckHttp;
}

export interface LoadBalancerServiceHttp {
  cookie_name?: string;
  cookie_lifetime?: number;
  certificates?: number[];
  redirect_http?: boolean;
  sticky_sessions?: boolean;
}

export interface LoadBalancerService {
  protocol: LoadBalancerServiceProtocol;
  listen_port: number;
  destination_port: number;
  proxyprotocol: boolean;
  health_check: LoadBalancerHealthCheck;
  http?: LoadBalancerServiceHttp;
}

export interface LoadBalancerTargetHealthStatusEntry {
  listen_port: number;
  status: LoadBalancerTargetHealthStatus;
}

export interface LoadBalancerTargetServer {
  id: number;
}

export interface LoadBalancerTargetLabelSelector {
  selector: string;
}

export interface LoadBalancerTargetIP {
  ip: string;
}

export interface LoadBalancerTarget {
  type: LoadBalancerTargetType;
  server?: LoadBalancerTargetServer;
  label_selector?: LoadBalancerTargetLabelSelector;
  ip?: LoadBalancerTargetIP;
  use_private_ip?: boolean;
  health_status?: LoadBalancerTargetHealthStatusEntry[];
  targets?: LoadBalancerTarget[];
}

export interface LoadBalancerPublicNetIPv4 {
  ip: string;
  dns_ptr?: string;
}

export interface LoadBalancerPublicNetIPv6 {
  ip: string;
  dns_ptr?: string;
}

export interface LoadBalancerPublicNet {
  enabled: boolean;
  ipv4: LoadBalancerPublicNetIPv4;
  ipv6: LoadBalancerPublicNetIPv6;
}

export interface LoadBalancerPrivateNet {
  network: number;
  ip: string;
}

export interface LoadBalancerProtection {
  delete: boolean;
}

export interface LoadBalancer {
  id: number;
  name: string;
  public_net: LoadBalancerPublicNet;
  private_net: LoadBalancerPrivateNet[];
  location: Location;
  load_balancer_type: LoadBalancerType;
  protection: LoadBalancerProtection;
  labels: Record<string, string>;
  targets: LoadBalancerTarget[];
  services: LoadBalancerService[];
  algorithm: LoadBalancerAlgorithm;
  outgoing_traffic: number | null;
  ingoing_traffic: number | null;
  included_traffic: number;
  created: string;
}

export interface LoadBalancersListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  sort?: string;
}

export interface LoadBalancersListResponse extends PaginatedResponse {
  load_balancers: LoadBalancer[];
}

export interface LoadBalancerCreateParams {
  name: string;
  load_balancer_type: string | number;
  location?: string;
  network_zone?: string;
  algorithm?: LoadBalancerAlgorithm;
  services?: Omit<LoadBalancerService, "health_check"> &
    {
      health_check: Omit<LoadBalancerHealthCheck, "http"> & { http?: LoadBalancerHealthCheckHttp };
    }[];
  targets?: LoadBalancerTargetParams[];
  labels?: Record<string, string>;
  network?: number;
  public_interface?: boolean;
}

export interface LoadBalancerCreateResponse {
  load_balancer: LoadBalancer;
  action: Action;
}

export interface LoadBalancerUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export interface LoadBalancerActionResponse {
  action: Action;
}

export interface LoadBalancerServiceParams {
  protocol: LoadBalancerServiceProtocol;
  listen_port: number;
  destination_port: number;
  proxyprotocol: boolean;
  health_check: Omit<LoadBalancerHealthCheck, "http"> & { http?: LoadBalancerHealthCheckHttp };
  http?: LoadBalancerServiceHttp;
}

export interface LoadBalancerTargetParams {
  type: LoadBalancerTargetType;
  server?: LoadBalancerTargetServer;
  label_selector?: LoadBalancerTargetLabelSelector;
  ip?: LoadBalancerTargetIP;
  use_private_ip?: boolean;
}

export interface LoadBalancerAttachToNetworkParams {
  network: number;
  ip?: string;
}

export interface LoadBalancerMetricsParams extends QueryParams {
  type: "open_connections" | "connections_per_second" | "requests_per_second" | "bandwidth";
  start: string;
  end: string;
  step?: number;
}

export interface LoadBalancerMetricsTimeSeries {
  values: [number, string][];
}

export interface LoadBalancerMetrics {
  start: string;
  end: string;
  step: number;
  time_series: Record<string, LoadBalancerMetricsTimeSeries>;
}

export interface LoadBalancerMetricsResponse {
  metrics: LoadBalancerMetrics;
}

export class LoadBalancersApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<LoadBalancer> {
    const response = await this.client.get<{ load_balancer: LoadBalancer }>(
      `/load_balancers/${String(id)}`
    );
    return response.load_balancer;
  }

  async list(params: LoadBalancersListParams = {}): Promise<LoadBalancersListResponse> {
    return this.client.get<LoadBalancersListResponse>("/load_balancers", params);
  }

  async create(params: LoadBalancerCreateParams): Promise<LoadBalancerCreateResponse> {
    return this.client.post<LoadBalancerCreateResponse>("/load_balancers", params);
  }

  async update(id: number, params: LoadBalancerUpdateParams): Promise<LoadBalancer> {
    const response = await this.client.put<{ load_balancer: LoadBalancer }>(
      `/load_balancers/${String(id)}`,
      params
    );
    return response.load_balancer;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/load_balancers/${String(id)}`);
  }

  async getByName(name: string): Promise<LoadBalancer | undefined> {
    const response = await this.list({ name });
    return response.load_balancers[0];
  }

  // Service Actions
  async addService(id: number, service: LoadBalancerServiceParams): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/add_service`,
      service
    );
    return response.action;
  }

  async updateService(id: number, service: LoadBalancerServiceParams): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/update_service`,
      service
    );
    return response.action;
  }

  async deleteService(id: number, listenPort: number): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/delete_service`,
      { listen_port: listenPort }
    );
    return response.action;
  }

  // Target Actions
  async addTarget(id: number, target: LoadBalancerTargetParams): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/add_target`,
      target
    );
    return response.action;
  }

  async removeTarget(id: number, target: LoadBalancerTargetParams): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/remove_target`,
      target
    );
    return response.action;
  }

  // Network Actions
  async attachToNetwork(id: number, params: LoadBalancerAttachToNetworkParams): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/attach_to_network`,
      params
    );
    return response.action;
  }

  async detachFromNetwork(id: number, network: number): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/detach_from_network`,
      { network }
    );
    return response.action;
  }

  // Other Actions
  async changeAlgorithm(id: number, type: LoadBalancerAlgorithmType): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/change_algorithm`,
      { type }
    );
    return response.action;
  }

  async changeDnsPtr(id: number, ip: string, dnsPtr: string | null): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/change_dns_ptr`,
      { ip, dns_ptr: dnsPtr }
    );
    return response.action;
  }

  async changeProtection(id: number, protection: Partial<LoadBalancerProtection>): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }

  async changeType(id: number, loadBalancerType: string | number): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/change_type`,
      { load_balancer_type: loadBalancerType }
    );
    return response.action;
  }

  async enablePublicInterface(id: number): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/enable_public_interface`
    );
    return response.action;
  }

  async disablePublicInterface(id: number): Promise<Action> {
    const response = await this.client.post<LoadBalancerActionResponse>(
      `/load_balancers/${String(id)}/actions/disable_public_interface`
    );
    return response.action;
  }

  // Metrics
  async getMetrics(
    id: number,
    params: LoadBalancerMetricsParams
  ): Promise<LoadBalancerMetricsResponse> {
    return this.client.get<LoadBalancerMetricsResponse>(
      `/load_balancers/${String(id)}/metrics`,
      params
    );
  }
}

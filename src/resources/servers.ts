import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";
import { type Datacenter } from "./datacenters.ts";
import { type Image } from "./images.ts";
import { type Iso } from "./isos.ts";
import { type ServerType } from "./server-types.ts";

export type ServerStatus =
  | "running"
  | "initializing"
  | "starting"
  | "stopping"
  | "off"
  | "deleting"
  | "rebuilding"
  | "migrating"
  | "unknown";

export interface ServerPublicNet {
  ipv4: { ip: string; blocked: boolean; dns_ptr: string } | null;
  ipv6: { ip: string; blocked: boolean; dns_ptr: { ip: string; dns_ptr: string }[] } | null;
  floating_ips: number[];
  firewalls: { id: number; status: string }[];
}

export interface ServerPrivateNet {
  network: number;
  ip: string;
  alias_ips: string[];
  mac_address: string;
}

export interface Server {
  id: number;
  name: string;
  status: ServerStatus;
  created: string;
  public_net: ServerPublicNet;
  private_net: ServerPrivateNet[];
  server_type: ServerType;
  datacenter: Datacenter;
  image: Image | null;
  iso: Iso | null;
  rescue_enabled: boolean;
  locked: boolean;
  backup_window: string | null;
  outgoing_traffic: number | null;
  ingoing_traffic: number | null;
  included_traffic: number;
  protection: { delete: boolean; rebuild: boolean };
  labels: Record<string, string>;
  volumes: number[];
  load_balancers: number[];
  primary_disk_size: number;
}

export interface ServersListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  sort?: string;
  status?: ServerStatus;
}

export interface ServersListResponse extends PaginatedResponse {
  servers: Server[];
}

export interface ServerCreateParams {
  name: string;
  server_type: string;
  image: string;
  ssh_keys?: string[];
  volumes?: number[];
  firewalls?: { firewall: number }[];
  networks?: number[];
  user_data?: string;
  labels?: Record<string, string>;
  automount?: boolean;
  start_after_create?: boolean;
  location?: string;
  datacenter?: string;
  public_net?: {
    enable_ipv4?: boolean;
    enable_ipv6?: boolean;
    ipv4?: number;
    ipv6?: number;
  };
}

export interface ServerCreateResponse {
  server: Server;
  action: Action;
  root_password: string | null;
  next_actions: Action[];
}

export interface ServerUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export interface ServerActionResponse {
  action: Action;
}

export class ServersApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Server> {
    const response = await this.client.get<{ server: Server }>(`/servers/${String(id)}`);
    return response.server;
  }

  async list(params: ServersListParams = {}): Promise<ServersListResponse> {
    return this.client.get<ServersListResponse>("/servers", params);
  }

  async create(params: ServerCreateParams): Promise<ServerCreateResponse> {
    return this.client.post<ServerCreateResponse>("/servers", params);
  }

  async update(id: number, params: ServerUpdateParams): Promise<Server> {
    const response = await this.client.put<{ server: Server }>(`/servers/${String(id)}`, params);
    return response.server;
  }

  async delete(id: number): Promise<Action> {
    const response = await this.client.delete<ServerActionResponse>(`/servers/${String(id)}`);
    if (!response) {
      throw new Error("Unexpected empty response from server delete");
    }
    return response.action;
  }

  async getByName(name: string): Promise<Server | undefined> {
    const response = await this.list({ name });
    return response.servers[0];
  }

  // Power actions
  async powerOn(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/poweron`
    );
    return response.action;
  }

  async powerOff(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/poweroff`
    );
    return response.action;
  }

  async reboot(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/reboot`
    );
    return response.action;
  }

  async reset(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/reset`
    );
    return response.action;
  }

  async shutdown(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/shutdown`
    );
    return response.action;
  }

  // Rescue mode
  async enableRescue(
    id: number,
    options: { type?: "linux64"; ssh_keys?: number[] } = {}
  ): Promise<{ action: Action; root_password: string }> {
    return this.client.post(`/servers/${String(id)}/actions/enable_rescue`, options);
  }

  async disableRescue(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/disable_rescue`
    );
    return response.action;
  }

  // Image/ISO actions
  async createImage(
    id: number,
    options: { description?: string; type?: "snapshot" | "backup"; labels?: Record<string, string> }
  ): Promise<{ action: Action; image: Image }> {
    return this.client.post(`/servers/${String(id)}/actions/create_image`, options);
  }

  async rebuild(id: number, image: string): Promise<{ action: Action; root_password: string }> {
    return this.client.post(`/servers/${String(id)}/actions/rebuild`, { image });
  }

  async attachIso(id: number, iso: string): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/attach_iso`,
      { iso }
    );
    return response.action;
  }

  async detachIso(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/detach_iso`
    );
    return response.action;
  }

  // Type/Protection changes
  async changeType(id: number, serverType: string, upgradeDisk: boolean): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/change_type`,
      { server_type: serverType, upgrade_disk: upgradeDisk }
    );
    return response.action;
  }

  async changeProtection(
    id: number,
    protection: { delete?: boolean; rebuild?: boolean }
  ): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/change_protection`,
      protection
    );
    return response.action;
  }

  // Backup
  async enableBackup(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/enable_backup`
    );
    return response.action;
  }

  async disableBackup(id: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/disable_backup`
    );
    return response.action;
  }

  // DNS
  async changeDnsPtr(id: number, ip: string, dnsPtr: string | null): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/change_dns_ptr`,
      { ip, dns_ptr: dnsPtr }
    );
    return response.action;
  }

  // Network
  async attachToNetwork(
    id: number,
    network: number,
    options: { ip?: string; alias_ips?: string[] } = {}
  ): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/attach_to_network`,
      { network, ...options }
    );
    return response.action;
  }

  async detachFromNetwork(id: number, network: number): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/detach_from_network`,
      { network }
    );
    return response.action;
  }

  async changeAliasIps(id: number, network: number, aliasIps: string[]): Promise<Action> {
    const response = await this.client.post<ServerActionResponse>(
      `/servers/${String(id)}/actions/change_alias_ips`,
      { network, alias_ips: aliasIps }
    );
    return response.action;
  }

  // Metrics
  async getMetrics(
    id: number,
    type: string,
    start: string,
    end: string
  ): Promise<{ metrics: { start: string; end: string; step: number; time_series: object } }> {
    return this.client.get(`/servers/${String(id)}/metrics`, { type, start, end });
  }
}

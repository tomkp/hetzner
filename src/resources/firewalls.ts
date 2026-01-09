import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { type Action } from "./actions.ts";

export type FirewallRuleDirection = "in" | "out";
export type FirewallRuleProtocol = "tcp" | "udp" | "icmp" | "esp" | "gre";

export interface FirewallRule {
  direction: FirewallRuleDirection;
  protocol: FirewallRuleProtocol;
  port?: string;
  source_ips?: string[];
  destination_ips?: string[];
  description?: string;
}

export interface FirewallResourceRef {
  type: "server" | "label_selector";
  server?: { id: number };
  label_selector?: { selector: string };
}

export interface Firewall {
  id: number;
  name: string;
  rules: FirewallRule[];
  applied_to: FirewallResourceRef[];
  labels: Record<string, string>;
  created: string;
}

export interface FirewallsListParams extends QueryParams {
  name?: string;
  label_selector?: string;
  sort?: string;
}

export interface FirewallsListResponse extends PaginatedResponse {
  firewalls: Firewall[];
}

export interface FirewallCreateParams {
  name: string;
  rules?: FirewallRule[];
  apply_to?: FirewallResourceRef[];
  labels?: Record<string, string>;
}

export interface FirewallCreateResponse {
  firewall: Firewall;
  actions?: Action[];
}

export interface FirewallUpdateParams {
  name?: string;
  labels?: Record<string, string>;
}

export interface FirewallActionResponse {
  action: Action;
}

export interface FirewallActionsResponse {
  actions: Action[];
}

export class FirewallsApi {
  private readonly client: HetznerClient;

  constructor(client: HetznerClient) {
    this.client = client;
  }

  async get(id: number): Promise<Firewall> {
    const response = await this.client.get<{ firewall: Firewall }>(`/firewalls/${String(id)}`);
    return response.firewall;
  }

  async list(params: FirewallsListParams = {}): Promise<FirewallsListResponse> {
    return this.client.get<FirewallsListResponse>("/firewalls", params);
  }

  async create(params: FirewallCreateParams): Promise<FirewallCreateResponse> {
    return this.client.post<FirewallCreateResponse>("/firewalls", params);
  }

  async update(id: number, params: FirewallUpdateParams): Promise<Firewall> {
    const response = await this.client.put<{ firewall: Firewall }>(
      `/firewalls/${String(id)}`,
      params
    );
    return response.firewall;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`/firewalls/${String(id)}`);
  }

  async getByName(name: string): Promise<Firewall | undefined> {
    const response = await this.list({ name });
    return response.firewalls[0];
  }

  // Firewall Actions
  async setRules(id: number, rules: FirewallRule[]): Promise<Action[]> {
    const response = await this.client.post<FirewallActionsResponse>(
      `/firewalls/${String(id)}/actions/set_rules`,
      { rules }
    );
    return response.actions;
  }

  async applyToResources(id: number, resources: FirewallResourceRef[]): Promise<Action[]> {
    const response = await this.client.post<FirewallActionsResponse>(
      `/firewalls/${String(id)}/actions/apply_to_resources`,
      { apply_to: resources }
    );
    return response.actions;
  }

  async removeFromResources(id: number, resources: FirewallResourceRef[]): Promise<Action[]> {
    const response = await this.client.post<FirewallActionsResponse>(
      `/firewalls/${String(id)}/actions/remove_from_resources`,
      { remove_from: resources }
    );
    return response.actions;
  }
}

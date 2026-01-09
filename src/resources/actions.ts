import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { delay } from "../utils.ts";

export type ActionStatus = "running" | "success" | "error";

export interface ActionResource {
  id: number;
  type: string;
}

export interface ActionErrorInfo {
  code: string;
  message: string;
}

export interface Action {
  id: number;
  command: string;
  status: ActionStatus;
  progress: number;
  started: string;
  finished: string | null;
  resources: ActionResource[];
  error: ActionErrorInfo;
}

export interface ActionsListParams extends QueryParams {
  status?: ActionStatus;
  sort?: string;
}

export interface ActionsListResponse extends PaginatedResponse {
  actions: Action[];
}

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

export class ActionError extends Error {
  readonly action: Action;

  constructor(action: Action, message: string) {
    super(message);
    this.name = "ActionError";
    this.action = action;
  }
}

export class ActionsApi {
  constructor(private readonly client: HetznerClient) {}

  async get(id: number): Promise<Action> {
    const response = await this.client.get<{ action: Action }>(`/actions/${String(id)}`);
    return response.action;
  }

  async list(params: ActionsListParams = {}): Promise<ActionsListResponse> {
    return this.client.get<ActionsListResponse>("/actions", params);
  }

  async poll(id: number, options: PollOptions = {}): Promise<Action> {
    const { intervalMs = 500, timeoutMs = 300000 } = options;
    const startTime = Date.now();
    let action = await this.get(id);

    while (action.status === "running") {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Action ${String(id)} timed out after ${String(timeoutMs)}ms`);
      }

      await delay(intervalMs);
      action = await this.get(id);
    }

    if (action.status === "error") {
      throw new ActionError(
        action,
        `Action failed: ${action.error.code} - ${action.error.message}`
      );
    }

    return action;
  }
}

import { HetznerClient, type QueryParams } from "../client.ts";
import { type PaginatedResponse } from "../pagination.ts";
import { delay } from "../utils.ts";

/** Status of an async action */
export type ActionStatus = "running" | "success" | "error";

/** Resource affected by an action */
export interface ActionResource {
  /** Resource ID */
  id: number;
  /** Resource type (e.g., "server", "volume") */
  type: string;
}

/** Error information from a failed action */
export interface ActionErrorInfo {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Represents an async action in the Hetzner Cloud API.
 * Actions are created when performing operations that take time to complete.
 */
export interface Action {
  /** Unique identifier for the action */
  id: number;
  /** Command that was executed (e.g., "create_server") */
  command: string;
  /** Current status of the action */
  status: ActionStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** ISO 8601 timestamp when the action started */
  started: string;
  /** ISO 8601 timestamp when the action finished, or null if still running */
  finished: string | null;
  /** Resources affected by this action */
  resources: ActionResource[];
  /** Error information if the action failed */
  error: ActionErrorInfo;
}

/** Parameters for listing actions */
export interface ActionsListParams extends QueryParams {
  /** Filter by action status */
  status?: ActionStatus;
  /** Sort order (e.g., "id:asc", "started:desc") */
  sort?: string;
}

/** Response from listing actions */
export interface ActionsListResponse extends PaginatedResponse {
  actions: Action[];
}

/**
 * Options for polling an action until completion.
 */
export interface PollOptions {
  /** Interval between status checks in milliseconds. Default: 500 */
  intervalMs?: number;
  /** Maximum time to wait in milliseconds. Default: 300000 (5 minutes) */
  timeoutMs?: number;
}

/**
 * Error thrown when an action fails.
 */
export class ActionError extends Error {
  /** The failed action */
  readonly action: Action;

  constructor(action: Action, message: string) {
    super(message);
    this.name = "ActionError";
    this.action = action;
  }
}

/**
 * API for tracking and managing async actions.
 * Actions are created when performing operations like creating servers or volumes.
 *
 * @example
 * ```typescript
 * const actions = new ActionsApi(client);
 *
 * // Wait for an action to complete
 * const action = await actions.poll(actionId);
 * ```
 */
export class ActionsApi {
  constructor(private readonly client: HetznerClient) {}

  /**
   * Gets an action by ID.
   * @param id - The action ID
   * @returns The action
   */
  async get(id: number): Promise<Action> {
    const response = await this.client.get<{ action: Action }>(`/actions/${String(id)}`);
    return response.action;
  }

  /**
   * Lists all actions with optional filtering.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of actions
   */
  async list(params: ActionsListParams = {}): Promise<ActionsListResponse> {
    return this.client.get<ActionsListResponse>("/actions", params);
  }

  /**
   * Polls an action until it completes or fails.
   * @param id - The action ID to poll
   * @param options - Polling options
   * @returns The completed action
   * @throws {ActionError} When the action fails
   * @throws {Error} When the polling times out
   *
   * @example
   * ```typescript
   * const { action } = await servers.create({ name: "my-server", ... });
   * await actions.poll(action.id); // Wait for server to be ready
   * ```
   */
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

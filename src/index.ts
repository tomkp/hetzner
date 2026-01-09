export const VERSION = "0.1.0";

export { HetznerClient, HetznerError, RateLimitError } from "./client.ts";
export type { HetznerClientOptions, QueryParams } from "./client.ts";

export { paginate, fetchAllPages } from "./pagination.ts";
export type { Pagination, PaginatedResponse, PaginatedData } from "./pagination.ts";

export { ActionsApi, ActionError } from "./resources/actions.ts";
export type {
  Action,
  ActionStatus,
  ActionResource,
  ActionErrorInfo,
  ActionsListParams,
  ActionsListResponse,
  PollOptions,
} from "./resources/actions.ts";

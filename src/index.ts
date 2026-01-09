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

export { ServerTypesApi } from "./resources/server-types.ts";
export type {
  ServerType,
  ServerTypePrice,
  ServerTypesListParams,
  ServerTypesListResponse,
} from "./resources/server-types.ts";

export { LocationsApi } from "./resources/locations.ts";
export type {
  Location,
  LocationsListParams,
  LocationsListResponse,
} from "./resources/locations.ts";

export { DatacentersApi } from "./resources/datacenters.ts";
export type {
  Datacenter,
  DatacentersListParams,
  DatacentersListResponse,
} from "./resources/datacenters.ts";

export { ImagesApi } from "./resources/images.ts";
export type {
  Image,
  ImageType,
  ImageStatus,
  ImagesListParams,
  ImagesListResponse,
  ImageUpdateParams,
} from "./resources/images.ts";

export { IsosApi } from "./resources/isos.ts";
export type { Iso, IsoType, IsosListParams, IsosListResponse } from "./resources/isos.ts";

export { SshKeysApi } from "./resources/ssh-keys.ts";
export type {
  SshKey,
  SshKeysListParams,
  SshKeysListResponse,
  SshKeyCreateParams,
  SshKeyUpdateParams,
} from "./resources/ssh-keys.ts";

export { ServersApi } from "./resources/servers.ts";
export type {
  Server,
  ServerStatus,
  ServerPublicNet,
  ServerPrivateNet,
  ServersListParams,
  ServersListResponse,
  ServerCreateParams,
  ServerCreateResponse,
  ServerUpdateParams,
  ServerActionResponse,
} from "./resources/servers.ts";

export { VolumesApi } from "./resources/volumes.ts";
export type {
  Volume,
  VolumeStatus,
  VolumesListParams,
  VolumesListResponse,
  VolumeCreateParams,
  VolumeCreateResponse,
  VolumeUpdateParams,
  VolumeActionResponse,
} from "./resources/volumes.ts";

export { NetworksApi } from "./resources/networks.ts";
export type {
  Network,
  Subnet,
  SubnetType,
  Route,
  NetworksListParams,
  NetworksListResponse,
  NetworkCreateParams,
  NetworkUpdateParams,
  NetworkActionResponse,
  SubnetParams,
} from "./resources/networks.ts";

export { FirewallsApi } from "./resources/firewalls.ts";
export type {
  Firewall,
  FirewallRule,
  FirewallRuleDirection,
  FirewallRuleProtocol,
  FirewallResourceRef,
  FirewallsListParams,
  FirewallsListResponse,
  FirewallCreateParams,
  FirewallCreateResponse,
  FirewallUpdateParams,
  FirewallActionResponse,
  FirewallActionsResponse,
} from "./resources/firewalls.ts";

export { FloatingIPsApi } from "./resources/floating-ips.ts";
export type {
  FloatingIP,
  FloatingIPType,
  FloatingIPsListParams,
  FloatingIPsListResponse,
  FloatingIPCreateParams,
  FloatingIPUpdateParams,
  FloatingIPActionResponse,
} from "./resources/floating-ips.ts";

export { PrimaryIPsApi } from "./resources/primary-ips.ts";
export type {
  PrimaryIP,
  PrimaryIPType,
  PrimaryIPAssigneeType,
  PrimaryIPsListParams,
  PrimaryIPsListResponse,
  PrimaryIPCreateParams,
  PrimaryIPCreateResponse,
  PrimaryIPUpdateParams,
  PrimaryIPActionResponse,
} from "./resources/primary-ips.ts";

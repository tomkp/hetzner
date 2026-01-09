import { HetznerClient, type HetznerClientOptions } from "./client.ts";
import { ActionsApi } from "./resources/actions.ts";
import { CertificatesApi } from "./resources/certificates.ts";
import { DatacentersApi } from "./resources/datacenters.ts";
import { FirewallsApi } from "./resources/firewalls.ts";
import { FloatingIPsApi } from "./resources/floating-ips.ts";
import { ImagesApi } from "./resources/images.ts";
import { IsosApi } from "./resources/isos.ts";
import { LoadBalancerTypesApi } from "./resources/load-balancer-types.ts";
import { LoadBalancersApi } from "./resources/load-balancers.ts";
import { LocationsApi } from "./resources/locations.ts";
import { NetworksApi } from "./resources/networks.ts";
import { PlacementGroupsApi } from "./resources/placement-groups.ts";
import { PricingApi } from "./resources/pricing.ts";
import { PrimaryIPsApi } from "./resources/primary-ips.ts";
import { ServerTypesApi } from "./resources/server-types.ts";
import { ServersApi } from "./resources/servers.ts";
import { SshKeysApi } from "./resources/ssh-keys.ts";
import { VolumesApi } from "./resources/volumes.ts";

/**
 * Unified SDK for the Hetzner Cloud API.
 * Provides access to all resource APIs through a single entry point.
 *
 * @example
 * ```typescript
 * const hetzner = new Hetzner("your-api-token");
 *
 * // Access all APIs as properties
 * const servers = await hetzner.servers.list();
 * const volumes = await hetzner.volumes.list();
 *
 * // Create a server and wait for it to be ready
 * const { server, action } = await hetzner.servers.create({
 *   name: "my-server",
 *   server_type: "cx11",
 *   image: "ubuntu-22.04",
 * });
 * await hetzner.actions.poll(action.id);
 * ```
 */
export class Hetzner {
  /** The underlying HTTP client */
  readonly client: HetznerClient;

  /** API for tracking async actions */
  readonly actions: ActionsApi;

  /** API for managing SSL/TLS certificates */
  readonly certificates: CertificatesApi;

  /** API for datacenter information */
  readonly datacenters: DatacentersApi;

  /** API for managing firewalls */
  readonly firewalls: FirewallsApi;

  /** API for managing floating IPs */
  readonly floatingIPs: FloatingIPsApi;

  /** API for managing images */
  readonly images: ImagesApi;

  /** API for ISO images */
  readonly isos: IsosApi;

  /** API for load balancer type information */
  readonly loadBalancerTypes: LoadBalancerTypesApi;

  /** API for managing load balancers */
  readonly loadBalancers: LoadBalancersApi;

  /** API for location information */
  readonly locations: LocationsApi;

  /** API for managing networks */
  readonly networks: NetworksApi;

  /** API for managing placement groups */
  readonly placementGroups: PlacementGroupsApi;

  /** API for pricing information */
  readonly pricing: PricingApi;

  /** API for managing primary IPs */
  readonly primaryIPs: PrimaryIPsApi;

  /** API for server type information */
  readonly serverTypes: ServerTypesApi;

  /** API for managing servers */
  readonly servers: ServersApi;

  /** API for managing SSH keys */
  readonly sshKeys: SshKeysApi;

  /** API for managing volumes */
  readonly volumes: VolumesApi;

  /**
   * Creates a new Hetzner SDK instance.
   * @param token - Your Hetzner Cloud API token
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerClientOptions = {}) {
    this.client = new HetznerClient(token, options);

    this.actions = new ActionsApi(this.client);
    this.certificates = new CertificatesApi(this.client);
    this.datacenters = new DatacentersApi(this.client);
    this.firewalls = new FirewallsApi(this.client);
    this.floatingIPs = new FloatingIPsApi(this.client);
    this.images = new ImagesApi(this.client);
    this.isos = new IsosApi(this.client);
    this.loadBalancerTypes = new LoadBalancerTypesApi(this.client);
    this.loadBalancers = new LoadBalancersApi(this.client);
    this.locations = new LocationsApi(this.client);
    this.networks = new NetworksApi(this.client);
    this.placementGroups = new PlacementGroupsApi(this.client);
    this.pricing = new PricingApi(this.client);
    this.primaryIPs = new PrimaryIPsApi(this.client);
    this.serverTypes = new ServerTypesApi(this.client);
    this.servers = new ServersApi(this.client);
    this.sshKeys = new SshKeysApi(this.client);
    this.volumes = new VolumesApi(this.client);
  }
}

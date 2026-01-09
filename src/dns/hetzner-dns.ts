import { HetznerDnsClient, type HetznerDnsClientOptions } from "./client.ts";
import { ZonesApi } from "./zones.ts";
import { RecordsApi } from "./records.ts";

/**
 * Unified SDK for the Hetzner DNS API.
 * Provides access to all DNS resource APIs through a single entry point.
 *
 * @example
 * ```typescript
 * const dns = new HetznerDns("your-dns-api-token");
 *
 * // List all zones
 * const { zones } = await dns.zones.list();
 *
 * // Get records for a zone
 * const { records } = await dns.records.list({ zone_id: zones[0].id });
 *
 * // Create a new record
 * const record = await dns.records.create({
 *   zone_id: zones[0].id,
 *   type: "A",
 *   name: "www",
 *   value: "192.168.1.1",
 *   ttl: 3600,
 * });
 * ```
 */
export class HetznerDns {
  /** The underlying HTTP client */
  readonly client: HetznerDnsClient;

  /** API for managing DNS zones */
  readonly zones: ZonesApi;

  /** API for managing DNS records */
  readonly records: RecordsApi;

  /**
   * Creates a new Hetzner DNS SDK instance.
   * @param token - Your Hetzner DNS API token (not the Cloud API token)
   * @param options - Optional configuration options
   */
  constructor(token: string, options: HetznerDnsClientOptions = {}) {
    this.client = new HetznerDnsClient(token, options);
    this.zones = new ZonesApi(this.client);
    this.records = new RecordsApi(this.client);
  }
}

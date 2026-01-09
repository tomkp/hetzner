import { HetznerDnsClient, type DnsQueryParams } from "./client.ts";

/**
 * DNS zone status.
 */
export type ZoneStatus = "verified" | "failed" | "pending";

/**
 * Represents a DNS zone.
 */
export interface Zone {
  /** Unique identifier for the zone */
  id: string;
  /** Domain name of the zone */
  name: string;
  /** Default TTL for records in this zone */
  ttl: number;
  /** Name servers for this zone */
  ns: string[];
  /** Number of DNS records in this zone */
  records_count: number;
  /** ISO 8601 timestamp of when the zone was created */
  created: string;
  /** ISO 8601 timestamp of when the zone was last modified */
  modified: string;
  /** Current status of the zone */
  status: ZoneStatus;
}

/**
 * Pagination metadata for DNS API responses.
 */
export interface DnsPagination {
  page: number;
  per_page: number;
  previous_page: number | null;
  next_page: number | null;
  last_page: number;
  total_entries: number;
}

/**
 * Parameters for listing zones.
 */
export interface ZonesListParams extends DnsQueryParams {
  /** Filter zones by name */
  name?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  per_page?: number;
}

/**
 * Response from the list zones endpoint.
 */
export interface ZonesListResponse {
  zones: Zone[];
  meta: {
    pagination: DnsPagination;
  };
}

/**
 * Parameters for creating a zone.
 */
export interface ZoneCreateParams {
  /** Domain name for the zone */
  name: string;
  /** Default TTL for records (optional) */
  ttl?: number;
}

/**
 * Parameters for updating a zone.
 */
export interface ZoneUpdateParams {
  /** New domain name (optional) */
  name?: string;
  /** New default TTL (optional) */
  ttl?: number;
}

/**
 * API for managing DNS zones.
 *
 * @example
 * ```typescript
 * const zones = new ZonesApi(client);
 *
 * // List all zones
 * const { zones: allZones } = await zones.list();
 *
 * // Create a new zone
 * const zone = await zones.create({ name: "example.com", ttl: 3600 });
 *
 * // Get a zone by name
 * const existingZone = await zones.getByName("example.com");
 * ```
 */
export class ZonesApi {
  constructor(private readonly client: HetznerDnsClient) {}

  /**
   * Retrieves a zone by its ID.
   * @param id - The zone ID
   * @returns The zone
   * @throws {HetznerDnsError} When the zone is not found
   */
  async get(id: string): Promise<Zone> {
    const response = await this.client.get<{ zone: Zone }>(`/zones/${id}`);
    return response.zone;
  }

  /**
   * Lists all zones with optional filtering.
   * @param params - Optional query parameters
   * @returns Paginated list of zones
   */
  async list(params: ZonesListParams = {}): Promise<ZonesListResponse> {
    return this.client.get<ZonesListResponse>("/zones", params);
  }

  /**
   * Creates a new zone.
   * @param params - Zone creation parameters
   * @returns The created zone
   */
  async create(params: ZoneCreateParams): Promise<Zone> {
    const response = await this.client.post<{ zone: Zone }>("/zones", params);
    return response.zone;
  }

  /**
   * Updates an existing zone.
   * @param id - The zone ID
   * @param params - Zone update parameters
   * @returns The updated zone
   */
  async update(id: string, params: ZoneUpdateParams): Promise<Zone> {
    const response = await this.client.put<{ zone: Zone }>(`/zones/${id}`, params);
    return response.zone;
  }

  /**
   * Deletes a zone.
   * @param id - The zone ID
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/zones/${id}`);
  }

  /**
   * Finds a zone by its domain name.
   * @param name - The domain name to search for
   * @returns The zone if found, undefined otherwise
   */
  async getByName(name: string): Promise<Zone | undefined> {
    const response = await this.list({ name });
    return response.zones[0];
  }
}

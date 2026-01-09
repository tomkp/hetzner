import { HetznerDnsClient, type DnsQueryParams } from "./client.ts";
import { type DnsPagination } from "./zones.ts";

/**
 * DNS record types supported by Hetzner DNS.
 */
export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "TXT"
  | "SRV"
  | "CAA"
  | "TLSA"
  | "DS"
  | "SOA"
  | "PTR";

/**
 * Represents a DNS record.
 */
export interface Record {
  /** Unique identifier for the record */
  id: string;
  /** ID of the zone this record belongs to */
  zone_id: string;
  /** Record type (A, AAAA, CNAME, etc.) */
  type: RecordType;
  /** Record name (use @ for root) */
  name: string;
  /** Record value */
  value: string;
  /** Time to live in seconds */
  ttl?: number;
  /** ISO 8601 timestamp of when the record was created */
  created: string;
  /** ISO 8601 timestamp of when the record was last modified */
  modified: string;
}

/**
 * Parameters for listing records.
 */
export interface RecordsListParams extends DnsQueryParams {
  /** Filter records by zone ID (required) */
  zone_id: string;
  /** Filter records by type */
  type?: RecordType;
  /** Filter records by name */
  name?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  per_page?: number;
}

/**
 * Response from the list records endpoint.
 */
export interface RecordsListResponse {
  records: Record[];
  meta: {
    pagination: DnsPagination;
  };
}

/**
 * Parameters for creating a record.
 */
export interface RecordCreateParams {
  /** ID of the zone to create the record in */
  zone_id: string;
  /** Record type */
  type: RecordType;
  /** Record name (use @ for root) */
  name: string;
  /** Record value */
  value: string;
  /** Time to live in seconds (optional) */
  ttl?: number;
}

/**
 * Parameters for updating a record.
 */
export interface RecordUpdateParams {
  /** ID of the zone */
  zone_id: string;
  /** Record type */
  type: RecordType;
  /** Record name */
  name: string;
  /** Record value */
  value: string;
  /** Time to live in seconds (optional) */
  ttl?: number;
}

/**
 * Parameters for bulk creating records.
 */
export interface RecordsBulkCreateParams {
  /** Array of records to create */
  records: RecordCreateParams[];
}

/**
 * Response from bulk create endpoint.
 */
export interface RecordsBulkCreateResponse {
  /** All records that were processed */
  records: Record[];
  /** Records that were successfully created */
  valid_records: Record[];
  /** Records that failed validation */
  invalid_records: Record[];
}

/**
 * API for managing DNS records.
 *
 * @example
 * ```typescript
 * const records = new RecordsApi(client);
 *
 * // List all records in a zone
 * const { records: allRecords } = await records.list({ zone_id: "zone-123" });
 *
 * // Create an A record
 * const record = await records.create({
 *   zone_id: "zone-123",
 *   type: "A",
 *   name: "www",
 *   value: "192.168.1.1",
 *   ttl: 3600,
 * });
 *
 * // Bulk create records
 * const result = await records.bulkCreate({
 *   records: [
 *     { zone_id: "zone-123", type: "A", name: "@", value: "192.168.1.1", ttl: 3600 },
 *     { zone_id: "zone-123", type: "A", name: "www", value: "192.168.1.1", ttl: 3600 },
 *   ],
 * });
 * ```
 */
export class RecordsApi {
  constructor(private readonly client: HetznerDnsClient) {}

  /**
   * Retrieves a record by its ID.
   * @param id - The record ID
   * @returns The record
   * @throws {HetznerDnsError} When the record is not found
   */
  async get(id: string): Promise<Record> {
    const response = await this.client.get<{ record: Record }>(`/records/${id}`);
    return response.record;
  }

  /**
   * Lists all records with optional filtering.
   * @param params - Query parameters (zone_id is required)
   * @returns Paginated list of records
   */
  async list(params: RecordsListParams): Promise<RecordsListResponse> {
    return this.client.get<RecordsListResponse>("/records", params);
  }

  /**
   * Creates a new record.
   * @param params - Record creation parameters
   * @returns The created record
   */
  async create(params: RecordCreateParams): Promise<Record> {
    const response = await this.client.post<{ record: Record }>("/records", params);
    return response.record;
  }

  /**
   * Updates an existing record.
   * @param id - The record ID
   * @param params - Record update parameters
   * @returns The updated record
   */
  async update(id: string, params: RecordUpdateParams): Promise<Record> {
    const response = await this.client.put<{ record: Record }>(`/records/${id}`, params);
    return response.record;
  }

  /**
   * Deletes a record.
   * @param id - The record ID
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/records/${id}`);
  }

  /**
   * Creates multiple records at once.
   * @param params - Bulk create parameters containing array of records
   * @returns Result containing valid and invalid records
   */
  async bulkCreate(params: RecordsBulkCreateParams): Promise<RecordsBulkCreateResponse> {
    return this.client.post<RecordsBulkCreateResponse>("/records/bulk", params);
  }
}

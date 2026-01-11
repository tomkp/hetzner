import { HetznerClient } from "../client.ts";
import { HetznerDnsClient } from "../dns/client.ts";

/**
 * Gets the Hetzner Cloud API token from environment variables.
 * Returns undefined if not set.
 */
export function getApiToken(): string | undefined {
  return process.env["HETZNER_API_TOKEN"];
}

/**
 * Gets the Hetzner DNS API token from environment variables.
 * Returns undefined if not set.
 */
export function getDnsApiToken(): string | undefined {
  return process.env["HETZNER_DNS_API_TOKEN"];
}

/**
 * Creates a HetznerClient for integration testing.
 * Throws if HETZNER_API_TOKEN is not set.
 */
export function getIntegrationClient(): HetznerClient {
  const token = getApiToken();
  if (!token) {
    throw new Error("HETZNER_API_TOKEN environment variable is required for integration tests");
  }
  return new HetznerClient(token);
}

/**
 * Creates a HetznerDnsClient for DNS integration testing.
 * Throws if HETZNER_DNS_API_TOKEN is not set.
 */
export function getDnsIntegrationClient(): HetznerDnsClient {
  const token = getDnsApiToken();
  if (!token) {
    throw new Error(
      "HETZNER_DNS_API_TOKEN environment variable is required for DNS integration tests"
    );
  }
  return new HetznerDnsClient(token);
}

/**
 * Returns true if integration tests should run (token is available).
 */
export function shouldRunIntegrationTests(): boolean {
  return !!getApiToken();
}

/**
 * Returns true if DNS integration tests should run (token is available).
 */
export function shouldRunDnsIntegrationTests(): boolean {
  return !!getDnsApiToken();
}

/**
 * Generates a unique name for test resources to avoid conflicts.
 */
export function generateTestName(prefix: string): string {
  const timestamp = String(Date.now());
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-test-${timestamp}-${random}`;
}

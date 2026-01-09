import { describe, it } from "node:test";
import assert from "node:assert";
import { HetznerDns } from "./hetzner-dns.ts";
import { HetznerDnsClient } from "./client.ts";
import { ZonesApi } from "./zones.ts";
import { RecordsApi } from "./records.ts";

describe("HetznerDns", () => {
  const mockToken = "test-dns-api-token";

  describe("constructor", () => {
    it("creates an instance with all resource APIs", () => {
      const dns = new HetznerDns(mockToken);

      assert.ok(dns.client instanceof HetznerDnsClient);
      assert.ok(dns.zones instanceof ZonesApi);
      assert.ok(dns.records instanceof RecordsApi);
    });

    it("accepts custom options", () => {
      const dns = new HetznerDns(mockToken, {
        baseUrl: "https://custom.dns.api/v1",
      });

      assert.strictEqual(dns.client.baseUrl, "https://custom.dns.api/v1");
    });

    it("exposes the underlying client", () => {
      const dns = new HetznerDns(mockToken);

      assert.strictEqual(dns.client.baseUrl, "https://dns.hetzner.com/api/v1");
    });
  });
});

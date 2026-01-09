import { describe, it } from "node:test";
import assert from "node:assert";
import {
  VERSION,
  HetznerDns,
  HetznerDnsClient,
  HetznerDnsError,
  DnsRateLimitError,
  ZonesApi,
  RecordsApi,
} from "./index.ts";

describe("hetzner client", () => {
  it("exports VERSION", () => {
    assert.strictEqual(VERSION, "0.1.0");
  });
});

describe("DNS exports", () => {
  it("exports HetznerDns SDK", () => {
    const dns = new HetznerDns("test-token");
    assert.ok(dns instanceof HetznerDns);
    assert.ok(dns.zones instanceof ZonesApi);
    assert.ok(dns.records instanceof RecordsApi);
  });

  it("exports HetznerDnsClient", () => {
    const client = new HetznerDnsClient("test-token");
    assert.ok(client instanceof HetznerDnsClient);
  });

  it("exports DNS error classes", () => {
    const error = new HetznerDnsError("test", 0, 404);
    assert.ok(error instanceof HetznerDnsError);

    const rateLimitError = new DnsRateLimitError("test", 0, 60);
    assert.ok(rateLimitError instanceof DnsRateLimitError);
    assert.ok(rateLimitError instanceof HetznerDnsError);
  });
});

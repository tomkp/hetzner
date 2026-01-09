import { describe, it } from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import {
  VERSION,
  HetznerDns,
  HetznerDnsClient,
  HetznerDnsError,
  DnsRateLimitError,
  ZonesApi,
  RecordsApi,
} from "./index.ts";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

describe("hetzner client", () => {
  it("exports VERSION matching package.json", () => {
    assert.strictEqual(VERSION, pkg.version);
    assert.ok(typeof VERSION === "string");
    assert.ok(VERSION.length > 0);
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

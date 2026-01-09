import { describe, it } from "node:test";
import assert from "node:assert";
import { Hetzner } from "./hetzner.ts";
import { ServersApi } from "./resources/servers.ts";
import { VolumesApi } from "./resources/volumes.ts";
import { NetworksApi } from "./resources/networks.ts";
import { ActionsApi } from "./resources/actions.ts";
import { SshKeysApi } from "./resources/ssh-keys.ts";
import { ImagesApi } from "./resources/images.ts";
import { LocationsApi } from "./resources/locations.ts";
import { DatacentersApi } from "./resources/datacenters.ts";
import { FirewallsApi } from "./resources/firewalls.ts";
import { LoadBalancersApi } from "./resources/load-balancers.ts";

describe("Hetzner", () => {
  const mockToken = "test-api-token";

  describe("constructor", () => {
    it("creates an instance with all resource APIs", () => {
      const hetzner = new Hetzner(mockToken);

      assert.ok(hetzner.actions instanceof ActionsApi);
      assert.ok(hetzner.servers instanceof ServersApi);
      assert.ok(hetzner.volumes instanceof VolumesApi);
      assert.ok(hetzner.networks instanceof NetworksApi);
      assert.ok(hetzner.sshKeys instanceof SshKeysApi);
      assert.ok(hetzner.images instanceof ImagesApi);
      assert.ok(hetzner.locations instanceof LocationsApi);
      assert.ok(hetzner.datacenters instanceof DatacentersApi);
      assert.ok(hetzner.firewalls instanceof FirewallsApi);
      assert.ok(hetzner.loadBalancers instanceof LoadBalancersApi);
    });

    it("accepts custom options", () => {
      const hetzner = new Hetzner(mockToken, {
        baseUrl: "https://custom.api.com",
      });

      assert.ok(hetzner);
    });

    it("exposes the underlying client", () => {
      const hetzner = new Hetzner(mockToken);

      assert.strictEqual(hetzner.client.baseUrl, "https://api.hetzner.cloud/v1");
    });
  });
});

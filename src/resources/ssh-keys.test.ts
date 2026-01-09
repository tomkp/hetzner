import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { SshKeysApi, type SshKey } from "./ssh-keys.ts";

describe("SshKeysApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let sshKeys: SshKeysApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockSshKey: SshKey = {
    id: 1,
    name: "my-ssh-key",
    fingerprint: "b7:2f:30:a0:2f:6c:58:6c:21:04:58:61:ba:06:3b:2f",
    public_key: "ssh-rsa AAAA...",
    labels: {},
    created: "2025-01-01T00:00:00+00:00",
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    sshKeys = new SshKeysApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves an SSH key by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ssh_key: mockSshKey }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const key = await sshKeys.get(1);

      assert.strictEqual(key.id, 1);
      assert.strictEqual(key.name, "my-ssh-key");
    });
  });

  describe("list", () => {
    it("lists all SSH keys", async () => {
      const response = {
        ssh_keys: [mockSshKey],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 1,
          },
        },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await sshKeys.list();

      assert.strictEqual(result.ssh_keys.length, 1);
    });
  });

  describe("create", () => {
    it("creates a new SSH key", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ssh_key: mockSshKey }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const key = await sshKeys.create({
        name: "my-ssh-key",
        public_key: "ssh-rsa AAAA...",
      });

      assert.strictEqual(key.name, "my-ssh-key");
    });
  });

  describe("update", () => {
    it("updates an SSH key", async () => {
      const updatedKey = { ...mockSshKey, name: "updated-key" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ssh_key: updatedKey }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const key = await sshKeys.update(1, { name: "updated-key" });

      assert.strictEqual(key.name, "updated-key");
    });
  });

  describe("delete", () => {
    it("deletes an SSH key", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await sshKeys.delete(1);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByFingerprint", () => {
    it("finds SSH key by fingerprint", async () => {
      const response = {
        ssh_keys: [mockSshKey],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 1,
          },
        },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const key = await sshKeys.getByFingerprint("b7:2f:30:a0:2f:6c:58:6c:21:04:58:61:ba:06:3b:2f");

      assert.strictEqual(key?.fingerprint, "b7:2f:30:a0:2f:6c:58:6c:21:04:58:61:ba:06:3b:2f");
    });
  });
});

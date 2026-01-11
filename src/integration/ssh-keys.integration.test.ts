import { describe, it, after } from "node:test";
import assert from "node:assert";
import {
  getIntegrationClient,
  shouldRunIntegrationTests,
  generateTestName,
} from "./test-helpers.ts";
import { SshKeysApi } from "../resources/ssh-keys.ts";
import { HetznerError } from "../client.ts";

const runTests = shouldRunIntegrationTests();

// Test SSH public key (not a real key, just for testing the API)
const TEST_PUBLIC_KEY =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJHbTq1MdlgLMKjvaQA9dY0TEvFMJvmwJxQ0O1QXYZ12 integration-test@example.com";

describe("SshKeysApi Integration", { skip: !runTests }, () => {
  const createdKeyIds: number[] = [];

  after(async () => {
    // Cleanup: delete any keys created during tests
    if (createdKeyIds.length > 0) {
      const client = getIntegrationClient();
      const sshKeys = new SshKeysApi(client);
      for (const id of createdKeyIds) {
        try {
          await sshKeys.delete(id);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  it("performs full SSH key lifecycle: create, get, update, list, delete", async () => {
    const client = getIntegrationClient();
    const sshKeys = new SshKeysApi(client);
    const testName = generateTestName("ssh-key");

    // Create
    const created = await sshKeys.create({
      name: testName,
      public_key: TEST_PUBLIC_KEY,
      labels: { environment: "test" },
    });

    createdKeyIds.push(created.id);

    assert.ok(created.id, "Created key should have an id");
    assert.strictEqual(created.name, testName);
    assert.ok(created.fingerprint, "Created key should have a fingerprint");
    assert.deepStrictEqual(created.labels, { environment: "test" });

    // Get by ID
    const fetched = await sshKeys.get(created.id);
    assert.strictEqual(fetched.id, created.id);
    assert.strictEqual(fetched.name, testName);

    // Update
    const updatedName = `${testName}-updated`;
    const updated = await sshKeys.update(created.id, {
      name: updatedName,
      labels: { environment: "test", updated: "true" },
    });
    assert.strictEqual(updated.name, updatedName);
    assert.deepStrictEqual(updated.labels, { environment: "test", updated: "true" });

    // List and find
    const { ssh_keys } = await sshKeys.list();
    const found = ssh_keys.find((k) => k.id === created.id);
    assert.ok(found, "Should find created key in list");

    // Get by name
    const byName = await sshKeys.getByName(updatedName);
    assert.ok(byName, "Should find key by name");
    assert.strictEqual(byName.id, created.id);

    // Get by fingerprint
    const byFingerprint = await sshKeys.getByFingerprint(created.fingerprint);
    assert.ok(byFingerprint, "Should find key by fingerprint");
    assert.strictEqual(byFingerprint.id, created.id);

    // Delete
    await sshKeys.delete(created.id);
    createdKeyIds.pop(); // Remove from cleanup list since we deleted it

    // Verify deleted - attempting to get should return 404
    try {
      await sshKeys.get(created.id);
      assert.fail("Expected 404 error for deleted key");
    } catch (error) {
      assert.ok(error instanceof HetznerError, "Should throw HetznerError");
      assert.strictEqual(error.statusCode, 404, "Should be 404 Not Found");
    }
  });
});

import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import {
  CertificatesApi,
  type Certificate,
  type CertificateCreateResponse,
} from "./certificates.ts";
import { type Action } from "./actions.ts";

describe("CertificatesApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let certificates: CertificatesApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "create_certificate",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 600, type: "certificate" }],
    error: { code: "", message: "" },
  };

  const mockCertificate: Certificate = {
    id: 600,
    name: "my-certificate",
    type: "uploaded",
    certificate: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    created: "2025-01-01T00:00:00+00:00",
    not_valid_before: "2025-01-01T00:00:00+00:00",
    not_valid_after: "2026-01-01T00:00:00+00:00",
    domain_names: ["example.com", "*.example.com"],
    fingerprint: "03:c7:55:9b:2a:d1:04:17:09:f6:d0:7f:18:34:63:d4:3e:5f",
    status: null,
    used_by: [{ id: 1, type: "load_balancer" }],
    labels: { env: "test" },
  };

  const mockManagedCertificate: Certificate = {
    ...mockCertificate,
    id: 601,
    type: "managed",
    certificate: null,
    status: {
      issuance: "completed",
      renewal: "pending",
    },
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    certificates = new CertificatesApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a certificate by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ certificate: mockCertificate }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const certificate = await certificates.get(600);

      assert.strictEqual(certificate.id, 600);
      assert.strictEqual(certificate.name, "my-certificate");
      assert.strictEqual(certificate.type, "uploaded");
    });
  });

  describe("list", () => {
    it("lists certificates with pagination", async () => {
      const response = {
        certificates: [mockCertificate, mockManagedCertificate],
        meta: {
          pagination: {
            page: 1,
            per_page: 25,
            previous_page: null,
            next_page: null,
            last_page: 1,
            total_entries: 2,
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

      const result = await certificates.list();

      assert.strictEqual(result.certificates.length, 2);
      assert.strictEqual(result.certificates[0].type, "uploaded");
      assert.strictEqual(result.certificates[1].type, "managed");
    });

    it("filters by certificate type", async () => {
      const response = {
        certificates: [mockManagedCertificate],
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

      const result = await certificates.list({ type: "managed" });

      assert.strictEqual(result.certificates.length, 1);
      assert.strictEqual(result.certificates[0].type, "managed");
    });
  });

  describe("create", () => {
    it("creates an uploaded certificate", async () => {
      const createResponse: CertificateCreateResponse = {
        certificate: mockCertificate,
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(createResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await certificates.create({
        name: "my-certificate",
        certificate: "-----BEGIN CERTIFICATE-----\n...",
        private_key: "-----BEGIN PRIVATE KEY-----\n...",
      });

      assert.strictEqual(result.certificate.id, 600);
      assert.strictEqual(result.certificate.type, "uploaded");
    });

    it("creates a managed certificate", async () => {
      const createResponse: CertificateCreateResponse = {
        certificate: mockManagedCertificate,
        action: mockAction,
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(createResponse), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await certificates.create({
        name: "my-managed-cert",
        type: "managed",
        domain_names: ["example.com"],
      });

      assert.strictEqual(result.certificate.type, "managed");
      assert.ok(result.action);
    });
  });

  describe("update", () => {
    it("updates certificate name and labels", async () => {
      const updatedCertificate = { ...mockCertificate, name: "new-name" };
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ certificate: updatedCertificate }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const result = await certificates.update(600, { name: "new-name" });

      assert.strictEqual(result.name, "new-name");
    });
  });

  describe("delete", () => {
    it("deletes a certificate", async () => {
      fetchMock.mock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));

      await certificates.delete(600);

      assert.strictEqual(fetchMock.mock.callCount(), 1);
    });
  });

  describe("getByName", () => {
    it("finds certificate by name", async () => {
      const response = {
        certificates: [mockCertificate],
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

      const certificate = await certificates.getByName("my-certificate");

      assert.strictEqual(certificate?.id, 600);
    });
  });

  describe("retry", () => {
    it("retries managed certificate issuance", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ action: { ...mockAction, command: "retry_certificate" } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        )
      );

      const action = await certificates.retry(601);

      assert.strictEqual(action.command, "retry_certificate");
    });
  });
});

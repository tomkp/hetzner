import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { HetznerClient } from "../client.ts";
import { ActionsApi, type Action, type ActionStatus } from "./actions.ts";

describe("ActionsApi", () => {
  const mockToken = "test-api-token";
  let client: HetznerClient;
  let actions: ActionsApi;
  let fetchMock: ReturnType<typeof mock.fn>;

  const mockAction: Action = {
    id: 1,
    command: "create_server",
    status: "success",
    progress: 100,
    started: "2025-01-01T00:00:00+00:00",
    finished: "2025-01-01T00:01:00+00:00",
    resources: [{ id: 42, type: "server" }],
    error: { code: "", message: "" },
  };

  beforeEach(() => {
    client = new HetznerClient(mockToken);
    actions = new ActionsApi(client);
    fetchMock = mock.fn();
    mock.method(globalThis, "fetch", fetchMock);
  });

  describe("get", () => {
    it("retrieves a single action by id", async () => {
      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: mockAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const action = await actions.get(1);

      assert.strictEqual(action.id, 1);
      assert.strictEqual(action.command, "create_server");
      assert.strictEqual(action.status, "success");

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("/actions/1"));
    });
  });

  describe("list", () => {
    it("lists all actions with pagination", async () => {
      const response = {
        actions: [mockAction],
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

      const result = await actions.list();

      assert.strictEqual(result.actions.length, 1);
      assert.strictEqual(result.actions[0]?.id, 1);
    });

    it("supports filtering by status", async () => {
      const response = {
        actions: [mockAction],
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

      await actions.list({ status: "success" });

      const call = fetchMock.mock.calls[0];
      const url = call?.arguments[0] as string;
      assert.ok(url.includes("status=success"));
    });
  });

  describe("poll", () => {
    it("polls until action is complete", async () => {
      const runningAction: Action = { ...mockAction, status: "running", progress: 50 };
      const completeAction: Action = { ...mockAction, status: "success", progress: 100 };

      let callCount = 0;
      fetchMock.mock.mockImplementation(() => {
        callCount++;
        const action = callCount < 2 ? runningAction : completeAction;
        return Promise.resolve(
          new Response(JSON.stringify({ action }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      const result = await actions.poll(1, { intervalMs: 10 });

      assert.strictEqual(result.status, "success");
      assert.strictEqual(callCount, 2);
    });

    it("throws on action error", async () => {
      const errorAction: Action = {
        ...mockAction,
        status: "error",
        error: { code: "server_error", message: "Something went wrong" },
      };

      fetchMock.mock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ action: errorAction }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      await assert.rejects(
        () => actions.poll(1),
        (error: Error) => {
          assert.ok(error.message.includes("server_error"));
          return true;
        }
      );
    });
  });

  describe("ActionStatus", () => {
    it("defines valid status values", () => {
      const statuses: ActionStatus[] = ["running", "success", "error"];
      assert.strictEqual(statuses.length, 3);
    });
  });
});

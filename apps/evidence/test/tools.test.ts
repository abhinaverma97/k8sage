import { describe, expect, it } from "vitest";
import { getTool } from "../src/tools.js";
import type { EvidenceApi } from "../src/types.js";

const NS = "default";

function fakeApi(): EvidenceApi {
  return {
    async listPods() {
      return [
        {
          name: "orders-57f8c5d4b-x98yz",
          namespace: "default",
          phase: "Running",
          ready: false,
          restarts: 7,
          ageSeconds: 90000,
          nodeName: "node-1",
          containerStatuses: [
            {
              name: "app",
              ready: false,
              restarts: 7,
              state: "waiting",
              reason: "CrashLoopBackOff",
              message: "back-off 40s restarting failed container",
            },
          ],
          conditions: [{ type: "Ready", status: "False" }],
        },
        {
          name: "gateway-66d9b8f5c-lmno3",
          namespace: "default",
          phase: "Pending",
          ready: false,
          restarts: 0,
          ageSeconds: 300,
          containerStatuses: [],
          conditions: [{ type: "PodScheduled", status: "False", reason: "Unschedulable" }],
        },
      ];
    },
    async listNodes() {
      return [
        {
          name: "node-1",
          ready: true,
          schedulable: true,
          cpuCapacity: "2",
          memCapacity: "12Gi",
          cpuAllocatable: "1900m",
          memAllocatable: "11200Mi",
          conditions: [{ type: "Ready", status: "True" }],
        },
      ];
    },
    async listNamespaces() {
      return ["default", "monitoring"];
    },
    async listPodEvents(namespace, podName) {
      return [
        {
          reason: "FailedScheduling",
          type: "Warning",
          message: "0/1 nodes are available: insufficient cpu",
          count: 8,
          involvedKind: "Pod",
          involvedName: podName,
        },
      ];
    },
    async readPodLog(_namespace, _podName, _container, _tailLines, _previous) {
      return "Error: listen EADDRINUSE: address already in use :::3000";
    },
    async getNodeMetrics() {
      return [{ nodeName: "node-1", cpuUsageNano: 950_000_000, memUsageBytes: 7_200_000_000 }];
    },
  };
}

describe("tools", () => {
  it("pod_status surfaces restart counts and crash reasons", async () => {
    const result = (await getTool("pod_status")!.run({}, fakeApi(), NS)) as Array<{
      name: string;
      restarts: number;
      containers: Array<{ reason: string }>;
    }>;
    expect(result).toHaveLength(2);
    const orders = result.find((p) => p.name.startsWith("orders"))!;
    expect(orders.restarts).toBe(7);
    expect(orders.containers[0]?.reason).toBe("CrashLoopBackOff");
  });

  it("pod_status filters by name", async () => {
    const result = (await getTool("pod_status")!.run(
      { pod: "gateway" },
      fakeApi(),
      NS,
    )) as Array<{ name: string }>;
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toMatch(/gateway/);
  });

  it("pod_events requires a pod name", async () => {
    await expect(getTool("pod_events")!.run({}, fakeApi(), NS)).rejects.toThrow(
      /requires a 'pod' argument/,
    );
  });

  it("pod_events returns events for the pod", async () => {
    const result = (await getTool("pod_events")!.run(
      { pod: "gateway-66d9b8f5c-lmno3" },
      fakeApi(),
      NS,
    )) as { events: Array<{ reason: string }> };
    expect(result.events[0]?.reason).toBe("FailedScheduling");
  });

  it("pod_logs returns log tail and enforces the 200-line cap", async () => {
    const result = (await getTool("pod_logs")!.run(
      { pod: "orders-57f8c5d4b-x98yz", tail: 500 },
      fakeApi(),
      NS,
    )) as { logs: string; tailLines: number };
    expect(result.logs).toContain("EADDRINUSE");
    expect(result.tailLines).toBe(200);
  });

  it("cluster_summary computes pod counts and joins node usage", async () => {
    const result = (await getTool("cluster_summary")!.run({}, fakeApi(), NS)) as {
      podCounts: { total: number; ready: number; notReady: number };
      nodes: Array<{ usage: { cpuUsageNano: number } | null }>;
    };
    expect(result.podCounts).toEqual({ total: 2, ready: 0, notReady: 2 });
    expect(result.nodes[0]?.usage?.cpuUsageNano).toBe(950_000_000);
  });
});

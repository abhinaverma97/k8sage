import "dotenv/config";
import { createApp } from "./app.js";
import { createEvidenceApi, createRealEvidenceApi } from "./kube.js";

const PORT = Number(process.env.PORT ?? 8082);
const api = process.env.K8SAGE_MOCK === "1" ? createMockApi() : createRealEvidenceApi();
createApp(api).listen(PORT, () => {
  console.log(`[evidence] listening on :${PORT} (mode: ${process.env.K8SAGE_MOCK === "1" ? "mock" : "cluster"})`);
});

/** Local demo mode: no cluster required. Returns deterministic fake data. */
function createMockApi(): ReturnType<typeof createEvidenceApi> {
  const pod = (name: string, phase: string, restarts: number, ready: boolean, node?: string) => ({
    name,
    namespace: "default",
    phase,
    ready,
    restarts,
    ageSeconds: 86400,
    nodeName: node,
    reason: undefined,
    message: undefined,
    containerStatuses: [
      {
        name: "app",
        ready,
        restarts,
        state: ready ? "running" : "waiting",
        reason: ready ? undefined : "CrashLoopBackOff",
        message: ready ? undefined : "back-off 40s restarting failed container",
      },
    ],
    conditions: [{ type: "Ready", status: ready ? "True" : "False" }],
  });
  return {
    async listPods() {
      return [
        pod("products-6c9d4f5b7-abc12", "Running", 0, true, "k8sage-node-1"),
        pod("orders-57f8c5d4b-x98yz", "Running", 2, false, "k8sage-node-1"),
        pod("postgres-0", "Running", 0, true, "k8sage-node-1"),
        pod("gateway-66d9b8f5c-lmno3", "Pending", 0, false, undefined),
      ];
    },
    async listNodes() {
      return [
        {
          name: "k8sage-node-1",
          ready: true,
          schedulable: true,
          cpuCapacity: "2",
          memCapacity: "12Gi",
          cpuAllocatable: "1900m",
          memAllocatable: "11200Mi",
          conditions: [
            { type: "Ready", status: "True" },
            { type: "MemoryPressure", status: "False" },
            { type: "DiskPressure", status: "False" },
          ],
        },
      ];
    },
    async listNamespaces() {
      return ["default", "monitoring"];
    },
    async listPodEvents(namespace, podName) {
      const crashy =
        podName === "orders-57f8c5d4b-x98yz"
          ? [
              {
                reason: "BackOff",
                type: "Warning",
                message: "Back-off restarting failed container",
                count: 5,
                involvedKind: "Pod",
                involvedName: podName,
                firstTimestamp: "2026-08-15T10:00:00Z",
                lastTimestamp: "2026-08-16T09:00:00Z",
              },
              {
                reason: "Unhealthy",
                type: "Warning",
                message: "Readiness probe failed: HTTP probe failed with statuscode: 500",
                count: 12,
                involvedKind: "Pod",
                involvedName: podName,
                firstTimestamp: "2026-08-15T10:01:00Z",
                lastTimestamp: "2026-08-16T09:01:00Z",
              },
            ]
          : [
              {
                reason: "FailedScheduling",
                type: "Warning",
                message: "0/1 nodes are available: insufficient cpu",
                count: 8,
                involvedKind: "Pod",
                involvedName: podName,
                firstTimestamp: "2026-08-16T08:30:00Z",
                lastTimestamp: "2026-08-16T09:05:00Z",
              },
            ];
      return crashy;
    },
    async readPodLog(_namespace, _podName, _container, _tailLines, previous) {
      return `2026-08-16T09:00:00Z app listening on port 3000\n2026-08-16T09:00:01Z Error: listen EADDRINUSE: address already in use :::3000\n2026-08-16T09:00:01Z     at Server.setupListenHandle [as listen] (node:net:1:203)\n2026-08-16T09:00:02Z [pid 1] uncaughtException: EADDRINUSE\n${previous ? "[previous container logs shown]" : ""}`;
    },
    async getNodeMetrics() {
      return [
        { nodeName: "k8sage-node-1", cpuUsageNano: 950_000_000, memUsageBytes: 7_200_000_000 },
      ];
    },
  };
}

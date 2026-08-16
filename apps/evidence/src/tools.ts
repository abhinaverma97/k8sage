import { buildClusterSummary } from "./kube.js";
import type { EvidenceApi } from "./types.js";

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  run(args: Record<string, unknown>, api: EvidenceApi, namespace: string): Promise<unknown>;
}

function str(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function int(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = Number(args[key]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export const tools: Tool[] = [
  {
    name: "cluster_summary",
    description:
      "High-level view of the cluster: nodes (ready state, CPU/memory capacity and allocatable), namespaces, pod counts, and per-node CPU/memory usage when available.",
    parameters: [],
    async run(_args, api, namespace) {
      const [nodes, namespaces, pods, metrics] = await Promise.all([
        api.listNodes(),
        api.listNamespaces(),
        api.listPods(namespace),
        api.getNodeMetrics(),
      ]);
      const summary = buildClusterSummary(nodes, namespaces, pods, metrics);
      return {
        nodes: summary.nodes.map((n) => ({
          name: n.name,
          ready: n.ready,
          schedulable: n.schedulable,
          cpu: n.cpuAllocatable,
          memory: n.memAllocatable,
          usage: summary.metrics.find((m) => m.nodeName === n.name),
        })),
        namespaces: summary.namespaces,
        podCounts: {
          total: summary.pods.length,
          ready: summary.pods.filter((p) => p.ready).length,
          notReady: summary.pods.filter((p) => !p.ready).length,
        },
        observedNamespace: namespace,
      };
    },
  },
  {
    name: "pod_status",
    description:
      "Status of pods in the cluster (or a single pod by name): phase, ready state, restart counts, container state, conditions, and which node the pod runs on.",
    parameters: [
      {
        name: "pod",
        type: "string",
        description: "Optional pod name to filter for a single pod.",
      },
      {
        name: "namespace",
        type: "string",
        description: "Optional namespace. Defaults to the cluster's observed namespace.",
      },
    ],
    async run(args, api, namespace) {
      const ns = str(args, "namespace") ?? namespace;
      const pods = await api.listPods(ns);
      const filter = str(args, "pod");
      const selected = filter ? pods.filter((p) => p.name.includes(filter)) : pods;
      return selected.map((p) => ({
        name: p.name,
        namespace: p.namespace,
        phase: p.phase,
        ready: p.ready,
        restarts: p.restarts,
        age: formatAge(p.ageSeconds),
        node: p.nodeName,
        reason: p.reason,
        message: p.message,
        containers: p.containerStatuses,
        conditions: p.conditions.filter((c) => c.status !== "True" || c.type === "Ready"),
      }));
    },
  },
  {
    name: "pod_events",
    description:
      "Kubernetes events for a pod. These often contain the real reason a pod is stuck (e.g. FailedScheduling, BackOff, ImagePullBackOff, OOMKilled).",
    parameters: [
      {
        name: "pod",
        type: "string",
        description: "Pod name to fetch events for.",
        required: true,
      },
      {
        name: "namespace",
        type: "string",
        description: "Optional namespace. Defaults to the cluster's observed namespace.",
      },
    ],
    async run(args, api, namespace) {
      const ns = str(args, "namespace") ?? namespace;
      const pod = str(args, "pod");
      if (!pod) throw new Error("pod_events requires a 'pod' argument");
      const events = await api.listPodEvents(ns, pod);
      return { pod, namespace: ns, eventCount: events.length, events };
    },
  },
  {
    name: "pod_logs",
    description:
      "Recent container logs for a pod. The final lines of a crashing container usually show the exact error (e.g. EADDRINUSE, failed to connect, panic).",
    parameters: [
      {
        name: "pod",
        type: "string",
        description: "Pod name to read logs from.",
        required: true,
      },
      {
        name: "container",
        type: "string",
        description: "Container name (required for multi-container pods).",
      },
      {
        name: "namespace",
        type: "string",
        description: "Optional namespace. Defaults to the cluster's observed namespace.",
      },
      {
        name: "tail",
        type: "number",
        description: "Number of log lines to return (max 200, default 100).",
      },
      {
        name: "previous",
        type: "boolean",
        description:
          "Read logs from the previous (crashed) container instance. Use when the current container has no logs.",
      },
    ],
    async run(args, api, namespace) {
      const ns = str(args, "namespace") ?? namespace;
      const pod = str(args, "pod");
      if (!pod) throw new Error("pod_logs requires a 'pod' argument");
      const container = str(args, "container");
      const tail = Math.min(200, int(args, "tail", 100));
      const previous = args["previous"] === true;
      const logs = await api.readPodLog(ns, pod, container ?? "", tail, previous);
      return { pod, namespace: ns, container: container ?? null, previous, tailLines: tail, logs };
    },
  },
  {
    name: "node_status",
    description:
      "Health and resource state of cluster nodes: conditions (Ready, MemoryPressure, DiskPressure, etc.), allocatable CPU/memory, and current usage from the metrics API.",
    parameters: [
      {
        name: "node",
        type: "string",
        description: "Optional node name to filter for a single node.",
      },
    ],
    async run(args, api) {
      const [nodes, metrics] = await Promise.all([api.listNodes(), api.getNodeMetrics()]);
      const filter = str(args, "node");
      const selected = filter ? nodes.filter((n) => n.name.includes(filter)) : nodes;
      return selected.map((n) => ({
        name: n.name,
        ready: n.ready,
        schedulable: n.schedulable,
        conditions: n.conditions.filter((c) => c.status !== "True" || c.type === "Ready"),
        capacity: { cpu: n.cpuCapacity, memory: n.memCapacity },
        allocatable: { cpu: n.cpuAllocatable, memory: n.memAllocatable },
        usage: metrics.find((m) => m.nodeName === n.name) ?? null,
      }));
    },
  },
];

export function getTool(name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

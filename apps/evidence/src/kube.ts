import { Readable } from "node:stream";
import * as k8s from "@kubernetes/client-node";
import type {
  ClusterSummary,
  EventLite,
  EvidenceApi,
  NodeLite,
  NodeMetricsLite,
  PodLite,
} from "./types.js";

const NODE_READY_CONDITION = "Ready";

function podReady(pod: k8s.V1Pod): boolean {
  return (
    pod.status?.phase === "Running" &&
    (pod.status?.containerStatuses ?? []).every((c) => c.ready)
  );
}

function ageSeconds(ts: string | Date | undefined): number {
  if (!ts) return 0;
  const t = ts instanceof Date ? ts.getTime() : Date.parse(ts);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

function toPodLite(pod: k8s.V1Pod): PodLite {
  const containerStatuses = (pod.status?.containerStatuses ?? []).map((c) => {
    const state = c.state ?? {};
    const running = Object.keys(state).find((k) => k === "running");
    const reason =
      state.waiting?.reason ??
      state.terminated?.reason ??
      c.lastState?.terminated?.reason ??
      undefined;
    const message =
      state.waiting?.message ??
      state.terminated?.message ??
      c.lastState?.terminated?.message ??
      undefined;
    return {
      name: c.name,
      ready: c.ready,
      restarts: c.restartCount,
      state: running ?? (state.terminated ? "terminated" : state.waiting ? "waiting" : "unknown"),
      reason,
      message,
    };
  });

  return {
    name: pod.metadata?.name ?? "unknown",
    namespace: pod.metadata?.namespace ?? "unknown",
    phase: pod.status?.phase ?? "Unknown",
    ready: podReady(pod),
    restarts: (pod.status?.containerStatuses ?? []).reduce((n, c) => n + c.restartCount, 0),
    ageSeconds: ageSeconds(pod.metadata?.creationTimestamp),
    nodeName: pod.spec?.nodeName,
    reason: pod.status?.reason,
    message: pod.status?.message,
    containerStatuses,
    conditions: (pod.status?.conditions ?? []).map((c) => ({
      type: c.type ?? "Unknown",
      status: c.status ?? "Unknown",
      reason: c.reason,
      message: c.message,
    })),
  };
}

function toNodeLite(node: k8s.V1Node): NodeLite {
  const readyCondition = (node.status?.conditions ?? []).find(
    (c) => c.type === NODE_READY_CONDITION,
  );
  return {
    name: node.metadata?.name ?? "unknown",
    ready: readyCondition?.status === "True",
    schedulable: !node.spec?.unschedulable,
    cpuCapacity: node.status?.capacity?.cpu ?? "unknown",
    memCapacity: node.status?.capacity?.memory ?? "unknown",
    cpuAllocatable: node.status?.allocatable?.cpu ?? "unknown",
    memAllocatable: node.status?.allocatable?.memory ?? "unknown",
    conditions: (node.status?.conditions ?? []).map((c) => ({
      type: c.type ?? "Unknown",
      status: c.status ?? "Unknown",
      reason: c.reason,
      message: c.message,
    })),
  };
}

function toEventLite(event: k8s.CoreV1Event): EventLite {
  return {
    reason: event.reason ?? "Unknown",
    type: event.type ?? "Normal",
    message: event.message ?? "",
    count: event.count ?? 1,
    firstTimestamp: event.firstTimestamp?.toISOString(),
    lastTimestamp: event.lastTimestamp?.toISOString(),
    involvedKind: event.involvedObject?.kind ?? "Unknown",
    involvedName: event.involvedObject?.name ?? "unknown",
  };
}

/** Parses Kubernetes quantity strings into CPU nanoseconds. "950m" -> 950_000_000. */
function cpuToNano(value: string | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const m = /^([\d.]+)m$/.exec(trimmed);
  if (m) return Math.round(parseFloat(m[1]!) * 1e6);
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? Math.round(n * 1e9) : 0;
}

/** Parses Kubernetes quantity strings into bytes. "1536Mi" -> 1_610_612_736. */
function memoryToBytes(value: string | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const m = /^([\d.]+)([KMGTPE]i?|Ki|Mi|Gi|Ti)?$/.exec(trimmed);
  if (!m) return 0;
  const n = parseFloat(m[1]!);
  if (!Number.isFinite(n)) return 0;
  const unit = m[2];
  switch (unit) {
    case "Ki":
      return Math.round(n * 1024);
    case "Mi":
      return Math.round(n * 1024 ** 2);
    case "Gi":
      return Math.round(n * 1024 ** 3);
    case "Ti":
      return Math.round(n * 1024 ** 4);
    case "K":
    case "k":
      return Math.round(n * 1000);
    case "M":
      return Math.round(n * 1000 ** 2);
    case "G":
      return Math.round(n * 1000 ** 3);
    case "T":
      return Math.round(n * 1000 ** 4);
    default:
      return Math.round(n);
  }
}

function toMetricsLite(item: k8s.NodeMetric): NodeMetricsLite {
  return {
    nodeName: item.metadata?.name ?? "unknown",
    cpuUsageNano: cpuToNano(item.usage?.cpu),
    memUsageBytes: memoryToBytes(item.usage?.memory),
  };
}

async function collectStream(stream: unknown): Promise<string> {
  if (typeof stream === "string") return stream;
  if (stream && typeof (stream as Readable).read === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of (stream as Readable)) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return String(stream ?? "");
}

export function createEvidenceApi(core: k8s.CoreV1Api, metrics: k8s.Metrics): EvidenceApi {
  return {
    async listPods(namespace: string): Promise<PodLite[]> {
      const res = await core.listNamespacedPod(namespace);
      return (res.body.items ?? []).map(toPodLite);
    },

    async listNodes(): Promise<NodeLite[]> {
      const res = await core.listNode();
      return (res.body.items ?? []).map(toNodeLite);
    },

    async listNamespaces(): Promise<string[]> {
      const res = await core.listNamespace();
      return (res.body.items ?? [])
        .map((ns) => ns.metadata?.name ?? "")
        .filter((name) => name && name !== "kube-system" && name !== "kube-public");
    },

    async listPodEvents(namespace: string, podName: string): Promise<EventLite[]> {
      const res = await core.listNamespacedEvent(namespace);
      return (res.body.items ?? [])
        .filter((e) => e.involvedObject?.name === podName)
        .sort((a, b) => (b.lastTimestamp?.getTime() ?? 0) - (a.lastTimestamp?.getTime() ?? 0))
        .slice(0, 50)
        .map(toEventLite);
    },

    async readPodLog(
      namespace: string,
      podName: string,
      container: string,
      tailLines: number,
      previous: boolean,
    ): Promise<string> {
      try {
        const res = await core.readNamespacedPodLog(
          podName,
          namespace,
          container || undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          previous,
          undefined,
          tailLines,
          true,
        );
        return await collectStream(res.body);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 400 || status === 404) {
          return `[no logs available${previous ? " from previous container" : ""}]`;
        }
        throw err;
      }
    },

    async getNodeMetrics(): Promise<NodeMetricsLite[]> {
      try {
        const res = await metrics.getNodeMetrics();
        return (res.items ?? []).map(toMetricsLite);
      } catch {
        return [];
      }
    },
  };
}

/** Builds the API against a real cluster: in-cluster config when inside k8s, KUBECONFIG otherwise. */
export function createRealEvidenceApi(): EvidenceApi {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  return createEvidenceApi(kc.makeApiClient(k8s.CoreV1Api), new k8s.Metrics(kc));
}

export function buildClusterSummary(
  nodes: NodeLite[],
  namespaces: string[],
  pods: PodLite[],
  metrics: NodeMetricsLite[],
): ClusterSummary {
  return { nodes, namespaces, pods, metrics };
}

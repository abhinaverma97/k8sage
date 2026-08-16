export interface PodConditionLite {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

export interface PodLite {
  name: string;
  namespace: string;
  phase: string;
  ready: boolean;
  restarts: number;
  ageSeconds: number;
  nodeName?: string;
  reason?: string;
  message?: string;
  containerStatuses: Array<{
    name: string;
    ready: boolean;
    restarts: number;
    state: string;
    reason?: string;
    message?: string;
  }>;
  conditions: PodConditionLite[];
}

export interface NodeLite {
  name: string;
  ready: boolean;
  schedulable: boolean;
  cpuCapacity: string;
  memCapacity: string;
  cpuAllocatable: string;
  memAllocatable: string;
  conditions: PodConditionLite[];
}

export interface EventLite {
  reason: string;
  type: string;
  message: string;
  count: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
  involvedKind: string;
  involvedName: string;
}

export interface NodeMetricsLite {
  nodeName: string;
  cpuUsageNano: number;
  memUsageBytes: number;
}

export interface ClusterSummary {
  nodes: NodeLite[];
  namespaces: string[];
  pods: PodLite[];
  metrics: NodeMetricsLite[];
}

/**
 * Normalized read-only surface over the Kubernetes API.
 * The production implementation wraps @kubernetes/client-node;
 * tests inject a fake. No write operations exist on this interface.
 */
export interface EvidenceApi {
  listPods(namespace: string): Promise<PodLite[]>;
  listNodes(): Promise<NodeLite[]>;
  listNamespaces(): Promise<string[]>;
  listPodEvents(namespace: string, podName: string): Promise<EventLite[]>;
  readPodLog(
    namespace: string,
    podName: string,
    container: string,
    tailLines: number,
    previous: boolean,
  ): Promise<string>;
  getNodeMetrics(): Promise<NodeMetricsLite[]>;
}

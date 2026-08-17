const rawGatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;
export const GATEWAY_URL =
  rawGatewayUrl && rawGatewayUrl.trim().length > 0 ? rawGatewayUrl.trim() : "";

export interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

/** Reads a server-sent-events stream from a fetch response. */
export async function* sseStream(
  url: string,
  init: RequestInit,
): AsyncIterable<SseEvent> {
  const res = await fetch(url, init);
  if (!res.ok || !res.body) {
    throw new Error(`gateway returned ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const yieldIfReady = (): SseEvent | null => {
    if (dataLines.length === 0) return null;
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
    } catch {
      data = { raw: dataLines.join("\n") };
    }
    return { event: eventName, data };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line === "") {
        const evt = yieldIfReady();
        if (evt) yield evt;
        eventName = "message";
        dataLines = [];
        continue;
      }
      if (line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).trimStart();
      if (field === "event") eventName = value;
      else if (field === "data") dataLines.push(value);
    }
  }
  const evt = yieldIfReady();
  if (evt) yield evt;
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools: Array<{ name: string; args: Record<string, unknown> }>;
  error?: string;
}

export interface ClusterSummary {
  nodes: Array<{
    name: string;
    ready: boolean;
    schedulable: boolean;
    cpu: string;
    memory: string;
    usage?: { nodeName: string; cpuUsageNano: number; memUsageBytes: number } | null;
  }>;
  namespaces: string[];
  podCounts: { total: number; ready: number; notReady: number };
  observedNamespace: string;
}

export async function fetchClusterSummary(): Promise<ClusterSummary> {
  const res = await fetch(`${GATEWAY_URL}/api/cluster`);
  if (!res.ok) throw new Error(`cluster endpoint returned ${res.status}`);
  return (await res.json()) as ClusterSummary;
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
  containers: Array<{
    name: string;
    ready: boolean;
    restarts: number;
    state: string;
    reason?: string;
    message?: string;
  }>;
  conditions: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
  }>;
}

export async function fetchPods(): Promise<PodLite[]> {
  const res = await fetch(`${GATEWAY_URL}/api/pods`);
  if (!res.ok) throw new Error(`pods endpoint returned ${res.status}`);
  const data = (await res.json()) as { pods?: PodLite[] };
  return data.pods ?? [];
}

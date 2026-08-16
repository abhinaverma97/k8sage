export interface ChatClient {
  ask(message: string, conversationId: string | null): Promise<AsyncIterable<SseEvent>>;
}

export interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

const SAGE_TIMEOUT_MS = 120_000;

/** Parses an SSE byte stream into discrete events. */
async function* parseSse(body: ReadableStream<Uint8Array>): AsyncIterable<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const flush = (): void => {
    if (dataLines.length > 0 || eventName !== "message") {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
      } catch {
        data = { raw: dataLines.join("\n") };
      }
      current = { event: eventName, data };
    }
  };

  let current: SseEvent | undefined;

  const emit = (): SseEvent | undefined => {
    const evt = current;
    current = undefined;
    return evt;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line === "") {
        flush();
        const evt = emit();
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
  flush();
  const evt = emit();
  if (evt) yield evt;
}

export function createChatClient(sageUrl: string): ChatClient {
  return {
    async ask(message, conversationId) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SAGE_TIMEOUT_MS);
      try {
        const res = await fetch(`${sageUrl}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, conversationId }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`sage returned ${res.status}`);
        }
        return parseSse(res.body);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export interface EvidenceClient {
  clusterSummary(): Promise<unknown>;
}

export function createEvidenceClient(evidenceUrl: string): EvidenceClient {
  return {
    async clusterSummary() {
      const res = await fetch(`${evidenceUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "cluster_summary", args: {} }),
      });
      if (!res.ok) {
        throw new Error(`evidence returned ${res.status}`);
      }
      const data = (await res.json()) as { result?: unknown; error?: string };
      if (data.error) throw new Error(`evidence: ${data.error}`);
      return data.result;
    },
  };
}

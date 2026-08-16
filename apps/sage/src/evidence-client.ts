export interface EvidenceClient {
  runTool(tool: string, args: Record<string, unknown>): Promise<unknown>;
}

const TIMEOUT_MS = 30_000;

export function createEvidenceClient(baseUrl: string): EvidenceClient {
  return {
    async runTool(tool, args) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`${baseUrl}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, args }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`evidence ${tool} failed (${res.status}): ${body.slice(0, 300)}`);
        }
        const data = (await res.json()) as { result?: unknown; error?: string };
        if (data.error) throw new Error(`evidence ${tool}: ${data.error}`);
        return data.result;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

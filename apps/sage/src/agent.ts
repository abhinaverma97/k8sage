import Groq from "groq-sdk";
import type { EvidenceClient } from "./evidence-client.js";

export type AgentEvent =
  | { type: "tool"; name: string; args: Record<string, unknown> }
  | { type: "delta"; text: string };

export interface AgentRunOptions {
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  onEvent?: (event: AgentEvent) => void;
}

export interface Agent {
  tools: ToolDef[];
  run(message: string, options?: AgentRunOptions): Promise<string>;
}

const SYSTEM_PROMPT = `You are K8Sage, an SRE assistant deployed inside a Kubernetes cluster.
You answer operational questions about THIS cluster (nodes, pods, deployments, logs, events).

Rules:
1. Always gather evidence before concluding. If the user asks why something is broken, call the relevant tools (pod_status, pod_events, pod_logs, node_status, cluster_summary) instead of guessing.
2. Cite what you observed. Quote the evidence (restart counts, event reasons, log lines, resource numbers).
3. If the evidence is insufficient or contradictory, say exactly what is missing and what to check next.
4. Be concise. Use short sections or bullets. No fluff.
5. You only have read-only access. Never claim to have changed anything.
6. If a question is outside your scope (not about this cluster), say so in one line.`;

const MAX_TOOL_ROUNDS = 6;

interface ToolDef {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

export const toolDefs: ToolDef[] = [
  {
    name: "cluster_summary",
    description:
      "High-level view of the cluster: nodes (ready state, CPU/memory), namespaces, pod counts, per-node usage.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "pod_status",
    description:
      "Status of pods (phase, ready, restarts, container state, conditions, node). Filter by 'pod' name or 'namespace'.",
    parameters: {
      type: "object",
      properties: {
        pod: { type: "string", description: "Pod name (substring match)" },
        namespace: { type: "string", description: "Namespace" },
      },
      required: [],
    },
  },
  {
    name: "pod_events",
    description: "Kubernetes events for a pod. Often shows the real cause (FailedScheduling, BackOff, ImagePullBackOff).",
    parameters: {
      type: "object",
      properties: {
        pod: { type: "string", description: "Exact pod name" },
        namespace: { type: "string", description: "Namespace" },
      },
      required: ["pod"],
    },
  },
  {
    name: "pod_logs",
    description: "Recent container logs for a pod. Use 'previous': true for logs from the crashed container instance.",
    parameters: {
      type: "object",
      properties: {
        pod: { type: "string", description: "Exact pod name" },
        container: { type: "string", description: "Container name" },
        namespace: { type: "string", description: "Namespace" },
        tail: { type: "number", description: "Lines to return (max 200)" },
        previous: { type: "boolean", description: "Read previous (crashed) container logs" },
      },
      required: ["pod"],
    },
  },
  {
    name: "node_status",
    description: "Node conditions (Ready, MemoryPressure, DiskPressure), allocatable resources, current usage.",
    parameters: {
      type: "object",
      properties: { node: { type: "string", description: "Node name (substring match)" } },
      required: [],
    },
  },
];

export interface LlmMessage {
  role: string;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

interface LlmResponse {
  choices: Array<{ message: LlmMessage }>;
}

interface LlmStreamChunk {
  choices: Array<{
    delta: {
      content?: string | null;
      tool_calls?: Array<{ index?: number; function?: { name?: string; arguments?: string } }>;
    };
    finish_reason?: string | null;
  }>;
}

interface LlmAdapter {
  complete(messages: LlmMessage[]): Promise<LlmResponse>;
  completeStream(messages: LlmMessage[]): AsyncIterable<LlmStreamChunk>;
}

function createGroqAdapter(apiKey: string, model: string): LlmAdapter {
  const client = new Groq({ apiKey });
  const apiTools = toolDefs.map((t) => ({ type: "function" as const, function: t }));
  return {
    async complete(messages) {
      const opts = {
        model,
        messages,
        tools: apiTools,
        tool_choice: "auto",
        temperature: 0.2,
        stream: false,
      } as never;
      return (await client.chat.completions.create(opts)) as unknown as LlmResponse;
    },
    async *completeStream(messages) {
      const opts = {
        model,
        messages,
        tools: apiTools,
        temperature: 0.2,
        stream: true,
      } as never;
      const stream = (await client.chat.completions.create(opts)) as unknown as AsyncIterable<unknown>;
      for await (const chunk of stream) {
        yield chunk as LlmStreamChunk;
      }
    },
  };
}

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function createAgent(options: {
  evidence: EvidenceClient;
  model: string;
  llm?: LlmAdapter;
}): Agent {
  const { evidence, model } = options;
  const llm = options.llm ?? createGroqAdapter(process.env.GROQ_API_KEY ?? "", model);

  async function run(
    message: string,
    agentOptions: AgentRunOptions = {},
  ): Promise<string> {
    const messages: LlmMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(agentOptions.history ?? []).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];
    const toolResultMessages: LlmMessage[] = [];
    let rounds = 0;

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds += 1;
      const response = await llm.complete([...messages, ...toolResultMessages]);
      const msg = response.choices[0]?.message;
      if (!msg?.tool_calls?.length) {
        if (msg?.content) {
          return await streamFinal([...messages, ...toolResultMessages], agentOptions);
        }
        return "I couldn't produce an answer for that. Try rephrasing, or ask about a specific pod or node.";
      }

      for (const call of msg.tool_calls) {
        const name = call.function?.name;
        const args = parseArgs(call.function?.arguments);
        if (!name) continue;
        agentOptions.onEvent?.({ type: "tool", name, args });
        let result: unknown;
        try {
          result = await evidence.runTool(name, args);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }
        toolResultMessages.push({
          role: "assistant",
          content: null,
          tool_calls: msg.tool_calls,
        });
        toolResultMessages.push({
          role: "tool",
          tool_call_id: call.id,
          name,
          content: JSON.stringify(result).slice(0, 24_000),
        });
      }
    }

    return "I hit my tool-call limit without reaching a conclusion. The cluster state may need deeper investigation; here are the tools available: " +
      toolDefs.map((t) => t.name).join(", ") + ".";
  }

  async function streamFinal(
    allMessages: LlmMessage[],
    agentOptions: AgentRunOptions,
  ): Promise<string> {
    let text = "";
    for await (const chunk of llm.completeStream(allMessages)) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        text += delta;
        agentOptions.onEvent?.({ type: "delta", text: delta });
      }
    }
    return text.trim().length > 0 ? text : "(empty response)";
  }

  return {
    tools: toolDefs.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
    run,
  };
}

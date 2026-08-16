import { describe, expect, it } from "vitest";
import { createAgent, type LlmMessage } from "../src/agent.js";
import type { EvidenceClient } from "../src/evidence-client.js";

interface FakeScenario {
  rounds: Array<{
    message: LlmMessage;
    streamChunks?: Array<{ content?: string }>;
  }>;
}

function fakeLlm(scenario: FakeScenario) {
  const callCounts = { completeCalls: 0, streamCalls: 0 };
  return {
    llm: {
      async complete(messages: LlmMessage[]) {
        const round = scenario.rounds[callCounts.completeCalls];
        callCounts.completeCalls += 1;
        if (!round) throw new Error(`unexpected complete() call #${callCounts.completeCalls}`);
        expect(messages.length).toBeGreaterThan(0);
        return { choices: [{ message: round.message }] };
      },
      async *completeStream(messages: LlmMessage[]) {
        const round = scenario.rounds[callCounts.completeCalls - 1];
        callCounts.streamCalls += 1;
        expect(messages.length).toBeGreaterThan(0);
        for (const chunk of round?.streamChunks ?? []) {
          yield { choices: [{ delta: { content: chunk.content } }] };
        }
      },
    },
    callCounts,
  };
}

function fakeEvidence(
  results: Record<string, unknown>,
): EvidenceClient & { calls: Array<{ tool: string; args: Record<string, unknown> }> } {
  const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
  return {
    async runTool(tool, args) {
      calls.push({ tool, args });
      return results[tool] ?? { note: `no fixture for ${tool}` };
    },
    calls,
  };
}

describe("sage agent", () => {
  it("answers directly without tools when no tool calls are requested", async () => {
    const { llm } = fakeLlm({
      rounds: [
        {
          message: { role: "assistant", content: "How many nodes?" },
          streamChunks: [{ content: "How many nodes?" }],
        },
      ],
    });
    const agent = createAgent({ evidence: fakeEvidence({}), model: "fake", llm });
    const answer = await agent.run("how many nodes?");
    expect(answer).toBe("How many nodes?");
  });

  it("runs tools, feeds results back, and streams the final answer", async () => {
    const evidence = fakeEvidence({
      pod_status: [{ name: "orders-abc", restarts: 7, phase: "Running" }],
    });
    const toolCall: LlmMessage = {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call_1",
          function: { name: "pod_status", arguments: '{"pod": "orders"}' },
        },
      ],
    };
    const { llm, callCounts } = fakeLlm({
      rounds: [
        { message: toolCall },
        {
          message: { role: "assistant", content: "It is crashing." },
          streamChunks: [{ content: "It " }, { content: "is " }, { content: "crashing." }],
        },
      ],
    });

    const agent = createAgent({ evidence, model: "fake", llm });
    const events: Array<{ type: string }> = [];
    const answer = await agent.run("why is my pod crashing?", {
      onEvent: (e) => events.push(e),
    });

    expect(evidence.calls).toEqual([{ tool: "pod_status", args: { pod: "orders" } }]);
    expect(answer).toBe("It is crashing.");
    expect(callCounts.completeCalls).toBe(2);
    expect(callCounts.streamCalls).toBe(1);
    expect(events).toEqual([
      { type: "tool", name: "pod_status", args: { pod: "orders" } },
      { type: "delta", text: "It " },
      { type: "delta", text: "is " },
      { type: "delta", text: "crashing." },
    ]);
  });

  it("handles a tool error gracefully and still concludes", async () => {
    const evidence = fakeEvidence({});
    evidence.runTool = async () => {
      throw new Error("evidence is down");
    };
    const toolCall: LlmMessage = {
      role: "assistant",
      content: null,
      tool_calls: [
        { id: "call_1", function: { name: "pod_logs", arguments: '{"pod":"x"}' } },
      ],
    };
    const { llm } = fakeLlm({
      rounds: [
        { message: toolCall },
        {
          message: { role: "assistant", content: "Evidence unavailable." },
          streamChunks: [{ content: "Evidence unavailable." }],
        },
      ],
    });
    const agent = createAgent({ evidence, model: "fake", llm });
    const answer = await agent.run("check logs");
    expect(answer).toBe("Evidence unavailable.");
  });

  it("exposes the tool registry", () => {
    const { llm } = fakeLlm({ rounds: [] });
    const agent = createAgent({ evidence: fakeEvidence({}), model: "fake", llm });
    const names = agent.tools.map((t) => t.name);
    expect(names).toEqual([
      "cluster_summary",
      "pod_status",
      "pod_events",
      "pod_logs",
      "node_status",
    ]);
  });
});

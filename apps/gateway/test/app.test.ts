import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { ChatClient, EvidenceClient, SseEvent } from "../src/clients.js";
import { createMemoryHistoryStore } from "../src/store.js";

function fakeChat(events: Array<Omit<SseEvent, "data"> & { data: Record<string, unknown> }>): ChatClient {
  return {
    async ask(message, _conversationId) {
      expect(typeof message).toBe("string");
      return {
        async *[Symbol.asyncIterator]() {
          for (const e of events) yield e;
        },
      };
    },
  };
}

function fakeEvidence(summary: unknown): EvidenceClient {
  return {
    async clusterSummary() {
      return summary;
    },
  };
}

const deps = {
  chat: fakeChat([]),
  evidence: fakeEvidence({ nodes: [] }),
  history: createMemoryHistoryStore(),
  chatRateLimitMax: 50,
};

describe("gateway HTTP API", () => {
  it("GET /health reports ok", async () => {
    const res = await request(createApp(deps)).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST /api/chat streams SSE events and persists both messages", async () => {
    const app = createApp({
      ...deps,
      chat: fakeChat([
        { event: "tool", data: { name: "pod_status", args: {} } },
        { event: "delta", data: { text: "The " } },
        { event: "delta", data: { text: "pod is crashing." } },
        { event: "done", data: { text: "The pod is crashing." } },
      ]),
    });
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "why is my pod crashing?" });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    const body = res.text;
    expect(body).toContain('event: tool');
    expect(body).toContain('event: delta');
    expect(body).toContain("The pod is crashing.");
    expect(body).toContain('event: done');
    const conversationId = /"conversationId":"([^"]+)"/.exec(body)?.[1];
    expect(conversationId).toBeTruthy();
    const history = await deps.history.getConversation(conversationId!);
    expect(history.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(history[1]?.content).toBe("The pod is crashing.");
  });

  it("POST /api/chat rejects empty messages", async () => {
    const res = await request(createApp(deps)).post("/api/chat").send({ message: "  " });
    expect(res.status).toBe(400);
  });

  it("POST /api/chat emits error event when sage fails", async () => {
    const app = createApp({
      ...deps,
      chat: {
        async ask() {
          throw new Error("sage is down");
        },
      },
    });
    const res = await request(app).post("/api/chat").send({ message: "hello" });
    expect(res.status).toBe(200);
    expect(res.text).toContain("sage is down");
  });

  it("GET /api/cluster returns the cluster summary", async () => {
    const app = createApp({ ...deps, evidence: fakeEvidence({ nodes: [{ name: "n1" }] }) });
    const res = await request(app).get("/api/cluster");
    expect(res.status).toBe(200);
    expect(res.body.nodes[0]?.name).toBe("n1");
  });

  it("GET /api/cluster returns 502 when evidence fails", async () => {
    const app = createApp({
      ...deps,
      evidence: {
        async clusterSummary() {
          throw new Error("evidence unreachable");
        },
      },
    });
    const res = await request(app).get("/api/cluster");
    expect(res.status).toBe(502);
  });

  it("GET /api/history returns stored messages", async () => {
    const app = createApp(deps);
    await deps.history.createConversation("conv-1");
    await deps.history.addMessage("conv-1", "user", "hi");
    await deps.history.addMessage("conv-1", "assistant", "hello");
    const res = await request(app).get("/api/history/conv-1");
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
  });

  it("rate limit blocks excess chat requests", async () => {
    const app = createApp({ ...deps, chatRateLimitMax: 2 });
    for (let i = 0; i < 2; i += 1) {
      await request(app).post("/api/chat").send({ message: `q${i}` });
    }
    const blocked = await request(app).post("/api/chat").send({ message: "q3" });
    expect(blocked.status).toBe(429);
  });
});

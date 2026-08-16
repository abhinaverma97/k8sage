import { createAgent, type Agent, type AgentEvent } from "./agent.js";
import { createEvidenceClient } from "./evidence-client.js";
import type { Express } from "express";
import express from "express";

export const EVIDENCE_URL = process.env.EVIDENCE_URL ?? "http://evidence:8082";

export function createApp(agent: Agent): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "sage" });
  });

  app.get("/tools", (_req, res) => {
    res.json({ tools: agent.tools });
  });

  app.post("/ask", async (req, res) => {
    const { message, conversationId } = (req.body ?? {}) as {
      message?: string;
      conversationId?: string;
    };
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "missing 'message' in request body" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("start", { conversationId: conversationId ?? null });

    try {
      const answer = await agent.run(message, {
        conversationId,
        onEvent: (event: AgentEvent) => {
          if (event.type === "tool") {
            send("tool", { name: event.name, args: event.args });
          } else if (event.type === "delta") {
            send("delta", { text: event.text });
          }
        },
      });
      send("done", { text: answer });
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      send("error", { error: messageText });
    } finally {
      res.end();
    }
  });

  return app;
}

export function createRealAgent(): Agent {
  return createAgent({
    evidence: createEvidenceClient(EVIDENCE_URL),
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  });
}

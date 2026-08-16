import crypto from "node:crypto";
import express from "express";
import type { Express } from "express";
import rateLimit from "express-rate-limit";
import type { ChatClient, EvidenceClient } from "./clients.js";
import type { HistoryStore } from "./store.js";

export interface GatewayDeps {
  chat: ChatClient;
  evidence: EvidenceClient;
  history: HistoryStore;
  chatRateLimitMax?: number;
  allowedOrigin?: string;
}

export function createApp(deps: GatewayDeps): Express {
  const app = express();
  app.use(express.json());

  const allowedOrigin = deps.allowedOrigin ?? "*";
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const chatLimiter = rateLimit({
    windowMs: 60_000,
    limit: deps.chatRateLimitMax ?? 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "rate limit exceeded — try again in a minute" },
  });
  const generalLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gateway" });
  });

  app.post("/api/chat", chatLimiter, async (req, res) => {
    const { message, conversationId } = (req.body ?? {}) as {
      message?: string;
      conversationId?: string;
    };
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "missing 'message' in request body" });
      return;
    }

    const conversation = conversationId ?? crypto.randomUUID();
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let assistantText = "";
    try {
      await deps.history.createConversation(conversation);
      await deps.history.addMessage(conversation, "user", message);
      send("start", { conversationId: conversation });

      const events = await deps.chat.ask(message, conversation);
      for await (const sse of events) {
        if (sse.event === "done") {
          assistantText = String(sse.data.text ?? assistantText);
          await deps.history.addMessage(conversation, "assistant", assistantText);
          send("done", { conversationId: conversation, text: assistantText });
        } else if (sse.event === "error") {
          send("error", sse.data);
        } else {
          if (sse.event === "delta" && typeof sse.data.text === "string") {
            assistantText += sse.data.text;
          }
          send(sse.event, sse.data);
        }
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      send("error", { error: text });
    } finally {
      res.end();
    }
  });

  app.get("/api/cluster", generalLimiter, async (_req, res) => {
    try {
      const summary = await deps.evidence.clusterSummary();
      res.json(summary);
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: text });
    }
  });

  app.get("/api/history/:conversationId", generalLimiter, async (req, res) => {
    const conversationId = String(req.params.conversationId ?? "");
    const messages = await deps.history.getConversation(conversationId);
    res.json({ conversationId, messages });
  });

  return app;
}

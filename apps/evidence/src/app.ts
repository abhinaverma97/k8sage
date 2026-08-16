import express from "express";
import type { Express } from "express";
import { getTool, tools } from "./tools.js";
import type { EvidenceApi } from "./types.js";

export const OBSERVED_NAMESPACE = process.env.OBSERVED_NAMESPACE ?? "default";

export function createApp(api: EvidenceApi): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "evidence", namespace: OBSERVED_NAMESPACE });
  });

  app.get("/tools", (_req, res) => {
    res.json({
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    });
  });

  app.post("/run", async (req, res) => {
    const { tool: toolName, args = {} } = (req.body ?? {}) as {
      tool?: string;
      args?: Record<string, unknown>;
    };
    if (!toolName || typeof toolName !== "string") {
      res.status(400).json({ error: "missing 'tool' in request body" });
      return;
    }
    const tool = getTool(toolName);
    if (!tool) {
      res
        .status(404)
        .json({ error: `unknown tool '${toolName}'`, available: tools.map((t) => t.name) });
      return;
    }
    try {
      const result = await tool.run(args ?? {}, api, OBSERVED_NAMESPACE);
      res.json({ tool: tool.name, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ tool: tool.name, error: message });
    }
  });

  return app;
}

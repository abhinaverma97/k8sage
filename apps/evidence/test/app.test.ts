import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { EvidenceApi } from "../src/types.js";

const api: EvidenceApi = {
  async listPods() {
    return [];
  },
  async listNodes() {
    return [];
  },
  async listNamespaces() {
    return ["default"];
  },
  async listPodEvents() {
    return [];
  },
  async readPodLog() {
    return "logs";
  },
  async getNodeMetrics() {
    return [];
  },
};

const app = createApp(api);

describe("evidence HTTP API", () => {
  it("GET /health reports ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /tools lists the registry", async () => {
    const res = await request(app).get("/tools");
    expect(res.status).toBe(200);
    const names = (res.body.tools as Array<{ name: string }>).map((t) => t.name);
    expect(names).toContain("cluster_summary");
    expect(names).toContain("pod_logs");
  });

  it("POST /run executes a known tool", async () => {
    const res = await request(app)
      .post("/run")
      .send({ tool: "pod_status", args: { pod: "orders" } });
    expect(res.status).toBe(200);
    expect(res.body.tool).toBe("pod_status");
    expect(Array.isArray(res.body.result)).toBe(true);
  });

  it("POST /run rejects an unknown tool", async () => {
    const res = await request(app).post("/run").send({ tool: "delete_everything" });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("unknown tool");
  });

  it("POST /run requires a tool name", async () => {
    const res = await request(app).post("/run").send({});
    expect(res.status).toBe(400);
  });
});

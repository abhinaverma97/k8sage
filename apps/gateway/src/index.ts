import "dotenv/config";
import { createApp } from "./app.js";
import { createChatClient, createEvidenceClient } from "./clients.js";
import { createMemoryHistoryStore, type HistoryStore } from "./store.js";
import { createPgHistoryStore } from "./store-pg.js";

const PORT = Number(process.env.PORT ?? 8080);
const SAGE_URL = process.env.SAGE_URL ?? "http://sage:8081";
const EVIDENCE_URL = process.env.EVIDENCE_URL ?? "http://evidence:8082";
const DATABASE_URL = process.env.DATABASE_URL;

async function main(): Promise<void> {
  const history: HistoryStore | { init(): Promise<void>; close(): Promise<void> } =
    DATABASE_URL ? createPgHistoryStore(DATABASE_URL) : createMemoryHistoryStore();

  if (DATABASE_URL) {
    await (history as unknown as { init(): Promise<void> }).init().catch((err: unknown) => {
      console.error(
        `[gateway] database migration failed: ${err instanceof Error ? err.message : err}`,
      );
      process.exit(1);
    });
  }

  const app = createApp({
    chat: createChatClient(SAGE_URL),
    evidence: createEvidenceClient(EVIDENCE_URL),
    history,
    allowedOrigin: process.env.FRONTEND_ORIGIN ?? "*",
  });

  app.listen(PORT, () => {
    console.log(
      `[gateway] listening on :${PORT} (history: ${DATABASE_URL ? "postgres" : "in-memory"})`,
    );
  });
}

void main();

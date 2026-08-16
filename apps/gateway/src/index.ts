import { createApp } from "./app.js";
import { createChatClient, createEvidenceClient } from "./clients.js";
import { createMemoryHistoryStore } from "./store.js";
import { createPgHistoryStore } from "./store-pg.js";

const PORT = Number(process.env.PORT ?? 8080);
const SAGE_URL = process.env.SAGE_URL ?? "http://sage:8081";
const EVIDENCE_URL = process.env.EVIDENCE_URL ?? "http://evidence:8082";
const DATABASE_URL = process.env.DATABASE_URL;

const history = DATABASE_URL
  ? createPgHistoryStore(DATABASE_URL)
  : createMemoryHistoryStore();

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

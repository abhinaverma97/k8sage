import pg from "pg";
import type { ChatMessage, HistoryStore } from "./store.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export function createPgHistoryStore(
  connectionString: string,
): HistoryStore & { init(): Promise<void>; close(): Promise<void> } {
  const pool = new pg.Pool({ connectionString, max: 5 });

  return {
    async init() {
      await pool.query(SCHEMA);
    },
    async createConversation(id) {
      await pool.query(
        `INSERT INTO conversations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
        [id],
      );
    },
    async addMessage(conversationId, role, content) {
      await pool.query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [conversationId, role, content],
      );
    },
    async getConversation(conversationId) {
      const res = await pool.query(
        `SELECT role, content, created_at FROM messages
         WHERE conversation_id = $1 ORDER BY created_at ASC, id ASC`,
        [conversationId],
      );
      return res.rows.map(
        (row): ChatMessage => ({
          role: row.role as ChatMessage["role"],
          content: row.content,
          createdAt: new Date(row.created_at).toISOString(),
        }),
      );
    },
    async close() {
      await pool.end();
    },
  };
}

export async function migrate(pool: pg.Pool): Promise<void> {
  await pool.query(SCHEMA);
}

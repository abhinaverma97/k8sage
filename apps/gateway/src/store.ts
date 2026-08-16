export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface HistoryStore {
  createConversation(id: string): Promise<void>;
  addMessage(conversationId: string, role: ChatMessage["role"], content: string): Promise<void>;
  getConversation(conversationId: string): Promise<ChatMessage[]>;
}

export function createMemoryHistoryStore(): HistoryStore {
  const conversations = new Map<string, ChatMessage[]>();
  return {
    async createConversation(id) {
      if (!conversations.has(id)) conversations.set(id, []);
    },
    async addMessage(conversationId, role, content) {
      const existing = conversations.get(conversationId);
      if (!existing) throw new Error(`conversation ${conversationId} does not exist`);
      existing.push({ role, content, createdAt: new Date().toISOString() });
    },
    async getConversation(conversationId) {
      return conversations.get(conversationId) ?? [];
    },
  };
}

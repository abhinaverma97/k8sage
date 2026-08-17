"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { GATEWAY_URL, sseStream, type ChatTurn } from "@/lib/api";
import Markdown from "@/components/ui/Markdown";

const SUGGESTIONS = [
  "Why is my pod in CrashLoopBackOff?",
  "List the pods and their restart counts",
  "Are any nodes under memory pressure?",
  "What are the recent events for the gateway pod?",
];

export default function Chat() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setInput("");
    setBusy(true);

    const assistantId = crypto.randomUUID();
    setTurns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed, tools: [] },
      { id: assistantId, role: "assistant", content: "", tools: [] },
    ]);

    try {
      const stream = sseStream(`${GATEWAY_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId: conversationId.current }),
      });
      for await (const sse of stream) {
        if (sse.event === "start") {
          conversationId.current = String(sse.data.conversationId ?? conversationId.current);
        } else if (sse.event === "tool") {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId
                ? {
                    ...t,
                    tools: [
                      ...t.tools,
                      {
                        name: String(sse.data.name ?? "tool"),
                        args: (sse.data.args as Record<string, unknown>) ?? {},
                      },
                    ],
                  }
                : t,
            ),
          );
        } else if (sse.event === "delta") {
          const text = String(sse.data.text ?? "");
          setTurns((prev) =>
            prev.map((t) => (t.id === assistantId ? { ...t, content: t.content + text } : t)),
          );
        } else if (sse.event === "error") {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId
                ? { ...t, error: String(sse.data.error ?? "unknown error") }
                : t,
            ),
          );
        }
      }
    } catch (err) {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId ? { ...t, error: err instanceof Error ? err.message : String(err) } : t,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function newConversation() {
    conversationId.current = null;
    setTurns([]);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl">
          {turns.length === 0 && (
            <div className="mt-24 space-y-6">
              <h2 className="text-xl font-medium tracking-tight text-foreground">
                Ask about this cluster
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Answers are backed by live state: pod status, events, log
                tails, node resources. Read-only by design.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition hover:border-ring hover:text-foreground active:scale-[0.98]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.length > 0 && (
            <div className="flex justify-end pt-1">
              <button
                onClick={newConversation}
                className="rounded-md px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                + new
              </button>
            </div>
          )}

          <div className="mt-4 space-y-8">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`${turn.role === "user" ? "text-foreground" : "text-secondary-foreground"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                      turn.role === "user" ? "text-muted-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {turn.role === "user" ? "You" : "k8sage"}
                  </span>
                  {turn.tools.length > 0 && (
                    <span className="flex flex-wrap gap-1">
                      {turn.tools.map((tool, i) => (
                        <span
                          key={i}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                          title={JSON.stringify(tool.args)}
                        >
                          {tool.name}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {turn.error ? (
                  <p className="text-base text-foreground">
                    <span className="font-mono text-xs text-muted-foreground">error / </span>
                    {turn.error}
                  </p>
                ) : turn.content ? (
                  <Markdown>{turn.content}</Markdown>
                ) : busy && turns[turns.length - 1]?.id === turn.id ? (
                  <p className="animate-pulse font-mono text-sm text-muted-foreground">
                    working…
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-5 pt-2">
        <form
          className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 transition focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this cluster…"
            disabled={busy}
            aria-label="Ask about this cluster"
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 active:scale-[0.96] disabled:opacity-30"
          >
            <ArrowUp size={18} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  );
}

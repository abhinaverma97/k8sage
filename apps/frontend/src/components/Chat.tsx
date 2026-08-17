"use client";

import { useEffect, useRef, useState } from "react";
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

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6">
        {turns.length === 0 && (
          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            <p className="text-sm leading-relaxed text-ink-400">
              Ask about this cluster in plain English. Answers are backed by
              live state: pod status, events, log tails, node resources.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-lg border border-ink-600 px-3.5 py-1.5 text-xs text-ink-300 transition hover:border-ink-400 hover:text-ink-50 active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl divide-y divide-ink-600">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`py-5 ${turn.role === "user" ? "text-ink-100" : "text-ink-200"}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                    turn.role === "user" ? "text-ink-300" : "text-ink-400"
                  }`}
                >
                  {turn.role === "user" ? "you" : "k8sage"}
                </span>
                {turn.tools.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {turn.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-300"
                        title={JSON.stringify(tool.args)}
                      >
                        {tool.name}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {turn.error ? (
                <p className="text-sm text-ink-200">
                  <span className="font-mono text-xs text-ink-400">error / </span>
                  {turn.error}
                </p>
              ) : turn.content ? (
                <Markdown>{turn.content}</Markdown>
              ) : busy && turns[turns.length - 1]?.id === turn.id ? (
                <p className="animate-pulse font-mono text-xs text-ink-400">working…</p>
              ) : null}
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink-600 px-4 py-3">
        <form
          className="mx-auto flex max-w-3xl gap-2"
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
            className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-400 focus:border-ink-300 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-ink-50 px-5 py-2 text-sm font-medium text-ink-950 transition hover:bg-ink-100 active:scale-[0.98] disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

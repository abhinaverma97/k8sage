"use client";

import { useEffect, useRef, useState } from "react";
import { GATEWAY_URL, sseStream, type ChatTurn } from "@/lib/api";

const SUGGESTIONS = [
  "Why is my pod in CrashLoopBackOff?",
  "Show me the cluster status",
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
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {turns.length === 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-slate-400">
              Ask anything about this cluster. K8Sage runs read-only diagnostics and answers with
              evidence — restart counts, events, logs, node resources.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              turn.role === "user"
                ? "ml-auto bg-emerald-900/40 text-emerald-100"
                : "mr-auto border border-slate-800 bg-slate-900 text-slate-200"
            }`}
          >
            {turn.tools.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {turn.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300"
                    title={JSON.stringify(tool.args)}
                  >
                    ◈ {tool.name}
                  </span>
                ))}
              </div>
            )}
            {turn.error ? (
              <p className="text-red-400">⚠ {turn.error}</p>
            ) : turn.content ? (
              <p className="whitespace-pre-wrap">{turn.content}</p>
            ) : busy && turns[turns.length - 1]?.id === turn.id ? (
              <p className="animate-pulse text-slate-500">thinking…</p>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. why is my pod in CrashLoopBackOff?"
            disabled={busy}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

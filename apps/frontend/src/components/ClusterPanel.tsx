"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchClusterSummary, type ClusterSummary } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const gib = bytes / 1024 ** 3;
  return `${gib.toFixed(1)}Gi`;
}

function formatCpu(nano: number): string {
  if (!nano) return "—";
  const cores = nano / 1e9;
  return `${cores.toFixed(2)} cores`;
}

export default function ClusterPanel() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchClusterSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchClusterSummary()
        .then((s) => {
          if (alive) {
            setSummary(s);
            setError(null);
          }
        })
        .catch((err) => {
          if (alive) setError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-full flex-col border-l border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Cluster Status
        </h2>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
        >
          {loading ? "…" : "refresh"}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {error && (
          <div className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {summary && (
          <>
            {summary.podCounts && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border border-slate-800 bg-slate-900 p-2">
                  <div className="text-lg text-slate-100">{summary.podCounts.total}</div>
                  <div className="text-[10px] uppercase text-slate-500">pods</div>
                </div>
                <div className="rounded border border-emerald-900/60 bg-emerald-950/30 p-2">
                  <div className="text-lg text-emerald-300">{summary.podCounts.ready}</div>
                  <div className="text-[10px] uppercase text-slate-500">ready</div>
                </div>
                <div className="rounded border border-amber-900/60 bg-amber-950/30 p-2">
                  <div className="text-lg text-amber-300">{summary.podCounts.notReady}</div>
                  <div className="text-[10px] uppercase text-slate-500">issues</div>
                </div>
              </div>
            )}

            {summary.nodes?.map((node) => {
              const cpuPct = node.usage?.cpuUsageNano
                ? Math.min(100, Math.round((node.usage.cpuUsageNano / 1e9 / 2) * 100))
                : 0;
              return (
                <div key={node.name} className="rounded border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200">{node.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        node.ready
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-red-950 text-red-300"
                      }`}
                    >
                      {node.ready ? "ready" : "not ready"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>cpu {node.cpu}</span>
                      <span>{node.usage ? formatCpu(node.usage.cpuUsageNano) : "—"}</span>
                    </div>
                    <div className="h-1 rounded bg-slate-800">
                      <div
                        className={`h-1 rounded ${cpuPct > 85 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.max(cpuPct, 2)}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>mem {node.memory}</span>
                      <span>{node.usage ? formatBytes(node.usage.memUsageBytes) : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="text-[10px] text-slate-600">
              observing namespace: {summary.observedNamespace}
            </div>
          </>
        )}

        {!summary && !error && (
          <div className="animate-pulse text-xs text-slate-500">loading cluster state…</div>
        )}
      </div>
    </div>
  );
}

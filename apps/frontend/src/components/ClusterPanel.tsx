"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchClusterSummary, type ClusterSummary } from "@/lib/api";
import { formatBytes, formatCpu } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";

export default function ClusterPanel() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchClusterSummary();
      setSummary(s);
      setError(null);
      setUpdatedAt(new Date().toLocaleTimeString());
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
            setUpdatedAt(new Date().toLocaleTimeString());
          }
        })
        .catch((err: unknown) => {
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

  const healthy = summary ? summary.podCounts.notReady === 0 && summary.nodes.every((n) => n.ready) : null;

  return (
    <div className="flex h-full flex-col border-l border-ink-600">
      <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
          Cluster overview
        </h2>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="font-mono text-[11px] text-ink-400 transition hover:text-ink-50 disabled:opacity-40"
        >
          {loading ? "…" : "refresh"}
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-4">
        {error && (
          <div className="rounded-lg border border-ink-600 bg-ink-900 p-3">
            <p className="text-xs text-ink-200">Cluster unreachable</p>
            <p className="mt-1 font-mono text-[10px] text-ink-400">{error}</p>
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-3 divide-x divide-ink-600 rounded-lg border border-ink-600 bg-ink-900 text-center">
              <div className="px-1 py-3">
                <div className="font-mono text-xl text-ink-50">{summary.podCounts.total}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">
                  workloads
                </div>
              </div>
              <div className="px-1 py-3">
                <div className="font-mono text-xl text-ink-50">{summary.podCounts.ready}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">
                  ready
                </div>
              </div>
              <div className="px-1 py-3">
                <div className="font-mono text-xl text-ink-50">{summary.podCounts.notReady}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-400">
                  issues
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-400">Nodes</p>
              {summary.nodes.map((node) => {
                const cpuPct = node.usage?.cpuUsageNano
                  ? Math.min(100, Math.round((node.usage.cpuUsageNano / 1e9 / 2) * 100))
                  : 0;
                const memPct = node.usage?.memUsageBytes
                  ? Math.min(100, Math.round((node.usage.memUsageBytes / 12e9) * 100))
                  : 0;
                return (
                  <div key={node.name} className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-ink-200">{node.name}</span>
                      <span className="flex items-center gap-1.5">
                        {!node.ready && <span className="font-mono text-[10px] text-ink-400">not ready</span>}
                        <StatusDot tone={node.ready ? "ok" : "warn"} />
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      <div>
                        <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                          <span>cpu</span>
                          <span>{formatCpu(node.usage?.cpuUsageNano ?? 0)} / {node.cpu}</span>
                        </div>
                        <div className="h-1 rounded-lg bg-ink-600">
                          <div className="h-1 rounded-lg bg-ink-100" style={{ width: `${Math.max(cpuPct, 2)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                          <span>mem</span>
                          <span>{formatBytes(node.usage?.memUsageBytes ?? 0)} / {node.memory}</span>
                        </div>
                        <div className="h-1 rounded-lg bg-ink-600">
                          <div className="h-1 rounded-lg bg-ink-100" style={{ width: `${Math.max(memPct, 2)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 border-t border-ink-600 pt-3 font-mono text-[10px] text-ink-400">
              <div className="flex justify-between">
                <span>namespace</span>
                <span className="text-ink-300">{summary.observedNamespace}</span>
              </div>
              <div className="flex justify-between">
                <span>updated</span>
                <span className="text-ink-300">{updatedAt ?? "—"}</span>
              </div>
            </div>
          </>
        )}

        {!summary && !error && (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-lg bg-ink-800" />
            <div className="h-24 animate-pulse rounded-lg bg-ink-800" />
          </div>
        )}

        {healthy !== null && (
          <div className="flex items-center gap-2">
            <StatusDot tone={healthy ? "ok" : "warn"} />
            <span className="font-mono text-[11px] text-ink-300">
              {healthy ? "cluster healthy" : "attention required"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

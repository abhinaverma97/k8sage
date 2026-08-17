"use client";

import { useEffect, useState } from "react";
import { fetchClusterSummary, type ClusterSummary } from "@/lib/api";
import { formatBytes, formatCpu } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";

export default function LivePreview() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchClusterSummary()
      .then((s) => {
        if (alive) {
          setSummary(s);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-600 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-600 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <StatusDot tone={loading ? "idle" : error ? "warn" : "ok"} />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
            cluster · live
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink-400">30s refresh</span>
      </div>

      {loading && !summary && (
        <div className="space-y-3 p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-ink-700" />
          <div className="h-10 animate-pulse rounded bg-ink-700" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-ink-700" />
        </div>
      )}

      {error && (
        <div className="p-4">
          <p className="text-sm text-ink-400">Cluster unreachable</p>
          <p className="mt-1 font-mono text-xs text-ink-500">{error}</p>
        </div>
      )}

      {summary && !error && (
        <div className="p-4">
          <div className="grid grid-cols-3 divide-x divide-ink-600 text-center">
            <div className="px-2">
              <div className="font-mono text-2xl text-ink-50">{summary.podCounts.total}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">
                workloads
              </div>
            </div>
            <div className="px-2">
              <div className="font-mono text-2xl text-ink-50">{summary.podCounts.ready}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">ready</div>
            </div>
            <div className="px-2">
              <div className="font-mono text-2xl text-ink-50">{summary.podCounts.notReady}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">issues</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {summary.nodes.map((node) => {
              const cpuPct = node.usage?.cpuUsageNano
                ? Math.min(100, Math.round((node.usage.cpuUsageNano / 1e9 / 2) * 100))
                : 0;
              const memPct = node.usage?.memUsageBytes
                ? Math.min(100, Math.round((node.usage.memUsageBytes / 12e9) * 100))
                : 0;
              return (
                <div key={node.name} className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-200">{node.name}</span>
                    <StatusDot tone={node.ready ? "ok" : "warn"} />
                  </div>
                  <div className="mt-2.5 space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                        <span>cpu</span>
                        <span>
                          {formatCpu(node.usage?.cpuUsageNano ?? 0)} / {node.cpu}
                        </span>
                      </div>
                      <div className="h-1 rounded-lg bg-ink-600">
                        <div className="h-1 rounded-lg bg-ink-100" style={{ width: `${Math.max(cpuPct, 2)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                        <span>mem</span>
                        <span>
                          {formatBytes(node.usage?.memUsageBytes ?? 0)} / {node.memory}
                        </span>
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

          <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-ink-400">
            <span>ns: {summary.observedNamespace}</span>
            <span>read-only</span>
          </div>
        </div>
      )}
    </div>
  );
}

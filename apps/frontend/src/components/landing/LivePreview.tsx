"use client";

import { useEffect, useState } from "react";
import { fetchClusterSummary, type ClusterSummary } from "@/lib/api";
import { formatBytes, formatCpu, parseCpuCores, parseMemoryBytes, formatMemoryString } from "@/lib/format";
import { Card } from "@/components/ui/card";

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
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            cluster · live
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">30s refresh</span>
      </div>

      {loading && !summary && (
        <div className="space-y-4 p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}

      {error && (
        <div className="p-5">
          <p className="text-sm text-foreground">Cluster unreachable</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{error}</p>
        </div>
      )}

      {summary && !error && (
        <div className="p-5">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            <div className="px-2">
              <div className="font-mono text-3xl tracking-tight text-foreground">
                {summary.podCounts.total}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                workloads
              </div>
            </div>
            <div className="px-2">
              <div className="font-mono text-3xl tracking-tight text-foreground">
                {summary.podCounts.ready}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                ready
              </div>
            </div>
            <div className="px-2">
              <div className="font-mono text-3xl tracking-tight text-foreground">
                {summary.podCounts.notReady}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                issues
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {summary.nodes.map((node) => {
              const totalCores = parseCpuCores(node.cpu);
              const cpuPct = node.usage?.cpuUsageNano
                ? Math.min(100, Math.round(((node.usage.cpuUsageNano / 1e9) / totalCores) * 100))
                : 0;
              const totalMemBytes = parseMemoryBytes(node.memory);
              const memPct = node.usage?.memUsageBytes && totalMemBytes > 0
                ? Math.min(100, Math.round((node.usage.memUsageBytes / totalMemBytes) * 100))
                : 0;
              const formattedMemory = formatMemoryString(node.memory);
              return (
                <div key={node.name} className="rounded-md border border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-secondary-foreground">
                      {node.name}
                    </span>
                    <span
                      className={`size-2 rounded-full ${
                        node.ready ? "bg-muted-foreground" : "bg-foreground"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <div className="mb-1 flex items-baseline justify-between gap-2 font-mono text-xs text-muted-foreground">
                        <span className="uppercase tracking-[0.1em]">cpu</span>
                        <span className="text-sm text-foreground">
                          {formatCpu(node.usage?.cpuUsageNano ?? 0)}
                          <span className="text-muted-foreground"> / {node.cpu} {parseInt(node.cpu) === 1 ? "core" : "cores"}</span>
                        </span>
                        <span className="pl-2 font-medium">{cpuPct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-sm bg-muted">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${Math.max(cpuPct, 2)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-baseline justify-between gap-2 font-mono text-xs text-muted-foreground">
                        <span className="uppercase tracking-[0.1em]">mem</span>
                        <span className="text-sm text-foreground">
                          {formatBytes(node.usage?.memUsageBytes ?? 0)}
                          <span className="text-muted-foreground"> / {formattedMemory}</span>
                        </span>
                        <span className="pl-2 font-medium">{memPct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-sm bg-muted">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${Math.max(memPct, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>ns: {summary.observedNamespace}</span>
            <span>read-only</span>
          </div>
        </div>
      )}
    </Card>
  );
}

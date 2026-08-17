"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { fetchClusterSummary, fetchPods, type ClusterSummary, type PodLite } from "@/lib/api";
import { formatBytes, formatCpu } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function podStatus(pod: PodLite): string {
  const containerReason = pod.containers.find((c) => c.reason)?.reason;
  if (containerReason) return containerReason;
  if (pod.reason) return pod.reason;
  return pod.phase;
}

function statusTone(pod: PodLite): "ok" | "warn" | "idle" {
  if (pod.ready) return "ok";
  return pod.phase === "Pending" ? "idle" : "warn";
}

export default function ClusterPanel() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [pods, setPods] = useState<PodLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([fetchClusterSummary(), fetchPods()]);
      setSummary(s);
      setPods(p);
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
      Promise.all([fetchClusterSummary(), fetchPods()])
        .then(([s, p]) => {
          if (alive) {
            setSummary(s);
            setPods(p);
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

  const sorted = [...pods].sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? 1 : -1;
    if (b.restarts !== a.restarts) return b.restarts - a.restarts;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-7xl px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
              Cluster
            </h2>
            {summary && (
              <span className="font-mono text-[11px] text-ink-300">
                {summary.podCounts.ready}/{summary.podCounts.total} ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-ink-400">
            {updatedAt && <span>updated {updatedAt}</span>}
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="rounded border border-ink-600 px-2 py-0.5 transition hover:border-ink-400 hover:text-ink-50 disabled:opacity-40"
            >
              {loading ? "…" : "refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-ink-600 bg-ink-900 p-4">
            <p className="text-sm text-ink-200">Cluster unreachable</p>
            <p className="mt-1 font-mono text-xs text-ink-400">{error}</p>
          </div>
        )}

        {summary && (
          <>
            <div className="mt-4 overflow-hidden rounded-lg border border-ink-600">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-ink-600 bg-ink-900 text-left text-[10px] uppercase tracking-[0.1em] text-ink-400">
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-2 py-2.5 font-medium">Ready</th>
                      <th className="px-2 py-2.5 font-medium">Status</th>
                      <th className="px-2 py-2.5 text-right font-medium">Restarts</th>
                      <th className="px-4 py-2.5 text-right font-medium">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-600/60 bg-ink-950/40">
                    {sorted.map((pod) => {
                      const tone = statusTone(pod);
                      const status = podStatus(pod);
                      const isOpen = expanded === pod.name;
                      const readyStr = pod.containers.length > 0
                        ? `${pod.containers.filter((c) => c.ready).length}/${pod.containers.length}`
                        : pod.ready ? "1/1" : "0/0";
                      return (
                        <Fragment key={pod.name}>
                          <tr
                            onClick={() => setExpanded(isOpen ? null : pod.name)}
                            aria-expanded={isOpen}
                            className="cursor-pointer transition-colors hover:bg-ink-850"
                          >
                            <td className="max-w-[280px] truncate px-4 py-2 text-ink-200" title={pod.name}>
                              <span className={isOpen ? "font-medium text-ink-50" : ""}>
                                {pod.name}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-ink-300">{readyStr}</td>
                            <td className="px-2 py-2">
                              <span
                                className={`flex items-center gap-1.5 ${
                                  tone === "ok"
                                    ? "text-ink-400"
                                    : tone === "warn"
                                      ? "font-medium text-ink-50"
                                      : "italic text-ink-300"
                                }`}
                              >
                                <StatusDot tone={tone} />
                                {status}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right text-ink-300">{pod.restarts}</td>
                            <td className="px-4 py-2 text-right text-ink-300">
                              {formatAge(pod.ageSeconds)}
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-ink-900">
                              <td colSpan={5} className="px-4 py-3 font-mono text-[10px]">
                                <div className="space-y-2">
                                  {pod.containers.map((c) => (
                                    <div key={c.name} className="space-y-0.5">
                                      <div className="flex items-center gap-2 text-ink-200">
                                        <StatusDot
                                          tone={c.ready ? "ok" : c.reason ? "warn" : "idle"}
                                        />
                                        <span className="font-medium text-ink-100">{c.name}</span>
                                        <span className="text-ink-400">
                                          {c.state}
                                          {c.reason ? ` / ${c.reason}` : ""}
                                        </span>
                                        <span className="text-ink-500">restarts {c.restarts}</span>
                                      </div>
                                      {c.message && (
                                        <p className="pl-3 text-ink-400">{c.message}</p>
                                      )}
                                    </div>
                                  ))}
                                  {pod.conditions.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
                                      {pod.conditions.map((cond) => (
                                        <span key={cond.type} className="text-ink-400">
                                          {cond.type}
                                          <span className="text-ink-500">={cond.status}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {pod.nodeName && (
                                    <div className="text-ink-500">node: {pod.nodeName}</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-400">Nodes</p>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {summary.nodes.map((node) => {
                  const cpuPct = node.usage?.cpuUsageNano
                    ? Math.min(100, Math.round((node.usage.cpuUsageNano / 1e9 / 2) * 100))
                    : 0;
                  const memPct = node.usage?.memUsageBytes
                    ? Math.min(100, Math.round((node.usage.memUsageBytes / 12e9) * 100))
                    : 0;
                  return (
                    <div
                      key={node.name}
                      className="rounded-lg border border-ink-600 bg-ink-900 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-mono text-xs text-ink-200">
                          <StatusDot tone={node.ready ? "ok" : "warn"} />
                          {node.name}
                        </span>
                        {!node.ready && (
                          <span className="text-[10px] italic text-ink-300">not ready</span>
                        )}
                      </div>
                      <div className="mt-2.5 space-y-2">
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                            <span>cpu</span>
                            <span>
                              {formatCpu(node.usage?.cpuUsageNano ?? 0)} / {node.cpu}
                            </span>
                          </div>
                          <div className="h-1 rounded-sm bg-ink-600">
                            <div
                              className="h-1 rounded-sm bg-ink-100"
                              style={{ width: `${Math.max(cpuPct, 2)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between font-mono text-[10px] text-ink-400">
                            <span>mem</span>
                            <span>
                              {formatBytes(node.usage?.memUsageBytes ?? 0)} / {node.memory}
                            </span>
                          </div>
                          <div className="h-1 rounded-sm bg-ink-600">
                            <div
                              className="h-1 rounded-sm bg-ink-100"
                              style={{ width: `${Math.max(memPct, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-ink-400">
              <span>
                ns: {summary.observedNamespace} · namespaces: {summary.namespaces.join(", ")}
              </span>
              <span>read-only</span>
            </div>
          </>
        )}

        {!summary && !error && (
          <div className="mt-4 space-y-3">
            <div className="h-8 animate-pulse rounded bg-ink-800" />
            <div className="h-48 animate-pulse rounded bg-ink-800" />
            <div className="h-24 animate-pulse rounded bg-ink-800" />
          </div>
        )}
      </div>
    </div>
  );
}

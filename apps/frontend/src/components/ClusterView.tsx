"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { fetchClusterSummary, fetchPods, type ClusterSummary, type PodLite } from "@/lib/api";
import { formatBytes, formatCpu, parseCpuCores, parseMemoryBytes, formatMemoryString } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatAge(seconds: number | undefined | null): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return "0s";
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function podStatus(pod: PodLite): string {
  const containerReason = pod.containers.find((c) => c.reason)?.reason;
  if (containerReason) return containerReason;
  if (pod.reason) return pod.reason;
  return pod.phase;
}

function StatusBadge({ pod }: { pod: PodLite }) {
  const status = podStatus(pod);
  const failing = !pod.ready && pod.phase !== "Pending";
  const pending = pod.phase === "Pending" && !pod.ready;
  return (
    <Badge
      variant={failing ? "default" : "outline"}
      className={`font-mono text-xs ${
        failing
          ? "bg-primary text-primary-foreground"
          : pending
            ? "italic text-muted-foreground"
            : "text-muted-foreground"
      }`}
    >
      {status}
    </Badge>
  );
}

export default function ClusterView() {
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
  const restartsTotal = pods.reduce((n, p) => n + p.restarts, 0);

  const stats = summary
    ? [
        { label: "Pods", value: `${summary.podCounts.ready}/${summary.podCounts.total}`, sub: "ready" },
        { label: "Restarts", value: String(restartsTotal), sub: "total" },
        {
          label: "Nodes",
          value: `${summary.nodes.filter((n) => n.ready).length}/${summary.nodes.length}`,
          sub: "ready",
        },
        { label: "Namespace", value: summary.observedNamespace, sub: "observed" },
      ]
    : [];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-foreground">Cluster</h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              live state · read-only · auto-refresh 30s
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            {updatedAt && <span>updated {updatedAt}</span>}
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className="rounded-md border border-border px-2.5 py-1 transition hover:border-ring hover:text-foreground disabled:opacity-40"
            >
              {loading ? "…" : "refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Cluster unreachable</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {summary && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-mono text-3xl tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{stat.sub}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Pods
                </h2>
                <span className="font-mono text-xs text-muted-foreground">{sorted.length}</span>
              </div>
              <div className="mt-3 overflow-x-auto scrollbar-thin rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Restarts</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((pod) => {
                      const isOpen = expanded === pod.name;
                      const readyStr = pod.containers.length > 0
                        ? `${pod.containers.filter((c) => c.ready).length}/${pod.containers.length}`
                        : pod.ready ? "1/1" : "0/0";
                      return (
                        <Fragment key={pod.name}>
                          <TableRow
                            onClick={() => setExpanded(isOpen ? null : pod.name)}
                            aria-expanded={isOpen}
                            className="cursor-pointer"
                          >
                            <TableCell className="max-w-[320px]">
                              <span className="flex items-center gap-2 truncate font-mono text-[13px] text-secondary-foreground">
                                <span className="shrink-0 text-muted-foreground">
                                  {isOpen ? (
                                    <CaretDown size={14} weight="bold" />
                                  ) : (
                                    <CaretRight size={14} weight="bold" />
                                  )}
                                </span>
                                <span className="truncate" title={pod.name}>
                                  {pod.name}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[13px] text-muted-foreground">
                              {readyStr}
                            </TableCell>
                            <TableCell>
                              <StatusBadge pod={pod} />
                            </TableCell>
                            <TableCell className="text-right font-mono text-[13px] text-secondary-foreground">
                              {pod.restarts}
                            </TableCell>
                            <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                              {formatAge(pod.ageSeconds)}
                            </TableCell>
                          </TableRow>
                          {isOpen && (
                            <TableRow className="bg-muted/40">
                              <TableCell colSpan={5} className="px-4 py-3">
                                <div className="space-y-2.5 font-mono text-xs">
                                  {pod.containers.map((c) => (
                                    <div key={c.name} className="space-y-0.5">
                                      <div className="flex items-center gap-2 text-secondary-foreground">
                                        <span
                                          className={`size-1.5 rounded-full ${
                                            c.ready ? "bg-muted-foreground" : "bg-foreground"
                                          }`}
                                        />
                                        <span className="font-medium text-foreground">
                                          {c.name}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {c.state}
                                          {c.reason ? ` / ${c.reason}` : ""}
                                        </span>
                                        <span className="text-muted-foreground">
                                          restarts {c.restarts}
                                        </span>
                                      </div>
                                      {c.message && (
                                        <p className="pl-3 text-muted-foreground">{c.message}</p>
                                      )}
                                    </div>
                                  ))}
                                  {pod.conditions.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
                                      {pod.conditions.map((cond) => (
                                        <span key={cond.type} className="text-muted-foreground">
                                          {cond.type}
                                          <span className="text-muted-foreground/60">
                                            ={cond.status}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {pod.nodeName && (
                                    <div className="text-muted-foreground/60">
                                      node: {pod.nodeName}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Nodes
              </h2>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
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
                    <Card key={node.name} className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-mono text-sm text-secondary-foreground">
                          <span
                            className={`size-2 rounded-full ${
                              node.ready ? "bg-muted-foreground" : "bg-foreground"
                            }`}
                          />
                          {node.name}
                        </span>
                        <Badge
                          variant={node.ready ? "outline" : "default"}
                          className={`font-mono text-xs ${
                            node.ready ? "text-muted-foreground" : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {node.ready ? "ready" : "not ready"}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-3.5">
                        <div>
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                              cpu
                            </span>
                            <span className="font-mono text-sm text-foreground">
                              {formatCpu(node.usage?.cpuUsageNano ?? 0)}
                              <span className="text-muted-foreground">
                                {" "}
                                / {node.cpu} {parseInt(node.cpu) === 1 ? "core" : "cores"}
                              </span>
                            </span>
                            <span className="font-mono text-sm text-muted-foreground font-medium pl-2">{cpuPct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-sm bg-muted">
                            <div
                              className="h-full bg-foreground"
                              style={{ width: `${Math.max(cpuPct, 2)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                              mem
                            </span>
                            <span className="font-mono text-sm text-foreground">
                              {formatBytes(node.usage?.memUsageBytes ?? 0)}
                              <span className="text-muted-foreground"> / {formattedMemory}</span>
                            </span>
                            <span className="font-mono text-sm text-muted-foreground font-medium pl-2">{memPct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-sm bg-muted">
                            <div
                              className="h-full bg-foreground"
                              style={{ width: `${Math.max(memPct, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>
                ns: {summary.observedNamespace} · namespaces: {summary.namespaces.join(", ")}
              </span>
              <span>read-only</span>
            </div>
          </>
        )}

        {!summary && !error && (
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
            <div className="h-56 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { fetchClusterSummary, fetchPods } from "@/lib/api";

export default function DashboardStats() {
  const [stats, setStats] = useState<{
    total: number;
    ready: number;
    restarts: number;
    nodes: number;
    namespace: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      Promise.all([fetchClusterSummary(), fetchPods()])
        .then(([s, p]) => {
          if (!alive) return;
          setStats({
            total: s.podCounts.total,
            ready: s.podCounts.ready,
            restarts: p.reduce((n, pod) => n + pod.restarts, 0),
            nodes: s.nodes.length,
            namespace: s.observedNamespace,
          });
        })
        .catch(() => {
          if (alive) setStats(null);
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
    <div className="flex h-12 items-center gap-6 border-b border-ink-600 px-5 font-mono text-[11px]">
      {stats ? (
        <>
          <span className="text-ink-300">
            pods{" "}
            <span className="text-ink-50">
              {stats.ready}/{stats.total}
            </span>
            <span className="text-ink-400"> ready</span>
          </span>
          <span className="text-ink-400">
            restarts <span className="text-ink-50">{stats.restarts}</span>
          </span>
          <span className="hidden text-ink-400 sm:inline">
            nodes <span className="text-ink-50">{stats.nodes}</span>
          </span>
          <span className="hidden text-ink-400 md:inline">
            ns <span className="text-ink-300">{stats.namespace}</span>
          </span>
        </>
      ) : (
        <span className="animate-pulse text-ink-400">collecting cluster state…</span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { fetchClusterSummary, type ClusterSummary } from "@/lib/api";

export default function StatsStrip() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchClusterSummary()
      .then((s) => {
        if (alive) setSummary(s);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!summary && !error) {
    return <div className="h-28 animate-pulse" aria-hidden />;
  }

  const stats = summary
    ? [
        { label: "live workloads", value: String(summary.podCounts.total) },
        { label: "ready", value: `${summary.podCounts.ready}/${summary.podCounts.total}` },
        { label: "nodes", value: String(summary.nodes.length) },
        { label: "access", value: "read-only" },
      ]
    : [
        { label: "live workloads", value: "—" },
        { label: "ready", value: "—" },
        { label: "nodes", value: "—" },
        { label: "access", value: "read-only" },
      ];

  return (
    <section className="mx-auto max-w-7xl px-6">
      <dl className="grid grid-cols-2 divide-x divide-border border-t border-b border-border md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-5 py-7 md:py-9">
            <dd className="font-mono text-3xl tracking-tight text-foreground md:text-4xl">
              {stat.value}
            </dd>
            <dt className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

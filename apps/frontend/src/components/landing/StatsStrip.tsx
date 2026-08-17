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
    return <div className="h-24 animate-pulse" aria-hidden />;
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
    <section className="mx-auto max-w-7xl px-5">
      <dl className="grid grid-cols-2 divide-ink-600 border-t border-b border-ink-600 md:grid-cols-4 md:divide-x">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 py-6 md:py-8">
            <dd className="font-mono text-2xl tracking-tight text-ink-50 md:text-3xl">
              {stat.value}
            </dd>
            <dt className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-400">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

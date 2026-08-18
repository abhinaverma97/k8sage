"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchClusterSummary } from "@/lib/api";
import { StatusDot } from "@/components/ui/StatusDot";

export default function DashboardHeader() {
  const [status, setStatus] = useState<"ok" | "warn" | "idle">("idle");
  const [label, setLabel] = useState("connecting…");

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchClusterSummary()
        .then((s) => {
          if (!alive) return;
          const healthy = s.podCounts.notReady === 0 && s.nodes.every((n) => n.ready);
          setStatus(healthy ? "ok" : "warn");
          setLabel(healthy ? `cluster healthy · ${s.podCounts.ready}/${s.podCounts.total}` : "attention required");
        })
        .catch(() => {
          if (!alive) return;
          setStatus("warn");
          setLabel("cluster unreachable");
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
    <header className="flex h-16 items-center justify-between border-b border-ink-600 px-5">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-sm border border-ink-500 bg-ink-800 font-mono text-[11px] font-medium text-ink-50">
            k8
          </span>
          <span className="font-mono text-sm font-medium tracking-tight text-ink-50">
            k8sage
          </span>
        </Link>
        <span className="hidden font-mono text-xs text-ink-400 sm:inline">dashboard</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-lg border border-ink-600 px-3 py-1 font-mono text-[11px] text-ink-300 md:inline">
          ns: k8sage
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-2.5 py-1 font-mono text-[10px] text-ink-200 sm:px-3 sm:text-[11px]">
          <StatusDot tone={status} />
          {label}
        </span>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Chat from "@/components/Chat";
import ClusterPanel from "@/components/ClusterPanel";

const TABS = [
  { id: "ask", label: "Ask" },
  { id: "cluster", label: "Cluster" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DashboardBody() {
  const [tab, setTab] = useState<TabId>("ask");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Dashboard views"
        className="flex items-end gap-6 border-b border-ink-600 px-5"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2.5 pt-3 font-mono text-xs transition-colors ${
              tab === t.id
                ? "border-ink-50 text-ink-50"
                : "border-transparent text-ink-400 hover:text-ink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "ask" ? <Chat /> : <ClusterPanel />}
      </div>
    </div>
  );
}

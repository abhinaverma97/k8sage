"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";

const cells = [
  {
    title: "Read-only by design",
    body: "Every check runs under a service account with get, list, and watch only. There is no code path that can mutate the cluster.",
    visual: (
      <div className="rounded-md border border-border bg-muted px-4 py-3.5 font-mono text-xs leading-relaxed text-secondary-foreground">
        <p className="text-muted-foreground">verbs:</p>
        <p className="text-foreground">- get</p>
        <p className="text-foreground">- list</p>
        <p className="text-foreground">- watch</p>
        <p className="text-muted-foreground/60">- create&nbsp;&nbsp;&nbsp;&nbsp;# absent</p>
        <p className="text-muted-foreground/60">- update&nbsp;&nbsp;# absent</p>
        <p className="text-muted-foreground/60">- delete&nbsp;&nbsp;# absent</p>
      </div>
    ),
  },
  {
    title: "Answers cite the evidence",
    body: "Before answering, the assistant runs real diagnostics: pod state, events, log tails, node resources.",
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {["pod_status", "pod_events", "pod_logs", "node_status", "cluster_summary"].map((t) => (
          <span
            key={t}
            className="rounded border border-border bg-muted px-2 py-1 font-mono text-[11px] text-secondary-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Streams as it works",
    body: "Tool calls and the answer stream over a single HTTP connection. No spinners, no waiting on a blank screen.",
  },
  {
    title: "Runs anywhere",
    body: "One kustomize overlay drives k3d on a laptop and k3s on a single-node VPS. Same manifests, same result.",
  },
];

export default function Features() {
  const reduce = useReducedMotion();
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Diagnostics without the detective work.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cells.map((cell, i) => (
          <motion.div
            key={cell.title}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className={i === 0 || i === 3 ? "md:col-span-2" : ""}
          >
            <Card className="h-full p-6">
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                {cell.title}
              </h3>
              <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
                {cell.body}
              </p>
              {cell.visual && <div className="mt-5">{cell.visual}</div>}
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

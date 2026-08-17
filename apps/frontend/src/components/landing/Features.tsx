"use client";

import { motion, useReducedMotion } from "motion/react";

const cells = [
  {
    title: "Read-only by design",
    body: "Every check runs under a service account with get, list, and watch only. There is no code path that can mutate the cluster.",
    visual: (
      <div className="rounded-lg border border-ink-600 bg-ink-950 px-3.5 py-3 font-mono text-[11px] leading-relaxed text-ink-300">
        <p className="text-ink-400">verbs:</p>
        <p className="text-ink-100">- get</p>
        <p className="text-ink-100">- list</p>
        <p className="text-ink-100">- watch</p>
        <p className="text-ink-500">- create&nbsp;&nbsp;&nbsp;&nbsp;# absent</p>
        <p className="text-ink-500">- update&nbsp;&nbsp;# absent</p>
        <p className="text-ink-500">- delete&nbsp;&nbsp;# absent</p>
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
            className="rounded-sm border border-ink-600 bg-ink-800 px-2 py-1 font-mono text-[10px] text-ink-200"
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
    <section id="features" className="mx-auto max-w-7xl px-5 py-24">
      <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-ink-50 md:text-4xl">
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
            className={`rounded-lg border border-ink-600 bg-ink-900 p-6 ${
              i === 0 ? "md:col-span-2" : ""
            } ${i === 3 ? "md:col-span-2" : ""}`}
          >
            <h3 className="text-lg font-medium tracking-tight text-ink-50">{cell.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-300">{cell.body}</p>
            {cell.visual && <div className="mt-5">{cell.visual}</div>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

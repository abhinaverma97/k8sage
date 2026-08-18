"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChatTeardropText, MagnifyingGlass, CheckCircle } from "@phosphor-icons/react";

const steps = [
  {
    n: "01",
    title: "Ask Natural SRE Queries",
    body: "Submit operational questions in plain English. “Why is my pod in CrashLoopBackOff?” or “Are any nodes experiencing memory pressure?” No need to manually correlate multiple dashboards.",
    icon: ChatTeardropText,
    badge: "INPUT QUERY",
  },
  {
    n: "02",
    title: "Gather Real-time Evidence",
    body: "The agent decides which read-only diagnostic tool to invoke (`pod_status`, `pod_events`, `pod_logs`, `node_status`, `cluster_summary`). Telemetry is fetched live via the sandboxed Evidence service.",
    icon: MagnifyingGlass,
    badge: "READ-ONLY EXECUTION",
  },
  {
    n: "03",
    title: "Stream Verifiable Answer",
    body: "The assistant synthesizes a grounded answer citing precise log lines, restart counters, and event timestamps with attached tool chips. Streamed token-by-token over Server-Sent Events.",
    icon: CheckCircle,
    badge: "Grounded OUTPUT",
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section id="how" className="w-full border-y border-border/80 bg-muted/10 py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-8 md:px-16 lg:px-24">
        {/* Section Header */}
        <div className="border-b border-border/80 pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Workflow
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Three-stage diagnostic pipeline.
          </h2>
        </div>

        {/* Step Track Hairline Grid */}
        <div className="mt-12 grid gap-px bg-border/60 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col justify-between bg-card/40 backdrop-blur-xs p-8 transition hover:bg-card/60"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="flex size-7 place-items-center justify-center rounded border border-border bg-card font-semibold text-foreground">
                      {step.n}
                    </span>
                    <span className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {step.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Icon size={20} className="text-foreground transition-transform group-hover:scale-110" />
                    <h3 className="font-mono text-base font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>

                <div className="mt-8 border-t border-border/40 pt-4 font-mono text-[11px] text-muted-foreground/60">
                  Step {i + 1} of 3 // Automated Pipeline
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

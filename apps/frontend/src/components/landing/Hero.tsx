"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import LivePreview from "./LivePreview";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-20 md:pt-24 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="max-w-xl text-4xl font-medium leading-[1.08] tracking-tighter text-ink-50 md:text-5xl lg:text-6xl">
          Cluster diagnostics, answered in plain English.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-300">
          Ask about pods, logs, and nodes. K8Sage runs read-only checks against
          your cluster and answers with the evidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-ink-50 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-ink-100 active:scale-[0.98]"
          >
            Open dashboard
          </Link>
          <a
            href="#how"
            className="rounded-full border border-ink-600 px-5 py-2.5 text-sm font-medium text-ink-200 transition hover:border-ink-400 hover:text-ink-50 active:scale-[0.98]"
          >
            How it works
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <LivePreview />
      </motion.div>
    </section>
  );
}

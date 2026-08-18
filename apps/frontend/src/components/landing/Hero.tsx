"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center px-8 py-20 md:px-16 lg:px-24">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl"
      >
        <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight text-foreground md:text-7xl lg:text-8xl">
          Kubernetes diagnostics, <br />
          <span className="text-muted-foreground font-normal">grounded in evidence.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Ask operational queries about your cluster in plain English. K8Sage inspects live pod state, log tails, events, and node metrics through sandboxed read-only RBAC.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded border border-foreground bg-foreground px-7 py-3.5 font-mono text-xs font-semibold text-background transition hover:bg-foreground/90 active:scale-[0.98]"
          >
            <span>Launch Assistant Console</span>
            <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

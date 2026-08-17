"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import LivePreview from "./LivePreview";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-20 md:pt-24 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="max-w-xl text-4xl font-medium leading-[1.08] tracking-tighter text-foreground md:text-5xl lg:text-6xl">
          Cluster diagnostics, answered in plain English.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Ask about pods, logs, and nodes. K8Sage runs read-only checks against
          your cluster and answers with the evidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#how">How it works</a>
          </Button>
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

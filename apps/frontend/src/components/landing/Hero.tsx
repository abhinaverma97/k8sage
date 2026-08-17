"use client";

import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 pt-32 pb-24 text-center md:pt-40 md:pb-32">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl"
      >
        <h1 className="text-5xl font-medium leading-[1.05] tracking-tighter text-foreground md:text-6xl lg:text-7xl">
          From crashing pod to root cause, in one question.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          K8Sage runs the diagnostics and answers with the evidence.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

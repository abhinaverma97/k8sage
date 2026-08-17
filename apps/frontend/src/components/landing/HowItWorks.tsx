"use client";

import { motion, useReducedMotion } from "motion/react";

const steps = [
  {
    n: "01",
    title: "Ask",
    body: "A question in plain English. “Why is my pod in CrashLoopBackOff?” No dashboards to cross-reference.",
  },
  {
    n: "02",
    title: "Evidence",
    body: "Read-only tools query live state: restarts, events, log tails, node capacity. The question is answered from what the cluster says, not from what the model guesses.",
  },
  {
    n: "03",
    title: "Answer",
    body: "A streamed response that cites what it saw, with the tools it ran attached. One HTTP connection, token by token.",
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section id="how" className="mx-auto max-w-7xl px-5 py-24">
      <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-ink-50 md:text-4xl">
        Ask, evidence, answer.
      </h2>
      <div className="mt-10 divide-y divide-ink-600 border-t border-b border-ink-600">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-2 py-7 md:grid-cols-12 md:gap-8"
          >
            <span className="font-mono text-sm text-ink-400 md:col-span-1">{step.n}</span>
            <h3 className="text-xl font-medium tracking-tight text-ink-50 md:col-span-3">
              {step.title}
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-ink-300 md:col-span-8">
              {step.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

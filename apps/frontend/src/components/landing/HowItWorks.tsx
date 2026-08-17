"use client";

import { motion, useReducedMotion } from "motion/react";

const steps = [
  { n: "01", title: "Ask", body: "A question, in English." },
  { n: "02", title: "Evidence", body: "Read-only tools, live state." },
  { n: "03", title: "Answer", body: "Cited, streamed." },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl divide-y divide-border border-y border-border">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-2 py-12 md:grid-cols-12 md:gap-8"
          >
            <span className="font-mono text-sm text-muted-foreground md:col-span-2">
              {step.n}
            </span>
            <h3 className="text-2xl font-medium tracking-tight text-foreground md:col-span-3">
              {step.title}
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground md:col-span-7">
              {step.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

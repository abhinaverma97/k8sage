"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

export default function Hero() {
  return (
    <section className="flex w-full flex-col justify-center px-4 py-12 sm:py-20 sm:px-8 md:px-16 lg:px-24 lg:min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl">
        <h1 className="text-3xl sm:text-5xl font-semibold leading-[1.05] sm:leading-[0.98] tracking-tight text-foreground md:text-7xl lg:text-8xl">
          Kubernetes diagnostics, <br className="hidden sm:inline" />
          <span className="text-muted-foreground font-normal">grounded in evidence.</span>
        </h1>

        <p className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground md:text-xl">
          Ask operational queries about your cluster in plain English. K8Sage inspects live pod state, log tails, events, and node metrics through sandboxed read-only RBAC.
        </p>

        <div className="mt-8 sm:mt-10 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded border border-foreground bg-foreground px-6 sm:px-7 py-3.5 font-mono text-xs font-semibold text-background transition hover:bg-foreground/90 active:scale-[0.98]"
          >
            <span>Launch Assistant Console</span>
            <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

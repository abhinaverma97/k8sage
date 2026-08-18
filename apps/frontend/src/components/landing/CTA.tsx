"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, TerminalWindow } from "@phosphor-icons/react";

export default function CTA() {
  const [copied, setCopied] = useState(false);
  const cmd = "kubectl apply -k k8s/overlays/prod";

  const copyCmd = () => {
    void navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full py-10 sm:py-16 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="relative overflow-hidden border border-border/80 bg-card/60 p-4 sm:p-8 md:p-14">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded border border-border/80 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
              <TerminalWindow size={14} className="text-foreground" />
              <span>READY FOR CLUSTER DEPLOYMENT</span>
            </div>

            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Inspect your Kubernetes workloads with zero guesswork.
            </h2>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-muted-foreground md:text-lg">
              Launch the live interactive assistant console or apply the manifests directly to your k3s/k3d or cloud cluster.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/dashboard"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded border border-foreground bg-foreground px-6 py-3 font-mono text-xs font-semibold text-background transition hover:bg-foreground/90 active:scale-[0.98]"
              >
                <span>Launch Assistant Console</span>
                <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                onClick={copyCmd}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded border border-border bg-card px-4 py-3 font-mono text-xs text-secondary-foreground transition hover:border-ring hover:text-foreground"
              >
                <span className="text-muted-foreground">$</span>
                <span className="max-w-[200px] sm:max-w-none truncate">{cmd}</span>
                {copied ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={14} className="text-muted-foreground shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { ShieldCheck, Wrench, Lightning, HardDrive } from "@phosphor-icons/react";

const featureList = [
  {
    icon: ShieldCheck,
    title: "Read-only by design",
    description: "Every check runs under a dedicated ServiceAccount with get, list, and watch permissions only. Zero risk of cluster mutation.",
  },
  {
    icon: Wrench,
    title: "Evidence tool calling",
    description: "Five specialized tools inspect pod statuses, event logs, log tails, node capacity, and workload counts in real time.",
  },
  {
    icon: Lightning,
    title: "Token-by-token streaming",
    description: "Tool execution events and model deltas stream over a single SSE connection. No static loading spinners or delays.",
  },
  {
    icon: HardDrive,
    title: "Runs on any cluster",
    description: "Declarative Kustomize overlays drive local k3d development as well as multi-node cloud clusters with zero manifest drift.",
  },
];

export default function Features() {
  return (
    <section id="features" className="w-full border-t border-border/60 px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 md:py-24">
      <div className="border-b border-border/80 pb-6 sm:pb-8">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Capabilities
        </span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          Engineered for operational safety.
        </h2>
      </div>

      <div className="mt-8 sm:mt-12 grid gap-px bg-border/60 sm:grid-cols-2">
        {featureList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-card/40 p-4 sm:p-6 md:p-8 transition-colors hover:bg-card/60"
            >
              <div className="flex size-9 place-items-center justify-center rounded border border-border bg-card text-foreground">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 sm:mt-5 font-mono text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

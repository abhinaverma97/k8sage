"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Copy, Check, LockKey } from "@phosphor-icons/react";

const yamlCode = `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: k8sage-evidence-read
rules:
  - apiGroups: [""]
    resources: [pods, pods/log, nodes, namespaces, events, configmaps, services, persistentvolumeclaims]
    verbs: [get, list, watch]
  - apiGroups: ["apps"]
    resources: [deployments, statefulsets, daemonsets, replicasets]
    verbs: [get, list, watch]
  - apiGroups: ["metrics.k8s.io"]
    resources: [nodes, pods]
    verbs: [get, list, watch]`;

export default function Security() {
  const [copied, setCopied] = useState(false);

  const copyYaml = () => {
    void navigator.clipboard.writeText(yamlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="security" className="w-full py-10 sm:py-16 md:py-24 lg:py-32 border-t border-border/60">
      <div className="mx-auto grid w-full items-center gap-6 sm:gap-12 px-4 sm:px-8 md:px-12 lg:grid-cols-12 lg:gap-12 lg:px-16">
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="inline-flex items-center gap-2 rounded border border-border/80 bg-muted/40 px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[11px] sm:text-xs text-muted-foreground">
            <LockKey size={13} className="text-emerald-400 shrink-0" />
            <span>SECURITY ARCHITECTURE</span>
          </div>

          <h2 className="mt-3 text-xl sm:text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Sandboxed read-only permissions.
          </h2>

          <p className="mt-3 sm:mt-6 text-xs sm:text-base leading-relaxed text-muted-foreground">
            The Evidence microservice queries the Kubernetes API under a dedicated ServiceAccount bound to a custom ClusterRole with exactly three verbs: <code className="text-foreground font-mono">get</code>, <code className="text-foreground font-mono">list</code>, and <code className="text-foreground font-mono">watch</code>.
          </p>

          <div className="mt-5 sm:mt-8 space-y-2.5 sm:space-y-4 font-mono text-xs">
            <div className="flex items-start gap-2.5 sm:gap-3 rounded border border-border/60 bg-card p-3 sm:p-4">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-foreground">Zero Write Verbs</span>
                <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground leading-normal">No create, update, delete, exec, or patch verbs are assigned anywhere in the manifests.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 rounded border border-border/60 bg-card p-3 sm:p-4">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-foreground">Isolated Microservice Trust Boundary</span>
                <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-muted-foreground leading-normal">The LLM service (`sage`) has zero direct cluster access; it must request diagnostics through the sandboxed `evidence` API.</p>
              </div>
            </div>
          </div>
        </div>

        {/* YAML Code Block */}
        <div className="lg:col-span-6 xl:col-span-6 lg:border-l lg:border-border/60 lg:pl-12">
          <Card className="overflow-hidden border-border/80 bg-card/90 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-[11px] sm:text-xs font-medium text-foreground">
                  k8s/base/rbac.yaml
                </span>
              </div>

              <button
                onClick={copyYaml}
                className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-card px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[11px] sm:text-xs text-muted-foreground transition hover:text-foreground active:scale-95"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy Manifest"}</span>
              </button>
            </div>

            <pre className="scrollbar-thin overflow-x-auto p-3 sm:p-5 font-mono text-[10px] sm:text-xs leading-normal sm:leading-relaxed text-secondary-foreground">
              {yamlCode}
            </pre>
          </Card>
        </div>
      </div>
    </section>
  );
}

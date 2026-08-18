"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const copyYaml = () => {
    void navigator.clipboard.writeText(yamlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="security" className="w-full py-24 md:py-32 border-t border-border/60">
      <div className="mx-auto grid w-full items-center gap-12 px-8 md:px-12 lg:grid-cols-12 lg:gap-12 lg:px-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6"
        >
          <div className="inline-flex items-center gap-2 rounded border border-border/80 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
            <LockKey size={14} className="text-emerald-400" />
            <span>SECURITY ARCHITECTURE</span>
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Sandboxed read-only permissions.
          </h2>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            The Evidence microservice queries the Kubernetes API under a dedicated ServiceAccount bound to a custom ClusterRole with exactly three verbs: <code className="text-foreground">get</code>, <code className="text-foreground">list</code>, and <code className="text-foreground">watch</code>.
          </p>

          <div className="mt-8 space-y-4 font-mono text-xs">
            <div className="flex items-start gap-3 rounded border border-border/60 bg-card p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-semibold text-foreground">Zero Write Verbs</span>
                <p className="mt-1 text-muted-foreground">No create, update, delete, exec, or patch verbs are assigned anywhere in the manifests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded border border-border/60 bg-card p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-semibold text-foreground">Isolated Microservice Trust Boundary</span>
                <p className="mt-1 text-muted-foreground">The LLM service (`sage`) has zero direct cluster access; it must request diagnostics through the sandboxed `evidence` API.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* YAML Code Block */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 lg:border-l lg:border-border/60 lg:pl-12"
        >
          <Card className="overflow-hidden border-border/80 bg-card/90 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-medium text-foreground">
                  k8s/base/rbac.yaml
                </span>
              </div>

              <button
                onClick={copyYaml}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:text-foreground active:scale-95"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy Manifest"}</span>
              </button>
            </div>

            <pre className="scrollbar-thin overflow-x-auto p-5 font-mono text-xs leading-relaxed text-secondary-foreground">
              {yamlCode}
            </pre>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

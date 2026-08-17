"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";

const rbacLines = [
  ['""', "pods, pods/log, nodes, namespaces, events, configmaps, services, persistentvolumeclaims"],
  ['"apps"', "deployments, statefulsets, daemonsets, replicasets"],
  ['"metrics.k8s.io"', "nodes, pods"],
];

const rbacVerbs = ["get", "list", "watch"];

export default function Security() {
  const reduce = useReducedMotion();
  return (
    <section id="security" className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Security
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Read-only is the whole point.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            The service that talks to your cluster runs under a dedicated
            service account bound to a cluster role that grants three verbs and
            nothing else. No exec, no create, no delete. The worst an answer
            can do is read too much.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                clusterrole · evidence
              </span>
              <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                k8s/rbac.yaml
              </span>
            </div>
            <pre className="scrollbar-thin overflow-x-auto p-5 font-mono text-xs leading-relaxed text-secondary-foreground">
              {`rules:
${rbacLines
  .map(
    ([group, resources]) =>
      `  - apiGroups: [${group}]
    resources: [${resources}]
    verbs: [${rbacVerbs.join(", ")}]`,
  )
  .join("\n")}`}
            </pre>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

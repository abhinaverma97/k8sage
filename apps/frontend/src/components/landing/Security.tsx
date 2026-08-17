"use client";

import { motion, useReducedMotion } from "motion/react";

const rbacLines = [
  ['""', "pods, pods/log, nodes, namespaces, events, configmaps, services, persistentvolumeclaims"],
  ['"apps"', "deployments, statefulsets, daemonsets, replicasets"],
  ['"metrics.k8s.io"', "nodes, pods"],
];

const rbacVerbs = ["get", "list", "watch"];

export default function Security() {
  const reduce = useReducedMotion();
  return (
    <section id="security" className="border-y border-ink-600 bg-ink-900">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
            Security
          </p>
          <h2 className="mt-4 max-w-md text-3xl font-medium tracking-tight text-ink-50 md:text-4xl">
            Read-only is the whole point.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-300">
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
          className="overflow-hidden rounded-lg border border-ink-600 bg-ink-950"
        >
          <div className="flex items-center justify-between border-b border-ink-600 px-4 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
              clusterrole · evidence
            </span>
            <span className="rounded-sm border border-ink-600 px-2 py-0.5 font-mono text-[10px] text-ink-400">
              k8s/rbac.yaml
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-ink-300">
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
        </motion.div>
      </div>
    </section>
  );
}

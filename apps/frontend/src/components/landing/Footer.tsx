import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-muted/20 font-mono text-xs">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 md:px-16 lg:px-24">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand & Status */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded border border-border bg-card font-mono text-[11px] font-semibold text-foreground">
                k8
              </span>
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                k8sage
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              AI SRE assistant deployed inside Kubernetes. Answers queries using live cluster state and evidence.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CLUSTER AGENT OPERATIONAL</span>
            </div>
          </div>

          {/* Col 2: Microservices Stack */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
              Microservices
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="text-foreground">@k8sage/evidence</span> &ndash; k8s API client</li>
              <li><span className="text-foreground">@k8sage/sage</span> &ndash; Groq tool-calling agent</li>
              <li><span className="text-foreground">@k8sage/gateway</span> &ndash; Rate limit &amp; PG store</li>
              <li><span className="text-foreground">@k8sage/frontend</span> &ndash; Next.js dashboard</li>
            </ul>
          </div>

          {/* Col 3: Infrastructure */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
              Infrastructure &amp; IaC
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>OCI Always Free A1.Flex ARM</li>
              <li>k3s / k3d Local Cluster</li>
              <li>Terraform + Cloud-Init</li>
              <li>Kustomize Declarative Base</li>
            </ul>
          </div>

          {/* Col 4: Links & License */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
              Project Links
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a
                  href="https://github.com/abhinaverma97/k8sage"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-foreground"
                >
                  GitHub Repository &rarr;
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-foreground">
                  Interactive Console &rarr;
                </Link>
              </li>
              <li>License: MIT</li>
              <li className="text-muted-foreground/60">Release: v0.1.0</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} K8Sage Project. Open-Source SRE Intelligence.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>TypeScript</span>
            <span>&bull;</span>
            <span>Kubernetes</span>
            <span>&bull;</span>
            <span>Groq LLM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

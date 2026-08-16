# K8Sage — AI SRE that answers questions about your own Kubernetes cluster

K8Sage is a microservices platform running on Kubernetes where an AI assistant
answers operational questions about **the cluster it lives on** — using real
evidence, not guesses. Ask *"why is my pod in CrashLoopBackOff?"* and it pulls
live pod status, events, logs, and node resources via a **read-only, RBAC-scoped
service account**, then answers with the evidence attached.

> Stack: **TypeScript / Express / Next.js** · **k3s on Oracle Cloud Always Free**
> · **Terraform** · **GitHub Actions** · **GHCR** · **Kustomize** · **Groq LLM**

## Architecture

```
sage.itsabhi.in (A record → VPS public IP; Caddy terminates TLS)
        │
  Caddy: /api/* → gateway NodePort 30080 · everything else → frontend NodePort 30081
        │
   ┌────┴──────────┐
   │ frontend      │  Next.js chat UI + live cluster status panel
   └────┬──────────┘
   ┌────┴──────────┐
   │ gateway       │  Express — rate limiting, sessions, chat history API
   └──┬───────┬────┘
   ┌──┴────┐  ┌┴──────┐
   │ sage  │  │evidence│
   │ Express│  │ Express │
   │ Groq   │  │ @kubernetes/ │
   │ tool-  │  │ client-node  │
   │ calling│  │ read-only    │
   └───┬────┘  └──┬────┘
       └──────────┴──────► postgres (StatefulSet + local-path PVC)
```

**Trust model** — the interesting part:

- `evidence` runs under a dedicated ServiceAccount with a ClusterRole that has
  **only `get/list/watch`** verbs on pods, nodes, events, namespaces, metrics,
  etc. No create/update/delete/exec anywhere. The LLM physically cannot mutate
  the cluster.
- The LLM (`sage`) decides which read-only tool to call (`pod_status`,
  `pod_events`, `pod_logs`, `node_status`, `cluster_summary`), executes it
  against `evidence`, and only then writes an answer — grounded, not
  hallucinated.

## Repository layout

```
apps/
  evidence/   Express + @kubernetes/client-node — read-only evidence tools (mock mode included)
  sage/       Express + Groq — tool-calling agent loop, SSE streaming
  gateway/    Express — rate limiting, chat history, SSE passthrough
  frontend/   Next.js — chat UI + cluster status panel
k8s/
  base/       Kustomize base: RBAC, Deployments, Services, HPA, StatefulSet, ConfigMap
  overlays/prod/  NodePorts, resource limits, image tags
  ingress.yaml    Reference Ingress for a dedicated-node (Traefik) path
terraform/    OCI provider: VCN + A1.Flex node(s) + k3s cloud-init (standalone path)
.github/workflows/
  ci.yml         lint + typecheck + test + build on every PR
  cd.yml         multi-arch image build → GHCR → SSH deploy → rollout check
  terraform.yml  fmt/validate on PR; plan/apply via manual dispatch
```

## Why this shape (the interview story)

| Choice | Why |
|---|---|
| **Single-node k3s on Always Free** | A real cluster at $0/month on ARM. No managed EKS (free tier doesn't include workers). |
| **GitHub Actions SSH deploy** | Matches the existing production VPS; `kubectl apply -k` from the box. |
| **Kustomize overlays** | One base, env-specific patches — no copy-pasted YAML. |
| **Immutable image tags** | `kubectl set image`-style pinning via `kustomize edit set image` — no `:latest` drift. |
| **HPA + resource limits** | Declarative autoscaling (min 1 / max 2 on a 1 OCPU box — the pattern, not the scale). |
| **StatefulSet postgres** | Chat history survives restarts via local-path PVC. |
| **Groq, not self-hosted LLM** | Free, fast, no GPU — Ollama is documented future work. |

## Quickstart (local, no cluster needed)

```bash
pnpm install

# 1. evidence in mock mode (fake cluster data)
pnpm --filter @k8sage/evidence dev          # K8SAGE_MOCK=1 → :8082

# 2. sage (needs GROQ_API_KEY)
cp apps/sage/.env.example apps/sage/.env    # add your key
pnpm --filter @k8sage/sage dev              # :8081

# 3. gateway (in-memory history, no DB needed)
pnpm --filter @k8sage/gateway dev           # :8080

# 4. frontend (points at localhost:8080 gateway)
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080 pnpm --filter @k8sage/frontend dev   # :3000
```

Then open http://localhost:3000 and ask "why is my pod in CrashLoopBackOff?".

## Tests

```bash
pnpm -r typecheck
pnpm -r test      # 23 tests across evidence (tools/HTTP), sage (agent loop), gateway (HTTP/SSE)
pnpm -r build
```

## Deploying

Two paths:

1. **Shared VPS (current target)** — k3s on the existing Oracle box, Caddy owns
   80/443, services via NodePort. Full runbook: [`docs/deploy.md`](docs/deploy.md).
2. **Standalone dedicated node** — `terraform/` provisions a free A1.Flex node
   with Traefik enabled; apply `k8s/ingress.yaml`. See `terraform/README.md`.

## Demo script

Interviewer walkthrough with live queries: [`docs/demo.md`](docs/demo.md).

## License

MIT.
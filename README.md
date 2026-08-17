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

## Quickstart

### Run on a real local cluster (k3d) — recommended

A real k3s cluster in Docker, zero mock data, same manifests as production:

```bash
# one-time
winget install --id k3d.k3d
k3d cluster create k8sage --port 30080:30080@server:0 --port 30081:30081@server:0

# build + load images (or let CI push to GHCR and pull)
docker build -f apps/gateway/Dockerfile -t ghcr.io/abhinaverma97/k8sage-gateway:v0.1.0 .
docker build -f apps/sage/Dockerfile -t ghcr.io/abhinaverma97/k8sage-sage:v0.1.0 .
docker build -f apps/evidence/Dockerfile -t ghcr.io/abhinaverma97/k8sage-evidence:v0.1.0 .
docker build -f apps/frontend/Dockerfile -t ghcr.io/abhinaverma97/k8sage-frontend:v0.1.0 \
  --build-arg NEXT_PUBLIC_GATEWAY_URL=http://localhost:30080 .
k3d image import -c k8sage ghcr.io/abhinaverma97/k8sage-{gateway,sage,evidence,frontend}:v0.1.0

# secrets (Groq key in apps/sage/.env) + apply
kubectl -n k8sage create secret generic k8sage-secrets \
  --from-literal=GROQ_API_KEY=<key> --from-literal=POSTGRES_PASSWORD=<pass> \
  --from-literal=DATABASE_URL=postgresql://k8sage:<pass>@postgres.k8sage.svc.cluster.local:5432/k8sage
kubectl apply -k k8s/overlays/prod
```

Open http://localhost:30081 and ask "why is my pod crashing?" — evidence reads the
**real** cluster through its RBAC service account. Note: HPA warnings about
metrics are expected (k3s ships no metrics-server; min:1 holds).

### Process-mode (offline code editing, no cluster)

evidence runs in mock mode; fine for editing code, shows fabricated data:

```bash
pnpm install
K8SAGE_MOCK=1 pnpm --filter @k8sage/evidence dev   # :8082
cp apps/sage/.env.example apps/sage/.env           # add your Groq key
pnpm --filter @k8sage/sage dev                     # :8081
pnpm --filter @k8sage/gateway dev                  # :8080
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080 pnpm --filter @k8sage/frontend dev  # :3000
```

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
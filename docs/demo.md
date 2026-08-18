# Demo script — the 5-minute interviewer walkthrough

Goal: show that the cluster is **live**, that the tool is **grounded in
evidence**, and that the **infrastructure is reproducible** (not a demo on
someone's laptop).

## 0. Setup (10s)

```bash
curl -s https://k8sage.itsabhi.in/api/cluster | head -c 300   # live data
sudo kubectl get nodes,pods -n k8sage                        # what it's watching
```

## 1. The meta moment (30s)

> "This is an SRE assistant deployed on the very cluster it watches. The
> question I'm about to ask is answered from live state — pod restarts, events,
> logs, node capacity — pulled through a read-only service account."

## 2. Ask the killer question (1 min)

Type in the chat:

> **"Why is my pod in CrashLoopBackOff?"**

Expected behavior: the UI shows the tool chips (`◈ pod_status`, `◈ pod_logs`,
`◈ pod_events`) as they fire, then a streamed answer that quotes restart
counts and a log line. This proves the loop: **LLM decides what to check →
evidence service runs it → answer cites real data.**

## 3. Show the RBAC (1 min)

```bash
sudo kubectl get clusterrole k8sage-evidence-read -o yaml | grep -A6 verbs
```

> "Every verb is get/list/watch. No create, no delete, no exec. The LLM
> physically cannot change the cluster — worst case it reads everything."

## 4. Show the pipeline (1 min)

Open the repo's Actions tab:

1. `ci.yml` green — lint, typecheck, 23 tests, build on the PR.
2. `cd.yml` — images built on an **arm64 runner** → pushed to GHCR with an
   **immutable `sha-<commit>` tag** → SSH deploy → `kubectl apply -k` →
   rollout status → health check.
3. `terraform.yml` — fmt + validate on every PR (no credentials), plan/apply
   via manual dispatch.

## 5. Show the IaC (1 min)

```bash
# terraform/terraform.tfvars.example + main.tf
grep -A5 'shape_config' terraform/nodes.tf    # A1.Flex 2 OCPU / 12 GB
grep 'ingress_security_rules' -A4 terraform/main.tf   # security model
```

> "Two free ARM nodes, VCN + security lists + k3s bootstrap via cloud-init —
> the whole cluster is `terraform apply` away."

## 6. The honest caveat (15s)

> "It's one node, so no HA, and postgres is on local-path storage — fine for a
> demo, backed up with pg_dump. The multi-node Terraform path exists with
> `node_count = 2`."

## Backup answers

| Question | Answer |
|---|---|
| Why Express not Go? | TypeScript end-to-end; infra is the product, not the language. `@kubernetes/client-node` is first-class. |
| Why Groq? | Free, fast, no GPU on ARM. Tool-calling built in. |
| Why k3s not EKS? | OCI free tier doesn't include managed workers; k3s gives a real cluster at $0. |
| Why not ArgoCD? | This repo deploys via Actions + SSH (matches the existing stack); GitOps is the documented next step. |
| What would you add? | GitOps (ArgoCD/Flux), Prometheus+Grafana as another evidence source, multi-node, Ollama on-cluster. |
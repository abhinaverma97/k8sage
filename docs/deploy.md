# Deploy runbook — shared Oracle VPS (k3s + Caddy + NodePort)

This is the **default deployment target**: the existing OCI Always Free Ubuntu
box (`92.4.74.77`, 1 OCPU / 6 GB) that already runs Caddy, the OpenCode bot and
Vexa. k3s runs **on the same box**; Caddy keeps owning 80/443.

## Topology

```
k8sage.itsabhi.in (A record → 92.4.74.77)
        │
    Caddy  ── TLS via Let's Encrypt (already configured)
        │
   /api/*  ─────────────►  127.0.0.1:30080   (gateway NodePort)
   everything else ─────►  127.0.0.1:30081   (frontend NodePort)
        │
   k3s (--disable traefik --disable servicelb) on the same box
```

## 1. DNS

Add an A record: `k8sage.itsabhi.in → 92.4.74.77`.

## 2. GitHub secrets

Already used by the other repos; reuse them and add the k8sage-specific ones:

| Secret | Purpose |
|---|---|
| `HOST`, `USER`, `SSH_KEY` | SSH into the VPS (existing) |
| `GROQ_API_KEY` | LLM provider (existing in vexa) |
| `POSTGRES_PASSWORD` | Postgres password (new) |

## 3. First deployment

Push to `main`. `cd.yml` will:

1. Install k3s if missing (`--disable traefik --disable servicelb`).
2. Clone the repo to `/opt/k8sage`.
3. Create the `k8sage` namespace + `k8sage-secrets` Secret (idempotent).
4. Pin immutable image tags (`kustomize edit set image ... :sha-<sha>`).
5. `kubectl apply -k k8s/overlays/prod`, wait for rollouts, health-check the
   NodePorts.

## 4. Caddy

Add a site to `/etc/caddy/Caddyfile`:

```
k8sage.itsabhi.in {
    handle /api/* {
        reverse_proxy 127.0.0.1:30080
    }
    handle {
        reverse_proxy 127.0.0.1:30081
    }
}
```

Reload: `sudo caddy reload --config /etc/caddy/Caddyfile --force`

## 5. Verify

```bash
curl -s https://k8sage.itsabhi.in/api/cluster | head -c 400
curl -s -o /dev/null -w '%{http_code}\n' https://k8sage.itsabhi.in/
```

## Operations

```bash
sudo kubectl get nodes,svc -n k8sage
sudo kubectl get pods -n k8sage
sudo kubectl -n k8sage logs deploy/sage
sudo kubectl -n k8sage logs deploy/evidence   # RBAC denied? evidence never mutates
```

## Capacity math (1 OCPU / 6 GB)

| Workload | Requests | Limits |
|---|---|---|
| k3s (server + local-path) | ~450 MB | — |
| postgres | 256 Mi | 512 Mi |
| sage | 128 Mi | 256 Mi |
| gateway | 64 Mi | 128 Mi |
| evidence | 64 Mi | 128 Mi |
| frontend | 128 Mi | 256 Mi |

~1.8 GB for the stack — comfortable next to the bot and Vexa.

## Known limitations (documented honestly)

- **Single node** — no HA; if the box dies, the cluster dies.
- **local-path storage** — postgres data lives on the node disk. Back it up:
  `sudo kubectl -n k8sage exec postgres-0 -- pg_dump -U k8sage k8sage > backup.sql`
- **HPA won't actually scale** at 1 OCPU — it's the declarative pattern, ready
  when the cluster grows.

## Standalone path (different topology)

Want Traefik ingress + certs in-cluster instead of Caddy? Provision a free
A1.Flex node with `terraform/`, re-enable Traefik, and apply `k8s/ingress.yaml`.
See `terraform/README.md`.
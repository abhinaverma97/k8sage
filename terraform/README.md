# Terraform — k3s on OCI Always Free

Provisions a Kubernetes (k3s) cluster on Oracle Cloud **Always Free** ARM
instances (`VM.Standard.A1.Flex`). This is the **standalone/dedicated-node**
path: Traefik stays enabled so `k8s/ingress.yaml` works as-is. The shared-VPS
path (Caddy + NodePort) is documented in `docs/deploy.md`.

## Free-tier budget

| Resource | Always Free allocation | This module |
|---|---|---|
| A1.Flex ARM | 4 OCPU / 24 GB total | 1 node × 2 OCPU / 12 GB (or 2 nodes, set `node_count`) |
| Block volume | 200 GB total | ~47 GB boot volume per node |

## Prerequisites

- OCI account (home region = `ap-mumbai-1` for free tier)
- An API signing key — OCI Console → User → API Keys → generate (also set
  `OCI_USER_OCID`, `OCI_TENANCY_OCID`, `OCI_FINGERPRINT`, `OCI_PRIVATE_KEY`
  as GitHub secrets for the `terraform.yml` workflow)
- An SSH key pair for the nodes (`~/.ssh/oracle.pub`)

## Usage

```bash
cd terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

`terraform.tfvars.example`:

```hcl
tenancy_ocid       = "ocid1.tenancy.oc1.."
user_ocid          = "ocid1.user.oc1.."
fingerprint        = "aa:bb:cc:..."
private_key_path   = "~/.oci/oci_api_key.pem"
ssh_public_key_path = "~/.ssh/oracle.pub"
node_count         = 1
```

> `terraform.tfvars` and `*.tfstate` are gitignored — never commit credentials
> or state.

## After apply

```bash
ssh ubuntu@<node_public_ip>
sudo cat /etc/rancher/k3s/k3s.yaml   # kubeconfig
sudo kubectl get nodes
```

## CI

`.github/workflows/terraform.yml` runs `fmt -check` + `validate` on every PR
(zero credentials needed) and `plan`/`apply` via manual `workflow_dispatch`
once the OCI secrets are set.

## Notes

- `home_cidr` limits SSH/6443 access; keep `0.0.0.0/0` only for 80/443.
- Single-node storage is `local-path` (no HA). Back up postgres with `pg_dump`.
- Capacity errors (`Out of host capacity`) are common on free tier — retry or
  change `ad_index`.
#!/usr/bin/env bash
# k3s control-plane bootstrap (standalone node path).
# Keeps Traefik enabled so k8s/ingress.yaml works on a dedicated node.
set -euo pipefail

export K3S_TOKEN="${k3s_token}"
export INSTALL_K3S_VERSION="${k3s_version}"
export INSTALL_K3S_EXEC="server --disable servicelb"

echo "[cloud-init] installing k3s server ${k3s_version}..."
curl -sfL https://get.k3s.io | sh -

echo "[cloud-init] writing helper aliases..."
cat >> /home/ubuntu/.bashrc <<'EOF'
alias k='kubectl'
alias kk='sudo kubectl'
EOF
chown ubuntu:ubuntu /home/ubuntu/.bashrc

echo "[cloud-init] done. kubectl: sudo kubectl get nodes"
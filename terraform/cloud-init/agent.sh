#!/usr/bin/env bash
# k3s worker bootstrap (join the control plane at ${server_ip}).
set -euo pipefail

export K3S_TOKEN="${k3s_token}"
export INSTALL_K3S_VERSION="${k3s_version}"
export INSTALL_K3S_EXEC="agent --server https://${server_ip}:6443"

echo "[cloud-init] joining k3s cluster at ${server_ip}..."
curl -sfL https://get.k3s.io | sh -

echo "[cloud-init] done. Verify from the server: kubectl get nodes"
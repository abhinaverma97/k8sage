output "node_public_ips" {
  description = "Public IPs of the k3s nodes."
  value       = oci_core_instance.nodes[*].public_ip
}

output "node_private_ips" {
  description = "Private IPs of the k3s nodes."
  value       = oci_core_instance.nodes[*].private_ip
}

output "k3s_node_names" {
  description = "k3s node names (hostnames)."
  value       = oci_core_instance.nodes[*].display_name
}

output "kubeconfig_command" {
  description = "How to reach the cluster after provisioning (run on node 0)."
  value       = "ssh -i ~/.ssh/oracle ubuntu@${oci_core_instance.nodes[0].public_ip} \"sudo cat /etc/rancher/k3s/k3s.yaml\""
}

output "cluster_token" {
  description = "Cluster join token (k3s)."
  value       = local.cluster_token
  sensitive   = true
}

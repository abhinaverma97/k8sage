provider "oci" {
  region       = var.region
  tenancy_ocid = var.tenancy_ocid
  user_ocid    = var.user_ocid
  fingerprint  = var.fingerprint
  private_key  = file(var.private_key_path)
}

data "oci_identity_tenancy" "tenancy" {
  tenancy_id = var.tenancy_ocid
}

locals {
  compartment_id = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid
  cluster_token  = var.k3s_token != "" ? var.k3s_token : random_password.cluster_token.result
}

resource "random_password" "cluster_token" {
  length  = 32
  special = false
}

# --- Network ---------------------------------------------------------------

resource "oci_core_vcn" "k8sage" {
  compartment_id = local.compartment_id
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "k8sage-vcn"
  dns_label      = "k8sage"
}

resource "oci_core_internet_gateway" "k8sage" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.k8sage.id
  enabled        = true
  display_name   = "k8sage-igw"
}

resource "oci_core_route_table" "k8sage" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.k8sage.id
  display_name   = "k8sage-public-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.k8sage.id
  }
}

resource "oci_core_security_list" "k8sage" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.k8sage.id
  display_name   = "k8sage-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  # SSH
  ingress_security_rules {
    source   = var.home_cidr
    protocol = "6"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # k3s API server (kubectl from your machine)
  ingress_security_rules {
    source   = var.home_cidr
    protocol = "6"
    tcp_options {
      min = 6443
      max = 6443
    }
  }

  # HTTP/HTTPS for the standalone Traefik ingress path
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options {
      min = 80
      max = 80
    }
  }
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Intra-VCN: k3s flannel/wireguard/containerd traffic between nodes
  ingress_security_rules {
    source   = "10.0.0.0/16"
    protocol = "all"
  }
}

resource "oci_core_subnet" "k8sage" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.k8sage.id
  cidr_block     = "10.0.1.0/24"
  display_name   = "k8sage-public-subnet"
  dns_label      = "public"
  route_table_id = oci_core_route_table.k8sage.id
  security_list_ids = [
    oci_core_security_list.k8sage.id
  ]
}

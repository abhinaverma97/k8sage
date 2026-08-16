data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "ubuntu_24_04_arm" {
  compartment_id           = local.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "nodes" {
  count               = var.node_count
  compartment_id      = local.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.ad_index].name
  shape               = "VM.Standard.A1.Flex"
  display_name        = "k8sage-node-${count.index}"

  shape_config {
    ocpus         = var.ocpus
    memory_in_gbs = var.memory_gb
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_24_04_arm.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.k8sage.id
    assign_public_ip = true
    display_name     = "k8sage-node-${count.index}-vnic"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = base64encode(templatefile(
      count.index == 0 ? "${path.module}/cloud-init/server.sh" : "${path.module}/cloud-init/agent.sh",
      {
        k3s_version = var.k3s_version
        k3s_token   = local.cluster_token
        server_ip   = oci_core_instance.nodes[0].private_ip
      }
    ))
  }

  timeouts {
    create = "20m"
  }
}

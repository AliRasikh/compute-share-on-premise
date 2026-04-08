#!/bin/bash
set -e

# ============================================================================
# Sovereign Compute Engine â€” Nomad Container Entrypoint
#
# Generates Nomad configuration from environment variables and starts the agent.
# ============================================================================

ROLE="${NOMAD_ROLE:-client}"
COMPANY="${COMPANY_NAME:-unknown}"
NODE_NAME="${NODE_NAME:-nomad-node}"
SERVER_ADDR="${NOMAD_SERVER_ADDR:-nomad-server:4647}"
DATACENTER="${DATACENTER:-dc1}"
NODE_POOL="${NODE_POOL:-shared}"
CPU_TOTAL="${CPU_TOTAL_COMPUTE:-2000}"
MEMORY_TOTAL="${MEMORY_TOTAL_MB:-1024}"

echo "=========================================="
echo "  Sovereign Compute Engine Node"
echo "=========================================="
echo "  Role:       ${ROLE}"
echo "  Company:    ${COMPANY}"
echo "  Node:       ${NODE_NAME}"
echo "  Server:     ${SERVER_ADDR}"
echo "  Datacenter: ${DATACENTER}"
echo "  CPU:        ${CPU_TOTAL} MHz"
echo "  Memory:     ${MEMORY_TOTAL} MB"
echo "=========================================="

# Fix cgroup mount for running Nomad inside Docker
mkdir -p /sys/fs/cgroup/nomad.slice 2>/dev/null || true

if [ "$ROLE" = "server" ]; then
    # â”€â”€ Server Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    cat > /opt/nomad/config/nomad.hcl << HCLEOF
datacenter = "${DATACENTER}"
data_dir   = "/opt/nomad/data"
bind_addr  = "0.0.0.0"
name       = "${NODE_NAME}"
log_level  = "INFO"

server {
  enabled          = true
  bootstrap_expect = 1

  default_scheduler_config {
    scheduler_algorithm             = "spread"
    memory_oversubscription_enabled = true
    preemption_config {
      batch_scheduler_enabled   = true
      service_scheduler_enabled = true
    }
  }
}

client {
  enabled = false
}

telemetry {
  publish_allocation_metrics = true
  publish_node_metrics       = true
  prometheus_metrics         = true
  collection_interval        = "3s"
  disable_hostname           = true
}

plugin "raw_exec" {
  config {
    enabled = true
  }
}
HCLEOF

else
    # â”€â”€ Client Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    cat > /opt/nomad/config/nomad.hcl << HCLEOF
datacenter = "${DATACENTER}"
data_dir   = "/opt/nomad/data"
bind_addr  = "0.0.0.0"
name       = "${NODE_NAME}"
log_level  = "INFO"

client {
  enabled = true
  servers = ["${SERVER_ADDR}"]
  node_pool = "${NODE_POOL}"

  cpu_total_compute = ${CPU_TOTAL}
  memory_total_mb   = ${MEMORY_TOTAL}

  meta {
    "company"      = "${COMPANY}"
    "datacenter"   = "${DATACENTER}"
    "node_pool"    = "${NODE_POOL}"
    "gpu_type"     = "${GPU_TYPE:-none}"
    "gpu_present"  = "${GPU_PRESENT:-false}"
    "install_date" = "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    "os"           = "linux"
    "role"         = "compute-node"
  }

  reserved {
    cpu    = 100
    memory = 64
  }

  # Disable cgroup enforcement for running inside Docker
  cgroup_parent = "/"
}

telemetry {
  publish_allocation_metrics = true
  publish_node_metrics       = true
  prometheus_metrics         = true
  collection_interval        = "3s"
  disable_hostname           = true
}

plugin "raw_exec" {
  config {
    enabled = true
  }
}
HCLEOF

fi

echo "[OK] Configuration generated"
echo "[->] Starting Nomad agent..."

exec nomad agent -config=/opt/nomad/config/nomad.hcl

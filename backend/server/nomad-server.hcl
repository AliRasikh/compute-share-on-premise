# ============================================================================
# Sovereign Compute Engine — Nomad Server Configuration
# 
# This runs the Nomad server (control plane / scheduler).
# For production, run 3 or 5 server nodes for HA.
# For demo, a single server is fine.
# ============================================================================

datacenter = "dc1"
data_dir   = "/opt/nomad/data"

# Bind to all interfaces so clients can reach us
bind_addr = "0.0.0.0"

# Advertise the machine's actual IP (change for production)
# advertise {
#   http = "YOUR_IP:4646"
#   rpc  = "YOUR_IP:4647"
#   serf = "YOUR_IP:4648"
# }

# ── Server Configuration ────────────────────────────────────────────────────
server {
  enabled = true

  # For demo: 1 server. For production: 3 or 5.
  bootstrap_expect = 1

  # Job GC interval
  job_gc_interval = "5m"

  # Enable scheduler preemption for better resource utilization
  default_scheduler_config {
    scheduler_algorithm             = "spread"
    memory_oversubscription_enabled = true

    preemption_config {
      batch_scheduler_enabled    = true
      system_scheduler_enabled   = true
      service_scheduler_enabled  = true
      sysbatch_scheduler_enabled = true
    }
  }
}

# ── Telemetry — Prometheus Metrics ───────────────────────────────────────────
telemetry {
  publish_allocation_metrics = true
  publish_node_metrics       = true
  prometheus_metrics         = true
  collection_interval        = "5s"
  disable_hostname           = true
}

# ── CORS — Allow API gateway and dashboard direct access ─────────────────────
# The Nomad UI is available at http://SERVER_IP:4646/ui
# API is at http://SERVER_IP:4646/v1/

# ── ACL (uncomment for production) ──────────────────────────────────────────
# acl {
#   enabled = true
# }

# ── Logging ──────────────────────────────────────────────────────────────────
log_level = "INFO"

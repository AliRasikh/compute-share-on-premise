# ============================================================================
# Sovereign Compute Engine — Monitoring Stack
#
# Deploys Prometheus to scrape metrics from all Nomad nodes.
# Prometheus UI is accessible at the allocated port.
#
# Submit with:
#   nomad job run jobs/monitoring.nomad.hcl
# ============================================================================

job "monitoring" {
  datacenters = ["dc1"]
  type        = "service"

  meta {
    workload_type = "infrastructure"
    description   = "Prometheus monitoring for the Sovereign Compute Engine"
  }

  group "prometheus" {
    count = 1

    network {
      port "prometheus_ui" {
        static = 9090
      }
    }

    task "prometheus" {
      driver = "docker"

      config {
        image = "prom/prometheus:v2.51.0"
        ports = ["prometheus_ui"]

        # Mount the config
        volumes = [
          "local/prometheus.yml:/etc/prometheus/prometheus.yml",
        ]
      }

      # Prometheus configuration template
      template {
        destination = "local/prometheus.yml"
        data        = <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Scrape Nomad server metrics
  - job_name: 'nomad-server'
    metrics_path: '/v1/metrics'
    params:
      format: ['prometheus']
    static_configs:
      - targets: ['{{ env "attr.unique.network.ip-address" }}:4646']
        labels:
          role: 'server'

  # Scrape Nomad client metrics (self)
  - job_name: 'nomad-client'
    metrics_path: '/v1/metrics'
    params:
      format: ['prometheus']
    static_configs:
      - targets: ['{{ env "attr.unique.network.ip-address" }}:4646']
        labels:
          role: 'client'

  # Scrape node_exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['{{ env "attr.unique.network.ip-address" }}:9100']
        labels:
          node: '{{ env "node.unique.name" }}'

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
      }

      resources {
        cpu    = 200
        memory = 256
      }

      service {
        name = "prometheus"
        port = "prometheus_ui"

        tags = [
          "monitoring",
          "sovereign-compute",
        ]

        check {
          name     = "prometheus-health"
          type     = "http"
          path     = "/-/healthy"
          interval = "10s"
          timeout  = "2s"
        }
      }
    }
  }
}

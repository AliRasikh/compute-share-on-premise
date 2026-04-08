# ============================================================================
# Sovereign Compute Engine — AI Inference Demo Job
#
# This Nomad job runs a containerized AI inference workload.
# It's scheduled on the least-loaded node in the cluster.
#
# Submit with:
#   nomad job run jobs/ai-inference.nomad.hcl
#
# Or via the API:
#   POST http://localhost:8080/api/v1/jobs/ai-demo
# ============================================================================

job "ai-inference-demo" {
  datacenters = ["dc1"]
  type        = "batch"

  meta {
    workload_type = "ai-inference"
    description   = "Sovereign Compute Engine AI Demo — Federated inference task"
    submitted_by  = "nomad-cli"
  }

  # Use spread scheduling to distribute across nodes
  spread {
    attribute = "${node.unique.id}"
  }

  group "inference" {
    count = 1

    restart {
      attempts = 1
      interval = "5m"
      delay    = "10s"
      mode     = "fail"
    }

    reschedule {
      attempts  = 0
      unlimited = false
    }

    task "ai-task" {
      driver = "docker"

      config {
        image   = "python:3.11-slim"
        command = "python3"
        args    = ["-c", <<EOF
import os, sys, time, json, platform, multiprocessing, random

print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE — AI Inference Task")
print("=" * 60)
print()

# Phase 1: System Info
print("[1/4] Gathering system information...")
info = {
    "hostname": platform.node(),
    "platform": platform.platform(),
    "python": platform.python_version(),
    "cpu_count": multiprocessing.cpu_count(),
    "nomad_alloc_id": os.environ.get("NOMAD_ALLOC_ID", "unknown")[:8],
    "nomad_job_name": os.environ.get("NOMAD_JOB_NAME", "unknown"),
    "nomad_dc": os.environ.get("NOMAD_DC", "unknown"),
}
for k, v in info.items():
    print(f"  {k:>16}: {v}")
print()

# Phase 2: Simulated model loading
print("[2/4] Loading inference model...")
for i in range(5):
    time.sleep(0.5)
    pct = (i + 1) * 20
    bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
    print(f"  [{bar}] {pct}%")
print("  Model loaded successfully!")
print()

# Phase 3: CPU-intensive computation
print("[3/4] Running inference computation...")
start = time.time()

size = 300
print(f"  Computing {size}x{size} matrix multiplication...")
A = [[random.random() for _ in range(size)] for _ in range(size)]
B = [[random.random() for _ in range(size)] for _ in range(size)]
result_val = 0
for i in range(min(100, size)):
    for j in range(min(100, size)):
        val = sum(A[i][k] * B[k][j] for k in range(min(100, size)))
        result_val += val

elapsed = time.time() - start
print(f"  Computation complete in {elapsed:.2f}s")
print(f"  Result checksum: {result_val:.4f}")
print()

# Phase 4: Response
print("[4/4] Generating response...")
print()

response = (
    "Digital sovereignty ensures that data and technology remain under the "
    "control of the entities that generate them. The EU promotes this through "
    "GAIA-X and federated infrastructure. The Sovereign Compute Engine "
    "demonstrates peer-to-peer compute sharing across trusted organizations."
)

print("RESPONSE:")
for char in response:
    sys.stdout.write(char)
    sys.stdout.flush()
    time.sleep(0.01)
print()
print()

result = {
    "status": "completed",
    "response": response,
    "compute_time_seconds": round(elapsed, 2),
    "node": platform.node(),
    "cpu_cores": multiprocessing.cpu_count(),
    "alloc_id": os.environ.get("NOMAD_ALLOC_ID", "unknown")[:8],
}

print("=" * 60)
print(json.dumps(result, indent=2))
print("=" * 60)
print("Task completed successfully!")
EOF
        ]
      }

      resources {
        cpu    = 500    # 500 MHz
        memory = 256    # 256 MB
      }

      logs {
        max_files     = 3
        max_file_size = 10
      }
    }
  }
}

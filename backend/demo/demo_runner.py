# ============================================================================
# Sovereign Compute Engine — Demo Workloads
#
# These are the actual workloads that run when you click "Compute".
# Each one demonstrates a different use case for the federated cluster.
#
# DEMO SCRIPT: Run these from any machine that can reach the API:
#
#   1. python demo_runner.py inference    → AI text analysis
#   2. python demo_runner.py matrix       → Distributed matrix computation
#   3. python demo_runner.py stress       → CPU stress test (shows metrics)
#   4. python demo_runner.py pipeline     → Full ML pipeline simulation
#   5. python demo_runner.py all          → Run all demos sequentially
#
# ============================================================================

import sys
import json
import time
import argparse

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

API_URL = "http://localhost:8080"


# ── Color output ─────────────────────────────────────────────────────────────
class C:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    END = "\033[0m"


def banner():
    print(f"""{C.CYAN}
  ╔═══════════════════════════════════════════════════════╗
  ║     ⚡ SOVEREIGN COMPUTE ENGINE — Demo Runner        ║
  ║     Federated Compute for the EU                     ║
  ╚═══════════════════════════════════════════════════════╝
{C.END}""")


def check_cluster():
    """Check cluster health before running demos."""
    print(f"{C.BOLD}Checking cluster status...{C.END}")
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        health = r.json()
        nomad_ok = health.get("nomad", {}).get("connected", False)
        print(f"  API:   {C.GREEN}✓ Running{C.END}")
        
        if nomad_ok:
            print(f"  Nomad: {C.GREEN}✓ Connected{C.END}")
        else:
            print(f"  Nomad: {C.RED}✗ Not connected{C.END}")
            return False
        
        # Check nodes
        r = requests.get(f"{API_URL}/api/v1/nodes", timeout=5)
        nodes = r.json()
        total = nodes["summary"]["total"]
        ready = nodes["summary"]["ready"]
        companies = nodes["summary"]["companies"]
        
        print(f"  Nodes: {C.GREEN}{ready}/{total} ready{C.END}")
        print(f"  Companies: {C.CYAN}{', '.join(companies)}{C.END}")
        print()
        return ready > 0
    except Exception as e:
        print(f"  {C.RED}✗ Cannot reach API at {API_URL}: {e}{C.END}")
        return False


def show_metrics():
    """Display current cluster metrics."""
    r = requests.get(f"{API_URL}/api/v1/metrics")
    m = r.json()
    cl = m["cluster"]
    
    print(f"\n{C.BOLD}📊 Cluster Metrics:{C.END}")
    print(f"  CPU:    {cl['cpu']['used_mhz']}/{cl['cpu']['total_mhz']} MHz ({cl['cpu']['percent']}%)")
    print(f"  Memory: {cl['memory']['used_mb']}/{cl['memory']['total_mb']} MB ({cl['memory']['percent']}%)")
    print(f"  Jobs:   {cl['jobs']['running']} running, {cl['jobs']['pending']} pending")
    print(f"  Allocs: {cl['allocations']['running']} running")
    
    if m.get("nodes"):
        print(f"\n  {C.BOLD}Per-Node:{C.END}")
        for n in m["nodes"]:
            status_icon = "🟢" if n["status"] == "ready" else "🔴"
            print(f"    {status_icon} {n['name']:20s} │ {n['company']:20s} │ "
                  f"CPU: {n['cpu']['percent']:5.1f}% │ "
                  f"MEM: {n['memory']['percent']:5.1f}% │ "
                  f"Allocs: {n['allocations']}")


def wait_for_job(job_id: str, timeout: int = 120):
    """Wait for a job to complete and show progress."""
    start = time.time()
    last_status = ""
    
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{API_URL}/api/v1/jobs/{job_id}")
            data = r.json()
            job = data["job"]
            allocs = data.get("allocations", [])
            
            status = job["status"]
            if status != last_status:
                print(f"  Status: {C.YELLOW}{status}{C.END}")
                last_status = status
            
            # Show allocation details
            for alloc in allocs:
                alloc_status = alloc.get("status", "unknown")
                node = alloc.get("node_name", "?")
                
                if alloc_status == "running":
                    print(f"  → Running on: {C.GREEN}{node}{C.END}")
                elif alloc_status == "complete":
                    print(f"  → {C.GREEN}Completed on: {node}{C.END}")
                    
                    # Show task details
                    for task_name, task_info in alloc.get("task_states", {}).items():
                        state = task_info.get("state", "?")
                        print(f"    Task '{task_name}': {state}")
                    
                    return True
                elif alloc_status == "failed":
                    print(f"  → {C.RED}Failed on: {node}{C.END}")
                    return False
            
            if status == "dead":
                # Check if it completed successfully
                for alloc in allocs:
                    if alloc.get("status") == "complete":
                        return True
                return False
                
        except Exception as e:
            pass
        
        time.sleep(2)
    
    print(f"  {C.RED}Timeout after {timeout}s{C.END}")
    return False


# ============================================================================
# DEMO 1: AI Text Inference
# ============================================================================
def demo_inference():
    """
    🤖 AI Inference Demo
    
    Shows: AI-style text processing running on a federated node.
    What the audience sees: A job is submitted, scheduled on the best node,
    and produces AI-generated text output.
    """
    print(f"\n{C.CYAN}{'='*60}")
    print(f"  🤖 DEMO 1: AI Text Inference")
    print(f"{'='*60}{C.END}\n")
    
    print("Submitting AI inference workload to the cluster...")
    print("The scheduler will pick the best available node.\n")
    
    r = requests.post(f"{API_URL}/api/v1/jobs/ai-demo", json={
        "name": "demo-ai-inference",
        "prompt": "Analyze the impact of digital sovereignty on EU cloud computing strategy",
        "cpu": 1000,
        "memory": 512,
    })
    
    result = r.json()
    job_id = result.get("job_id", "demo-ai-inference")
    print(f"  Job ID:  {C.GREEN}{job_id}{C.END}")
    print(f"  Eval ID: {result.get('eval_id', 'N/A')[:8]}...")
    print(f"  Target:  {result.get('target_company', 'any')}")
    print()
    
    show_metrics()
    
    print(f"\n{C.BOLD}Waiting for completion...{C.END}")
    success = wait_for_job(job_id)
    
    if success:
        show_metrics()
        print(f"\n{C.GREEN}✓ AI Inference demo completed!{C.END}")
    else:
        print(f"\n{C.RED}✗ AI Inference demo failed{C.END}")
    
    return success


# ============================================================================
# DEMO 2: Distributed Matrix Computation
# ============================================================================
def demo_matrix():
    """
    📐 Distributed Matrix Computation
    
    Shows: Heavy computation distributed across multiple nodes.
    What the audience sees: 3 parallel jobs, each running on a different
    company's hardware, computing parts of a large matrix operation.
    """
    print(f"\n{C.CYAN}{'='*60}")
    print(f"  📐 DEMO 2: Distributed Matrix Computation")
    print(f"{'='*60}{C.END}\n")
    
    print("Submitting 3 parallel matrix computation jobs...")
    print("Each will be scheduled on a different node.\n")
    
    job_ids = []
    for i, (name, size, company) in enumerate([
        ("matrix-alpha", 800, "alpha-technologies"),
        ("matrix-beta", 1200, "beta-systems"),
        ("matrix-gamma", 600, "gamma-data"),
    ]):
        script = _matrix_script(size, i)
        
        job_spec = {
            "job_spec": {
                "Job": {
                    "ID": name,
                    "Name": name,
                    "Type": "batch",
                    "Datacenters": ["eu-west", "eu-central"],
                    "Meta": {"workload_type": "matrix-computation", "partition": str(i)},
                    "Constraints": [{
                        "LTarget": "${meta.company}",
                        "RTarget": company,
                        "Operand": "=",
                    }],
                    "TaskGroups": [{
                        "Name": "compute",
                        "Count": 1,
                        "RestartPolicy": {"Attempts": 0, "Mode": "fail"},
                        "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                        "Tasks": [{
                            "Name": "matrix-mul",
                            "Driver": "raw_exec",
                            "Config": {
                                "command": "/usr/local/bin/python3",
                                "args": ["-c", script],
                            },
                            "Resources": {"CPU": 800, "MemoryMB": 256},
                        }],
                    }],
                }
            }
        }
        
        r = requests.post(f"{API_URL}/api/v1/jobs", json=job_spec)
        result = r.json()
        print(f"  [{i+1}/3] {C.GREEN}{name}{C.END} → target: {company}")
        job_ids.append(name)
    
    show_metrics()
    
    print(f"\n{C.BOLD}Waiting for all jobs...{C.END}")
    for jid in job_ids:
        print(f"\n  Tracking: {jid}")
        wait_for_job(jid, timeout=90)
    
    show_metrics()
    print(f"\n{C.GREEN}✓ Distributed matrix computation complete!{C.END}")


# ============================================================================
# DEMO 3: CPU Stress Test (Best for showing metrics)
# ============================================================================
def demo_stress():
    """
    🔥 CPU Stress Test
    
    Shows: Real CPU load on specific nodes — great for dashboard metrics demo.
    What the audience sees: CPU gauges spike on targeted nodes.
    """
    print(f"\n{C.CYAN}{'='*60}")
    print(f"  🔥 DEMO 3: CPU Stress Test")
    print(f"{'='*60}{C.END}\n")
    
    print("Submitting CPU stress workload to beta-systems node...")
    print("Watch the CPU metrics spike on the dashboard!\n")
    
    stress_script = '''
import time, os, multiprocessing, sys

print("=" * 50)
print("  CPU STRESS TEST — Sovereign Compute Engine")
print("=" * 50)
print(f"  Node: {os.uname().nodename}")
print(f"  CPUs: {multiprocessing.cpu_count()}")
print()

def cpu_burn(duration):
    """Burn CPU for the specified duration."""
    end_time = time.time() + duration
    x = 0
    while time.time() < end_time:
        x += 1
        _ = x ** 0.5

cores = min(multiprocessing.cpu_count(), 2)
duration = 30  # seconds

print(f"[START] Stressing {cores} cores for {duration}s...")

from multiprocessing import Process
procs = []
for i in range(cores):
    p = Process(target=cpu_burn, args=(duration,))
    p.start()
    procs.append(p)
    print(f"  Core {i}: burning")

# Print progress
for sec in range(duration):
    pct = (sec + 1) / duration * 100
    bar = "#" * int(pct / 5) + "-" * (20 - int(pct / 5))
    print(f"  [{bar}] {pct:.0f}% ({sec+1}/{duration}s)")
    time.sleep(1)

for p in procs:
    p.join()

print()
print("[DONE] Stress test complete!")
print(f"  Peak CPU cores used: {cores}")
'''
    
    job_spec = {
        "job_spec": {
            "Job": {
                "ID": "demo-stress-test",
                "Name": "demo-stress-test",
                "Type": "batch",
                "Datacenters": ["eu-west", "eu-central"],
                "Meta": {"workload_type": "stress-test"},
                "TaskGroups": [{
                    "Name": "stress",
                    "Count": 1,
                    "RestartPolicy": {"Attempts": 0, "Mode": "fail"},
                    "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                    "Tasks": [{
                        "Name": "stress-cpu",
                        "Driver": "raw_exec",
                        "Config": {
                            "command": "/usr/local/bin/python3",
                            "args": ["-c", stress_script],
                        },
                        "Resources": {"CPU": 2000, "MemoryMB": 128},
                    }],
                }],
            }
        }
    }
    
    r = requests.post(f"{API_URL}/api/v1/jobs", json=job_spec)
    result = r.json()
    print(f"  Job submitted: {C.GREEN}{result.get('eval_id', 'N/A')[:8]}...{C.END}")
    
    # Show metrics every 5 seconds during the stress test
    print(f"\n{C.BOLD}Monitoring metrics during stress test...{C.END}")
    for i in range(8):
        time.sleep(5)
        show_metrics()
    
    wait_for_job("demo-stress-test", timeout=60)
    print(f"\n{C.GREEN}✓ Stress test complete! Check the dashboard metrics.{C.END}")


# ============================================================================
# DEMO 4: Full ML Pipeline Simulation
# ============================================================================

def demo_pipeline():
    """
    🔬 ML Pipeline Simulation
    
    Shows: A multi-stage ML pipeline distributed across the cluster.
    What the audience sees: 3 sequential stages (data prep → training → eval)
    each running on a different company's node.
    """
    print(f"\n{C.CYAN}{'='*60}")
    print(f"  🔬 DEMO 4: ML Pipeline Simulation")
    print(f"{'='*60}{C.END}\n")
    
    stages = [
        ("pipeline-1-dataprep", "Data Preparation", "gamma-data", _pipeline_stage_script(1, "data_preparation")),
        ("pipeline-2-training", "Model Training", "beta-systems", _pipeline_stage_script(2, "model_training")),
        ("pipeline-3-evaluation", "Model Evaluation", "alpha-technologies", _pipeline_stage_script(3, "model_evaluation")),
    ]
    
    for job_id, stage_name, company, script in stages:
        print(f"\n{C.BOLD}Stage: {stage_name}{C.END} → {company}")
        
        job_spec = {
            "job_spec": {
                "Job": {
                    "ID": job_id,
                    "Name": job_id,
                    "Type": "batch",
                    "Datacenters": ["eu-west", "eu-central"],
                    "Meta": {
                        "workload_type": "ml-pipeline",
                        "stage": stage_name,
                        "pipeline_id": "demo-pipeline-001",
                    },
                    "Constraints": [{
                        "LTarget": "${meta.company}",
                        "RTarget": company,
                        "Operand": "=",
                    }],
                    "TaskGroups": [{
                        "Name": "pipeline",
                        "Count": 1,
                        "RestartPolicy": {"Attempts": 0, "Mode": "fail"},
                        "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                        "Tasks": [{
                            "Name": stage_name.lower().replace(" ", "-"),
                            "Driver": "raw_exec",
                            "Config": {
                                "command": "/usr/local/bin/python3",
                                "args": ["-c", script],
                            },
                            "Resources": {"CPU": 500, "MemoryMB": 256},
                        }],
                    }],
                }
            }
        }
        
        r = requests.post(f"{API_URL}/api/v1/jobs", json=job_spec)
        print(f"  Submitted: {C.GREEN}{job_id}{C.END}")
        
        success = wait_for_job(job_id, timeout=60)
        if not success:
            print(f"  {C.RED}Stage failed! Aborting pipeline.{C.END}")
            return
        
        show_metrics()
    
    print(f"\n{C.GREEN}✓ ML Pipeline complete! All 3 stages executed across 3 companies.{C.END}")


# ============================================================================
# Helper: Generate demo scripts
# ============================================================================

def _matrix_script(size: int, partition: int) -> str:
    return f'''
import time, os, sys
import numpy as np

print("=" * 50)
print(f"  MATRIX COMPUTATION — Partition {partition}")
print("=" * 50)
print(f"  Node: {{os.uname().nodename}}")
print(f"  Matrix size: {size}x{size}")
print()

print("[1/3] Generating random matrices...")
A = np.random.rand({size}, {size})
B = np.random.rand({size}, {size})
print(f"  Shape A: {{A.shape}}, Shape B: {{B.shape}}")

print("[2/3] Computing matrix multiplication...")
start = time.time()
C = np.matmul(A, B)
elapsed = time.time() - start
print(f"  Result shape: {{C.shape}}")
print(f"  Computation time: {{elapsed:.3f}}s")
print(f"  GFLOPS: {{(2 * {size}**3) / elapsed / 1e9:.2f}}")

print("[3/3] Computing statistics...")
print(f"  Mean: {{C.mean():.6f}}")
print(f"  Std:  {{C.std():.6f}}")
print(f"  Max:  {{C.max():.6f}}")
print(f"  Checksum: {{C.sum():.2f}}")

print()
print(f"  Partition {partition} COMPLETE | {{elapsed:.2f}}s | {{os.uname().nodename}}")
'''


def _pipeline_stage_script(stage: int, stage_name: str) -> str:
    return f'''
import time, os, sys, json, random
import numpy as np

print("=" * 50)
print(f"  ML PIPELINE — Stage {stage}: {stage_name.replace('_', ' ').title()}")
print("=" * 50)
print(f"  Node: {{os.uname().nodename}}")
print()

''' + {
    1: '''
# Stage 1: Data Preparation
print("[→] Loading raw dataset...")
time.sleep(1)
data = np.random.rand(10000, 50)
print(f"   Loaded {data.shape[0]} samples, {data.shape[1]} features")

print("[→] Cleaning data...")
time.sleep(0.5)
# Simulate cleaning: remove outliers
mean = data.mean(axis=0)
std = data.std(axis=0)
clean = data[np.all(np.abs(data - mean) < 3 * std, axis=1)]
print(f"   Removed {data.shape[0] - clean.shape[0]} outliers")
print(f"   Clean dataset: {clean.shape[0]} samples")

print("[→] Feature engineering...")
time.sleep(0.5)
# Add polynomial features
poly = np.column_stack([clean, clean[:, :5] ** 2, clean[:, :3] ** 3])
print(f"   Added polynomial features: {poly.shape[1]} total features")

print("[→] Normalizing...")
normalized = (poly - poly.mean(axis=0)) / (poly.std(axis=0) + 1e-8)
print(f"   Normalized to zero mean, unit variance")

print()
result = {"stage": "data_preparation", "samples": int(normalized.shape[0]),
          "features": int(normalized.shape[1]), "status": "complete"}
print(json.dumps(result, indent=2))
print("Stage 1 COMPLETE ✓")
''',
    2: '''
# Stage 2: Model Training
print("[→] Initializing neural network simulation...")
time.sleep(0.5)

layers = [50, 128, 64, 32, 1]
print(f"   Architecture: {' → '.join(map(str, layers))}")

# Simulate weights
weights = [np.random.randn(layers[i], layers[i+1]) * 0.1 for i in range(len(layers)-1)]
total_params = sum(w.size for w in weights)
print(f"   Total parameters: {total_params:,}")

print("[→] Training...")
X = np.random.rand(5000, 50)
y = np.random.rand(5000, 1)

epochs = 10
for epoch in range(epochs):
    # Forward pass simulation
    h = X
    for w in weights:
        if h.shape[1] == w.shape[0]:
            h = np.tanh(h @ w)
    
    loss = np.mean((h - y[:, :h.shape[1]]) ** 2)
    acc = 1.0 - loss
    
    bar = "#" * ((epoch + 1) * 2) + "-" * (20 - (epoch + 1) * 2)
    print(f"   Epoch {epoch+1:2d}/{epochs} [{bar}] loss={loss:.4f} acc={acc:.4f}")
    time.sleep(0.8)

print()
result = {"stage": "model_training", "epochs": epochs, "final_loss": float(f"{loss:.4f}"),
          "parameters": total_params, "status": "complete"}
print(json.dumps(result, indent=2))
print("Stage 2 COMPLETE ✓")
''',
    3: '''
# Stage 3: Model Evaluation
print("[→] Loading test dataset...")
time.sleep(0.5)

X_test = np.random.rand(2000, 50)
y_test = np.random.randint(0, 2, 2000)
print(f"   Test samples: {X_test.shape[0]}")

print("[→] Running inference on test set...")
time.sleep(1)

# Simulate predictions
predictions = np.random.rand(2000) > 0.4  # Slightly biased for good metrics
correct = (predictions == y_test).sum()

accuracy = correct / len(y_test) * 100
precision = np.random.uniform(0.82, 0.92)
recall = np.random.uniform(0.78, 0.88)
f1 = 2 * precision * recall / (precision + recall)

print("[→] Computing metrics...")
time.sleep(0.5)

print()
print("   ┌──────────────────────────────────────┐")
print(f"   │  Accuracy:  {accuracy:.1f}%                     │")
print(f"   │  Precision: {precision:.4f}                    │")
print(f"   │  Recall:    {recall:.4f}                    │")
print(f"   │  F1 Score:  {f1:.4f}                    │")
print("   └──────────────────────────────────────┘")

print()
result = {"stage": "model_evaluation", "accuracy": round(accuracy, 2),
          "precision": round(precision, 4), "recall": round(recall, 4),
          "f1_score": round(f1, 4), "test_samples": 2000, "status": "complete"}
print(json.dumps(result, indent=2))
print("Stage 3 COMPLETE ✓")
'''
}[stage]


# ============================================================================
# Main
# ============================================================================

def cleanup():
    """Stop all demo jobs."""
    print(f"\n{C.YELLOW}Cleaning up demo jobs...{C.END}")
    demo_jobs = [
        "demo-ai-inference", "demo-stress-test",
        "matrix-alpha", "matrix-beta", "matrix-gamma",
        "pipeline-1-dataprep", "pipeline-2-training", "pipeline-3-evaluation",
    ]
    for jid in demo_jobs:
        try:
            requests.delete(f"{API_URL}/api/v1/jobs/{jid}?purge=true")
            print(f"  Stopped: {jid}")
        except Exception:
            pass
    print(f"{C.GREEN}✓ Cleanup complete{C.END}")


def main():
    parser = argparse.ArgumentParser(
        description="Sovereign Compute Engine — Demo Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Demo Workloads:
  inference   🤖 AI text inference (single job, auto-scheduled)
  matrix      📐 Distributed matrix computation (3 parallel jobs)
  stress      🔥 CPU stress test (great for showing dashboard metrics)
  pipeline    🔬 ML pipeline (3 sequential stages across 3 companies)
  all         🚀 Run all demos sequentially
  cleanup     🧹 Stop and purge all demo jobs
  metrics     📊 Show current cluster metrics
        """,
    )
    parser.add_argument(
        "demo",
        choices=["inference", "matrix", "stress", "pipeline", "all", "cleanup", "metrics"],
        help="Which demo to run",
    )
    parser.add_argument(
        "--api", default="http://localhost:8080",
        help="API gateway URL (default: http://localhost:8080)",
    )
    
    args = parser.parse_args()
    
    global API_URL
    API_URL = args.api
    
    banner()
    
    if args.demo == "cleanup":
        cleanup()
        return
    
    if args.demo == "metrics":
        show_metrics()
        return
    
    if not check_cluster():
        print(f"\n{C.RED}Cluster not ready. Start with: docker compose up --build{C.END}")
        sys.exit(1)
    
    demos = {
        "inference": demo_inference,
        "matrix": demo_matrix,
        "stress": demo_stress,
        "pipeline": demo_pipeline,
    }
    
    if args.demo == "all":
        for name, fn in demos.items():
            fn()
            time.sleep(3)
    else:
        demos[args.demo]()
    
    print(f"\n{C.CYAN}{'='*60}")
    print(f"  Demo complete! 🎉")
    print(f"  API docs:   http://localhost:8080/docs")
    print(f"  Nomad UI:   http://localhost:4646/ui")
    print(f"{'='*60}{C.END}")


if __name__ == "__main__":
    main()

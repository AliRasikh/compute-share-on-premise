#!/usr/bin/env python3
"""
Sovereign Compute Engine — AI Inference Demo Workload

This script simulates an AI inference task using numpy for real computation.
It runs on federated compute nodes via Nomad.
"""
import os
import sys
import time
import json
import platform
import multiprocessing

print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE - AI Inference Task")
print("=" * 60)
print()

# Phase 1: System Info
print("[1/4] Gathering system information...")
info = {
    "hostname": platform.node(),
    "platform": platform.platform(),
    "python": platform.python_version(),
    "cpu_count": multiprocessing.cpu_count(),
    "nomad_alloc": os.environ.get("NOMAD_ALLOC_ID", "local")[:8],
    "nomad_job": os.environ.get("NOMAD_JOB_NAME", "standalone"),
}
for k, v in info.items():
    print(f"  {k:>14}: {v}")
print()

# Phase 2: Neural network simulation
print("[2/4] Initializing neural network...")
try:
    import numpy as np
    HAS_NUMPY = True
    np.random.seed(42)
except ImportError:
    HAS_NUMPY = False
    import random
    print("  (numpy not available, using stdlib)")

if HAS_NUMPY:
    layers = [512, 256, 128, 64, 32, 16, 1]
    weights = [np.random.randn(layers[i], layers[i+1]).astype(np.float32) * 0.01
               for i in range(len(layers)-1)]
    biases = [np.zeros(layers[i+1], dtype=np.float32) for i in range(len(layers)-1)]
    total_params = sum(w.size + b.size for w, b in zip(weights, biases))
    arch_str = " -> ".join(map(str, layers))
    print(f"  Architecture: {arch_str}")
    print(f"  Total parameters: {total_params:,}")
    mem = sum(w.nbytes + b.nbytes for w, b in zip(weights, biases))
    print(f"  Memory: {mem / 1024:.1f} KB")
else:
    total_params = 180000
    print(f"  Architecture: 512 -> 256 -> 128 -> 64 -> 32 -> 16 -> 1")
    print(f"  Total parameters: {total_params:,}")
print()

# Phase 3: Forward pass (CPU intensive)
print("[3/4] Running inference (forward pass)...")
start = time.time()

batch_size = 1000

if HAS_NUMPY:
    X = np.random.randn(batch_size, 512).astype(np.float32)
    for epoch in range(10):
        h = X
        for i, (W, b) in enumerate(zip(weights, biases)):
            h = h @ W + b
            if i < len(weights) - 1:
                h = np.maximum(0, h)
        loss = np.mean(h ** 2)
        pct = (epoch + 1) * 10
        bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
        print(f"  Batch {epoch+1:2d}/10 [{bar}] loss={loss:.6f} samples={batch_size}")
        time.sleep(0.3)
else:
    for epoch in range(10):
        total = 0
        for _ in range(batch_size):
            total += sum(random.random() * random.random() for _ in range(50))
        loss = total / batch_size
        pct = (epoch + 1) * 10
        bar = "#" * (pct // 5) + "-" * (20 - pct // 5)
        print(f"  Batch {epoch+1:2d}/10 [{bar}] loss={loss:.6f} samples={batch_size}")
        time.sleep(0.2)

elapsed = time.time() - start
throughput = (batch_size * 10) / elapsed
print(f"  Completed in {elapsed:.2f}s ({throughput:.0f} samples/sec)")
print()

# Phase 4: Generate response
print("[4/4] Generating response...")
print()

prompt = os.environ.get("NOMAD_META_prompt", "Explain digital sovereignty in the EU")
print("-" * 50)
print(f"PROMPT: {prompt}")
print("-" * 50)

responses = [
    "Digital sovereignty ensures that data and technology remain under the control of the entities that generate them. ",
    "The EU promotes this through GAIA-X and federated infrastructure across member states. ",
    "By sharing compute in a peer-to-peer model, organizations maintain data locality while leveraging collective computing power. ",
    "This reduces dependency on hyperscalers while ensuring GDPR compliance and data residency. ",
    "The Sovereign Compute Engine demonstrates Nomad-based orchestration distributing workloads across trusted infrastructure. ",
]

print()
print("RESPONSE:")
full_response = ""
for resp in responses:
    for char in resp:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(0.008)
    full_response += resp
print()
print()

result = {
    "status": "completed",
    "prompt": prompt,
    "response": full_response.strip(),
    "compute_time_seconds": round(elapsed, 3),
    "throughput_samples_per_sec": round(throughput, 1),
    "model_parameters": total_params,
    "node": platform.node(),
    "cpu_cores": multiprocessing.cpu_count(),
}

print("=" * 60)
print("  RESULT (JSON)")
print("=" * 60)
print(json.dumps(result, indent=2))
print()
print("Task completed successfully!")

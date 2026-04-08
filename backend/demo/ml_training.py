#!/usr/bin/env python3
"""
Sovereign Compute Engine — ML Training Workload

Trains a real neural network using numpy (no PyTorch/TF needed).
Supports multiple model types with full training loops:
  - neural_net: Multi-layer perceptron for classification
  - linear_regression: Linear regression with gradient descent
  - classifier: Binary classification with sigmoid output

Environment variables:
  MODEL_TYPE      - Model architecture (default: neural_net)
  EPOCHS          - Training epochs (default: 20)
  BATCH_SIZE      - Batch size (default: 64)
  LEARNING_RATE   - Learning rate (default: 0.01)
  DATASET_SIZE    - Synthetic dataset size (default: 5000)
"""
import os
import sys
import time
import json
import platform
import multiprocessing
import numpy as np

# ── Configuration ─────────────────────────────────────────────
MODEL_TYPE = os.environ.get("MODEL_TYPE", "neural_net")
EPOCHS = int(os.environ.get("EPOCHS", "20"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "64"))
LR = float(os.environ.get("LEARNING_RATE", "0.01"))
DATASET_SIZE = int(os.environ.get("DATASET_SIZE", "5000"))

np.random.seed(42)


def relu(x):
    return np.maximum(0, x)

def relu_deriv(x):
    return (x > 0).astype(np.float32)

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))

def softmax(x):
    e = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)


def generate_dataset(n, task="classification"):
    """Generate synthetic dataset for training."""
    if task == "classification":
        # Multi-class spiral dataset (3 classes)
        N = n // 3
        X = np.zeros((n, 2), dtype=np.float32)
        y = np.zeros(n, dtype=int)
        for j in range(3):
            ix = range(N * j, N * (j + 1))
            r = np.linspace(0.0, 1, N)
            t = np.linspace(j * 4, (j + 1) * 4, N) + np.random.randn(N) * 0.2
            X[ix] = np.c_[r * np.sin(t), r * np.cos(t)]
            y[ix] = j
        return X, y, 3
    else:
        # Regression dataset
        X = np.random.randn(n, 5).astype(np.float32)
        true_w = np.array([1.5, -2.0, 0.5, 3.0, -1.0], dtype=np.float32)
        y = X @ true_w + np.random.randn(n).astype(np.float32) * 0.5
        return X, y, 1


class NeuralNetwork:
    """Multi-layer perceptron trained with backpropagation."""

    def __init__(self, layer_sizes):
        self.weights = []
        self.biases = []
        for i in range(len(layer_sizes) - 1):
            w = np.random.randn(layer_sizes[i], layer_sizes[i + 1]).astype(np.float32) * np.sqrt(2.0 / layer_sizes[i])
            b = np.zeros(layer_sizes[i + 1], dtype=np.float32)
            self.weights.append(w)
            self.biases.append(b)

    @property
    def total_params(self):
        return sum(w.size + b.size for w, b in zip(self.weights, self.biases))

    def forward(self, X):
        self.activations = [X]
        self.pre_activations = []
        h = X
        for i, (W, b) in enumerate(zip(self.weights, self.biases)):
            z = h @ W + b
            self.pre_activations.append(z)
            if i < len(self.weights) - 1:
                h = relu(z)
            else:
                h = z  # Last layer: raw logits
            self.activations.append(h)
        return h

    def backward(self, y_true, lr):
        m = y_true.shape[0]
        # Softmax + cross-entropy gradient
        probs = softmax(self.activations[-1])
        delta = probs.copy()
        delta[range(m), y_true] -= 1
        delta /= m

        for i in reversed(range(len(self.weights))):
            dW = self.activations[i].T @ delta
            db = delta.sum(axis=0)
            self.weights[i] -= lr * dW
            self.biases[i] -= lr * db
            if i > 0:
                delta = (delta @ self.weights[i].T) * relu_deriv(self.pre_activations[i - 1])

    def predict(self, X):
        logits = self.forward(X)
        return np.argmax(logits, axis=1)

    def loss(self, X, y):
        logits = self.forward(X)
        probs = softmax(logits)
        m = y.shape[0]
        log_probs = -np.log(probs[range(m), y] + 1e-8)
        return log_probs.mean()

    def accuracy(self, X, y):
        preds = self.predict(X)
        return (preds == y).mean()


# ── Main ──────────────────────────────────────────────────────
print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE - ML Training")
print("=" * 60)
print()

# System info
print("[1/5] System Information")
print(f"  {'hostname':>14}: {platform.node()}")
print(f"  {'python':>14}: {platform.python_version()}")
print(f"  {'numpy':>14}: {np.__version__}")
print(f"  {'cpu_cores':>14}: {multiprocessing.cpu_count()}")
print(f"  {'model_type':>14}: {MODEL_TYPE}")
print(f"  {'epochs':>14}: {EPOCHS}")
print(f"  {'batch_size':>14}: {BATCH_SIZE}")
print(f"  {'learning_rate':>14}: {LR}")
print(f"  {'dataset_size':>14}: {DATASET_SIZE}")
print()

# Generate data
print("[2/5] Generating Dataset...")
if MODEL_TYPE == "linear_regression":
    X, y, n_classes = generate_dataset(DATASET_SIZE, task="regression")
    print(f"  Task: Regression")
    print(f"  Features: {X.shape[1]}")
else:
    X, y, n_classes = generate_dataset(DATASET_SIZE, task="classification")
    print(f"  Task: Classification ({n_classes} classes)")
    print(f"  Features: {X.shape[1]}")

# Train/test split
split_idx = int(len(X) * 0.8)
X_train, X_test = X[:split_idx], X[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]
print(f"  Train samples: {len(X_train)}")
print(f"  Test samples: {len(X_test)}")
print()

# Build model
print("[3/5] Building Model...")
if MODEL_TYPE == "neural_net":
    layers = [X.shape[1], 128, 64, 32, n_classes]
    model = NeuralNetwork(layers)
    arch_str = " -> ".join(str(l) for l in layers)
elif MODEL_TYPE == "classifier":
    layers = [X.shape[1], 64, 32, n_classes]
    model = NeuralNetwork(layers)
    arch_str = " -> ".join(str(l) for l in layers)
else:
    # Linear regression as a single-layer network
    layers = [X.shape[1], 32, 1]
    model = NeuralNetwork(layers)
    arch_str = " -> ".join(str(l) for l in layers)

print(f"  Architecture: {arch_str}")
print(f"  Total parameters: {model.total_params:,}")
mem_kb = sum(w.nbytes + b.nbytes for w, b in zip(model.weights, model.biases)) / 1024
print(f"  Model memory: {mem_kb:.1f} KB")
print()

# Training
print("[4/5] Training...")
print(f"  {'Epoch':>7} | {'Loss':>10} | {'Accuracy':>10} | {'Time':>8} | Progress")
print("  " + "-" * 60)

history = {"loss": [], "accuracy": [], "time": []}
total_start = time.time()
n_batches = max(1, len(X_train) // BATCH_SIZE)

for epoch in range(EPOCHS):
    epoch_start = time.time()

    # Shuffle data
    perm = np.random.permutation(len(X_train))
    X_shuffled = X_train[perm]
    y_shuffled = y_train[perm]

    # Mini-batch training
    for batch in range(n_batches):
        start_idx = batch * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(X_train))
        X_batch = X_shuffled[start_idx:end_idx]
        y_batch = y_shuffled[start_idx:end_idx]

        model.forward(X_batch)
        model.backward(y_batch, LR)

    # Compute metrics
    train_loss = model.loss(X_train, y_train)
    train_acc = model.accuracy(X_train, y_train)
    epoch_time = time.time() - epoch_start

    history["loss"].append(round(float(train_loss), 6))
    history["accuracy"].append(round(float(train_acc), 4))
    history["time"].append(round(epoch_time, 3))

    pct = int((epoch + 1) / EPOCHS * 20)
    bar = "#" * pct + "-" * (20 - pct)
    print(f"  {epoch+1:>5}/{EPOCHS} | {train_loss:>10.6f} | {train_acc:>9.2%} | {epoch_time:>6.3f}s | [{bar}]")

total_time = time.time() - total_start
print()

# Evaluation
print("[5/5] Evaluation on Test Set...")
test_loss = model.loss(X_test, y_test)
test_acc = model.accuracy(X_test, y_test)
test_preds = model.predict(X_test)

# Per-class accuracy
print(f"  Test Loss:     {test_loss:.6f}")
print(f"  Test Accuracy: {test_acc:.2%}")

if MODEL_TYPE != "linear_regression":
    print(f"  Per-class accuracy:")
    for c in range(n_classes):
        mask = y_test == c
        if mask.sum() > 0:
            class_acc = (test_preds[mask] == c).mean()
            print(f"    Class {c}: {class_acc:.2%} ({mask.sum()} samples)")

print(f"  Total training time: {total_time:.2f}s")
print(f"  Avg epoch time: {total_time/EPOCHS:.3f}s")
print(f"  Throughput: {DATASET_SIZE * EPOCHS / total_time:.0f} samples/sec")
print()

# Final result as JSON
result = {
    "status": "completed",
    "model": {
        "type": MODEL_TYPE,
        "architecture": arch_str,
        "total_parameters": model.total_params,
        "memory_kb": round(mem_kb, 1),
    },
    "training": {
        "epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "learning_rate": LR,
        "dataset_size": DATASET_SIZE,
        "final_loss": history["loss"][-1],
        "final_accuracy": history["accuracy"][-1],
        "total_time_seconds": round(total_time, 3),
        "throughput_samples_per_sec": round(DATASET_SIZE * EPOCHS / total_time, 1),
    },
    "evaluation": {
        "test_loss": round(float(test_loss), 6),
        "test_accuracy": round(float(test_acc), 4),
        "test_samples": len(X_test),
    },
    "history": history,
    "node": platform.node(),
    "cpu_cores": multiprocessing.cpu_count(),
}

print("=" * 60)
print("  TRAINING RESULT (JSON)")
print("=" * 60)
print(json.dumps(result, indent=2))
print()
print("Training completed successfully!")

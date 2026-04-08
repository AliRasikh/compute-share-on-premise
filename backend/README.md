# ⚡ Sovereign Compute Engine

**Federated • Sovereign • Open Source**  
*Peer-to-peer compute sharing for the EU — like energy communities, but for compute.*

> The same model behind EU Energy Communities (peer-to-peer solar trading) applied to compute resources. Instead of buying from AWS/Azure, companies in a union share their on-prem surplus compute with each other while maintaining **full data sovereignty**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  NEXT.JS DASHBOARD                      │
│              (clicks "Compute" button)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│           FASTAPI COMPUTE API GATEWAY                   │
│     POST /api/v1/jobs/ai-demo  → Launch AI workload     │
│     GET  /api/v1/nodes         → Cluster nodes          │
│     GET  /api/v1/metrics       → CPU/RAM/Disk stats     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              NOMAD SERVER (Scheduler)                    │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Company A    │  │ Company B    │  │ Company C    │
│ Nomad Client │  │ Nomad Client │  │ Nomad Client │
│ Docker       │  │ Docker       │  │ Docker       │
│ Metrics      │  │ Metrics      │  │ Metrics      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🚀 Quickstart

### Prerequisites
- **Linux machine(s)** (Ubuntu 20.04+ or similar)
- **Docker** installed
- **Python 3.10+** (for the API gateway)
- **Nomad** installed ([download](https://developer.hashicorp.com/nomad/install))

### 1. Start the Nomad Server

```bash
# Option A: Dev mode (quickest for demo)
cd server
chmod +x start-server.sh
./start-server.sh --dev

# Option B: Production config
./start-server.sh
```

The Nomad UI will be available at **http://localhost:4646/ui**

### 2. Join a Machine to the Cluster

On each machine that should contribute compute:

```bash
# One-command install
sudo ./installer/install.sh \
  --server YOUR_SERVER_IP:4647 \
  --company "acme-corp" \
  --datacenter "eu-west"
```

This installs Nomad client + Docker + Prometheus node_exporter.

### 3. Start the API Gateway

```bash
cd api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure (optional — defaults work for local dev)
cp .env.example .env
# Edit .env if your Nomad server isn't on localhost

# Start the API
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

API docs (Swagger) at **http://localhost:8080/docs**

### 4. Run an AI Workload

```bash
# Via curl (what the dashboard does behind the scenes)
curl -X POST http://localhost:8080/api/v1/jobs/ai-demo \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-ai-task",
    "prompt": "Explain digital sovereignty in the EU",
    "cpu": 500,
    "memory": 512
  }'

# Or via Nomad CLI
nomad job run jobs/ai-inference.nomad.hcl
```

### 5. Check Metrics

```bash
# Cluster overview
curl http://localhost:8080/api/v1/metrics | jq

# List nodes
curl http://localhost:8080/api/v1/nodes | jq

# Job status
curl http://localhost:8080/api/v1/jobs/my-ai-task | jq
```

---

## 📡 API Endpoints

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/jobs` | List all jobs |
| `GET` | `/api/v1/jobs/{id}` | Get job details + allocations |
| `POST` | `/api/v1/jobs` | Submit raw Nomad job spec |
| `POST` | `/api/v1/jobs/ai-demo` | 🚀 Launch AI demo workload |
| `DELETE` | `/api/v1/jobs/{id}` | Stop a job |
| `GET` | `/api/v1/jobs/{id}/logs/{alloc}/{task}` | Get task logs |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/nodes` | List all cluster nodes |
| `GET` | `/api/v1/nodes/{id}` | Get node details |
| `GET` | `/api/v1/nodes/{id}/stats` | Real-time CPU/RAM/Disk stats |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/metrics` | Aggregated cluster metrics (JSON) |
| `GET` | `/api/v1/metrics/prometheus` | Prometheus format export |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Detailed health check |

---

## 🔒 Data Sovereignty

| Layer | Mechanism |
|-------|-----------|
| Network | mTLS between Nomad nodes |
| Data at Rest | Encrypted Docker volumes |
| Workload Isolation | Docker namespaces + cgroups |
| Identity | Nomad ACL tokens per company |
| Geo-fencing | Node metadata constraints |
| Audit | API gateway request logging |

---

## 🏢 Dashboard Integration (Next.js)

Your friend's Next.js dashboard can call the API like this:

```typescript
// Fire an AI workload when "Compute" button is clicked
async function launchCompute() {
  const res = await fetch('http://localhost:8080/api/v1/jobs/ai-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ai-workload-001',
      prompt: 'Analyze sentiment of EU digital policy documents',
      cpu: 500,
      memory: 512,
      company: null,  // null = any available node
    }),
  });
  const data = await res.json();
  console.log('Job submitted:', data.job_id);
}

// Fetch cluster metrics for dashboard gauges
async function getMetrics() {
  const res = await fetch('http://localhost:8080/api/v1/metrics');
  const data = await res.json();
  // data.cluster.cpu.percent → CPU usage gauge
  // data.cluster.memory.percent → Memory usage gauge
  // data.nodes → Per-node breakdown
  // data.companies → Per-company contribution
}

// Get real-time node stats
async function getNodeStats(nodeId: string) {
  const res = await fetch(`http://localhost:8080/api/v1/nodes/${nodeId}/stats`);
  return await res.json();
}
```

---

## 📁 Project Structure

```
hackathon/
├── README.md                          # This file
├── installer/
│   └── install.sh                     # One-command node installer
├── server/
│   ├── nomad-server.hcl               # Nomad server config
│   └── start-server.sh                # Server start script
├── api/
│   ├── pyproject.toml                 # Python dependencies
│   ├── main.py                        # FastAPI entry point
│   ├── nomad_client.py                # Nomad HTTP API wrapper
│   ├── .env.example                   # Environment config template
│   └── routers/
│       ├── jobs.py                    # Job management endpoints
│       ├── nodes.py                   # Node listing endpoints
│       └── metrics.py                 # Cluster metrics endpoints
└── jobs/
    ├── ai-inference.nomad.hcl         # AI demo workload
    └── monitoring.nomad.hcl           # Prometheus monitoring stack
```

---

## 💡 The Concept

### What is this?
The **compute equivalent of EU Energy Communities**. Just as neighbors share solar energy instead of buying from big utilities, companies share surplus compute instead of buying from AWS/Azure.

### Why?
- **30-60% cheaper** than cloud for steady workloads
- **Full data sovereignty** — data never leaves trusted infrastructure
- **GAIA-X aligned** — federated, open, European
- **GDPR compliant by design** — data locality guaranteed

### How?
- Companies install a lightweight agent on their servers
- Nomad schedules workloads across the federated cluster
- Each company maintains full control over their hardware
- Workloads can be constrained to specific companies' nodes

---

## 📄 License

MIT — Build the sovereign cloud. 🇪🇺

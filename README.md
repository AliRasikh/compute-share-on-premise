<p align="center">
  <img src="public/assets/corimb_logo.svg" alt="Corimb — Sovereign Compute Engine" width="100%" />
</p>

<p align="center">
  <strong>Decentralized compute sharing for European sovereignty</strong>
</p>

<p align="center">
  <a href="https://corimb.garden/">🌐 Live Demo</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-architecture">🏗 Architecture</a> •
  <a href="#-joining-a-node">🔗 Join a Node</a> •
  <a href="#-api-reference">📡 API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-live-brightgreen?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/hosted-EU%20🇪🇺-blue?style=flat-square" alt="Hosted in EU" />
  <img src="https://img.shields.io/badge/nomad-v1.9.7-blueviolet?style=flat-square" alt="Nomad" />
  <img src="https://img.shields.io/badge/next.js-15-black?style=flat-square" alt="Next.js" />
</p>

---

## 🌍 What is Corimb?

**Corimb** is a decentralized compute-sharing platform that enables European organizations to pool, share, and trade computing resources across a federated network — without relying on US hyperscalers.

Companies contribute idle hardware nodes to a shared cluster. Workloads are scheduled across the network using [HashiCorp Nomad](https://www.nomadproject.io/), and the entire stack is proudly **hosted and operated in the EU**.

> **🇪🇺 Help support European autonomy!**
>
> Keep critical skills in Europe. Prefer European consultancies and service providers so expertise and jobs don't drift away.
>
> Discover [European alternatives for digital products](https://european-alternatives.eu/) and [European products and services](https://www.goeuropean.org/).

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🖥 Compute Marketplace** | Browse available nodes, filter by region/CPU/RAM/status, and deploy workloads |
| **⚡ Live Task Execution** | Execute Python code on remote nodes with real-time log streaming |
| **📊 Admin Dashboard** | Real-time cluster health, resource utilization, and demand trend charts |
| **🔗 Node Federation** | Any machine can join the cluster with a single install script |
| **🌐 Network Activity** | Paginated job history with expandable allocation details and live logs |
| **🔐 Session Auth** | Demo-ready authentication with profile menu and role switching |
| **🇪🇺 EU Sovereignty** | Fully hosted in Europe, no US cloud dependencies |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (for the backend cluster)

### 1. Clone & Install

```bash
git clone https://github.com/AliRasikh/compute-share-on-premise.git
cd compute-share-on-premise
npm install
```

### 2. Start the Backend Cluster

```bash
cd backend
docker compose up --build -d
```

This spins up:
- **1 Nomad Server** — orchestration control plane
- **4 Nomad Clients** — simulating Alpha Technologies, Beta Systems, Gamma Data, Delta Cloud
- **1 FastAPI Gateway** — REST API on port `8080`

### 3. Start the Frontend

```bash
# From the project root
cp .env.local.example .env.local   # if needed
npm run dev
```

Open **http://localhost:3000** — login with:

| Username | Password |
|----------|----------|
| `demo` | `demo1234` |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (Next.js)                   │
│  Landing Page  │  Dashboard  │  Compute  │  Admin Panel  │
└────────┬───────┴──────┬──────┴─────┬─────┴───────────────┘
         │              │            │
         ▼              ▼            ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Gateway (:8080)                      │
│   /health  │  /compute/*  │  /nodes  │  /trading-metrics  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Nomad Server (:4646)                         │
│         Job Scheduling  •  Resource Allocation            │
└───┬──────────┬──────────┬──────────┬─────────────────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌──────────────────┐
│ Alpha  ││ Beta   ││ Gamma  ││ Delta  ││  External Nodes  │
│  Node  ││  Node  ││  Node  ││  Node  ││  (via installer) │
│ Docker ││ Docker ││ Docker ││ Docker ││  Bare-metal/VM   │
└────────┘└────────┘└────────┘└────────┘└──────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, Chart.js |
| **Backend API** | Python, FastAPI, Uvicorn |
| **Orchestration** | HashiCorp Nomad 1.9.7 |
| **Containerization** | Docker, Docker Compose (host networking) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus Node Exporter, Nomad Telemetry |

---

## 🔗 Joining a Node

Any Linux machine can join the cluster with the install script:

```bash
curl -sSL https://raw.githubusercontent.com/AliRasikh/compute-share-on-premise/main/backend/installer/install.sh \
  | bash -s -- \
    --server 95.179.248.242:4647 \
    --company "your-company" \
    --datacenter eu-west
```

The installer will:
1. ✅ Detect system resources (CPU, RAM, GPU)
2. ✅ Install Docker, Nomad, and Node Exporter
3. ✅ Auto-detect public IP and configure advertise addresses
4. ✅ Create a systemd service for automatic startup
5. ✅ Register with the cluster and begin accepting workloads

---

## 📡 API Reference

The FastAPI gateway runs on port **8080** with auto-generated docs at `/docs`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Cluster health check |
| `/compute/metrics` | GET | Node resource metrics (CPU, RAM, GPU) |
| `/compute/submit` | POST | Submit a Python job to the cluster |
| `/compute/status/{job_id}` | GET | Poll job execution status |
| `/compute/logs/{alloc_id}` | GET | Retrieve task stdout/stderr |
| `/trading-metrics` | GET | GPU/CPU utilization time series |

---

## 📁 Project Structure

```
compute-share-on-premise/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard (cluster overview)
│   │   ├── dashboard/      # User dashboard, compute marketplace
│   │   ├── home/           # Landing page
│   │   ├── login/          # Authentication
│   │   └── api/            # Next.js API routes (proxy)
│   ├── components/         # Reusable UI components
│   └── lib/                # Utilities, chart config, metrics
├── backend/
│   ├── api/                # FastAPI gateway
│   ├── docker/             # Nomad container image + entrypoint
│   ├── installer/          # One-command node installer script
│   ├── server/             # Nomad server config
│   └── docker-compose.yml  # Full cluster stack
├── .github/workflows/      # CI/CD pipelines
└── docs/                   # Documentation assets
```

---

## 🌐 Live Demo

> **[https://corimb.garden/](https://corimb.garden/)**
>
> Login with `demo` / `demo1234` to explore the dashboard, browse the compute marketplace, and execute workloads on the live cluster.

---

## 🇪🇺 European Sovereignty

This project is built with European digital sovereignty in mind:

- **🏠 Hosted in the EU** — all infrastructure runs on European servers
- **🔒 No US Cloud** — zero dependency on AWS, GCP, or Azure
- **📖 Open Source** — full transparency, community-driven development
- **🤝 Federated Model** — organizations retain ownership of their hardware

We encourage using **European alternatives** for your digital tools:
- 🔗 [european-alternatives.eu](https://european-alternatives.eu/) — European alternatives for everyday digital products
- 🔗 [goeuropean.org](https://www.goeuropean.org/) — Discover European products and services

---

## 📄 License

MIT © [Corimb](https://corimb.garden/)

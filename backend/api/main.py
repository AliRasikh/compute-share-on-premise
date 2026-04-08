# ============================================================================
# Sovereign Compute Engine — API Gateway
#
# FastAPI backend that sits between the Next.js dashboard and Nomad.
# Provides REST endpoints for job submission, node status, and metrics.
#
# Run: uvicorn main:app --reload --host 0.0.0.0 --port 8080
# Docs: http://localhost:8080/docs (Swagger UI)
# ============================================================================

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import jobs, nodes, metrics
from nomad_client import NomadClient

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("sovereign-compute")


# ── Lifespan — initialize Nomad client ───────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize shared resources on startup, clean up on shutdown."""
    nomad_addr = os.getenv("NOMAD_ADDR", "http://127.0.0.1:4646")
    nomad_token = os.getenv("NOMAD_TOKEN", "")

    logger.info(f"⚡ Sovereign Compute Engine API starting")
    logger.info(f"   Nomad: {nomad_addr}")

    app.state.nomad = NomadClient(addr=nomad_addr, token=nomad_token)

    # Verify Nomad connectivity
    try:
        status = await app.state.nomad.agent_self()
        member = status.get("member", {}).get("Name", "unknown")
        logger.info(f"   Connected to Nomad server: {member}")
    except Exception as e:
        logger.warning(f"   ⚠ Cannot reach Nomad at {nomad_addr}: {e}")
        logger.warning(f"   API will start, but Nomad calls will fail until server is available")

    yield

    # Cleanup
    await app.state.nomad.close()
    logger.info("Sovereign Compute Engine API shutdown")


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="⚡ Sovereign Compute Engine API",
    description=(
        "Federated compute orchestration API for the Sovereign Compute Engine.\n\n"
        "This API gateway connects your dashboard to HashiCorp Nomad, "
        "enabling you to submit workloads, monitor cluster nodes, "
        "and track resource utilization across your federated compute union."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — Allow Next.js dashboard ──────────────────────────────────────────
# In production, restrict origins to your actual dashboard domain
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:8080"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(nodes.router, prefix="/api/v1", tags=["Nodes"])
app.include_router(metrics.router, prefix="/api/v1", tags=["Metrics"])


# ── Root endpoint ────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Health check and API info."""
    return {
        "name": "Sovereign Compute Engine",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "jobs": "/api/v1/jobs",
            "nodes": "/api/v1/nodes",
            "metrics": "/api/v1/metrics",
        },
    }


@app.get("/health", tags=["Health"])
async def health():
    """Detailed health check including Nomad connectivity."""
    nomad_healthy = False
    nomad_info = {}

    try:
        status = await app.state.nomad.agent_self()
        nomad_healthy = True
        nomad_info = {
            "name": status.get("member", {}).get("Name", "unknown"),
            "region": status.get("config", {}).get("Region", "unknown"),
            "datacenter": status.get("config", {}).get("Datacenter", "unknown"),
        }
    except Exception as e:
        nomad_info = {"error": str(e)}

    return {
        "status": "healthy" if nomad_healthy else "degraded",
        "api": {"status": "running"},
        "nomad": {"connected": nomad_healthy, **nomad_info},
    }

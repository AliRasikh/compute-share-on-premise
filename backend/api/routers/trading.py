# ============================================================================
# Sovereign Compute Engine — Trading Metrics Router
#
# Serves compute resource trading metrics (GPU/CPU buy/sell/price data).
# Uses mock historical data blended with live Nomad cluster snapshots.
# ============================================================================

import json
import math
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query, Request

logger = logging.getLogger("sovereign-compute.trading")

router = APIRouter()

# ── Load mock trading data ──────────────────────────────────────────────────
MOCK_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "mock_data" / "trading_metrics.json"

MOCK_DATA = {}
try:
    with open(MOCK_DATA_PATH, "r") as f:
        MOCK_DATA = json.load(f)
    logger.info(f"Loaded trading mock data from {MOCK_DATA_PATH}")
except FileNotFoundError:
    logger.warning(f"Mock data file not found at {MOCK_DATA_PATH}, using empty data")


# ── Helpers ─────────────────────────────────────────────────────────────────

def spread_snapshot_scalar(value: float, length: int) -> list[int]:
    """Spread a single snapshot value across a series with sinusoidal jitter."""
    if length <= 0:
        return []
    return [
        max(0, round(value * (1 + 0.012 * math.sin((i / max(length - 1, 1)) * math.pi * 2))))
        for i in range(length)
    ]


def spread_snapshot_price(value: float, length: int, decimals: int = 2) -> list[float]:
    """Spread a price value across a series with cosine jitter."""
    if length <= 0:
        return []
    return [
        round(
            min(99, max(0, value * (1 + 0.008 * math.cos((i / max(length - 1, 1)) * math.pi * 2)))),
            decimals,
        )
        for i in range(length)
    ]


def build_live_cpu_series(cluster_data: dict, template: dict) -> dict:
    """Build live CPU trading series from cluster metrics."""
    n = len(template.get("labels", []))
    cpu = cluster_data.get("cluster", {}).get("cpu", {})
    used_mhz = cpu.get("used_mhz", 0)
    available_mhz = cpu.get("available_mhz", 0)
    percent = cpu.get("percent", 0)
    return {
        "labels": template["labels"],
        "buy": spread_snapshot_scalar(used_mhz, n),
        "sell": spread_snapshot_scalar(available_mhz, n),
        "marketPrice": spread_snapshot_price(0.32 + (percent / 100) * 0.28, n),
    }


def build_live_gpu_series(cluster_data: dict, template: dict) -> Optional[dict]:
    """Build live GPU trading series from GPU-capable nodes."""
    nodes = cluster_data.get("nodes", [])
    gpu_nodes = [n for n in nodes if n.get("gpu_type") and n.get("gpu_type") != "none"]
    if not gpu_nodes:
        return None

    used = sum(n.get("cpu", {}).get("used_mhz", 0) for n in gpu_nodes)
    total = sum(n.get("cpu", {}).get("total_mhz", 0) for n in gpu_nodes)
    available = max(0, total - used)
    avg_pct = sum(n.get("cpu", {}).get("percent", 0) for n in gpu_nodes) / len(gpu_nodes)

    n = len(template.get("labels", []))
    return {
        "labels": template["labels"],
        "buy": spread_snapshot_scalar(used, n),
        "sell": spread_snapshot_scalar(available, n),
        "marketPrice": spread_snapshot_price(0.65 + (avg_pct / 100) * 0.55, n),
    }


# ── Endpoint ────────────────────────────────────────────────────────────────

@router.get("/trading-metrics")
async def get_trading_metrics(
    request: Request,
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    resource: str = Query("gpu", regex="^(gpu|cpu)$"),
):
    """
    📈 Get compute resource trading metrics.

    Returns buy/sell volume and market price series for GPU or CPU resources.
    Blends live cluster data with mock historical data.

    **Query params:**
    - `period`: `7d`, `30d`, or `90d`
    - `resource`: `gpu` or `cpu`

    **Response format (matches Next.js frontend expectations):**
    ```json
    {
      "currency": "EUR",
      "unit": "u",
      "updatedAt": "...",
      "period": "30d",
      "resource": "gpu",
      "labels": ["Mar 10", ...],
      "buy": [6000, 7400, ...],
      "sell": [7100, 8800, ...],
      "marketPrice": [0.84, 0.86, ...],
      "resources": { "gpu": {...}, "cpu": {...} },
      "computeSource": "live" | "mock"
    }
    ```
    """
    from datetime import datetime, timezone

    mock_block = MOCK_DATA.get(period, {})
    mock_series = mock_block.get(resource, {})

    if not mock_series:
        return {
            "currency": "EUR",
            "unit": "u",
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "period": period,
            "resource": resource,
            "labels": [],
            "buy": [],
            "sell": [],
            "marketPrice": [],
            "resources": mock_block,
            "computeSource": "mock",
        }

    labels = mock_series.get("labels", [])
    buy = mock_series.get("buy", [])
    sell = mock_series.get("sell", [])
    market_price = mock_series.get("marketPrice", [])
    compute_source = "mock"
    compute_note = None

    # Try to blend with live cluster data
    try:
        nomad = request.app.state.nomad
        # Reuse the metrics endpoint logic inline
        raw_nodes = await nomad.list_nodes()
        total_cpu = 0
        used_cpu = 0
        total_mem = 0
        used_mem = 0
        node_list = []

        for node_stub in raw_nodes:
            node_id = node_stub.get("ID", "")
            try:
                node = await nomad.get_node(node_id)
            except Exception:
                continue

            meta = node.get("Meta", {})
            node_res = node.get("NodeResources", {})
            ncpu = node_res.get("Cpu", {}).get("CpuShares", 0)
            nmem = node_res.get("Memory", {}).get("MemoryMB", 0)
            if ncpu == 0:
                res = node.get("Resources", {})
                ncpu = res.get("CPU", 0)
                nmem = res.get("MemoryMB", 0)

            total_cpu += ncpu
            total_mem += nmem

            node_cpu_used = 0
            try:
                allocs = await nomad.get_node_allocations(node_id)
                for alloc in allocs:
                    if alloc.get("ClientStatus") == "running":
                        alloc_res = alloc.get("Resources", {})
                        cpu_a = alloc_res.get("CPU", 0)
                        if cpu_a == 0:
                            tasks = alloc.get("AllocatedResources", {}).get("Tasks", {})
                            for tres in (tasks or {}).values():
                                cpu_a += tres.get("Cpu", {}).get("CpuShares", 0)
                        node_cpu_used += cpu_a
            except Exception:
                pass

            used_cpu += node_cpu_used
            cpu_pct = (node_cpu_used / ncpu * 100) if ncpu > 0 else 0

            node_list.append({
                "gpu_type": meta.get("gpu_type", "none"),
                "cpu": {
                    "total_mhz": ncpu,
                    "used_mhz": node_cpu_used,
                    "percent": round(cpu_pct, 1),
                },
            })

        cluster_data = {
            "cluster": {
                "cpu": {
                    "total_mhz": total_cpu,
                    "used_mhz": used_cpu,
                    "available_mhz": max(0, total_cpu - used_cpu),
                    "percent": round((used_cpu / total_cpu * 100) if total_cpu > 0 else 0, 1),
                },
            },
            "nodes": node_list,
        }

        if resource == "cpu":
            series = build_live_cpu_series(cluster_data, mock_series)
            labels = series["labels"]
            buy = series["buy"]
            sell = series["sell"]
            market_price = series["marketPrice"]
            compute_source = "live"
        else:
            gpu_live = build_live_gpu_series(cluster_data, mock_series)
            if gpu_live:
                labels = gpu_live["labels"]
                buy = gpu_live["buy"]
                sell = gpu_live["sell"]
                market_price = gpu_live["marketPrice"]
                compute_source = "live"
            else:
                compute_note = "GPU chart uses mock: no GPU nodes found in cluster."

    except Exception as e:
        logger.debug(f"Could not get live cluster data for trading metrics: {e}")
        compute_note = "Live mapping unavailable; showing mock trading series."

    result = {
        "currency": "EUR",
        "unit": "u",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "period": period,
        "resource": resource,
        "labels": labels,
        "buy": buy,
        "sell": sell,
        "marketPrice": market_price,
        "resources": mock_block,
        "computeSource": compute_source,
    }
    if compute_note:
        result["computeNote"] = compute_note

    return result

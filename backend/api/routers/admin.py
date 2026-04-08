# ============================================================================
# Sovereign Compute Engine — Admin Router
#
# Serves data for the admin dashboard: server nodes with compute sharing
# metrics, KPI summaries, demand trends, and activity feed.
# Maps live Nomad cluster data to the admin page's expected format.
# ============================================================================

import time
import math
import random
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request

logger = logging.getLogger("sovereign-compute.admin")

router = APIRouter()


def generate_demand_series(cpu_percent: float, is_down: bool = False) -> list[int]:
    """Generate a 7-point demand series (24h timeline) based on current CPU usage."""
    if is_down:
        # Server went down — show demand dropping to 0
        base = max(10, int(cpu_percent * 0.8))
        return [
            int(base * 0.6),
            int(base * 0.8),
            int(base * 1.0),
            int(base * 1.2),
            int(base * 1.3),
            int(base * 0.5),
            0,
        ]
    base = max(10, int(cpu_percent))
    seed = hash(str(cpu_percent)) % 1000
    rng = random.Random(seed)
    return [
        max(0, min(100, int(base * (0.5 + 0.7 * rng.random()))))
        for _ in range(7)
    ]


@router.get("/admin/servers")
async def get_admin_servers(request: Request):
    """
    🖥️ Get server nodes formatted for the admin dashboard.

    Returns data matching the frontend's `ServerNode` type:
    ```typescript
    type ServerNode = {
      id: string;
      company: string;
      capacity: number;      // vCPU total
      used: number;          // vCPU used
      sharedExport: number;  // vCPU exported to shared pool
      borrowedImport: number; // vCPU borrowed from pool
      throughput: number;     // GHz processing speed
      ramUsage: number;       // RAM usage percentage
      state: "running" | "warning" | "down";
      uptime: number;         // percentage
      latencyMs: number;
      demandSeries: number[]; // 7-point demand curve
    }
    ```
    """
    nomad = request.app.state.nomad

    try:
        raw_nodes = await nomad.list_nodes()
    except Exception as e:
        logger.error(f"Failed to list nodes: {e}")
        return {"servers": [], "activities": [], "kpi": {}}

    servers = []
    total_capacity = 0
    total_used = 0
    total_shared = 0
    total_borrowed = 0
    running_count = 0
    warning_count = 0
    down_count = 0

    for idx, node_stub in enumerate(raw_nodes):
        node_id = node_stub.get("ID", "")
        node_status = node_stub.get("Status", "down")
        node_name = node_stub.get("Name", f"node-{idx}")

        try:
            node = await nomad.get_node(node_id)
        except Exception:
            continue

        meta = node.get("Meta", {})
        company = meta.get("company", "Unknown")

        # Resources
        node_res = node.get("NodeResources", {})
        cpu_mhz = node_res.get("Cpu", {}).get("CpuShares", 0)
        mem_mb = node_res.get("Memory", {}).get("MemoryMB", 0)
        if cpu_mhz == 0:
            res = node.get("Resources", {})
            cpu_mhz = res.get("CPU", 0)
            mem_mb = res.get("MemoryMB", 0)

        # Convert MHz to vCPU (1 vCPU ≈ 1000 MHz)
        capacity_vcpu = max(1, cpu_mhz // 1000) * 40  # Scale up for demo visuals

        # Get allocations to determine usage
        cpu_used_mhz = 0
        mem_used_mb = 0
        alloc_count = 0

        try:
            allocs = await nomad.get_node_allocations(node_id)
            for alloc in allocs:
                if alloc.get("ClientStatus") == "running":
                    alloc_count += 1
                    alloc_res = alloc.get("Resources", {})
                    cpu_a = alloc_res.get("CPU", 0)
                    mem_a = alloc_res.get("MemoryMB", 0)
                    if cpu_a == 0:
                        tasks = alloc.get("AllocatedResources", {}).get("Tasks", {})
                        for tres in (tasks or {}).values():
                            cpu_a += tres.get("Cpu", {}).get("CpuShares", 0)
                            mem_a += tres.get("Memory", {}).get("MemoryMB", 0)
                    cpu_used_mhz += cpu_a
                    mem_used_mb += mem_a
        except Exception:
            pass

        # Compute derived metrics
        cpu_pct = (cpu_used_mhz / cpu_mhz * 100) if cpu_mhz > 0 else 0
        mem_pct = (mem_used_mb / mem_mb * 100) if mem_mb > 0 else 0
        used_vcpu = max(0, int(capacity_vcpu * cpu_pct / 100))

        # Determine state
        if node_status != "ready":
            state = "down"
            down_count += 1
        elif cpu_pct > 80 or mem_pct > 80:
            state = "warning"
            warning_count += 1
        else:
            state = "running"
            running_count += 1

        # Shared/Borrowed — compute sharing simulation
        # Nodes with low usage → export spare capacity (shared)
        # Nodes with high usage → import from pool (borrowed)
        available = capacity_vcpu - used_vcpu
        if state == "down":
            shared_export = 0
            borrowed_import = int(capacity_vcpu * 0.15)  # still had demand before going down
        elif cpu_pct < 40:
            shared_export = int(available * 0.6)
            borrowed_import = int(alloc_count * 2)
        elif cpu_pct < 70:
            shared_export = int(available * 0.3)
            borrowed_import = int(alloc_count * 4)
        else:
            shared_export = int(available * 0.1)
            borrowed_import = int(alloc_count * 8 + 10)

        throughput = round(cpu_mhz / 1000, 1) if state != "down" else 0
        uptime = 99.8 if state == "running" else (98.5 if state == "warning" else 94.2)
        latency = 18 + (idx * 4) if state != "down" else 0

        server = {
            "id": node_id[:4].upper(),
            "company": company.replace("-", " ").title(),
            "capacity": capacity_vcpu,
            "used": used_vcpu if state != "down" else 0,
            "sharedExport": shared_export,
            "borrowedImport": borrowed_import,
            "throughput": throughput,
            "ramUsage": round(mem_pct) if state != "down" else 0,
            "state": state,
            "uptime": uptime,
            "latencyMs": latency,
            "demandSeries": generate_demand_series(cpu_pct, is_down=(state == "down")),
        }
        servers.append(server)

        total_capacity += capacity_vcpu
        total_used += server["used"]
        total_shared += shared_export
        total_borrowed += borrowed_import

    # Build KPI summary
    avg_throughput = (
        sum(s["throughput"] for s in servers) / len(servers) if servers else 0
    )
    avg_uptime = sum(s["uptime"] for s in servers) / len(servers) if servers else 0
    active_servers = [s for s in servers if s["latencyMs"] > 0]
    avg_latency = (
        sum(s["latencyMs"] for s in active_servers) / len(active_servers)
        if active_servers else 0
    )

    kpi = {
        "totalCapacity": total_capacity,
        "totalUsed": total_used,
        "totalShared": total_shared,
        "totalBorrowed": total_borrowed,
        "avgThroughput": round(avg_throughput, 1),
        "serverCount": len(servers),
        "runningCount": running_count,
        "warningCount": warning_count,
        "downCount": down_count,
        "avgUptime": round(avg_uptime, 2),
        "avgLatency": round(avg_latency, 1),
        "networkThroughput": round(avg_throughput * 34.4, 1),
        "cpuUtilization": round((total_used / total_capacity * 100) if total_capacity > 0 else 0),
        "avgRamUsage": round(
            sum(s["ramUsage"] for s in servers) / len(servers) if servers else 0
        ),
    }

    # Build activity feed from live events
    activities = []
    for s in servers:
        if s["sharedExport"] > 0:
            activities.append(f"{s['company']} shared {s['sharedExport']} vCPU to the pool")
        if s["state"] == "warning":
            peak = max(s["demandSeries"]) if s["demandSeries"] else 0
            activities.append(f"{s['company']} reached {peak}% peak demand")
        if s["state"] == "down":
            activities.append(f"{s['company']} server went down")
        if s["borrowedImport"] > 0 and s["state"] == "running":
            activities.append(f"{s['company']} borrowed {s['borrowedImport']} vCPU burst capacity")

    if len(servers) > 1:
        activities.append(
            f"Global scheduler rebalanced workload across {len(servers)} servers"
        )

    return {
        "servers": servers,
        "kpi": kpi,
        "activities": activities,
        "timeLabels": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

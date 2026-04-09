# ============================================================================
# Sovereign Compute Engine — Nodes Router
#
# Endpoints for listing and inspecting cluster nodes.
# Shows which companies have contributed compute and their resource status.
# ============================================================================

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request

logger = logging.getLogger("sovereign-compute.nodes")

router = APIRouter()


def _parse_bool_query(value: Optional[str], *, default: bool) -> bool:
    """Parse query booleans; strip whitespace so values like 'true' plus newline still work."""
    if value is None:
        return default
    s = str(value).strip().lower()
    if s in ("true", "1", "yes", "on"):
        return True
    if s in ("false", "0", "no", "off", ""):
        return False
    return default


def _memory_rss_bytes_from_alloc_stats(st: dict) -> int:
    """Sum RSS from Nomad allocation stats (aggregate ResourceUsage and per-task)."""
    ru = st.get("ResourceUsage") or {}
    ms = ru.get("MemoryStats") or {}
    rss = ms.get("RSS")
    if isinstance(rss, (int, float)) and rss > 0:
        return int(rss)
    total = 0
    for t in (st.get("Tasks") or {}).values():
        if not isinstance(t, dict):
            continue
        ru2 = t.get("ResourceUsage") or {}
        ms2 = ru2.get("MemoryStats") or {}
        r2 = ms2.get("RSS")
        if isinstance(r2, (int, float)):
            total += int(r2)
    return total


def _cpu_percent_from_single_alloc_stats(st: dict) -> Optional[float]:
    """
    Nomad /client/allocation/:id/stats — CpuStats.Percent is typically 0–100
    (share of allocated CPU). Fall back to per-task stats when aggregate is empty.
    """
    ru = st.get("ResourceUsage") or {}
    cs = ru.get("CpuStats") or {}
    p = cs.get("Percent")
    if isinstance(p, (int, float)):
        return float(p)
    tasks = st.get("Tasks") or {}
    parts: list[float] = []
    for t in tasks.values():
        if not isinstance(t, dict):
            continue
        ru2 = t.get("ResourceUsage") or {}
        cs2 = ru2.get("CpuStats") or {}
        p2 = cs2.get("Percent")
        if isinstance(p2, (int, float)):
            parts.append(float(p2))
    if not parts:
        return None
    return sum(parts) / len(parts)


async def _workload_snapshot_from_allocations(
    nomad: Any,
    node_id: str,
    memory_mb: int,
) -> Optional[dict[str, Any]]:
    """
    Per-node load from Nomad /v1/client/allocation/:id/stats only (running allocs).
    Avoids duplicated host-level /v1/client/stats when many clients share one kernel.
    """
    try:
        allocs = await nomad.get_node_allocations(node_id)
    except Exception:
        return None
    running = [a["ID"] for a in allocs if a.get("ClientStatus") == "running" and a.get("ID")]
    if not running:
        return {
            "load_percent": 0.0,
            "cpu_percent": 0.0,
            "memory_percent": 0.0,
            "metrics_source": "allocations",
        }
    stats_list = await asyncio.gather(
        *[nomad.get_allocation_stats(aid) for aid in running],
        return_exceptions=True,
    )
    cpu_parts: list[float] = []
    rss_total = 0
    for st in stats_list:
        if isinstance(st, Exception) or not st:
            continue
        cp = _cpu_percent_from_single_alloc_stats(st)
        if cp is not None:
            cpu_parts.append(cp)
        rss_total += _memory_rss_bytes_from_alloc_stats(st)
    cpu_avg = sum(cpu_parts) / len(cpu_parts) if cpu_parts else 0.0
    mem_pct = 0.0
    if memory_mb > 0:
        cap = float(memory_mb) * 1024.0 * 1024.0
        mem_pct = min(100.0, 100.0 * float(rss_total) / cap)
    load_pct = (cpu_avg + mem_pct) / 2.0
    return {
        "load_percent": round(load_pct, 1),
        "cpu_percent": round(cpu_avg, 1),
        "memory_percent": round(mem_pct, 1),
        "metrics_source": "allocations",
    }


@router.get("/nodes")
async def list_nodes(
    request: Request,
    include_stats: Optional[str] = Query(
        None,
        description="Include per-node load_snapshot from Nomad allocation stats (workload CPU + RSS vs node RAM)",
    ),
):
    """
    List all nodes in the cluster with their status and resources.

    With include_stats=true, load_snapshot uses Nomad allocation stats only
    (running tasks): CPU from CpuStats.Percent, memory from RSS vs node memory_mb.
    Non-ready nodes get load_snapshot=null.
    """
    nomad = request.app.state.nomad
    want_stats = _parse_bool_query(include_stats, default=False)
    try:
        raw_nodes = await nomad.list_nodes()
        
        nodes = []
        for node in raw_nodes:
            node_id = node.get("ID", "")
            
            # Get detailed node info
            try:
                detail = await nomad.get_node(node_id)
            except Exception:
                detail = {}
            
            # Get allocations on this node
            alloc_count = 0
            running_allocs = []
            try:
                allocs = await nomad.get_node_allocations(node_id)
                for alloc in allocs:
                    if alloc.get("ClientStatus") == "running":
                        alloc_count += 1
                        running_allocs.append({
                            "id": alloc.get("ID", "")[:8],
                            "job_id": alloc.get("JobID"),
                            "task_group": alloc.get("TaskGroup"),
                            "status": alloc.get("ClientStatus"),
                        })
            except Exception:
                pass
            
            # Extract resource info from NodeResources (preferred) or fall back to Resources
            node_res = detail.get("NodeResources", {})
            res = detail.get("Resources", {})
            meta = detail.get("Meta", {})
            attributes = detail.get("Attributes", {})
            
            # CPU: prefer NodeResources.Processors.Topology.Cores count
            cpu_cores = 0
            cpu_mhz = 0
            processors = node_res.get("Processors", {})
            topology = processors.get("Topology", {})
            cores_list = topology.get("Cores", [])
            if cores_list:
                cpu_cores = len(cores_list)
                # Use BaseSpeed from first core as representative MHz per core
                cpu_mhz = cores_list[0].get("BaseSpeed", 0) * cpu_cores
            elif res.get("CPU"):
                cpu_mhz = res.get("CPU", 0)
                # Estimate cores from attributes
                cpu_cores = int(attributes.get("cpu.numcores", "0") or "0")
            
            # Memory: prefer NodeResources.Memory.MemoryMB
            mem_res = node_res.get("Memory", {})
            mem_total = mem_res.get("MemoryMB", 0) or res.get("MemoryMB", 0)
            
            # Disk: prefer NodeResources.Disk.DiskMB
            disk_res = node_res.get("Disk", {})
            disk_total = disk_res.get("DiskMB", 0) or res.get("DiskMB", 0)
            
            node_info = {
                "id": node_id,
                "short_id": node_id[:8] if node_id else "",
                "name": node.get("Name", ""),
                "status": node.get("Status", ""),
                "status_description": node.get("StatusDescription", ""),
                "datacenter": node.get("Datacenter", ""),
                "node_pool": node.get("NodePool", "default"),
                "address": node.get("Address", ""),
                "driver": node.get("Drivers", {}),
                
                # Company metadata
                "company": meta.get("company", "unknown"),
                "gpu_type": meta.get("gpu_type", "none"),
                "gpu_present": meta.get("gpu_present", "false") == "true",
                
                # Resources
                "resources": {
                    "cpu_mhz": cpu_mhz,
                    "memory_mb": mem_total,
                    "disk_mb": disk_total,
                    "cpu_cores": str(cpu_cores),
                },
                
                # Allocations
                "allocation_count": alloc_count,
                "running_allocations": running_allocs,
                
                # System attributes
                "os": attributes.get("os.name", ""),
                "os_version": attributes.get("os.version", ""),
                "kernel": attributes.get("kernel.name", ""),
                "arch": attributes.get("cpu.arch", ""),
                
                # Meta (full)
                "meta": meta,
            }
            
            nodes.append(node_info)
        
        # Summary stats
        total = len(nodes)
        ready = sum(1 for n in nodes if n["status"] == "ready")
        companies = list(set(n["company"] for n in nodes))

        payload: dict = {
            "nodes": nodes,
            "summary": {
                "total": total,
                "ready": ready,
                "down": total - ready,
                "companies": companies,
                "company_count": len(companies),
            },
        }

        if want_stats:
            snapshot_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

            ready_indices = [i for i, n in enumerate(nodes) if n.get("status") == "ready"]
            for i in range(len(nodes)):
                if i not in ready_indices:
                    nodes[i]["load_snapshot"] = None

            async def _fetch_workload(i: int):
                nid = nodes[i]["id"].strip()
                mb = int(nodes[i]["resources"].get("memory_mb") or 0)
                snap = await _workload_snapshot_from_allocations(nomad, nid, mb)
                return i, snap

            if ready_indices:
                workload_results = await asyncio.gather(*[_fetch_workload(i) for i in ready_indices])
                for i, snap in workload_results:
                    nodes[i]["load_snapshot"] = snap

            payload["snapshot_at"] = snapshot_at

        return payload
    except Exception as e:
        logger.error(f"Failed to list nodes: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")


@router.get("/nodes/raw")
async def list_nodes_raw(
    request: Request,
    include_stats: Optional[str] = Query(None, description="Include Nomad client stats per node"),
):
    """
    Passthrough-oriented dump of Nomad node data for discovery / production mapping.

    Returns the raw `GET /v1/nodes` array plus, per node, the full read-node JSON,
    full allocations list, and optionally client stats (best-effort; failures are
    captured without failing the whole response).
    """
    nomad = request.app.state.nomad
    want_stats = _parse_bool_query(include_stats, default=True)
    try:
        raw_list = await nomad.list_nodes()
    except Exception as e:
        logger.error(f"Failed raw list nodes: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")

    nodes_out = []
    for stub in raw_list:
        # Local sanitize for raw dump only (does not change shared NomadClient behavior)
        node_id = (stub.get("ID", "") or "").strip()
        entry = {
            "list_stub": stub,
            "read_node": None,
            "allocations": None,
            "node_stats": None,
            "partial_errors": {},
        }
        try:
            entry["read_node"] = await nomad.get_node(node_id)
        except Exception as e:
            entry["partial_errors"]["read_node"] = str(e)
        try:
            entry["allocations"] = await nomad.get_node_allocations(node_id)
        except Exception as e:
            entry["partial_errors"]["allocations"] = str(e)
        if want_stats:
            try:
                entry["node_stats"] = await nomad.get_node_stats(node_id)
            except Exception as e:
                entry["partial_errors"]["node_stats"] = str(e)
        nodes_out.append(entry)

    return {
        "nomad_list_nodes": raw_list,
        "nodes": nodes_out,
        "include_stats": want_stats,
    }


@router.get("/nodes/{node_id}")
async def get_node(request: Request, node_id: str):
    """
    Get detailed information about a specific node.
    
    Includes full resource details, running allocations, and system attributes.
    """
    nomad = request.app.state.nomad
    try:
        node = await nomad.get_node(node_id)
        allocs = await nomad.get_node_allocations(node_id)
        
        # Try to get real-time stats
        stats = None
        try:
            stats = await nomad.get_node_stats(node_id)
        except Exception:
            pass
        
        running = [a for a in allocs if a.get("ClientStatus") == "running"]
        
        return {
            "node": {
                "id": node.get("ID"),
                "name": node.get("Name"),
                "status": node.get("Status"),
                "datacenter": node.get("Datacenter"),
                "meta": node.get("Meta", {}),
                "resources": node.get("Resources", {}),
                "reserved_resources": node.get("ReservedResources", {}),
                "attributes": node.get("Attributes", {}),
            },
            "allocations": [
                {
                    "id": a.get("ID"),
                    "job_id": a.get("JobID"),
                    "status": a.get("ClientStatus"),
                    "task_group": a.get("TaskGroup"),
                }
                for a in running
            ],
            "stats": stats,  # Real-time CPU/Memory/Disk usage if available
        }
    except Exception as e:
        logger.error(f"Failed to get node {node_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")


@router.get("/nodes/{node_id}/stats")
async def get_node_stats(request: Request, node_id: str):
    """
    Get real-time resource usage statistics for a specific node.
    
    Returns CPU usage per core, memory usage, disk I/O, and network stats.
    This calls the Nomad client HTTP API directly on the node.
    """
    nomad = request.app.state.nomad
    try:
        stats = await nomad.get_node_stats(node_id)
        
        # Parse and structure the stats
        result = {
            "node_id": node_id,
            "timestamp": stats.get("Timestamp", 0),
        }
        
        # CPU stats
        cpu_stats = stats.get("CPUTicksConsumed", 0)
        cpu_list = stats.get("CPU", [])
        result["cpu"] = {
            "total_ticks": cpu_stats,
            "cores": [
                {
                    "cpu": cpu.get("CPU", ""),
                    "user": cpu.get("User", 0),
                    "system": cpu.get("System", 0),
                    "idle": cpu.get("Idle", 0),
                }
                for cpu in cpu_list
            ],
        }
        
        # Memory stats
        mem = stats.get("Memory", {})
        result["memory"] = {
            "total": mem.get("Total", 0),
            "available": mem.get("Available", 0),
            "used": mem.get("Used", 0),
            "free": mem.get("Free", 0),
        }
        
        # Disk stats
        disk = stats.get("DiskStats", [])
        result["disk"] = [
            {
                "device": d.get("Device", ""),
                "mountpoint": d.get("Mountpoint", ""),
                "size": d.get("Size", 0),
                "used": d.get("Used", 0),
                "available": d.get("Available", 0),
                "used_percent": d.get("UsedPercent", 0),
            }
            for d in disk
        ]
        
        return result
    except Exception as e:
        logger.error(f"Failed to get stats for node {node_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")

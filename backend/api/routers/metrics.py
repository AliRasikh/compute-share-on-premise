# ============================================================================
# Sovereign Compute Engine — Metrics Router
#
# Aggregated cluster metrics for the dashboard.
# Provides a single endpoint that returns everything needed for charts/gauges.
# ============================================================================

import logging
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger("sovereign-compute.metrics")

router = APIRouter()


@router.get("/metrics")
async def get_cluster_metrics(request: Request):
    """
    📊 Get aggregated cluster metrics.
    
    Returns a comprehensive snapshot of the cluster including:
    - Total vs. used CPU/Memory/Disk
    - Per-node resource breakdown  
    - Per-company resource contribution and usage
    - Job counts (running, pending, dead)
    - Allocation counts
    
    This is designed to power dashboard charts and gauges.
    """
    nomad = request.app.state.nomad
    
    try:
        # Fetch all nodes
        raw_nodes = await nomad.list_nodes()
        
        # Initialize aggregates
        total_cpu = 0
        used_cpu = 0
        total_mem = 0
        used_mem = 0
        total_disk = 0
        total_nodes = len(raw_nodes)
        ready_nodes = 0
        total_allocs = 0
        running_allocs = 0
        
        node_breakdown = []
        company_map = {}
        
        for node_stub in raw_nodes:
            node_id = node_stub.get("ID", "")
            is_ready = node_stub.get("Status") == "ready"
            if is_ready:
                ready_nodes += 1
            
            # Get detailed node info
            try:
                node = await nomad.get_node(node_id)
            except Exception:
                continue
            
            meta = node.get("Meta", {})
            company = meta.get("company", "unknown")
            
            # Resources — Nomad stores these under NodeResources
            node_res = node.get("NodeResources", {})
            node_cpu = node_res.get("Cpu", {}).get("CpuShares", 0)
            node_mem = node_res.get("Memory", {}).get("MemoryMB", 0)
            node_disk = node_res.get("Disk", {}).get("DiskMB", 0)
            
            # Fallback to top-level Resources if NodeResources is empty
            if node_cpu == 0:
                res = node.get("Resources", {})
                node_cpu = res.get("CPU", 0)
                node_mem = res.get("MemoryMB", 0)
                node_disk = res.get("DiskMB", 0)
            
            total_cpu += node_cpu
            total_mem += node_mem
            total_disk += node_disk
            
            # Allocations on this node
            node_cpu_used = 0
            node_mem_used = 0
            node_alloc_count = 0
            
            try:
                allocs = await nomad.get_node_allocations(node_id)
                for alloc in allocs:
                    total_allocs += 1
                    if alloc.get("ClientStatus") == "running":
                        running_allocs += 1
                        node_alloc_count += 1
                        # Try AllocatedResources first, then Resources
                        alloc_shared = alloc.get("AllocatedResources", {}).get("Shared", {})
                        alloc_res = alloc.get("Resources", {})
                        cpu = alloc_res.get("CPU", 0)
                        mem = alloc_res.get("MemoryMB", 0)
                        # Also check task-level allocations
                        if cpu == 0:
                            tasks = alloc.get("AllocatedResources", {}).get("Tasks", {})
                            for task_res in (tasks or {}).values():
                                cpu_t = task_res.get("Cpu", {}).get("CpuShares", 0)
                                mem_t = task_res.get("Memory", {}).get("MemoryMB", 0)
                                cpu += cpu_t
                                mem += mem_t
                        node_cpu_used += cpu
                        node_mem_used += mem
            except Exception:
                pass
            
            used_cpu += node_cpu_used
            used_mem += node_mem_used
            
            # Per-node breakdown
            cpu_pct = (node_cpu_used / node_cpu * 100) if node_cpu > 0 else 0
            mem_pct = (node_mem_used / node_mem * 100) if node_mem > 0 else 0
            
            node_info = {
                "id": node_id[:8],
                "name": node_stub.get("Name", ""),
                "company": company,
                "status": node_stub.get("Status", ""),
                "cpu": {
                    "total_mhz": node_cpu,
                    "used_mhz": node_cpu_used,
                    "percent": round(cpu_pct, 1),
                },
                "memory": {
                    "total_mb": node_mem,
                    "used_mb": node_mem_used,
                    "percent": round(mem_pct, 1),
                },
                "disk_mb": node_disk,
                "allocations": node_alloc_count,
                "gpu_type": meta.get("gpu_type", "none"),
            }
            node_breakdown.append(node_info)
            
            # Company aggregation
            if company not in company_map:
                company_map[company] = {
                    "company": company,
                    "node_count": 0,
                    "ready_nodes": 0,
                    "cpu_total_mhz": 0,
                    "cpu_used_mhz": 0,
                    "memory_total_mb": 0,
                    "memory_used_mb": 0,
                    "disk_total_mb": 0,
                    "allocation_count": 0,
                }
            
            cm = company_map[company]
            cm["node_count"] += 1
            if is_ready:
                cm["ready_nodes"] += 1
            cm["cpu_total_mhz"] += node_cpu
            cm["cpu_used_mhz"] += node_cpu_used
            cm["memory_total_mb"] += node_mem
            cm["memory_used_mb"] += node_mem_used
            cm["disk_total_mb"] += node_disk
            cm["allocation_count"] += node_alloc_count
        
        # Calculate percentages for companies
        companies = []
        for cm in company_map.values():
            cm["cpu_percent"] = round(
                (cm["cpu_used_mhz"] / cm["cpu_total_mhz"] * 100) if cm["cpu_total_mhz"] > 0 else 0, 1
            )
            cm["memory_percent"] = round(
                (cm["memory_used_mb"] / cm["memory_total_mb"] * 100) if cm["memory_total_mb"] > 0 else 0, 1
            )
            companies.append(cm)
        
        # Job counts
        running_jobs = 0
        pending_jobs = 0
        dead_jobs = 0
        
        try:
            jobs = await nomad.list_jobs()
            for job in jobs:
                status = job.get("Status", "")
                if status == "running":
                    running_jobs += 1
                elif status == "pending":
                    pending_jobs += 1
                elif status == "dead":
                    dead_jobs += 1
        except Exception:
            pass
        
        # Build response
        cpu_pct_total = (used_cpu / total_cpu * 100) if total_cpu > 0 else 0
        mem_pct_total = (used_mem / total_mem * 100) if total_mem > 0 else 0
        
        return {
            "cluster": {
                "nodes": {
                    "total": total_nodes,
                    "ready": ready_nodes,
                    "down": total_nodes - ready_nodes,
                },
                "cpu": {
                    "total_mhz": total_cpu,
                    "used_mhz": used_cpu,
                    "available_mhz": total_cpu - used_cpu,
                    "percent": round(cpu_pct_total, 1),
                },
                "memory": {
                    "total_mb": total_mem,
                    "used_mb": used_mem,
                    "available_mb": total_mem - used_mem,
                    "percent": round(mem_pct_total, 1),
                },
                "disk": {
                    "total_mb": total_disk,
                },
                "jobs": {
                    "running": running_jobs,
                    "pending": pending_jobs,
                    "dead": dead_jobs,
                    "total": running_jobs + pending_jobs + dead_jobs,
                },
                "allocations": {
                    "total": total_allocs,
                    "running": running_allocs,
                },
            },
            "nodes": node_breakdown,
            "companies": companies,
        }
    except Exception as e:
        logger.error(f"Failed to get cluster metrics: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")


@router.get("/metrics/prometheus")
async def get_prometheus_metrics(request: Request):
    """
    Get raw Prometheus-formatted metrics from Nomad.
    
    Useful for Grafana integration or custom metric collectors.
    Returns Nomad's built-in /v1/metrics endpoint in Prometheus format.
    """
    nomad = request.app.state.nomad
    try:
        from fastapi.responses import PlainTextResponse
        metrics_text = await nomad.get_metrics(format="prometheus")
        return PlainTextResponse(content=metrics_text, media_type="text/plain")
    except Exception as e:
        logger.error(f"Failed to get Prometheus metrics: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")

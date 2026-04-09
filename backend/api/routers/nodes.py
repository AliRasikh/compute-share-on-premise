# ============================================================================
# Sovereign Compute Engine — Nodes Router
#
# Endpoints for listing and inspecting cluster nodes.
# Shows which companies have contributed compute and their resource status.
# ============================================================================

import logging
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger("sovereign-compute.nodes")

router = APIRouter()


@router.get("/nodes")
async def list_nodes(request: Request):
    """
    List all nodes in the cluster with their status and resources.
    
    Returns each node's:
    - Identity (ID, name, company, datacenter)
    - Status (ready, down, initializing)
    - Resources (CPU, memory, disk, GPU)
    - Running allocation count
    """
    nomad = request.app.state.nomad
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
        
        return {
            "nodes": nodes,
            "summary": {
                "total": total,
                "ready": ready,
                "down": total - ready,
                "companies": companies,
                "company_count": len(companies),
            },
        }
    except Exception as e:
        logger.error(f"Failed to list nodes: {e}")
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")


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

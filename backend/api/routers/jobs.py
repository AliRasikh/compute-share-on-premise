# ============================================================================
# Sovereign Compute Engine — Jobs Router
#
# Endpoints for submitting, listing, inspecting, and stopping Nomad jobs.
# This is what the dashboard calls when you click "Compute".
# ============================================================================

import hashlib
import json
import logging
import os
import time as _time
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

logger = logging.getLogger("sovereign-compute.jobs")

router = APIRouter()


# ── Request / Response Models ────────────────────────────────────────────────

class SubmitJobRequest(BaseModel):
    job_spec: dict = Field(..., description="Full Nomad job JSON spec")


class SubmitAIJobRequest(BaseModel):
    name: Optional[str] = Field(default="ai-demo", description="Job name / ID")
    prompt: Optional[str] = Field(
        default="Explain the concept of digital sovereignty in the EU.",
        description="Prompt for the AI model",
    )
    cpu: Optional[int] = Field(default=500, description="CPU allocation in MHz")
    memory: Optional[int] = Field(default=512, description="Memory allocation in MB")
    company: Optional[str] = Field(default=None, description="Target company node")


class ComputeRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Job name (auto-generated if empty)")
    code: str = Field(..., description="Python code to execute")
    cpu: Optional[int] = Field(default=500, description="CPU in MHz")
    memory: Optional[int] = Field(default=512, description="Memory in MB")
    company: Optional[str] = Field(default=None, description="Target company")


class TrainingRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Job name")
    model: str = Field(
        default="neural_net",
        description="Model type: 'neural_net', 'linear_regression', 'classifier'",
    )
    epochs: Optional[int] = Field(default=20, description="Number of training epochs")
    batch_size: Optional[int] = Field(default=64, description="Batch size")
    learning_rate: Optional[float] = Field(default=0.01, description="Learning rate")
    dataset_size: Optional[int] = Field(default=5000, description="Synthetic dataset size")
    cpu: Optional[int] = Field(default=1000, description="CPU in MHz")
    memory: Optional[int] = Field(default=512, description="Memory in MB")
    company: Optional[str] = Field(default=None, description="Target company")


# ── Helper ───────────────────────────────────────────────────────────────────

def _build_constraints(company: Optional[str]) -> list:
    if not company:
        return []
    return [{"LTarget": "${meta.company}", "RTarget": company, "Operand": "="}]


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(request: Request, prefix: str = ""):
    """List all jobs in the cluster."""
    nomad = request.app.state.nomad
    try:
        jobs = await nomad.list_jobs(prefix=prefix)
        result = []
        for job in jobs:
            summary = {
                "id": job.get("ID"),
                "name": job.get("Name"),
                "type": job.get("Type"),
                "status": job.get("Status"),
                "status_description": job.get("StatusDescription", ""),
                "priority": job.get("Priority"),
                "datacenters": job.get("Datacenters", []),
                "create_time": job.get("SubmitTime"),
                "meta": job.get("Meta", {}),
            }
            job_summary = job.get("JobSummary", {})
            if job_summary:
                task_groups = {}
                for tg_name, tg_info in job_summary.get("Summary", {}).items():
                    task_groups[tg_name] = {
                        "queued": tg_info.get("Queued", 0),
                        "complete": tg_info.get("Complete", 0),
                        "failed": tg_info.get("Failed", 0),
                        "running": tg_info.get("Running", 0),
                    }
                summary["task_groups"] = task_groups
            result.append(summary)
        return {"jobs": result, "total": len(result)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Nomad API error: {str(e)}")


@router.get("/jobs/{job_id}")
async def get_job(request: Request, job_id: str):
    """Get detailed information about a specific job."""
    nomad = request.app.state.nomad
    try:
        job = await nomad.get_job(job_id)
        allocations = await nomad.get_job_allocations(job_id)
        alloc_summary = []
        for alloc in allocations:
            alloc_info = {
                "id": alloc.get("ID"),
                "node_id": alloc.get("NodeID"),
                "node_name": alloc.get("NodeName", ""),
                "status": alloc.get("ClientStatus"),
                "task_group": alloc.get("TaskGroup"),
                "create_time": alloc.get("CreateTime"),
            }
            task_states = {}
            for task_name, task_state in (alloc.get("TaskStates") or {}).items():
                events = []
                for event in (task_state.get("Events") or [])[-5:]:
                    events.append({
                        "type": event.get("Type"),
                        "message": event.get("DisplayMessage", ""),
                        "time": event.get("Time"),
                    })
                task_states[task_name] = {
                    "state": task_state.get("State"),
                    "restarts": task_state.get("Restarts", 0),
                    "events": events,
                }
            alloc_info["task_states"] = task_states
            alloc_summary.append(alloc_info)
        return {
            "job": {
                "id": job.get("ID"),
                "name": job.get("Name"),
                "type": job.get("Type"),
                "status": job.get("Status"),
                "datacenters": job.get("Datacenters", []),
                "meta": job.get("Meta", {}),
                "create_time": job.get("SubmitTime"),
            },
            "allocations": alloc_summary,
        }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/jobs")
async def submit_job(request: Request, body: SubmitJobRequest):
    """Submit a raw Nomad job specification."""
    nomad = request.app.state.nomad
    try:
        result = await nomad.submit_job(body.job_spec)
        return {
            "message": "Job submitted successfully",
            "eval_id": result.get("EvalID"),
            "warnings": result.get("Warnings", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── AI Demo Endpoint ─────────────────────────────────────────────────────────

@router.post("/jobs/ai-demo")
async def submit_ai_demo(request: Request, body: SubmitAIJobRequest = SubmitAIJobRequest()):
    """🚀 Submit the pre-built AI demo workload (dashboard's Compute button)."""
    nomad = request.app.state.nomad
    job_id = body.name or "ai-demo"

    job_spec = {
        "Job": {
            "ID": job_id,
            "Name": job_id,
            "Type": "batch",
            "NodePool": "shared",
            "Datacenters": ["eu-west", "eu-central"],
            "Meta": {
                "workload_type": "ai-inference",
                "prompt": body.prompt,
                "submitted_by": "dashboard",
            },
            "Constraints": _build_constraints(body.company) or None,
            "TaskGroups": [
                {
                    "Name": "inference",
                    "Count": 1,
                    "RestartPolicy": {"Attempts": 1, "Interval": 300000000000, "Delay": 10000000000, "Mode": "fail"},
                    "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                    "Tasks": [
                        {
                            "Name": "ai-task",
                            "Driver": "raw_exec",
                            "Config": {
                                "command": "/usr/local/bin/python3",
                                "args": ["/opt/demo/ai_workload.py"],
                            },
                            "Env": {"NOMAD_META_prompt": body.prompt},
                            "Resources": {"CPU": body.cpu, "MemoryMB": body.memory},
                            "Meta": {"prompt": body.prompt},
                            "LogConfig": {"MaxFiles": 3, "MaxFileSizeMB": 10},
                        }
                    ],
                }
            ],
        }
    }

    try:
        result = await nomad.submit_job(job_spec)
        return {
            "message": f"AI workload '{job_id}' submitted successfully!",
            "job_id": job_id,
            "eval_id": result.get("EvalID"),
            "prompt": body.prompt,
            "resources": {"cpu_mhz": body.cpu, "memory_mb": body.memory},
            "target_company": body.company or "any (best available node)",
            "logs_url": f"/api/v1/jobs/{job_id}/logs",
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── General Purpose Compute ──────────────────────────────────────────────────

@router.post("/jobs/compute")
async def submit_compute(request: Request, body: ComputeRequest):
    """
    🖥️ Submit arbitrary Python code to run on the cluster.
    
    The code is written to a temp file and executed via raw_exec.
    Output is captured in Nomad logs — view via GET /jobs/{id}/logs.
    """
    nomad = request.app.state.nomad
    job_id = body.name or f"compute-{hashlib.md5(body.code.encode()).hexdigest()[:8]}-{int(_time.time()) % 10000}"

    job_spec = {
        "Job": {
            "ID": job_id,
            "Name": job_id,
            "Type": "batch",
            "NodePool": "shared",
            "Datacenters": ["eu-west", "eu-central"],
            "Meta": {"workload_type": "custom-compute", "submitted_by": "dashboard"},
            "Constraints": _build_constraints(body.company) or None,
            "TaskGroups": [
                {
                    "Name": "compute",
                    "Count": 1,
                    "RestartPolicy": {"Attempts": 0, "Mode": "fail"},
                    "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                    "Tasks": [
                        {
                            "Name": "run",
                            "Driver": "raw_exec",
                            "Config": {
                                "command": "/bin/bash",
                                "args": [
                                    "-c",
                                    f"cat << 'PYEOF' > /tmp/{job_id}.py\n{body.code}\nPYEOF\n/usr/local/bin/python3 /tmp/{job_id}.py",
                                ],
                            },
                            "Resources": {"CPU": body.cpu, "MemoryMB": body.memory},
                            "LogConfig": {"MaxFiles": 3, "MaxFileSizeMB": 10},
                        }
                    ],
                }
            ],
        }
    }

    try:
        result = await nomad.submit_job(job_spec)
        return {
            "message": f"Compute job '{job_id}' submitted!",
            "job_id": job_id,
            "eval_id": result.get("EvalID"),
            "target_company": body.company or "any",
            "logs_url": f"/api/v1/jobs/{job_id}/logs",
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── ML Training ──────────────────────────────────────────────────────────────

@router.post("/jobs/training")
async def submit_training(request: Request, body: TrainingRequest):
    """
    🧠 Submit an ML training job to the cluster.
    
    Trains a real neural network using numpy on synthetic data.
    Results include loss curves, accuracy metrics, and model parameters.
    View output via GET /jobs/{id}/logs.
    """
    nomad = request.app.state.nomad
    job_id = body.name or f"train-{body.model}-{int(_time.time()) % 10000}"

    job_spec = {
        "Job": {
            "ID": job_id,
            "Name": job_id,
            "Type": "batch",
            "NodePool": "shared",
            "Datacenters": ["eu-west", "eu-central"],
            "Meta": {
                "workload_type": "ml-training",
                "model": body.model,
                "epochs": str(body.epochs),
                "submitted_by": "dashboard",
            },
            "Constraints": _build_constraints(body.company) or None,
            "TaskGroups": [
                {
                    "Name": "training",
                    "Count": 1,
                    "RestartPolicy": {"Attempts": 0, "Mode": "fail"},
                    "ReschedulePolicy": {"Attempts": 0, "Unlimited": False},
                    "Tasks": [
                        {
                            "Name": "train",
                            "Driver": "raw_exec",
                            "Config": {
                                "command": "/usr/local/bin/python3",
                                "args": ["/opt/demo/ml_training.py"],
                            },
                            "Env": {
                                "MODEL_TYPE": body.model,
                                "EPOCHS": str(body.epochs),
                                "BATCH_SIZE": str(body.batch_size),
                                "LEARNING_RATE": str(body.learning_rate),
                                "DATASET_SIZE": str(body.dataset_size),
                            },
                            "Resources": {"CPU": body.cpu, "MemoryMB": body.memory},
                            "LogConfig": {"MaxFiles": 3, "MaxFileSizeMB": 10},
                        }
                    ],
                }
            ],
        }
    }

    try:
        result = await nomad.submit_job(job_spec)
        return {
            "message": f"Training job '{job_id}' submitted!",
            "job_id": job_id,
            "eval_id": result.get("EvalID"),
            "model": body.model,
            "epochs": body.epochs,
            "target_company": body.company or "any",
            "logs_url": f"/api/v1/jobs/{job_id}/logs",
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Stop Job ─────────────────────────────────────────────────────────────────

@router.delete("/jobs/{job_id}")
async def stop_job(request: Request, job_id: str, purge: bool = False):
    """Stop a running job. Set purge=true to remove it from Nomad."""
    nomad = request.app.state.nomad
    try:
        result = await nomad.stop_job(job_id, purge=purge)
        return {"message": f"Job '{job_id}' stopped", "eval_id": result.get("EvalID"), "purged": purge}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ── Logs ─────────────────────────────────────────────────────────────────────

@router.get("/jobs/{job_id}/logs")
async def get_job_logs_simple(request: Request, job_id: str, log_type: str = "stdout"):
    """
    📋 Get logs from a job (auto-discovers allocation and task).
    Just pass the job_id — it finds the latest allocation and task automatically.
    """
    nomad = request.app.state.nomad
    try:
        allocs = await nomad.get_job_allocations(job_id)
        if not allocs:
            return {"job_id": job_id, "output": "", "error": "No allocations found"}

        # Most recent allocation
        alloc = sorted(allocs, key=lambda a: a.get("CreateTime", 0), reverse=True)[0]
        alloc_id = alloc["ID"]
        node_name = alloc.get("NodeName", "unknown")
        status = alloc.get("ClientStatus", "unknown")

        # Find the task name
        task_states = alloc.get("TaskStates") or {}
        task_name = list(task_states.keys())[0] if task_states else "ai-task"

        # Get stdout
        try:
            stdout = await nomad.get_alloc_logs(alloc_id, task_name, log_type="stdout")
        except Exception:
            stdout = "(logs not available yet)"

        # Get stderr
        try:
            stderr = await nomad.get_alloc_logs(alloc_id, task_name, log_type="stderr")
        except Exception:
            stderr = ""

        return {
            "job_id": job_id,
            "alloc_id": alloc_id[:8],
            "task": task_name,
            "node": node_name,
            "status": status,
            "output": stdout,
            "stderr": stderr,
        }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

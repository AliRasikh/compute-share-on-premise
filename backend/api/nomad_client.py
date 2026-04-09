# ============================================================================
# Sovereign Compute Engine — Nomad HTTP Client
#
# Async HTTP client that talks to the Nomad REST API.
# Uses httpx instead of a SDK to keep dependencies minimal.
#
# Nomad API docs: https://developer.hashicorp.com/nomad/api-docs
# ============================================================================

import httpx
import logging
from typing import Any, Optional

logger = logging.getLogger("sovereign-compute.nomad")


class NomadClient:
    """Async HTTP client for the Nomad REST API."""

    def __init__(self, addr: str = "http://127.0.0.1:4646", token: str = ""):
        # Trim only env-sourced strings; avoids httpx errors from CRLF in .env
        self.addr = addr.strip().rstrip("/")
        self.token = token.strip()
        self._client = httpx.AsyncClient(
            base_url=f"{self.addr}/v1",
            headers=self._build_headers(),
            timeout=30.0,
        )

    def _build_headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["X-Nomad-Token"] = self.token
        return headers

    async def close(self):
        await self._client.aclose()

    async def _get(self, path: str, params: Optional[dict] = None) -> Any:
        """Make a GET request to the Nomad API."""
        resp = await self._client.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    async def _post(self, path: str, json: Any = None) -> Any:
        """Make a POST request to the Nomad API."""
        resp = await self._client.post(path, json=json)
        resp.raise_for_status()
        return resp.json()

    async def _delete(self, path: str, params: Optional[dict] = None) -> Any:
        """Make a DELETE request to the Nomad API."""
        resp = await self._client.delete(path, params=params)
        resp.raise_for_status()
        return resp.json()

    # ── Agent ────────────────────────────────────────────────────────────────

    async def agent_self(self) -> dict:
        """Get agent info (health check)."""
        return await self._get("/agent/self")

    # ── Jobs ─────────────────────────────────────────────────────────────────

    async def list_jobs(self, prefix: str = "") -> list[dict]:
        """List all jobs, optionally filtered by prefix."""
        params = {}
        if prefix:
            params["prefix"] = prefix
        return await self._get("/jobs", params=params)

    async def get_job(self, job_id: str) -> dict:
        """Get detailed job information."""
        return await self._get(f"/job/{job_id}")

    async def submit_job(self, job_spec: dict) -> dict:
        """
        Submit (register) a job to Nomad.

        The job_spec should be the full Nomad job JSON (with the "Job" key).
        See: https://developer.hashicorp.com/nomad/api-docs/jobs#create-job
        """
        return await self._post("/jobs", json=job_spec)

    async def stop_job(self, job_id: str, purge: bool = False) -> dict:
        """Stop (deregister) a job."""
        params = {}
        if purge:
            params["purge"] = "true"
        return await self._delete(f"/job/{job_id}", params=params)

    async def get_job_allocations(self, job_id: str) -> list[dict]:
        """Get allocations for a job."""
        return await self._get(f"/job/{job_id}/allocations")

    async def get_job_summary(self, job_id: str) -> dict:
        """Get job summary (task group status counts)."""
        return await self._get(f"/job/{job_id}/summary")

    # ── Allocations ──────────────────────────────────────────────────────────

    async def get_allocation(self, alloc_id: str) -> dict:
        """Get detailed allocation info."""
        return await self._get(f"/allocation/{alloc_id}")

    async def get_allocation_stats(self, alloc_id: str) -> dict:
        """Resource usage for a running allocation (client API)."""
        return await self._get(f"/client/allocation/{alloc_id}/stats")

    async def get_alloc_logs(
        self, alloc_id: str, task: str, log_type: str = "stdout", plain: bool = True
    ) -> str:
        """Get allocation logs (stdout or stderr)."""
        params = {"task": task, "type": log_type, "plain": str(plain).lower()}
        resp = await self._client.get(
            f"/client/fs/logs/{alloc_id}", params=params
        )
        resp.raise_for_status()
        return resp.text

    # ── Nodes ────────────────────────────────────────────────────────────────

    async def list_nodes(self) -> list[dict]:
        """List all cluster nodes."""
        return await self._get("/nodes")

    async def get_node(self, node_id: str) -> dict:
        """Get detailed node information."""
        return await self._get(f"/node/{node_id}")

    async def get_node_allocations(self, node_id: str) -> list[dict]:
        """Get allocations on a specific node."""
        return await self._get(f"/node/{node_id}/allocations")

    async def get_node_stats(self, node_id: str) -> dict:
        """
        Get real-time resource usage stats for a node.
        This calls the client HTTP API endpoint on the node itself.
        Requires the Nomad client to be accessible.
        """
        return await self._get(f"/client/stats", params={"node_id": node_id})

    # ── Metrics ──────────────────────────────────────────────────────────────

    async def get_metrics(self, format: str = "prometheus") -> Any:
        """
        Get Nomad's built-in metrics.
        format: 'prometheus' or 'json'
        """
        params = {}
        if format == "prometheus":
            params["format"] = "prometheus"
            resp = await self._client.get("/metrics", params=params)
            resp.raise_for_status()
            return resp.text
        return await self._get("/metrics")

    # ── Evaluations ──────────────────────────────────────────────────────────

    async def get_evaluation(self, eval_id: str) -> dict:
        """Get evaluation details."""
        return await self._get(f"/evaluation/{eval_id}")

    async def get_eval_allocations(self, eval_id: str) -> list[dict]:
        """Get allocations created by an evaluation."""
        return await self._get(f"/evaluation/{eval_id}/allocations")

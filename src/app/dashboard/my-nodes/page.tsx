"use client";

import React, { useCallback, useEffect, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

type NodeResources = {
  cpu_mhz: number;
  memory_mb: number;
  disk_mb: number;
  cpu_cores: string;
};

type RunningAllocation = {
  id: string;
  job_id: string;
  task_group: string;
  status: string;
};

type ClusterNode = {
  id: string;
  short_id: string;
  name: string;
  status: string;
  status_description: string;
  datacenter: string;
  node_pool: string;
  address: string;
  company: string;
  gpu_type: string;
  gpu_present: boolean;
  resources: NodeResources;
  allocation_count: number;
  running_allocations: RunningAllocation[];
  os: string;
  os_version: string;
  kernel: string;
  arch: string;
  meta: Record<string, string>;
};

type NodesResponse = {
  nodes: ClusterNode[];
  summary: {
    total: number;
    ready: number;
    down: number;
    companies: string[];
    company_count: number;
  };
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Format MB to a human-readable GB string */
function formatMemory(mb: number): string {
  if (mb <= 0) return "–";
  const gb = mb / 1024;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${mb} MB`;
}

/** Deterministic sparkline path from node id */
function sparklinePath(id: string): string {
  // Use chars from the node ID to generate pseudo-random y values
  const seed = id.replace(/-/g, "").slice(0, 14);
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    const charCode = seed.charCodeAt(i * 2) || 65;
    // Map to range 5-38 (within 0-40 viewBox)
    points.push(5 + ((charCode * 7 + i * 13) % 33));
  }
  const segments = points
    .map((y, i) => {
      const x = Math.round((i / (points.length - 1)) * 100);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return segments;
}

const INSTALL_COMMAND = `curl -fsSL https://corimb.garden/install | sudo bash -s -- \\
  --company "your-company" \\
  --datacenter "eu-west"`;

// ── Component ───────────────────────────────────────────────────────────────

export default function MyNodesPage() {
  const [showModal, setShowModal] = useState(false);
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [summary, setSummary] = useState<NodesResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch("/api/compute/nodes");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: NodesResponse = await res.json();
      setNodes(data.nodes ?? []);
      setSummary(data.summary ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch nodes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 15s polling
  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 15_000);
    return () => clearInterval(interval);
  }, [fetchNodes]);

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      /* clipboard may fail in HTTP */
    }
  };

  const readyCount = summary?.ready ?? nodes.filter((n) => n.status === "ready").length;
  const totalCount = summary?.total ?? nodes.length;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Main Content */}
      <div className="w-full py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 font-bold text-[32px] leading-tight">My Nodes</h1>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Manage your contributed hardware and track cluster health.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchNodes}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-md h-10 px-4 border border-slate-200 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
              >
                <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`} style={{ fontSize: "16px" }}>
                  refresh
                </span>
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex min-w-[120px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md h-10 px-6 bg-blue-600 text-white text-sm font-bold leading-normal shadow-sm hover:bg-blue-700 transition"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  add
                </span>
                <span>Add Node</span>
              </button>
            </div>
          </div>

          {/* Global Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  dns
                </span>
                <p className="text-sm font-medium leading-normal uppercase tracking-wide">Total Nodes</p>
              </div>
              <p className="text-slate-900 text-3xl font-bold leading-tight">{totalCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {summary?.company_count ?? "–"} {(summary?.company_count ?? 0) === 1 ? "company" : "companies"} contributing
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  check_circle
                </span>
                <p className="text-sm font-medium leading-normal uppercase tracking-wide">Ready</p>
              </div>
              <p className="text-slate-900 text-3xl font-bold leading-tight">
                {readyCount}
                <span className="text-lg text-slate-400 font-normal"> / {totalCount}</span>
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {totalCount > 0 ? `${Math.round((readyCount / totalCount) * 100)}%` : "–"} availability
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  error_outline
                </span>
                <p className="text-sm font-medium leading-normal uppercase tracking-wide">Down</p>
              </div>
              <p className="text-slate-900 text-3xl font-bold leading-tight">{summary?.down ?? totalCount - readyCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Nodes not responding</p>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100">
            <span className="material-symbols-outlined text-red-500 mt-0.5" style={{ fontSize: "18px" }}>
              warning
            </span>
            <div>
              <p className="font-semibold">Failed to load nodes</p>
              <p className="text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && nodes.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                <div className="p-5 flex flex-col gap-4">
                  <div className="h-5 w-36 bg-slate-200 rounded" />
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-3 w-10 bg-slate-100 rounded" />
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-50 bg-slate-50/50 p-4">
                  <div className="h-[40px] bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && nodes.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: "64px" }}>
              cloud_off
            </span>
            <h3 className="text-xl font-bold text-slate-700">No nodes registered</h3>
            <p className="text-slate-500 max-w-md">
              Connect your first machine to the compute cluster using the install script.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 flex items-center gap-2 rounded-md h-10 px-6 bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add
              </span>
              Add Node
            </button>
          </div>
        )}

        {/* Node Grid */}
        {nodes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node) => {
              const isReady = node.status === "ready";
              const memTotalMb = node.resources.memory_mb;
              const cpuCores = node.resources.cpu_cores || node.meta?.cpu_cores || "–";
              const osLabel =
                node.os && node.os_version
                  ? `${node.os} ${node.os_version}`
                  : node.os || node.meta?.os || "–";
              const datacenter = node.datacenter || node.meta?.datacenter || "–";
              const sparkline = sparklinePath(node.id);

              return (
                <div
                  key={node.id}
                  className="flex flex-col rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden hover:border-blue-500 transition-colors duration-200"
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Node name + status */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isReady ? "bg-green-500 animate-pulse" : "bg-red-400"
                            }`}
                          />
                          <h3 className="font-bold text-lg text-slate-900 truncate max-w-[180px]">{node.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                          {node.address || node.short_id}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isReady
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {node.status}
                        </span>
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "18px" }}>
                          dns
                        </span>
                      </div>
                    </div>

                    {/* System info grid */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mt-1">
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">OS</p>
                        <p className="font-medium text-slate-900 truncate">{osLabel}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">Datacenter</p>
                        <p className="font-medium text-slate-900">{datacenter}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">CPU Cores</p>
                        <p className="font-medium text-slate-900">{cpuCores}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-0.5">RAM</p>
                        <p className="font-medium text-slate-900">{formatMemory(memTotalMb)}</p>
                      </div>
                    </div>

                    {/* Running allocations */}
                    {node.allocation_count > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500" style={{ fontSize: "16px" }}>
                          play_circle
                        </span>
                        <span className="text-xs text-blue-600 font-semibold">
                          {node.allocation_count} running {node.allocation_count === 1 ? "job" : "jobs"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sparkline Area */}
                  <div className="mt-auto border-t border-slate-50 bg-slate-50/50 p-4 relative">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-slate-500">
                        {node.company !== "unknown" ? node.company : "Company"}
                      </p>
                      <p className="text-xs font-mono text-slate-400">{node.short_id}</p>
                    </div>
                    <div className="h-[40px] w-full relative">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                        <path
                          d={sparkline}
                          fill="none"
                          stroke="#2563eb"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                        <path
                          d={`${sparkline} L100,40 L0,40 Z`}
                          fill={`url(#grad-${node.short_id})`}
                          opacity="0.15"
                        />
                        <defs>
                          <linearGradient id={`grad-${node.short_id}`} x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#2563eb", stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: "#2563eb", stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Node Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-[580px] overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-900">Connect a New Node</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed">
                Run this single command on any <strong>Linux machine</strong> (Ubuntu/Debian recommended)
                to join the Corimb compute cluster.
              </p>

              {/* Single command block */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-800">Install &amp; join the cluster</p>
                <div className="bg-slate-900 rounded-lg p-4 relative group">
                  <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {INSTALL_COMMAND}
                  </pre>
                  <button
                    onClick={() => handleCopy(INSTALL_COMMAND, 0)}
                    aria-label="Copy to clipboard"
                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {copiedIdx === 0 ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2 bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Options</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 font-mono">
                  <span>--company NAME</span>
                  <span className="text-slate-400">Your organization name</span>
                  <span>--datacenter DC</span>
                  <span className="text-slate-400">Datacenter label (e.g. eu-west)</span>
                  <span>--skip-docker</span>
                  <span className="text-slate-400">Skip Docker installation</span>
                </div>
              </div>

              {/* Info callout */}
              <div className="flex items-start gap-3 bg-blue-50 text-blue-900 p-4 rounded-lg text-sm border border-blue-100">
                <span className="material-symbols-outlined text-blue-500 mt-0.5" style={{ fontSize: "18px" }}>
                  info
                </span>
                <p>
                  The installer automatically provisions your machine with the compute agent and
                  connects it to <strong>corimb.garden</strong>. The node will appear in this dashboard
                  within 2–3 minutes.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  fetchNodes();
                }}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition whitespace-nowrap"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

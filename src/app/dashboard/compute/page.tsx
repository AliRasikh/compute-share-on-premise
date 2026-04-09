"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

type ClusterNode = {
  id: string;
  short_id: string;
  name: string;
  status: string;
  datacenter: string;
  node_pool: string;
  address: string;
  company: string;
  gpu_type: string;
  gpu_present: boolean;
  resources: {
    cpu_mhz: number;
    memory_mb: number;
    disk_mb: number;
    cpu_cores: string;
  };
  allocation_count: number;
  os: string;
  os_version: string;
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

type SubmitResponse = {
  message: string;
  job_id: string;
  eval_id?: string;
  error?: string;
  detail?: string;
};

type LogsResponse = {
  job_id: string;
  output: string;
  stderr: string;
  status: string;
  node: string;
  task?: string;
};

// ── Preset Templates ────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: "image-gen",
    label: "Image Generator",
    icon: "🎨",
    description: "Generate a fractal PNG image using pure Python on the cluster.",
    cpu: 1000,
    memory: 512,
    code: `import struct, zlib, base64, math, random, os, platform, time

WIDTH, HEIGHT = 400, 400
random.seed(42)

print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE — Image Generator")
print("=" * 60)
print(f"  Node: {platform.node()}")
print(f"  Company: {os.environ.get('NOMAD_META_company', 'N/A')}")
print(f"  Generating {WIDTH}x{HEIGHT} procedural art...")
print()

start = time.time()

cx, cy = -0.7269, 0.1889
pixels = []

for y in range(HEIGHT):
    row = b""
    for x in range(WIDTH):
        zx = (x - WIDTH / 2) / (WIDTH / 4)
        zy = (y - HEIGHT / 2) / (HEIGHT / 4)
        iteration = 0
        max_iter = 100
        while zx * zx + zy * zy < 4 and iteration < max_iter:
            xtemp = zx * zx - zy * zy + cx
            zy = 2 * zx * zy + cy
            zx = xtemp
            iteration += 1
        t = iteration / max_iter
        if iteration == max_iter:
            r, g, b = 10, 10, 15
        else:
            r = int(255 * (0.5 + 0.5 * math.sin(3.0 * t + 0.0)))
            g = int(255 * (0.5 + 0.5 * math.sin(3.0 * t + 2.1)))
            b = int(255 * (0.5 + 0.5 * math.sin(3.0 * t + 4.2)))
            r = min(255, int(r * 1.3))
            g = min(255, int(g * 0.8))
            b = min(255, max(80, b))
        row += struct.pack("BBB", r, g, b)
    pixels.append(b"\\x00" + row)

raw_data = b"".join(pixels)

def make_png(width, height, raw_data):
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc
    header = b"\\x89PNG\\r\\n\\x1a\\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(raw_data, 9))
    iend = chunk(b"IEND", b"")
    return header + ihdr + idat + iend

png_bytes = make_png(WIDTH, HEIGHT, raw_data)
elapsed = time.time() - start

print(f"  Generated in {elapsed:.2f}s")
print(f"  PNG size: {len(png_bytes)} bytes")
print()

b64 = base64.b64encode(png_bytes).decode("ascii")
print("IMAGE_BASE64_START")
print(b64)
print("IMAGE_BASE64_END")

print()
print(f"  Alloc: {os.environ.get('NOMAD_ALLOC_ID', 'N/A')[:12]}")
print("=" * 60)
`,
  },
  {
    id: "system-info",
    label: "System Info",
    icon: "🖥️",
    description: "Get real node info — proves code runs on the server.",
    cpu: 500,
    memory: 256,
    code: `import json, platform, os, multiprocessing, time

print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE — Node Report")
print("=" * 60)

info = {
    "hostname": platform.node(),
    "platform": platform.platform(),
    "python": platform.python_version(),
    "cpu_count": multiprocessing.cpu_count(),
    "arch": platform.machine(),
    "pid": os.getpid(),
    "cwd": os.getcwd(),
    "nomad_alloc": os.environ.get("NOMAD_ALLOC_ID", "N/A")[:12],
    "nomad_job": os.environ.get("NOMAD_JOB_NAME", "N/A"),
    "nomad_dc": os.environ.get("NOMAD_DC", "N/A"),
    "nomad_node": os.environ.get("NOMAD_NODE_NAME", "N/A"),
    "company": os.environ.get("NOMAD_META_company", "N/A"),
}

for k, v in info.items():
    print(f"  {k:>16}: {v}")

print()
print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
print("=" * 60)
print()
print(json.dumps(info, indent=2))
`,
  },
  {
    id: "matrix-benchmark",
    label: "Matrix Benchmark",
    icon: "⚡",
    description: "Run a numpy matrix multiplication benchmark on the cluster.",
    cpu: 1000,
    memory: 512,
    code: `import numpy as np
import time, json, platform, os

print("=" * 60)
print("  SOVEREIGN COMPUTE ENGINE — Matrix Benchmark")
print("=" * 60)

size = 500
print(f"\\n  Creating {size}x{size} random matrices...")
A = np.random.rand(size, size)
B = np.random.rand(size, size)

print("  Running matrix multiplication...")
start = time.time()
C = A @ B
elapsed = time.time() - start

gflops = (2 * size**3) / elapsed / 1e9

print(f"  Completed in {elapsed:.3f}s")
print(f"  Performance: {gflops:.2f} GFLOPS")
print(f"  Result shape: {C.shape}")
print(f"  Checksum: {C.sum():.4f}")
print()

result = {
    "benchmark": "matrix_multiply",
    "size": f"{size}x{size}",
    "time_seconds": round(elapsed, 3),
    "gflops": round(gflops, 2),
    "checksum": round(float(C.sum()), 4),
    "node": platform.node(),
    "company": os.environ.get("NOMAD_META_company", "N/A"),
    "alloc_id": os.environ.get("NOMAD_ALLOC_ID", "N/A")[:12],
}

print(json.dumps(result, indent=2))
print("\\n" + "=" * 60)
`,
  },
  {
    id: "custom",
    label: "Custom Code",
    icon: "🐍",
    description: "Write your own Python code — full stdlib + numpy/psutil.",
    cpu: 500,
    memory: 256,
    code: `# Write any Python code here — it runs on the Nomad cluster!
# Available: numpy, requests, psutil + full stdlib
import json, platform, os

result = {
    "message": "Hello from the Sovereign Compute Engine!",
    "node": platform.node(),
    "company": os.environ.get("NOMAD_META_company", "unknown"),
}
print(json.dumps(result, indent=2))
`,
  },
];

const PHASES = [
  { label: "Submitting job to Nomad scheduler", icon: "📡" },
  { label: "Evaluating placement constraints", icon: "🔀" },
  { label: "Allocating on compute node", icon: "🖥️" },
  { label: "Executing Python workload", icon: "🔥" },
  { label: "Collecting stdout/stderr", icon: "📋" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatMemory(mb: number): string {
  if (mb <= 0) return "–";
  const gb = mb / 1024;
  return gb >= 1 ? `${gb.toFixed(0)} GB` : `${mb} MB`;
}

function formatDisk(mb: number): string {
  if (mb <= 0) return "–";
  const gb = mb / 1024;
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(0)} GB`;
}

function calcHourlyRate(node: ClusterNode): string {
  const cpuCores = parseInt(node.resources.cpu_cores || node.meta?.cpu_cores || "0", 10);
  const memGb = node.resources.memory_mb / 1024;
  const rate = cpuCores * 0.005 + memGb * 0.002;
  return Math.max(0.01, rate).toFixed(2);
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ComputePage() {
  // Nodes state
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter state
  const [filterCpuMin, setFilterCpuMin] = useState(0);
  const [filterRamMin, setFilterRamMin] = useState(0);
  const [filterRegions, setFilterRegions] = useState<Set<string>>(new Set());
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  // Deploy modal state
  const [deployNode, setDeployNode] = useState<ClusterNode | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [code, setCode] = useState(PRESETS[0].code);
  const [cpu, setCpu] = useState(PRESETS[0].cpu);
  const [memory, setMemory] = useState(PRESETS[0].memory);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLPreElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Fetch nodes ──────────────────────────────────────────────────────────
  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch("/api/compute/nodes");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: NodesResponse = await res.json();
      setNodes(data.nodes ?? []);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch nodes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 30_000);
    return () => clearInterval(interval);
  }, [fetchNodes]);

  // ── Timer for execution ──────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      phaseRef.current = setInterval(() => {
        setCurrentPhase((p) => (p < PHASES.length - 1 ? p + 1 : p));
      }, 3000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseRef.current) clearInterval(phaseRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseRef.current) clearInterval(phaseRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Auto-scroll to results
  useEffect(() => {
    if (logs && !isRunning && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [logs, isRunning]);

  // ── Preset selection ─────────────────────────────────────────────────────
  const selectPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setSelectedPreset(preset);
    setCode(preset.code);
    setCpu(preset.cpu);
    setMemory(preset.memory);
    setLogs(null);
    setError(null);
    setJobId(null);
    setGeneratedImage(null);
  }, []);

  const openDeployModal = (node: ClusterNode) => {
    setDeployNode(node);
    selectPreset(PRESETS[0]);
  };

  const closeDeployModal = () => {
    if (isRunning) return;
    setDeployNode(null);
    setLogs(null);
    setError(null);
    setJobId(null);
    setGeneratedImage(null);
  };

  // ── Image extraction ─────────────────────────────────────────────────────
  const extractImage = (output: string): string | null => {
    const si = output.indexOf("IMAGE_BASE64_START");
    const ei = output.indexOf("IMAGE_BASE64_END");
    if (si === -1 || ei === -1) return null;
    const b64 = output.slice(si + "IMAGE_BASE64_START".length, ei).trim();
    if (b64.length < 100) return null;
    return `data:image/png;base64,${b64}`;
  };

  const cleanOutput = (output: string): string => {
    const si = output.indexOf("IMAGE_BASE64_START");
    const ei = output.indexOf("IMAGE_BASE64_END");
    if (si === -1 || ei === -1) return output;
    return (
      output.slice(0, si).trimEnd() +
      "\n  [📸 image data — see preview above]\n" +
      output.slice(ei + "IMAGE_BASE64_END".length)
    );
  };

  // ── Submit & Poll ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!code.trim()) { setError("No code to execute."); return; }
    setIsRunning(true);
    setCurrentPhase(0);
    setElapsedTime(0);
    setLogs(null);
    setError(null);
    setJobId(null);
    setGeneratedImage(null);

    try {
      const submitRes = await fetch("/api/compute/jobs/compute-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cpu, memory }),
      });
      const submitData = (await submitRes.json()) as SubmitResponse;
      if (!submitRes.ok) {
        setError(submitData.error || submitData.detail || `Submit failed (${submitRes.status})`);
        setIsRunning(false);
        return;
      }

      const id = submitData.job_id;
      setJobId(id);
      setCurrentPhase(2);

      const deadline = Date.now() + 120_000;
      let finalLogs: LogsResponse | null = null;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const logsRes = await fetch(`/api/compute/jobs/${id}/logs`);
          if (!logsRes.ok) continue;
          const logsData = (await logsRes.json()) as LogsResponse;
          if (logsData.status === "complete" || logsData.status === "failed") {
            finalLogs = logsData;
            break;
          }
          if (logsData.output || logsData.stderr) finalLogs = logsData;
        } catch { /* retry */ }
        setCurrentPhase((p) => Math.min(PHASES.length - 1, p + 1));
      }
      if (finalLogs) {
        setLogs(finalLogs);
        if (finalLogs.output) {
          const img = extractImage(finalLogs.output);
          if (img) setGeneratedImage(img);
        }
      } else {
        setError(`Job '${id}' submitted but timed out. Check logs manually.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit job.");
    } finally {
      setIsRunning(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "complete") return "text-emerald-400";
    if (s === "failed") return "text-rose-400";
    return "text-amber-400";
  };

  // ── Derived: unique datacenters from live data ────────────────────────────
  const allDatacenters = Array.from(new Set(nodes.map((n) => n.datacenter))).filter(Boolean).sort();

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredNodes = nodes.filter((n) => {
    const cores = parseInt(n.resources.cpu_cores || n.meta?.cpu_cores || "0", 10);
    const ramGb = n.resources.memory_mb / 1024;

    if (cores < filterCpuMin) return false;
    if (ramGb < filterRamMin) return false;
    if (filterOnlineOnly && n.status !== "ready") return false;
    if (filterRegions.size > 0 && !filterRegions.has(n.datacenter)) return false;

    return true;
  });

  const readyCount = filteredNodes.filter((n) => n.status === "ready").length;

  const toggleRegion = (dc: string) => {
    setFilterRegions((prev) => {
      const next = new Set(prev);
      if (next.has(dc)) next.delete(dc);
      else next.add(dc);
      return next;
    });
  };

  const resetFilters = () => {
    setFilterCpuMin(0);
    setFilterRamMin(0);
    setFilterRegions(new Set());
    setFilterOnlineOnly(false);
  };

  const hasActiveFilters =
    filterCpuMin > 0 || filterRamMin > 0 || filterRegions.size > 0 || filterOnlineOnly;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* ── Custom range slider styles ── */}
      <style>{`
        .filter-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 9999px; background: #e2e8f0; outline: none; cursor: pointer; }
        .filter-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,.2); cursor: pointer; transition: transform 0.15s; }
        .filter-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .filter-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,.2); cursor: pointer; }
        .filter-range::-moz-range-track { height: 6px; border-radius: 9999px; background: #e2e8f0; }
      `}</style>

      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Available Capacity</h2>
            <p className="text-slate-500 text-base font-normal leading-normal">
              Showing {readyCount} of {nodes.length} nodes matching your criteria
            </p>
          </div>
          <button
            onClick={fetchNodes}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md h-10 px-4 border border-slate-200 bg-white text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`} style={{ fontSize: "16px" }}>
              refresh
            </span>
            Refresh
          </button>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="flex items-start gap-3 bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100">
            <span className="material-symbols-outlined text-red-500 mt-0.5" style={{ fontSize: "18px" }}>warning</span>
            <div>
              <p className="font-semibold">Failed to load nodes</p>
              <p className="text-red-600 mt-0.5">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && nodes.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse flex flex-col">
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-28 bg-slate-100 rounded mb-4" />
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[1, 2, 3, 4].map((j) => <div key={j} className="bg-slate-100 p-3 rounded-lg h-[68px]" />)}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-6 w-16 bg-slate-200 rounded" />
                  <div className="h-9 w-24 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && nodes.length === 0 && !fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: "64px" }}>cloud_off</span>
            <h3 className="text-xl font-bold text-slate-700">No compute nodes available</h3>
            <p className="text-slate-500 max-w-md">Connect nodes via the My Nodes page to start deploying workloads.</p>
          </div>
        )}

        {/* ── Sidebar + Grid Layout ────────────────────────────────────── */}
        <div className="flex gap-6">
          {/* ── Filter Sidebar ──────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-6 w-[280px] shrink-0 sticky top-[90px] self-start">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Sidebar Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Filters</h3>
                <p className="text-xs text-slate-500 mt-0.5">Narrow down compute options</p>
              </div>

              <div className="p-5 flex flex-col gap-6">
                {/* vCPU Cores */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-800">Min vCPU Cores</span>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {filterCpuMin === 0 ? "Any" : `${filterCpuMin}+`}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 4, 8, 16, 32].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFilterCpuMin(val)}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          filterCpuMin === val
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {val === 0 ? "Any" : `${val}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* RAM */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-800">Min RAM (GB)</span>
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {filterRamMin === 0 ? "Any" : `${filterRamMin}+`}
                    </span>
                  </div>
                  <input type="range" min={0} max={64} step={2} value={filterRamMin}
                    onChange={(e) => setFilterRamMin(Number(e.target.value))}
                    className="filter-range" 
                    style={{ background: `linear-gradient(to right, #2563eb ${(filterRamMin / 64) * 100}%, #e2e8f0 ${(filterRamMin / 64) * 100}%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0 GB</span><span>64 GB</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Region */}
                {allDatacenters.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-3">Region</p>
                    <div className="flex flex-col gap-2">
                      {allDatacenters.map((dc) => (
                        <label key={dc} className="flex items-center gap-2.5 cursor-pointer group">
                          <span
                            onClick={() => toggleRegion(dc)}
                            className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-150 ${
                              filterRegions.has(dc)
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300 group-hover:border-blue-400"
                            }`}
                          >
                            {filterRegions.has(dc) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </span>
                          <span className="text-sm text-slate-700">{dc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Status toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <span
                    onClick={() => setFilterOnlineOnly((v) => !v)}
                    className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all duration-150 ${
                      filterOnlineOnly
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300 group-hover:border-blue-400"
                    }`}
                  >
                    {filterOnlineOnly && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </span>
                  <span className="text-sm text-slate-700">Online only</span>
                </label>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <div className="px-5 pb-5">
                  <button onClick={resetFilters}
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>restart_alt</span>
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── Right: Grid ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* No results */}
            {!loading && filteredNodes.length === 0 && nodes.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <span className="material-symbols-outlined text-slate-300" style={{ fontSize: "56px" }}>filter_list_off</span>
                <h3 className="text-xl font-bold text-slate-700">No nodes match your filters</h3>
                <p className="text-slate-500 max-w-md">Try adjusting the slider ranges or deselecting region filters.</p>
                <button onClick={resetFilters}
                  className="mt-2 flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>restart_alt</span>
                  Reset Filters
                </button>
              </div>
            )}

            {filteredNodes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredNodes.map((node) => {
                  const isReady = node.status === "ready";
                  const cpuCores = node.resources.cpu_cores || node.meta?.cpu_cores || "–";
                  const memMb = node.resources.memory_mb;
                  const diskMb = node.resources.disk_mb;
                  const hourlyRate = calcHourlyRate(node);
                  const osLabel = node.os && node.os_version
                    ? `${node.os} ${node.os_version}`
                    : node.os || "–";

                  return (
                    <article
                      key={node.id}
                      className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
                        isReady
                          ? "border-slate-200 hover:border-blue-400"
                          : "border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Top: name + status */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{node.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {node.datacenter}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${
                            isReady
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-red-50 text-red-500 border-red-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-blue-500 animate-pulse" : "bg-red-400"}`} />
                          {isReady ? "Online" : node.status}
                        </div>
                      </div>

                      {/* Spec grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6 mt-1">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">memory</span> vCPU
                          </div>
                          <div className="font-bold text-lg text-slate-900">{cpuCores} Cores</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">developer_board</span> RAM
                          </div>
                          <div className="font-bold text-lg text-slate-900">{formatMemory(memMb)}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg col-span-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-slate-500">terminal</span>
                          <div className="text-xs text-slate-500">OS</div>
                          <div className="font-semibold text-sm text-slate-900 ml-auto truncate">{osLabel}</div>
                        </div>
                      </div>

                      {/* Bottom: price + deploy */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-500">Hourly Rate</div>
                          <div className="text-xl font-bold text-slate-900">
                            ${hourlyRate}<span className="text-sm font-normal text-slate-500">/hr</span>
                          </div>
                        </div>
                        <button
                          onClick={() => isReady && openDeployModal(node)}
                          disabled={!isReady}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg transition shadow-sm text-sm"
                        >
                          Deploy
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DEPLOY MODAL — full-featured compute engine
         ════════════════════════════════════════════════════════════════════ */}
      {deployNode && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeDeployModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[720px] my-8 overflow-hidden flex flex-col relative">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500" style={{ fontSize: "22px" }}>rocket_launch</span>
                  Deploy to {deployNode.name}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {deployNode.datacenter} • {deployNode.address || deployNode.short_id} • {formatMemory(deployNode.resources.memory_mb)} RAM
                </p>
              </div>
              <button onClick={closeDeployModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Preset Selection */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Choose a workload</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      disabled={isRunning}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 disabled:opacity-50 ${
                        selectedPreset.id === preset.id
                          ? "border-blue-500 bg-blue-50/60 shadow-lg shadow-blue-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      <div className="text-xl mb-1">{preset.icon}</div>
                      <div className="font-bold text-slate-800 text-xs">{preset.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{preset.description}</div>
                      {selectedPreset.id === preset.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor (for non-image presets) */}
              {selectedPreset.id !== "image-gen" && (
                <div>
                  <div className="bg-slate-800 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{selectedPreset.icon}</span>
                      <h4 className="font-bold text-sm">{selectedPreset.label}</h4>
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded font-mono">raw_exec</span>
                    </div>
                    <span className="text-xs text-slate-400">Python 3.11</span>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={10}
                    disabled={isRunning}
                    className="w-full rounded-b-xl border border-t-0 border-slate-200 bg-slate-900 text-emerald-400 font-mono text-sm p-4 outline-none focus:ring-2 focus:ring-blue-500/20 resize-y leading-relaxed disabled:opacity-60"
                    spellCheck={false}
                  />
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">CPU</label>
                      <select value={cpu} onChange={(e) => setCpu(Number(e.target.value))} className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none">
                        <option value={250}>250 MHz</option>
                        <option value={500}>500 MHz</option>
                        <option value={1000}>1,000 MHz</option>
                        <option value={2000}>2,000 MHz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Memory</label>
                      <select value={memory} onChange={(e) => setMemory(Number(e.target.value))} className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none">
                        <option value={128}>128 MB</option>
                        <option value={256}>256 MB</option>
                        <option value={512}>512 MB</option>
                        <option value={1024}>1,024 MB</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Image gen prompt */}
              {selectedPreset.id === "image-gen" && !logs && !isRunning && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center gap-4">
                  <div className="text-5xl">🎨</div>
                  <h4 className="text-xl font-bold text-slate-800">Generate Procedural Image</h4>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Runs an intensive Julia set fractal renderer directly on <strong>{deployNode.name}</strong> and streams back the PNG.
                  </p>
                </div>
              )}

              {/* Running Progress */}
              {isRunning && (
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <div>
                        <div className="text-white font-bold text-sm">Executing on {deployNode.name}</div>
                        <div className="text-slate-400 text-xs">{jobId ? `Job: ${jobId}` : "Submitting..."}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-400 font-mono">{elapsedTime}s</div>
                  </div>
                  <div className="space-y-1">
                    {PHASES.map((phase, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-500 ${
                        idx < currentPhase ? "bg-blue-900/30 text-blue-400" : idx === currentPhase ? "bg-slate-800 text-white" : "text-slate-600"
                      }`}>
                        <span className="w-5 text-center text-sm">{idx < currentPhase ? "✓" : phase.icon}</span>
                        <span className="text-xs font-medium">{phase.label}</span>
                        {idx === currentPhase && (
                          <span className="ml-auto flex gap-1">
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !isRunning && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div className="font-bold text-rose-800 text-sm">Execution Failed</div>
                    <div className="text-xs text-rose-700 mt-1 font-mono whitespace-pre-wrap">{error}</div>
                  </div>
                </div>
              )}

              {/* Results */}
              {logs && !isRunning && (
                <div ref={resultRef} className="space-y-4">
                  <div className={`rounded-xl p-4 flex items-center gap-3 ${
                    logs.status === "complete" ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      logs.status === "complete" ? "bg-blue-600" : "bg-rose-500"
                    }`}>
                      {logs.status === "complete" ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm">
                        {logs.status === "complete" ? "✅ Executed on Remote Node" : "❌ Execution Failed"}
                      </div>
                      <div className="text-xs text-slate-600 flex gap-x-3 mt-0.5">
                        <span>Node: <strong className="font-mono">{logs.node}</strong></span>
                        <span>Time: <strong>{elapsedTime}s</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Generated Image */}
                  {generatedImage && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                        🎨 Generated Image
                        <span className="text-xs text-slate-400 font-normal">— computed on <strong>{logs.node}</strong></span>
                      </h4>
                      <div className="flex justify-center bg-slate-900 rounded-lg p-4">
                        <img src={generatedImage} alt={`Generated on ${logs.node}`} className="max-w-full rounded shadow-2xl" />
                      </div>
                    </div>
                  )}

                  {/* Terminal */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="font-bold text-xs">stdout</span>
                        <span className={`text-xs font-mono ${statusColor(logs.status)}`}>[{logs.status}]</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{logs.node}</span>
                    </div>
                    <pre ref={logRef} className="bg-slate-900 p-4 text-emerald-400 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-60 leading-relaxed">
                      {logs.output ? cleanOutput(logs.output) : "(no output)"}
                    </pre>
                  </div>

                  {logs.stderr && logs.stderr.trim() && (
                    <div className="bg-white rounded-xl border border-rose-200 overflow-hidden">
                      <div className="bg-slate-800 px-4 py-2"><span className="text-rose-400 font-bold text-xs">stderr</span></div>
                      <pre className="bg-slate-900 p-4 text-rose-400 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">{logs.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button onClick={closeDeployModal} disabled={isRunning} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-200 transition disabled:opacity-50">
                {logs ? "Close" : "Cancel"}
              </button>
              {!logs && (
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || !code.trim()}
                  className="h-10 px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run on Cluster
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

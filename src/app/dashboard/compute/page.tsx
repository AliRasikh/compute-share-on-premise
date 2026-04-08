"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

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
// Real Python scripts that exec on Nomad cluster nodes
// Nodes have: Python 3.11, numpy, requests, psutil

const PRESETS = [
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
    id: "image-gen",
    label: "Image Generator",
    icon: "🎨",
    description: "Generate a PNG image using pure Python — returned as base64.",
    cpu: 1000,
    memory: 512,
    code: `import struct, zlib, base64, math, random, os, platform, time

# Generate a procedural art image using only Python stdlib
# No Pillow needed — writes raw PNG bytes

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

# Julia set fractal
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
    id: "custom",
    label: "Custom Code",
    icon: "🐍",
    description: "Write your own Python code — full access to numpy, psutil, etc.",
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

export default function ComputePage() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [code, setCode] = useState(PRESETS[0].code);
  const [cpu, setCpu] = useState(PRESETS[0].cpu);
  const [memory, setMemory] = useState(PRESETS[0].memory);

  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Result state
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLPreElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results
  useEffect(() => {
    if (logs && !isRunning && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [logs, isRunning]);

  // Timer
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

  // Scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

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

  // Extract base64 image from output
  const extractImage = (output: string): string | null => {
    const startMarker = "IMAGE_BASE64_START";
    const endMarker = "IMAGE_BASE64_END";
    const si = output.indexOf(startMarker);
    const ei = output.indexOf(endMarker);
    if (si === -1 || ei === -1) return null;
    const b64 = output.slice(si + startMarker.length, ei).trim();
    if (b64.length < 100) return null;
    return `data:image/png;base64,${b64}`;
  };

  // Clean output for display
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

  // ── Submit & Poll Flow ────────────────────────────────────────────────────
  // Step 1: POST /api/compute/jobs/ai-demo (uses existing /api/v1/jobs/compute)
  // Step 2: Poll /api/compute/jobs/{id}/logs until complete/failed
  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("No code to execute.");
      return;
    }
    setIsRunning(true);
    setCurrentPhase(0);
    setElapsedTime(0);
    setLogs(null);
    setError(null);
    setJobId(null);
    setGeneratedImage(null);

    try {
      // Step 1: Submit the job
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
      setCurrentPhase(2); // skip to "allocating"

      // Step 2: Poll for logs (the logs endpoint returns status + output)
      const deadline = Date.now() + 120_000; // 2 min max
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
          // If we got output but status is still running, keep polling
          if (logsData.output || logsData.stderr) {
            finalLogs = logsData;
          }
        } catch {
          // Network blip, keep trying
        }

        setCurrentPhase((p) => Math.min(PHASES.length - 1, p + 1));
      }

      if (finalLogs) {
        setLogs(finalLogs);
        if (finalLogs.output) {
          const img = extractImage(finalLogs.output);
          if (img) setGeneratedImage(img);
        }
      } else {
        setError(`Job '${id}' submitted but timed out waiting for results. Check logs manually.`);
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

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Compute Engine
        </h2>
        <p className="mt-2 text-slate-500 text-lg">
          Execute Python functions on the decentralized Nomad cluster. Code runs on real nodes via{" "}
          <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">raw_exec</code>.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => selectPreset(preset)}
            className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
              selectedPreset.id === preset.id
                ? "border-[#08dd9a] bg-emerald-50/60 shadow-lg shadow-[#08dd9a]/10"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
          >
            <div className="text-2xl mb-2">{preset.icon}</div>
            <div className="font-bold text-slate-800 text-sm">{preset.label}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{preset.description}</div>
            {selectedPreset.id === preset.id && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-[#08dd9a] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Code Editor or Image Generation Prompt */}
      {selectedPreset.id === "image-gen" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center space-y-6">
          <div className="text-5xl drop-shadow-sm mb-2">🎨</div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-2xl font-bold text-slate-800">Generate Procedural Image</h3>
            <p className="text-slate-500">
              Run this intensive Python script directly on the Nomad cluster to generate custom generative art and stream back the result natively.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="mt-6 h-14 px-12 bg-[#08dd9a] hover:bg-[#06c98a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl shadow-[#08dd9a]/25 transition-all flex items-center gap-3 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
          >
            {isRunning ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating on cluster...
              </>
            ) : (
              <>
                ✨ Run on Cluster
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{selectedPreset.icon}</span>
              <h3 className="font-bold">{selectedPreset.label}</h3>
              <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded font-mono">raw_exec</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Python 3.11</span>
              <span>•</span>
              <span>numpy, psutil available</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-slate-200 bg-slate-900 text-emerald-400 font-mono text-sm p-4 outline-none transition focus:border-[#08dd9a] focus:ring-2 focus:ring-[#08dd9a]/20 placeholder:text-slate-600 resize-y leading-relaxed"
                placeholder="# Write Python code..."
                spellCheck={false}
              />
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-700 text-slate-400 text-[10px] font-mono rounded">
                {code.split("\n").length} lines
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">CPU</label>
                  <select value={cpu} onChange={(e) => setCpu(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none">
                    <option value={250}>250 MHz</option>
                    <option value={500}>500 MHz</option>
                    <option value={1000}>1,000 MHz</option>
                    <option value={2000}>2,000 MHz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Memory</label>
                  <select value={memory} onChange={(e) => setMemory(Number(e.target.value))} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none">
                    <option value={128}>128 MB</option>
                    <option value={256}>256 MB</option>
                    <option value={512}>512 MB</option>
                    <option value={1024}>1,024 MB</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isRunning || !code.trim()}
                className="h-11 px-8 bg-[#08dd9a] hover:bg-[#06c98a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm shadow-lg shadow-[#08dd9a]/25 transition-all flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing on cluster...
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
            </div>
          </div>
        </div>
      )}

      {/* Running Progress */}
      {isRunning && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-[3px] border-[#08dd9a]/30 border-t-[#08dd9a] rounded-full animate-spin" />
              <div>
                <div className="text-white font-bold">Executing on Nomad Cluster</div>
                <div className="text-slate-400 text-sm">
                  {jobId ? `Job: ${jobId}` : "Submitting..."}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#08dd9a] font-mono">{elapsedTime}s</div>
          </div>

          <div className="space-y-1.5">
            {PHASES.map((phase, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500 ${
                  idx < currentPhase
                    ? "bg-emerald-900/30 text-emerald-400"
                    : idx === currentPhase
                      ? "bg-slate-800 text-white"
                      : "text-slate-600"
                }`}
              >
                <span className="w-6 text-center">{idx < currentPhase ? "✓" : phase.icon}</span>
                <span className="text-sm font-medium">{phase.label}</span>
                {idx === currentPhase && (
                  <span className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#08dd9a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#08dd9a] rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#08dd9a] rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isRunning && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
          <svg className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="font-bold text-rose-800">Execution Failed</div>
            <div className="text-sm text-rose-700 mt-1 font-mono whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      {/* Result */}
      {logs && !isRunning && (
        <div ref={resultRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Confirmation banner */}
          <div className={`rounded-xl p-4 flex items-center gap-4 ${
            logs.status === "complete"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-rose-50 border border-rose-200"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              logs.status === "complete" ? "bg-[#08dd9a]" : "bg-rose-500"
            }`}>
              {logs.status === "complete" ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">
                {logs.status === "complete" ? "✅ Executed Successfully on Remote Node" : "❌ Execution Failed"}
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span>Node: <strong className="font-mono">{logs.node}</strong></span>
                <span>Job: <strong className="font-mono">{jobId}</strong></span>
                <span>Time: <strong>{elapsedTime}s</strong></span>
              </div>
            </div>
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                🎨 Generated Image
                <span className="text-xs text-slate-400 font-normal">— computed on <strong>{logs.node}</strong></span>
              </h4>
              <div className="flex justify-center bg-slate-900 rounded-lg p-6">
                <img
                  src={generatedImage}
                  alt={`Generated on ${logs.node}`}
                  className="max-w-full rounded shadow-2xl"
                />
              </div>
            </div>
          )}

          {/* Terminal Output */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="font-bold text-sm">stdout</span>
                <span className={`text-xs font-mono ${statusColor(logs.status)}`}>[{logs.status}]</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{logs.node}</span>
            </div>
            <pre
              ref={logRef}
              className="bg-slate-900 p-4 text-emerald-400 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96 leading-relaxed"
            >
              {logs.output ? cleanOutput(logs.output) : "(no output)"}
            </pre>
          </div>

          {/* Stderr */}
          {logs.stderr && logs.stderr.trim() && (
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-6 py-3">
                <span className="text-rose-400 font-bold text-sm">stderr</span>
              </div>
              <pre className="bg-slate-900 p-4 text-rose-400 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48 leading-relaxed">
                {logs.stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

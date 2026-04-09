"use client";

import React, { useEffect, useState, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

type TaskGroupSummary = {
  queued?: number;
  complete?: number;
  failed?: number;
  running?: number;
  starting?: number;
  lost?: number;
};

type JobItem = {
  id: string;
  name: string;
  status: string;           // running | dead | pending
  type: string;              // batch | service | system
  create_time?: number;
  meta?: Record<string, string>;
  task_groups?: Record<string, TaskGroupSummary>;
  datacenters?: string[];
  // computed on client
  resolvedStatus: "running" | "complete" | "queued" | "failed" | "dead" | "pending";
  region: string;
  shortId: string;
  timeAgo: string;
  cpuPercent: number;       // mock
  ramPercent: number;       // mock
  allocations: string[];    // mock
};

type LogData = {
  job_id: string;
  output: string;
  stderr: string;
  status: string;
  node?: string;
  task?: string;
  alloc_id?: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveStatus(job: any): JobItem["resolvedStatus"] {
  if (job.status === "running") return "running";
  if (job.status === "pending") return "queued";
  if (job.status === "dead" && job.task_groups) {
    let hasComplete = false;
    let hasFailed = false;
    for (const tg of Object.values<any>(job.task_groups)) {
      if (tg.complete > 0) hasComplete = true;
      if (tg.failed > 0) hasFailed = true;
    }
    if (hasComplete && !hasFailed) return "complete";
    if (hasFailed) return "failed";
  }
  if (job.status === "dead") return "dead";
  return job.status as JobItem["resolvedStatus"];
}

function timeAgo(nsTimestamp: number): string {
  const ms = nsTimestamp / 1_000_000;
  const diff = Math.floor((Date.now() - ms) / 60_000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fakeAllocations(jobId: string): string[] {
  const seed = jobId.charCodeAt(0) + jobId.charCodeAt(1);
  const count = 1 + (seed % 3);
  return Array.from({ length: count }, (_, i) => {
    const chars = "0123456789abcdef";
    let id = "";
    for (let j = 0; j < 8; j++) {
      id += chars[(jobId.charCodeAt(j % jobId.length) + i * 7 + j * 3) % 16];
    }
    return `alloc-${id}`;
  });
}

function fakeResource(jobId: string, offset: number): number {
  const seed = jobId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.min(95, Math.max(15, ((seed + offset * 37) % 80) + 10));
}

const REGIONS = ["EU-West", "US-East", "US-West", "EU-Central", "AP-South"];
function fakeRegion(job: any): string {
  if (job.datacenters?.length) return job.datacenters[0];
  const seed = (job.id || "x").charCodeAt(0);
  return REGIONS[seed % REGIONS.length];
}

// ── Mock logs for when real logs aren't available ───────────────────────────

function generateMockLogs(job: JobItem): string {
  const now = new Date();
  const lines = [
    `[${formatLogTime(now, -120)}] INFO: Starting ${job.name} node...`,
    `[${formatLogTime(now, -90)}] INFO: Connected to grid mesh network.`,
    `[${formatLogTime(now, -60)}] INFO: Awaiting compute tasks from dispatcher.`,
  ];

  if (job.resolvedStatus === "running") {
    lines.push(
      `[${formatLogTime(now, -30)}] INFO: Processing workload batch #${Math.floor(Math.random() * 900) + 100}.`,
      `[${formatLogTime(now, -10)}] INFO: Resource utilization at ${job.cpuPercent}% CPU, ${job.ramPercent}% RAM.`,
    );
  } else if (job.resolvedStatus === "complete") {
    lines.push(
      `[${formatLogTime(now, -20)}] INFO: Workload execution completed successfully.`,
      `[${formatLogTime(now, -5)}] INFO: Uploading artifact to storage...`,
      `[${formatLogTime(now, 0)}] INFO: Job finished. All allocations deallocated.`,
    );
  } else if (job.resolvedStatus === "failed") {
    lines.push(
      `[${formatLogTime(now, -15)}] WARN: High memory usage detected (${job.ramPercent}%).`,
      `[${formatLogTime(now, -5)}] ERROR: Out of memory — allocation killed.`,
    );
  }
  return lines.join("\n");
}

function formatLogTime(base: Date, offsetSeconds: number): string {
  const d = new Date(base.getTime() + offsetSeconds * 1000);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

// ── Status Styling ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  running: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Running" },
  complete: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Complete" },
  queued: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Queued" },
  failed: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", label: "Failed" },
  dead: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "Stopped" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
};

// ── Component ───────────────────────────────────────────────────────────────

export function NetworkActivity() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<Record<string, string>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/compute/jobs");
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.jobs) return;

      const transformed: JobItem[] = data.jobs
        .sort((a: any, b: any) => Number(b.create_time || 0) - Number(a.create_time || 0))
        .slice(0, 10)
        .map((job: any) => {
          const resolved = resolveStatus(job);
          return {
            id: job.id,
            name: job.name,
            status: job.status,
            type: job.type,
            create_time: job.create_time,
            meta: job.meta,
            task_groups: job.task_groups,
            datacenters: job.datacenters,
            resolvedStatus: resolved,
            region: fakeRegion(job),
            shortId: (job.id || "").slice(0, 12),
            timeAgo: job.create_time ? timeAgo(Number(job.create_time)) : "–",
            cpuPercent: fakeResource(job.id, 0),
            ramPercent: fakeResource(job.id, 1),
            allocations: fakeAllocations(job.id),
          } as JobItem;
        });

      setJobs(transformed);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // ── Expand / Collapse with log fetching ─────────────────────────────────
  const toggleExpand = async (job: JobItem) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(job.id);

    if (jobLogs[job.id]) return; // already loaded

    setLogsLoading((p) => ({ ...p, [job.id]: true }));
    try {
      const res = await fetch(`/api/compute/jobs/${job.id}/logs`);
      if (res.ok) {
        const data: LogData = await res.json();
        const output = [data.output, data.stderr].filter(Boolean).join("\n") || "";
        setJobLogs((p) => ({ ...p, [job.id]: output }));
      } else {
        // Use mock logs as fallback
        setJobLogs((p) => ({ ...p, [job.id]: generateMockLogs(job) }));
      }
    } catch {
      setJobLogs((p) => ({ ...p, [job.id]: generateMockLogs(job) }));
    } finally {
      setLogsLoading((p) => ({ ...p, [job.id]: false }));
    }
  };

  // ── Resource Bar ────────────────────────────────────────────────────────
  const ResourceBar = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-slate-400 w-7 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{percent}%</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg tracking-tight text-slate-800">
        Network Activity
        {loading && (
          <span className="ml-2 text-xs text-slate-400 font-normal animate-pulse">
            Data loading...
          </span>
        )}
      </h3>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_100px_160px_100px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/70">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Details</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Region</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resource Usage</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</span>
        </div>

        {/* Loading state */}
        {loading && jobs.length === 0 && (
          <div className="px-6 py-12 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Data loading...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            No recent network activity on the cluster.
          </div>
        )}

        {/* Job Rows */}
        {jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          const style = STATUS_STYLES[job.resolvedStatus] || STATUS_STYLES.dead;
          const logContent = jobLogs[job.id];
          const isLogLoading = logsLoading[job.id];

          return (
            <div key={job.id} className="border-b border-slate-100 last:border-b-0">
              {/* Main Row */}
              <div
                className={`grid grid-cols-[1fr_100px_100px_160px_100px] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors cursor-pointer ${
                  isExpanded ? "bg-slate-50/80" : ""
                }`}
                onClick={() => toggleExpand(job)}
              >
                {/* Job Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      {job.resolvedStatus === "running" ? "🖥️" : job.resolvedStatus === "complete" ? "✅" : job.resolvedStatus === "failed" ? "❌" : "📋"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{job.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 ml-7">
                    Job ID: {job.shortId} • {job.timeAgo}
                  </p>
                </div>

                {/* Region */}
                <span className="text-sm text-slate-600">{job.region}</span>

                {/* Status Badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${job.resolvedStatus === "running" ? "animate-pulse" : ""}`} />
                    {style.label}
                  </span>
                </div>

                {/* Resource Usage */}
                <div className="flex flex-col gap-1.5">
                  <ResourceBar label="CPU" percent={job.cpuPercent} color={job.cpuPercent > 80 ? "bg-amber-400" : "bg-emerald-400"} />
                  <ResourceBar label="RAM" percent={job.ramPercent} color={job.ramPercent > 80 ? "bg-amber-400" : "bg-blue-400"} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  {job.resolvedStatus === "running" && (
                    <button
                      className="text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Stop
                    </button>
                  )}
                  {job.resolvedStatus === "queued" && (
                    <button
                      className="text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Cancel
                    </button>
                  )}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* ── Expanded Detail Panel ──────────────────────────────── */}
              {isExpanded && (
                <div className="px-6 pb-5 bg-slate-50/60 animate-in slide-in-from-top-2 duration-200">

                  {/* Active Allocations */}
                  <div className="mb-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Active Allocations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.allocations.map((alloc) => (
                        <span
                          key={alloc}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 shadow-sm"
                        >
                          {alloc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live Logs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Live Logs ({job.allocations[0]?.toUpperCase()})
                      </p>
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 max-h-[200px] overflow-y-auto font-mono text-xs leading-relaxed shadow-inner">
                      {isLogLoading ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                          Loading logs...
                        </div>
                      ) : (
                        <>
                          {(logContent || generateMockLogs(job)).split("\n").map((line, i) => {
                            let color = "text-slate-300";
                            if (line.includes("ERROR")) color = "text-rose-400";
                            else if (line.includes("WARN")) color = "text-amber-400";
                            else if (line.includes("INFO")) color = "text-emerald-300";

                            // Highlight timestamps
                            const timestampMatch = line.match(/^\[([^\]]+)\]/);

                            return (
                              <div key={i} className={color}>
                                {timestampMatch ? (
                                  <>
                                    <span className="text-blue-400">[{timestampMatch[1]}]</span>
                                    {line.slice(timestampMatch[0].length)}
                                  </>
                                ) : (
                                  line
                                )}
                              </div>
                            );
                          })}
                          {job.resolvedStatus === "running" && (
                            <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse mt-1" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  status: string;
  type: string;
  create_time?: number;
  meta?: Record<string, string>;
  task_groups?: Record<string, TaskGroupSummary>;
  datacenters?: string[];
  resolvedStatus: "running" | "complete" | "queued" | "failed" | "dead" | "pending";
  region: string;
  shortId: string;
  timeAgo: string;
  cpuPercent: number;
  ramPercent: number;
  allocations: string[];
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

function generateMockLogs(job: JobItem): string {
  const now = new Date();
  const lines = [
    `[${fmtTime(now, -120)}] INFO: Starting ${job.name} node...`,
    `[${fmtTime(now, -90)}] INFO: Connected to grid mesh network.`,
    `[${fmtTime(now, -60)}] INFO: Awaiting compute tasks from dispatcher.`,
  ];
  if (job.resolvedStatus === "running") {
    lines.push(
      `[${fmtTime(now, -30)}] INFO: Processing workload batch #${Math.floor(Math.random() * 900) + 100}.`,
      `[${fmtTime(now, -10)}] INFO: Resource utilization at ${job.cpuPercent}% CPU, ${job.ramPercent}% RAM.`,
    );
  } else if (job.resolvedStatus === "complete") {
    lines.push(
      `[${fmtTime(now, -20)}] INFO: Workload execution completed successfully.`,
      `[${fmtTime(now, -5)}] INFO: Uploading artifact to storage...`,
      `[${fmtTime(now, 0)}] INFO: Job finished. All allocations deallocated.`,
    );
  } else if (job.resolvedStatus === "failed") {
    lines.push(
      `[${fmtTime(now, -15)}] WARN: High memory usage detected (${job.ramPercent}%).`,
      `[${fmtTime(now, -5)}] ERROR: Out of memory — allocation killed.`,
    );
  }
  return lines.join("\n");
}

function fmtTime(base: Date, offsetSeconds: number): string {
  const d = new Date(base.getTime() + offsetSeconds * 1000);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  running: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Running" },
  complete: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Complete" },
  queued: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Queued" },
  failed: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", label: "Failed" },
  dead: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", label: "Stopped" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
};

const PREVIEW_COUNT = 4;
const MODAL_PAGE_SIZE = 6;

// ── Shared Sub-Components ───────────────────────────────────────────────────

function ResourceBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-slate-400 w-7 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{percent}%</span>
    </div>
  );
}

function LogTerminal({ job, logContent, isLogLoading }: { job: JobItem; logContent?: string; isLogLoading?: boolean }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 max-h-[220px] overflow-y-auto font-mono text-xs leading-relaxed shadow-inner">
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
            const ts = line.match(/^\[([^\]]+)\]/);
            return (
              <div key={i} className={color}>
                {ts ? (<><span className="text-blue-400">[{ts[1]}]</span>{line.slice(ts[0].length)}</>) : line}
              </div>
            );
          })}
          {job.resolvedStatus === "running" && <span className="inline-block w-2 h-4 bg-slate-400 animate-pulse mt-1" />}
        </>
      )}
    </div>
  );
}

function JobTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_100px_100px_160px_100px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/70">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Details</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Region</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resource Usage</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</span>
    </div>
  );
}

type JobActionPhase = "idle" | "loading" | "done" | "error";

function JobRow({
  job,
  isExpanded,
  onToggle,
  logContent,
  isLogLoading,
  actionPhase,
  onCancel,
  onStop,
}: {
  job: JobItem;
  isExpanded: boolean;
  onToggle: () => void;
  logContent?: string;
  isLogLoading?: boolean;
  actionPhase: JobActionPhase;
  onCancel: (job: JobItem, e: React.MouseEvent) => void;
  onStop: (job: JobItem, e: React.MouseEvent) => void;
}) {
  const style = STATUS_STYLES[job.resolvedStatus] || STATUS_STYLES.dead;
  const cancelDisabled = actionPhase === "loading" || actionPhase === "done";
  const cancelLabel =
    actionPhase === "loading"
      ? "Canceling..."
      : actionPhase === "done"
        ? "Canceled"
        : actionPhase === "error"
          ? "Retry"
          : "Cancel";
  const stopDisabled = actionPhase === "loading" || actionPhase === "done";
  const stopLabel =
    actionPhase === "loading"
      ? "Stopping..."
      : actionPhase === "done"
        ? "Stopped"
        : actionPhase === "error"
          ? "Retry"
          : "Stop";

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Main Row */}
      <div
        className={`grid grid-cols-[1fr_100px_100px_160px_100px] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50/80" : ""}`}
        onClick={onToggle}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              {job.resolvedStatus === "running" ? "🖥️" : job.resolvedStatus === "complete" ? "✅" : job.resolvedStatus === "failed" ? "❌" : "📋"}
            </span>
            <h4 className="font-bold text-slate-900 text-sm truncate">{job.name}</h4>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 ml-7">Job ID: {job.shortId} • {job.timeAgo}</p>
        </div>
        <span className="text-sm text-slate-600">{job.region}</span>
        <div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${job.resolvedStatus === "running" ? "animate-pulse" : ""}`} />
            {style.label}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <ResourceBar label="CPU" percent={job.cpuPercent} color={job.cpuPercent > 80 ? "bg-amber-400" : "bg-emerald-400"} />
          <ResourceBar label="RAM" percent={job.ramPercent} color={job.ramPercent > 80 ? "bg-amber-400" : "bg-blue-400"} />
        </div>
        <div className="flex items-center justify-end gap-2">
          {job.resolvedStatus === "running" && (
            <button
              type="button"
              disabled={stopDisabled}
              className={`text-xs font-semibold transition-colors ${
                stopDisabled
                  ? actionPhase === "done"
                    ? "text-slate-400 cursor-default"
                    : "text-slate-400 cursor-wait"
                  : actionPhase === "error"
                    ? "text-rose-600 hover:text-rose-700"
                    : "text-slate-600 hover:text-rose-600"
              }`}
              onClick={(e) => onStop(job, e)}
            >
              {stopLabel}
            </button>
          )}
          {job.resolvedStatus === "queued" && (
            <button
              type="button"
              disabled={cancelDisabled}
              className={`text-xs font-semibold transition-colors ${
                cancelDisabled
                  ? actionPhase === "done"
                    ? "text-slate-400 cursor-default"
                    : "text-slate-400 cursor-wait"
                  : actionPhase === "error"
                    ? "text-rose-600 hover:text-rose-700"
                    : "text-slate-600 hover:text-rose-600"
              }`}
              onClick={(e) => onCancel(job, e)}
            >
              {cancelLabel}
            </button>
          )}
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-6 pb-5 bg-slate-50/60 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Allocations</p>
            <div className="flex flex-wrap gap-2">
              {job.allocations.map((alloc) => (
                <span key={alloc} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 shadow-sm">{alloc}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Logs ({job.allocations[0]?.toUpperCase()})</p>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
            <LogTerminal job={job} logContent={logContent} isLogLoading={isLogLoading} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function NetworkActivity() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<Record<string, string>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(0);
  const [jobActionPhase, setJobActionPhase] = useState<Record<string, JobActionPhase>>({});

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/compute/jobs");
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.jobs) return;
      const transformed: JobItem[] = data.jobs
        .sort((a: any, b: any) => Number(b.create_time || 0) - Number(a.create_time || 0))
        .map((job: any) => {
          const resolved = resolveStatus(job);
          return {
            id: job.id, name: job.name, status: job.status, type: job.type,
            create_time: job.create_time, meta: job.meta, task_groups: job.task_groups,
            datacenters: job.datacenters, resolvedStatus: resolved, region: fakeRegion(job),
            shortId: (job.id || "").slice(0, 12),
            timeAgo: job.create_time ? timeAgo(Number(job.create_time)) : "–",
            cpuPercent: fakeResource(job.id, 0), ramPercent: fakeResource(job.id, 1),
            allocations: fakeAllocations(job.id),
          } as JobItem;
        });
      setJobs(transformed);
    } catch { /* keep existing */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); const id = setInterval(fetchJobs, 8000); return () => clearInterval(id); }, [fetchJobs]);

  useEffect(() => {
    const ids = new Set(jobs.map((j) => j.id));
    setJobActionPhase((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [jobs]);

  const stopOrCancelJob = async (job: JobItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobActionPhase((p) => ({ ...p, [job.id]: "loading" }));
    try {
      const res = await fetch(`/api/compute/jobs/${encodeURIComponent(job.id)}`, { method: "DELETE" });
      if (!res.ok) {
        setJobActionPhase((p) => ({ ...p, [job.id]: "error" }));
        return;
      }
      setJobActionPhase((p) => ({ ...p, [job.id]: "done" }));
      await fetchJobs();
    } catch {
      setJobActionPhase((p) => ({ ...p, [job.id]: "error" }));
    }
  };

  const toggleExpand = async (job: JobItem) => {
    if (expandedJobId === job.id) { setExpandedJobId(null); return; }
    setExpandedJobId(job.id);
    if (jobLogs[job.id]) return;
    setLogsLoading((p) => ({ ...p, [job.id]: true }));
    try {
      const res = await fetch(`/api/compute/jobs/${job.id}/logs`);
      if (res.ok) {
        const data: LogData = await res.json();
        setJobLogs((p) => ({ ...p, [job.id]: [data.output, data.stderr].filter(Boolean).join("\n") || "" }));
      } else {
        setJobLogs((p) => ({ ...p, [job.id]: generateMockLogs(job) }));
      }
    } catch { setJobLogs((p) => ({ ...p, [job.id]: generateMockLogs(job) })); }
    finally { setLogsLoading((p) => ({ ...p, [job.id]: false })); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const previewJobs = jobs.slice(0, PREVIEW_COUNT);
  const totalPages = Math.ceil(jobs.length / MODAL_PAGE_SIZE);
  const modalJobs = jobs.slice(modalPage * MODAL_PAGE_SIZE, (modalPage + 1) * MODAL_PAGE_SIZE);

  const openModal = () => { setModalPage(0); setExpandedJobId(null); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setExpandedJobId(null); };

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-bold text-lg tracking-tight text-slate-800">
          Network Activity
          {loading && <span className="ml-2 text-xs text-slate-400 font-normal animate-pulse">Data loading...</span>}
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <JobTableHeader />

          {/* Loading */}
          {loading && jobs.length === 0 && (
            <div className="px-6 py-12 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Data loading...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && jobs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No recent network activity on the cluster.</div>
          )}

          {/* Preview rows (max 4) */}
          {previewJobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggle={() => toggleExpand(job)}
              logContent={jobLogs[job.id]}
              isLogLoading={logsLoading[job.id]}
              actionPhase={jobActionPhase[job.id] ?? "idle"}
              onCancel={stopOrCancelJob}
              onStop={stopOrCancelJob}
            />
          ))}

          {/* View All button */}
          {jobs.length > PREVIEW_COUNT && (
            <button
              onClick={openModal}
              className="w-full py-4 text-sm font-bold text-blue-600 hover:text-blue-800 bg-slate-50/50 hover:bg-blue-50/60 transition-colors border-t border-slate-100 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              View All Activity ({jobs.length} jobs)
            </button>
          )}
        </div>
      </div>

      {/* ── Full Activity Modal ─────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal */}
          <div className="relative w-full max-w-[1100px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Job Activity History</h2>
                <p className="text-xs text-slate-500 mt-0.5">{jobs.length} total jobs • Page {modalPage + 1} of {totalPages}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto">
              <JobTableHeader />
              {modalJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isExpanded={expandedJobId === job.id}
                  onToggle={() => toggleExpand(job)}
                  logContent={jobLogs[job.id]}
                  isLogLoading={logsLoading[job.id]}
                  actionPhase={jobActionPhase[job.id] ?? "idle"}
                  onCancel={stopOrCancelJob}
                  onStop={stopOrCancelJob}
                />
              ))}
            </div>

            {/* Modal Footer — Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
                <button
                  onClick={() => setModalPage((p) => Math.max(0, p - 1))}
                  disabled={modalPage === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setModalPage(i); setExpandedJobId(null); }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        i === modalPage
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setModalPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={modalPage === totalPages - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

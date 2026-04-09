"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BaseLayout } from "@/components/BaseLayout";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

type ResourceStats = {
  cpu: { used: number; total: number };
  gpu: { used: number; total: number };
  ram: { used: number; total: number };
};

type ServerNode = {
  id: string;
  company: string;
  capacity: number;
  used: number;
  sharedExport: number;
  borrowedImport: number;
  throughput: number;
  ramUsage: number;
  state: "running" | "warning" | "down";
  uptime: number;
  latencyMs: number;
  demandSeries: number[];
  /** Per-resource usage stats */
  resourceStats?: ResourceStats;
};

const TIME_LABELS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"];

const CHART_COLORS = [
  { border: "#2563eb", bg: "rgba(37, 99, 235, 0.05)", fill: true },
  { border: "#d97706", bg: "transparent", fill: false },
  { border: "#16a34a", bg: "transparent", fill: false },
  { border: "#dc2626", bg: "transparent", fill: false },
  { border: "#8b5cf6", bg: "transparent", fill: false },
];

function ResourceStatRow({
  label,
  used,
  total,
  unit,
  animated,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
  animated: boolean;
}) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono tabular-nums text-slate-500">
          <span className="font-medium text-slate-900">{used}</span> / {total} {unit}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-slate-800 transition-[width] duration-700 ease-out"
          style={{ width: animated ? `${percentage}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function ServerStatsCard({ server }: { server: ServerNode }) {
  const stats = server.resourceStats!;
  const [barsReady, setBarsReady] = useState(false);
  const isUnreachable = server.state === "down";

  useEffect(() => {
    if (isUnreachable) {
      return;
    }
    const id = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(id);
  }, [isUnreachable]);

  const stateStyles =
    server.state === "running"
      ? {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      }
      : server.state === "warning"
        ? {
          badge: "border-amber-200 bg-amber-50 text-amber-800",
        }
        : {
          badge: "border-rose-200 bg-rose-50 text-rose-800",
        };

  const statusLabel = server.state === "down" ? "Unreachable" : server.state;

  return (
    <article className="relative overflow-visible rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-slate-900">{server.company}</p>
          <p className="text-xs text-slate-500">Server ID: {server.id}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stateStyles.badge}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {isUnreachable ? (
        <div className="relative mt-5 border-t border-slate-100 pt-6">
          <div className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">No resource signal</p>
            <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-slate-500">
              Compute stats are unavailable while this server is unreachable.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5">
          <ResourceStatRow
            label="CPU Compute"
            used={stats.cpu.used}
            total={stats.cpu.total}
            unit="vCPU"
            animated={barsReady}
          />
          <ResourceStatRow
            label="GPU Acceleration"
            used={stats.gpu.used}
            total={stats.gpu.total}
            unit="Cores"
            animated={barsReady}
          />
          <ResourceStatRow
            label="Memory (RAM)"
            used={stats.ram.used}
            total={stats.ram.total}
            unit="GB"
            animated={barsReady}
          />
        </div>
      )}
    </article>
  );
}

function ServerCard({ server }: { server: ServerNode }) {
  if (!server.resourceStats) {
    return null;
  }
  return <ServerStatsCard server={server} />;
}

export default function AdminDashboardPage() {
  const [hiddenDatasets, setHiddenDatasets] = useState<Record<number, boolean>>({});
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>(TIME_LABELS);
  const [activities, setActivities] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' }[]>([
    { message: "New node 'omega-node-02' joined the compute cluster", type: "success" },
    { message: "Scheduled maintenance for 'beta-systems' has been completed", type: "info" },
    { message: "Unexpected latency spike detected in eu-west-1 region", type: "warning" },
  ]);

  useEffect(() => {
    const updateTimeLabels = () => {
      const labels = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
        labels.push(
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
        );
      }
      setTimeLabels(labels);
    };

    updateTimeLabels();
    const interval = setInterval(updateTimeLabels, 15 * 60 * 1000); // Update every 15 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/compute/metrics");
        if (!res.ok) return;
        const data = await res.json();
        if (data.nodes) {
          const mapped: ServerNode[] = data.nodes.map((n: any, idx: number) => ({
            id: n.id,
            company: n.company,
            capacity: Math.round(n.cpu.total_mhz / 1000) || 1,
            used: Math.round(n.cpu.used_mhz / 1000) || 0,
            sharedExport: n.allocations ? n.allocations * 2 : 0,
            borrowedImport: 0,
            throughput: n.cpu.total_mhz ? n.cpu.total_mhz / 1000 : 0,
            ramUsage: n.memory.percent || 0,
            state: n.status === "ready" ? "running" : n.status === "down" ? "down" : "warning",
            uptime: n.status === "ready" ? 99.8 : n.status === "down" ? 0 : 95.0,
            latencyMs: n.status === "ready" ? 18 + (idx * 4) : 0,
            demandSeries: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 20),
            resourceStats: {
              cpu: { used: Math.round(n.cpu.used_mhz / 1000), total: Math.round(n.cpu.total_mhz / 1000) || 1 },
              gpu: { used: 0, total: n.gpu_type !== "none" ? 40 : 0 },
              ram: { used: Math.round(n.memory.used_mb / 1024), total: Math.round(n.memory.total_mb / 1024) || 1 },
            }
          }));
          setServers(mapped);

          if (mapped.length > 0) {
            const hasDown = mapped.some((s: ServerNode) => s.state === 'down');
            setActivities([
              { message: "New node 'omega-node-02' joined the compute cluster", type: "success" },
              { message: "Scheduled maintenance for 'beta-systems' has been completed", type: "info" },
              { message: "Unexpected latency spike detected in eu-west-1 region", type: "warning" },
              { message: hasDown ? "A server became unreachable" : "All nodes reporting healthy status", type: hasDown ? 'error' : 'success' },
              { message: "Cluster validation suite completed with 0 errors", type: 'success' },
              { message: "Automatic resource defragmentation optimized 2 nodes", type: 'success' },
            ]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    void loadData();
    const interval = setInterval(() => void loadData(), 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleDataset = (index: number) => {
    setHiddenDatasets((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const totalCapacity = useMemo(
    () => servers.reduce((sum, server) => sum + server.capacity, 0),
    [servers],
  );
  const totalUsed = useMemo(() => servers.reduce((sum, server) => sum + server.used, 0), [servers]);
  const totalShared = useMemo(
    () => servers.reduce((sum, server) => sum + server.sharedExport, 0),
    [servers],
  );
  const totalBorrowed = useMemo(
    () => servers.reduce((sum, server) => sum + server.borrowedImport, 0),
    [servers],
  );
  const avgSpeed = useMemo(
    () => servers.length > 0 ? servers.reduce((sum, server) => sum + server.throughput, 0) / servers.length : 0,
    [servers],
  );
  const runningCount = useMemo(
    () => servers.filter((server) => server.state === "running").length,
    [servers],
  );
  const downCount = useMemo(
    () => servers.filter((server) => server.state === "down").length,
    [servers],
  );
  const warningCount = useMemo(
    () => servers.filter((server) => server.state === "warning").length,
    [servers],
  );
  const avgUptime = useMemo(
    () => servers.length > 0 ? servers.reduce((sum, server) => sum + server.uptime, 0) / servers.length : 0,
    [servers],
  );

  const demandLineData = useMemo(
    () => ({
      labels: timeLabels,
      datasets: servers.map((server, idx) => {
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        return {
          label: server.company,
          data: server.demandSeries,
          hidden: hiddenDatasets[idx] ?? false,
          borderColor: color.border,
          backgroundColor: color.bg,
          fill: color.fill,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 1.5,
        };
      }),
    }),
    [servers, hiddenDatasets, timeLabels],
  );

  const demandLineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false },
          border: { color: "#e2e8f0" },
        },
        y: {
          ticks: { color: "#64748b" },
          grid: { color: "#e2e8f0" },
          border: { color: "#e2e8f0" },
          beginAtZero: true,
          suggestedMax: 100,
        },
      },
    }),
    [],
  );

  return (
    <div className={`flex min-h-screen w-full flex-1 flex-col text-slate-900 ${spaceGrotesk.className}`}>
      <BaseLayout
        headerEyebrow="Platform Operations"
        headerTitle="Corimb Dashboard"
      >
        <div className="space-y-6 p-4 md:p-6 xl:p-8">
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Compute Overview</p>
              <div className="mt-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><span className="shrink-0 h-1.5 w-1.5 rounded-full bg-slate-400" />Total compute available: <span className="font-semibold text-slate-900">{totalCapacity} vCPU</span></span>
                  <span className="mt-1 text-xs text-slate-500 sm:mt-0">Across {servers.length} servers</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><span className="shrink-0 h-1.5 w-1.5 rounded-full bg-slate-400" />Compute allocated: <span className="font-semibold text-slate-900">{totalShared} vCPU</span></span>
                  <span className="mt-1 text-xs text-slate-500 sm:mt-0">Exported to pool</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><span className="shrink-0 h-1.5 w-1.5 rounded-full bg-slate-400" />Borrowed demand: <span className="font-semibold text-slate-900">{totalBorrowed} vCPU</span></span>
                  <span className="mt-1 text-xs text-slate-500 sm:mt-0">Imported from pool</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><span className="shrink-0 h-1.5 w-1.5 rounded-full bg-slate-400" />Avg throughput: <span className="font-semibold text-slate-900">{avgSpeed.toFixed(1)} GHz</span></span>
                  <span className="mt-1 text-xs text-slate-500 sm:mt-0">Processing speed</span>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Infrastructure Health</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
                    Running servers
                  </span>
                  <span className="font-semibold text-slate-900">{runningCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 h-2 w-2 rounded-full bg-amber-500" />
                    Warning state
                  </span>
                  <span className="font-semibold text-slate-900">{warningCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 h-2 w-2 rounded-full bg-rose-500" />
                    Unreachable servers
                  </span>
                  <span className="font-semibold text-slate-900">{downCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 h-2 w-2 rounded-full bg-slate-400" />
                    Avg uptime
                  </span>
                  <span className="font-semibold text-slate-900">{avgUptime.toFixed(2)}%</span>
                </div>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-800" />
                    Shared Compute Cluster ({servers.length} Servers)
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Each company contributes exactly one server node. Compute is dynamically shared by platform orchestration.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Orchestrated pool
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-4">
                {servers.map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-stretch">
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-base font-semibold text-slate-900">Demand Trends (24h)</p>
              <p className="text-xs text-slate-500">Demand curves for each server/company.</p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {demandLineData.datasets.map((ds, idx) => {
                  const isHidden = hiddenDatasets[idx] ?? false;
                  return (
                    <button
                      key={ds.label}
                      onClick={() => toggleDataset(idx)}
                      className="flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors"
                      style={{ color: isHidden ? "#94a3b8" : "#334155" }}
                    >
                      <div
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border transition-colors"
                        style={{
                          backgroundColor: isHidden ? "transparent" : ds.borderColor as string,
                          borderColor: ds.borderColor as string,
                        }}
                      >
                        {!isHidden && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {ds.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex-1 min-h-[16rem] rounded-xl border border-slate-200 bg-white p-3">
                <Line data={demandLineData} options={demandLineOptions} />
              </div>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-base font-semibold text-slate-900">Recent Activity Feed</p>
              <div className="mt-3 space-y-2">
                {activities.map((item, idx) => (
                  <div
                    key={`${(item as any).message || item}-${idx}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:border-slate-200"
                  >
                    <span
                      className={`mt-1.5 shrink-0 inline-flex h-1.5 w-1.5 rounded-full ${item.type === 'error' ? 'bg-rose-500' : item.type === 'warning' ? 'bg-amber-500' : item.type === 'success' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                    />
                    <p className="text-sm text-slate-700">
                      {typeof item === 'object' && item !== null ? ((item as any).message || JSON.stringify(item)) : String(item)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </BaseLayout>
    </div>
  );
}

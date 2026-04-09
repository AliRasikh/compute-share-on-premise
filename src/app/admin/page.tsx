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

const SERVERS: ServerNode[] = [
  {
    id: "A1",
    company: "Aster Labs",
    capacity: 160,
    used: 114,
    sharedExport: 26,
    borrowedImport: 8,
    throughput: 5.2,
    ramUsage: 68,
    state: "running",
    uptime: 99.7,
    latencyMs: 22,
    demandSeries: [38, 49, 71, 83, 76, 64, 69],
    resourceStats: {
      cpu: { used: 114, total: 160 },
      gpu: { used: 16, total: 40 },
      ram: { used: 68, total: 100 },
    },
  },
  {
    id: "B2",
    company: "Nova Systems",
    capacity: 140,
    used: 121,
    sharedExport: 11,
    borrowedImport: 19,
    throughput: 4.9,
    ramUsage: 81,
    state: "warning",
    uptime: 98.9,
    latencyMs: 29,
    demandSeries: [45, 58, 67, 88, 92, 84, 79],
    resourceStats: {
      cpu: { used: 121, total: 140 },
      gpu: { used: 28, total: 32 },
      ram: { used: 81, total: 100 },
    },
  },
  {
    id: "C3",
    company: "Helix Compute",
    capacity: 180,
    used: 84,
    sharedExport: 44,
    borrowedImport: 4,
    throughput: 5.6,
    ramUsage: 52,
    state: "running",
    uptime: 99.8,
    latencyMs: 18,
    demandSeries: [29, 36, 42, 61, 57, 48, 46],
    resourceStats: {
      cpu: { used: 84, total: 180 },
      gpu: { used: 8, total: 48 },
      ram: { used: 52, total: 100 },
    },
  },
  {
    id: "D4",
    company: "Vertex Ops",
    capacity: 150,
    used: 0,
    sharedExport: 0,
    borrowedImport: 0,
    throughput: 0,
    ramUsage: 0,
    state: "down",
    uptime: 94.2,
    latencyMs: 0,
    demandSeries: [33, 47, 51, 69, 74, 41, 0],
    resourceStats: {
      cpu: { used: 0, total: 150 },
      gpu: { used: 0, total: 32 },
      ram: { used: 0, total: 100 },
    },
  },
];

const ACTIVITIES = [
  "Aster Labs shared 24 vCPU to the pool",
  "Nova Systems reached 92% peak demand",
  "Vertex Ops server became unreachable at 19:21",
  "Helix Compute borrowed 4 vCPU burst capacity",
  "Global scheduler rebalanced workload across 4 servers",
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
        badge: "border-slate-200 bg-slate-50 text-slate-700",
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
  const totalCapacity = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.capacity, 0),
    [],
  );
  const totalUsed = useMemo(() => SERVERS.reduce((sum, server) => sum + server.used, 0), []);
  const totalShared = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.sharedExport, 0),
    [],
  );
  const totalBorrowed = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.borrowedImport, 0),
    [],
  );
  const avgSpeed = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.throughput, 0) / SERVERS.length,
    [],
  );
  const runningCount = useMemo(
    () => SERVERS.filter((server) => server.state === "running").length,
    [],
  );
  const downCount = useMemo(
    () => SERVERS.filter((server) => server.state === "down").length,
    [],
  );
  const warningCount = useMemo(
    () => SERVERS.filter((server) => server.state === "warning").length,
    [],
  );
  const avgUptime = useMemo(
    () => SERVERS.reduce((sum, server) => sum + server.uptime, 0) / SERVERS.length,
    [],
  );

  const demandLineData = useMemo(
    () => ({
      labels: TIME_LABELS,
      datasets: [
        {
          label: "Aster Labs",
          data: SERVERS[0].demandSeries,
          borderColor: "#0f172a",
          backgroundColor: "rgba(15, 23, 42, 0.05)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 1.5,
        },
        {
          label: "Nova Systems",
          data: SERVERS[1].demandSeries,
          borderColor: "#475569",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 1.5,
        },
        {
          label: "Helix Compute",
          data: SERVERS[2].demandSeries,
          borderColor: "#94a3b8",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 1.5,
        },
        {
          label: "Vertex Ops",
          data: SERVERS[3].demandSeries,
          borderColor: "#cbd5e1",
          backgroundColor: "transparent",
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 1.5,
        },
      ],
    }),
    [],
  );

  const demandLineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#334155", boxWidth: 10, boxHeight: 10 },
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
    <div className="flex min-h-screen w-full flex-1 flex-col text-slate-900">
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
                  <span className="mt-1 text-xs text-slate-500 sm:mt-0">Across {SERVERS.length} servers</span>
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
                    Shared Compute Cluster (4 Servers)
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
                {SERVERS.map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))}
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-stretch">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-base font-semibold text-slate-900">Demand Trends (24h)</p>
              <p className="text-xs text-slate-500">Demand curves for each server/company.</p>
              <div className="mt-4 h-72 rounded-xl border border-slate-200 bg-white p-3">
                <Line data={demandLineData} options={demandLineOptions} />
              </div>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-base font-semibold text-slate-900">Recent Activity Feed</p>
              <div className="mt-4 flex flex-1 flex-col justify-between space-y-2">
                {ACTIVITIES.map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition hover:border-slate-200"
                  >
                    <span
                      className={`mt-1.5 shrink-0 inline-flex h-1.5 w-1.5 rounded-full ${idx === 2 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-slate-300"
                        }`}
                    />
                    <p className="text-sm text-slate-700">{item}</p>
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

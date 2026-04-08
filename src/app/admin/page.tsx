"use client";

import { useMemo } from "react";
import {
  BarElement,
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
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

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
  },
  {
    id: "D4",
    company: "Vertex Ops",
    capacity: 150,
    used: 0,
    sharedExport: 0,
    borrowedImport: 25,
    throughput: 0,
    ramUsage: 0,
    state: "down",
    uptime: 94.2,
    latencyMs: 0,
    demandSeries: [33, 47, 51, 69, 74, 41, 0],
  },
];

const ACTIVITIES = [
  "Aster Labs shared 24 vCPU to the pool",
  "Nova Systems reached 92% peak demand",
  "Vertex Ops server went down at 19:21",
  "Helix Compute borrowed 4 vCPU burst capacity",
  "Global scheduler rebalanced workload across 4 servers",
];

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </article>
  );
}

function ServerCard({ server }: { server: ServerNode }) {
  const usagePct = Math.round((server.used / server.capacity) * 100);
  const available = server.capacity - server.used;
  const stateStyles =
    server.state === "running"
      ? {
          dot: "bg-emerald-400",
          ring: "bg-emerald-400/50",
          badge: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
        }
      : server.state === "warning"
        ? {
            dot: "bg-amber-400",
            ring: "bg-amber-400/45",
            badge: "border-amber-300/70 bg-amber-50 text-amber-700",
          }
        : {
            dot: "bg-rose-400",
            ring: "bg-rose-400/45",
            badge: "border-rose-300/70 bg-rose-50 text-rose-700",
          };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{server.company}</p>
          <p className="text-xs text-slate-500">Server ID: {server.id}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${stateStyles.badge}`}>
          {server.state}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${stateStyles.dot}`}>
          <span className={`absolute inset-0 animate-ping rounded-full ${stateStyles.ring}`} />
        </span>
        <p className="text-xs text-slate-600">Usage {usagePct}%</p>
      </div>

      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
          style={{ width: `${usagePct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          Capacity: <span className="font-semibold text-slate-900">{server.capacity} vCPU</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          Used: <span className="font-semibold text-slate-900">{server.used} vCPU</span>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5">
          Available: <span className="font-semibold text-blue-700">{available} vCPU</span>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5">
          Shared: <span className="font-semibold text-indigo-700">{server.sharedExport} vCPU</span>
        </div>
        <div className="col-span-2 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1.5">
          Borrowed: <span className="font-semibold text-cyan-700">{server.borrowedImport} vCPU</span>
        </div>
      </div>
    </article>
  );
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
  const avgLatency = useMemo(
    () =>
      SERVERS.filter((server) => server.latencyMs > 0).reduce((sum, server) => sum + server.latencyMs, 0) /
      SERVERS.filter((server) => server.latencyMs > 0).length,
    [],
  );
  const networkThroughput = useMemo(() => avgSpeed * 34.4, [avgSpeed]);

  const demandLineData = useMemo(
    () => ({
      labels: TIME_LABELS,
      datasets: [
        {
          label: "Aster Labs",
          data: SERVERS[0].demandSeries,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Nova Systems",
          data: SERVERS[1].demandSeries,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Helix Compute",
          data: SERVERS[2].demandSeries,
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6,182,212,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
        },
        {
          label: "Vertex Ops",
          data: SERVERS[3].demandSeries,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.08)",
          fill: false,
          tension: 0.35,
          borderWidth: 2.2,
          pointRadius: 1.8,
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

  const demandBarData = useMemo(
    () => ({
      labels: SERVERS.map((server) => server.company),
      datasets: [
        {
          label: "Peak demand %",
          data: SERVERS.map((server) => Math.max(...server.demandSeries)),
          backgroundColor: ["#2563eb", "#4f46e5", "#0891b2", "#ea580c"],
          borderRadius: 8,
        },
        {
          label: "Low demand %",
          data: SERVERS.map((server) => Math.min(...server.demandSeries)),
          backgroundColor: "rgba(148, 163, 184, 0.55)",
          borderRadius: 8,
        },
      ],
    }),
    [],
  );

  const demandBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#334155" } },
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

  const cpuUtil = Math.round((totalUsed / totalCapacity) * 100);
  const avgRam = Math.round(
    SERVERS.reduce((sum, server) => sum + server.ramUsage, 0) / SERVERS.length,
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5 xl:block">
          <div className="rounded-xl border border-blue-300/20 bg-blue-500/10 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Compute Exchange</p>
            <p className="mt-1 text-lg font-semibold text-white">Admin Console</p>
          </div>
          <nav className="mt-6 space-y-2 text-sm">
            {["Overview", "Cluster", "Demand", "Health", "Activity"].map((item, idx) => (
              <button
                key={item}
                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                  idx === 0
                    ? "bg-blue-500/20 text-blue-100"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Platform Operations
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Compute Exchange Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Platform healthy
                </span>
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Last 24 hours
                </span>
              </div>
            </div>
          </header>

          <main className="space-y-6 p-4 md:p-6 xl:p-8">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard label="Total compute available" value={`${totalCapacity} vCPU`} sub="Across 4 company servers" />
              <KpiCard label="Compute allocated/shared" value={`${totalShared} vCPU`} sub="Exported into shared pool" />
              <KpiCard label="Borrowed compute demand" value={`${totalBorrowed} vCPU`} sub="Imported from shared pool" />
              <KpiCard label="Avg throughput" value={`${avgSpeed.toFixed(1)} GHz`} sub="Processing speed per server" />
              <KpiCard label="Active companies" value={`${SERVERS.length}`} sub="Each company has 1 server unit" />
              <KpiCard label="Running vs down" value={`${runningCount} / ${downCount}`} sub={`${warningCount} server in warning state`} />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.9fr]">
              <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm sm:p-6">
                <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
                <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <h2 className="section-title">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                    Shared Compute Cluster (4 Servers)
                  </h2>
                  <span className="chip">Orchestrated pool</span>
                </div>
                <p className="relative mt-2 text-sm text-slate-600">
                  Each company contributes exactly one server node. Compute is dynamically shared by platform orchestration.
                </p>

                <div className="relative mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {SERVERS.map((server) => (
                    <ServerCard key={server.id} server={server} />
                  ))}
                </div>
              </article>

              <article className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Infrastructure Runtime Health</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Running servers: <span className="font-semibold">{runningCount}</span>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Warning state: <span className="font-semibold">{warningCount}</span>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      Down servers: <span className="font-semibold">{downCount}</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      Avg uptime: <span className="font-semibold text-slate-900">{avgUptime.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-rose-800">Active incident</p>
                  <p className="mt-2 text-sm text-rose-700">
                    Vertex Ops server is down. Borrowed demand is rerouted to Aster and Helix.
                  </p>
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Demand Trends (24h)</p>
                <p className="text-xs text-slate-500">Demand curves for each server/company.</p>
                <div className="mt-4 h-72 rounded-xl border border-slate-200 bg-white p-3">
                  <Line data={demandLineData} options={demandLineOptions} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Peak vs Low Demand by Server</p>
                <p className="text-xs text-slate-500">Comparison of demand extremes for all 4 servers.</p>
                <div className="mt-4 h-72 rounded-xl border border-slate-200 bg-white p-3">
                  <Bar data={demandBarData} options={demandBarOptions} />
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.15fr]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Compute Resource Statistics</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Total CPU utilization</span>
                      <span>{cpuUtil}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                        style={{ width: `${cpuUtil}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span>Average RAM usage</span>
                      <span>{avgRam}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${avgRam}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      Network throughput
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {networkThroughput.toFixed(1)} Gbps
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      Avg latency
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {avgLatency.toFixed(1)} ms
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-base font-semibold text-slate-900">Recent Activity Feed</p>
                <div className="mt-4 space-y-2">
                  {ACTIVITIES.map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                    >
                      <span
                        className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${
                          idx === 2
                            ? "bg-rose-500"
                            : idx === 1
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <p className="text-sm text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
